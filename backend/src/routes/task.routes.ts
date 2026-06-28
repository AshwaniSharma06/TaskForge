import { Router } from 'express';
import { createTask, getTaskById, updateTask, deleteTask, duplicateTask, addChecklistItem, updateChecklistItem, deleteChecklistItem, addAttachment, deleteAttachment } from '../controllers/task.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload } from '../middleware/upload.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createTask);
router.get('/:id', getTaskById);
router.put('/:id', updateTask);
router.delete('/:id', deleteTask);
router.post('/:id/duplicate', duplicateTask);

// Checklist items
router.post('/:id/checklist', addChecklistItem);
router.put('/checklist/:itemId', updateChecklistItem);
router.delete('/checklist/:itemId', deleteChecklistItem);

// Attachments
router.post('/:id/attachments', upload.single('file'), addAttachment);
router.delete('/attachments/:attachmentId', deleteAttachment);

export default router;
