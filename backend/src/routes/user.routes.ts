import { Router } from 'express';
import { searchUsers, updateProfile, changePassword } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/search', searchUsers);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);

export default router;
