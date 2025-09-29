import { Router } from "express";
import { 
    getDoctorReferrals,
    getPatientRegistrationStats,
    getPhysioSessionStats,
    getDoctorRegistrationStats,
    getPhysioRegistrationStats
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

// All routes require JWT verification
router.use(verifyJWT);

router.route("/doctor-referrals").get(getDoctorReferrals);
router.route("/patient-registration-stats").get(getPatientRegistrationStats);
router.route("/physio-session-stats").get(getPhysioSessionStats);
router.route("/doctor-registration-stats").get(getDoctorRegistrationStats);
router.route("/physio-registration-stats").get(getPhysioRegistrationStats);

export default router;
