import { Router } from 'express';
import { generateDescription, suggestPriority, generateSubtasks, generateSummary, suggestDeadline, summarizeMeetingNotes, createTasksFromNotes } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/description', generateDescription);
router.post('/priority', suggestPriority);
router.post('/subtasks', generateSubtasks);
router.post('/summary', generateSummary);
router.post('/deadline', suggestDeadline);
router.post('/meeting-notes', summarizeMeetingNotes);
router.post('/create-tasks-from-notes', createTasksFromNotes);

export default router;
