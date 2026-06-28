import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, BarChart3, Settings, LogOut, Star, Folder, Plus } from 'lucide-react';

interface Project {
  id: string;
  name: string;
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
}

interface SidebarProps {
  activePage: string;
  onNavigate: (page: string, params?: Record<string, string>) => void;
  projects: Project[];
  onOpenCreateProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onNavigate,
  projects,
  onOpenCreateProject
}) => {
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={15} /> },
    { id: 'calendar', label: 'Calendar', icon: <Calendar size={15} /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> }
  ];

  const favorites = projects.filter((p) => p.isFavorite && !p.isArchived);
  const activeProjects = projects.filter((p) => !p.isArchived);

  return (
    <aside className="w-64 bg-zinc-900 border-r border-zinc-800/80 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-14 px-5 border-b border-zinc-800/80 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shadow">
            TF
          </div>
          <span className="font-bold text-sm text-zinc-100 tracking-wider">TaskForge</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="p-3.5 flex flex-col gap-1 shrink-0">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
              activePage === item.id
                ? 'bg-zinc-800 text-zinc-50 border border-white/5 shadow-inner'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40 border border-transparent'
            }`}
          >
            <span className={activePage === item.id ? 'text-indigo-450' : 'text-zinc-500'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* Favorites Section */}
      {favorites.length > 0 && (
        <div className="px-3.5 py-2 flex flex-col gap-1.5 shrink-0">
          <div className="px-3 flex items-center justify-between text-[10px] font-bold text-zinc-500 tracking-wider uppercase">
            <span>Favorites</span>
            <Star size={10} className="fill-amber-500/10 text-amber-505" />
          </div>
          <div className="flex flex-col gap-0.5 max-h-[140px] overflow-y-auto">
            {favorites.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate('board', { projectId: p.id })}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg text-left truncate transition-all ${
                  activePage === `board:${p.id}`
                    ? 'bg-zinc-800 text-zinc-100 border border-white/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30 border border-transparent'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Projects Section */}
      <div className="px-3.5 py-2 flex flex-col gap-1.5 flex-grow overflow-hidden">
        <div className="px-3 flex items-center justify-between text-[10px] font-bold text-zinc-500 tracking-wider uppercase shrink-0">
          <span>Projects</span>
          <button
            onClick={onOpenCreateProject}
            className="p-0.5 text-zinc-500 hover:text-zinc-350 hover:bg-zinc-800/60 rounded transition-all"
            title="Create Project"
          >
            <Plus size={12} />
          </button>
        </div>
        <div className="flex flex-col gap-0.5 overflow-y-auto flex-grow pb-4">
          {activeProjects.length === 0 ? (
            <span className="px-3 py-2 text-[10px] text-zinc-550 italic">No active projects</span>
          ) : (
            activeProjects.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate('board', { projectId: p.id })}
                className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs rounded-lg text-left truncate transition-all border border-transparent ${
                  activePage === `board:${p.id}`
                    ? 'bg-zinc-800 text-zinc-100 border-white/5'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
                }`}
              >
                <Folder size={12} className="shrink-0" style={{ color: p.color }} />
                <span className="truncate">{p.name}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* User profile details & Logout */}
      <div className="p-3.5 border-t border-zinc-800/80 shrink-0 bg-zinc-900/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-zinc-800" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.name.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-zinc-100 truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate leading-none mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-zinc-500 hover:text-rose-450 hover:bg-rose-500/10 rounded-lg transition-all shrink-0"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
