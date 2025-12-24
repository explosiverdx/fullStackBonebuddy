import { Router } from "express";
import {
    createPhysioProfile,
    getPhysioProfile,
    updatePhysioProfile,
    getAllPhysios,
    getPublicPhysios,
    deletePhysio,
    adminCreatePhysio,
    adminUpdatePhysio,
    getMyPatientsAndSessions
} from "../controllers/physio.controller.js";
import { verifyJWT, optionalAuth } from "../middleware/auth.middleware.js";
import { verifyPermission } from "../middleware/permission.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createPhysioProfile)
    .get(verifyJWT, getPhysioProfile)
    .patch(verifyJWT, updatePhysioProfile);

// Make getAllPhysios work with optional authentication (for backward compatibility)
router.route("/getAllPhysios").get(optionalAuth, getAllPhysios);
router.route("/public").get(getPublicPhysios); // Public endpoint - no auth required
router.route("/my-patients-sessions").get(verifyJWT, getMyPatientsAndSessions);

router.route("/admin/create").post(verifyJWT, verifyPermission(['admin']), adminCreatePhysio);
router.route("/admin/:id").patch(verifyJWT, verifyPermission(['admin']), adminUpdatePhysio);

router.route("/:id").delete(verifyJWT, deletePhysio);

export default router;
