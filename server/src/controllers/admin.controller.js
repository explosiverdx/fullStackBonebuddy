import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Patient } from "../models/patient.models.js";
import { MedicalRecord } from "../models/medical_record.models.js";
import { ProgressReport } from "../models/progressreports.models.js";
import { Session } from "../models/sessions.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Physio } from "../models/physio.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import otpGenerator from "otp-generator";
import twilio from "twilio";
import fs from "fs";

const sendAdminOTP = asyncHandler(async (req, res) => {
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    // Extract 10 digits and normalize to +91 format
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (phoneDigits.length !== 10) {
        throw new ApiError(400, "Invalid phone number. Must be 10 digits.");
    }
    const normalizedPhone = `+91${phoneDigits}`;

    const defaultUsername = `admin_${phoneDigits}`;
    const defaultEmail = `${defaultUsername}@default.com`;

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Query for existing user in possible formats, regardless of userType
    console.log('Checking user for', normalizedPhone);
    let existingUser = await User.findOne({ mobile_number: { $in: [normalizedPhone, phoneDigits, `91${phoneDigits}`, phoneNumber] } });
    console.log('Existing user:', existingUser ? existingUser.userType : 'none');

    if (existingUser) {
        if (existingUser.userType === 'admin') {
            // Existing admin, update phone if needed
            if (existingUser.mobile_number !== normalizedPhone) {
                existingUser.mobile_number = normalizedPhone;
                await existingUser.save({ validateBeforeSave: false });
            }
        } else {
            // Phone already registered as non-admin
            throw new ApiError(409, "Phone number already registered as a non-admin user. Please use a different number for admin login.");
        }
    } else {
        // Phone not registered as admin
        throw new ApiError(403, "This phone number is not authorized to register as an admin.");
    }

    // Set OTP
    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;
    await existingUser.save({ validateBeforeSave: false });

    // For testing: Log OTP instead of sending via Twilio
    console.error(`OTP for admin ${normalizedPhone}: ${otp}`);
    console.log(`Admin OTP sent successfully for ${normalizedPhone}`);
    fs.appendFileSync('../otp.log', `OTP for admin ${normalizedPhone}: ${otp} at ${new Date().toISOString()}\n`);
    return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));

    /*
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    try {
        await client.messages.create({
            body: `Your OTP for admin login is: ${otp}`,
            to: phoneNumber,
            from: process.env.TWILIO_PHONE_NUMBER
        });
        return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP via Twilio:", error.message, error.stack);
        // Attempt to extract a more specific error message from Twilio
        const twilioErrorMessage = error.message || "Failed to send OTP. Please check Twilio configuration.";
        throw new ApiError(500, twilioErrorMessage);
    }
    */
});

const verifyAdminOTP = asyncHandler(async (req, res) => {
    let { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        throw new ApiError(400, "Phone number and OTP are required");
    }

    otp = otp.trim();

    console.log('Verifying OTP for phoneNumber:', phoneNumber, 'OTP:', otp);
    const admin = await User.findOne({ mobile_number: phoneNumber, userType: "admin" });

    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    console.log('Admin found:', admin._id, 'Stored OTP:', admin.otp, 'Entered OTP:', otp, 'Expires:', admin.otpExpires);
    if (admin.otp !== otp) {
        throw new ApiError(401, "Invalid OTP");
    }

    if (admin.otpExpires < Date.now()) {
        throw new ApiError(401, "OTP expired");
    }

    // Clear OTP fields after successful verification
    admin.otp = undefined;
    admin.otpExpires = undefined;
    await admin.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(admin._id);

    const loggedInAdmin = await User.findById(admin._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    };

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInAdmin,
                    accessToken,
                    refreshToken
                },
                "Admin logged in successfully"
            )
        );
});

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false, timestamps: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};


const getAllPatientsAdmin = asyncHandler(async (req, res) => {
    const { search, age, condition, status, doctor, progress, page = 1, limit = 10 } = req.query;

    const pipeline = [
        {
            $match: { userType: 'patient' }
        },
        {
            $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: 'userId',
                as: 'patient'
            }
        },
        {
            $unwind: {
                path: '$patient',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                isProfileComplete: { $ne: ['$patient', null] }
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'patient.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(age && { 'patient.age': parseInt(age) }),
                ...(condition && { 'patient.diagnosedWith': { $regex: condition, $options: 'i' } }),
                ...(status && { isProfileComplete: status === 'complete' ? true : (status === 'incomplete' ? false : { $exists: true }) })
            }
        },
        {
            $project: {
                _id: 1,
                name: { $ifNull: ['$patient.name', '$Fullname'] },
                age: '$patient.age',
                diagnosedWith: '$patient.diagnosedWith',
                address: '$patient.address',
                bloodGroup: '$patient.bloodGroup',
                gender: '$patient.gender',
                contactNumber: '$patient.contactNumber',
                emergencyContactNumber: '$patient.emergencyContactNumber',
                username: 1,
                email: 1,
                mobile_number: 1,
                lastLogin: 1,
                isProfileComplete: 1,
                createdAt: 1
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ];

    const patients = await User.aggregate(pipeline);

    const totalPipeline = [
        {
            $match: { userType: 'patient' }
        },
        {
            $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: 'userId',
                as: 'patient'
            }
        },
        {
            $unwind: {
                path: '$patient',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                isProfileComplete: { $ne: ['$patient', null] }
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'patient.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(age && { 'patient.age': parseInt(age) }),
                ...(condition && { 'patient.diagnosedWith': { $regex: condition, $options: 'i' } }),
                ...(status && { isProfileComplete: status === 'complete' ? true : (status === 'incomplete' ? false : { $exists: true }) })
            }
        },
        {
            $count: 'total'
        }
    ];

    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    return res.status(200).json(new ApiResponse(200, { patients, total, page: parseInt(page), limit: parseInt(limit) }, "Patients retrieved successfully."));
});

const createPatientAdmin = asyncHandler(async (req, res) => {
    const { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber, userId } = req.body;

    if ([name, diagnosedWith, address, age, gender, contactNumber, emergencyContactNumber].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    const patient = await Patient.create({
        userId,
        name,
        diagnosedWith,
        address,
        age,
        bloodGroup,
        gender,
        contactNumber,
        emergencyContactNumber
    });

    return res.status(201).json(new ApiResponse(201, patient, "Patient created successfully."));
});

const updatePatientAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const patient = await Patient.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    return res.status(200).json(new ApiResponse(200, patient, "Patient updated successfully."));
});

const deletePatientAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Patient deleted successfully."));
});

const getPatientDetailsAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const patient = await Patient.findById(id).populate('userId', 'username email mobile_number');

    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    const medicalRecords = await MedicalRecord.find({ patientId: id }).populate('doctorId', 'name specialization');

    const progressReports = await ProgressReport.find({ patientId: id }).populate('physioId', 'name').populate('doctorId', 'name');

    const sessions = await Session.find({ patientId: id }).populate('doctorId', 'name').populate('physioId', 'name');

    let recoveryPercent = 0;
    if (sessions.length > 0) {
        const totalCompleted = sessions.reduce((sum, s) => sum + s.completedSessions, 0);
        const totalSessions = sessions.reduce((sum, s) => sum + s.totalSessions, 0);
        recoveryPercent = totalSessions > 0 ? (totalCompleted / totalSessions) * 100 : 0;
    }

    return res.status(200).json(new ApiResponse(200, {
        patient,
        medicalHistory: medicalRecords,
        progressReports,
        sessions,
        recoveryPercent
    }, "Patient details retrieved successfully."));
});

const getPatientsStats = asyncHandler(async (req, res) => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const statsPipeline = [
        {
            $match: { userType: 'patient' }
        },
        {
            $lookup: {
                from: 'patients',
                localField: '_id',
                foreignField: 'userId',
                as: 'patient'
            }
        },
        {
            $unwind: {
                path: '$patient',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                incomplete: { $sum: { $cond: [{ $eq: ['$patient', null] }, 1, 0] } },
                active: { $sum: { $cond: [{ $gte: ['$lastLogin', thirtyDaysAgo] }, 1, 0] } }
            }
        },
        {
            $project: {
                _id: 0,
                total: 1,
                incomplete: 1,
                active: 1,
                inactive: { $subtract: ['$total', '$active'] }
            }
        }
    ];

    const statsResult = await User.aggregate(statsPipeline);
    const stats = statsResult[0] || { total: 0, incomplete: 0, active: 0, inactive: 0 };

    return res.status(200).json(new ApiResponse(200, stats, "Patient stats retrieved successfully."));
});

const exportPatientsAdmin = asyncHandler(async (req, res) => {
    const patients = await Patient.find().populate('userId', 'username email mobile_number');
    return res.status(200).json(new ApiResponse(200, patients, "Patients data for export."));
});

const getUsersWithoutPatients = asyncHandler(async (req, res) => {
    const users = await User.find({ userType: 'patient' }).select('_id Fullname username email mobile_number');

    const usersWithPatients = await Patient.find().distinct('userId');

    const availableUsers = users.filter(user => !usersWithPatients.includes(user._id));

    return res.status(200).json(new ApiResponse(200, availableUsers, "Available users retrieved successfully."));
});

export { sendAdminOTP, verifyAdminOTP, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, exportPatientsAdmin, getUsersWithoutPatients };
