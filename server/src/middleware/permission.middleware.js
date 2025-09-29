import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Role } from "../models/role.models.js";

export const verifyPermission = (requiredPermissions) => {
  return asyncHandler(async (req, res, next) => {
    const userRole = req.user.userType;

    const role = await Role.findOne({ name: userRole });

    if (!role) {
      throw new ApiError(403, "Role not found for this user.");
    }

    const hasAllPermissions = requiredPermissions.every((p) =>
      role.permissions.includes(p)
    );

    if (!hasAllPermissions) {
      throw new ApiError(403, "You do not have the required permissions to perform this action.");
    }

    next();
  });
};