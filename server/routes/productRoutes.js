import express from 'express';
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
  getComparisonBrands,
  getComparisonProducts
} from '../controllers/productController.js';
import { getAllCategories, getAllColors } from '../controllers/adminController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/colors', getAllColors);
router.get('/:id', getProductById);
router.post('/', verifyToken, verifyAdmin, createProduct);
router.put('/:id', verifyToken, verifyAdmin, updateProduct);
router.delete('/:id', verifyToken, verifyAdmin, deleteProduct);
router.post('/:id/review', verifyToken, addReview);
router.get('/compare/:productId/brands', getComparisonBrands);
router.get('/compare/:productId/products', getComparisonProducts);

export default router;
