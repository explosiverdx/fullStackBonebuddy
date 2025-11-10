import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Physio } from "../models/physio.models.js";
import { Appointment } from "../models/appointments.models.js";
import { Session } from "../models/sessions.models.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPhysioProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only users with the 'physio' role can create a physio profile.");
    }

    const existingPhysio = await Physio.findOne({ userId });
    if (existingPhysio) {
        throw new ApiError(409, "A physio profile for this user already exists.");
    }

    if ([name, qualification, specialization].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, qualification, and specialization are required fields.");
    }

    const physio = await Physio.create({
        userId,
        name,
        qualification,
        specialization,
        experience
    });

    return res.status(201).json(
        new ApiResponse(201, physio, "Physio profile created successfully.")
    );
});

const getPhysioProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const physio = await Physio.findOne({ userId });

    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, physio, "Physio profile retrieved successfully.")
    );
});

const getAllPhysios = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '', sortBy = 'name', sortOrder = 'asc' } = req.query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const match = { userType: { $in: ['physio', 'physiotherapist'] } };
    if (search) {
        match.$or = [
            { Fullname: { $regex: search, $options: 'i' } },
            { specialization: { $regex: search, $options: 'i' } }
        ];
    }

    const sort = {};
    sort[sortBy === 'name' ? 'Fullname' : sortBy] = sortOrder === 'asc' ? 1 : -1;

    const physios = await User.find(match)
        .select('_id Fullname qualification specialization experience availableDays availableTimeSlots consultationFee bio avatar mobile_number email createdAt')
        .sort(sort)
        .skip(skip)
        .limit(limitNum);

    const totalPhysios = await User.countDocuments(match);
    const totalPages = Math.ceil(totalPhysios / limitNum);

    // Get physio documents to map userId to physioId for appointments
    const physioIds = await Physio.find({ userId: { $in: physios.map(p => p._id) } }).select('userId _id');
    const physioMap = new Map(physioIds.map(p => [p.userId.toString(), p._id]));

    // Count patients assigned (via appointments) for each physio
    const patientsCounts = await Promise.all(physios.map(async (doc) => {
        const physioId = physioMap.get(doc._id.toString());
        if (physioId) {
            return await Appointment.countDocuments({ physioId });
        }
        return 0;
    }));

    const result = {
        docs: physios.map((physio, index) => ({
            _id: physio._id,
            name: physio.Fullname,
            qualification: physio.qualification,
            specialization: physio.specialization,
            experience: physio.experience,
            availableDays: physio.availableDays,
            availableTimeSlots: physio.availableTimeSlots,
            consultationFee: physio.consultationFee,
            bio: physio.bio,
            profilePhoto: physio.avatar,
            physioProfilePhoto: physio.avatar,
            contact: physio.mobile_number,
            email: physio.email,
            createdAt: physio.createdAt,
            patientsAssigned: patientsCounts[index],
            assignedDoctor: 'N/A' // Placeholder, as not implemented yet
        })),
        totalDocs: totalPhysios,
        limit: limitNum,
        page: pageNum,
        totalPages,
        pagingCounter: skip + 1,
        hasPrevPage: pageNum > 1,
        hasNextPage: pageNum < totalPages,
        prevPage: pageNum > 1 ? pageNum - 1 : null,
        nextPage: pageNum < totalPages ? pageNum + 1 : null
    };

    return res.status(200).json(
        new ApiResponse(200, result, "Physios retrieved successfully.")
    );
});

const updatePhysioProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    const physio = await Physio.findOneAndUpdate(
        { userId },
        { $set: { name, qualification, specialization, experience } },
        { new: true, runValidators: true }
    );

    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, physio, "Physio profile updated successfully.")
    );
});

const deletePhysio = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    // Check if the physio profile exists and belongs to the user
    const physio = await Physio.findOne({ userId });
    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    // Delete the physio profile
    await Physio.findByIdAndDelete(physio._id);

    return res.status(200).json(
        new ApiResponse(200, null, "Physio profile deleted successfully.")
    );
});

const adminCreatePhysio = asyncHandler(async (req, res) => {
    const { fullName, mobile_number, email, gender, dateOfBirth, age, address, specialization, experience, qualification, availableDays, availableTimeSlots, consultationFee, bio } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can create physiotherapist accounts.");
    }

    if ([fullName, mobile_number, gender, dateOfBirth, age, address.city, address.state, address.pincode, specialization, qualification].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "All required fields must be provided.");
    }

    // Check if mobile_number or email already exists
    const existingUser = await User.findOne({ $or: [{ mobile_number }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User with this mobile number or email already exists.");
    }

    // Create user
    const user = await User.create({
        mobile_number,
        email,
        userType: 'physio',
        Fullname: fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        age,
        address,
        specialization,
        experience,
        qualification,
        availableDays,
        availableTimeSlots,
        consultationFee,
        bio
    });

    // Create physio profile
    const physio = await Physio.create({
        userId: user._id,
        name: fullName,
        qualification,
        specialization,
        experience
    });

    return res.status(201).json(
        new ApiResponse(201, { user, physio }, "Physiotherapist created successfully.")
    );
});

const adminUpdatePhysio = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name, qualification, specialization, experience, availableDays, availableTimeSlots, consultationFee, bio } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can update physiotherapist profiles.");
    }

    // Update User fields
    const userUpdate = {};
    if (availableDays) userUpdate.availableDays = availableDays;
    if (availableTimeSlots) userUpdate.availableTimeSlots = availableTimeSlots;
    if (consultationFee !== undefined) userUpdate.consultationFee = consultationFee;
    if (bio) userUpdate.bio = bio;
    if (specialization) userUpdate.specialization = specialization;
    if (experience !== undefined) userUpdate.experience = experience;
    if (qualification) userUpdate.qualification = qualification;
    if (name) userUpdate.Fullname = name;

    await User.findByIdAndUpdate(id, { $set: userUpdate }, { runValidators: true });

    // Update Physio profile
    const physioUpdate = {};
    if (name) physioUpdate.name = name;
    if (qualification) physioUpdate.qualification = qualification;
    if (specialization) physioUpdate.specialization = specialization;
    if (experience !== undefined) physioUpdate.experience = experience;

    const physio = await Physio.findOneAndUpdate(
        { userId: id },
        { $set: physioUpdate },
        { new: true, runValidators: true }
    );

    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, physio, "Physiotherapist updated successfully.")
    );
});

/**
 * Get assigned patients and sessions for logged-in physiotherapist
 */
const getMyPatientsAndSessions = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists can access this endpoint.");
    }

    // Find physio profile
    const physio = await Physio.findOne({ userId });
    if (!physio) {
        throw new ApiError(404, "Physiotherapist profile not found.");
    }

    // Find all sessions assigned to this physiotherapist
    const sessions = await Session.find({ physioId: physio._id })
        .populate('patientId', 'name mobile_number email surgeryType surgeryDate')
        .populate('doctorId', 'name specialization mobile_number')
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

export { createPhysioProfile, getPhysioProfile, getAllPhysios, updatePhysioProfile, deletePhysio, adminCreatePhysio, adminUpdatePhysio, getMyPatientsAndSessions };
