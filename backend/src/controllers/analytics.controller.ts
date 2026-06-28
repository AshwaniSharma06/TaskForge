import { Response } from 'express';
import { prisma } from '../services/prisma';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

export const getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId || '';

    // 1. Get user projects
    const memberships = await prisma.projectMember.findMany({
      where: { userId },
      select: { projectId: true }
    });
    const projectIds = memberships.map((m) => m.projectId);

    // 2. Counts
    const totalProjects = projectIds.length;

    // User specific tasks
    const userTasks = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        assigneeId: userId
      }
    });

    const activeTasks = userTasks.filter((t) => t.status !== 'COMPLETED').length;
    const completedTasks = userTasks.filter((t) => t.status === 'COMPLETED').length;
    const pendingTasks = userTasks.filter((t) => t.status === 'TODO' || t.status === 'BACKLOG').length;

    // Overdue tasks (due date in past and status != COMPLETED)
    const now = new Date();
    const overdueTasks = userTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'COMPLETED'
    ).length;

    // Upcoming deadlines in the next 10 days
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    const upcomingDeadlines = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        dueDate: {
          gt: now,
          lte: tenDaysFromNow
        },
        status: { not: 'COMPLETED' }
      },
      include: {
        assignee: { select: { name: true, avatar: true } },
        project: { select: { name: true, color: true } }
      },
      orderBy: { dueDate: 'asc' },
      take: 5
    });

    // Recent activity across all user projects
    const recentActivity = await prisma.activity.findMany({
      where: { projectId: { in: projectIds } },
      include: {
        user: { select: { name: true, avatar: true } },
        task: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // 3. Workload Distribution (count of tasks assigned to each member across user projects)
    const membersWithTaskCounts = await prisma.user.findMany({
      where: {
        projects: {
          some: { projectId: { in: projectIds } }
        }
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        tasks: {
          where: { projectId: { in: projectIds }, status: { not: 'COMPLETED' } },
          select: { id: true }
        }
      }
    });

    const workloadDistribution = membersWithTaskCounts.map((m) => ({
      name: m.name,
      avatar: m.avatar,
      taskCount: m.tasks.length
    }));

    // 4. Productivity / Weekly Completion Overview (last 7 days completions)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const completedLastWeek = await prisma.task.findMany({
      where: {
        projectId: { in: projectIds },
        status: 'COMPLETED',
        updatedAt: { gte: sevenDaysAgo }
      },
      select: { updatedAt: true }
    });

    // Map completions to weekdays
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const productivityOverview = weekdayNames.map((day) => ({ day, count: 0 }));

    completedLastWeek.forEach((task) => {
      const dayIndex = new Date(task.updatedAt).getDay();
      productivityOverview[dayIndex].count++;
    });

    // Align productivity array to end with today
    const todayIndex = now.getDay();
    const orderedProductivity = [
      ...productivityOverview.slice(todayIndex + 1),
      ...productivityOverview.slice(0, todayIndex + 1)
    ];

    res.status(200).json({
      totalProjects,
      activeTasks,
      completedTasks,
      pendingTasks,
      overdueTasks,
      upcomingDeadlines,
      recentActivity,
      workloadDistribution,
      productivityOverview: orderedProductivity
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
