import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { SocketProvider } from './context/SocketContext';
import { ToastProvider } from './context/ToastContext';
import api from './services/api';

// Layout & Navigation
import { Sidebar } from './components/layout/Sidebar';
import { TopBar } from './components/layout/TopBar';
import { SearchModal } from './components/layout/SearchModal';
import { Dialog } from './components/ui/Dialog';
import { Input } from './components/ui/Input';
import { Select } from './components/ui/Select';
import { Button } from './components/ui/Button';

// Pages
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { BoardPage } from './pages/BoardPage';
import { CalendarPage } from './pages/CalendarPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AiLabPage } from './pages/AiLabPage';

interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  isFavorite: boolean;
  isArchived: boolean;
}

const WorkspaceShell: React.FC = () => {
  const { user, loading } = useAuth();
  
  // Navigation Routing States
  const [activePage, setActivePage] = useState<string>('dashboard');
  const [routeParams, setRouteParams] = useState<Record<string, string>>({});
  const [authPage, setAuthPage] = useState<string>('login');

  // Shared Workspace States
  const [projects, setProjects] = useState<Project[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isCreateProjectOpen, setIsCreateProjectOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [lastKey, setLastKey] = useState<string | null>(null);

  // New Project Form States
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectColor, setProjectColor] = useState('#6366f1');
  const [projectPriority, setProjectPriority] = useState('MEDIUM');
  const [projectCreateLoading, setProjectCreateLoading] = useState(false);

  // Navigation controller helper
  const onNavigate = (page: string, params: Record<string, string> = {}) => {
    setRouteParams(params);
    if (!user) {
      setAuthPage(page);
    } else {
      setActivePage(page);
    }
  };

  // Fetch projects when user logs in
  const fetchProjects = async () => {
    try {
      const res = await api.get('/projects');
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load workspace projects', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  // Global key listener for custom shortcuts and key sequences
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isTyping = document.activeElement?.tagName === 'INPUT' || 
                       document.activeElement?.tagName === 'TEXTAREA' || 
                       document.activeElement?.getAttribute('contenteditable') === 'true';
      
      if (isTyping) return;

      // Close all modals with Escape
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsCreateProjectOpen(false);
        setIsShortcutsOpen(false);
        return;
      }

      // Ctrl + K search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        if (user) setIsSearchOpen((prev) => !prev);
        return;
      }

      // Check key sequence 'g' + target
      if (lastKey === 'g') {
        setLastKey(null);
        if (e.key === 'd') { e.preventDefault(); onNavigate('dashboard'); }
        else if (e.key === 'c') { e.preventDefault(); onNavigate('calendar'); }
        else if (e.key === 'a') { e.preventDefault(); onNavigate('analytics'); }
        else if (e.key === 'l') { e.preventDefault(); onNavigate('ailab'); }
        else if (e.key === 's') { e.preventDefault(); onNavigate('settings'); }
        return;
      }

      if (e.key === 'g') {
        setLastKey('g');
        setTimeout(() => setLastKey(null), 1000); // Reset sequence prefix after 1s
        return;
      }

      // Create Project Dialog
      if (e.key === 'c') {
        e.preventDefault();
        setIsCreateProjectOpen(true);
        return;
      }

      // Shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setIsShortcutsOpen(true);
        return;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [user, lastKey]);

  // Handle Create Project Submit
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    setProjectCreateLoading(true);

    try {
      const res = await api.post('/projects', {
        name: projectName,
        description: projectDesc,
        color: projectColor,
        priority: projectPriority
      });

      setProjects((prev) => [...prev, res.data]);
      setIsCreateProjectOpen(false);
      setProjectName('');
      setProjectDesc('');
      setProjectColor('#6366f1');
      onNavigate('board', { projectId: res.data.id });
    } catch (err) {
      console.error(err);
    } finally {
      setProjectCreateLoading(false);
    }
  };

  // 1. Loading Overlay Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col justify-center items-center">
        <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg animate-pulse shadow-lg shadow-indigo-500/5">
          TF
        </div>
        <p className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider mt-4 animate-pulse">
          Loading TaskForge workspace...
        </p>
      </div>
    );
  }

  // 2. Unauthenticated Screens (Auth pages)
  if (!user) {
    switch (authPage) {
      case 'signup':
        return <Signup onNavigate={onNavigate} />;
      case 'forgot-password':
        return <ForgotPassword onNavigate={onNavigate} />;
      case 'reset-password':
        return <ResetPassword params={routeParams} onNavigate={onNavigate} />;
      case 'login':
      default:
        return <Login onNavigate={onNavigate} />;
    }
  }

  // 3. Authenticated Dashboard workspace Shell
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-300 font-sans select-none">
      
      {/* Left Sidebar */}
      <Sidebar
        activePage={activePage === 'board' ? `board:${routeParams.projectId}` : activePage}
        onNavigate={onNavigate}
        projects={projects}
        onOpenCreateProject={() => setIsCreateProjectOpen(true)}
      />

      {/* Right Content Area */}
      <div className="flex flex-col flex-1 min-w-0 h-full">
        {/* Top Navbar */}
        <TopBar
          onSearchClick={() => setIsSearchOpen(true)}
          onNavigate={onNavigate}
        />

        {/* Dynamic Pages Area */}
        <main className="flex-1 min-h-0 bg-zinc-950/45">
          {activePage === 'dashboard' && (
            <Dashboard onNavigate={onNavigate} />
          )}
          {activePage === 'board' && routeParams.projectId && (
            <BoardPage
              projectId={routeParams.projectId}
              openTaskId={routeParams.openTaskId}
              key={routeParams.projectId} // Remounts when project ID changes
            />
          )}
          {activePage === 'calendar' && (
            <CalendarPage
              projects={projects}
            />
          )}
          {activePage === 'analytics' && (
            <AnalyticsPage />
          )}
          {activePage === 'settings' && (
            <SettingsPage />
          )}
          {activePage === 'ailab' && (
            <AiLabPage projects={projects} />
          )}
        </main>
      </div>

      {/* Global Search Modal overlay */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onNavigate={onNavigate}
        projects={projects}
      />

      {/* Dialog: Keyboard Shortcuts */}
      <Dialog isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} title="Keyboard Shortcuts">
        <div className="flex flex-col gap-4 text-xs select-none">
          <div className="flex justify-between border-b border-zinc-850 pb-2 text-zinc-550 font-bold uppercase tracking-wider">
            <span>Action</span>
            <span>Shortcut</span>
          </div>
          <div className="flex flex-col gap-3 font-semibold">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Open Global Search</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">Ctrl + K</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Open Shortcuts Cheatsheet</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">?</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Create New Project</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">c</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Create Task (on Board page)</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">t</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Go to Dashboard</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">g + d</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Go to Calendar</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">g + c</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Go to Analytics</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">g + a</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Go to AI Developer Lab</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">g + l</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Go to Settings</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">g + s</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Close Open Modals / Drawers</span>
              <kbd className="px-2 py-1 bg-zinc-950 border border-zinc-850 rounded font-mono text-[9px] text-zinc-400">Esc</kbd>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Dialog: Create Project */}
      <Dialog isOpen={isCreateProjectOpen} onClose={() => setIsCreateProjectOpen(false)} title="Create New Project">
        <form onSubmit={handleCreateProject} className="flex flex-col gap-4">
          <Input
            label="Project Name"
            type="text"
            placeholder="e.g. Acme Web Client"
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            required
          />

          <Input
            label="Description (optional)"
            type="text"
            placeholder="Goal or objectives of this project"
            value={projectDesc}
            onChange={(e) => setProjectDesc(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Cover Accent Color"
              value={projectColor}
              onChange={(e) => setProjectColor(e.target.value)}
              options={[
                { value: '#6366f1', label: 'Indigo' },
                { value: '#8b5cf6', label: 'Violet' },
                { value: '#ec4899', label: 'Pink' },
                { value: '#10b981', label: 'Emerald' },
                { value: '#f59e0b', label: 'Amber' },
                { value: '#ef4444', label: 'Crimson' }
              ]}
            />

            <Select
              label="Priority"
              value={projectPriority}
              onChange={(e) => setProjectPriority(e.target.value)}
              options={[
                { value: 'LOW', label: 'Low' },
                { value: 'MEDIUM', label: 'Medium' },
                { value: 'HIGH', label: 'High' },
                { value: 'CRITICAL', label: 'Critical' }
              ]}
            />
          </div>

          <Button type="submit" variant="primary" className="w-full mt-2" isLoading={projectCreateLoading}>
            Create Project
          </Button>
        </form>
      </Dialog>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SocketProvider>
          <ToastProvider>
            <WorkspaceShell />
          </ToastProvider>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
