import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
import { User } from "../models/user.models.js";
import { Session } from "../models/sessions.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

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

    // Find all sessions assigned to this doctor
    const sessions = await Session.find({ doctorId: doctor._id })
        .populate('patientId', 'name mobile_number email surgeryType surgeryDate')
        .populate('physioId', 'name specialization mobile_number')
        .sort({ sessionDate: -1 });

    // Get unique patients from sessions
    const uniquePatientIds = [...new Set(sessions.map(s => s.patientId?._id?.toString()).filter(Boolean))];
    
    const patients = await Patient.find({ _id: { $in: uniquePatientIds } })
        .populate('userId', 'Fullname mobile_number email')
        .lean();

    // Enhance patient data with session counts
    const patientsWithStats = patients.map(patient => {
        const patientSessions = sessions.filter(s => s.patientId?._id?.toString() === patient._id.toString());
        const completedSessions = patientSessions.filter(s => s.status === 'completed').length;
        const upcomingSessions = patientSessions.filter(s => new Date(s.sessionDate) > new Date()).length;
        
        return {
            ...patient,
            totalSessions: patientSessions.length,
            completedSessions,
            upcomingSessions,
            lastSession: patientSessions[0]?.sessionDate
        };
    });

    return res.status(200).json(
        new ApiResponse(200, {
            patients: patientsWithStats,
            sessions,
            stats: {
                totalPatients: uniquePatientIds.length,
                totalSessions: sessions.length,
                upcomingSessions: sessions.filter(s => new Date(s.sessionDate) > new Date()).length,
                completedSessions: sessions.filter(s => s.status === 'completed').length
            }
        }, "Patients and sessions retrieved successfully.")
    );
});

export { createDoctorProfile, getDoctorProfile, getAllDoctors, updateDoctorProfile, deleteDoctorProfile, getAllPatients, getMyPatientsAndSessions };
