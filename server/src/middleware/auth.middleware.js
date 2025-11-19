import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";

export const verifyJWT = asyncHandler(async(req, _, next) => {
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
    
        // Verify and decode the token
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        // Find user by ID from decoded token
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token - User not found");
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