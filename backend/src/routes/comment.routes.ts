import { Router } from 'express';
import { createComment, updateComment, deleteComment, reactToComment } from '../controllers/comment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.post('/', createComment);
router.put('/:id', updateComment);
router.delete('/:id', deleteComment);
router.post('/:id/react', reactToComment);

export default router;
