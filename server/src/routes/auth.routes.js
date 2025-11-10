import { Router } from "express";
import { sendOtp, verifyOtp } from "../controllers/auth.controller.js";

const router = Router();

router.route("/send-otp").post(sendOtp).get(sendOtp);
router.route("/verify-otp").post(verifyOtp).get(verifyOtp);

export default router;
