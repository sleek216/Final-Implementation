import express from "express";
import { registerUser, loginUser, registerBrand, uploadVerification, forgotPassword, verifyOtp, resetPassword, sendRegistrationOtp } from "../controllers/authController.js";

const router = express.Router();

router.post("/send-registration-otp", sendRegistrationOtp);
router.post("/register", registerUser);
router.post("/register-brand", uploadVerification.single('verificationFile'), registerBrand);
router.post("/login", loginUser);

// OTP Password Reset
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

// Profile & Settings
import { verifyToken } from "../middleware/auth.js";
import { updateProfile, updatePassword, getProfile } from "../controllers/authController.js";

router.get("/profile", verifyToken, getProfile);
router.put("/profile", verifyToken, uploadVerification.single('profileImage'), updateProfile);
router.put("/password", verifyToken, updatePassword);

export default router;
