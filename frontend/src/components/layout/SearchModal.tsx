import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Search, Folder, CheckSquare, X } from 'lucide-react';
import api from '../../services/api';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  projects: any[];
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  projects
}) => {
  const [query, setQuery] = useState('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced search tasks matching query
  useEffect(() => {
    if (!query.trim()) {
      setTasks([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const allTasks: any[] = [];
        for (const p of projects) {
          try {
            const res = await api.get(`/projects/${p.id}`);
            allTasks.push(...(res.data.tasks || []).map((t: any) => ({ 
              ...t, 
              projectName: p.name, 
              projectColor: p.color 
            })));
          } catch (err) {
            console.error(err);
          }
        }
        
        const filtered = allTasks.filter(
          (t) => t.title.toLowerCase().includes(query.toLowerCase()) || 
                 (t.description || '').toLowerCase().includes(query.toLowerCase())
        );
        setTasks(filtered);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [query, projects]);

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelectProject = (projectId: string) => {
    onNavigate('board', { projectId });
    onClose();
  };

  const handleSelectTask = (projectId: string, taskId: string) => {
    onNavigate('board', { projectId, openTaskId: taskId });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[15vh]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Search Modal Panel */}
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="w-full max-w-xl bg-zinc-900 border border-zinc-800/80 rounded-xl shadow-2xl overflow-hidden relative z-10 flex flex-col max-h-[50vh] glass-panel"
          >
            {/* Input row */}
            <div className="flex items-center px-4 py-3 border-b border-zinc-800/80 gap-3">
              <Search size={15} className="text-zinc-500" />
              <input
                autoFocus
                type="text"
                placeholder="Search projects or tasks..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-0 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-0"
              />
              <button
                onClick={onClose}
                className="text-zinc-500 hover:text-zinc-350 p-0.5 rounded hover:bg-zinc-800/50"
              >
                <X size={14} />
              </button>
            </div>

            {/* Scrollable list content */}
            <div className="overflow-y-auto p-3 flex flex-col gap-4">
              {/* Projects List */}
              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">
                  Projects
                </h4>
                {filteredProjects.length === 0 ? (
                  <p className="px-2.5 text-xs text-zinc-550 italic">No matching projects</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {filteredProjects.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectProject(p.id)}
                        className="w-full text-left px-2.5 py-2 text-xs text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/40 rounded-lg flex items-center gap-2.5 transition-all"
                      >
                        <Folder size={12} style={{ color: p.color }} />
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tasks List */}
              <div>
                <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-2.5 mb-1.5">
                  Tasks
                </h4>
                {loading ? (
                  <p className="px-2.5 text-xs text-zinc-550 animate-pulse italic">Searching...</p>
                ) : tasks.length === 0 ? (
                  <p className="px-2.5 text-xs text-zinc-550 italic">
                    {query ? 'No matching tasks' : 'Type to search tasks'}
                  </p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {tasks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSelectTask(t.projectId, t.id)}
                        className="w-full text-left px-2.5 py-2 text-xs text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800/40 rounded-lg flex items-center gap-2.5 transition-all justify-between"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <CheckSquare size={13} className="text-zinc-500 shrink-0" />
                          <span className="truncate">{t.title}</span>
                        </div>
                        <span className="text-[9px] text-zinc-500 shrink-0 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700/60 font-semibold uppercase">
                          {t.projectName}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
