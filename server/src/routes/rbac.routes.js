import { Router } from "express";
import { 
    createRole,
    createPermission,
    assignPermissionToRole
} from "../controllers/rbac.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/roles").post(verifyJWT, createRole);
router.route("/permissions").post(verifyJWT, createPermission);
router.route("/roles/assign-permission").post(verifyJWT, assignPermissionToRole);

export default router;
