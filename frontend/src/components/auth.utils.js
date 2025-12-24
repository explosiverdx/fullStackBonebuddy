import { User } from "../models/user.models.js";
import { ApiError } from "./ApiError.js";

/**
 * Generates access and refresh tokens for a given user ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<{accessToken: string, refreshToken: string}>}
 */
export const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false, timestamps: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens");
    }
};