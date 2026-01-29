import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Payment } from "../models/payments.models.js";
import { Patient } from "../models/patient.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import crypto from "crypto";
import {
    createRazorpayOrder,
    verifyRazorpaySignature,
    fetchPaymentDetails,
    initiateRefund
} from "../utils/razorpay.js";

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

// Razorpay Integration Controllers

/**
 * Create Razorpay order for payment
 */
const createRazorpayOrderController = asyncHandler(async (req, res) => {
    const { appointmentId, sessionId, amount, description, paymentType, existingPaymentId } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can create payment orders.");
    }

    const patient = await Patient.findOne({ userId });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found. Please create a patient profile first.");
    }

    if (!amount || !description) {
        throw new ApiError(400, "Amount and description are required.");
    }

    let payment;
    let isNewlyCreatedPayment = false;

    // Check if this is a retry of an existing payment
    if (existingPaymentId) {
        payment = await Payment.findById(existingPaymentId);

        if (!payment) {
            throw new ApiError(404, "Existing payment not found.");
        }

        // Verify the payment belongs to the user
        if (payment.userId.toString() !== userId.toString()) {
            throw new ApiError(403, "Unauthorized to retry this payment.");
        }

        // Only allow retry if payment is pending or failed
        if (!['pending', 'failed'].includes(payment.status)) {
            throw new ApiError(400, "Cannot retry a completed or cancelled payment.");
        }

        // Reset payment status to pending for retry
        payment.status = 'pending';
        payment.razorpayOrderId = null; // Clear old order ID
        payment.razorpayPaymentId = null;
        payment.razorpaySignature = null;
    } else if (paymentType === 'registration') {
        // Registration: reuse payment created by profile update to avoid duplicates
        payment = await Payment.findOne({
            patientId: patient._id,
            paymentType: 'registration',
            status: 'pending',
        });
        if (payment) {
            if (payment.userId.toString() !== userId.toString()) {
                throw new ApiError(403, "Unauthorized to use this payment.");
            }
            payment.razorpayOrderId = null;
            payment.razorpayPaymentId = null;
            payment.razorpaySignature = null;
            if (amount != null) payment.amount = amount;
            if (description) payment.description = description;
            await payment.save();
        }
    }

    if (!payment) {
        // Create new payment record
        try {
            payment = await Payment.create({
                patientId: patient._id,
                userId,
                appointmentId: appointmentId || null,
                sessionId: sessionId || null,
                amount,
                description,
                status: 'pending',
                paymentType: paymentType || 'other',
                paymentGateway: 'razorpay',
            });
            isNewlyCreatedPayment = true;
        } catch (dbError) {
            console.error('Error creating payment record:', dbError);
            throw new ApiError(500, `Failed to create payment record: ${dbError.message}`);
        }
    }

    // Create Razorpay order
    const receipt = `payment_${payment._id}`;
    const notes = {
        paymentId: payment._id.toString(),
        patientId: patient._id.toString(),
        appointmentId: appointmentId || '',
        sessionId: sessionId || '',
    };

    try {
        console.log('💳 Attempting to create Razorpay order for payment:', payment._id);
        console.log('💳 Amount:', amount, 'INR');
        console.log('💳 Receipt:', receipt);
        
        const razorpayOrder = await createRazorpayOrder(amount, 'INR', receipt, notes);

        console.log('✅ Razorpay order created:', razorpayOrder.id);

        // Update payment with Razorpay order ID
        payment.razorpayOrderId = razorpayOrder.id;
        await payment.save();

        console.log('✅ Payment record updated with Razorpay order ID');

        return res.status(201).json(
            new ApiResponse(201, {
                orderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                paymentId: payment._id,
                razorpayOrderId: razorpayOrder.id,
                key: process.env.RAZORPAY_KEY_ID,
            }, "Razorpay order created successfully.")
        );
    } catch (error) {
        console.error('❌ Error in createRazorpayOrderController:', error);
        console.error('❌ Error stack:', error.stack);
        console.error('❌ Error details:', {
            message: error.message,
            description: error.description,
            field: error.field,
            source: error.source,
            step: error.step,
            reason: error.reason
        });
        
        const errorMessage = error.message || 'Unknown error';
        const errorDescription = error.description || '';
        
        // Only delete if we created the payment in this request (not retry, not reused registration)
        if (isNewlyCreatedPayment && payment && payment._id) {
            try {
                await Payment.findByIdAndDelete(payment._id);
                console.log('🗑️ Deleted payment record due to error:', payment._id);
            } catch (deleteError) {
                console.error('❌ Error deleting payment record:', deleteError);
            }
        }
        
        // Provide more specific error message
        let userMessage = `Failed to create Razorpay order: ${errorMessage}`;
        if (errorDescription) {
            userMessage += ` - ${errorDescription}`;
        }
        
        if (errorMessage.includes('Razorpay is not configured') || 
            errorMessage.includes('RAZORPAY_KEY_ID') || 
            errorMessage.includes('RAZORPAY_KEY_SECRET')) {
            userMessage = 'Payment gateway is not configured on the server. Please contact support.';
        } else if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
            userMessage = 'Invalid Razorpay credentials. Please check server configuration.';
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
            userMessage = 'Network error connecting to payment gateway. Please try again.';
        }
        
        throw new ApiError(500, userMessage);
    }
});

/**
 * Verify Razorpay payment and update payment status
 */
const verifyRazorpayPayment = asyncHandler(async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentId } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can verify payments.");
    }

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !paymentId) {
        throw new ApiError(400, "All Razorpay parameters and payment ID are required.");
    }

    // Find the payment record
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        throw new ApiError(404, "Payment record not found.");
    }

    // Verify the payment belongs to the user
    if (payment.userId.toString() !== userId.toString()) {
        throw new ApiError(403, "Unauthorized to verify this payment.");
    }

    // Verify Razorpay signature
    const isValid = verifyRazorpaySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

    if (!isValid) {
        payment.status = 'failed';
        await payment.save();
        throw new ApiError(400, "Invalid payment signature. Payment verification failed.");
    }

    try {
        // Fetch payment details from Razorpay
        const paymentDetails = await fetchPaymentDetails(razorpay_payment_id);

        // Update payment record
        payment.razorpayPaymentId = razorpay_payment_id;
        payment.razorpaySignature = razorpay_signature;
        payment.transactionId = razorpay_payment_id;
        payment.status = paymentDetails.status === 'captured' ? 'completed' : 'failed';
        payment.paidAt = new Date();
        await payment.save();

        return res.status(200).json(
            new ApiResponse(200, payment, "Payment verified successfully.")
        );
    } catch (error) {
        payment.status = 'failed';
        await payment.save();
        throw new ApiError(500, "Failed to verify payment: " + error.message);
    }
});

/**
 * Get Razorpay key for frontend
 */
const getRazorpayKey = asyncHandler(async (req, res) => {
    const razorpayKey = process.env.RAZORPAY_KEY_ID;
    
    if (!razorpayKey || razorpayKey.trim() === '') {
        throw new ApiError(500, "Razorpay is not configured. Please add RAZORPAY_KEY_ID to .env file and restart the server.");
    }
    
    return res.status(200).json(
        new ApiResponse(200, { key: razorpayKey }, "Razorpay key retrieved successfully.")
    );
});

/**
 * Refund a payment
 */
const refundPayment = asyncHandler(async (req, res) => {
    const { paymentId, amount } = req.body;

    if (!['doctor', 'admin'].includes(req.user.userType)) {
        throw new ApiError(403, "Only doctors and admins can initiate refunds.");
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
        throw new ApiError(404, "Payment not found.");
    }

    if (payment.status !== 'completed') {
        throw new ApiError(400, "Only completed payments can be refunded.");
    }

    if (!payment.razorpayPaymentId) {
        throw new ApiError(400, "This payment was not processed through Razorpay and cannot be refunded.");
    }

    try {
        const refund = await initiateRefund(payment.razorpayPaymentId, amount);

        // Update payment status
        payment.status = 'cancelled';
        payment.notes = payment.notes 
            ? `${payment.notes}\nRefund initiated: ${refund.id}` 
            : `Refund initiated: ${refund.id}`;
        await payment.save();

        return res.status(200).json(
            new ApiResponse(200, { payment, refund }, "Refund initiated successfully.")
        );
    } catch (error) {
        throw new ApiError(500, "Failed to initiate refund: " + error.message);
    }
});

export { 
    createPayment, 
    getPatientPaymentHistory, 
    getAllPayments,
    createRazorpayOrderController,
    verifyRazorpayPayment,
    getRazorpayKey,
    refundPayment
};