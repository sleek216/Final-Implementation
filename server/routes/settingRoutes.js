import express from 'express';
import { getSettings, updateSettings } from '../controllers/settingController.js';
import { verifyToken, verifyAdmin } from '../middleware/auth.js';

const router = express.Router();

// Only admin can read/write sensitive settings
router.get('/', verifyToken, verifyAdmin, getSettings);
router.put('/', verifyToken, verifyAdmin, updateSettings);

export default router;
