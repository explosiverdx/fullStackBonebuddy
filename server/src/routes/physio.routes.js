import { Router } from "express";
import {
    createPhysioProfile,
    getPhysioProfile,
    updatePhysioProfile,
    getAllPhysios,
    deletePhysio,
    adminCreatePhysio,
    adminUpdatePhysio,
    getMyPatientsAndSessions
} from "../controllers/physio.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, createPhysioProfile)
    .get(verifyJWT, getPhysioProfile)
    .patch(verifyJWT, updatePhysioProfile);

router.route("/getAllPhysios").get(verifyJWT, getAllPhysios);
router.route("/my-patients-sessions").get(verifyJWT, getMyPatientsAndSessions);

router.route("/:id").delete(verifyJWT, deletePhysio);

export default router;
