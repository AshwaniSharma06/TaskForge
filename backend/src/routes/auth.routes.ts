import { Router } from 'express';
import { register, login, verifyEmail, forgotPassword, resetPassword, getProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', authenticate, getProfile);

export default router;
