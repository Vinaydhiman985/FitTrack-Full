import express from 'express';
import authRoutes from './auth.routes.js';
import leaderboardRoutes from './leaderboard.routes.js';
import profileRoutes from './profile.routes.js';
import shopRoutes from './shop.routes.js';
import stepsRoutes from './steps.routes.js';
import territoryRoutes from './territory.routes.js';
import sessionRoutes from './session.routes.js';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/steps', stepsRoutes);
router.use('/shop', shopRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/profile', profileRoutes);
router.use('/territories', territoryRoutes);
router.use('/sessions', sessionRoutes);

export default router;
