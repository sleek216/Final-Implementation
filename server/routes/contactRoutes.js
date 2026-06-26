import express from "express";
import { submitContactForm, getUserMessages } from "../controllers/contactController.js";
import { verifyTokenOptional, verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/submit", verifyTokenOptional, submitContactForm);
router.get("/my-messages", verifyToken, getUserMessages);

export default router;
