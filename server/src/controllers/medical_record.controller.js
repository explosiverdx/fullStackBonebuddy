import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { MedicalRecord } from "../models/medical_record.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createMedicalRecord = asyncHandler(async (req, res) => {
    const { patientId, visitDate, diagnosis, treatment, notes } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can create medical records.");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found. Please create a doctor profile first.");
    }

    if (!patientId || !visitDate || !diagnosis || !treatment) {
        throw new ApiError(400, "Patient ID, visit date, diagnosis, and treatment are required.");
    }

    const medicalRecord = await MedicalRecord.create({
        patientId,
        doctorId: doctor._id,
        visitDate,
        diagnosis,
        treatment,
        notes
    });

    return res.status(201).json(
        new ApiResponse(201, medicalRecord, "Medical record created successfully.")
    );
});

const getPatientMedicalRecords = asyncHandler(async (req, res) => {
    const { patientId } = req.params;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can view medical records.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = MedicalRecord.aggregate([
        {
            $match: {
                patientId: new mongoose.Types.ObjectId(patientId)
            }
        }
    ]);

    const medicalRecords = await MedicalRecord.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, medicalRecords, "Medical records retrieved successfully.")
    );
});

const getMyMedicalRecords = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can view their medical records.");
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = MedicalRecord.aggregate([
        {
            $match: {
                patientId: patient._id
            }
        }
    ]);

    const medicalRecords = await MedicalRecord.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, medicalRecords, "Medical records retrieved successfully.")
    );
});

export { createMedicalRecord, getPatientMedicalRecords, getMyMedicalRecords };