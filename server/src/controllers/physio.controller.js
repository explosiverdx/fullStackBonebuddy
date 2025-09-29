import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Physio } from "../models/physio.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createPhysioProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    if (req.user.userType !== 'physio') {
        throw new ApiError(403, "Only users with the 'physio' role can create a physio profile.");
    }

    const existingPhysio = await Physio.findOne({ userId });
    if (existingPhysio) {
        throw new ApiError(409, "A physio profile for this user already exists.");
    }

    if ([name, qualification, specialization].some(field => !field || field.trim() === "")) {
        throw new ApiError(400, "Name, qualification, and specialization are required fields.");
    }

    const physio = await Physio.create({
        userId,
        name,
        qualification,
        specialization,
        experience
    });

    return res.status(201).json(
        new ApiResponse(201, physio, "Physio profile created successfully.")
    );
});

const getPhysioProfile = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const physio = await Physio.findOne({ userId });

    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, physio, "Physio profile retrieved successfully.")
    );
});

const getAllPhysios = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Physio.aggregate([]);
    const physios = await Physio.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, physios, "Physios retrieved successfully.")
    );
});

const updatePhysioProfile = asyncHandler(async (req, res) => {
    const { name, qualification, specialization, experience } = req.body;
    const userId = req.user._id;

    const physio = await Physio.findOneAndUpdate(
        { userId },
        { $set: { name, qualification, specialization, experience } },
        { new: true, runValidators: true }
    );

    if (!physio) {
        throw new ApiError(404, "Physio profile not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, physio, "Physio profile updated successfully.")
    );
});

export { createPhysioProfile, getPhysioProfile, getAllPhysios, updatePhysioProfile };