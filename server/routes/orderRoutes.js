import express from 'express';
import {
  createOrder,
  getUserOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  createCheckoutSession,
  verifyPayment,
} from '../controllers/orderController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/', verifyToken, createOrder);
router.post('/create-checkout-session', verifyToken, createCheckoutSession);
router.get('/verify-payment', verifyToken, verifyPayment);
router.get('/', verifyToken, getUserOrders);
router.get('/:id', verifyToken, getOrderById);
router.put('/:id/status', verifyToken, verifyAdmin, updateOrderStatus);
router.put('/:id/cancel', verifyToken, cancelOrder);

export default router;
