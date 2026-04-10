import express from 'express';
import { listSessions, revokeSession } from '../controllers/session.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', auth, listSessions);
router.post('/revoke', auth, revokeSession);

export default router;
