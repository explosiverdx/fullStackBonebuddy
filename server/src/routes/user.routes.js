import { Router } from "express";
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateUserAccount,
    updateUserAvatar,
    updateProfile,
    sendOTP,
    verifyOTP,
    setPassword,
    forgotPassword,
    resetPassword,
    registerWithPassword,
    welcome,
    createContactSubmission
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
router.route("/forgot-password").post(forgotPassword);
router.route("/reset-password").post(resetPassword);
router.route("/register-with-password").post(registerWithPassword);
router.route("/welcome").get(welcome);
router.route("/refresh-token").post(refreshAccessToken);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/me").get(verifyJWT, getCurrentUser);
router.route("/change-password").post(verifyJWT, changeCurrentPassword);
router.route("/me").patch(verifyJWT, updateUserAccount);
router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar);
router.route("/profile").post(verifyJWT, upload.any(), updateProfile);
router.route("/set-password").post(verifyJWT, setPassword);
router.route("/contact").post(createContactSubmission);


export default router;
