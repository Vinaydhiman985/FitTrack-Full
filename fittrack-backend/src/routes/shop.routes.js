import express from 'express';
import { getAvatars, buyAvatar, equipAvatar } from '../controllers/shop.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.get('/avatars', getAvatars);
router.post('/buy', buyAvatar);
router.post('/equip', equipAvatar);

export default router;
