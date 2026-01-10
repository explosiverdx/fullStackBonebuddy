import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
import { User } from "../models/user.models.js";
import { Session } from "../models/sessions.models.js";
import { Referral } from "../models/referral.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

/**
 * Helper function to check and update missed sessions
 * A session is missed if:
 * - sessionDate has passed (sessionEnd time has passed)
 * - startTime is not set (physiotherapist didn't start it)
 * - status is not 'completed', 'cancelled', or already 'missed'
 */
const updateMissedSessions = async (sessions) => {
    const now = new Date();
    const updates = [];

    for (const session of sessions) {
        // Check if session should be marked as missed
        if (!session.startTime && 
            session.status !== 'completed' && 
            session.status !== 'cancelled' && 
            session.status !== 'missed') {
            
            const sessionDate = new Date(session.sessionDate);
            const sessionEnd = new Date(sessionDate.getTime() + (session.durationMinutes || 60) * 60000);
            
            // If session time has passed and physiotherapist didn't start it, mark as missed
            if (now > sessionEnd) {
                try {
                    await Session.findByIdAndUpdate(session._id, { status: 'missed' });
                    session.status = 'missed';
                    updates.push(session._id);
                } catch (error) {
                    console.error(`Error updating session ${session._id} to missed:`, error);
                }
            }
        }
    }

    if (updates.length > 0) {
        console.log(`Marked ${updates.length} sessions as missed`);
    }

    return sessions;
};

const createDoctorProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can create a doctor profile.");
    }

    const existingDoctor = await Doctor.findOne({ userId });
    if (existingDoctor) {
        throw new ApiError(409, "A doctor profile for this user already exists.");
    }

    if ([name, qualification, specialization].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, qualification, and specialization are required fields.");
    }

    const doctor = await Doctor.create({
        userId,
        name,
        qualification,
        specialization,
        experience
    });

    return res.status(201).json(
        new ApiResponse(201, doctor, "Doctor profile created successfully.")
    );
});

const getDoctorProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const doctor = await Doctor.findOne({ userId });

    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, doctor, "Doctor profile retrieved successfully.")
    );
});

const getAllDoctors = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sortBy = 'Fullname', sortOrder = 'asc' } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const match = { userType: 'doctor' };
    if (search) {
        match.$or = [
            { Fullname: { $regex: search, $options: 'i' } },
            { specialization: { $regex: search, $options: 'i' } },
            { hospitalName: { $regex: search, $options: 'i' } }
        ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const aggregate = User.aggregate([
        { $match: match },
        {
            $project: {
                _id: 1,
                name: "$Fullname",
                qualification: 1,
                specialization: 1,
                experience: 1,
                hospitalAffiliation: "$hospitalName",
                availableDays: 1,
                availableTimeSlots: 1,
                consultationFee: 1,
                bio: 1,
                profilePhoto: "$avatar",
                physioProfilePhoto: 1,
                contact: "$mobile_number",
                email: 1,
                createdAt: 1
            }
        },
        { $sort: sort }
    ]);
    const doctors = await User.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, doctors, "Doctors retrieved successfully.")
    );
});

const updateDoctorProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    const doctor = await Doctor.findOneAndUpdate(
        { userId },
        { $set: { name, qualification, specialization, experience } },
        { new: true, runValidators: true }
    );

    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, doctor, "Doctor profile updated successfully.")
    );
});

const deleteDoctorProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const doctor = await Doctor.findOneAndDelete({ _id: id, userId });

    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found or not authorized.");
    }

    return res.status(200).json(
        new ApiResponse(200, null, "Doctor profile deleted successfully.")
    );
});

const getAllPatients = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can view all patients.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Patient.aggregate([]);
    const patients = await Patient.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, patients, "Patients retrieved successfully.")
    );
});

/**
 * Get assigned patients and sessions for logged-in doctor
 */
const getMyPatientsAndSessions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only doctors can access this endpoint.");
    }

    // Find doctor profile
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    // Get doctor's name for patient assignment lookup
    const doctorName = doctor.name || req.user.Fullname;
    const doctorUserId = userId.toString();
    console.log(`[DEBUG] Doctor name for assignment lookup: ${doctorName}`);
    console.log(`[DEBUG] Doctor userId: ${doctorUserId}`);

    // Find all sessions assigned to this doctor
    const sessions = await Session.find({ doctorId: doctor._id })
        .populate('patientId', 'name mobile_number email surgeryType surgeryDate')
        .populate('physioId', 'name specialization mobile_number')
        .sort({ sessionDate: -1 });

    console.log(`[DEBUG] Found ${sessions.length} sessions for doctor ${doctor._id}`);

    // Get unique patients from sessions
    const uniquePatientIds = [...new Set(sessions.map(s => s.patientId?._id?.toString()).filter(Boolean))];
    console.log(`[DEBUG] Unique patient IDs from sessions: ${uniquePatientIds.length}`, uniquePatientIds);
    
    // ALSO find patients directly assigned to this doctor (not just from sessions)
    // assignedDoctor can be doctor name OR doctor ID, so check both
    const directlyAssignedPatients = await Patient.find({
        $or: [
            { assignedDoctor: doctorName },
            { assignedDoctor: doctorUserId },
            { assignedDoctor: doctor._id.toString() }
        ]
    })
    .populate('userId', 'Fullname mobile_number email userType gender dateOfBirth age')
    .lean();
    
    console.log(`[DEBUG] Found ${directlyAssignedPatients.length} patients directly assigned to doctor (name: "${doctorName}", userId: "${doctorUserId}")`);
    if (directlyAssignedPatients.length > 0) {
        console.log(`[DEBUG] Directly assigned patients:`, directlyAssignedPatients.map(p => ({
            _id: p._id,
            name: p.name,
            assignedDoctor: p.assignedDoctor
        })));
    }
    
    // Get patient IDs from directly assigned patients
    const directlyAssignedPatientIds = directlyAssignedPatients.map(p => p._id.toString());
    console.log(`[DEBUG] Directly assigned patient IDs:`, directlyAssignedPatientIds);
    
    // Find ALL referrals for this doctor first (for debugging)
    const allReferrals = await Referral.find({ doctorId: userId });
    console.log(`[DEBUG] Total referrals for doctor ${userId}: ${allReferrals.length}`);
    console.log(`[DEBUG] Referral statuses:`, allReferrals.map(r => ({ id: r._id, status: r.status, hasRegisteredPatientId: !!r.registeredPatientId })));
    
    // Find confirmed referrals (status: 'registered') for this doctor
    // Try both with and without registeredPatientId requirement
    const confirmedReferrals = await Referral.find({
        doctorId: userId,
        status: 'registered'
    }).populate('registeredPatientId', 'Fullname mobile_number email userType gender dateOfBirth age');

    console.log(`[DEBUG] Found ${confirmedReferrals.length} confirmed referrals (status='registered') for doctor ${userId}`);
    
    // Also check for referrals that might be registered but status not updated
    const referralsWithPatientId = await Referral.find({
        doctorId: userId,
        registeredPatientId: { $exists: true, $ne: null }
    }).populate('registeredPatientId', 'Fullname mobile_number email userType gender dateOfBirth age');
    
    console.log(`[DEBUG] Found ${referralsWithPatientId.length} referrals with registeredPatientId (any status)`);
    
    // Combine both sets, removing duplicates
    const allConfirmedReferrals = Array.from(
        new Map([
            ...confirmedReferrals.map(r => [r._id.toString(), r]),
            ...referralsWithPatientId.map(r => [r._id.toString(), r])
        ]).values()
    );
    
    console.log(`[DEBUG] Total unique confirmed referrals: ${allConfirmedReferrals.length}`);

    // Process each confirmed referral
    const referredPatients = [];
    
    for (const referral of allConfirmedReferrals) {
        const user = referral.registeredPatientId;
        
        // If no registeredPatientId, try to find user by phone or email
        let userToUse = user;
        if (!userToUse && (referral.patientPhone || referral.patientEmail)) {
            const foundUser = await User.findOne({
                $or: [
                    { mobile_number: referral.patientPhone },
                    { email: referral.patientEmail }
                ]
            });
            if (foundUser) {
                userToUse = foundUser;
                console.log(`[DEBUG] Found user by phone/email for referral ${referral._id}`);
            }
        }
        
        if (!userToUse) {
            // Create virtual patient from referral data only (no user)
            console.log(`[DEBUG] Referral ${referral._id} has no user, creating virtual patient from referral data`);
            const virtualPatient = {
                _id: new mongoose.Types.ObjectId(),
                userId: {
                    _id: null,
                    Fullname: referral.patientName,
                    mobile_number: referral.patientPhone,
                    email: referral.patientEmail || null
                },
                name: referral.patientName || 'Unknown',
                email: referral.patientEmail || null,
                mobileNumber: referral.patientPhone || '',
                gender: referral.patientGender || 'Other',
                surgeryType: referral.surgeryType || 'Other',
                surgeryDate: referral.surgeryDate || new Date(),
                currentCondition: referral.condition || 'Not specified',
                age: referral.patientAge || 0,
                dateOfBirth: null,
                isVirtual: true
            };
            referredPatients.push(virtualPatient);
            console.log(`[DEBUG] Created virtual patient from referral only:`, virtualPatient._id, virtualPatient.name);
            continue;
        }

        console.log(`[DEBUG] Processing referral for user:`, userToUse._id || userToUse);
        console.log(`[DEBUG] Referral data - Name: ${referral.patientName}, Phone: ${referral.patientPhone}, Email: ${referral.patientEmail}`);
        console.log(`[DEBUG] User data - Name: ${userToUse.Fullname}, Phone: ${userToUse.mobile_number}, Email: ${userToUse.email}`);

        // Try to find existing Patient document FIRST - Patient document is the source of truth
        const userIdToSearch = userToUse._id || userToUse;
        let patientDoc = await Patient.findOne({ userId: userIdToSearch })
            .populate('userId', 'Fullname mobile_number email')
            .lean();

        console.log(`[DEBUG] Patient document found:`, patientDoc ? 'Yes' : 'No');
        if (patientDoc) {
            console.log(`[DEBUG] Patient document mobileNumber:`, patientDoc.mobileNumber);
            console.log(`[DEBUG] Patient document userId.mobile_number:`, patientDoc.userId?.mobile_number);
        }

        if (patientDoc) {
            // Use existing Patient document - Patient document data takes priority over referral data
            // This ensures admin updates to patient data are reflected
            console.log(`[DEBUG] Using existing patient document:`, patientDoc._id);
            console.log(`[DEBUG] Using Patient document phone: ${patientDoc.mobileNumber || patientDoc.userId?.mobile_number} (not referral phone: ${referral.patientPhone})`);
            referredPatients.push(patientDoc);
        } else {
            // Create virtual patient entry from referral and user data ONLY if no Patient document exists
            // For virtual patients, prioritize referral data over user data since referral is the source of truth
            console.log(`[DEBUG] Creating virtual patient for user:`, userIdToSearch);
            
            const userObj = {
                _id: userToUse._id || userToUse,
                Fullname: referral.patientName || userToUse.Fullname, // Prefer referral name
                mobile_number: referral.patientPhone || userToUse.mobile_number, // Prefer referral phone
                email: referral.patientEmail || userToUse.email || null // Prefer referral email
            };
            
            const virtualPatientId = new mongoose.Types.ObjectId();
            
            const virtualPatient = {
                _id: virtualPatientId,
                userId: userObj, // This now has referral data prioritized
                name: referral.patientName || userToUse.Fullname || 'Unknown', // Prefer referral name
                email: referral.patientEmail || userToUse.email || null, // Prefer referral email
                mobileNumber: referral.patientPhone || userToUse.mobile_number || '', // Prefer referral phone
                gender: referral.patientGender || userToUse.gender || 'Other',
                surgeryType: referral.surgeryType || 'Other',
                surgeryDate: referral.surgeryDate || new Date(),
                currentCondition: referral.condition || 'Not specified',
                age: referral.patientAge || userToUse.age || 0,
                dateOfBirth: userToUse.dateOfBirth || null,
                isVirtual: true,
                referralId: referral._id, // Store referral ID for reference
                originalUserId: userIdToSearch // Store original userId for session matching
            };
            referredPatients.push(virtualPatient);
            console.log(`[DEBUG] Created virtual patient:`, {
                _id: virtualPatient._id,
                name: virtualPatient.name,
                phone: virtualPatient.mobileNumber,
                userId: userIdToSearch,
                referralId: referral._id
            });
        }
    }

    console.log(`[DEBUG] Processed ${referredPatients.length} referred patients`);

    // Combine patient IDs from sessions and directly assigned
    const allPatientIdsFromSessionsAndAssigned = [...new Set([...uniquePatientIds, ...directlyAssignedPatientIds])];
    console.log(`[DEBUG] Total patient IDs (sessions + directly assigned): ${allPatientIdsFromSessionsAndAssigned.length}`);
    
    // Fetch all real patients (from sessions AND directly assigned)
    const patientsFromSessions = allPatientIdsFromSessionsAndAssigned.length > 0
        ? await Patient.find({ _id: { $in: allPatientIdsFromSessionsAndAssigned } })
            .populate('userId', 'Fullname mobile_number email')
            .lean()
        : [];
    
    // Also add directly assigned patients that might not have been in the query above
    const allPatientsFromSessions = [...patientsFromSessions];
    directlyAssignedPatients.forEach(assignedPatient => {
        const exists = allPatientsFromSessions.find(p => p._id.toString() === assignedPatient._id.toString());
        if (!exists) {
            allPatientsFromSessions.push(assignedPatient);
        }
    });
    
    console.log(`[DEBUG] Total patients from sessions and direct assignment: ${allPatientsFromSessions.length}`);

    // Create a map to track patients by userId to avoid duplicates
    const patientMap = new Map();
    
    // Add patients from sessions and direct assignment
    allPatientsFromSessions.forEach(patient => {
        const userId = patient.userId?._id?.toString() || patient.userId?.toString();
        if (userId) {
            patientMap.set(userId, patient);
        } else {
            // If no userId, use _id as fallback
            patientMap.set(patient._id.toString(), patient);
        }
    });
    
    // Add referred patients (only if not already in map)
    referredPatients.forEach(patient => {
        const userId = patient.userId?._id?.toString() || patient.userId?.toString();
        const patientId = patient._id?.toString();
        
        // Check if patient already exists by userId
        if (userId && !patientMap.has(userId)) {
            patientMap.set(userId, patient);
        } else if (!userId && patientId && !patientMap.has(patientId)) {
            // Fallback to _id if no userId
            patientMap.set(patientId, patient);
        }
    });
    
    // Convert map to array
    const allPatients = Array.from(patientMap.values());
    
    console.log(`[DEBUG] Total patients: ${allPatients.length} (${patientsFromSessions.length} from sessions, ${referredPatients.length} from referrals, ${patientMap.size} unique)`);
    console.log(`[DEBUG] Virtual patients: ${referredPatients.filter(p => p.isVirtual).length}`);

    // For virtual patients, try to find their Patient documents by userId to get sessions
    const virtualPatientUserIds = allPatients
        .filter(p => p.isVirtual)
        .map(p => p.userId?._id?.toString() || p.userId?.toString())
        .filter(Boolean);
    
    console.log(`[DEBUG] Virtual patient user IDs:`, virtualPatientUserIds);
    
    // Find Patient documents for virtual patients
    const patientDocsForVirtual = virtualPatientUserIds.length > 0
        ? await Patient.find({ userId: { $in: virtualPatientUserIds } })
            .populate('userId', 'Fullname mobile_number email')
            .lean()
        : [];
    
    console.log(`[DEBUG] Found ${patientDocsForVirtual.length} Patient documents for virtual patients`);
    
    // Get all patient IDs including newly found Patient documents
    const realPatientIds = [...uniquePatientIds, ...patientDocsForVirtual.map(p => p._id.toString())];
    const allPatientIds = [...new Set([...realPatientIds, ...allPatients.map(p => p._id?.toString()).filter(Boolean)])];
    
    console.log(`[DEBUG] All patient IDs to search sessions for:`, allPatientIds.length);
    
    // Find all sessions for all patients by patientId
    const allSessionsForPatients = allPatientIds.length > 0
        ? await Session.find({
            doctorId: doctor._id,
            patientId: { $in: allPatientIds }
        })
        .populate({
            path: 'patientId',
            select: 'name mobile_number email surgeryType surgeryDate userId',
            populate: {
                path: 'userId',
                select: '_id Fullname mobile_number email'
            }
        })
        .populate('physioId', 'name specialization mobile_number')
        .sort({ sessionDate: -1 })
        .lean()
        : [];
    
    // Also find sessions for virtual patients by userId (in case sessions are linked to users)
    const sessionsForVirtualByUserId = virtualPatientUserIds.length > 0
        ? await Session.find({
            doctorId: doctor._id
        })
        .populate({
            path: 'patientId',
            select: 'name mobile_number email surgeryType surgeryDate userId',
            populate: {
                path: 'userId',
                select: '_id Fullname mobile_number email'
            }
        })
        .populate('physioId', 'name specialization mobile_number')
        .sort({ sessionDate: -1 })
        .lean()
        .then(allSessions => allSessions.filter(s => {
            const sessionUserId = s.patientId?.userId?._id?.toString() || s.patientId?.userId?.toString();
            return virtualPatientUserIds.includes(sessionUserId);
        }))
        .catch(() => [])
        : [];
    
    console.log(`[DEBUG] Sessions found by patientId: ${allSessionsForPatients.length}, by userId: ${sessionsForVirtualByUserId.length}`);
    
    // Combine sessions, removing duplicates
    const allSessionsMap = new Map();
    sessions.forEach(s => {
        allSessionsMap.set(s._id.toString(), s);
    });
    allSessionsForPatients.forEach(s => {
        allSessionsMap.set(s._id.toString(), s);
    });
    sessionsForVirtualByUserId.forEach(s => {
        allSessionsMap.set(s._id.toString(), s);
    });
    let uniqueSessions = Array.from(allSessionsMap.values());
    
    // Update missed sessions before returning
    uniqueSessions = await updateMissedSessions(uniqueSessions);
    
    console.log(`[DEBUG] Total unique sessions: ${uniqueSessions.length}`);
    
    // Replace virtual patients with real Patient documents if found
    const finalPatients = allPatients.map(patient => {
        if (patient.isVirtual) {
            const realPatient = patientDocsForVirtual.find(
                p => (p.userId?._id?.toString() || p.userId?.toString()) === (patient.userId?._id?.toString() || patient.userId?.toString())
            );
            if (realPatient) {
                return realPatient;
            }
        }
        return patient;
    });
    
    // Remove duplicates again after replacing virtual patients
    const finalPatientMap = new Map();
    finalPatients.forEach(patient => {
        const userId = patient.userId?._id?.toString() || patient.userId?.toString();
        const patientId = patient._id?.toString();
        if (userId && !finalPatientMap.has(userId)) {
            finalPatientMap.set(userId, patient);
        } else if (!userId && patientId && !finalPatientMap.has(patientId)) {
            finalPatientMap.set(patientId, patient);
        }
    });
    const deduplicatedPatients = Array.from(finalPatientMap.values());
    
    // Enhance patient data with session counts
    const patientsWithStats = deduplicatedPatients.map(patient => {
        const patientId = patient._id?.toString();
        const patientUserId = patient.userId?._id?.toString() || patient.userId?.toString();
        // For virtual patients, use originalUserId if available for better session matching
        const userIdForMatching = patient.originalUserId?.toString() || patientUserId;
        
        // Find sessions by patient _id OR by userId (for virtual patients)
        const patientSessions = uniqueSessions.filter(s => {
            if (!s.patientId) return false;
            const sessionPatientId = s.patientId?._id?.toString() || s.patientId?.toString();
            const sessionUserId = s.patientId?.userId?._id?.toString() || s.patientId?.userId?.toString();
            
            // Match by patientId (for real Patient documents)
            if (sessionPatientId === patientId) {
                console.log(`[DEBUG] Matched session ${s._id} by patientId: ${sessionPatientId}`);
                return true;
            }
            
            // Match by userId (for virtual patients or when patientId doesn't match)
            if (patient.isVirtual && sessionUserId === userIdForMatching) {
                console.log(`[DEBUG] Matched session ${s._id} by userId: ${sessionUserId} for virtual patient`);
                return true;
            }
            
            return false;
        });
        
        console.log(`[DEBUG] Patient ${patient.name || patient.userId?.Fullname} (${patient.isVirtual ? 'virtual' : 'real'}, userId: ${userIdForMatching}) has ${patientSessions.length} sessions`);
        
        const completedSessions = patientSessions.filter(s => s.status === 'completed').length;
        const upcomingSessions = patientSessions.filter(s => new Date(s.sessionDate) > new Date()).length;
        
        const enhancedPatient = {
            ...patient,
            totalSessions: patientSessions.length,
            completedSessions,
            upcomingSessions,
            lastSession: patientSessions[0]?.sessionDate || null
        };
        
        console.log(`[DEBUG] Enhanced patient:`, {
            _id: enhancedPatient._id?.toString(),
            name: enhancedPatient.name || enhancedPatient.userId?.Fullname,
            isVirtual: enhancedPatient.isVirtual,
            totalSessions: enhancedPatient.totalSessions,
            userId: patientUserId
        });
        
        return enhancedPatient;
    });

    console.log(`[DEBUG] Final patientsWithStats count:`, patientsWithStats.length);
    console.log(`[DEBUG] Final unique sessions count:`, uniqueSessions.length);
    console.log(`[DEBUG] Patients from sessions: ${patientsFromSessions.length}, Referred patients: ${referredPatients.length}`);
    
    if (patientsWithStats.length > 0) {
        console.log(`[DEBUG] Sample patient data:`, {
            _id: patientsWithStats[0]._id?.toString(),
            name: patientsWithStats[0].name || patientsWithStats[0].userId?.Fullname,
            totalSessions: patientsWithStats[0].totalSessions,
            isVirtual: patientsWithStats[0].isVirtual,
            hasUserId: !!patientsWithStats[0].userId
        });
    } else {
        console.log(`[WARNING] No patients found! Sessions: ${sessions.length}, Referrals: ${allReferrals.length}, Confirmed: ${allConfirmedReferrals.length}`);
    }

    // Ensure we always return an array, even if empty
    const finalPatientsArray = Array.isArray(patientsWithStats) ? patientsWithStats : [];
    const finalSessionsArray = Array.isArray(uniqueSessions) ? uniqueSessions : [];

    return res.status(200).json(
        new ApiResponse(200, {
            patients: finalPatientsArray,
            sessions: finalSessionsArray,
            stats: {
                totalPatients: finalPatientsArray.length,
                totalSessions: finalSessionsArray.length,
                upcomingSessions: finalSessionsArray.filter(s => new Date(s.sessionDate) > new Date()).length,
                completedSessions: finalSessionsArray.filter(s => s.status === 'completed').length
            }
        }, "Patients and sessions retrieved successfully.")
    );
});

export { createDoctorProfile, getDoctorProfile, getAllDoctors, updateDoctorProfile, deleteDoctorProfile, getAllPatients, getMyPatientsAndSessions };
