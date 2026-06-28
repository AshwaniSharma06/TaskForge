import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { TaskDetailModal } from '../components/board/TaskDetailModal';

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: string;
  priority: string;
  projectId: string;
  project: Project;
}

interface CalendarPageProps {
  projects: Project[];
}

export const CalendarPage: React.FC<CalendarPageProps> = ({ projects }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Fetch all tasks for the projects to map onto the calendar
  const fetchTasks = async () => {
    try {
      const allTasks: Task[] = [];
      for (const p of projects) {
        try {
          const res = await api.get(`/projects/${p.id}`);
          const pTasks = (res.data.tasks || []).map((t: any) => ({
            ...t,
            project: { id: p.id, name: p.name, color: p.color }
          }));
          allTasks.push(...pTasks);
        } catch (err) {
          console.error(err);
        }
      }
      // Filter tasks that have due dates
      setTasks(allTasks.filter((t) => t.dueDate));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projects.length > 0) {
      fetchTasks();
    } else {
      setLoading(false);
    }
  }, [projects]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Calendar Calculation Helpers
  const getDaysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
  const getFirstDayOfMonth = (y: number, m: number) => {
    const day = new Date(y, m, 1).getDay();
    // Adjust so Mon=0, Sun=6
    return day === 0 ? 6 : day - 1;
  };

  const daysInMonth = getDaysInMonth(year, month);
  const firstDayIndex = getFirstDayOfMonth(year, month);

  // Grid dates
  const daysArray: (Date | null)[] = [];
  // Padding from previous month
  const prevMonthDays = getDaysInMonth(year, month - 1);
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    daysArray.push(new Date(year, month - 1, prevMonthDays - i));
  }
  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    daysArray.push(new Date(year, month, i));
  }
  // Padding for next month to complete the row of 7 days
  const remaining = 42 - daysArray.length; // standard 6-row layout
  for (let i = 1; i <= remaining; i++) {
    daysArray.push(new Date(year, month + 1, i));
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month && date.getFullYear() === year;
  };

  const getTasksForDate = (date: Date) => {
    return tasks.filter((t) => {
      const d = new Date(t.dueDate);
      return d.getDate() === date.getDate() &&
             d.getMonth() === date.getMonth() &&
             d.getFullYear() === date.getFullYear();
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="p-6 flex flex-col gap-6 animate-pulse">
        <div className="h-10 bg-zinc-900 border border-zinc-800 rounded-xl w-1/4" />
        <div className="h-[450px] bg-zinc-900 border border-zinc-800 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-hidden max-w-7xl mx-auto select-none">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
            <CalendarIcon size={18} className="text-indigo-400" />
            Workspace Schedule
          </h1>
          <p className="text-xs text-zinc-400 mt-1">Timeline and deadlines of all project tasks</p>
        </div>

        <div className="flex items-center gap-2.5 bg-zinc-900/60 border border-zinc-800 p-1.5 rounded-xl shrink-0 glass-panel">
          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-bold" onClick={handleToday}>
            Today
          </Button>
          <div className="w-px h-4 bg-zinc-800" />
          <button onClick={handlePrevMonth} className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-semibold text-zinc-200 min-w-[100px] text-center">
            {monthNames[month]} {year}
          </span>
          <button onClick={handleNextMonth} className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-850 rounded">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <Card className="flex-1 p-0 overflow-hidden border border-zinc-800 flex flex-col glass-card bg-zinc-950/10">
        {/* Days of week titles */}
        <div className="grid grid-cols-7 border-b border-zinc-800 bg-zinc-900/40 text-center py-2 text-[10px] font-bold text-zinc-550 uppercase tracking-wider shrink-0">
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Calendar dates grid */}
        <div className="grid grid-cols-7 flex-grow divide-x divide-y divide-zinc-850/60 min-h-0 overflow-y-auto">
          {daysArray.map((date, idx) => {
            if (!date) return <div key={idx} className="bg-zinc-950/20" />;
            const dateTasks = getTasksForDate(date);
            const activeMonth = isCurrentMonth(date);

            return (
              <div
                key={idx}
                className={`p-2 flex flex-col min-h-[75px] transition-all hover:bg-zinc-900/10 relative ${
                  activeMonth ? 'bg-transparent' : 'bg-zinc-950/30 opacity-40'
                } ${isToday(date) ? 'bg-indigo-500/[0.01]' : ''}`}
              >
                {/* Day number */}
                <span className={`text-[10px] font-bold self-start w-5 h-5 flex items-center justify-center rounded-full ${
                  isToday(date) 
                    ? 'bg-indigo-650 text-white shadow shadow-indigo-600/20 border border-indigo-500/20' 
                    : activeMonth ? 'text-zinc-400' : 'text-zinc-650'
                }`}>
                  {date.getDate()}
                </span>

                {/* Day tasks */}
                <div className="flex flex-col gap-1.5 mt-2 overflow-y-auto max-h-[75px] scrollbar-none">
                  {dateTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="w-full text-left px-2 py-1 text-[9px] font-semibold truncate rounded border flex items-center gap-1.5 transition-all text-zinc-300 bg-zinc-900/60 border-zinc-800 hover:border-zinc-700/60 hover:bg-zinc-850"
                    >
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: task.project.color }} />
                      <span className={`truncate ${task.status === 'COMPLETED' ? 'line-through text-zinc-600' : ''}`}>
                        {task.title}
                      </span>
                    </button>
                  ))}
                  {dateTasks.length > 3 && (
                    <span className="text-[8px] text-zinc-550 font-bold px-2">
                      +{dateTasks.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Task Drawer overlay when selected */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
          onTaskUpdate={fetchTasks}
        />
      )}
    </div>
  );
};
