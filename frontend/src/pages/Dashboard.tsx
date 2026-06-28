import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Folder, CheckSquare, Clock, AlertCircle, ArrowRight, Activity, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface DashboardStats {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  upcomingDeadlines: any[];
  recentActivity: any[];
  workloadDistribution: any[];
  productivityOverview: { day: string; count: number }[];
}

interface DashboardProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/analytics/dashboard-stats');
        setStats(res.data);
      } catch (err) {
        console.error('Failed to fetch dashboard stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-8 bg-zinc-800 rounded w-1/4 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-zinc-900 border border-zinc-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
          <div className="lg:col-span-2 h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  const welcomeMessage = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const maxProductivityCount = Math.max(...(stats?.productivityOverview.map((d) => d.count) || [1]), 4);

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full max-w-7xl mx-auto">
      {/* Welcome header */}
      <div>
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight">
          {welcomeMessage()}, {user?.name.split(' ')[0]}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Here is what is happening in your workspace today.</p>
      </div>

      {/* Grid count cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Folder size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Total Projects</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{stats?.totalProjects}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <CheckSquare size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Tasks</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{stats?.activeTasks}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Tasks Completed</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{stats?.completedTasks}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className={`p-2.5 rounded-lg border ${
            (stats?.overdueTasks || 0) > 0 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-450' 
              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
          }`}>
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Overdue Tasks</p>
            <h3 className={`text-xl font-bold mt-0.5 ${(stats?.overdueTasks || 0) > 0 ? 'text-rose-400' : 'text-zinc-50'}`}>
              {stats?.overdueTasks}
            </h3>
          </div>
        </Card>
      </div>

      {/* Main Dashboards Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Productivity + Deadlines */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Productivity Overview (Animated SVG Bar Chart) */}
          <Card className="flex flex-col gap-4">
            <div>
              <h3 className="text-xs font-bold text-zinc-50 uppercase tracking-wider">Productivity Overview</h3>
              <p className="text-[10px] text-zinc-500">Number of tasks completed per day over the last 7 days</p>
            </div>
            
            <div className="h-48 w-full flex items-end justify-between px-4 pt-4 border-b border-zinc-850 pb-2 relative">
              {stats?.productivityOverview.map((item, index) => {
                const percent = (item.count / maxProductivityCount) * 100;
                return (
                  <div key={item.day} className="flex flex-col items-center gap-2 group w-10 relative">
                    {/* Tooltip value */}
                    <div className="absolute -top-7 opacity-0 group-hover:opacity-100 bg-zinc-900 border border-zinc-800 text-[10px] px-1.5 py-0.5 rounded text-zinc-200 transition-all shadow-md z-10 shrink-0">
                      {item.count} tasks
                    </div>
                    {/* Chart Bar */}
                    <div className="w-6 bg-gradient-to-t from-indigo-600/50 to-violet-500 rounded-t relative overflow-hidden transition-all duration-300 group-hover:from-indigo-500/70 group-hover:to-violet-400" style={{ height: `${Math.max(percent, 4)}%` }}>
                      <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Label */}
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wide uppercase">{item.day}</span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-zinc-50 uppercase tracking-wider">Upcoming Deadlines</h3>
                <p className="text-[10px] text-zinc-500">Uncompleted tasks due soon across your workspace</p>
              </div>
            </div>

            <div className="flex flex-col gap-2.5">
              {stats?.upcomingDeadlines.length === 0 ? (
                <div className="text-center py-6 text-xs text-zinc-500 italic">No upcoming deadlines! Good job.</div>
              ) : (
                stats?.upcomingDeadlines.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onNavigate('board', { projectId: task.projectId, openTaskId: task.id })}
                    className="flex items-center justify-between p-3 rounded-lg border border-zinc-800/60 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-zinc-700/60 cursor-pointer transition-all gap-4"
                  >
                    <div className="min-w-0 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant={`priority-${task.priority.toLowerCase() as any}`}>{task.priority}</Badge>
                        <span className="text-xs font-semibold text-zinc-150 truncate leading-none">{task.title}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-medium">
                        <span className="truncate">{task.project.name}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(task.dueDate).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {/* Assignee initials or avatar */}
                    {task.assignee ? (
                      task.assignee.avatar ? (
                        <img src={task.assignee.avatar} alt={task.assignee.name} className="w-6 h-6 rounded-full object-cover shrink-0 border border-zinc-800" title={task.assignee.name} />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-[9px] shrink-0" title={task.assignee.name}>
                          {task.assignee.name.slice(0, 2)}
                        </div>
                      )
                    ) : (
                      <div className="w-6 h-6 rounded-full border border-dashed border-zinc-700 flex items-center justify-center text-[9px] text-zinc-650 shrink-0">U</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Right Column: Recent Activities timeline */}
        <Card className="flex flex-col gap-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-50 uppercase tracking-wider">Recent Activity</h3>
            <p className="text-[10px] text-zinc-500">Activity logs across your workspace projects</p>
          </div>

          <div className="flex flex-col relative pl-4 border-l border-zinc-800 gap-5 max-h-[460px] overflow-y-auto pr-1">
            {stats?.recentActivity.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-550 italic pl-0">No recent activity</div>
            ) : (
              stats?.recentActivity.map((act) => (
                <div key={act.id} className="relative flex flex-col gap-1 text-xs">
                  {/* Vertical circle marker */}
                  <span className="absolute -left-[20.5px] top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-550 border-2 border-zinc-950 ring-2 ring-indigo-500/10 shrink-0" />
                  
                  <div className="flex items-center gap-1.5">
                    {act.user.avatar ? (
                      <img src={act.user.avatar} alt={act.user.name} className="w-4 h-4 rounded-full object-cover border border-zinc-800" />
                    ) : (
                      <div className="w-4 h-4 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[8px] uppercase">
                        {act.user.name.slice(0, 2)}
                      </div>
                    )}
                    <span className="font-semibold text-zinc-200">{act.user.name}</span>
                  </div>
                  <p className="text-zinc-400 leading-snug pl-5">
                    {act.details}
                  </p>
                  <span className="text-[9px] text-zinc-550 pl-5">
                    {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(act.createdAt).toLocaleDateString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
