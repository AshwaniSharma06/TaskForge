import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { emitToProject, emitToUser } from '../services/socket.service';

export const createComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';
    const { taskId, content, parentId } = req.body;

    if (!taskId || !content) {
      return res.status(400).json({ error: 'taskId and content are required' });
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: { members: { include: { user: true } } }
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const isMember = task.project.members.some((m) => m.userId === userId);
    if (!isMember) {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const comment = await prisma.comment.create({
      data: {
        taskId,
        userId,
        content,
        parentId
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        reactions: { include: { user: { select: { name: true } } } }
      }
    });

    // Log Activity
    await prisma.activity.create({
      data: {
        projectId: task.projectId,
        taskId,
        userId,
        action: 'COMMENT_ADDED',
        details: `commented on task "${task.title}"`
      }
    });

    // Parse @mentions
    // Find all potential @name mentions by checking member names
    const mentions = content.match(/@\[?([^\]\n@]+)\]?/g) || [];
    const mentionedUserIds: string[] = [];

    for (const mention of mentions) {
      const cleanName = mention.replace('@', '').trim();
      const matchedMember = task.project.members.find(
        (m) => m.user.name.toLowerCase().includes(cleanName.toLowerCase()) || 
               m.user.email.toLowerCase().includes(cleanName.toLowerCase())
      );

      if (matchedMember && matchedMember.userId !== userId && !mentionedUserIds.includes(matchedMember.userId)) {
        mentionedUserIds.push(matchedMember.userId);
        
        const notif = await prisma.notification.create({
          data: {
            userId: matchedMember.userId,
            type: 'MENTION',
            title: 'You were mentioned',
            message: `${comment.user.name} mentioned you in task: ${task.title}`,
            entityId: taskId,
            entityType: 'TASK'
          }
        });
        emitToUser(matchedMember.userId, 'notification', notif);
      }
    }

    // Notify Task Assignee (if not the commenter and not already notified as mentioned)
    if (task.assigneeId && task.assigneeId !== userId && !mentionedUserIds.includes(task.assigneeId)) {
      const notif = await prisma.notification.create({
        data: {
          userId: task.assigneeId,
          type: 'COMMENT_ADDED',
          title: 'New Comment',
          message: `${comment.user.name} commented on: ${task.title}`,
          entityId: taskId,
          entityType: 'TASK'
        }
      });
      emitToUser(task.assigneeId, 'notification', notif);
    }

    // Notify Parent Comment Author (if reply, and not commenter/assignee/mentioned)
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({ where: { id: parentId } });
      if (
        parentComment && 
        parentComment.userId !== userId && 
        parentComment.userId !== task.assigneeId && 
        !mentionedUserIds.includes(parentComment.userId)
      ) {
        const notif = await prisma.notification.create({
          data: {
            userId: parentComment.userId,
            type: 'COMMENT_ADDED',
            title: 'New Reply',
            message: `${comment.user.name} replied to your comment in: ${task.title}`,
            entityId: taskId,
            entityType: 'TASK'
          }
        });
        emitToUser(parentComment.userId, 'notification', notif);
      }
    }

    // Emit Socket to project board so comment increments or slides open
    emitToProject(task.projectId, 'comment_added', comment);

    res.status(201).json(comment);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const updateComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only edit your own comments.' });
    }

    const updated = await prisma.comment.update({
      where: { id },
      data: {
        content,
        isEdited: true
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        reactions: { include: { user: { select: { name: true } } } }
      }
    });

    res.status(200).json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId || '';

    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (comment.userId !== userId) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own comments.' });
    }

    await prisma.comment.delete({ where: { id } });

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const reactToComment = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params; // commentId
    const userId = req.user?.userId || '';
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const existingReaction = await prisma.commentReaction.findUnique({
      where: {
        commentId_userId_emoji: {
          commentId: id,
          userId,
          emoji
        }
      }
    });

    if (existingReaction) {
      // Toggle off (remove reaction)
      await prisma.commentReaction.delete({
        where: { id: existingReaction.id }
      });
    } else {
      // Toggle on (add reaction)
      await prisma.commentReaction.create({
        data: {
          commentId: id,
          userId,
          emoji
        }
      });
    }

    // Fetch all reactions for this comment to send back
    const reactions = await prisma.commentReaction.findMany({
      where: { commentId: id },
      include: {
        user: { select: { id: true, name: true } }
      }
    });

    res.status(200).json(reactions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
