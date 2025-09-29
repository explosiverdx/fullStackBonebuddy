import { Router } from "express";
import { 
    createProgressReport,
    getPhysioProgressReports,
    getPatientProgressReportsForDoctor,
    getPatientProgressReports
} from "../controllers/progressreport.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createProgressReport)
    .get(verifyJWT, getPhysioProgressReports);

router.route("/doctor/patient/:patientId").get(verifyJWT, getPatientProgressReportsForDoctor);

router.route("/patient").get(verifyJWT, getPatientProgressReports);

export default router;