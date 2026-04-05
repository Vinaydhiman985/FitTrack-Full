import express from 'express';
import { register, login, getAllUsers } from '../controllers/auth.controller.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);

// DEV — view all registered users in the browser
router.get('/users', getAllUsers);

export default router;