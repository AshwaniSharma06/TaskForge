import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { BarChart3, TrendingUp, Users, CheckCircle, Percent } from 'lucide-react';

interface AnalyticsData {
  totalProjects: number;
  activeTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueTasks: number;
  workloadDistribution: { name: string; avatar: string | null; taskCount: number }[];
  productivityOverview: { day: string; count: number }[];
}

export const AnalyticsPage: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/analytics/dashboard-stats');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
          <div className="h-64 bg-zinc-900 border border-zinc-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // Calculations
  const totalTasks = (data?.activeTasks || 0) + (data?.completedTasks || 0);
  const completionRate = totalTasks > 0 ? Math.round(((data?.completedTasks || 0) / totalTasks) * 100) : 0;
  
  const maxWorkload = Math.max(...(data?.workloadDistribution.map((w) => w.taskCount) || [1]), 1);

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto max-w-7xl mx-auto select-none">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
          <BarChart3 size={18} className="text-indigo-400" />
          Analytics Dashboard
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Productivity metrics and workload distribution analysis</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Percent size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Completion Rate</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{completionRate}%</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
            <CheckCircle size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Completions (Total)</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{data?.completedTasks}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <TrendingUp size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Active Backlog</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">{data?.activeTasks}</h3>
          </div>
        </Card>

        <Card className="flex items-center gap-4 py-4" hoverEffect>
          <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Users size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Team Capacity</p>
            <h3 className="text-xl font-bold text-zinc-50 mt-0.5">Optimal</h3>
          </div>
        </Card>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Workload Distribution */}
        <Card className="flex flex-col gap-5">
          <div>
            <h3 className="text-xs font-bold text-zinc-50 uppercase tracking-wider">Active Workload Distribution</h3>
            <p className="text-[10px] text-zinc-500">Uncompleted tasks assigned per team member</p>
          </div>

          <div className="flex flex-col gap-4 py-2">
            {data?.workloadDistribution.length === 0 ? (
              <div className="text-center py-6 text-xs text-zinc-500 italic">No assigned workload</div>
            ) : (
              data?.workloadDistribution.map((member) => {
                const percent = (member.taskCount / maxWorkload) * 100;
                return (
                  <div key={member.name} className="flex flex-col gap-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        {member.avatar ? (
                          <img src={member.avatar} alt={member.name} className="w-5.5 h-5.5 rounded-full object-cover border border-zinc-800" />
                        ) : (
                          <div className="w-5.5 h-5.5 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-[8px] uppercase">
                            {member.name.slice(0, 2)}
                          </div>
                        )}
                        <span className="font-semibold text-zinc-300">{member.name}</span>
                      </div>
                      <span className="font-bold text-zinc-400">{member.taskCount} tasks</span>
                    </div>

                    {/* Progress Bar container */}
                    <div className="w-full h-2.5 bg-zinc-950 border border-zinc-850 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>

        {/* Task Completion Rate Doughnut representation */}
        <Card className="flex flex-col gap-5 items-center justify-center text-center">
          <div className="self-start text-left">
            <h3 className="text-xs font-bold text-zinc-50 uppercase tracking-wider">Task Allocation Ratio</h3>
            <p className="text-[10px] text-zinc-500">Completed vs Pending Tasks Ratio</p>
          </div>

          <div className="relative w-44 h-44 flex items-center justify-center mt-3">
            {/* SVG circular donut chart */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="#18181b" // bg-zinc-900 border
                strokeWidth="3.2"
              />
              <circle
                cx="18"
                cy="18"
                r="15.915"
                fill="none"
                stroke="url(#indigoGrad)"
                strokeWidth="3.2"
                strokeDasharray={`${completionRate} ${100 - completionRate}`}
                strokeDashoffset="25"
                className="transition-all duration-1000"
              />
              {/* Gradients */}
              <defs>
                <linearGradient id="indigoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Absolute text in center */}
            <div className="absolute flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-50 leading-none">{completionRate}%</span>
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mt-1">Completions</span>
            </div>
          </div>

          <div className="flex gap-6 mt-3 text-xs justify-center font-bold">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-indigo-550 shrink-0" />
              <span className="text-zinc-400">Completed: {data?.completedTasks}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded bg-zinc-900 shrink-0 border border-zinc-800" />
              <span className="text-zinc-450">Pending: {data?.activeTasks}</span>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};
