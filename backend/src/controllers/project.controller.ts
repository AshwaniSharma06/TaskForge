import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emitToUser } from '../services/socket.service';

export const getProjects = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;

    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            tasks: {
              select: {
                status: true
              }
            }
          }
        }
      }
    });

    const projectsWithStats = memberships.map((membership) => {
      const p = membership.project;
      const totalTasks = p.tasks.length;
      const completedTasks = p.tasks.filter((t) => t.status === 'COMPLETED').length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        coverUrl: p.coverUrl,
        color: p.color,
        isArchived: p.isArchived,
        isFavorite: p.isFavorite,
        dueDate: p.dueDate,
        status: p.status,
        priority: p.priority,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        progress,
        myRole: membership.role,
        members: p.members.map((m) => ({
          userId: m.userId,
          name: m.user.name,
          email: m.user.email,
          avatar: m.user.avatar,
          role: m.role
        }))
      };
    });

    res.status(200).json(projectsWithStats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjectById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const membership = await prisma.projectMember.findFirst({
      where: { projectId: id, userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied. You are not a member of this project.' });
    }

    const p = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            }
          }
        },
        tasks: {
          include: {
            assignee: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true
              }
            },
            checklists: true,
            attachments: true,
            comments: true
          }
        }
      }
    });

    if (!p) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const totalTasks = p.tasks.length;
    const completedTasks = p.tasks.filter((t) => t.status === 'COMPLETED').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    res.status(200).json({
      ...p,
      progress,
      myRole: membership.role,
      members: p.members.map((m) => ({
        userId: m.userId,
        name: m.user.name,
        email: m.user.email,
        avatar: m.user.avatar,
        role: m.role
      }))
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const createProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';
    const { name, description, color, coverUrl, dueDate, priority } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required' });
    }

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color: color || '#6366f1',
        coverUrl,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || 'MEDIUM',
        members: {
          create: {
            userId,
            role: 'OWNER'
          }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        projectId: project.id,
        userId,
        action: 'PROJECT_CREATED',
        details: `created project "${name}"`
      }
    });

    res.status(201).json(project);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { name, description, color, coverUrl, dueDate, priority, status, isArchived, isFavorite } = req.body;

    const membership = await prisma.projectMember.findFirst({
      where: { projectId: id, userId }
    });

    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Only project Owner or Admins can edit details.' });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        color,
        coverUrl,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        status,
        isArchived,
        isFavorite
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        projectId: id,
        userId,
        action: 'TASK_UPDATED', // general update
        details: `updated project details for "${updatedProject.name}"`
      }
    });

    res.status(200).json(updatedProject);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const membership = await prisma.projectMember.findFirst({
      where: { projectId: id, userId }
    });

    if (!membership || membership.role !== 'OWNER') {
      return res.status(403).json({ error: 'Access denied. Only the project Owner can delete the project.' });
    }

    await prisma.project.delete({
      where: { id }
    });

    res.status(200).json({ message: 'Project deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const inviteMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Verify requesting user is OWNER/ADMIN
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Only project Owner/Admins can invite members.' });
    }

    // Verify invitee exists
    const invitee = await prisma.user.findUnique({ where: { email } });
    if (!invitee) {
      return res.status(404).json({ error: 'User with this email not found. They must register first.' });
    }

    // Verify not already member
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: invitee.id } }
    });

    if (existing) {
      return res.status(400).json({ error: 'User is already a member of this project.' });
    }

    const newMember = await prisma.projectMember.create({
      data: {
        projectId: id,
        userId: invitee.id,
        role: role || 'MEMBER'
      },
      include: {
        project: true
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        projectId: id,
        userId,
        action: 'MEMBER_JOINED',
        details: `invited ${invitee.name} to the project`
      }
    });

    // Send Notification
    const notif = await prisma.notification.create({
      data: {
        userId: invitee.id,
        type: 'PROJECT_INVITE',
        title: 'Project Invitation',
        message: `You have been invited to join the project: ${newMember.project.name}`,
        entityId: id,
        entityType: 'PROJECT'
      }
    });

    // Socket real-time emit
    emitToUser(invitee.id, 'notification', notif);

    res.status(201).json({ message: 'Member invited successfully', member: newMember });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const removeMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { targetUserId } = req.body;

    if (!targetUserId) {
      return res.status(400).json({ error: 'targetUserId is required' });
    }

    // Check requester role
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN' && targetUserId !== userId)) {
      return res.status(403).json({ error: 'Access denied. You cannot remove this member.' });
    }

    // Check if target is owner (cannot remove owner)
    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } },
      include: { user: true }
    });

    if (!target) {
      return res.status(404).json({ error: 'Member not found in project.' });
    }

    if (target.role === 'OWNER') {
      return res.status(400).json({ error: 'Cannot remove the project Owner.' });
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        projectId: id,
        userId,
        action: 'MEMBER_REMOVED',
        details: `removed ${target.user.name} from the project`
      }
    });

    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const changeMemberRole = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { targetUserId, newRole } = req.body;

    if (!targetUserId || !newRole) {
      return res.status(400).json({ error: 'targetUserId and newRole are required' });
    }

    // Verify requester is OWNER/ADMIN
    const requester = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } }
    });

    if (!requester || (requester.role !== 'OWNER' && requester.role !== 'ADMIN')) {
      return res.status(403).json({ error: 'Access denied. Only Owners or Admins can change roles.' });
    }

    const target = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId: targetUserId } }
    });

    if (!target) {
      return res.status(404).json({ error: 'Member not found in project' });
    }

    if (target.role === 'OWNER' && newRole !== 'OWNER') {
      return res.status(400).json({ error: 'Cannot downgrade the project Owner.' });
    }

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: id, userId: targetUserId } },
      data: { role: newRole }
    });

    res.status(200).json({ message: 'Role updated successfully', member: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const toggleFavorite = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const membership = await prisma.projectMember.findFirst({
      where: { projectId: id, userId }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await prisma.project.update({
      where: { id },
      data: { isFavorite: !project.isFavorite }
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
