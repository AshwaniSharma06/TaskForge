import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { useSocket } from '../context/SocketContext';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { 
  Plus, Star, UserPlus, Filter, CheckSquare, MessageSquare, 
  Paperclip, MoreHorizontal, User
} from 'lucide-react';
import { TaskDetailModal } from '../components/board/TaskDetailModal';
import { useToast } from '../context/ToastContext';

const COLUMNS = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-t-zinc-650' },
  { id: 'TODO', label: 'To Do', color: 'border-t-zinc-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'border-t-amber-500' },
  { id: 'REVIEW', label: 'Review', color: 'border-t-indigo-500' },
  { id: 'TESTING', label: 'Testing', color: 'border-t-purple-500' },
  { id: 'COMPLETED', label: 'Completed', color: 'border-t-emerald-500' }
];

interface BoardPageProps {
  projectId: string;
  openTaskId?: string;
}

export const BoardPage: React.FC<BoardPageProps> = ({ projectId, openTaskId }) => {
  const { socket } = useSocket();
  const { addToast } = useToast();
  
  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [draggedOverCol, setDraggedOverCol] = useState<string | null>(null);
  
  // Modals & Drawers
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(openTaskId || null);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);
  
  // Form States
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');
  const [inviteLoading, setInviteLoading] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCol, setNewTaskCol] = useState('TODO');
  const [newTaskPriority, setNewTaskPriority] = useState('MEDIUM');
  const [newTaskAssignee, setNewTaskAssignee] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [taskCreateLoading, setTaskCreateLoading] = useState(false);

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');

  // Fetch Project Details
  const fetchProject = async () => {
    try {
      const res = await api.get(`/projects/${projectId}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to fetch project details', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchProject();
  }, [projectId]);

  // Handle socket connections
  useEffect(() => {
    if (!socket || !project) return;

    // Join room
    socket.emit('join_project', projectId);

    const handleTaskCreated = (newTask: any) => {
      setProject((prev: any) => {
        if (!prev) return prev;
        const exists = prev.tasks.some((t: any) => t.id === newTask.id);
        if (exists) return prev;
        return { ...prev, tasks: [...prev.tasks, newTask] };
      });
    };

    const handleTaskUpdated = (updatedTask: any) => {
      setProject((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.map((t: any) => (t.id === updatedTask.id ? { ...t, ...updatedTask } : t))
        };
      });
    };

    const handleTaskDeleted = ({ id }: { id: string }) => {
      setProject((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.filter((t: any) => t.id !== id)
        };
      });
    };

    socket.on('task_created', handleTaskCreated);
    socket.on('task_updated', handleTaskUpdated);
    socket.on('task_deleted', handleTaskDeleted);

    return () => {
      socket.emit('leave_project', projectId);
      socket.off('task_created', handleTaskCreated);
      socket.off('task_updated', handleTaskUpdated);
      socket.off('task_deleted', handleTaskDeleted);
    };
  }, [socket, projectId, project]);

  // Drag and Drop implementation
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverCol !== colId) {
      setDraggedOverCol(colId);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDraggedOverCol(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;

    // Optimistic UI state update
    const originalTasks = [...project.tasks];
    setProject((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: prev.tasks.map((t: any) => (t.id === taskId ? { ...t, status: targetColId } : t))
      };
    });

    try {
      await api.put(`/tasks/${taskId}`, { status: targetColId });
      addToast('Task status updated successfully', 'success');
    } catch (err) {
      console.error('Failed to move task status', err);
      addToast('Failed to update task status', 'error');
      // Revert upon error
      setProject((prev: any) => ({ ...prev, tasks: originalTasks }));
    }
  };

  // Toggle Project Favorite state
  const handleToggleFavorite = async () => {
    if (!project) return;
    try {
      const res = await api.post(`/projects/${projectId}/favorite`);
      setProject((prev: any) => ({ ...prev, isFavorite: res.data.isFavorite }));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Invite Submission
  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError('');
    setInviteSuccess('');
    setInviteLoading(true);

    try {
      await api.post(`/projects/${projectId}/invite`, { email: inviteEmail, role: inviteRole });
      addToast('Member invited to project successfully', 'success');
      setInviteSuccess('Member invited successfully!');
      setInviteEmail('');
      fetchProject(); // refresh list
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to invite member.';
      setInviteError(msg);
      addToast(msg, 'error');
    } finally {
      setInviteLoading(false);
    }
  };

  // Handle Task Creation Submission
  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle) return;
    setTaskCreateLoading(true);

    try {
      const res = await api.post('/tasks', {
        projectId,
        title: newTaskTitle,
        description: newTaskDesc,
        status: newTaskCol,
        priority: newTaskPriority,
        assigneeId: newTaskAssignee || null
      });

      setProject((prev: any) => ({ ...prev, tasks: [...prev.tasks, res.data] }));
      addToast('Task created successfully!', 'success');
      setIsCreateTaskOpen(false);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskAssignee('');
    } catch (err: any) {
      addToast(err.response?.data?.error || 'Failed to create task.', 'error');
    } finally {
      setTaskCreateLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-20 bg-zinc-900 border border-zinc-800 rounded-xl" />
        <div className="flex gap-4 overflow-x-auto py-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="w-72 shrink-0 h-96 bg-zinc-900 border border-zinc-800 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Filter Tasks
  const filteredTasks = (project?.tasks || []).filter((task: any) => {
    if (priorityFilter !== 'ALL' && task.priority !== priorityFilter) return false;
    if (assigneeFilter !== 'ALL' && task.assigneeId !== assigneeFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full overflow-hidden select-none">
      {/* Cover Header */}
      <div className="h-36 relative bg-zinc-900 border-b border-zinc-800 shrink-0">
        {project?.coverUrl ? (
          <img src={project.coverUrl} className="w-full h-full object-cover opacity-35" alt="" />
        ) : (
          <div className="w-full h-full opacity-10 bg-gradient-to-r from-indigo-500 via-violet-500 to-pink-500" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
        
        {/* Project Header Info */}
        <div className="absolute bottom-4 left-6 right-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full shrink-0 border border-white/10" style={{ backgroundColor: project?.color }} />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-50 leading-tight">{project?.name}</h1>
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-1 hover:bg-zinc-800/40 rounded transition-all text-zinc-500 ${
                    project?.isFavorite ? 'text-amber-500 fill-amber-500/10' : ''
                  }`}
                >
                  <Star size={14} />
                </button>
              </div>
              <p className="text-[11px] text-zinc-400 mt-1 max-w-lg truncate">{project?.description || 'No description provided.'}</p>
            </div>
          </div>

          {/* Members list & Invite button */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex -space-x-2.5">
              {project?.members.slice(0, 4).map((member: any) => (
                member.avatar ? (
                  <img key={member.userId} src={member.avatar} alt={member.name} className="w-6.5 h-6.5 rounded-full object-cover border-2 border-zinc-950" title={`${member.name} (${member.role})`} />
                ) : (
                  <div key={member.userId} className="w-6.5 h-6.5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[9px] border-2 border-zinc-950" title={`${member.name} (${member.role})`}>
                    {member.name.slice(0, 2)}
                  </div>
                )
              ))}
              {(project?.members.length || 0) > 4 && (
                <div className="w-6.5 h-6.5 rounded-full bg-zinc-800 border-2 border-zinc-950 text-zinc-400 flex items-center justify-center font-bold text-[9px]">
                  +{(project?.members.length || 0) - 4}
                </div>
              )}
            </div>
            {project?.myRole !== 'VIEWER' && (
              <Button size="sm" variant="glass" className="h-7 text-[10px]" onClick={() => setIsInviteOpen(true)}>
                <UserPlus size={12} className="mr-1.5" /> Invite
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Board Utility Row */}
      <div className="h-12 border-b border-zinc-800/80 px-6 flex items-center justify-between shrink-0 bg-zinc-900/15">
        <div className="flex items-center gap-4 text-xs font-semibold text-zinc-400">
          {/* Priority filter selector */}
          <div className="flex items-center gap-1.5">
            <Filter size={11} className="text-zinc-550" />
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-transparent border-0 py-1.5 pl-0 pr-6 text-xs font-bold text-zinc-350 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="LOW">Low Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="CRITICAL">Critical Priority</option>
            </select>
          </div>

          {/* Assignee filter selector */}
          <div className="flex items-center gap-1.5 border-l border-zinc-800 pl-4">
            <User size={11} className="text-zinc-550" />
            <select
              value={assigneeFilter}
              onChange={(e) => setAssigneeFilter(e.target.value)}
              className="bg-transparent border-0 py-1.5 pl-0 pr-6 text-xs font-bold text-zinc-350 focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="ALL">All Assignees</option>
              {project?.members.map((m: any) => (
                <option key={m.userId} value={m.userId}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Progress badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Progress</span>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded-full">
            {project?.progress}% Done
          </span>
        </div>
      </div>

      {/* Kanban Board Grid */}
      <div className="flex-1 overflow-x-auto p-6 flex gap-4 bg-zinc-950/20">
        {COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t: any) => t.status === col.id);
          const isOver = draggedOverCol === col.id;

          return (
            <div 
              key={col.id} 
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className="w-72 shrink-0 flex flex-col max-h-full"
            >
              {/* Column Title */}
              <div className="flex items-center justify-between pb-3 shrink-0 px-1 select-none">
                <div className="flex items-center gap-2">
                  <span className={`w-1 h-3 rounded-full bg-zinc-650`} style={{
                    backgroundColor: col.id === 'BACKLOG' ? '#71717a' : 
                                    col.id === 'TODO' ? '#a1a1aa' :
                                    col.id === 'IN_PROGRESS' ? '#f59e0b' :
                                    col.id === 'REVIEW' ? '#6366f1' :
                                    col.id === 'TESTING' ? '#a855f7' : '#10b981'
                  }} />
                  <h3 className="text-xs font-bold text-zinc-100 tracking-wide">{col.label}</h3>
                  <span className="text-[10px] font-bold bg-zinc-900 border border-zinc-800 text-zinc-500 px-1.5 py-0.2 rounded-full">
                    {colTasks.length}
                  </span>
                </div>
                {project?.myRole !== 'VIEWER' && (
                  <button
                    onClick={() => {
                      setNewTaskCol(col.id);
                      setIsCreateTaskOpen(true);
                    }}
                    className="p-1 hover:bg-zinc-900 rounded text-zinc-500 hover:text-zinc-300 transition-all"
                  >
                    <Plus size={13} />
                  </button>
                )}
              </div>

              {/* Column Cards Area */}
              <div 
                className={`flex-1 overflow-y-auto flex flex-col gap-2.5 rounded-xl border border-transparent p-1 transition-all ${
                  isOver ? 'bg-indigo-500/[0.02] border-dashed border-zinc-850' : ''
                }`}
                onDragLeave={() => setDraggedOverCol(null)}
              >
                {colTasks.map((task: any) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="group glass-card border border-zinc-850 p-4 rounded-xl hover:border-zinc-700/60 cursor-grab active:cursor-grabbing hover:bg-zinc-900/35 transition-all select-none hover:shadow-lg flex flex-col gap-3 relative"
                  >
                    {/* Priority Badge */}
                    <div className="flex items-center justify-between">
                      <Badge variant={`priority-${task.priority.toLowerCase()}` as any}>{task.priority}</Badge>
                      <button className="opacity-0 group-hover:opacity-100 p-0.5 text-zinc-500 hover:text-zinc-300 rounded transition-all">
                        <MoreHorizontal size={12} />
                      </button>
                    </div>

                    {/* Task Title */}
                    <p className="text-xs font-semibold text-zinc-200 tracking-tight leading-snug">{task.title}</p>

                    {/* Task Stats Indicators */}
                    <div className="flex items-center justify-between mt-1 shrink-0">
                      <div className="flex items-center gap-2.5 text-[10px] text-zinc-500 font-medium">
                        {task.checklists?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <CheckSquare size={10.5} />
                            <span>
                              {task.checklists.filter((c: any) => c.isCompleted).length}/{task.checklists.length}
                            </span>
                          </div>
                        )}
                        {task.comments?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <MessageSquare size={10.5} />
                            <span>{task.comments.length}</span>
                          </div>
                        )}
                        {task.attachments?.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Paperclip size={10.5} />
                            <span>{task.attachments.length}</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className="flex items-center gap-1 text-[9px] text-zinc-650 font-semibold bg-zinc-900 border border-zinc-800 px-1 rounded">
                            {new Date(task.dueDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      {/* Assignee Avatar */}
                      {task.assignee ? (
                        task.assignee.avatar ? (
                          <img src={task.assignee.avatar} alt={task.assignee.name} className="w-5 h-5 rounded-full object-cover border border-zinc-800 shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-[8px] uppercase shrink-0">
                            {task.assignee.name.slice(0, 2)}
                          </div>
                        )
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-dashed border-zinc-800 flex items-center justify-center text-[8px] text-zinc-700 shrink-0">U</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Drawer details view */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdate={fetchProject}
        />
      )}

      {/* Modal: Invite Member */}
      <Dialog isOpen={isInviteOpen} onClose={() => setIsInviteOpen(false)} title="Invite Project Member">
        <form onSubmit={handleInviteSubmit} className="flex flex-col gap-4">
          {inviteError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs px-3.5 py-2 rounded-lg">
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2 rounded-lg">
              {inviteSuccess}
            </div>
          )}

          <Input
            label="Email address"
            type="email"
            placeholder="member@workspace.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            required
          />

          <Select
            label="Workspace Role"
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value)}
            options={[
              { value: 'MEMBER', label: 'Member (Write Access)' },
              { value: 'ADMIN', label: 'Admin (Full Management)' },
              { value: 'VIEWER', label: 'Viewer (Read Only)' }
            ]}
          />

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={inviteLoading}>
            Send Project Invite
          </Button>
        </form>
      </Dialog>

      {/* Modal: Create Task */}
      <Dialog isOpen={isCreateTaskOpen} onClose={() => setIsCreateTaskOpen(false)} title="Create New Task">
        <form onSubmit={handleCreateTaskSubmit} className="flex flex-col gap-4">
          <Input
            label="Task Title"
            type="text"
            placeholder="e.g. Build Auth API router"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            required
          />

          <Input
            label="Description (optional)"
            type="text"
            placeholder="Summary of task requirements"
            value={newTaskDesc}
            onChange={(e) => setNewTaskDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Priority"
              value={newTaskPriority}
              onChange={(e) => setNewTaskPriority(e.target.value)}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' }
              ]}
            />

            <Select
              label="Assignee"
              value={newTaskAssignee}
              onChange={(e) => setNewTaskAssignee(e.target.value)}
              options={[
                { value: '', label: 'Unassigned' },
                ...project.members.map((m: any) => ({ value: m.userId, label: m.name }))
              ]}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={taskCreateLoading}>
            Create Task
          </Button>
        </form>
      </Dialog>
    </div>
  );
};
