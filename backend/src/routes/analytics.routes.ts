import { Router } from 'express';
import { getDashboardStats } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/dashboard-stats', getDashboardStats);

export default router;
