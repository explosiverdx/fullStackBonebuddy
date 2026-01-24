
import { Router } from "express";
import { sendAdminOTP, verifyAdminOTP, loginAdmin, getAllPatientsAdmin, getPatientsStats, createPatientAdmin, updatePatientAdmin, deletePatientAdmin, getPatientDetailsAdmin, getPatientReportsAdmin, deletePatientReportAdmin, exportPatientsAdmin, getUsersWithoutPatients, markUserAsAdded, universalSearch, quickSearch, allocateSession, getContactSubmissions, createContactSubmission, deleteUserAdmin, cleanupOrphanedSessions, getAllAdmins, createAdmin, updateAdmin, deleteAdmin, getAllDoctorsAdmin, createDoctorAdmin, updateDoctorAdmin, deleteDoctorAdmin, getDoctorDetailsAdmin, getAllPhysiosAdmin, getPhysioDetailsAdmin, createPaymentRequest, getAllPaymentsAdmin, updatePaymentStatus, getPatientPaymentCredits, changeUserPasswordAdmin, updateUserProfileStatusAdmin, getFeedbacks, updateFeedbackStatus, deleteFeedback } from "../controllers/admin.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";
import { parseMultipartForm } from "../middleware/formData.middleware.js";

const router = Router();

router.route("/send-otp").post(sendAdminOTP);
router.route("/verify-otp").post(verifyAdminOTP);
router.route("/login").post(loginAdmin);
router.route("/admins").get(verifyJWT, verifyPermission(['admin']), getAllAdmins);
router.route("/admins").post(verifyJWT, verifyPermission(['admin']), createAdmin);
router.route("/admins/:id").patch(verifyJWT, verifyPermission(['admin']), updateAdmin);
router.route("/admins/:id").delete(verifyJWT, verifyPermission(['admin']), deleteAdmin);

router.route("/patients").get(verifyJWT, verifyPermission(['admin']), getAllPatientsAdmin);
router.route("/patients/stats").get(verifyJWT, verifyPermission(['admin']), getPatientsStats);
router.route("/patients").post(verifyJWT, verifyPermission(['admin']), parseMultipartForm, createPatientAdmin);
router.route("/patients/:id").patch(verifyJWT, verifyPermission(['admin']), parseMultipartForm, updatePatientAdmin);
router.route("/patients/:id").delete(verifyJWT, verifyPermission(['admin']), deletePatientAdmin);
router.route("/patients/:id/details").get(verifyJWT, verifyPermission(['admin']), getPatientDetailsAdmin);
router.route("/patients/:patientId/reports").get(verifyJWT, verifyPermission(['admin']), getPatientReportsAdmin);
router.route("/patients/:patientId/reports/:reportId").delete(verifyJWT, verifyPermission(['admin']), deletePatientReportAdmin);
router.route("/patients/:patientId/payment-credits").get(verifyJWT, verifyPermission(['admin']), getPatientPaymentCredits);
router.route("/patients/export").get(verifyJWT, verifyPermission(['admin']), exportPatientsAdmin);
router.route("/users-without-patients").get(verifyJWT, verifyPermission(['admin']), getUsersWithoutPatients);
router.route("/users/:userId/mark-as-added").patch(verifyJWT, verifyPermission(['admin']), markUserAsAdded);
router.route("/users/:id").delete(verifyJWT, verifyPermission(['admin']), deleteUserAdmin);
router.route("/users/:userId/change-password").patch(verifyJWT, verifyPermission(['admin']), changeUserPasswordAdmin);
router.route("/users/:userId/profile-status").patch(verifyJWT, verifyPermission(['admin']), updateUserProfileStatusAdmin);
router.route("/users/profile-status").patch(verifyJWT, verifyPermission(['admin']), updateUserProfileStatusAdmin);
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
router.route("/feedbacks").get(verifyJWT, verifyPermission(['admin']), getFeedbacks);
router.route("/feedbacks/:feedbackId/status").patch(verifyJWT, verifyPermission(['admin']), updateFeedbackStatus);
router.route("/feedbacks/:feedbackId").delete(verifyJWT, verifyPermission(['admin']), deleteFeedback);

export default router;
