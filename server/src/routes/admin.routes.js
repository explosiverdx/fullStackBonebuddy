
import { Router } from "express";
import { sendAdminOTP, verifyAdminOTP, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, exportPatientsAdmin, getUsersWithoutPatients, universalSearch, quickSearch, allocateSession, getContactSubmissions, createContactSubmission, deleteUserAdmin, cleanupOrphanedSessions, getAllDoctorsAdmin, createDoctorAdmin, updateDoctorAdmin, deleteDoctorAdmin, getDoctorDetailsAdmin, getAllPhysiosAdmin, getPhysioDetailsAdmin, createPaymentRequest, getAllPaymentsAdmin, updatePaymentStatus } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";
import { upload } from "../middleware/multer.middleware.js";

const router = Router();

router.route("/send-otp").post(sendAdminOTP);
router.route("/verify-otp").post(verifyAdminOTP);

router.route("/patients").get(verifyJWT, verifyPermission(['admin']), getAllPatientsAdmin);
router.route("/patients/stats").get(verifyJWT, verifyPermission(['admin']), getPatientsStats);
router.route("/patients").post(upload.single('medicalReport'), verifyJWT, verifyPermission(['admin']), createPatientAdmin);
router.route("/patients/:id").patch(upload.single('medicalReport'), verifyJWT, verifyPermission(['admin']), updatePatientAdmin);
router.route("/patients/:id").delete(verifyJWT, verifyPermission(['admin']), deletePatientAdmin);
router.route("/patients/:id/details").get(verifyJWT, verifyPermission(['admin']), getPatientDetailsAdmin);
router.route("/patients/export").get(verifyJWT, verifyPermission(['admin']), exportPatientsAdmin);
router.route("/users-without-patients").get(verifyJWT, verifyPermission(['admin']), getUsersWithoutPatients);
router.route("/users/:id").delete(verifyJWT, verifyPermission(['admin']), deleteUserAdmin);
router.route("/doctors").get(verifyJWT, verifyPermission(['admin']), getAllDoctorsAdmin);
router.route("/doctors").post(verifyJWT, verifyPermission(['admin']), createDoctorAdmin);
router.route("/doctors/:id").patch(verifyJWT, verifyPermission(['admin']), updateDoctorAdmin);
router.route("/doctors/:id").delete(verifyJWT, verifyPermission(['admin']), deleteDoctorAdmin);
router.route("/doctors/:id/details").get(verifyJWT, verifyPermission(['admin']), getDoctorDetailsAdmin);
router.route("/physiotherapists").get(verifyJWT, verifyPermission(['admin']), getAllPhysiosAdmin);
router.route("/physiotherapists/:id").get(verifyJWT, verifyPermission(['admin']), getPhysioDetailsAdmin);
router.route("/payments").post(verifyJWT, verifyPermission(['admin']), createPaymentRequest);
router.route("/payments").get(verifyJWT, verifyPermission(['admin']), getAllPaymentsAdmin);
router.route("/payments/:id").patch(verifyJWT, verifyPermission(['admin']), updatePaymentStatus);
router.route("/search").get(verifyJWT, verifyPermission(['admin']), universalSearch);
router.route("/quick-search").get(verifyJWT, verifyPermission(['admin']), quickSearch);
router.route("/allocate-session").post(verifyJWT, verifyPermission(['admin']), allocateSession);
router.route("/sessions/cleanup-orphaned").post(verifyJWT, verifyPermission(['admin']), cleanupOrphanedSessions);
router.route("/contact-submissions").get(verifyJWT, verifyPermission(['admin']), getContactSubmissions);
router.route("/contact-submissions").post(createContactSubmission);

export default router;
