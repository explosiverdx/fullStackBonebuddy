import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Session } from "../models/sessions.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// In-memory storage for session OTPs
// Format: { sessionId_type: { otp: string, expires: timestamp, phone: string } }
const sessionOtpStore = new Map();

/**
 * Helper function to check and update missed sessions
 * A session is missed if:
 * - sessionDate has passed
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

const getMySessions = asyncHandler(async (req, res) => {
    // Only patients should call this to fetch their own sessions
    if (req.user.userType !== 'patient') {
        throw new ApiError(403, 'Only patients can fetch their own sessions');
    }

    // Find patient doc corresponding to this user
    const { Patient } = await import('../models/patient.models.js');
    const patient = await Patient.findOne({ userId: req.user._id });
    if (!patient) {
        return res.status(200).json(new ApiResponse(200, [], 'No sessions'));
    }

    const sessions = await Session.find({ patientId: patient._id }).sort({ sessionDate: 1 }).lean();
    
    // Update missed sessions
    await updateMissedSessions(sessions);

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

    const { page = 1, limit = 20, patientId, doctorId, physioId, status, search } = req.query;

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
            $match: { 'patient.name': { $regex: search, $options: 'i' } }
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
                startTime: 1,
                endTime: 1,
                actualDuration: 1,
                sessionVideo: 1,
                notes: 1,
                createdAt: 1,
                updatedAt: 1
            }
        }
    );

    const aggregate = Session.aggregate(pipeline);
    const options = { page: parseInt(page, 10), limit: parseInt(limit, 10) };
    const sessionsResult = await Session.aggregatePaginate(aggregate, options);
    
    // Update missed sessions before returning
    if (sessionsResult.docs && sessionsResult.docs.length > 0) {
        await updateMissedSessions(sessionsResult.docs);
        // Re-fetch to get updated statuses
        const updatedAggregate = Session.aggregate(pipeline);
        const updatedSessions = await Session.aggregatePaginate(updatedAggregate, options);
        return res.status(200).json(new ApiResponse(200, updatedSessions, 'Sessions listed successfully.'));
    }
    
    return res.status(200).json(new ApiResponse(200, sessionsResult, 'Sessions listed successfully.'));
});

// Admin: update a session (editable fields: sessionDate, status, durationMinutes, surgeryType)
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

// Admin: delete a session
const deleteSessionAdmin = asyncHandler(async (req, res) => {
    if (!['admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only admins can delete sessions.");
    }
    const { id } = req.params;
    const deleted = await Session.findByIdAndDelete(id);
    if (!deleted) throw new ApiError(404, 'Session not found');
    return res.status(200).json(new ApiResponse(200, {}, 'Session deleted successfully'));
});

/**
 * Send OTP to patient for session start
 */
const sendSessionStartOtp = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists can send session OTP.");
    }

    if (!sessionId) {
        throw new ApiError(400, "Session ID is required.");
    }

    const session = await Session.findById(sessionId).populate('patientId');
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Verify this physiotherapist is assigned to this session
    const { Physio } = await import('../models/physio.models.js');
    const physio = await Physio.findOne({ userId: req.user._id });
    
    if (!physio || session.physioId.toString() !== physio._id.toString()) {
        throw new ApiError(403, "You are not authorized to send OTP for this session.");
    }

    // Check if session can be started
    if (session.status === 'completed') {
        throw new ApiError(400, "This session has already been completed.");
    }

    if (session.status === 'in-progress') {
        throw new ApiError(400, "This session is already in progress.");
    }

    // Get patient phone number
    const patient = session.patientId;
    if (!patient || !patient.mobileNumber) {
        throw new ApiError(400, "Patient phone number not found.");
    }

    const phone = patient.mobileNumber;

    // Generate 4-digit OTP
    const otp = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
    const otpKey = `${sessionId}_start`;

    // Store OTP (expires in 10 minutes)
    sessionOtpStore.set(otpKey, {
        otp: otp.toString(),
        expires: Date.now() + 10 * 60 * 1000,
        phone: phone
    });

    // Send OTP via SMS
    const API = process.env.SMS_API_KEY;
    if (!API) {
        throw new ApiError(500, "SMS service not configured");
    }
    const URL = `https://sms.renflair.in/V1.php?API=${API}&PHONE=${phone}&OTP=${otp}`;

    try {
        await axios.get(URL);
        return res.status(200).json(
            new ApiResponse(200, { message: "OTP sent successfully to patient" }, "OTP sent successfully.")
        );
    } catch (error) {
        console.error("SMS Error:", error);
        throw new ApiError(500, "Failed to send OTP");
    }
});

/**
 * Send OTP to patient for session end
 */
const sendSessionEndOtp = asyncHandler(async (req, res) => {
    const { sessionId } = req.body;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists can send session OTP.");
    }

    if (!sessionId) {
        throw new ApiError(400, "Session ID is required.");
    }

    const session = await Session.findById(sessionId).populate('patientId');
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Verify this physiotherapist is assigned to this session
    const { Physio } = await import('../models/physio.models.js');
    const physio = await Physio.findOne({ userId: req.user._id });
    
    if (!physio || session.physioId.toString() !== physio._id.toString()) {
        throw new ApiError(403, "You are not authorized to send OTP for this session.");
    }

    // Check if session is in progress
    if (session.status !== 'in-progress') {
        throw new ApiError(400, "Session must be in progress to end it.");
    }

    // Get patient phone number
    const patient = session.patientId;
    if (!patient || !patient.mobileNumber) {
        throw new ApiError(400, "Patient phone number not found.");
    }

    const phone = patient.mobileNumber;

    // Generate 4-digit OTP
    const otp = Math.floor(Math.random() * (9999 - 1111 + 1)) + 1111;
    const otpKey = `${sessionId}_end`;

    // Store OTP (expires in 10 minutes)
    sessionOtpStore.set(otpKey, {
        otp: otp.toString(),
        expires: Date.now() + 10 * 60 * 1000,
        phone: phone
    });

    // Send OTP via SMS
    const API = process.env.SMS_API_KEY;
    if (!API) {
        throw new ApiError(500, "SMS service not configured");
    }
    const URL = `https://sms.renflair.in/V1.php?API=${API}&PHONE=${phone}&OTP=${otp}`;

    try {
        await axios.get(URL);
        return res.status(200).json(
            new ApiResponse(200, { message: "OTP sent successfully to patient" }, "OTP sent successfully.")
        );
    } catch (error) {
        console.error("SMS Error:", error);
        throw new ApiError(500, "Failed to send OTP");
    }
});

/**
 * Start a session - Physiotherapist clicks "Start" button (requires OTP)
 */
const startSession = asyncHandler(async (req, res) => {
    const { sessionId, otp } = req.body;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists can start sessions.");
    }

    if (!sessionId) {
        throw new ApiError(400, "Session ID is required.");
    }

    if (!otp) {
        throw new ApiError(400, "OTP is required to start the session.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Verify this physiotherapist is assigned to this session
    const { Physio } = await import('../models/physio.models.js');
    const physio = await Physio.findOne({ userId: req.user._id });
    
    if (!physio || session.physioId.toString() !== physio._id.toString()) {
        throw new ApiError(403, "You are not authorized to start this session.");
    }

    // Check if session can be started
    if (session.status === 'completed') {
        throw new ApiError(400, "This session has already been completed.");
    }

    if (session.status === 'in-progress') {
        throw new ApiError(400, "This session is already in progress.");
    }

    // Verify OTP
    const otpKey = `${sessionId}_start`;
    const storedData = sessionOtpStore.get(otpKey);

    if (!storedData) {
        throw new ApiError(400, "OTP not found. Please request a new OTP.");
    }

    if (storedData.expires < Date.now()) {
        sessionOtpStore.delete(otpKey);
        throw new ApiError(400, "OTP expired. Please request a new OTP.");
    }

    if (storedData.otp !== otp.trim()) {
        throw new ApiError(400, "Incorrect OTP. Please verify the OTP with the patient.");
    }

    // Clear OTP after successful verification
    sessionOtpStore.delete(otpKey);

    // Update session
    session.status = 'in-progress';
    session.startTime = new Date();
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session, "Session started successfully.")
    );
});

/**
 * End a session - Physiotherapist clicks "End" button (requires OTP)
 */
const endSession = asyncHandler(async (req, res) => {
    const { sessionId, notes, otp } = req.body;

    if (!['physio', 'physiotherapist'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists can end sessions.");
    }

    if (!sessionId) {
        throw new ApiError(400, "Session ID is required.");
    }

    if (!otp) {
        throw new ApiError(400, "OTP is required to end the session.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Verify this physiotherapist is assigned to this session
    const { Physio } = await import('../models/physio.models.js');
    const physio = await Physio.findOne({ userId: req.user._id });
    
    if (!physio || session.physioId.toString() !== physio._id.toString()) {
        throw new ApiError(403, "You are not authorized to end this session.");
    }

    // Check if session was started
    if (session.status !== 'in-progress') {
        throw new ApiError(400, "Session must be started before it can be ended.");
    }

    // Verify OTP
    const otpKey = `${sessionId}_end`;
    const storedData = sessionOtpStore.get(otpKey);

    if (!storedData) {
        throw new ApiError(400, "OTP not found. Please request a new OTP.");
    }

    if (storedData.expires < Date.now()) {
        sessionOtpStore.delete(otpKey);
        throw new ApiError(400, "OTP expired. Please request a new OTP.");
    }

    if (storedData.otp !== otp.trim()) {
        throw new ApiError(400, "Incorrect OTP. Please verify the OTP with the patient.");
    }

    // Clear OTP after successful verification
    sessionOtpStore.delete(otpKey);

    // Calculate actual duration
    if (session.startTime) {
        const durationMinutes = Math.round((new Date() - new Date(session.startTime)) / (1000 * 60));
        session.actualDuration = durationMinutes;
    }

    // Update session
    session.status = 'completed';
    session.endTime = new Date();
    if (notes) {
        session.notes = notes;
    }
    
    // Increment completed sessions count
    session.completedSessions = (session.completedSessions || 0) + 1;
    
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session, "Session ended successfully. You can now upload a video.")
    );
});

/**
 * Upload session video - After session completion
 */
const uploadSessionVideo = asyncHandler(async (req, res) => {
    const { sessionId, title, description } = req.body;

    // Allow both physiotherapists and admins to upload videos
    if (!['physio', 'physiotherapist', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only physiotherapists and admins can upload session videos.");
    }

    if (!sessionId) {
        throw new ApiError(400, "Session ID is required.");
    }

    if (!req.file) {
        throw new ApiError(400, "Video file is required.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // If not admin, verify this physiotherapist is assigned to this session
    if (req.user.userType !== 'admin') {
        const { Physio } = await import('../models/physio.models.js');
        const physio = await Physio.findOne({ userId: req.user._id });
        
        if (!physio || session.physioId.toString() !== physio._id.toString()) {
            throw new ApiError(403, "You are not authorized to upload video for this session.");
        }
    }

    // Check if session is completed
    if (session.status !== 'completed') {
        throw new ApiError(400, "Can only upload videos for completed sessions.");
    }

    // If there's an existing video, delete it from Cloudinary first
    if (session.sessionVideo && session.sessionVideo.publicId) {
        const { deleteFromCloudinary } = await import('../utils/cloudinary.js');
        await deleteFromCloudinary(session.sessionVideo.publicId, 'video');
    }

    // Upload video to Cloudinary
    const { uploadOnCloudinary } = await import('../utils/cloudinary.js');
    const videoResult = await uploadOnCloudinary(req.file.path);

    if (!videoResult) {
        throw new ApiError(500, "Failed to upload video to cloud storage.");
    }

    // Update session with video details
    session.sessionVideo = {
        url: videoResult.secure_url || videoResult.url,
        publicId: videoResult.public_id,
        uploadedAt: new Date(),
        uploadedBy: req.user._id,
        title: title || `Session video - ${session.surgeryType}`,
        description: description || ''
    };

    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session, "Session video uploaded successfully.")
    );
});

/**
 * Delete session video - Admin only
 */
const deleteSessionVideo = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can delete session videos.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    if (!session.sessionVideo || !session.sessionVideo.url) {
        throw new ApiError(404, "No video found for this session.");
    }

    // Delete from Cloudinary if publicId exists
    if (session.sessionVideo.publicId) {
        try {
            const { deleteFromCloudinary } = await import('../utils/cloudinary.js');
            await deleteFromCloudinary(session.sessionVideo.publicId, 'video');
        } catch (error) {
            console.error('Error deleting from cloudinary:', error);
        }
    }

    // Remove video from session
    session.sessionVideo = undefined;
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, {}, "Session video deleted successfully.")
    );
});

/**
 * Update session video details - Admin only
 */
const updateSessionVideo = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { title, description } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can edit session videos.");
    }

    const session = await Session.findById(sessionId);
    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    if (!session.sessionVideo || !session.sessionVideo.url) {
        throw new ApiError(404, "No video found for this session.");
    }

    // Update video details
    if (title) session.sessionVideo.title = title;
    if (description) session.sessionVideo.description = description;
    
    await session.save();

    return res.status(200).json(
        new ApiResponse(200, session, "Session video details updated successfully.")
    );
});

/**
 * Get session with video - Accessible by Doctor, Physio, Admin
 */
const getSessionWithVideo = asyncHandler(async (req, res) => {
    const { sessionId } = req.params;

    if (!['doctor', 'physio', 'physiotherapist', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Access denied.");
    }

    const session = await Session.findById(sessionId)
        .populate('patientId', 'name mobile_number email surgeryType')
        .populate('doctorId', 'name specialization')
        .populate('physioId', 'name specialization')
        .populate('sessionVideo.uploadedBy', 'Fullname userType');

    if (!session) {
        throw new ApiError(404, "Session not found.");
    }

    // Verify access permissions
    const { Doctor } = await import('../models/doctor.models.js');
    const { Physio } = await import('../models/physio.models.js');

    let hasAccess = false;

    if (req.user.userType === 'admin') {
        hasAccess = true;
    } else if (req.user.userType === 'doctor') {
        const doctor = await Doctor.findOne({ userId: req.user._id });
        if (doctor && session.doctorId._id.toString() === doctor._id.toString()) {
            hasAccess = true;
        }
    } else if (['physio', 'physiotherapist'].includes(req.user.userType)) {
        const physio = await Physio.findOne({ userId: req.user._id });
        if (physio && session.physioId._id.toString() === physio._id.toString()) {
            hasAccess = true;
        }
    }

    if (!hasAccess) {
        throw new ApiError(403, "You are not authorized to view this session.");
    }

    return res.status(200).json(
        new ApiResponse(200, session, "Session retrieved successfully.")
    );
});

export { 
    createSession, 
    getCompletedSessions, 
    getMySessions, 
    listSessionsAdmin, 
    updateSessionAdmin, 
    deleteSessionAdmin,
    sendSessionStartOtp,
    sendSessionEndOtp,
    startSession,
    endSession,
    uploadSessionVideo,
    deleteSessionVideo,
    updateSessionVideo,
    getSessionWithVideo
};