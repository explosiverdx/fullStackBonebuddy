import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Role } from "../models/role.models.js";

export const verifyPermission = (requiredPermissions) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user?.userType;
    console.log('Permission check - User ID:', req.user?._id, 'User role:', userRole, 'Required:', requiredPermissions);

    if (!userRole) {
      console.log('Permission denied - No userType found');
      throw new ApiError(403, "User role not found. Please ensure you are logged in properly.");
    }

    // Check if user has the required role (case insensitive)
    if (!requiredPermissions.some(perm => perm.toLowerCase() === userRole.toLowerCase())) {
      console.log('Permission denied for user role:', userRole);
      throw new ApiError(403, `You do not have the required permissions to perform this action. Required: ${requiredPermissions.join(', ')}, Your role: ${userRole}`);
    }

    console.log('Permission granted for user:', req.user._id);
    next();
  });
};
