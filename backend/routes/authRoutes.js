import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  googleLogin,
} from '../controllers/authController.js';
import { authLimiter, resetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/google', authLimiter, googleLogin);

router.post('/forgot-password', resetLimiter, forgotPassword);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
