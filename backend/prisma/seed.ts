import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  
  // Clean up existing data
  await prisma.activity.deleteMany({});
  await prisma.notification.deleteMany({});
  await prisma.commentReaction.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.taskAttachment.deleteMany({});
  await prisma.taskChecklistItem.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.projectMember.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.user.deleteMany({});

  // Hash passwords
  const passwordHash = bcrypt.hashSync('Password123!', 10);

  // Create Users
  const alice = await prisma.user.create({
    data: {
      email: 'alice@taskforge.com',
      name: 'Alice Vance',
      password: passwordHash,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    }
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@taskforge.com',
      name: 'Bob Miller',
      password: passwordHash,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    }
  });

  const charlie = await prisma.user.create({
    data: {
      email: 'charlie@taskforge.com',
      name: 'Charlie Zhang',
      password: passwordHash,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    }
  });

  const diana = await prisma.user.create({
    data: {
      email: 'diana@taskforge.com',
      name: 'Diana Prince',
      password: passwordHash,
      isVerified: true,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    }
  });

  console.log('Users created.');

  // Create Projects
  const project1 = await prisma.project.create({
    data: {
      name: 'Acme SaaS Web App',
      description: 'Design and build the customer portal and analytics dashboards.',
      color: '#6366f1', // Indigo
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      status: 'active',
      priority: 'HIGH',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Brand Redesign 2026',
      description: 'Update the typography, assets, color palette, and style guides.',
      color: '#ec4899', // Pink
      coverUrl: 'https://images.unsplash.com/photo-1620121692029-d088224ddc74?w=1200',
      status: 'active',
      priority: 'MEDIUM',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
    }
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'Mobile Core Engine',
      description: 'Build backend and caching layer to optimize mobile app requests.',
      color: '#10b981', // Emerald
      coverUrl: 'https://images.unsplash.com/photo-1618005198143-e5283b519a7f?w=1200',
      status: 'planning',
      priority: 'CRITICAL',
      dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    }
  });

  console.log('Projects created.');

  // Associate Project Members
  // Project 1
  await prisma.projectMember.createMany({
    data: [
      { projectId: project1.id, userId: alice.id, role: 'OWNER' },
      { projectId: project1.id, userId: bob.id, role: 'ADMIN' },
      { projectId: project1.id, userId: charlie.id, role: 'MEMBER' },
      { projectId: project1.id, userId: diana.id, role: 'VIEWER' },
    ]
  });

  // Project 2
  await prisma.projectMember.createMany({
    data: [
      { projectId: project2.id, userId: bob.id, role: 'OWNER' },
      { projectId: project2.id, userId: alice.id, role: 'MEMBER' },
      { projectId: project2.id, userId: charlie.id, role: 'MEMBER' },
    ]
  });

  // Project 3
  await prisma.projectMember.createMany({
    data: [
      { projectId: project3.id, userId: charlie.id, role: 'OWNER' },
      { projectId: project3.id, userId: bob.id, role: 'ADMIN' },
    ]
  });

  console.log('Project memberships created.');

  // Create Tasks for Project 1
  const task1 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Design UI mockup in Figma',
      description: 'Create responsive high-fidelity mocks for project dashboard based on Stitch design guidelines.',
      status: 'COMPLETED',
      priority: 'HIGH',
      assigneeId: alice.id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      progress: 100
    }
  });

  const task2 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Set up JWT and Auth endpoint',
      description: 'Implement secure login, token issuance, password resets, and session tracking on the Node.js API.',
      status: 'IN_PROGRESS',
      priority: 'CRITICAL',
      assigneeId: bob.id,
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      progress: 50
    }
  });

  const task3 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Create Kanban Board layout',
      description: 'Develop the drag and drop interface with smooth Framer Motion animations.',
      status: 'TODO',
      priority: 'MEDIUM',
      assigneeId: charlie.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      progress: 0
    }
  });

  const task4 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'Set up database schema with Prisma',
      description: 'Map models, build seeds, and verify local connections.',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      assigneeId: bob.id,
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
      progress: 100
    }
  });

  const task5 = await prisma.task.create({
    data: {
      projectId: project1.id,
      title: 'AI Feature: Subtask Suggestion Panel',
      description: 'Placeholder and prompt trigger panel that auto-suggests subtasks in the task drawer.',
      status: 'BACKLOG',
      priority: 'LOW',
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      progress: 0
    }
  });

  console.log('Tasks created.');

  // Create Checklist items for Task 2
  await prisma.taskChecklistItem.createMany({
    data: [
      { taskId: task2.id, title: 'Write token creation helper', isCompleted: true },
      { taskId: task2.id, title: 'Implement login validation', isCompleted: true },
      { taskId: task2.id, title: 'Add forgot/reset endpoints', isCompleted: false },
      { taskId: task2.id, title: 'Simulate email verification code', isCompleted: false },
    ]
  });

  // Create attachments
  await prisma.taskAttachment.create({
    data: {
      taskId: task1.id,
      name: 'figma_mocks_final.pdf',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200',
      fileType: 'pdf',
      size: 4096000
    }
  });

  // Create Comments
  const comment1 = await prisma.comment.create({
    data: {
      taskId: task2.id,
      userId: alice.id,
      content: 'I finished the Figma mocks! Bob, let me know if you need specific styling variables for the login page.',
    }
  });

  const comment2 = await prisma.comment.create({
    data: {
      taskId: task2.id,
      userId: bob.id,
      parentId: comment1.id,
      content: 'Thanks Alice! @alice I will use the custom Indigo/Violet palette that matches the Stitch design guidelines.',
    }
  });

  // Add Reaction
  await prisma.commentReaction.create({
    data: {
      commentId: comment1.id,
      userId: bob.id,
      emoji: '👍'
    }
  });

  console.log('Comments and reactions created.');

  // Create Activities
  await prisma.activity.createMany({
    data: [
      { projectId: project1.id, userId: alice.id, action: 'PROJECT_CREATED', details: 'created the project Acme SaaS Web App' },
      { projectId: project1.id, taskId: task1.id, userId: alice.id, action: 'TASK_CREATED', details: 'created task: Design UI mockup in Figma' },
      { projectId: project1.id, taskId: task1.id, userId: alice.id, action: 'TASK_UPDATED', details: 'marked task as COMPLETED' },
      { projectId: project1.id, taskId: task2.id, userId: bob.id, action: 'TASK_CREATED', details: 'created task: Set up JWT and Auth endpoint' },
      { projectId: project1.id, taskId: task2.id, userId: bob.id, action: 'TASK_MOVED', details: 'moved task to IN_PROGRESS' },
    ]
  });

  // Create Notifications
  await prisma.notification.createMany({
    data: [
      { userId: bob.id, type: 'TASK_ASSIGNED', title: 'New Task Assigned', message: 'You have been assigned to: Set up JWT and Auth endpoint', entityId: task2.id, entityType: 'TASK' },
      { userId: alice.id, type: 'COMMENT_ADDED', title: 'New Comment', message: 'Bob replied to your comment in: Set up JWT and Auth endpoint', entityId: task2.id, entityType: 'TASK' },
    ]
  });

  console.log('Activities and notifications seeded.');
  console.log('Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
