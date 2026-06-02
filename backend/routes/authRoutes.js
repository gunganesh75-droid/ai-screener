import express from 'express';
import { googleLogin } from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Google Sign-In / Sign-Up (only auth method)
router.post('/google', authLimiter, googleLogin);

export default router;
