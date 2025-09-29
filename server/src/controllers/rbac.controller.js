import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Role } from "../models/role.models.js";
import { Permission } from "../models/permission.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const createRole = asyncHandler(async (req, res) => {
    const { name } = req.body;
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can create roles.");
    }
    const role = await Role.create({ name });
    return res.status(201).json(new ApiResponse(201, role, "Role created successfully."));
});

const createPermission = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can create permissions.");
    }
    const permission = await Permission.create({ name, description });
    return res.status(201).json(new ApiResponse(201, permission, "Permission created successfully."));
});

const assignPermissionToRole = asyncHandler(async (req, res) => {
    const { roleId, permissionId } = req.body;
    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can assign permissions to roles.");
    }

    const role = await Role.findById(roleId);
    const permission = await Permission.findById(permissionId);

    if (!role || !permission) {
        throw new ApiError(404, "Role or permission not found.");
    }

    if (role.permissions.includes(permission.name)) {
        throw new ApiError(400, "Permission already assigned to this role.");
    }

    role.permissions.push(permission.name);
    await role.save();

    return res.status(200).json(new ApiResponse(200, role, "Permission assigned to role successfully."));
});

export { createRole, createPermission, assignPermissionToRole };