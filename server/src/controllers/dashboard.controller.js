import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { Doctor } from "../models/doctor.models.js";
import { Patient } from "../models/patient.models.js";
import { MedicalRecord } from "../models/medical_record.models.js";
import { Payment } from "../models/payments.models.js";
import { Session } from "../models/sessions.models.js";
import { Physio } from "../models/physio.models.js";
import { getMonthlyCounts } from "../utils/getMonthlyCounts.js";

// Placeholder for Doctor Referrals
const getDoctorReferrals = asyncHandler(async (req, res) => {
    const year = new Date().getFullYear();
    const monthlyData = await getMonthlyCounts(Doctor, "createdAt", year);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                monthlyData,
                "Doctor referrals data fetched successfully"
            )
        );
});

// Placeholder for Patient Registration Stats
const getPatientRegistrationStats = asyncHandler(async (req, res) => {
    const year = new Date().getFullYear();

    const patientRegistrations = await getMonthlyCounts(Patient, "createdAt", year);
    const surgeryRegisters = await getMonthlyCounts(MedicalRecord, "createdAt", year);
    const paymentPending = await getMonthlyCounts(Payment, "createdAt", year, { status: "pending" });
    const paymentDone = await getMonthlyCounts(Payment, "createdAt", year, { status: "completed" });

    // For previous month payment, we need to calculate it based on completed payments of the previous month
    const previousMonthPayment = Array.from({ length: 12 }, (_, i) => 0);
    const allCompletedPayments = await getMonthlyCounts(Payment, "createdAt", year, { status: "completed" });
    for (let i = 1; i < 12; i++) {
        previousMonthPayment[i] = allCompletedPayments[i - 1];
    }

    const totalPatientRegistered = await Patient.countDocuments({
        createdAt: {
            $gte: new Date(year, 0, 1),
            $lt: new Date(year + 1, 0, 1),
        },
    });

    const responseData = {
        totalPatientRegistered,
        monthlyStats: Array.from({ length: 12 }, (_, i) => ({
            month: i + 1,
            patientRegistrations: patientRegistrations[i],
            surgeryRegisters: surgeryRegisters[i],
            paymentPending: paymentPending[i],
            paymentDone: paymentDone[i],
            previousMonthPayment: previousMonthPayment[i],
        })),
    };

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                responseData,
                "Patient registration stats fetched successfully"
            )
        );
});

// Placeholder for Physio Session Stats
const getPhysioSessionStats = asyncHandler(async (req, res) => {
    const year = new Date().getFullYear();
    const totalSessions = await getMonthlyCounts(Session, "createdAt", year);
    const completedSessions = await getMonthlyCounts(Session, "createdAt", year, { completed: true });

    const monthlyData = Array.from({ length: 12 }, (_, i) => ({
        month: i + 1,
        totalCount: totalSessions[i],
        completedCount: completedSessions[i],
    }));

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                monthlyData,
                "Physio session stats fetched successfully"
            )
        );
});

// Placeholder for Doctor Registration Stats
const getDoctorRegistrationStats = asyncHandler(async (req, res) => {
    const year = new Date().getFullYear();
    const monthlyData = await getMonthlyCounts(Doctor, "createdAt", year);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                monthlyData,
                "Doctor registration stats fetched successfully"
            )
        );
});

// Placeholder for Physio Registration Stats
const getPhysioRegistrationStats = asyncHandler(async (req, res) => {
    const year = new Date().getFullYear();
    const monthlyData = await getMonthlyCounts(Physio, "createdAt", year);

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                monthlyData,
                "Physio registration stats fetched successfully"
            )
        );
});

export {
    getDoctorReferrals,
    getPatientRegistrationStats,
    getPhysioSessionStats,
    getDoctorRegistrationStats,
    getPhysioRegistrationStats
};
