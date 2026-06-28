import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';
    
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
    
    res.status(200).json(notifications);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const notif = await prisma.notification.findUnique({ where: { id } });
    if (!notif || notif.userId !== userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';

    await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
