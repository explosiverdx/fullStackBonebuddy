import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPatientProfile = asyncHandler(async (req, res) => {
    const { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can create a patient profile.");
    }

    const existingPatient = await Patient.findOne({ userId });
    if (existingPatient) {
        throw new ApiError(409, "A patient profile for this user already exists.");
    }

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

    return res.status(201).json(
        new ApiResponse(201, patient, "Patient profile created successfully.")
    );
});

const getPatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const patient = await Patient.findOne({ userId });

    if (!patient) {
        throw new ApiError(404, "Patient profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient profile retrieved successfully.")
    );
});

const getAllPatients = asyncHandler(async (req, res) => {
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

const updatePatientProfile = asyncHandler(async (req, res) => {
    const { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber } = req.body;
    const userId = req.user._id;

    const patient = await Patient.findOneAndUpdate(
        { userId },
        { $set: { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber } },
        { new: true, runValidators: true }
    );

    if (!patient) {
        throw new ApiError(404, "Patient profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient profile updated successfully.")
    );
});

export { createPatientProfile, getPatientProfile, getAllPatients, updatePatientProfile };