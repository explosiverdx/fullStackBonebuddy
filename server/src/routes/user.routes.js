import { Router } from "express";
import { 
    registerUser, 
    loginUser, 
    logoutUser, 
    getCurrentUser,
    changeCurrentPassword,
    updateUserAccount,
    updateUserAvatar,
    sendOTP,
    verifyOTP
} from "../controllers/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);
router.route("/send-otp").post(sendOTP);
router.route("/verify-otp").post(verifyOTP);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/me").patch(verifyJWT, updateUserAccount);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);


export default router;