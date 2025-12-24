import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Hospital } from "../models/hospital.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addHospital = asyncHandler(async (req, res) => {
    const { name, address, city, pincode, specialized } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can add hospitals.");
    }

    if (!name || !city || !pincode) {
        throw new ApiError(400, "Name, city, and pincode are required.");
    }

    const hospital = await Hospital.create({
        name,
        address,
        city,
        pincode,
        specialized
    });

    return res.status(201).json(
        new ApiResponse(201, hospital, "Hospital added successfully.")
    );
});

export { addHospital };
