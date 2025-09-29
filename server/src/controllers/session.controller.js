import mongoose from 'mongoose';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Session } from "../models/sessions.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createSession = asyncHandler(async (req, res) => {
    const { patientId, doctorId, physioId, surgeryType, amountPaid, totalSessions } = req.body;

    if (!['doctor', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only doctors and admins can create sessions.");
    }

    if (!patientId || !doctorId || !physioId || !surgeryType || !amountPaid || !totalSessions) {
        throw new ApiError(400, "All fields are required.");
    }

    const session = await Session.create({
        patientId,
        doctorId,
        physioId,
        surgeryType,
        amountPaid,
        totalSessions
    });

    return res.status(201).json(
        new ApiResponse(201, session, "Session created successfully.")
    );
});

const getCompletedSessions = asyncHandler(async (req, res) => {
    if (!['doctor', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only doctors and admins can view this information.");
    }

    const { patientId, doctorId, physioId } = req.query;
    const { page = 1, limit = 10 } = req.query;

    const match = { status: 'completed' };
    if (patientId) match.patientId = new mongoose.Types.ObjectId(patientId);
    if (doctorId) match.doctorId = new mongoose.Types.ObjectId(doctorId);
    if (physioId) match.physioId = new mongoose.Types.ObjectId(physioId);

    const aggregate = Session.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "patients",
                localField: "patientId",
                foreignField: "_id",
                as: "patient"
            }
        },
        {
            $lookup: {
                from: "doctors",
                localField: "doctorId",
                foreignField: "_id",
                as: "doctor"
            }
        },
        {
            $lookup: {
                from: "physios",
                localField: "physioId",
                foreignField: "_id",
                as: "physio"
            }
        },
        {
            $unwind: "$patient"
        },
        {
            $unwind: "$doctor"
        },
        {
            $unwind: "$physio"
        },
        {
            $project: {
                "patient.name": 1,
                "doctor.name": 1,
                "physio.name": 1,
                "patient.address": 1,
                surgeryType: 1,
                amountPaid: 1,
                totalSessions: 1,
            }
        }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const sessions = await Session.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, sessions, "Completed sessions retrieved successfully.")
    );
});

export { createSession, getCompletedSessions };