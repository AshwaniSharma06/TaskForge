import { Request, Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emitToProject, emitToUser } from '../services/socket.service';

export const createTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';
    const { projectId, title, description, status, priority, dueDate, assigneeId } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ error: 'projectId and title are required' });
    }

    const membership = await prisma.projectMember.findFirst({
      where: { projectId, userId }
    });

    if (!membership || membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Access denied. You cannot create tasks in this project.' });
    }

    const task = await prisma.task.create({
      data: {
        projectId,
        title,
        description,
        status: status || 'TODO',
        priority: priority || 'MEDIUM',
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null
      },
      include: {
        assignee: {
          select: { id: true, name: true, avatar: true }
        }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        projectId,
        taskId: task.id,
        userId,
        action: 'TASK_CREATED',
        details: `created task: "${title}"`
      }
    });

    // Send assignment notification
    if (assigneeId && assigneeId !== userId) {
      const notif = await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'New Task Assigned',
          message: `You have been assigned to: ${title}`,
          entityId: task.id,
          entityType: 'TASK'
        }
      });
      emitToUser(assigneeId, 'notification', notif);
    }

    // Emit socket event to project room
    emitToProject(projectId, 'task_created', task);

    res.status(201).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getTaskById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        checklists: true,
        attachments: true,
        assignee: {
          select: { id: true, name: true, email: true, avatar: true }
        },
        comments: {
          include: {
            user: { select: { id: true, name: true, avatar: true } },
            reactions: { include: { user: { select: { name: true } } } }
          },
          orderBy: { createdAt: 'asc' }
        },
        project: {
          include: {
            members: { include: { user: { select: { id: true, name: true, email: true } } } }
          }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Verify membership
    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    res.status(200).json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { title, description, status, priority, dueDate, assigneeId } = req.body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { members: true } } }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = existingTask.project.members.find((m) => m.userId === userId);
    if (!membership || membership.role === 'VIEWER') {
      return res.status(403).json({ error: 'Access denied. You cannot edit tasks.' });
    }

    // Prepare details for activity log
    const changes: string[] = [];
    if (title && title !== existingTask.title) changes.push(`renamed to "${title}"`);
    if (status && status !== existingTask.status) changes.push(`moved to ${status}`);
    if (priority && priority !== existingTask.priority) changes.push(`changed priority to ${priority}`);
    if (assigneeId !== undefined && assigneeId !== existingTask.assigneeId) {
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
        changes.push(`assigned to ${assignee?.name || 'someone'}`);
      } else {
        changes.push('unassigned');
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title,
        description,
        status,
        priority,
        dueDate: dueDate ? new Date(dueDate) : dueDate === null ? null : undefined,
        assigneeId: assigneeId !== undefined ? assigneeId : undefined
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Log Activity
    if (changes.length > 0) {
      await prisma.activity.create({
        data: {
          projectId: existingTask.projectId,
          taskId: id,
          userId,
          action: status && status !== existingTask.status ? 'TASK_MOVED' : 'TASK_UPDATED',
          details: `updated task "${updatedTask.title}": ${changes.join(', ')}`
        }
      });
    }

    // Trigger Notification for new assignee
    if (assigneeId && assigneeId !== existingTask.assigneeId && assigneeId !== userId) {
      const notif = await prisma.notification.create({
        data: {
          userId: assigneeId,
          type: 'TASK_ASSIGNED',
          title: 'Task Assigned',
          message: `You have been assigned to: ${updatedTask.title}`,
          entityId: id,
          entityType: 'TASK'
        }
      });
      emitToUser(assigneeId, 'notification', notif);
    }

    // Emit Socket update to project
    emitToProject(existingTask.projectId, 'task_updated', updatedTask);

    res.status(200).json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const existingTask = await prisma.task.findUnique({
      where: { id },
      include: { project: { include: { members: true } } }
    });

    if (!existingTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const membership = existingTask.project.members.find((m) => m.userId === userId);
    if (!membership || (membership.role !== 'OWNER' && membership.role !== 'ADMIN' && existingTask.assigneeId !== userId)) {
      return res.status(403).json({ error: 'Access denied. You cannot delete this task.' });
    }

    await prisma.task.delete({ where: { id } });

    // Log Activity
    await prisma.activity.create({
      data: {
        projectId: existingTask.projectId,
        userId,
        action: 'TASK_UPDATED',
        details: `deleted task "${existingTask.title}"`
      }
    });

    emitToProject(existingTask.projectId, 'task_deleted', { id });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const duplicateTask = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const task = await prisma.task.findUnique({
      where: { id },
      include: { checklists: true }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const duplicated = await prisma.task.create({
      data: {
        projectId: task.projectId,
        title: `${task.title} (Copy)`,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assigneeId: task.assigneeId,
        checklists: {
          create: task.checklists.map((c) => ({
            title: c.title,
            isCompleted: c.isCompleted
          }))
        }
      },
      include: {
        assignee: { select: { id: true, name: true, avatar: true } }
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        taskId: duplicated.id,
        userId,
        action: 'TASK_CREATED',
        details: `duplicated task "${task.title}" as "${duplicated.title}"`
      }
    });

    emitToProject(task.projectId, 'task_created', duplicated);

    res.status(201).json(duplicated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Checklist Controllers
export const addChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // taskId
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const item = await prisma.taskChecklistItem.create({
      data: {
        taskId: id,
        title
      }
    });

    await recalculateTaskProgress(id);

    res.status(201).json(item);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;
    const { title, isCompleted } = req.body;

    const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    const updated = await prisma.taskChecklistItem.update({
      where: { id: itemId },
      data: { title, isCompleted }
    });

    await recalculateTaskProgress(item.taskId);

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteChecklistItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { itemId } = req.params;

    const item = await prisma.taskChecklistItem.findUnique({ where: { id: itemId } });
    if (!item) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }

    await prisma.taskChecklistItem.delete({ where: { id: itemId } });

    await recalculateTaskProgress(item.taskId);

    res.status(200).json({ message: 'Checklist item deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Attachment Controller
export const addAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // taskId
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filename = req.file.filename;
    const url = `${req.protocol}://${req.get('host')}/uploads/${filename}`;

    const attachment = await prisma.taskAttachment.create({
      data: {
        taskId: id,
        name: req.file.originalname,
        url,
        fileType: pathExtToType(filename),
        size: req.file.size
      }
    });

    res.status(201).json(attachment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteAttachment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;

    await prisma.taskAttachment.delete({
      where: { id: attachmentId }
    });

    res.status(200).json({ message: 'Attachment deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

// Helpers
const recalculateTaskProgress = async (taskId: string) => {
  const items = await prisma.taskChecklistItem.findMany({ where: { taskId } });
  if (items.length === 0) {
    await prisma.task.update({ where: { id: taskId }, data: { progress: 0 } });
    return;
  }

  const completed = items.filter((i) => i.isCompleted).length;
  const progress = Math.round((completed / items.length) * 100);

  await prisma.task.update({
    where: { id: taskId },
    data: { progress }
  });
};

const pathExtToType = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'].includes(ext || '')) return 'image';
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['doc', 'docx', 'txt', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) return 'document';
  return 'file';
};
