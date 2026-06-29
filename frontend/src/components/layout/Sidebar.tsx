import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Calendar, BarChart3, Settings, LogOut, Star, Folder, Plus, Sparkles } from 'lucide-react';

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
    { id: 'ailab', label: 'AI Developer Lab', icon: <Sparkles size={15} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={15} /> }
  ];

  const favorites = projects.filter((p) => p.isFavorite && !p.isArchived);
  const activeProjects = projects.filter((p) => !p.isArchived);

  return (
    <aside className="w-64 bg-surface-container-low border-r border-outline-variant/10 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-outline-variant/10 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="TaskForge Logo" className="w-7 h-7 rounded-lg object-cover border border-outline-variant/20 shadow-sm" />
          <span className="font-black text-base text-primary tracking-wider">TaskForge</span>
        </div>
      </div>

      {/* New Project CTA */}
      <div className="p-4 shrink-0">
        <button
          onClick={onOpenCreateProject}
          className="w-full py-2.5 px-4 bg-primary text-on-primary font-bold rounded-xl flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(192,193,255,0.25)] hover:scale-[1.01] active:scale-[0.98] transition-all duration-200"
        >
          <Plus size={15} />
          <span className="text-xs font-semibold tracking-wide">New Project</span>
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-primary font-bold bg-primary-container/10 border-l-2 border-primary translate-x-1'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-highest/30'
              }`}
            >
              <span className={isActive ? 'text-primary' : 'text-on-surface-variant/75'}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </button>
          );
        })}

        {/* Favorites Section */}
        {favorites.length > 0 && (
          <div className="pt-4 flex flex-col gap-1">
            <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-on-surface-variant/40 tracking-wider uppercase">
              <span>Favorites</span>
              <Star size={10} className="fill-primary/10 text-primary/60" />
            </div>
            <div className="space-y-0.5">
              {favorites.map((p) => {
                const isActive = activePage === `board:${p.id}`;
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate('board', { projectId: p.id })}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs rounded-lg text-left truncate transition-all duration-200 ${
                      isActive
                        ? 'text-primary font-bold bg-primary-container/10 border-l-2 border-primary translate-x-1'
                        : 'text-on-surface-variant font-medium hover:bg-surface-container-highest/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-ping" style={{ backgroundColor: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Projects Section */}
        <div className="pt-4 flex flex-col gap-1">
          <div className="px-4 py-1.5 flex items-center justify-between text-[10px] font-bold text-on-surface-variant/40 tracking-wider uppercase">
            <span>Projects</span>
          </div>
          <div className="space-y-0.5">
            {activeProjects.length === 0 ? (
              <span className="px-4 py-2 text-[10px] text-on-surface-variant/40 italic">No active projects</span>
            ) : (
              activeProjects.map((p) => {
                const isActive = activePage === `board:${p.id}`;
                return (
                  <button
                    key={p.id}
                    onClick={() => onNavigate('board', { projectId: p.id })}
                    className={`w-full flex items-center gap-3 px-4 py-2 text-xs rounded-lg text-left truncate transition-all duration-200 ${
                      isActive
                        ? 'text-primary font-bold bg-primary-container/10 border-l-2 border-primary translate-x-1'
                        : 'text-on-surface-variant font-medium hover:bg-surface-container-highest/30'
                    }`}
                  >
                    <Folder size={13} className="shrink-0" style={{ color: p.color }} />
                    <span className="truncate">{p.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </nav>

      {/* User profile details & Logout */}
      <div className="p-4 border-t border-outline-variant/10 shrink-0 bg-surface-container-lowest/40">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-outline-variant/30" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {user?.name.slice(0, 2)}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-semibold text-on-surface truncate leading-tight">{user?.name}</p>
              <p className="text-[10px] text-on-surface-variant/50 truncate leading-none mt-1">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-1.5 text-on-surface-variant/40 hover:text-error hover:bg-error-container/10 rounded-lg transition-all duration-250 shrink-0"
            title="Log Out"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
};
