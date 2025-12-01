import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { generateAccessAndRefreshTokens } from "../utils/auth.utils.js";

export const verifyJWT = asyncHandler(async(req, res, next) => {
    try {
        // Get token from cookies or Authorization header
        let token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
        // Trim whitespace if token exists
        if (token) {
            token = token.trim();
        }
        
        // Validate token exists and is not empty
        if (!token || token === "undefined" || token === "null" || token === "") {
            throw new ApiError(401, "Unauthorized request - No token provided");
        }
        
        // Basic JWT format validation (should have 3 parts separated by dots)
        const tokenParts = token.split('.');
        if (tokenParts.length !== 3) {
            throw new ApiError(401, "Invalid token format");
        }
    
        let decodedToken;
        let user;
        
        try {
            // Try to verify and decode the token
            decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
            
            // Find user by ID from decoded token
            user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        
            if (!user) {
                throw new ApiError(401, "Invalid Access Token - User not found");
            }
        } catch (verifyError) {
            // If token is expired, try to refresh it automatically
            if (verifyError.name === 'TokenExpiredError') {
                const refreshToken = req.cookies?.refreshToken || req.header("X-Refresh-Token");
                
                if (!refreshToken) {
                    throw new ApiError(401, "Token expired - No refresh token available");
                }
                
                try {
                    // Verify refresh token
                    const decodedRefreshToken = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
                    
                    // Find user by refresh token
                    user = await User.findById(decodedRefreshToken?._id);
                    
                    if (!user) {
                        throw new ApiError(401, "Invalid refresh token - User not found");
                    }
                    
                    // Verify refresh token matches stored token
                    if (refreshToken !== user?.refreshToken) {
                        throw new ApiError(401, "Refresh token is expired or used");
                    }
                    
                    // Generate new tokens
                    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshTokens(user._id);
                    
                    // Set new tokens in cookies
                    const isProduction = process.env.NODE_ENV === 'production';
                    const options = {
                        httpOnly: true,
                        sameSite: isProduction ? 'none' : 'lax',
                        secure: isProduction
                    };
                    
                    res.cookie("accessToken", newAccessToken, options);
                    res.cookie("refreshToken", newRefreshToken, options);
                    
                    // Update decodedToken for user lookup
                    decodedToken = { _id: user._id };
                } catch (refreshError) {
                    throw new ApiError(401, "Token expired - Refresh failed");
                }
            } else {
                // Re-throw other verification errors
                throw verifyError;
            }
        }
        
        // If user wasn't loaded yet, load it now
        if (!user) {
            user = await User.findById(decodedToken?._id).select("-password -refreshToken");
            if (!user) {
                throw new ApiError(401, "Invalid Access Token - User not found");
            }
        }
    
        req.user = user;
        next();
    } catch (error) {
        // Handle specific JWT errors
        if (error.name === 'JsonWebTokenError') {
            throw new ApiError(401, "Invalid token");
        } else if (error.name === 'TokenExpiredError') {
            throw new ApiError(401, "Token expired");
        } else if (error instanceof ApiError) {
            throw error;
        } else {
            throw new ApiError(401, error?.message || "Invalid access token");
        }
    }
});