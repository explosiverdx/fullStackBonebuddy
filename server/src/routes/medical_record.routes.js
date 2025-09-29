import { Router } from "express";
import { 
    createMedicalRecord,
    getPatientMedicalRecords,
    getMyMedicalRecords
} from "../controllers/medical_record.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createMedicalRecord)
    .get(verifyJWT, getMyMedicalRecords);

router.route("/patient/:patientId").get(verifyJWT, getPatientMedicalRecords);

export default router;