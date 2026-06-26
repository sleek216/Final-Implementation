import express from "express";
import { verifyToken } from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";

import {
  getAllBrands,
  updateBrandStatus,
  getBrandById,
  getBrandDashboard,
  getMyBrand,
  updateBrandProfile,
  getApprovedBrands,
  getMyOrders,
  updateBrandOrderStatus,
  getMyProducts,
  createBrandProduct,
  getBrandCustomers,
  deleteBrandProduct,
  updateBrandProduct,
  toggleProduct3D
} from "../controllers/brandController.js";
import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `brand-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// 🛡️ BRAND OWNER ONLY
router.get("/dashboard", verifyToken, getBrandDashboard);
router.get("/my-brand", verifyToken, getMyBrand);
router.get("/orders", verifyToken, getMyOrders);
router.put("/orders/:orderId/status", verifyToken, updateBrandOrderStatus);
router.get("/products", verifyToken, getMyProducts);
router.post("/products", verifyToken, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'sizeChart', maxCount: 1 }
]), createBrandProduct);
router.put("/products/:id", verifyToken, upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'sizeChart', maxCount: 1 }
]), updateBrandProduct);
router.patch("/products/:id/3d", verifyToken, toggleProduct3D);
router.delete("/products/:id", verifyToken, deleteBrandProduct);
router.get("/customers", verifyToken, getBrandCustomers);

// PUBLIC
router.get("/approved", getApprovedBrands);
router.get("/:id", getBrandById);
router.put("/update-profile", verifyToken, upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'bannerImage', maxCount: 1 }
]), updateBrandProfile);

// 👮 ADMIN ONLY
router.get("/", verifyToken, adminOnly, getAllBrands);
router.put("/:id/status", verifyToken, adminOnly, updateBrandStatus);

export default router;
