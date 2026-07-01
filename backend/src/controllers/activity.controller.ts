import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getProjectActivities = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { projectId } = req.params;
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required parameter' });
    }
    const userId = req.user?.userId || '';

    // Verify membership inside target project
    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const activities = await prisma.activity.findMany({
      where: { projectId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        task: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.status(200).json(activities);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
