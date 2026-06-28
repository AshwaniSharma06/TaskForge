import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { initSocket } from './services/socket.service';
import { errorHandler } from './middleware/error.middleware';

// Import Route modules
import authRoutes from './routes/auth.routes';
import projectRoutes from './routes/project.routes';
import taskRoutes from './routes/task.routes';
import commentRoutes from './routes/comment.routes';
import notificationRoutes from './routes/notification.routes';
import aiRoutes from './routes/ai.routes';
import userRoutes from './routes/user.routes';
import analyticsRoutes from './routes/analytics.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded attachments statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Mount API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);

// Basic health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'TaskForge API is running successfully.' });
});

// Generic Global Error Interceptor
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`[TaskForge Server] Live on http://localhost:${PORT}`);
});
