import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Payment } from "../models/payments.models.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";

const createPayment = asyncHandler(async (req, res) => {
    const { appointmentId, amount } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can make payments.");
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found. Please create a patient profile first.");
    }

    if (!appointmentId || !amount) {
        throw new ApiError(400, "Appointment ID and amount are required.");
    }

    // Simulate payment processing
    const transactionId = `txn_${crypto.randomBytes(12).toString('hex')}`;

    const payment = await Payment.create({
        patientId: patient._id,
        appointmentId,
        amount,
        status: 'completed', // Assuming successful payment for simulation
        transactionId
    });

    return res.status(201).json(
        new ApiResponse(201, payment, "Payment created successfully.")
    );
});

const getPatientPaymentHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can view their payment history.");
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

    const aggregate = Payment.aggregate([
        {
            $match: {
                patientId: patient._id
            }
        }
    ]);

    const payments = await Payment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, payments, "Payment history retrieved successfully.")
    );
});

const getAllPayments = asyncHandler(async (req, res) => {
    if (!['doctor', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only doctors and admins can view all payments.");
    }

    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Payment.aggregate([]);
    const payments = await Payment.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, payments, "All payments retrieved successfully.")
    );
});

export { createPayment, getPatientPaymentHistory, getAllPayments };