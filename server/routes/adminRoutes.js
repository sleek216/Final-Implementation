import express from "express";
import { verifyToken } from "../middleware/auth.js";
import adminOnly from "../middleware/admin.js";


import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAdminStats,
  getSettings,
  updateSettings,
  getAllBrands,
  updateBrandStatus,
  deleteBrand,
  removeHeroImage,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
  getAllOrders,
  updateOrderStatus,
  deleteOrder,
  uploadBrandImage,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  addSubCategory,
  deleteSubCategory,
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleProductStatus,
  getAllColors,
  createColor,
  updateColor,
  deleteColor
} from "../controllers/adminController.js";
import { upload } from "../controllers/adminController.js";
import { getAllMessages, getMessageById, deleteMessage, getUnreadCount } from "../controllers/contactController.js";

const router = express.Router();

// 👤 USERS MANAGEMENT
router.get("/users", verifyToken, adminOnly, getAllUsers);
router.put("/users/:id/role", verifyToken, adminOnly, updateUserRole);
router.delete("/users/:id", verifyToken, adminOnly, deleteUser);

// 🏷️ BRANDS MANAGEMENT
router.get("/brands", verifyToken, adminOnly, getAllBrands);
router.put("/brands/:id/status", verifyToken, adminOnly, updateBrandStatus);
router.delete("/brands/:id", verifyToken, adminOnly, deleteBrand);
router.delete("/brands/:id/hero-image", verifyToken, adminOnly, removeHeroImage);

// ✅ VERIFICATION MANAGEMENT
router.get("/verifications", verifyToken, adminOnly, getPendingVerifications);
router.put("/verifications/:id/approve", verifyToken, adminOnly, approveVerification);
router.put("/verifications/:id/reject", verifyToken, adminOnly, rejectVerification);

// � ORDERS MANAGEMENT
router.get("/orders", verifyToken, adminOnly, getAllOrders);
router.put("/orders/:id/status", verifyToken, adminOnly, updateOrderStatus);
router.delete("/orders/:id", verifyToken, adminOnly, deleteOrder);
// 📸 BRAND IMAGE UPLOAD
router.post("/brands/upload-image", verifyToken, adminOnly, upload.single('heroImage'), uploadBrandImage);
// �📊 DASHBOARD STATS
router.get("/stats", verifyToken, adminOnly, getAdminStats);

// ⚙️ SETTINGS
router.get("/settings", verifyToken, adminOnly, getSettings);
router.put("/settings", verifyToken, adminOnly, updateSettings);

// 🏪 STORE CATEGORIES
router.get("/categories", verifyToken, adminOnly, getAllCategories);
router.post("/categories", verifyToken, adminOnly, createCategory);
router.put("/categories/:id", verifyToken, adminOnly, updateCategory);
router.delete("/categories/:id", verifyToken, adminOnly, deleteCategory);
router.post("/categories/:categoryId/subcategories", verifyToken, adminOnly, addSubCategory);
router.delete("/categories/:categoryId/subcategories/:subCategoryId", verifyToken, adminOnly, deleteSubCategory);

// 🎨 COLOR MANAGEMENT
router.get("/colors", verifyToken, adminOnly, getAllColors);
router.post("/colors", verifyToken, adminOnly, createColor);
router.put("/colors/:id", verifyToken, adminOnly, updateColor);
router.delete("/colors/:id", verifyToken, adminOnly, deleteColor);

// 🛍️ PRODUCTS MANAGEMENT
router.get("/products", verifyToken, adminOnly, getAllProducts);
router.post("/products", verifyToken, adminOnly, createProduct);
router.put("/products/:id", verifyToken, adminOnly, updateProduct);
router.delete("/products/:id", verifyToken, adminOnly, deleteProduct);
router.put("/products/:id/toggle-status", verifyToken, adminOnly, toggleProductStatus);

// ✉️ MESSAGE MANAGEMENT
router.get("/messages", verifyToken, adminOnly, getAllMessages);
router.get("/messages/unread-count", verifyToken, adminOnly, getUnreadCount);
router.get("/messages/:id", verifyToken, adminOnly, getMessageById);
router.delete("/messages/:id", verifyToken, adminOnly, deleteMessage);

export default router;
