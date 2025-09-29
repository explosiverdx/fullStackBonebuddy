import { Router } from "express";
import { 
    addService,
    getAllServices,
    getServiceById,
    updateService,
    deleteService
} from "../controllers/service.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/")
    .post(verifyJWT, addService)
    .get(verifyJWT, getAllServices);

router.route("/:serviceId")
    .get(verifyJWT, getServiceById)
    .patch(verifyJWT, updateService)
    .delete(verifyJWT, deleteService);

export default router;