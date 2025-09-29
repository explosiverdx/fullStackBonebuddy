import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Patient } from "../models/patient.models.js";
import { User } from "../models/user.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};

const createPatientProfile = asyncHandler(async (req, res) => {
    const {
        name,
        gender,
        dateOfBirth,
        age,
        email,
        city,
        state,
        pincode,
        surgeryType,
        surgeryDate,
        hospitalName,
        doctorName,
        currentCondition,
        medicalHistory,
        allergies,
        emergencyContactNumber,
        bloodGroup
    } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'patient') {
        throw new ApiError(403, "Only users with the 'patient' role can create a patient profile.");
    }

    const existingPatient = await Patient.findOne({ userId });
    if (existingPatient) {
        throw new ApiError(409, "A patient profile for this user already exists.");
    }

    // Required fields validation
    if ([name, gender, dateOfBirth, age, city, state, pincode, surgeryType, surgeryDate, hospitalName, doctorName, currentCondition, emergencyContactNumber].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    // Update User with basic details
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                Fullname: name,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                age,
                email,
                address: { city, state, pincode }
            }
        },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Create Patient profile with medical details
    const patient = await Patient.create({
        userId,
        name,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        age,
        mobileNumber: user.mobile_number,
        email,
        address: { city, state, pincode },
        surgeryType,
        surgeryDate: new Date(surgeryDate),
        hospitalName,
        doctorName,
        currentCondition,
        medicalHistory,
        allergies,
        bloodGroup,
        emergencyContactNumber
    });

    // Generate tokens and log in
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userId);

    const loggedInUser = await User.findById(userId).select("-password -refreshToken -otp -otpExpires");

    const options = {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    };

    return res
        .status(201)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                201,
                {
                    user: loggedInUser,
                    patient,
                    accessToken,
                    refreshToken
                },
                "Patient profile created and user logged in successfully."
            )
        );
});

const getPatientProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const patient = await Patient.findOne({ userId });

    if (!patient) {
        throw new ApiError(404, "Patient profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient profile retrieved successfully.")
    );
});

const getAllPatients = asyncHandler(async (req, res) => {
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

const updatePatientProfile = asyncHandler(async (req, res) => {
    const { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber } = req.body;
    const userId = req.user._id;

    const patient = await Patient.findOneAndUpdate(
        { userId },
        { $set: { name, diagnosedWith, address, age, bloodGroup, gender, contactNumber, emergencyContactNumber } },
        { new: true, runValidators: true }
    );

    if (!patient) {
        throw new ApiError(404, "Patient profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, patient, "Patient profile updated successfully.")
    );
});

export { createPatientProfile, getPatientProfile, getAllPatients, updatePatientProfile };