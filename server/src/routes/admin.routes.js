import { Router } from "express";
import { sendAdminOTP, verifyAdminOTP, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, exportPatientsAdmin, getUsersWithoutPatients } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";

const router = Router();

router.route("/send-otp").post(sendAdminOTP);
router.route("/verify-otp").post(verifyAdminOTP);

router.route("/patients").get(verifyJWT, verifyPermission(['admin']), getAllPatientsAdmin);
router.route("/patients/stats").get(verifyJWT, verifyPermission(['admin']), getPatientsStats);
router.route("/patients").post(verifyJWT, verifyPermission(['admin']), createPatientAdmin);
router.route("/patients/:id").patch(verifyJWT, verifyPermission(['admin']), updatePatientAdmin);
router.route("/patients/:id").delete(verifyJWT, verifyPermission(['admin']), deletePatientAdmin);
router.route("/patients/:id/details").get(verifyJWT, verifyPermission(['admin']), getPatientDetailsAdmin);
router.route("/patients/export").get(verifyJWT, verifyPermission(['admin']), exportPatientsAdmin);
router.route("/users-without-patients").get(verifyJWT, verifyPermission(['admin']), getUsersWithoutPatients);

export default router;
