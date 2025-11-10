import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Patient } from "../models/patient.models.js";
import { MedicalRecord } from "../models/medical_record.models.js";
import { ProgressReport } from "../models/progressreports.models.js";
import { Session } from "../models/sessions.models.js";
import mongoose from 'mongoose';
import { Doctor } from "../models/doctor.models.js";
import { Physio } from "../models/physio.models.js";
import { Hospital } from "../models/hospital.models.js";
import { Payment } from "../models/payments.models.js";
import { Notification } from "../models/notification.models.js";
import { Contact } from "../models/contact.model.js";
import { Appointment } from "../models/appointments.models.js";
import { Report } from "../models/report.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import otpGenerator from "otp-generator";
import { generateAccessAndRefreshTokens } from "../utils/auth.utils.js";
import twilio from "twilio";

// IMPORTANT: For security, only allow pre-approved numbers to register as admins.
// Add any authorized admin phone numbers here in the '+91xxxxxxxxxx' format.
const AUTHORIZED_ADMIN_NUMBERS = [
    '+919876543210', // Default from seeder
    '+918795736312', // Your admin number
    '+916387045470', // Admin number 6387045470
    '+919648832796', // Admin number 9648832796
    '9648832796', // Admin number 9648832796 (without +91)
    '+918881119890', // Office number
];

const sendAdminOTP = asyncHandler(async (req, res) => {
    console.log('sendAdminOTP called with body:', req.body);
    let { phoneNumber } = req.body;

    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    // Extract 10 digits
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    if (phoneDigits.length !== 10) {
        throw new ApiError(400, "Invalid phone number. Must be 10 digits.");
    }
    const normalizedPhone = `+91${phoneDigits}`;

    // Security Check: Only allow authorized numbers
    if (!AUTHORIZED_ADMIN_NUMBERS.includes(normalizedPhone) && !AUTHORIZED_ADMIN_NUMBERS.includes(phoneDigits)) {
        throw new ApiError(403, "This phone number is not authorized to register as an admin.");
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    // Query for existing user using phoneDigits (stored without +91)
    console.log('Checking user for', phoneDigits, 'or', normalizedPhone);
    let user = await User.findOne({ mobile_number: { $in: [phoneDigits, normalizedPhone] } });
    console.log('Existing user:', user ? user.userType : 'none');

    if (user) {
        if (user.userType !== 'admin') {
            // This number is authorized, so upgrade the existing user to an admin.
            console.log(`Upgrading user ${user._id} to admin.`);
            user.userType = 'admin';
            // Normalize to consistent format (store without +91 prefix for consistency)
            user.mobile_number = phoneDigits;
            await user.save({ validateBeforeSave: false });
        }
    } else { // No user exists, create a new admin user since the number is authorized.
        console.log(`No admin found for ${phoneDigits}. Creating a new admin user.`);
        user = await User.create({
            mobile_number: phoneDigits, // Store without +91 prefix for consistency
            userType: 'admin',
            username: `admin_${phoneDigits}`,
            email: `admin_${phoneDigits}@default.com`,
            Fullname: `Admin ${phoneDigits}`,
            address: 'Unknown',
            age: 0,
            dateOfBirth: new Date('2000-01-01'),
            gender: 'Other'
        });
    }

    // Set OTP
    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    // Send OTP via SMS API
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, "SMS service not configured");
    }
    const smsUrl = `https://sms.renflair.in/V1.php?API=${apiKey}&PHONE=${phoneDigits}&OTP=${otp}`;

    try {
        const response = await fetch(smsUrl);
        const data = await response.text(); // Since PHP echoes the response
        console.log('SMS API response:', data);
        console.log(`Admin OTP sent successfully for ${normalizedPhone}`);
        return res.status(200).json(new ApiResponse(200, {}, "OTP sent successfully"));
    } catch (error) {
        console.error("Error sending OTP via SMS API:", error.message);
        throw new ApiError(500, "Failed to send OTP. Please try again later.");
    }

});

const verifyAdminOTP = asyncHandler(async (req, res) => {
    let { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
        throw new ApiError(400, "Phone number and OTP are required");
    }

    otp = otp.trim();

    // Extract phone digits (last 10 digits)
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const normalizedPhone = `+91${phoneDigits}`;

    // Search for admin by phone number - handle both formats (with or without +91 prefix)
    const admin = await User.findOne({ 
        $or: [
            { mobile_number: phoneDigits },
            { mobile_number: normalizedPhone }
        ],
        userType: 'admin' 
    });

    if (!admin) { throw new ApiError(404, "Admin not found. Please ensure you have sent the OTP first."); }
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
        sameSite: 'none',
        secure: true
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

const getAllPatientsAdmin = asyncHandler(async (req, res) => {
    const { search, mobile, status, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

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
            $match: {
                patient: { $ne: null }
            }
        },
        {
            $addFields: {
                isProfileComplete: true,
                status: { $cond: { if: { $gte: ['$lastLogin', thirtyDaysAgo] }, then: 'active', else: 'inactive' } }
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
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } }),
                ...(status && status !== 'all' && { status })
            }
        },
        {
            $project: {
                _id: 1,
                patientId: { $ifNull: [ { $toString: '$patient._id' }, 'N/A' ] },
                userId: '$patient.userId',
                name: { $ifNull: ['$patient.name', '$Fullname'] },
                gender: '$patient.gender',
                dateOfBirth: {
                    $cond: {
                        if: { $ne: ["$patient.dateOfBirth", null] },
                        then: { $dateToString: { format: "%Y-%m-%d", date: "$patient.dateOfBirth" } },
                        else: null
                    }
                },
                age: { $ifNull: ['$patient.age', '$age'] },
                mobileNumber: { $ifNull: ['$patient.mobileNumber', '$mobile_number'] },
                email: { $ifNull: ['$patient.email', '$email'] },
                address: '$patient.address',
                surgeryType: '$patient.surgeryType',
                surgeryDate: {
                    $cond: {
                        if: { $ne: ["$patient.surgeryDate", null] },
                        then: { $dateToString: { format: "%Y-%m-%d", date: "$patient.surgeryDate" } },
                        else: null
                    }
                },
                hospitalClinic: '$patient.hospitalClinic',
                assignedPhysiotherapist: '$patient.assignedPhysiotherapist',
                currentCondition: '$patient.currentCondition',
                medicalHistory: '$patient.medicalHistory',
                allergies: '$patient.allergies',
                bloodGroup: '$patient.bloodGroup',
                emergencyContactNumber: '$patient.emergencyContactNumber',
                medicalInsurance: '$patient.medicalInsurance',
                medicalReport: '$patient.medicalReport',
                mobile_number: 1,
                lastLogin: 1,
                isProfileComplete: 1,
                status: 1,
                createdAt: 1
            }
        },
        {
            $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
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
            $match: {
                patient: { $ne: null }
            }
        },
        {
            $addFields: {
                isProfileComplete: true,
                status: { $cond: { if: { $gte: ['$lastLogin', thirtyDaysAgo] }, then: 'active', else: 'inactive' } }
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
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } }),
                ...(status && status !== 'all' && { status })
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
    const { name, email, dateOfBirth, gender, mobileNumber, surgeryType, surgeryDate, assignedDoctor, hospitalClinic, emergencyContactNumber, userId, age, address, currentCondition, assignedPhysiotherapist, medicalHistory, allergies, bloodGroup, medicalInsurance } = req.body;

    if ([name, dateOfBirth, age, gender, mobileNumber, emergencyContactNumber, surgeryType, surgeryDate, currentCondition].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    const patientData = {
        userId,
        name,
        email,
        dateOfBirth: new Date(dateOfBirth),
        gender,
        mobileNumber,
        surgeryType,
        surgeryDate: new Date(surgeryDate),
        assignedDoctor,
        hospitalClinic,
        emergencyContactNumber,
        age,
        address,
        currentCondition,
        assignedPhysiotherapist,
        medicalHistory,
        allergies,
        bloodGroup,
        medicalInsurance
    };

    if (req.file) {
        patientData.medicalReport = `/uploads/${req.file.filename}`;
    }

    const patient = await Patient.create(patientData);

    return res.status(201).json(new ApiResponse(201, patient, "Patient created successfully."));
});

const updatePatientAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`updatePatientAdmin called for patient ID: ${id} with data:`, updateData);

    // Handle file upload for medicalReport
    if (req.file) {
        updateData.medicalReport = `/uploads/${req.file.filename}`;
    }

    // Validate required fields before update
    const requiredFields = ['name', 'dateOfBirth', 'age', 'gender', 'mobileNumber', 'surgeryType', 'surgeryDate', 'currentCondition', 'emergencyContactNumber'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    const patient = await Patient.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!patient) {
        console.log(`Patient not found for ID: ${id}`);
        throw new ApiError(404, "Patient not found");
    }

    console.log(`Patient updated successfully for ID: ${id}`);

    // Format dates to yyyy-MM-dd for frontend compatibility
    const formattedPatient = {
        ...patient.toObject(),
        dateOfBirth: patient.dateOfBirth ? patient.dateOfBirth.toISOString().split('T')[0] : null,
        surgeryDate: patient.surgeryDate ? patient.surgeryDate.toISOString().split('T')[0] : null,
    };

    return res.status(200).json(new ApiResponse(200, formattedPatient, "Patient updated successfully."));
});

const deletePatientAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        throw new ApiError(400, "Patient ID is required");
    }

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    return res.status(200).json(new ApiResponse(200, {}, "Patient deleted successfully."));
});

const getPatientDetailsAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null' || id === 'N/A') {
        throw new ApiError(400, "Invalid patient ID");
    }

    const patient = await Patient.findById(id).populate('userId', 'email');

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
    const { startDate, endDate } = req.query;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Default to all time if no dates provided
    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date();

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
            // Only count patients who have a patient profile (matching the list query)
            $match: {
                patient: { $ne: null }
            }
        },
        {
            $group: {
                _id: null,
                total: { $sum: 1 },
                incomplete: { $sum: 0 }, // Always 0 now since we filter out null profiles
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

    // Get daily registrations for all user types
    const dailyPipeline = [
        {
            $match: {
                createdAt: { $gte: start, $lte: end },
                userType: { $in: ['patient', 'doctor', 'physio', 'physiotherapist'] }
            }
        },
        {
            $group: {
                _id: {
                    date: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    userType: "$userType"
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { "_id.date": 1 }
        }
    ];

    const dailyData = await User.aggregate(dailyPipeline);

    // Process daily data into the required format
    const dailyMap = {};
    dailyData.forEach(item => {
        const date = item._id.date;
        if (!dailyMap[date]) {
            dailyMap[date] = { date, users: { patient: 0, doctor: 0, physio: 0 } };
        }
        dailyMap[date].users[item._id.userType] = item.count;
    });

    const daily = Object.values(dailyMap);

    return res.status(200).json(new ApiResponse(200, { ...stats, daily }, "Patient stats retrieved successfully."));
});

const exportPatientsAdmin = asyncHandler(async (req, res) => {
    const patients = await Patient.find().populate('userId', 'username email mobile_number');
    return res.status(200).json(new ApiResponse(200, patients, "Patients data for export."));
});

const exportAllUsersAdmin = asyncHandler(async (req, res) => {
    const users = await User.find({}).lean();
    return res.status(200).json(new ApiResponse(200, users, "All users data for export."));
});

const getUsersWithoutPatients = asyncHandler(async (req, res) => {
    const users = await User.find({ userType: 'patient' }).select('_id Fullname username email mobile_number');

    const usersWithPatients = await Patient.find().distinct('userId');

    const availableUsers = users.filter(user => !usersWithPatients.includes(user._id));

    return res.status(200).json(new ApiResponse(200, availableUsers, "Available users retrieved successfully."));
});

const universalSearch = asyncHandler(async (req, res) => {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, [], "Search query too short"));
    }

    const searchTerm = query.trim();
    const results = [];

    // Search Patients
    const patientPipeline = [
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
            $match: {
                $or: [
                    { 'patient.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${searchTerm}$`, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                patientId: { $ifNull: ['$patient._id', null] },
                type: 'patient',
                name: { $ifNull: ['$patient.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                shortId: { $substr: ['$_id', 18, 6] },
                createdAt: 1
            }
        },
        { $limit: parseInt(limit) }
    ];

    const patients = await User.aggregate(patientPipeline);
    results.push(...patients.map(p => ({ ...p, type: 'patient' })));

    // Search Doctors
    const doctorPipeline = [
        {
            $match: { userType: 'doctor' }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: 'userId',
                as: 'doctor'
            }
        },
        {
            $unwind: {
                path: '$doctor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { 'doctor.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${searchTerm}$`, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: { $ifNull: ['$doctor._id', '$_id'] },  // Use doctor._id if available
                userId: '$_id',  // Keep original user._id as userId
                type: 'doctor',
                name: { $ifNull: ['$doctor.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                specialization: '$doctor.specialization',
                qualification: '$doctor.qualification',
                experience: '$doctor.experience',
                hospitalAffiliation: '$doctor.hospitalAffiliation',
                shortId: { $substr: ['$_id', 18, 6] },
                createdAt: 1
            }
        },
        { $limit: parseInt(limit) }
    ];

    const doctors = await User.aggregate(doctorPipeline);
    results.push(...doctors.map(d => ({ ...d, type: 'doctor' })));

    // Search Physiotherapists
    const physioPipeline = [
        {
            $match: { userType: { $in: ['physio', 'physiotherapist'] } }
        },
        {
            $lookup: {
                from: 'physios',
                localField: '_id',
                foreignField: 'userId',
                as: 'physio'
            }
        },
        {
            $unwind: {
                path: '$physio',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { 'physio.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${searchTerm}$`, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: { $ifNull: ['$physio._id', '$_id'] },  // Use physio._id if available
                userId: '$_id',  // Keep original user._id as userId
                type: 'physio',
                name: { $ifNull: ['$physio.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                specialization: '$physio.specialization',
                qualification: '$physio.qualification',
                experience: '$physio.experience',
                availableDays: '$physio.availableDays',
                availableTimeSlots: '$physio.availableTimeSlots',
                consultationFee: '$physio.consultationFee',
                bio: '$physio.bio',
                assignedDoctor: '$physio.assignedDoctor',
                patientsAssigned: '$physio.patientsAssigned',
                shortId: { $substr: ['$_id', 18, 6] },
                createdAt: 1
            }
        },
        { $limit: parseInt(limit) }
    ];

    const physios = await User.aggregate(physioPipeline);
    results.push(...physios.map(p => ({ ...p, type: 'physio' })));

    // Search Hospitals
    const hospitalPipeline = [
        {
            $match: {
                $or: [
                    { name: { $regex: searchTerm, $options: 'i' } },
                    { address: { $regex: searchTerm, $options: 'i' } },
                    { city: { $regex: searchTerm, $options: 'i' } },
                    { pincode: { $regex: searchTerm, $options: 'i' } },
                    { specialized: { $elemMatch: { $regex: searchTerm, $options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: `${searchTerm}$`, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                type: 'hospital',
                name: 1,
                address: 1,
                city: 1,
                pincode: 1,
                specialized: 1,
                shortId: { $substr: ['$_id', 18, 6] },
                createdAt: 1
            }
        },
        { $limit: parseInt(limit) }
    ];

    const hospitals = await Hospital.aggregate(hospitalPipeline);
    results.push(...hospitals.map(h => ({ ...h, type: 'hospital' })));

    // Sort by creation date (recently registered on top)
    results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json(new ApiResponse(200, results.slice(0, limit), "Universal search completed successfully."));
});

const allocateSession = asyncHandler(async (req, res) => {
    const { patientId, doctorId, physioId, surgeryType, totalSessions, sessionDate, sessions } = req.body;

    // Temporary debug logging for admin allocation
    try {
        const fs = await import('fs');
        const path = await import('path');
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = path.join(logDir, 'session_alloc.log');
        const entry = `${new Date().toISOString()} - ADMIN_ALLOC_REQUEST - user:${req.user?._id || 'anon'} body:${JSON.stringify(req.body)}\n`;
        fs.appendFileSync(logFile, entry);
    } catch (e) {
        console.error('Failed to write admin allocation log', e && e.message ? e.message : e);
    }

    // Basic required fields (except date(s) which can come via `sessions` array)
    if (!patientId || !doctorId || !physioId || !surgeryType || !totalSessions) {
        throw new ApiError(400, "Missing required fields: patientId, doctorId, physioId, surgeryType, totalSessions");
    }

    // Validate patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // Validate doctor exists. Accept either doctor._id or user._id (userId)
    let doctor = null;
    if (doctorId) {
        // Try as doctor document _id first
        if (mongoose.isValidObjectId(doctorId)) {
            doctor = await Doctor.findById(doctorId);
        }
        // If not found, try matching by userId (in case frontend sent the User _id)
        if (!doctor) {
            doctor = await Doctor.findOne({ userId: doctorId });
        }
    }
    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    // Validate physio exists. Accept physio._id or user._id
    let physio = null;
    if (physioId) {
        if (mongoose.isValidObjectId(physioId)) {
            physio = await Physio.findById(physioId);
        }
        if (!physio) {
            physio = await Physio.findOne({ userId: physioId });
        }
    }
    if (!physio) {
        throw new ApiError(404, "Physiotherapist not found");
    }

    // Build array of session documents to create. Support two payload shapes:
    // 1) Old shape: single `sessionDate` (string) + other fields -> create one session
    // 2) New shape: `sessions` is an array of objects containing appointmentDate (or sessionDate) and optional overrides for doctorId/physioId/surgeryType
    const toCreate = [];

    if (Array.isArray(sessions) && sessions.length > 0) {
        for (const s of sessions) {
            const appointment = s.appointmentDate || s.sessionDate || s.date;
            if (!appointment) {
                throw new ApiError(400, "Each session object must include an appointmentDate (or sessionDate)");
            }

            // allow per-session overrides, fallback to provided top-level ids
            const docId = s.doctorId || doctorId;
            const physId = s.physioId || physioId;
            const surgType = s.surgeryType || surgeryType;

            toCreate.push({
                patientId,
                doctorId: docId,
                physioId: physId,
                surgeryType: surgType,
                totalSessions: parseInt(totalSessions),
                amountPaid: s.amountPaid != null ? Number(s.amountPaid) : 0,
                durationMinutes: s.durationMinutes != null ? Number(s.durationMinutes) : (req.body.durationMinutes != null ? Number(req.body.durationMinutes) : 60),
                completedSessions: 0,
                sessionDate: new Date(appointment)
            });
        }
    } else if (sessionDate) {
        // backward compatible single session
        toCreate.push({
            patientId,
            doctorId,
            physioId,
            surgeryType,
            totalSessions: parseInt(totalSessions),
            amountPaid: 0,
            durationMinutes: req.body.durationMinutes != null ? Number(req.body.durationMinutes) : 60,
            completedSessions: 0,
            sessionDate: new Date(sessionDate)
        });
    } else {
        throw new ApiError(400, "Either sessionDate (single) or sessions (array) must be provided");
    }

    // Validate per-session overrides (doctor/physio) first (outside transaction). This allows
    // a safe fallback to non-transactional insert when running against standalone MongoDB.
    for (const item of toCreate) {
        if (item.doctorId && String(item.doctorId) !== String(doctorId)) {
            const d = await Doctor.findById(item.doctorId);
            if (!d) throw new ApiError(404, `Doctor not found: ${item.doctorId}`);
        }
        if (item.physioId && String(item.physioId) !== String(physioId)) {
            const p = await Physio.findById(item.physioId);
            if (!p) throw new ApiError(404, `Physiotherapist not found: ${item.physioId}`);
        }
    }

    // Try to create sessions inside a transaction. If the server is a standalone MongoDB
    // (no replica set), transactions will fail; in that case fall back to a non-transactional insertMany.
    let createdSessions = null;
    let mongoSession = null;
    try {
        mongoSession = await mongoose.startSession();
        try {
            await mongoSession.withTransaction(async () => {
                createdSessions = await Session.insertMany(toCreate, { session: mongoSession });
            });
        } catch (txErr) {
            // If transactions are not supported (common in local single-node setups),
            // fall back to inserting without a transaction.
            if (txErr && txErr.code === 20 || (txErr && /Transaction numbers are only allowed/.test(txErr.message || ''))) {
                // fallback
                createdSessions = await Session.insertMany(toCreate);
            } else {
                throw txErr;
            }
        }
    } finally {
        if (mongoSession) mongoSession.endSession();
    }

    return res.status(201).json(new ApiResponse(201, createdSessions, "Session(s) allocated successfully."));
});

const quickSearch = asyncHandler(async (req, res) => {
    const { query, limit = 10 } = req.query;

    if (!query || query.trim().length < 2) {
        return res.status(200).json(new ApiResponse(200, { patients: [], doctors: [], physios: [], sessions: [], payments: [] }, "Search query too short"));
    }

    const searchTerm = query.trim();
    const results = { patients: [], doctors: [], physios: [], sessions: [], payments: [] };

    // Search Patients
    const patientPipeline = [
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
            $match: {
                $or: [
                    { 'patient.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchTerm, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$patient._id' }, regex: searchTerm, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                patientId: { $ifNull: ['$patient._id', null] },
                name: { $ifNull: ['$patient.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                shortId: { $substr: [{ $toString: '$_id' }, 18, 6] }
            }
        },
        { $limit: parseInt(limit) }
    ];

    const patients = await User.aggregate(patientPipeline);
    results.patients = patients;

    // Search Doctors
    const doctorPipeline = [
        {
            $match: { userType: 'doctor' }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: 'userId',
                as: 'doctor'
            }
        },
        {
            $unwind: {
                path: '$doctor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { 'doctor.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchTerm, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$doctor._id' }, regex: searchTerm, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: { $ifNull: ['$doctor._id', '$_id'] }, // If doctor profile exists use its _id, else fallback to user _id
                userId: '$_id', // original User _id for reference
                name: { $ifNull: ['$doctor.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                shortId: { $substr: [{ $toString: '$_id' }, 18, 6] }
            }
        },
        { $limit: parseInt(limit) }
    ];

    const doctors = await User.aggregate(doctorPipeline);
    results.doctors = doctors;

    // Search Physiotherapists
    const physioPipeline = [
        {
            $match: { userType: { $in: ['physio', 'physiotherapist'] } }
        },
        {
            $lookup: {
                from: 'physios',
                localField: '_id',
                foreignField: 'userId',
                as: 'physio'
            }
        },
        {
            $unwind: {
                path: '$physio',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                $or: [
                    { 'physio.name': { $regex: searchTerm, $options: 'i' } },
                    { Fullname: { $regex: searchTerm, $options: 'i' } },
                    { username: { $regex: searchTerm, $options: 'i' } },
                    { email: { $regex: searchTerm, $options: 'i' } },
                    { mobile_number: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchTerm, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$physio._id' }, regex: searchTerm, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: { $ifNull: ['$physio._id', '$_id'] }, // If physio profile exists use its _id, else fallback to user _id
                userId: '$_id',
                name: { $ifNull: ['$physio.name', '$Fullname'] },
                contact: '$mobile_number',
                email: 1,
                shortId: { $substr: [{ $toString: '$_id' }, 18, 6] }
            }
        },
        { $limit: parseInt(limit) }
    ];

    const physios = await User.aggregate(physioPipeline);
    results.physios = physios;

    // Search Sessions
    const sessionPipeline = [
        {
            $match: {
                $or: [
                    { surgeryType: { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchTerm, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                name: { $ifNull: ['$surgeryType', 'Unknown Surgery'] },
                contact: 'N/A',
                shortId: { $substr: ['$_id', 18, 6] }
            }
        },
        { $limit: parseInt(limit) }
    ];

    const sessions = await Session.aggregate(sessionPipeline);
    results.sessions = sessions;

    // Search Payments
    const paymentPipeline = [
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
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
            $match: {
                $or: [
                    { 'patient.name': { $regex: searchTerm, $options: 'i' } },
                    { 'patient.contactNumber': { $regex: searchTerm, $options: 'i' } },
                    { $expr: { $regexMatch: { input: { $toString: '$_id' }, regex: searchTerm, options: 'i' } } },
                    { $expr: { $regexMatch: { input: { $toString: '$patient._id' }, regex: searchTerm, options: 'i' } } }
                ]
            }
        },
        {
            $project: {
                _id: 1,
                name: { $ifNull: ['$patient.name', 'Unknown Patient'] },
                contact: { $ifNull: ['$patient.contactNumber', 'N/A'] },
                shortId: { $substr: [{ $toString: '$_id' }, 18, 6] }
            }
        },
        { $limit: parseInt(limit) }
    ];

    const payments = await Payment.aggregate(paymentPipeline);
    results.payments = payments;

    return res.status(200).json(new ApiResponse(200, results, "Quick search completed successfully."));
});

const loginAdmin = asyncHandler(async (req, res) => {
    const { email, username, password, mobile_number } = req.body;

    if (!password) {
        throw new ApiError(400, "Password is required");
    }
    if (!username && !email && !mobile_number) {
        throw new ApiError(400, "Username, email, or mobile number is required");
    }

    const findQuery = [];
    if (username) findQuery.push({ username });
    if (email) findQuery.push({ email });
    if (mobile_number) findQuery.push({ mobile_number });

    const user = await User.findOne({
        $or: findQuery
    });

    if (!user) {
        throw new ApiError(404, "Admin does not exist");
    }

    if (user.userType !== 'admin') {
        throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid admin credentials");
    }

    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    const loggedInAdmin = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        sameSite: 'none',
        secure: true
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

const setAdminPassword = asyncHandler(async (req, res) => {
    const { password } = req.body;
    const userId = req.user?._id;

    if (!password || password.length < 6) {
        throw new ApiError(400, "Password is required and must be at least 6 characters long.");
    }

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "Admin not found");
    }

    if (user.userType !== 'admin') {
        throw new ApiError(403, "Access denied. Admin privileges required.");
    }

    user.password = password;
    await user.save({ validateBeforeSave: true }); // Use validation to trigger pre-save hook

    return res.status(200).json(new ApiResponse(200, {}, "Admin password set successfully."));
});

const forgotAdminPassword = asyncHandler(async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        throw new ApiError(400, "Phone number is required");
    }

    const user = await User.findOne({ mobile_number: phoneNumber, userType: 'admin' });
    if (!user) {
        throw new ApiError(404, "Admin with this phone number does not exist.");
    }

    const otp = otpGenerator.generate(6, { upperCaseAlphabets: false, specialChars: false, lowerCaseAlphabets: false });
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    user.otp = otp;
    user.otpExpires = otpExpires;
    await user.save({ validateBeforeSave: false });

    // Send OTP via SMS API
    const phoneDigits = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    const apiKey = process.env.SMS_API_KEY;
    if (!apiKey) {
        throw new ApiError(500, "SMS service not configured");
    }
    const smsUrl = `https://sms.renflair.in/V1.php?API=${apiKey}&PHONE=${phoneDigits}&OTP=${otp}`;

    try {
        await fetch(smsUrl);
        return res.status(200).json(new ApiResponse(200, {}, "Password reset OTP sent successfully."));
    } catch (error) {
        console.error("Error sending password reset OTP via SMS API:", error.message);
        throw new ApiError(500, "Failed to send password reset OTP.");
    }
});

const resetAdminPassword = asyncHandler(async (req, res) => {
    const { phoneNumber, otp, newPassword } = req.body;

    if (!phoneNumber || !otp || !newPassword) {
        throw new ApiError(400, "Phone number, OTP, and new password are required.");
    }

    const user = await User.findOne({ mobile_number: phoneNumber, userType: 'admin' });
    if (!user) {
        throw new ApiError(404, "Admin not found.");
    }

    if (user.otp !== otp.trim() || user.otpExpires < Date.now()) {
        throw new ApiError(401, "Invalid or expired OTP.");
    }

    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(new ApiResponse(200, {}, "Admin password has been reset successfully."));
});

const getContactSubmissions = asyncHandler(async (req, res) => {
    const submissions = await Contact.find().sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, submissions, "Contact submissions retrieved successfully."));
});

const createContactSubmission = asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phoneNumber, message } = req.body;

    if ([firstName, lastName, email, phoneNumber, message].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All fields are required.");
    }

    const contact = await Contact.create({ firstName, lastName, email, phoneNumber, message });

    return res.status(201).json(new ApiResponse(201, contact, "Contact submission received."));
});

const getAllDoctorsAdmin = asyncHandler(async (req, res) => {
    const { search, mobile, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pipeline = [
        {
            $match: { userType: 'doctor' }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: 'userId',
                as: 'doctor'
            }
        },
        {
            $unwind: {
                path: '$doctor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                isProfileComplete: { $ne: ['$doctor', null] }
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'doctor.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } },
                        { 'doctor.specialization': { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } })
            }
        },
        {
            $project: {
                _id: 1,
                doctorId: { $ifNull: [ { $toString: '$doctor._id' }, 'N/A' ] },
                userId: '$doctor.userId',
                name: { $ifNull: ['$doctor.name', '$Fullname'] },
                specialization: '$doctor.specialization',
                qualification: '$doctor.qualification',
                experience: '$doctor.experience',
                hospitalAffiliation: '$doctor.hospitalAffiliation',
                contact: '$mobile_number',
                username: 1,
                email: 1,
                mobile_number: 1,
                lastLogin: 1,
                isProfileComplete: 1,
                createdAt: 1
            }
        },
        {
            $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ];

    const doctors = await User.aggregate(pipeline);

    const totalPipeline = [
        {
            $match: { userType: 'doctor' }
        },
        {
            $lookup: {
                from: 'doctors',
                localField: '_id',
                foreignField: 'userId',
                as: 'doctor'
            }
        },
        {
            $unwind: {
                path: '$doctor',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'doctor.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } },
                        { 'doctor.specialization': { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } })
            }
        },
        {
            $count: 'total'
        }
    ];

    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    return res.status(200).json(new ApiResponse(200, { doctors, total, page: parseInt(page), limit: parseInt(limit) }, "Doctors retrieved successfully."));
});

const createDoctorAdmin = asyncHandler(async (req, res) => {
    const { name, specialization, qualification, experience, hospitalAffiliation, userId } = req.body;

    if ([name, specialization, qualification, experience, hospitalAffiliation].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    const doctor = await Doctor.create({
        userId,
        name,
        specialization,
        qualification,
        experience,
        hospitalAffiliation
    });

    return res.status(201).json(new ApiResponse(201, doctor, "Doctor created successfully."));
});

const updateDoctorAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const doctor = await Doctor.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    return res.status(200).json(new ApiResponse(200, doctor, "Doctor updated successfully."));
});

const deleteDoctorAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        throw new ApiError(400, "Doctor ID is required");
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    // Delete all sessions where this doctor was assigned
    const sessionsResult = await Session.deleteMany({ doctorId: id });
    
    // Delete all progress reports by this doctor
    const reportsResult = await ProgressReport.deleteMany({ doctorId: id });

    // Delete the doctor profile
    await Doctor.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                deletedDoctor: doctor.name,
                deletedSessions: sessionsResult.deletedCount || 0,
                deletedReports: reportsResult.deletedCount || 0
            }, 
            "Doctor and associated data deleted successfully."
        )
    );
});

const getDoctorDetailsAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null' || id === 'N/A') {
        throw new ApiError(400, "Invalid doctor ID");
    }

    const doctor = await Doctor.findById(id);

    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    const medicalRecords = await MedicalRecord.find({ doctorId: id }).populate('patientId', 'name');

    const progressReports = await ProgressReport.find({ doctorId: id }).populate('patientId', 'name').populate('physioId', 'name');

    const sessions = await Session.find({ doctorId: id }).populate('patientId', 'name').populate('physioId', 'name');

    return res.status(200).json(new ApiResponse(200, {
        doctor,
        medicalHistory: medicalRecords,
        progressReports,
        sessions
    }, "Doctor details retrieved successfully."));
});

const getAllPhysiosAdmin = asyncHandler(async (req, res) => {
    const { search, mobile, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const pipeline = [
        {
            $match: { userType: { $in: ['physio', 'physiotherapist'] } }
        },
        {
            $lookup: {
                from: 'physios',
                localField: '_id',
                foreignField: 'userId',
                as: 'physio'
            }
        },
        {
            $unwind: {
                path: '$physio',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                isProfileComplete: { $ne: ['$physio', null] }
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'physio.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } },
                        { 'physio.specialization': { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } })
            }
        },
        {
            $project: {
                _id: 1,
                physioId: { $ifNull: [ { $toString: '$physio._id' }, 'N/A' ] },
                userId: '$physio.userId',
                name: { $ifNull: ['$physio.name', '$Fullname'] },
                specialization: '$physio.specialization',
                qualification: '$physio.qualification',
                experience: '$physio.experience',
                availableDays: '$physio.availableDays',
                availableTimeSlots: '$physio.availableTimeSlots',
                consultationFee: '$physio.consultationFee',
                bio: '$physio.bio',
                assignedDoctor: '$physio.assignedDoctor',
                patientsAssigned: '$physio.patientsAssigned',
                contact: '$mobile_number',
                username: 1,
                email: 1,
                mobile_number: 1,
                lastLogin: 1,
                isProfileComplete: 1,
                createdAt: 1
            }
        },
        {
            $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 }
        },
        {
            $skip: (parseInt(page) - 1) * parseInt(limit)
        },
        {
            $limit: parseInt(limit)
        }
    ];

    const physios = await User.aggregate(pipeline);

    const totalPipeline = [
        {
            $match: { userType: { $in: ['physio', 'physiotherapist'] } }
        },
        {
            $lookup: {
                from: 'physios',
                localField: '_id',
                foreignField: 'userId',
                as: 'physio'
            }
        },
        {
            $unwind: {
                path: '$physio',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $match: {
                ...(search && {
                    $or: [
                        { 'physio.name': { $regex: search, $options: 'i' } },
                        { Fullname: { $regex: search, $options: 'i' } },
                        { username: { $regex: search, $options: 'i' } },
                        { 'physio.specialization': { $regex: search, $options: 'i' } }
                    ]
                }),
                ...(mobile && { mobile_number: { $regex: mobile, $options: 'i' } })
            }
        },
        {
            $count: 'total'
        }
    ];

    const totalResult = await User.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    return res.status(200).json(new ApiResponse(200, { physios, total, page: parseInt(page), limit: parseInt(limit) }, "Physiotherapists retrieved successfully."));
});

const createPhysioAdmin = asyncHandler(async (req, res) => {
    const { name, specialization, qualification, experience, availableDays, availableTimeSlots, consultationFee, bio, assignedDoctor, patientsAssigned, userId } = req.body;

    if ([name, specialization, qualification, experience, availableDays, availableTimeSlots, consultationFee, bio].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    const physio = await Physio.create({
        userId,
        name,
        specialization,
        qualification,
        experience,
        availableDays,
        availableTimeSlots,
        consultationFee,
        bio,
        assignedDoctor,
        patientsAssigned
    });

    return res.status(201).json(new ApiResponse(201, physio, "Physiotherapist created successfully."));
});

const updatePhysioAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    const physio = await Physio.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });

    if (!physio) {
        throw new ApiError(404, "Physiotherapist not found");
    }

    return res.status(200).json(new ApiResponse(200, physio, "Physiotherapist updated successfully."));
});

const deletePhysioAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        throw new ApiError(400, "Physiotherapist ID is required");
    }

    const physio = await Physio.findById(id);

    if (!physio) {
        throw new ApiError(404, "Physiotherapist not found");
    }

    // Delete all sessions where this physiotherapist was assigned
    const sessionsResult = await Session.deleteMany({ physioId: id });
    
    // Delete all progress reports by this physiotherapist
    const reportsResult = await ProgressReport.deleteMany({ physioId: id });

    // Delete the physiotherapist profile
    await Physio.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                deletedPhysio: physio.name,
                deletedSessions: sessionsResult.deletedCount || 0,
                deletedReports: reportsResult.deletedCount || 0
            }, 
            "Physiotherapist and associated data deleted successfully."
        )
    );
});

const getPhysioDetailsAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null' || id === 'N/A') {
        throw new ApiError(400, "Invalid physiotherapist ID");
    }

    const physio = await Physio.findById(id);

    if (!physio) {
        throw new ApiError(404, "Physiotherapist not found");
    }

    const progressReports = await ProgressReport.find({ physioId: id }).populate('patientId', 'name').populate('doctorId', 'name');

    const sessions = await Session.find({ physioId: id }).populate('patientId', 'name').populate('doctorId', 'name');

    return res.status(200).json(new ApiResponse(200, {
        physio,
        progressReports,
        sessions
    }, "Physiotherapist details retrieved successfully."));
});

const deleteUserAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        throw new ApiError(400, "User ID is required");
    }

    // Find the user first to check if they exist
    const user = await User.findById(id);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Find associated patient profile
    const patient = await Patient.findOne({ userId: id });

    // Cascade delete all related data
    const deletionSummary = {
        patient: 0,
        sessions: 0,
        payments: 0,
        medicalRecords: 0,
        progressReports: 0,
        appointments: 0,
        reports: 0,
        notifications: 0
    };

    if (patient) {
        // Delete sessions where user is a patient
        const sessionsResult = await Session.deleteMany({ patientId: patient._id });
        deletionSummary.sessions = sessionsResult.deletedCount || 0;

        // Delete payments
        const paymentsResult = await Payment.deleteMany({ 
            $or: [
                { patientId: patient._id },
                { userId: id }
            ]
        });
        deletionSummary.payments = paymentsResult.deletedCount || 0;

        // Delete medical records
        const medicalRecordsResult = await MedicalRecord.deleteMany({ patientId: patient._id });
        deletionSummary.medicalRecords = medicalRecordsResult.deletedCount || 0;

        // Delete progress reports
        const progressReportsResult = await ProgressReport.deleteMany({ patientId: patient._id });
        deletionSummary.progressReports = progressReportsResult.deletedCount || 0;

        // Delete appointments
        const appointmentsResult = await Appointment.deleteMany({ patientId: patient._id });
        deletionSummary.appointments = appointmentsResult.deletedCount || 0;

        // Delete reports
        const reportsResult = await Report.deleteMany({ patientId: patient._id });
        deletionSummary.reports = reportsResult.deletedCount || 0;

        // Delete patient profile
        await Patient.findByIdAndDelete(patient._id);
        deletionSummary.patient = 1;
    }

    // Delete notifications for this user
    const notificationsResult = await Notification.deleteMany({ userId: id });
    deletionSummary.notifications = notificationsResult.deletedCount || 0;

    // Delete the user account
    await User.findByIdAndDelete(id);

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                deletedUser: user.Fullname || user.mobile_number,
                deletionSummary 
            }, 
            "User account and all associated data deleted successfully."
        )
    );
});

const cleanupOrphanedSessions = asyncHandler(async (req, res) => {
    // Find all sessions
    const allSessions = await Session.find({});
    
    let orphanedSessionIds = [];
    let deletionDetails = {
        missingPatient: 0,
        missingDoctor: 0,
        missingPhysio: 0
    };

    // Check each session for orphaned references
    for (const session of allSessions) {
        let isOrphaned = false;

        // Check if patient exists
        const patient = await Patient.findById(session.patientId);
        if (!patient) {
            isOrphaned = true;
            deletionDetails.missingPatient++;
        }

        // Check if doctor exists
        const doctor = await Doctor.findById(session.doctorId);
        if (!doctor) {
            isOrphaned = true;
            deletionDetails.missingDoctor++;
        }

        // Check if physio exists
        const physio = await Physio.findById(session.physioId);
        if (!physio) {
            isOrphaned = true;
            deletionDetails.missingPhysio++;
        }

        if (isOrphaned) {
            orphanedSessionIds.push(session._id);
        }
    }

    if (orphanedSessionIds.length === 0) {
        return res.status(200).json(
            new ApiResponse(200, { cleaned: 0 }, "No orphaned sessions found. Database is clean.")
        );
    }

    // Delete orphaned sessions
    const deleteResult = await Session.deleteMany({ _id: { $in: orphanedSessionIds } });

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                cleaned: deleteResult.deletedCount,
                totalSessions: allSessions.length,
                remainingSessions: allSessions.length - deleteResult.deletedCount,
                details: deletionDetails
            }, 
            `Successfully cleaned up ${deleteResult.deletedCount} orphaned sessions.`
        )
    );
});

const createPaymentRequest = asyncHandler(async (req, res) => {
    const { patientId, userId, amount, description, paymentType, dueDate, sessionId, notes } = req.body;

    if (!patientId || !userId || !amount || !description) {
        throw new ApiError(400, "Patient ID, User ID, amount, and description are required");
    }

    // Verify patient exists
    const patient = await Patient.findById(patientId);
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Create payment request
    const payment = await Payment.create({
        patientId,
        userId,
        amount,
        description,
        paymentType: paymentType || 'other',
        status: 'pending',
        requestedBy: req.user._id,
        dueDate: dueDate ? new Date(dueDate) : null,
        sessionId: sessionId || null,
        notes: notes || ''
    });

    // Create notification for the patient
    await Notification.create({
        userId,
        type: 'payment',
        title: 'Payment Request',
        message: `New payment request of ₹${amount} for ${description}`,
        relatedId: payment._id,
        relatedModel: 'Payment',
        actionUrl: '/PatientProfile?tab=payments',
        read: false
    });

    return res.status(201).json(new ApiResponse(201, payment, "Payment request created successfully"));
});

const getAllPaymentsAdmin = asyncHandler(async (req, res) => {
    const { status, patientId, page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const matchStage = {};
    if (status && status !== 'all') {
        matchStage.status = status;
    }
    if (patientId) {
        matchStage.patientId = new mongoose.Types.ObjectId(patientId);
    }

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: 'patients',
                localField: 'patientId',
                foreignField: '_id',
                as: 'patient'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'userId',
                foreignField: '_id',
                as: 'user'
            }
        },
        {
            $lookup: {
                from: 'users',
                localField: 'requestedBy',
                foreignField: '_id',
                as: 'requestedByUser'
            }
        },
        {
            $unwind: { path: '$patient', preserveNullAndEmptyArrays: true }
        },
        {
            $unwind: { path: '$user', preserveNullAndEmptyArrays: true }
        },
        {
            $unwind: { path: '$requestedByUser', preserveNullAndEmptyArrays: true }
        },
        {
            $project: {
                _id: 1,
                amount: 1,
                description: 1,
                status: 1,
                paymentType: 1,
                transactionId: 1,
                dueDate: 1,
                paidAt: 1,
                notes: 1,
                createdAt: 1,
                patientName: '$patient.name',
                patientMobile: '$user.mobile_number',
                requestedByName: '$requestedByUser.Fullname'
            }
        },
        { $sort: { [sortBy]: sortOrder === 'desc' ? -1 : 1 } },
        { $skip: (parseInt(page) - 1) * parseInt(limit) },
        { $limit: parseInt(limit) }
    ];

    const payments = await Payment.aggregate(pipeline);

    const totalPipeline = [{ $match: matchStage }, { $count: 'total' }];
    const totalResult = await Payment.aggregate(totalPipeline);
    const total = totalResult[0]?.total || 0;

    return res.status(200).json(
        new ApiResponse(200, { payments, total, page: parseInt(page), limit: parseInt(limit) }, "Payments retrieved successfully")
    );
});

const updatePaymentStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status, transactionId, notes } = req.body;

    if (!status) {
        throw new ApiError(400, "Status is required");
    }

    const payment = await Payment.findById(id);
    if (!payment) {
        throw new ApiError(404, "Payment not found");
    }

    payment.status = status;
    if (transactionId) payment.transactionId = transactionId;
    if (notes) payment.notes = notes;
    if (status === 'completed') payment.paidAt = new Date();

    await payment.save();

    // Create notification for status update
    if (status === 'completed') {
        await Notification.create({
            userId: payment.userId,
            type: 'payment',
            title: 'Payment Confirmed',
            message: `Your payment of ₹${payment.amount} has been received successfully`,
            relatedId: payment._id,
            relatedModel: 'Payment',
            actionUrl: '/PatientProfile?tab=payments',
            read: false
        });
    }

    return res.status(200).json(new ApiResponse(200, payment, "Payment updated successfully"));
});

export { sendAdminOTP, verifyAdminOTP, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, exportPatientsAdmin, exportAllUsersAdmin, getUsersWithoutPatients, universalSearch, quickSearch, allocateSession, loginAdmin, setAdminPassword, forgotAdminPassword, resetAdminPassword, getAllDoctorsAdmin, createDoctorAdmin, updateDoctorAdmin, deleteDoctorAdmin, getDoctorDetailsAdmin, getAllPhysiosAdmin, createPhysioAdmin, updatePhysioAdmin, deletePhysioAdmin, getPhysioDetailsAdmin, getContactSubmissions, createContactSubmission, deleteUserAdmin, cleanupOrphanedSessions, createPaymentRequest, getAllPaymentsAdmin, updatePaymentStatus };
