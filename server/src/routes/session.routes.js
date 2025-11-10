import { Router } from "express";
import { 
    createSession,
    getCompletedSessions,
    getMySessions,
    listSessionsAdmin,
    updateSessionAdmin,
    deleteSessionAdmin,
    startSession,
    endSession,
    uploadSessionVideo,
    deleteSessionVideo,
    updateSessionVideo,
    getSessionWithVideo
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createSession);
router.route("/completed").get(verifyJWT, getCompletedSessions);
router.route("/mine").get(verifyJWT, getMySessions);

// Session management for physiotherapists
router.route("/start").post(verifyJWT, startSession);
router.route("/end").post(verifyJWT, endSession);
router.route("/upload-video").post(verifyJWT, upload.single('video'), uploadSessionVideo);
router.route("/:sessionId/video").get(verifyJWT, getSessionWithVideo);

// Admin-only session management
router.route("/admin").get(verifyJWT, verifyPermission(['admin']), listSessionsAdmin);
router.route("/admin/:id")
    .patch(verifyJWT, verifyPermission(['admin']), updateSessionAdmin)
    .delete(verifyJWT, verifyPermission(['admin']), deleteSessionAdmin);

// Admin-only video management
router.route("/:sessionId/video")
    .patch(verifyJWT, verifyPermission(['admin']), updateSessionVideo)
    .delete(verifyJWT, verifyPermission(['admin']), deleteSessionVideo);

export default router;