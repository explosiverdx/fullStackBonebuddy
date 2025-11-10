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
        fullName,
        email,
        dateOfBirth,
        age,
        gender,
        city,
        state,
        country,
        allergies,
        emergencyContactNumber,
        bloodGroup,
        medicalInsurance
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
    if ([fullName, dateOfBirth, age, gender, city, state, country, emergencyContactNumber].some(field => !field || (typeof field === 'string' && field.trim() === ""))) {
        throw new ApiError(400, "All required fields must be filled out.");
    }

    // Update User with basic details
    const user = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                Fullname: fullName,
                gender,
                dateOfBirth: new Date(dateOfBirth),
                age,
                email,
                address: { city, state, country }
            }
        },
        { new: true, runValidators: true }
    );

    if (!user) {
        throw new ApiError(404, "User not found.");
    }

    // Create Patient profile with medical details
    const patientData = {
        userId,
        name: fullName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        age,
        mobileNumber: user.mobile_number,
        email,
        address: `${city}, ${state}, ${country}`,
        allergies,
        bloodGroup,
        emergencyContactNumber
    };

    // Handle medicalInsurance file if provided
    if (medicalInsurance) {
        // Assuming medicalInsurance is a file path or URL after upload
        patientData.medicalInsurance = medicalInsurance;
    }

    const patient = await Patient.create(patientData);

    // Generate tokens and log in
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(userId);

    const loggedInUser = await User.findById(userId).select("-password -refreshToken -otp -otpExpires");

    const isProduction = process.env.NODE_ENV === 'production';
    const options = {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax'
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
    const { name, surgeryType, address, age, bloodGroup, gender, mobileNumber, emergencyContactNumber, email, dateOfBirth } = req.body;
    const userId = req.user._id;

    const patient = await Patient.findOneAndUpdate(
        { userId },
        { $set: { name, surgeryType, address, age, bloodGroup, gender, mobileNumber, emergencyContactNumber, email, dateOfBirth } },
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