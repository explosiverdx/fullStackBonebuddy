import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { Notification } from "../models/notification.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Get all notifications for the logged-in user
const getMyNotifications = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { limit = 50, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
        query.read = false;
    }

    const notifications = await Notification.find(query)
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    return res.status(200).json(
        new ApiResponse(200, { notifications, unreadCount }, "Notifications retrieved successfully.")
    );
});

// Mark notification as read
const markAsRead = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    notification.read = true;
    await notification.save();

    return res.status(200).json(
        new ApiResponse(200, notification, "Notification marked as read")
    );
});

// Mark all notifications as read
const markAllAsRead = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    await Notification.updateMany(
        { userId, read: false },
        { $set: { read: true } }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "All notifications marked as read")
    );
});

// Delete notification
const deleteNotification = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user._id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
        throw new ApiError(404, "Notification not found");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Notification deleted successfully")
    );
});

// Create notification (internal function, can be called from other controllers)
const createNotification = async (userId, type, title, message, relatedId = null, relatedModel = null, actionUrl = null) => {
    try {
        const notification = await Notification.create({
            userId,
            type,
            title,
            message,
            relatedId,
            relatedModel,
            actionUrl,
            read: false
        });
        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

export { 
    getMyNotifications, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    createNotification 
};

