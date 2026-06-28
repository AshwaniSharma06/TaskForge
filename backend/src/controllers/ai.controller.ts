import { Request, Response } from 'express';

export const generateDescription = async (req: Request, res: Response) => {
  try {
    const { title, context } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    // Simulate AI delay
    await new Promise((resolve) => setTimeout(resolve, 1200));

    let desc = `### Objective\nImplement the feature: **${title}** following modern SaaS design guidelines and coding standards.\n\n`;
    desc += `### Key Requirements\n`;
    desc += `- Code must be written in TypeScript, using modular architecture.\n`;
    desc += `- Write robust tests to cover edge cases.\n`;
    desc += `- Design must follow the Google Stitch guidelines: Zinc-950 canvas background, Zinc-900 card structures, and thin borders.\n\n`;
    desc += `### Action Steps\n`;
    desc += `1. Review existing layouts and UI components.\n`;
    desc += `2. Complete integration inside the component module.\n`;
    desc += `3. Verify responsiveness on mobile, tablet, and desktop views.`;

    if (context) {
      desc += `\n\n*Additional Context:* ${context}`;
    }

    res.status(200).json({ description: desc });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const suggestPriority = async (req: Request, res: Response) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    await new Promise((resolve) => setTimeout(resolve, 800));

    let priority = 'MEDIUM';
    let reasoning = 'Based on average workflow constraints and default project priority allocation.';

    const lowerTitle = title.toLowerCase();
    const lowerDesc = (description || '').toLowerCase();

    if (lowerTitle.includes('critical') || lowerTitle.includes('auth') || lowerTitle.includes('login') || lowerTitle.includes('security')) {
      priority = 'CRITICAL';
      reasoning = 'This task is flagged as critical because it blocks user access, modifies authorization boundaries, or touches core database structure.';
    } else if (lowerTitle.includes('bug') || lowerTitle.includes('fix') || lowerTitle.includes('error') || lowerTitle.includes('crash')) {
      priority = 'HIGH';
      reasoning = 'High priority suggested because it addresses active system errors or breaks client-facing features.';
    } else if (lowerTitle.includes('polish') || lowerTitle.includes('style') || lowerTitle.includes('spacing') || lowerTitle.includes('icon')) {
      priority = 'LOW';
      reasoning = 'Low priority recommended since this involves aesthetic spacing adjustments and has no direct impact on system mechanics.';
    }

    res.status(200).json({ priority, reasoning });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateSubtasks = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Task title is required' });
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));

    let subtasks = [
      'Define component API contract',
      'Create high-fidelity mock interfaces',
      'Verify mobile-responsive layouts',
      'Integrate backend controllers',
      'Verify with integration tests'
    ];

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('auth') || lowerTitle.includes('login') || lowerTitle.includes('jwt') || lowerTitle.includes('password')) {
      subtasks = [
        'Set up Express router endpoints',
        'Encrypt credentials with bcryptjs',
        'Sign and return JWT payload on login',
        'Store tokens and check user verification state',
        'Add validation middleware checks'
      ];
    } else if (lowerTitle.includes('figma') || lowerTitle.includes('design') || lowerTitle.includes('ui') || lowerTitle.includes('layout')) {
      subtasks = [
        'Review the Google Stitch design guidelines',
        'Design deep zinc-950 theme elements',
        'Select typography sizing hierarchy (Inter)',
        'Build mockup versions and share for review',
        'Implement micro-animations on interactive components'
      ];
    } else if (lowerTitle.includes('database') || lowerTitle.includes('prisma') || lowerTitle.includes('schema') || lowerTitle.includes('migration')) {
      subtasks = [
        'Map database structures inside schema.prisma',
        'Apply models and run prisma migrate dev',
        'Construct robust seed tables in seed.ts',
        'Verify cascading relations delete commands',
        'Double-check unique key constraints'
      ];
    }

    res.status(200).json({ subtasks });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const generateSummary = async (req: Request, res: Response) => {
  try {
    const { taskDetails } = req.body;
    await new Promise((resolve) => setTimeout(resolve, 900));

    const summary = `Task summary: The task focuses on completing core systems operations. Comments indicate clear communication regarding design accents. Subtasks show advanced completion status, with remaining actions centered around deployment and final layout polishing.`;

    res.status(200).json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const suggestDeadline = async (req: Request, res: Response) => {
  try {
    const { title } = req.body;
    await new Promise((resolve) => setTimeout(resolve, 600));

    const days = title?.toLowerCase().includes('critical') ? 2 : 5;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + days);

    res.status(200).json({
      dueDate: deadline.toISOString(),
      reasoning: `Suggested a deadline of ${days} days out. This matches the average completion rate for items with this priority.`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const summarizeMeetingNotes = async (req: Request, res: Response) => {
  try {
    const { notes } = req.body;
    if (!notes) {
      return res.status(400).json({ error: 'Notes raw text is required' });
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const summary = `### Meeting Summary\n` +
      `The team discussed project goals, reviewed progress on backend endpoints, and agreed on the design token definitions (Zinc-950 canvas background, Indigo active accents, and glassmorphic card borders).\n\n` +
      `### Action Items\n` +
      `- **@Bob** to write the Express endpoints and JWT verification middleware. (High Priority)\n` +
      `- **@Alice** to create the Stitch Figma layouts and finalize styles. (Medium Priority)\n` +
      `- **@Charlie** to develop the animated drag and drop Kanban Board. (High Priority)\n\n` +
      `### Next Steps\n` +
      `Deploy the application staging server to Render and set up Neon PostgreSQL.`;

    res.status(200).json({ summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
