import { Router } from "express";
import { 
    createPayment,
    getPatientPaymentHistory,
    getAllPayments,
    createRazorpayOrderController,
    verifyRazorpayPayment,
    getRazorpayKey,
    refundPayment
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// Legacy/simulated payment routes
router.route("/")
    .post(verifyJWT, createPayment)
    .get(verifyJWT, getPatientPaymentHistory);

router.route("/all").get(verifyJWT, getAllPayments);

// Razorpay integration routes
router.route("/razorpay/key").get(getRazorpayKey);
router.route("/razorpay/order").post(verifyJWT, createRazorpayOrderController);
router.route("/razorpay/verify").post(verifyJWT, verifyRazorpayPayment);
router.route("/refund").post(verifyJWT, refundPayment);

export default router;