import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ProgressReport } from "../models/progressreports.models.js";
import { Physio } from "../models/physio.models.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createProgressReport = asyncHandler(async (req, res) => {
    const { patientId, doctorId, reportDate, content, status } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'physio') {
        throw new ApiError(403, "Only users with the 'physio' role can create progress reports.");
    }

    const physio = await Physio.findOne({ userId });
    if (!physio) {
        throw new ApiError(404, "Physio profile not found. Please create a physio profile first.");
    }

    if (!patientId || !doctorId || !reportDate || !content) {
        throw new ApiError(400, "Patient ID, doctor ID, report date, and content are required.");
    }

    const progressReport = await ProgressReport.create({
        patientId,
        physioId: physio._id,
        doctorId,
        reportDate,
        content,
        status
    });

    return res.status(201).json(
        new ApiResponse(201, progressReport, "Progress report created successfully.")
    );
});

const getPhysioProgressReports = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'physio') {
        throw new ApiError(403, "Only users with the 'physio' role can view progress reports.");
    }

    const physio = await Physio.findOne({ userId });
    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = ProgressReport.aggregate([
        {
            $match: {
                physioId: physio._id
            }
        }
    ]);

    const progressReports = await ProgressReport.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, progressReports, "Progress reports retrieved successfully.")
    );
});

const getPatientProgressReportsForDoctor = asyncHandler(async (req, res) => {
    const { patientId } = req.params;
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can view patient progress reports.");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = ProgressReport.aggregate([
        {
            $match: {
                patientId: new mongoose.Types.ObjectId(patientId),
                doctorId: doctor._id
            }
        }
    ]);

    const progressReports = await ProgressReport.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, progressReports, "Patient progress reports retrieved successfully.")
    );
});

const getPatientProgressReports = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can view their progress reports.");
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

    const aggregate = ProgressReport.aggregate([
        {
            $match: {
                patientId: patient._id
            }
        }
    ]);

    const progressReports = await ProgressReport.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, progressReports, "Progress reports retrieved successfully.")
    );
});

export { createProgressReport, getPhysioProgressReports, getPatientProgressReportsForDoctor, getPatientProgressReports };