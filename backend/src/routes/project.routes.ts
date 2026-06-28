import { Router } from 'express';
import { getProjects, getProjectById, createProject, updateProject, deleteProject, inviteMember, removeMember, changeMemberRole, toggleFavorite } from '../controllers/project.controller';
import { getProjectActivities } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/', createProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);

router.post('/:id/invite', inviteMember);
router.post('/:id/remove', removeMember);
router.post('/:id/role', changeMemberRole);
router.post('/:id/favorite', toggleFavorite);

router.get('/:projectId/activities', getProjectActivities);

export default router;
