import { Router } from "express";
import { 
    createPayment,
    getPatientPaymentHistory,
    getAllPayments
} from "../controllers/payment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createPayment)
    .get(verifyJWT, getPatientPaymentHistory);

router.route("/all").get(verifyJWT, getAllPayments);

export default router;