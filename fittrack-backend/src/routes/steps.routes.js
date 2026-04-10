import express from 'express';
import { logSteps, getTodaySteps, getStepsHistory } from '../controllers/steps.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(auth);

router.post('/log', logSteps);
router.get('/today', getTodaySteps);
router.get('/history', getStepsHistory);

export default router;
