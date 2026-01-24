import { Router } from "express";
import { getStateCityFromPincode } from "../controllers/pincode.controller.js";

const router = Router();

router.get("/:pincode", getStateCityFromPincode);

export default router;
