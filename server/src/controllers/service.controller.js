import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Service } from "../models/services.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const addService = asyncHandler(async (req, res) => {
    const { name, description, price, duration, category } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can add services.");
    }

    if (!name || !description || !price || !duration || !category) {
        throw new ApiError(400, "All fields are required.");
    }

    const service = await Service.create({
        name,
        description,
        price,
        duration,
        category
    });

    return res.status(201).json(
        new ApiResponse(201, service, "Service added successfully.")
    );
});

const getAllServices = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };

    const aggregate = Service.aggregate([]);
    const services = await Service.aggregatePaginate(aggregate, options);

    return res.status(200).json(
        new ApiResponse(200, services, "Services retrieved successfully.")
    );
});

const getServiceById = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);

    if (!service) {
        throw new ApiError(404, "Service not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, service, "Service retrieved successfully.")
    );
});

const updateService = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;
    const { name, description, price, duration, category } = req.body;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can update services.");
    }

    const service = await Service.findByIdAndUpdate(
        serviceId,
        { $set: { name, description, price, duration, category } },
        { new: true, runValidators: true }
    );

    if (!service) {
        throw new ApiError(404, "Service not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, service, "Service updated successfully.")
    );
});

const deleteService = asyncHandler(async (req, res) => {
    const { serviceId } = req.params;

    if (req.user.userType !== 'admin') {
        throw new ApiError(403, "Only admins can delete services.");
    }

    const service = await Service.findByIdAndDelete(serviceId);

    if (!service) {
        throw new ApiError(404, "Service not found.");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Service deleted successfully.")
    );
});

export { addService, getAllServices, getServiceById, updateService, deleteService };