import express from 'express';
import { register, login, getProfile } from '../controllers/authController';
import { protect } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);

export default router; 