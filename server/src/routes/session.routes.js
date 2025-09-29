import { Router } from "express";
import { 
    createSession,
    getCompletedSessions
} from "../controllers/session.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createSession);
router.route("/completed").get(verifyJWT, getCompletedSessions);

export default router;