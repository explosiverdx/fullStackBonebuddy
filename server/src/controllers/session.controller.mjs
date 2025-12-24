import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/ApiError.js";
import { Session } from "../models/sessions.models.js";
import { ApiResponse } from '../utils/ApiResponse.js';

const getMySessions = asyncHandler(async (req, res) => {
    // Only patients should call this to fetch their own sessions
    if (req.user.userType !== 'patient') {
        throw new ApiError(403, 'Only patients can fetch their own sessions');
    }


    const { Patient } = await import('../models/patient.models.js');
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
        return res.status(200).json(new ApiResponse(200, [], 'No sessions'));
    }

    const sessions = await Session.find({ patientId: patient._id }).sort({ sessionDate: 1 }).lean();

    return res.status(200).json(new ApiResponse(200, sessions, 'Sessions fetched successfully'));
});

const createSession = asyncHandler(async (req, res) => {
    const { patientId, doctorId, physioId, surgeryType, amountPaid, totalSessions, sessionDate, durationMinutes } = req.body;

    // Temporary debug logs for session allocation flow (remove after debugging)
    console.log('[createSession] incoming request by user:', { userId: req.user?._id, userType: req.user?.userType });
    console.log('[createSession] body:', { patientId, doctorId, physioId, surgeryType, amountPaid, totalSessions });
    try {
        const logDir = path.join(process.cwd(), 'logs');
        if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
        const logFile = path.join(logDir, 'session_alloc.log');
        const entry = `${new Date().toISOString()} - REQUEST - user:${req.user?._id || 'anon'} type:${req.user?.userType || 'unknown'} body:${JSON.stringify({ patientId, doctorId, physioId, surgeryType, amountPaid, totalSessions })}\n`;
        fs.appendFileSync(logFile, entry);
    } catch (e) {
        console.error('[createSession] failed to write log file', e && e.message ? e.message : e);
    }

    if (!['doctor', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only doctors and admins can create sessions.");
    }

    if (!patientId || !doctorId || !physioId || !surgeryType || !amountPaid || !totalSessions) {
        throw new ApiError(400, "All fields are required.");
    }

    // Start a transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Verify that all referenced entities exist
        const [Patient, Doctor, Physio] = await Promise.all([
            import('../models/patient.models.js').then(m => m.Patient),
            import('../models/doctor.models.js').then(m => m.Doctor),
            import('../models/physio.models.js').then(m => m.Physio)
        ]);

        const [patientExists, doctorExists, physioExists] = await Promise.all([
            Patient.exists({ _id: patientId }),
            Doctor.exists({ _id: doctorId }),
            Physio.exists({ _id: physioId })
        ]);

        if (!patientExists || !doctorExists || !physioExists) {
            console.error('[createSession] referenced entity missing', { patientExists, doctorExists, physioExists });
            try { fs.appendFileSync(path.join(process.cwd(), 'logs', 'session_alloc.log'), `${new Date().toISOString()} - REFERENCED_MISSING - ${JSON.stringify({ patientExists, doctorExists, physioExists })}\n`); } catch (e) {}
            throw new ApiError(404, "One or more referenced entities do not exist.");
        }

        // Create the session within the transaction
        const newSession = await Session.create([{
            patientId,
            doctorId,
            physioId,
            surgeryType,
            amountPaid,
            totalSessions,
            sessionDate: sessionDate ? new Date(sessionDate) : new Date(),
            durationMinutes: durationMinutes != null ? Number(durationMinutes) : 60,
            createdBy: req.user._id
        }], { session });

        await session.commitTransaction();

        return res.status(201).json(
            new ApiResponse(201, newSession[0], "Session created successfully.")
        );
    } catch (error) {
        await session.abortTransaction();
        console.error('[createSession] error creating session:', error && error.message ? error.message : error);
        try { fs.appendFileSync(path.join(process.cwd(), 'logs', 'session_alloc.log'), `${new Date().toISOString()} - ERROR - ${error && error.message ? error.message : JSON.stringify(error)}\n`); } catch (e) {}
        throw error;
    } finally {
        session.endSession();
    }
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

// Admin: list sessions (all) with pagination and optional filters
const listSessionsAdmin = asyncHandler(async (req, res) => {
    if (!['admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only admins can view sessions list.");
    }

    const { patientId, doctorId, physioId, status, page = 1, limit = 10, search } = req.query;

    const match = {};

    if (patientId) match.patientId = new mongoose.Types.ObjectId(patientId);
    if (doctorId) match.doctorId = new mongoose.Types.ObjectId(doctorId);
    if (physioId) match.physioId = new mongoose.Types.ObjectId(physioId);
    if (status) match.status = status;

    let pipeline = [
        { $match: match },
        { $sort: { sessionDate: -1 } },
        {
            $lookup: {
                from: 'patients', localField: 'patientId', foreignField: '_id', as: 'patient'
            }
        },
        {
            $lookup: {
                from: 'doctors', localField: 'doctorId', foreignField: '_id', as: 'doctor'
            }
        },
        {
            $lookup: {
                from: 'physios', localField: 'physioId', foreignField: '_id', as: 'physio'
            }
        },
        { $unwind: { path: '$patient', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$doctor', preserveNullAndEmptyArrays: true } },
        { $unwind: { path: '$physio', preserveNullAndEmptyArrays: true } },
    ];

    if (search) {
        pipeline.push({
            $match: {
                $or: [
                    { 'patient.name': { $regex: search, $options: 'i' } },
                    { 'patient.mobileNumber': { $regex: search, $options: 'i' } }
                ]
            }
        });
    }

    pipeline.push(
        {
            $project: {
                patient: { name: '$patient.name', _id: '$patient._id', mobileNumber: '$patient.mobileNumber' },
                doctor: { name: '$doctor.name', _id: '$doctor._id' },
                physio: { name: '$physio.name', _id: '$physio._id' },
                surgeryType: 1,
                amountPaid: 1,
                totalSessions: 1,
                completedSessions: 1,
                sessionDate: 1,
                status: 1,
                durationMinutes: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    );
    const aggregate = Session.aggregate(pipeline);
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const sessions = await Session.aggregatePaginate(aggregate, options);
    return res.status(200).json(new ApiResponse(200, sessions, 'Sessions listed successfully.'));
});


const updateSessionAdmin = asyncHandler(async (req, res) => {
    if (!['admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only admins can update sessions.");
    }
    const { id } = req.params;
    const update = {};
    const allowed = ['sessionDate', 'status', 'durationMinutes', 'surgeryType', 'amountPaid', 'totalSessions', 'completedSessions'];
    for (const k of allowed) if (req.body[k] !== undefined) update[k] = req.body[k];

    if (update.sessionDate) update.sessionDate = new Date(update.sessionDate);

    const updated = await Session.findByIdAndUpdate(id, update, { new: true });
    if (!updated) throw new ApiError(404, 'Session not found');
    return res.status(200).json(new ApiResponse(200, updated, 'Session updated successfully'));
});


const deleteSessionAdmin = asyncHandler(async (req, res) => {
    if (!['admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only admins can delete sessions.");
    }
    const { id } = req.params;
    const deleted = await Session.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Session not found');
    return res.status(200).json(new ApiResponse(200, {}, 'Session deleted successfully'));
});

export { createSession, getCompletedSessions, getMySessions, listSessionsAdmin, updateSessionAdmin, deleteSessionAdmin };