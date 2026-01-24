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
import { Report } from "../models/report.model.js";
import { Hospital } from "../models/hospital.models.js";
import { Payment } from "../models/payments.models.js";
import { Notification } from "../models/notification.models.js";
import { Contact } from "../models/contact.model.js";
import { Feedback } from "../models/feedback.model.js";
import { Appointment } from "../models/appointments.models.js";
import { Referral } from "../models/referral.models.js";
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
    
    // Convert adminPermissions Maps to plain objects for JSON serialization
    if (loggedInAdmin && loggedInAdmin.adminPermissions) {
        const adminPerms = loggedInAdmin.toObject ? loggedInAdmin.toObject() : loggedInAdmin;
        
        // Convert sectionPermissions Map to plain object
        if (adminPerms.adminPermissions?.sectionPermissions && adminPerms.adminPermissions.sectionPermissions instanceof Map) {
            const sectionPermsObj = {};
            adminPerms.adminPermissions.sectionPermissions.forEach((value, key) => {
                sectionPermsObj[key] = value;
            });
            adminPerms.adminPermissions.sectionPermissions = sectionPermsObj;
        } else if (adminPerms.adminPermissions?.sectionPermissions && typeof adminPerms.adminPermissions.sectionPermissions === 'object') {
            adminPerms.adminPermissions.sectionPermissions = { ...adminPerms.adminPermissions.sectionPermissions };
        }

        // Convert fieldPermissions Map to plain object
        if (adminPerms.adminPermissions?.fieldPermissions && adminPerms.adminPermissions.fieldPermissions instanceof Map) {
            const fieldPermsObj = {};
            adminPerms.adminPermissions.fieldPermissions.forEach((value, key) => {
                fieldPermsObj[key] = value;
            });
            adminPerms.adminPermissions.fieldPermissions = fieldPermsObj;
        } else if (adminPerms.adminPermissions?.fieldPermissions && typeof adminPerms.adminPermissions.fieldPermissions === 'object') {
            adminPerms.adminPermissions.fieldPermissions = { ...adminPerms.adminPermissions.fieldPermissions };
        }
        
        // Update loggedInAdmin with converted permissions
        if (loggedInAdmin.toObject) {
            Object.assign(loggedInAdmin, adminPerms);
        }
    }

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
            $lookup: {
                from: 'reports',
                let: { patientId: '$patient._id' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$patientId', '$$patientId'] } } },
                    { $sort: { createdAt: -1 } },
                    { $limit: 1 }
                ],
                as: 'latestReport'
            }
        },
        {
            $addFields: {
                isProfileComplete: true,
                status: { $cond: { if: { $gte: ['$lastLogin', thirtyDaysAgo] }, then: 'active', else: 'inactive' } },
                latestReport: { $arrayElemAt: ['$latestReport', 0] }
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
                state: '$patient.state',
                city: '$patient.city',
                pincode: '$patient.pincode',
                surgeryType: '$patient.surgeryType',
                surgeryDate: {
                    $cond: {
                        if: { $ne: ["$patient.surgeryDate", null] },
                        then: { $dateToString: { format: "%Y-%m-%d", date: "$patient.surgeryDate" } },
                        else: null
                    }
                },
                assignedDoctor: '$patient.assignedDoctor',
                hospitalClinic: '$patient.hospitalClinic',
                assignedPhysiotherapist: '$patient.assignedPhysiotherapist',
                currentCondition: '$patient.currentCondition',
                medicalHistory: '$patient.medicalHistory',
                allergies: '$patient.allergies',
                bloodGroup: '$patient.bloodGroup',
                emergencyContactNumber: '$patient.emergencyContactNumber',
                medicalInsurance: '$patient.medicalInsurance',
                medicalReport: {
                    $cond: {
                        // If latestReport exists and is newer than patient.medicalReport, use it
                        if: {
                            $and: [
                                { $ne: ['$latestReport', null] },
                                { $ne: ['$latestReport.fileUrl', null] },
                                { $ne: ['$latestReport.fileUrl', ''] },
                                {
                                    $or: [
                                        { $in: ['$patient.medicalReport', [null, '']] },
                                        { 
                                            $gt: [
                                                { $ifNull: ['$latestReport.createdAt', new Date(0)] },
                                                { $ifNull: ['$patient.updatedAt', new Date(0)] }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        },
                        then: '$latestReport.fileUrl',
                        // Otherwise, use patient.medicalReport if it exists
                        else: {
                            $cond: {
                                if: {
                                    $and: [
                                        { $ne: ['$patient.medicalReport', null] },
                                        { $ne: ['$patient.medicalReport', ''] }
                                    ]
                                },
                                then: '$patient.medicalReport',
                                // Fallback to latestReport if patient.medicalReport doesn't exist
                                else: {
                                    $cond: {
                                        if: {
                                            $and: [
                                                { $ne: ['$latestReport', null] },
                                                { $ne: ['$latestReport.fileUrl', null] },
                                                { $ne: ['$latestReport.fileUrl', ''] }
                                            ]
                                        },
                                        then: '$latestReport.fileUrl',
                                        else: null
                                    }
                                }
                            }
                        }
                    }
                },
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
    try {
        const {
            name,
            email,
            dateOfBirth,
            gender,
            mobileNumber,
            surgeryType,
            surgeryDate,
            assignedDoctor,
            hospitalClinic,
            emergencyContactNumber,
            userId,
            age,
            address,
            state,
            city,
            pincode,
            currentCondition,
            assignedPhysiotherapist,
            medicalHistory,
            allergies,
            bloodGroup,
            medicalInsurance,
            password // Optional password for new patient account
        } = req.body;

        console.log('createPatientAdmin received data:', { name, email, dateOfBirth, age, gender, mobileNumber, surgeryType, surgeryDate, currentCondition, emergencyContactNumber, userId });

        // Convert age to number if it's a string
        const ageNum = age ? parseInt(age, 10) : null;
        if (!ageNum || isNaN(ageNum)) {
            throw new ApiError(400, "Age must be a valid number.");
        }

        if ([name, dateOfBirth, gender, mobileNumber, surgeryType, surgeryDate].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
            throw new ApiError(400, "All required fields must be filled out.");
        }

        let resolvedUserId = userId && userId !== 'undefined' && userId !== 'null' && userId !== '' ? userId : null;

        if (!resolvedUserId) {
            // Normalize mobile number for consistent storage and lookup
            const normalizeMobileNumber = (phone) => {
                if (!phone) return null;
                // Remove all non-digit characters and get last 10 digits
                const digits = phone.replace(/[^0-9]/g, '').slice(-10);
                return digits; // Store without +91 prefix for consistency
            };
            const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
            
            // Allow admins to create a new patient along with a lightweight user account
            // Search for user with normalized mobile number (try both formats)
            let existingUser = await User.findOne({
                $or: [
                    { mobile_number: normalizedMobileNumber },
                    { mobile_number: `+91${normalizedMobileNumber}` },
                    { mobile_number: mobileNumber } // Also try original format for backward compatibility
                ]
            });

            if (existingUser) {
                const patientExists = await Patient.findOne({ userId: existingUser._id });
                if (patientExists) {
                    throw new ApiError(409, "A patient profile already exists for this mobile number.");
                }

                existingUser.userType = 'patient';
                existingUser.Fullname = name;
                existingUser.email = (email && email.trim() !== '') ? email : (existingUser.email || null);
                existingUser.gender = gender || existingUser.gender;
                existingUser.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : existingUser.dateOfBirth;
                existingUser.age = ageNum || existingUser.age;
                existingUser.address = address || existingUser.address;
                existingUser.hospitalName = hospitalClinic || existingUser.hospitalName || 'Not Specified'; // Required for patient userType
                existingUser.profileCompleted = true; // Admin-created profiles are complete
                await existingUser.save({ validateBeforeSave: false });

                resolvedUserId = existingUser._id;
            } else {
                const usernameBase = email ? email.split('@')[0] : `patient_${normalizedMobileNumber}`;
                const userData = {
                    Fullname: name,
                    email: email && email.trim() !== '' ? email : null, // Don't auto-generate email
                    username: usernameBase.toLowerCase(),
                    userType: 'patient',
                    mobile_number: normalizedMobileNumber, // Store normalized (without +91) for consistency
                    gender,
                    dateOfBirth: new Date(dateOfBirth),
                    age: ageNum,
                    address,
                    hospitalName: hospitalClinic || 'Not Specified', // Required for patient userType
                    profileCompleted: true // Admin-created profiles are complete
                };
                
                // Add password if provided (will be hashed by pre-save hook)
                if (password && password.trim() !== '' && password.length >= 6) {
                    userData.password = password;
                }
                
                const newUser = await User.create(userData);

                resolvedUserId = newUser._id;
            }
        } else {
            // Ensure supplied user doesn't already have a patient profile
            const patientExists = await Patient.findOne({ userId: resolvedUserId });
            if (patientExists) {
                throw new ApiError(409, "A patient profile already exists for the selected user.");
            }
        }

        // Normalize mobile numbers for consistent storage
        const normalizeMobileNumber = (phone) => {
            if (!phone) return null;
            return phone.replace(/[^0-9]/g, '').slice(-10);
        };
        const normalizedMobileNumber = normalizeMobileNumber(mobileNumber);
        const normalizedEmergencyContact = normalizeMobileNumber(emergencyContactNumber);
        
        const patientData = {
            userId: resolvedUserId,
            name,
            email: email || undefined,
            dateOfBirth: new Date(dateOfBirth),
            gender,
            mobileNumber: normalizedMobileNumber, // Store normalized format
            surgeryType,
            surgeryDate: new Date(surgeryDate),
            assignedDoctor: assignedDoctor || undefined,
            hospitalClinic: hospitalClinic || undefined,
            emergencyContactNumber: (normalizedEmergencyContact || emergencyContactNumber) || undefined,
            age: ageNum,
            address: address || undefined,
            state: state || undefined,
            city: city || undefined,
            pincode: pincode || undefined,
            currentCondition: currentCondition || undefined,
            assignedPhysiotherapist: assignedPhysiotherapist || undefined,
            medicalHistory: medicalHistory || undefined,
            allergies: allergies || undefined,
            bloodGroup: bloodGroup || undefined,
            medicalInsurance: medicalInsurance || undefined
        };

        const medicalReportFile = (req.files || []).find((f) => f.fieldname === 'medicalReport');
        if (medicalReportFile) {
            patientData.medicalReports = [{
                id: new mongoose.Types.ObjectId().toString(),
                fileUrl: `/uploads/${medicalReportFile.filename}`,
                uploadedByAdmin: true,
                createdAt: new Date(),
                title: 'Medical Report',
            }];
        }

        console.log('Creating patient with data:', patientData);

        const patient = await Patient.create(patientData);

        // Ensure the user's profileCompleted is set to true after patient creation
        const user = await User.findById(resolvedUserId);
        if (user && !user.profileCompleted) {
            user.profileCompleted = true;
            await user.save({ validateBeforeSave: false });
        }

        console.log('Patient created successfully:', patient._id);

        return res.status(201).json(new ApiResponse(201, patient, "Patient created successfully."));
    } catch (error) {
        console.error('Error in createPatientAdmin:', error);
        throw error;
    }
});

const updatePatientAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log(`updatePatientAdmin called for patient ID: ${id} with data:`, updateData);

    // Handle file upload for medicalReport: append to medicalReports (keep all)
    const medicalReportFile = (req.files || []).find((f) => f.fieldname === 'medicalReport');
    const medicalReportPush = medicalReportFile ? {
        id: new mongoose.Types.ObjectId().toString(),
        fileUrl: `/uploads/${medicalReportFile.filename}`,
        uploadedByAdmin: true,
        createdAt: new Date(),
        title: 'Medical Report',
    } : null;

    // Build update: $set for fields; $push for new medical report when appending
    delete updateData.medicalReport;
    delete updateData.medicalReportUploadedByAdmin;
    const updateDoc = { $set: updateData };
    if (medicalReportPush) updateDoc.$push = { medicalReports: medicalReportPush };

    // Validate required fields before update
    const requiredFields = ['name', 'dateOfBirth', 'age', 'gender', 'mobileNumber', 'surgeryType', 'surgeryDate'];
    const missingFields = requiredFields.filter(field => !updateData[field]);
    
    if (missingFields.length > 0) {
        console.log('Missing required fields:', missingFields);
        throw new ApiError(400, `Missing required fields: ${missingFields.join(', ')}`);
    }

    // Fetch existing to detect change from non-insured to insured (before update)
    const existing = await Patient.findById(id);
    if (!existing) {
        throw new ApiError(404, "Patient not found");
    }

    const patient = await Patient.findByIdAndUpdate(id, updateDoc, { new: true, runValidators: true })
        .populate('userId', 'Fullname mobile_number email');

    if (!patient) {
        console.log(`Patient not found for ID: ${id}`);
        throw new ApiError(404, "Patient not found");
    }

    console.log(`Patient updated successfully for ID: ${id}`);

    // If mobileNumber was updated, also update the User model to keep them in sync
    // Patient document is the source of truth, so update User to match Patient
    if (updateData.mobileNumber && patient.userId) {
        try {
            await User.findByIdAndUpdate(
                patient.userId._id || patient.userId,
                { mobile_number: updateData.mobileNumber },
                { new: true }
            );
            console.log(`Updated User mobile_number to match Patient mobileNumber for userId: ${patient.userId._id || patient.userId}`);
        } catch (userUpdateError) {
            console.error(`Error updating User mobile_number:`, userUpdateError);
            // Don't fail the request if User update fails, Patient update is more important
        }
    }

    // If email was updated, also update the User model to keep them in sync
    if (updateData.email !== undefined && patient.userId) {
        try {
            await User.findByIdAndUpdate(
                patient.userId._id || patient.userId,
                { email: updateData.email || null },
                { new: true }
            );
            console.log(`Updated User email to match Patient email for userId: ${patient.userId._id || patient.userId}`);
        } catch (userUpdateError) {
            console.error(`Error updating User email:`, userUpdateError);
            // Don't fail the request if User update fails, Patient update is more important
        }
    }

    // When admin changes patient from non-insured to insured, create a pending registration payment so the patient sees it on their profile
    const wasNonInsured = (existing.medicalInsurance !== 'Yes');
    const isNowInsured = (updateData.medicalInsurance === 'Yes');
    if (wasNonInsured && isNowInsured && patient.userId) {
        try {
            const uid = patient.userId?._id || patient.userId;
            const dup = await Payment.findOne({ patientId: id, paymentType: 'registration', status: 'pending' });
            if (!dup) {
                const user = await User.findById(uid).select('address').lean();
                // Include state and city so Uttar Pradesh is detected (state may not be in address string)
                const addr = [patient.address, patient.city, patient.state, patient.pincode, user?.address].filter(Boolean).join(' ');
                const amount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;
                const pay = await Payment.create({
                    patientId: id,
                    userId: uid,
                    amount,
                    description: 'Patient Registration Fee',
                    paymentType: 'registration',
                    status: 'pending',
                    requestedBy: req.user._id,
                });
                await Notification.create({
                    userId: uid,
                    type: 'payment',
                    title: 'Payment Request',
                    message: `New payment request of ₹${amount.toLocaleString('en-IN')} for Patient Registration Fee`,
                    relatedId: pay._id,
                    relatedModel: 'Payment',
                    actionUrl: '/PatientProfile?tab=payments',
                    read: false,
                });
                console.log(`Created registration payment of ₹${amount} for patient ${id} (non-insured → insured)`);
            }
        } catch (err) {
            console.error('Error creating registration payment for newly insured patient:', err);
        }
    }

    // If patient is insured, ensure any pending registration payment has the correct amount (UP=18000, else 35000)
    if (patient.medicalInsurance === 'Yes' && patient.userId) {
        try {
            const uid = patient.userId?._id || patient.userId;
            const pend = await Payment.findOne({ patientId: id, paymentType: 'registration', status: 'pending' });
            if (pend) {
                const user = await User.findById(uid).select('address').lean();
                const addr = [patient.address, patient.city, patient.state, patient.pincode, user?.address].filter(Boolean).join(' ');
                const correctAmount = /Uttar\s*Pradesh|U\.?P\.?\b/i.test(addr) ? 18000 : 35000;
                if (pend.amount !== correctAmount) {
                    await Payment.findByIdAndUpdate(pend._id, { amount: correctAmount });
                    console.log(`Updated registration payment amount to ₹${correctAmount} for patient ${id} (state: ${patient.state})`);
                }
            }
        } catch (err) {
            console.error('Error correcting registration payment amount:', err);
        }
    }

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

    // Find the patient first to get userId for cascade deletion
    const patient = await Patient.findById(id);
    if (!patient) {
        throw new ApiError(404, "Patient not found");
    }

    const patientUserId = patient.userId;
    const patientMobileNumber = patient.mobileNumber;
    
    // Normalize phone number for matching (remove +91 prefix if present, get last 10 digits)
    const normalizePhone = (phone) => {
        if (!phone) return null;
        return phone.replace(/[^0-9]/g, '').slice(-10);
    };
    const normalizedPhone = normalizePhone(patientMobileNumber);
    
    const deletionSummary = {
        referrals: 0,
        sessions: 0,
        payments: 0,
        medicalRecords: 0,
        progressReports: 0,
        appointments: 0,
        reports: 0,
        notifications: 0
    };

    // Delete all referrals where this patient is registered (removes from doctor's profile)
    // Match by registeredPatientId (userId) OR by phone number (in case registeredPatientId wasn't set)
    // Use comprehensive phone number matching to catch all variations
    const referralQueryConditions = [
      { registeredPatientId: patientUserId }
    ];
    
    if (normalizedPhone) {
      referralQueryConditions.push(
        { patientPhone: normalizedPhone },
        { patientPhone: `+91${normalizedPhone}` },
        { patientPhone: patientMobileNumber },
        // Also try regex matching for partial matches
        { patientPhone: { $regex: normalizedPhone.replace(/^0+/, ''), $options: 'i' } }
      );
    }
    
    const referralQuery = { $or: referralQueryConditions };
    
    // First, try to find all referrals that might be related to this patient (for logging)
    const allPossibleReferrals = await Referral.find(referralQuery);
    console.log(`[deletePatientAdmin] Found ${allPossibleReferrals.length} possible referral(s) to delete for patient ${patient.name} (userId: ${patientUserId}, phone: ${patientMobileNumber}, normalized: ${normalizedPhone})`);
    
    if (allPossibleReferrals.length > 0) {
      allPossibleReferrals.forEach(ref => {
        console.log(`[deletePatientAdmin] Referral ${ref._id}: registeredPatientId=${ref.registeredPatientId}, patientPhone=${ref.patientPhone}, status=${ref.status}`);
      });
    }
    
    const referralsResult = await Referral.deleteMany(referralQuery);
    deletionSummary.referrals = referralsResult.deletedCount || 0;
    
    console.log(`[deletePatientAdmin] Deleted ${deletionSummary.referrals} referral(s) for patient ${patient.name}`);
    
    // If we found referrals but didn't delete them, log a warning
    if (allPossibleReferrals.length > deletionSummary.referrals) {
      console.log(`[deletePatientAdmin] WARNING: Found ${allPossibleReferrals.length} referrals but only deleted ${deletionSummary.referrals}`);
    }

    // Delete sessions where this patient is involved
    const sessionsResult = await Session.deleteMany({ patientId: id });
    deletionSummary.sessions = sessionsResult.deletedCount || 0;

    // Delete payments for this patient
    const paymentsResult = await Payment.deleteMany({ 
        $or: [
            { patientId: id },
            { userId: patientUserId }
        ]
    });
    deletionSummary.payments = paymentsResult.deletedCount || 0;

    // Delete medical records for this patient
    const medicalRecordsResult = await MedicalRecord.deleteMany({ patientId: id });
    deletionSummary.medicalRecords = medicalRecordsResult.deletedCount || 0;

    // Delete progress reports for this patient
    const progressReportsResult = await ProgressReport.deleteMany({ patientId: id });
    deletionSummary.progressReports = progressReportsResult.deletedCount || 0;

    // Delete appointments for this patient
    const appointmentsResult = await Appointment.deleteMany({ patientId: id });
    deletionSummary.appointments = appointmentsResult.deletedCount || 0;

    // Delete reports for this patient
    const reportsResult = await Report.deleteMany({ patientId: id });
    deletionSummary.reports = reportsResult.deletedCount || 0;

    // Delete notifications for this patient's user
    const notificationsResult = await Notification.deleteMany({ userId: patientUserId });
    deletionSummary.notifications = notificationsResult.deletedCount || 0;

    // Delete the patient profile
    await Patient.findByIdAndDelete(id);

    // Also delete the User account if it exists and is a patient-only account
    // This ensures referrals are completely removed since they reference userId
    const user = await User.findById(patientUserId);
    if (user && user.userType === 'patient') {
        // Check if there are any other profiles (doctor, physio) - if not, safe to delete user
        const hasDoctorProfile = await Doctor.findOne({ userId: patientUserId });
        const hasPhysioProfile = await Physio.findOne({ userId: patientUserId });
        
        if (!hasDoctorProfile && !hasPhysioProfile) {
            await User.findByIdAndDelete(patientUserId);
            console.log(`[deletePatientAdmin] Also deleted User account for patient ${patient.name} (${patientUserId})`);
        } else {
            console.log(`[deletePatientAdmin] User account kept for patient ${patient.name} (${patientUserId}) - has other profiles`);
        }
    }

    console.log(`[deletePatientAdmin] Patient deleted: ${patient.name} (${id}). Removed ${deletionSummary.referrals} referral(s) from doctor profiles.`);

    return res.status(200).json(new ApiResponse(200, {
        deletedPatient: patient.name,
        deletionSummary
    }, "Patient and all associated data deleted successfully, including removal from doctor referrals."));
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

    const latestReport = await Report.findOne({ patientId: id }).sort({ createdAt: -1 });

    const patientData = patient.toObject();
    if (latestReport?.fileUrl) {
        const patientUpdatedAt = patient.updatedAt || patient.createdAt || new Date(0);
        if (!patientData.medicalReport || latestReport.createdAt > patientUpdatedAt) {
            patientData.medicalReport = latestReport.fileUrl;
        }
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
        patient: patientData,
        medicalHistory: medicalRecords,
        progressReports,
        sessions,
        recoveryPercent
    }, "Patient details retrieved successfully."));
});

const getPatientReportsAdmin = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    if (!patientId) throw new ApiError(400, "Patient ID is required.");
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(200).json(new ApiResponse(200, [], "No reports found for this patient."));
    const reports = await Report.find({ patientId: patient._id }).populate('uploadedBy', 'Fullname userType').sort({ createdAt: -1 });
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const list = reports.map((r) => r.toObject ? r.toObject() : r);
    if (patient.medicalReport && typeof patient.medicalReport === 'string' && patient.medicalReport.trim()) {
        const fileUrl = patient.medicalReport.startsWith('http') ? patient.medicalReport : `${baseUrl}${patient.medicalReport}`;
        list.push({ _id: 'profile-report', title: 'Medical Report', fileUrl, createdAt: patient.updatedAt || patient.createdAt, uploadedBy: null, isProfileReport: true, uploadedByAdmin: !!patient.medicalReportUploadedByAdmin });
    }
    const medicalReports = (patient.medicalReports || []).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    medicalReports.forEach((r, i) => {
        const fileUrl = (r.fileUrl && r.fileUrl.startsWith('http')) ? r.fileUrl : `${baseUrl}${r.fileUrl || ''}`;
        list.push({ _id: r.id || `medical-report-${i}-${r.fileUrl || ''}`, title: r.title || 'Medical Report', fileUrl, createdAt: r.createdAt || new Date(), uploadedBy: null, isFromMedicalReports: true, uploadedByAdmin: !!r.uploadedByAdmin });
    });
    list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return res.status(200).json(new ApiResponse(200, list, "Reports fetched successfully."));
});

const deletePatientReportAdmin = asyncHandler(async (req, res) => {
    const { patientId, reportId } = req.params;
    if (!patientId || !reportId) throw new ApiError(400, "Patient ID and Report ID are required.");
    const patient = await Patient.findById(patientId);
    if (!patient) throw new ApiError(404, "Patient not found.");
    if (reportId === 'profile-report') {
        await Patient.findByIdAndUpdate(patientId, { $unset: { medicalReport: 1, medicalReportUploadedByAdmin: 1 } });
        return res.status(200).json(new ApiResponse(200, {}, "Report deleted successfully."));
    }
    const isValidMongoId = /^[0-9a-fA-F]{24}$/.test(reportId);
    if (isValidMongoId) {
        const report = await Report.findOne({ _id: reportId, patientId });
        if (report) {
            await report.deleteOne();
            return res.status(200).json(new ApiResponse(200, {}, "Report deleted successfully."));
        }
    }
    const pullResult = await Patient.findByIdAndUpdate(patientId, { $pull: { medicalReports: { id: reportId } } }, { new: true });
    const pulled = (patient.medicalReports || []).length !== (pullResult?.medicalReports || []).length;
    if (!pulled && isValidMongoId) throw new ApiError(404, "Report not found.");
    return res.status(200).json(new ApiResponse(200, {}, "Report deleted successfully."));
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
    const users = await User.find({ 
        userType: 'patient',
        markedAsAdded: { $ne: true } // Exclude users marked as added
    }).select('_id Fullname username email mobile_number');

    const usersWithPatients = await Patient.find().distinct('userId');

    const availableUsers = users.filter(user => !usersWithPatients.includes(user._id));

    return res.status(200).json(new ApiResponse(200, availableUsers, "Available users retrieved successfully."));
});

const markUserAsAdded = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId || userId === 'undefined' || userId === 'null') {
        throw new ApiError(400, "User ID is required");
    }

    const user = await User.findByIdAndUpdate(
        userId,
        { markedAsAdded: true },
        { new: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    console.log(`User ${user.Fullname || user.username} (${userId}) marked as added`);

    return res.status(200).json(new ApiResponse(200, user, "User marked as added successfully"));
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
    const { patientId, doctorId, physioId, surgeryType, totalSessions, sessionDate, sessions, paymentId } = req.body;

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

    if (toCreate.length === 0) {
        throw new ApiError(400, "No sessions to schedule");
    }

    // Resolve payment credits
    let payment = null;
    if (paymentId) {
        if (!mongoose.isValidObjectId(paymentId)) {
            throw new ApiError(400, "Invalid payment reference");
        }
        payment = await Payment.findById(paymentId);
        if (!payment) {
            throw new ApiError(404, "Payment reference not found");
        }
    } else {
        payment = await Payment.findOne({
            patientId: patient._id,
            status: 'completed',
            sessionCount: { $gt: 0 }
        }).sort({ paidAt: -1, createdAt: -1 });
    }

    if (!payment) {
        throw new ApiError(400, "No completed payment with available sessions found for this patient. Please create or select a payment request first.");
    }

    if (String(payment.patientId) !== String(patient._id)) {
        throw new ApiError(400, "Selected payment does not belong to this patient");
    }

    const totalPaidSessions = payment.sessionCount || 0;
    const allocatedSessions = payment.sessionsAllocated || 0;
    const computedRemaining = totalPaidSessions > 0 ? Math.max(totalPaidSessions - allocatedSessions, 0) : 0;
    const remainingSessions = typeof payment.sessionsRemaining === 'number' ? Math.max(payment.sessionsRemaining, computedRemaining) : computedRemaining;

    if (remainingSessions <= 0) {
        throw new ApiError(400, "The selected payment does not have any sessions remaining");
    }

    if (toCreate.length > remainingSessions) {
        throw new ApiError(400, `Only ${remainingSessions} session(s) remain for this payment. Reduce the count or create another payment request.`);
    }

    // attach payment reference to each session
    toCreate.forEach(item => {
        item.paymentId = payment._id;
    });

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

    const newlyCreatedCount = createdSessions?.length || toCreate.length;
    payment.sessionsAllocated = (payment.sessionsAllocated || 0) + newlyCreatedCount;
    const sessionCap = payment.sessionCount || 0;
    payment.sessionsRemaining = sessionCap > 0 ? Math.max(sessionCap - payment.sessionsAllocated, 0) : 0;
    await payment.save();

    return res.status(201).json(new ApiResponse(201, { sessions: createdSessions, payment }, "Session(s) allocated successfully."));
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
    
    // Convert adminPermissions Maps to plain objects for JSON serialization
    if (loggedInAdmin && loggedInAdmin.adminPermissions) {
        const adminPerms = loggedInAdmin.toObject ? loggedInAdmin.toObject() : loggedInAdmin;
        
        // Convert sectionPermissions Map to plain object
        if (adminPerms.adminPermissions?.sectionPermissions && adminPerms.adminPermissions.sectionPermissions instanceof Map) {
            const sectionPermsObj = {};
            adminPerms.adminPermissions.sectionPermissions.forEach((value, key) => {
                sectionPermsObj[key] = value;
            });
            adminPerms.adminPermissions.sectionPermissions = sectionPermsObj;
        } else if (adminPerms.adminPermissions?.sectionPermissions && typeof adminPerms.adminPermissions.sectionPermissions === 'object') {
            adminPerms.adminPermissions.sectionPermissions = { ...adminPerms.adminPermissions.sectionPermissions };
        }

        // Convert fieldPermissions Map to plain object
        if (adminPerms.adminPermissions?.fieldPermissions && adminPerms.adminPermissions.fieldPermissions instanceof Map) {
            const fieldPermsObj = {};
            adminPerms.adminPermissions.fieldPermissions.forEach((value, key) => {
                fieldPermsObj[key] = value;
            });
            adminPerms.adminPermissions.fieldPermissions = fieldPermsObj;
        } else if (adminPerms.adminPermissions?.fieldPermissions && typeof adminPerms.adminPermissions.fieldPermissions === 'object') {
            adminPerms.adminPermissions.fieldPermissions = { ...adminPerms.adminPermissions.fieldPermissions };
        }
        
        // Update loggedInAdmin with converted permissions
        if (loggedInAdmin.toObject) {
            Object.assign(loggedInAdmin, adminPerms);
        }
    }

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

const getAllAdmins = asyncHandler(async (req, res) => {
    // Check if requester is "Rohit kumar"
    const requester = req.user;
    if (requester.Fullname !== 'Rohit kumar' && requester.Fullname !== 'Rohit Kumar') {
        throw new ApiError(403, "Access denied. Only 'Rohit kumar' can access this resource.");
    }

    const { search, page = 1, limit = 50, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = { 
        userType: 'admin',
        _id: { $ne: requester._id } // Exclude the current user (Rohit Kumar)
    };
    
    if (search) {
        query.$or = [
            { username: { $regex: search, $options: 'i' } },
            { Fullname: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { mobile_number: { $regex: search, $options: 'i' } }
        ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const admins = await User.find(query)
        .select('-password -refreshToken -otp -otpExpires')
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    return res.status(200).json(new ApiResponse(200, {
        admins,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    }, "Admins retrieved successfully."));
});

const createAdmin = asyncHandler(async (req, res) => {
    // Check if requester is "Rohit kumar"
    const requester = req.user;
    if (requester.Fullname !== 'Rohit kumar' && requester.Fullname !== 'Rohit Kumar') {
        throw new ApiError(403, "Access denied. Only 'Rohit kumar' can create admins.");
    }

    const { username, password, Fullname, email, mobile_number, adminPermissions } = req.body;

    if (!username || !password || !Fullname || !mobile_number) {
        throw new ApiError(400, "Username, password, Fullname, and mobile_number are required");
    }

    if (password.length < 6) {
        throw new ApiError(400, "Password must be at least 6 characters long");
    }

    // Check if username or mobile_number already exists
    const existingUser = await User.findOne({
        $or: [
            { username },
            { mobile_number }
        ]
    });

    if (existingUser) {
        throw new ApiError(409, "Username or mobile number already exists");
    }

    // Convert sectionPermissions and fieldPermissions objects to Map format for MongoDB
    let sectionPermissionsMap = {};
    if (adminPermissions && adminPermissions.sectionPermissions) {
        Object.keys(adminPermissions.sectionPermissions).forEach(key => {
            sectionPermissionsMap[key] = adminPermissions.sectionPermissions[key];
        });
    }

    let fieldPermissionsMap = {};
    if (adminPermissions && adminPermissions.fieldPermissions) {
        Object.keys(adminPermissions.fieldPermissions).forEach(key => {
            fieldPermissionsMap[key] = adminPermissions.fieldPermissions[key];
        });
    }

    const newAdmin = await User.create({
        username,
        password,
        userType: 'admin',
        Fullname,
        email: email || undefined,
        mobile_number,
        gender: 'Other',
        dateOfBirth: new Date('1990-01-01'),
        age: 34,
        address: 'Unknown',
        adminPermissions: adminPermissions ? {
            visibleSections: adminPermissions.visibleSections || ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog'],
            sectionPermissions: sectionPermissionsMap,
            fieldPermissions: fieldPermissionsMap
        } : undefined
    });

    const adminData = await User.findById(newAdmin._id).select('-password -refreshToken -otp -otpExpires');

    return res.status(201).json(new ApiResponse(201, adminData, "Admin created successfully."));
});

const updateAdmin = asyncHandler(async (req, res) => {
    // Check if requester is "Rohit kumar"
    const requester = req.user;
    if (requester.Fullname !== 'Rohit kumar' && requester.Fullname !== 'Rohit Kumar') {
        throw new ApiError(403, "Access denied. Only 'Rohit kumar' can update admins.");
    }

    const { id } = req.params;
    const { username, password, Fullname, email, mobile_number, adminPermissions } = req.body;

    const admin = await User.findById(id);
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.userType !== 'admin') {
        throw new ApiError(400, "User is not an admin");
    }

    // Check if username or mobile_number is being changed and conflicts with another user
    if (username && username !== admin.username) {
        const existingUser = await User.findOne({ username, _id: { $ne: id } });
        if (existingUser) {
            throw new ApiError(409, "Username already exists");
        }
        admin.username = username;
    }

    if (mobile_number && mobile_number !== admin.mobile_number) {
        const existingUser = await User.findOne({ mobile_number, _id: { $ne: id } });
        if (existingUser) {
            throw new ApiError(409, "Mobile number already exists");
        }
        admin.mobile_number = mobile_number;
    }

    if (Fullname) admin.Fullname = Fullname;
    if (email !== undefined) admin.email = email;
    if (password && password.trim() !== '') {
        if (password.length < 6) {
            throw new ApiError(400, "Password must be at least 6 characters long");
        }
        admin.password = password;
    }

    // Update admin permissions if provided
    if (adminPermissions) {
        try {
            // Convert sectionPermissions and fieldPermissions objects to Map format for MongoDB
            let sectionPermissionsMap = {};
            if (adminPermissions.sectionPermissions && typeof adminPermissions.sectionPermissions === 'object') {
                Object.keys(adminPermissions.sectionPermissions).forEach(key => {
                    sectionPermissionsMap[key] = adminPermissions.sectionPermissions[key];
                });
            }

            let fieldPermissionsMap = {};
            if (adminPermissions.fieldPermissions && typeof adminPermissions.fieldPermissions === 'object') {
                Object.keys(adminPermissions.fieldPermissions).forEach(key => {
                    fieldPermissionsMap[key] = adminPermissions.fieldPermissions[key];
                });
            }

            // Get existing permissions or use defaults
            // Convert Mongoose subdocument to plain object if needed
            let existingPermissions = {};
            if (admin.adminPermissions) {
                if (typeof admin.adminPermissions.toObject === 'function') {
                    existingPermissions = admin.adminPermissions.toObject();
                } else {
                    existingPermissions = admin.adminPermissions;
                }
            }
            
            const existingVisibleSections = existingPermissions.visibleSections || ['dashboard', 'patients', 'doctors', 'physiotherapists', 'sessions', 'payments', 'referrals', 'contact', 'blog'];
            const existingSectionPermissions = existingPermissions.sectionPermissions || {};
            const existingFieldPermissions = existingPermissions.fieldPermissions || {};

            // Only update if we have new data
            if (adminPermissions.visibleSections || Object.keys(sectionPermissionsMap).length > 0 || Object.keys(fieldPermissionsMap).length > 0) {
                admin.adminPermissions = {
                    visibleSections: adminPermissions.visibleSections || existingVisibleSections,
                    sectionPermissions: Object.keys(sectionPermissionsMap).length > 0 ? sectionPermissionsMap : existingSectionPermissions,
                    fieldPermissions: Object.keys(fieldPermissionsMap).length > 0 ? fieldPermissionsMap : existingFieldPermissions
                };
            }
        } catch (error) {
            console.error('Error updating admin permissions:', error);
            // Don't fail the entire update if permissions update fails
            // Just log the error and continue
        }
    }

    await admin.save({ validateBeforeSave: false });

    const updatedAdmin = await User.findById(id).select('-password -refreshToken -otp -otpExpires');

    return res.status(200).json(new ApiResponse(200, updatedAdmin, "Admin updated successfully."));
});

const deleteAdmin = asyncHandler(async (req, res) => {
    // Check if requester is "Rohit kumar"
    const requester = req.user;
    if (requester.Fullname !== 'Rohit kumar' && requester.Fullname !== 'Rohit Kumar') {
        throw new ApiError(403, "Access denied. Only 'Rohit kumar' can delete admins.");
    }

    const { id } = req.params;

    // Prevent deleting self
    if (id === requester._id.toString()) {
        throw new ApiError(400, "You cannot delete your own account");
    }

    const admin = await User.findById(id);
    if (!admin) {
        throw new ApiError(404, "Admin not found");
    }

    if (admin.userType !== 'admin') {
        throw new ApiError(400, "User is not an admin");
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json(new ApiResponse(200, {}, "Admin deleted successfully."));
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
    try {
        const { name, specialization, qualification, experience, hospitalAffiliation, userId, email, mobileNumber } = req.body;

        console.log('createDoctorAdmin received data:', { name, specialization, qualification, experience, hospitalAffiliation, userId, email, mobileNumber });

        // Convert experience to number if it's a string
        const experienceNum = experience ? parseInt(experience, 10) : 0;
        if (isNaN(experienceNum)) {
            throw new ApiError(400, "Experience must be a valid number.");
        }

        if ([name, specialization, qualification, hospitalAffiliation].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
            throw new ApiError(400, "All required fields must be filled out.");
        }

        let resolvedUserId = userId && userId !== 'undefined' && userId !== 'null' && userId !== '' ? userId : null;

        if (!resolvedUserId) {
            // Create a new user account for the doctor
            if (!mobileNumber) {
                throw new ApiError(400, "Mobile number is required to create a doctor account.");
            }

            let existingUser = await User.findOne({ mobile_number: mobileNumber });

            if (existingUser) {
                const doctorExists = await Doctor.findOne({ userId: existingUser._id });
                if (doctorExists) {
                    throw new ApiError(409, "A doctor profile already exists for this mobile number.");
                }

                existingUser.userType = 'doctor';
                existingUser.Fullname = name;
                existingUser.email = email || existingUser.email;
                existingUser.hospitalName = hospitalAffiliation || existingUser.hospitalName || 'Not Specified';
                await existingUser.save({ validateBeforeSave: false });

                resolvedUserId = existingUser._id;
            } else {
                const usernameBase = email ? email.split('@')[0] : `doctor_${mobileNumber}`;
                const newUser = await User.create({
                    Fullname: name,
                    email: email || `${usernameBase}@autogen.bonebuddy`,
                    username: usernameBase.toLowerCase(),
                    userType: 'doctor',
                    mobile_number: mobileNumber,
                    hospitalName: hospitalAffiliation || 'Not Specified',
                    profileCompleted: false
                });

                resolvedUserId = newUser._id;
            }
        } else {
            // Ensure supplied user doesn't already have a doctor profile
            const doctorExists = await Doctor.findOne({ userId: resolvedUserId });
            if (doctorExists) {
                throw new ApiError(409, "A doctor profile already exists for the selected user.");
            }
        }

        const doctor = await Doctor.create({
            userId: resolvedUserId,
            name,
            specialization,
            qualification,
            experience: experienceNum,
            hospitalAffiliation
        });

        console.log('Doctor created successfully:', doctor._id);

        return res.status(201).json(new ApiResponse(201, doctor, "Doctor created successfully."));
    } catch (error) {
        console.error('Error in createDoctorAdmin:', error);
        throw error;
    }
});

const updateDoctorAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;

    console.log('updateDoctorAdmin called with ID:', id);
    console.log('Update data:', updateData);

    // Validate ID format
    if (!id || id === 'undefined' || id === 'null' || id === 'N/A') {
        throw new ApiError(400, "Invalid doctor ID");
    }

    // Try to find doctor by ID - use only _id to avoid confusion
    let existingDoctor = await Doctor.findById(id);
    
    // Log for debugging
    console.log('Looking for doctor with ID:', id);
    console.log('Doctor found by _id:', existingDoctor ? { _id: existingDoctor._id.toString(), name: existingDoctor.name } : 'Not found');
    
    // Only try userId lookup if ID format suggests it might be a userId (optional fallback)
    // But log a warning as this could cause issues
    if (!existingDoctor && id.length === 24) { // MongoDB ObjectId format
        console.log('⚠️ WARNING: Doctor not found by _id, trying userId fallback (this may cause incorrect updates)...');
        const fallbackDoctor = await Doctor.findOne({ userId: id });
        if (fallbackDoctor) {
            console.log('⚠️ Found doctor by userId:', { _id: fallbackDoctor._id.toString(), name: fallbackDoctor.name, userId: fallbackDoctor.userId });
            existingDoctor = fallbackDoctor;
        }
    }

    console.log('Final doctor to update:', existingDoctor ? { _id: existingDoctor._id.toString(), name: existingDoctor.name } : 'Not found');

    if (!existingDoctor) {
        // List all doctor IDs for debugging
        const allDoctors = await Doctor.find({}).select('_id name').limit(5);
        console.log('Sample doctor IDs in database:', allDoctors.map(d => ({ id: d._id.toString(), name: d.name })));
        throw new ApiError(404, `Doctor not found with ID: ${id}`);
    }

    // Use the found doctor's ID for update
    const doctorId = existingDoctor._id;
    
    // Filter out undefined values but keep empty strings and null
    const cleanUpdateData = Object.fromEntries(
        Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );
    
    console.log('Cleaned update data:', cleanUpdateData);
    
    const doctor = await Doctor.findByIdAndUpdate(doctorId, cleanUpdateData, { new: true, runValidators: true });

    if (!doctor) {
        throw new ApiError(404, "Doctor not found after update");
    }

    console.log('Doctor updated successfully:', doctor._id);
    console.log('Updated doctor data:', {
        name: doctor.name,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experience: doctor.experience,
        hospitalAffiliation: doctor.hospitalAffiliation
    });

    return res.status(200).json(new ApiResponse(200, doctor, "Doctor updated successfully."));
});

const deleteDoctorAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined') {
        throw new ApiError(400, "Doctor ID is required");
    }

    // Try to find doctor by _id first (Doctor document ID)
    let doctor = await Doctor.findById(id);
    
    // If not found, try to find by userId (User document ID)
    if (!doctor) {
        doctor = await Doctor.findOne({ userId: id });
    }

    if (!doctor) {
        throw new ApiError(404, "Doctor not found");
    }

    // Get the doctor document ID and userId
    const doctorId = doctor._id;
    const userId = doctor.userId;

    // Delete all sessions where this doctor was assigned
    const sessionsResult = await Session.deleteMany({ doctorId: doctorId });
    
    // Delete all progress reports by this doctor
    const reportsResult = await ProgressReport.deleteMany({ doctorId: doctorId });

    // Delete medical records by this doctor
    const medicalRecordsResult = await MedicalRecord.deleteMany({ doctorId: doctorId });

    // Delete the doctor profile
    await Doctor.findByIdAndDelete(doctorId);

    // If there's an associated user account, delete it as well
    if (userId) {
        // Delete notifications for this user
        await Notification.deleteMany({ userId: userId });
        
        // Delete the user account
        await User.findByIdAndDelete(userId);
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                deletedDoctor: doctor.name,
                deletedSessions: sessionsResult.deletedCount || 0,
                deletedReports: reportsResult.deletedCount || 0,
                deletedMedicalRecords: medicalRecordsResult.deletedCount || 0,
                deletedUser: userId ? true : false
            }, 
            "Doctor profile, user account, and associated data deleted successfully."
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

    // Get the userId before deleting the physio profile
    const userId = physio.userId;

    // Delete all sessions where this physiotherapist was assigned
    const sessionsResult = await Session.deleteMany({ physioId: id });
    
    // Delete all progress reports by this physiotherapist
    const reportsResult = await ProgressReport.deleteMany({ physioId: id });

    // Delete the physiotherapist profile
    await Physio.findByIdAndDelete(id);

    // If there's an associated user account, delete it as well
    if (userId) {
        // Delete notifications for this user
        await Notification.deleteMany({ userId: userId });
        
        // Delete the user account
        await User.findByIdAndDelete(userId);
    }

    return res.status(200).json(
        new ApiResponse(
            200, 
            { 
                deletedPhysio: physio.name,
                deletedSessions: sessionsResult.deletedCount || 0,
                deletedReports: reportsResult.deletedCount || 0,
                deletedUser: userId ? true : false
            }, 
            "Physiotherapist profile, user account, and associated data deleted successfully."
        )
    );
});

const getPhysioDetailsAdmin = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || id === 'undefined' || id === 'null' || id === 'N/A') {
        throw new ApiError(400, "Invalid physiotherapist ID");
    }

    // Try to find by userId first (since id might be userId)
    let physio = await Physio.findOne({ userId: id });
    let userId = id;
    
    if (!physio) {
        // Try to find by physio _id
        physio = await Physio.findById(id);
        if (physio) {
            userId = physio.userId;
        }
    } else {
        userId = physio.userId;
    }

    if (!physio) {
        throw new ApiError(404, "Physiotherapist not found");
    }

    // Get user data
    const user = await User.findById(userId).select('Fullname email mobile_number gender dateOfBirth age address specialization experience qualification availableDays availableTimeSlots consultationFee bio');

    const progressReports = await ProgressReport.find({ physioId: physio._id }).populate('patientId', 'name').populate('doctorId', 'name');

    const sessions = await Session.find({ physioId: physio._id }).populate('patientId', 'name').populate('doctorId', 'name');

    // Combine physio and user data
    const physioData = {
        ...physio.toObject(),
        ...user.toObject(),
        name: user.Fullname || physio.name,
        Fullname: user.Fullname
    };

    return res.status(200).json(new ApiResponse(200, physioData, "Physiotherapist details retrieved successfully."));
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

    // Find associated profiles based on user type
    const patient = await Patient.findOne({ userId: id });
    const doctor = await Doctor.findOne({ userId: id });
    const physio = await Physio.findOne({ userId: id });

    // Cascade delete all related data
    const deletionSummary = {
        patient: 0,
        doctor: 0,
        physio: 0,
        sessions: 0,
        payments: 0,
        medicalRecords: 0,
        progressReports: 0,
        appointments: 0,
        reports: 0,
        notifications: 0
    };

    // Handle patient deletion
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

    // Handle doctor deletion
    if (doctor) {
        // Delete sessions where this doctor was assigned
        const doctorSessionsResult = await Session.deleteMany({ doctorId: doctor._id });
        deletionSummary.sessions += doctorSessionsResult.deletedCount || 0;

        // Delete progress reports by this doctor
        const doctorReportsResult = await ProgressReport.deleteMany({ doctorId: doctor._id });
        deletionSummary.progressReports += doctorReportsResult.deletedCount || 0;

        // Delete medical records by this doctor
        const doctorMedicalRecordsResult = await MedicalRecord.deleteMany({ doctorId: doctor._id });
        deletionSummary.medicalRecords += doctorMedicalRecordsResult.deletedCount || 0;

        // Delete doctor profile
        await Doctor.findByIdAndDelete(doctor._id);
        deletionSummary.doctor = 1;
    }

    // Handle physiotherapist deletion
    if (physio) {
        // Delete sessions where this physio was assigned
        const physioSessionsResult = await Session.deleteMany({ physioId: physio._id });
        deletionSummary.sessions += physioSessionsResult.deletedCount || 0;

        // Delete progress reports by this physio
        const physioReportsResult = await ProgressReport.deleteMany({ physioId: physio._id });
        deletionSummary.progressReports += physioReportsResult.deletedCount || 0;

        // Delete physio profile
        await Physio.findByIdAndDelete(physio._id);
        deletionSummary.physio = 1;
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
                userType: user.userType,
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
    const { patientId, userId, amount, description, paymentType, dueDate, sessionId, notes, sessionCount } = req.body;

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

    let normalizedSessionCount = Number(sessionCount) || 0;
    if (normalizedSessionCount < 0) {
        throw new ApiError(400, "Session count cannot be negative");
    }
    if (paymentType === 'session' && normalizedSessionCount <= 0) {
        throw new ApiError(400, "Please specify how many sessions are being paid for");
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
        notes: notes || '',
        sessionCount: normalizedSessionCount,
        sessionsAllocated: 0,
        sessionsRemaining: 0
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
                sessionCount: 1,
                sessionsAllocated: 1,
                sessionsRemaining: 1,
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
    if (status === 'completed') {
        payment.paidAt = new Date();
        const totalSessions = payment.sessionCount || 0;
        const allocated = payment.sessionsAllocated || 0;
        payment.sessionsRemaining = totalSessions > 0 ? Math.max(totalSessions - allocated, 0) : 0;
    } else if (status === 'cancelled') {
        payment.sessionsRemaining = 0;
    }

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

const getPatientPaymentCredits = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    if (!mongoose.isValidObjectId(patientId)) {
        throw new ApiError(400, "Invalid patient id");
    }

    const payments = await Payment.find({
        patientId,
        status: 'completed',
        sessionCount: { $gt: 0 }
    })
    .sort({ paidAt: -1, createdAt: -1 })
    .select('_id amount description sessionCount sessionsAllocated sessionsRemaining paymentType paidAt dueDate notes');

    return res
        .status(200)
        .json(new ApiResponse(200, payments, "Patient payment credits retrieved successfully"));
});

const changeUserPasswordAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { newPassword, newMobileNumber } = req.body;

    if (!userId || userId === 'undefined' || userId === 'null') {
        throw new ApiError(400, "User ID is required");
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const changes = [];

    // Update password if provided
    if (newPassword) {
        if (newPassword.length < 6) {
            throw new ApiError(400, "Password must be at least 6 characters long");
        }
        user.password = newPassword; // Mongoose pre-save hook will hash this
        changes.push('password');
    }

    // Update mobile number if provided
    if (newMobileNumber) {
        // Normalize mobile number (last 10 digits)
        const normalizedMobile = newMobileNumber.replace(/[^0-9]/g, '').slice(-10);
        if (normalizedMobile.length !== 10) {
            throw new ApiError(400, "Mobile number must be 10 digits");
        }
        
        // Check if another user already has this mobile number
        const existingUser = await User.findOne({ 
            mobile_number: normalizedMobile,
            _id: { $ne: userId }
        });
        if (existingUser) {
            throw new ApiError(409, "Another user already has this mobile number");
        }
        
        user.mobile_number = normalizedMobile;
        changes.push('mobile number');
        
        // Also update Patient document if it exists
        const patient = await Patient.findOne({ userId: userId });
        if (patient) {
            patient.mobileNumber = normalizedMobile;
            await patient.save({ validateBeforeSave: false });
            console.log(`Updated Patient mobileNumber to ${normalizedMobile} for userId: ${userId}`);
        }
    }

    // Check if at least one field is being updated
    if (changes.length === 0) {
        throw new ApiError(400, "Please provide either a new password or a new mobile number");
    }

    await user.save({ validateBeforeSave: true });

    console.log(`Admin changed ${changes.join(' and ')} for user: ${user.Fullname || user.username} (${userId})`);

    return res.status(200).json(new ApiResponse(200, {
        updatedFields: changes,
        mobileNumber: newMobileNumber ? newMobileNumber.replace(/[^0-9]/g, '').slice(-10) : undefined
    }, `${changes.join(' and ')} changed successfully`));
});

const updateUserProfileStatusAdmin = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { phoneNumber, profileCompleted, userType } = req.body;

    // Find user by userId (from params) or phoneNumber (from body)
    let user;
    if (userId && userId !== 'undefined' && userId !== 'null') {
        user = await User.findById(userId);
    } else if (phoneNumber) {
        // Normalize phone number (last 10 digits)
        const normalizedPhone = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
        user = await User.findOne({ 
            mobile_number: { $in: [normalizedPhone, `+91${normalizedPhone}`, phoneNumber] } 
        });
    } else {
        throw new ApiError(400, "Either userId (in URL) or phoneNumber (in body) is required");
    }

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const changes = [];

    // Update profileCompleted if provided
    if (profileCompleted !== undefined) {
        user.profileCompleted = profileCompleted === true || profileCompleted === 'true';
        changes.push(`profileCompleted: ${user.profileCompleted}`);
    }

    // Update userType if provided
    if (userType) {
        const validUserTypes = ['patient', 'doctor', 'physio', 'physiotherapist', 'admin'];
        if (!validUserTypes.includes(userType.toLowerCase())) {
            throw new ApiError(400, `Invalid userType. Must be one of: ${validUserTypes.join(', ')}`);
        }
        user.userType = userType.toLowerCase();
        changes.push(`userType: ${user.userType}`);
    }

    // Check if at least one field is being updated
    if (changes.length === 0) {
        throw new ApiError(400, "Please provide either profileCompleted or userType to update");
    }

    await user.save({ validateBeforeSave: false });

    console.log(`Admin updated profile status for user: ${user.Fullname || user.username} (${user.mobile_number}) - ${changes.join(', ')}`);

    return res.status(200).json(new ApiResponse(200, {
        userId: user._id,
        mobileNumber: user.mobile_number,
        profileCompleted: user.profileCompleted,
        userType: user.userType,
        updatedFields: changes
    }, "User profile status updated successfully"));
});

const getFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find()
        .populate('user', 'Fullname email mobile_number')
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, feedbacks, "Feedbacks retrieved successfully."));
});

const updateFeedbackStatus = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { isPublic } = req.body;

    if (typeof isPublic !== 'boolean') {
        throw new ApiError(400, "isPublic must be a boolean value");
    }

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }

    feedback.isPublic = isPublic;
    await feedback.save();

    return res.status(200).json(
        new ApiResponse(200, feedback, `Feedback ${isPublic ? 'published' : 'unpublished'} successfully`)
    );
});

const deleteFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findByIdAndDelete(feedbackId);
    if (!feedback) {
        throw new ApiError(404, "Feedback not found");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Feedback deleted successfully")
    );
});

export { sendAdminOTP, verifyAdminOTP, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, getPatientReportsAdmin, deletePatientReportAdmin, exportPatientsAdmin, exportAllUsersAdmin, getUsersWithoutPatients, markUserAsAdded, universalSearch, quickSearch, allocateSession, loginAdmin, setAdminPassword, forgotAdminPassword, resetAdminPassword, getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAllDoctorsAdmin, createDoctorAdmin, updateDoctorAdmin, deleteDoctorAdmin, getDoctorDetailsAdmin, getAllPhysiosAdmin, createPhysioAdmin, updatePhysioAdmin, deletePhysioAdmin, getPhysioDetailsAdmin, getContactSubmissions, createContactSubmission, deleteUserAdmin, cleanupOrphanedSessions, createPaymentRequest, getAllPaymentsAdmin, updatePaymentStatus, getPatientPaymentCredits, changeUserPasswordAdmin, updateUserProfileStatusAdmin, getFeedbacks, updateFeedbackStatus, deleteFeedback };
