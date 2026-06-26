import express from "express";
import { createReview, getProductReviews, getUserReviews, getTopRatedProducts } from "../controllers/reviewController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/", verifyToken, createReview);
router.get("/user", verifyToken, getUserReviews);
router.get("/product/:productId", getProductReviews);
router.get("/top-rated", getTopRatedProducts);

export default router;
