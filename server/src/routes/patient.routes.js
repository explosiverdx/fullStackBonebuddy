import { Router } from "express";
import { 
    createPatientProfile,
    getPatientProfile,
    updatePatientProfile,
    getAllPatients
} from "../controllers/patient.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createPatientProfile)
    .get(verifyJWT, getPatientProfile)
    .patch(verifyJWT, updatePatientProfile);

router.route("/getAllPatients").get(verifyJWT, getAllPatients);

export default router;