import express from 'express';
import { getAvatars, buyAvatar, equipAvatar } from '../controllers/shop.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/avatars', protect, getAvatars);
router.post('/buy', protect, buyAvatar);
router.post('/equip', protect, equipAvatar);

export default router;