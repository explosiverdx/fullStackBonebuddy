import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Report } from "../models/report.model.js"; // Assuming you have this model
import { Patient } from "../models/patient.models.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const uploadReport = asyncHandler(async (req, res) => {
    const { title, userId } = req.body; // Changed from patientUserId to userId
    const reportLocalPath = req.file?.path;

    if (!reportLocalPath) {
        throw new ApiError(400, "Report file is required.");
    }

    if (!userId) { // Changed from patientUserId to userId
        throw new ApiError(400, "User ID is required.");
    }

    // Find the patient document using the user ID
    const patient = await Patient.findOne({ userId: userId });
    if (!patient) {
        throw new ApiError(404, "Patient profile not found for the given user.");
    }

    const reportFile = await uploadOnCloudinary(reportLocalPath);

    if (!reportFile?.url) {
        throw new ApiError(500, "Failed to upload report to cloud storage.");
    }

    const report = await Report.create({
        patientId: patient._id,
        title: title || req.file.originalname,
        fileUrl: reportFile.url,
        fileType: req.file.mimetype,
        uploadedBy: req.user._id, // The logged-in user (patient or admin)
    });

    return res.status(201).json(new ApiResponse(201, report, "Report uploaded successfully."));
});

const getReportsForUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;

    if (!userId) {
        throw new ApiError(400, "User ID is required.");
    }

    // Find the patient document using the user ID
    const patient = await Patient.findOne({ userId: userId });
    if (!patient) {
        // If no patient profile exists, they have no reports.
        return res.status(200).json(new ApiResponse(200, [], "No reports found for this user."));
    }

    const reports = await Report.find({ patientId: patient._id })
        .populate('uploadedBy', 'Fullname userType')
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, reports, "Reports fetched successfully."));
});

const deleteReport = asyncHandler(async (req, res) => {
    const { reportId } = req.params;

    const report = await Report.findById(reportId);

    // You might want to add an authorization check here to ensure
    // only the uploader or an admin can delete the report.
    // For example:
    // if (report.uploadedBy.toString() !== req.user._id.toString() && req.user.userType !== 'admin') {
    //     throw new ApiError(403, "You are not authorized to delete this report.");
    // }

    if (!report) {
        throw new ApiError(404, "Report not found.");
    }

    // Optional: Delete the file from Cloudinary as well
    if (report.fileUrl) {
        // This part is optional and requires a helper to extract public_id from URL
        // and call cloudinary.uploader.destroy(public_id)
    }

    await report.deleteOne();

    return res.status(200).json(new ApiResponse(200, {}, "Report deleted successfully."));
});

export { uploadReport, getReportsForUser, deleteReport };