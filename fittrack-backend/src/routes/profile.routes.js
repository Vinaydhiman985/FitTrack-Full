import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getProfile);
router.put('/', protect, updateProfile);

export default router;