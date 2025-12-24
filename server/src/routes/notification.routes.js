import { Router } from "express";
import { 
    getMyNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from "../controllers/notification.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require authentication
router.route("/").get(verifyJWT, getMyNotifications);
router.route("/mark-all-read").post(verifyJWT, markAllAsRead);
router.route("/:id/read").patch(verifyJWT, markAsRead);
router.route("/:id").delete(verifyJWT, deleteNotification);

export default router;

