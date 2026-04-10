import express from 'express';
import { login, register, getAllUsers } from '../controllers/auth.controller.js';
import auth from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/users', auth, getAllUsers);

export default router;
