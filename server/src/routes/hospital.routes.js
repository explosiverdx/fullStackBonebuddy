import { Router } from "express";
import { addHospital } from "../controllers/hospital.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, addHospital);

export default router;
