import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
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
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Doctor.aggregate([]);
    const doctors = await Doctor.aggregatePaginate(aggregate, options);

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

export { createDoctorProfile, getDoctorProfile, getAllDoctors, updateDoctorProfile, getAllPatients };