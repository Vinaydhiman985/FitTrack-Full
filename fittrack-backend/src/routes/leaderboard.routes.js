import express from 'express';
import { getLeaderboard } from '../controllers/leaderboard.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', auth, getLeaderboard);

export default router;
