import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Feedback } from "../models/feedback.model.js";

const createFeedback = asyncHandler(async (req, res) => {
    const { name, message, rating } = req.body;

    // Validation
    if (!name || !message || !rating) {
        throw new ApiError(400, "Name, message, and rating are required");
    }

    if (rating < 1 || rating > 5) {
        throw new ApiError(400, "Rating must be between 1 and 5");
    }

    // Get user ID if authenticated (optional)
    const userId = req.user?._id || null;

    const feedback = await Feedback.create({
        name,
        message,
        rating,
        user: userId
    });

    return res.status(201).json(
        new ApiResponse(201, feedback, "Feedback submitted successfully")
    );
});

const getFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find()
        .populate('user', 'Fullname email mobile_number')
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, feedbacks, "Feedbacks retrieved successfully")
    );
});

const getPublicFeedbacks = asyncHandler(async (req, res) => {
    const feedbacks = await Feedback.find({ isPublic: true })
        .populate('user', 'Fullname')
        .sort({ createdAt: -1 })
        .limit(50); // Limit to 50 most recent public feedbacks

    return res.status(200).json(
        new ApiResponse(200, feedbacks, "Public feedbacks retrieved successfully")
    );
});

export { createFeedback, getFeedbacks, getPublicFeedbacks };
