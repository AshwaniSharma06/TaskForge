import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const searchUsers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(200).json([]);
    }

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query as string } },
          { email: { contains: query as string } }
        ]
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true
      },
      take: 10
    });

    res.status(200).json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { name, avatar } = req.body;

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name, avatar },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true
      }
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changePassword = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect current password' });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashed }
    });

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
