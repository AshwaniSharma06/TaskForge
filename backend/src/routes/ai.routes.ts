import { Router } from 'express';
import { generateDescription, suggestPriority, generateSubtasks, generateSummary, suggestDeadline, summarizeMeetingNotes } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/description', generateDescription);
router.post('/priority', suggestPriority);
router.post('/subtasks', generateSubtasks);
router.post('/summary', generateSummary);
router.post('/deadline', suggestDeadline);
router.post('/meeting-notes', summarizeMeetingNotes);

export default router;
