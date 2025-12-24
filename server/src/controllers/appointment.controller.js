import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Appointment } from "../models/appointments.models.js";
import { Patient } from "../models/patient.models.js";
import { Doctor } from "../models/doctor.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createAppointment = asyncHandler(async (req, res) => {
    const { doctorId, physioId, appointmentDate, sessionType, notes } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can book appointments.");
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found. Please create a patient profile first.");
    }

    if (!doctorId || !physioId || !appointmentDate || !sessionType) {
        throw new ApiError(400, "Doctor ID, Physio ID, appointment date, and session type are required.");
    }

    const appointment = await Appointment.create({
        doctorId,
        patientId: patient._id,
        physioId,
        appointmentDate,
        sessionType,
        notes
    });

    return res.status(201).json(
        new ApiResponse(201, appointment, "Appointment booked successfully.")
    );
});

const getPatientAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can view appointments.");
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

    const aggregate = Appointment.aggregate([
        {
            $match: {
                patientId: patient._id
            }
        }
    ]);

    const appointments = await Appointment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, appointments, "Appointments retrieved successfully.")
    );
});

const getDoctorAppointments = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can view appointments.");
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

    const aggregate = Appointment.aggregate([
        {
            $match: {
                doctorId: doctor._id
            }
        }
    ]);

    const appointments = await Appointment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, appointments, "Appointments retrieved successfully.")
    );
});

const updateAppointmentStatus = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { status } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'doctor') {
        throw new ApiError(403, "Only users with the 'doctor' role can update appointments.");
    }

    if (!['scheduled', 'completed', 'canceled'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const doctor = await Doctor.findOne({ userId });
    if (!doctor) {
        throw new ApiError(404, "Doctor profile not found.");
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw new ApiError(404, "Appointment not found.");
    }

    if (appointment.doctorId.toString() !== doctor._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this appointment.");
    }

    appointment.status = status;
    await appointment.save();

    return res.status(200).json(
        new ApiResponse(200, appointment, "Appointment status updated successfully.")
    );
});

const getAdminPendingAppointments = asyncHandler(async (req, res) => {
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can view pending appointments.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Appointment.aggregate([
        {
            $match: {
                status: 'scheduled'
            }
        },
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
                appointmentDate: 1,
                sessionType: 1,
                notes: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1
            }
        },
        {
            $sort: { appointmentDate: 1 }
        }
    ]);

    const appointments = await Appointment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, appointments, "Pending appointments retrieved successfully.")
    );
});

const updateAppointmentByAdmin = asyncHandler(async (req, res) => {
    const { appointmentId } = req.params;
    const { status, physioId, appointmentDate } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can update appointments.");
    }

    if (status && !['scheduled', 'completed', 'canceled'].includes(status)) {
        throw new ApiError(400, "Invalid status provided.");
    }

    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
        throw new ApiError(404, "Appointment not found.");
    }

    if (status) appointment.status = status;
    if (physioId) appointment.physioId = physioId;
    if (appointmentDate) appointment.appointmentDate = appointmentDate;

    await appointment.save();

    return res.status(200).json(
        new ApiResponse(200, appointment, "Appointment updated successfully.")
    );
});

export { createAppointment, getPatientAppointments, getDoctorAppointments, updateAppointmentStatus, getAdminPendingAppointments, updateAppointmentByAdmin };
