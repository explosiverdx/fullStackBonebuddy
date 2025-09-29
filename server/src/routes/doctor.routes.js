import { Router } from "express";
import { 
    createDoctorProfile,
    getDoctorProfile,
    updateDoctorProfile,
    getAllPatients,
    getAllDoctors
} from "../controllers/doctor.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createDoctorProfile)
    .get(verifyJWT, getDoctorProfile)
    .patch(verifyJWT, updateDoctorProfile);

router.route("/getAllDoctors").get(verifyJWT, getAllDoctors)

router.route("/patients").get(verifyJWT, verifyPermission(['view-all-patients']), getAllPatients);

export default router;