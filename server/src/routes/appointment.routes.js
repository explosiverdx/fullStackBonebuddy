import { Router } from "express";
import {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointmentStatus,
    getAdminPendingAppointments,
    updateAppointmentByAdmin
} from "../controllers/appointment.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createAppointment)
    .get(verifyJWT, getPatientAppointments);

router.route("/doctor").get(verifyJWT, getDoctorAppointments);

router.route("/admin/pending").get(verifyJWT, getAdminPendingAppointments);

router.route("/:appointmentId/status").patch(verifyJWT, updateAppointmentStatus);

router.route("/admin/:appointmentId").patch(verifyJWT, updateAppointmentByAdmin);

export default router;
