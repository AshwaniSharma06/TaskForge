import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Folder, CheckSquare, Clock, AlertCircle, Calendar } from 'lucide-react';
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
  const nextCriticalTask = stats?.upcomingDeadlines?.[0];

  return (
    <div className="p-6 flex flex-col gap-6 overflow-y-auto h-full max-w-[1440px] mx-auto custom-scrollbar select-none">
      
      {/* Hero Grid Section */}
      <div className="grid grid-cols-12 gap-6 items-stretch">
        
        {/* Welcome AI Summary Card */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none text-primary">
            <Clock size={120} />
          </div>
          
          <div className="w-full md:w-1/3 flex flex-col gap-3 z-10">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight">
              {welcomeMessage()}, {user?.name.split(' ')[0]}
            </h1>
            <p className="text-on-surface-variant/75 text-xs leading-relaxed">
              You're on track for a productive day. Here's your workspace briefing.
            </p>
            <div className="flex gap-2 mt-2">
              <span className="px-2.5 py-0.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[9px] font-bold uppercase tracking-wider">
                AI Synced
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] font-bold uppercase tracking-wider">
                On Schedule
              </span>
            </div>
          </div>
          
          <div className="w-full md:w-2/3 bg-white/[0.03] rounded-xl p-4 border border-outline-variant/10 z-10 shadow-inner">
            <div className="flex items-center gap-2 mb-2 text-primary">
              <span className="material-symbols-outlined text-[18px] animate-pulse">bolt</span>
              <span className="font-bold text-xs uppercase tracking-wider font-label">AI Status Summary</span>
            </div>
            <p className="text-xs text-on-background leading-relaxed font-medium">
              "You have <span className="text-primary font-bold">{stats?.totalProjects} active projects</span> and <span className="text-secondary font-bold">{stats?.activeTasks} pending tasks</span> in your pipeline. 
              {stats?.overdueTasks && stats.overdueTasks > 0 ? (
                <span> There are <span className="text-error font-bold">{stats.overdueTasks} overdue tasks</span> requiring attention.</span>
              ) : (
                <span> No tasks are currently overdue.</span>
              )}
              {nextCriticalTask ? (
                <span> We recommend focusing on <span className="text-primary font-bold">"{nextCriticalTask.title}"</span> next."</span>
              ) : (
                <span> All your milestones are currently on track."</span>
              )}
            </p>
          </div>
        </div>

        {/* AI Assistant Widget (Critical Action Card) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-2xl p-6 relative shimmer-border bg-gradient-to-br from-surface-container-low to-surface-container flex flex-col justify-between min-h-[160px]">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary border border-primary/25">
              <span className="material-symbols-outlined text-[18px]">smart_toy</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/40 font-label">Priority Suggestion</span>
          </div>

          <div className="my-2">
            <h3 className="text-sm font-bold text-on-surface tracking-tight mb-1.5">Next Critical Action</h3>
            {nextCriticalTask ? (
              <div 
                onClick={() => onNavigate('board', { projectId: nextCriticalTask.projectId, openTaskId: nextCriticalTask.id })}
                className="p-3 bg-white/[0.02] hover:bg-white/[0.06] rounded-xl border border-outline-variant/10 cursor-pointer transition-all duration-200 group"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-on-surface group-hover:text-primary transition-colors truncate max-w-[150px]">
                    {nextCriticalTask.title}
                  </span>
                  <span className="text-error font-bold text-[9px] uppercase tracking-wide">
                    {nextCriticalTask.priority}
                  </span>
                </div>
                <p className="text-[10px] text-on-surface-variant/60 truncate">{nextCriticalTask.project.name}</p>
                <div className="w-full bg-white/[0.04] h-1 rounded-full overflow-hidden mt-2 border border-outline-variant/10">
                  <div className="bg-primary h-full transition-all duration-500" style={{ width: `${nextCriticalTask.progress || 0}%` }} />
                </div>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-on-surface-variant/40 italic">
                All caught up! No pending deadlines.
              </div>
            )}
          </div>
        </div>

        {/* Project Statistics (4 Cards) */}
        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-card rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.01]">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Folder size={18} />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant/45 font-bold uppercase tracking-wider font-label">Active Projects</p>
            <h2 className="text-xl font-black text-on-surface mt-0.5">{stats?.totalProjects}</h2>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-card rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.01]">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <CheckSquare size={18} />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant/45 font-bold uppercase tracking-wider font-label">Pending Tasks</p>
            <h2 className="text-xl font-black text-on-surface mt-0.5">{stats?.activeTasks}</h2>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-card rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.01]">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant/45 font-bold uppercase tracking-wider font-label">Completed Tasks</p>
            <h2 className="text-xl font-black text-on-surface mt-0.5">{stats?.completedTasks}</h2>
          </div>
        </div>

        <div className="col-span-12 md:col-span-6 lg:col-span-3 glass-card rounded-2xl p-6 flex items-center gap-4 hover:scale-[1.01]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
            (stats?.overdueTasks || 0) > 0 
              ? 'bg-error/15 border-error/25 text-error animate-pulse' 
              : 'bg-white/[0.04] border-outline-variant/30 text-on-surface-variant'
          }`}>
            <AlertCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] text-on-surface-variant/45 font-bold uppercase tracking-wider font-label">Overdue Tasks</p>
            <h2 className={`text-xl font-black mt-0.5 ${(stats?.overdueTasks || 0) > 0 ? 'text-error' : 'text-on-surface'}`}>
              {stats?.overdueTasks}
            </h2>
          </div>
        </div>

        {/* Productivity Chart (Spans 8 columns) */}
        <div className="col-span-12 lg:col-span-8 glass-card rounded-2xl p-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-sm font-bold text-on-surface">Productivity Output</h3>
              <p className="text-xs text-on-surface-variant/65">Weekly completed tasks overview</p>
            </div>
          </div>

          <div className="h-48 w-full relative mt-6">
            <div className="absolute bottom-0 w-full h-full flex items-end justify-between px-2 gap-4 z-10">
              {stats?.productivityOverview.map((item) => {
                const percent = (item.count / maxProductivityCount) * 100;
                return (
                  <div key={item.day} className="flex-grow flex flex-col items-center group relative">
                    {/* Tooltip value */}
                    <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-surface-container border border-outline-variant/25 text-[9px] font-bold px-2 py-0.5 rounded text-primary transition-all shadow-md z-20">
                      {item.count} Tasks
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full bg-primary/10 border-t-2 border-primary/20 hover:bg-primary/25 rounded-t-md transition-all duration-300 relative cursor-pointer" 
                      style={{ height: `${Math.max(percent, 4)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-secondary/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] font-bold mt-2 text-on-surface-variant/50 uppercase tracking-wider font-label">{item.day}</span>
                  </div>
                );
              })}
            </div>
            
            {/* Grid background lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-5">
              <div className="w-full border-t border-on-surface"></div>
              <div className="w-full border-t border-on-surface"></div>
              <div className="w-full border-t border-on-surface"></div>
              <div className="w-full border-t border-on-surface"></div>
            </div>
          </div>
        </div>

        {/* Recent Activity Feed (Spans 4 columns) */}
        <div className="col-span-12 lg:col-span-4 glass-card rounded-2xl p-6 flex flex-col max-h-[300px]">
          <div className="flex justify-between items-center mb-4 shrink-0">
            <h3 className="text-sm font-bold text-on-surface">Recent Activity</h3>
          </div>

          <div className="space-y-4 overflow-y-auto custom-scrollbar pr-2 flex-1">
            {stats?.recentActivity.length === 0 ? (
              <div className="text-center py-8 text-xs text-on-surface-variant/40 italic">No recent activities</div>
            ) : (
              stats?.recentActivity.map((act, idx) => (
                <div key={act.id} className="flex gap-3 relative">
                  {idx !== stats.recentActivity.length - 1 && (
                    <div className="absolute left-3.5 top-8 bottom-0 w-px bg-outline-variant/15"></div>
                  )}
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex-shrink-0 flex items-center justify-center border border-primary/20 z-10 text-primary">
                    <span className="material-symbols-outlined text-[14px]">edit</span>
                  </div>
                  <div className="flex-1 pb-3">
                    <p className="text-xs text-on-surface font-medium leading-relaxed">
                      <span className="font-bold text-primary">{act.user.name.split(' ')[0]}</span>{' '}
                      <span className="text-on-surface-variant/75">{act.details}</span>
                    </p>
                    <p className="text-[9px] text-on-surface-variant/40 mt-1">
                      {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
        </div>
      </div>
    </div>
  );
};
