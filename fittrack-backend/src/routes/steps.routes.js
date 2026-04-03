import express from 'express';
import { logSteps, getTodaySteps, getStepsHistory } from '../controllers/steps.controller.js';
import protect from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/log', protect, logSteps);
router.get('/today', protect, getTodaySteps);
router.get('/history', protect, getStepsHistory);

export default router;