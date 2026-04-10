import express from 'express';
import { getProfile, updateProfile } from '../controllers/profile.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(auth, getProfile)
  .put(auth, updateProfile);

export default router;
