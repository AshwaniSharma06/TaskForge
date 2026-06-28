import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import api from '../../services/api';
import { Search, Bell, Check, Sparkles } from 'lucide-react';

interface TopBarProps {
  onSearchClick: () => void;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  entityId: string | null;
  entityType: string | null;
  createdAt: string;
}

export const TopBar: React.FC<TopBarProps> = ({ onSearchClick, onNavigate }) => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch notifications initially
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Failed to fetch notifications', err);
      }
    };
    fetchNotifications();
  }, []);

  // Listen for real-time notifications via socket
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif: Notification) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on('notification', handleNewNotification);

    return () => {
      socket.off('notification', handleNewNotification);
    };
  }, [socket]);

  // Click outside close listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = async (n: Notification) => {
    try {
      if (!n.isRead) {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, isRead: true } : item))
        );
      }
      setShowDropdown(false);

      if (n.entityType === 'PROJECT' && n.entityId) {
        onNavigate('board', { projectId: n.entityId });
      } else if (n.entityType === 'TASK' && n.entityId) {
        // Just redirect to project page.
        // In board page we can open task detail if we want.
        const taskRes = await api.get(`/tasks/${n.entityId}`);
        onNavigate('board', { projectId: taskRes.data.projectId, openTaskId: n.entityId });
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="h-14 bg-zinc-900 border-b border-zinc-800/80 flex items-center justify-between px-6 shrink-0 relative z-20">
      {/* Search Trigger */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800/80 text-zinc-400 hover:text-zinc-200 transition-all w-64 text-left group"
      >
        <Search size={14} className="text-zinc-500 group-hover:text-zinc-400" />
        <span className="text-xs">Search projects, tasks...</span>
        <kbd className="ml-auto text-[9px] font-semibold bg-zinc-900 px-1.5 py-0.5 rounded text-zinc-500 border border-zinc-800">
          Ctrl K
        </kbd>
      </button>

      {/* Right utilities */}
      <div className="flex items-center gap-4">
        {/* AI helper banner */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full">
          <Sparkles size={11} className="animate-pulse" />
          <span>AI Assistants Ready</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 rounded-lg relative transition-all"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-zinc-900 ring-2 ring-rose-500/25 animate-pulse" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-2xl overflow-hidden z-30 border border-zinc-800">
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/80">
                <span className="text-xs font-semibold text-zinc-100">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-all"
                  >
                    <Check size={10} /> Mark all read
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-zinc-850">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-zinc-550 italic">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 text-xs transition-all flex flex-col gap-1 hover:bg-zinc-850/50 ${
                        n.isRead ? 'opacity-65' : 'bg-indigo-500/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${n.isRead ? 'text-zinc-355' : 'text-zinc-50'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-zinc-400 leading-tight">{n.message}</p>
                      <span className="text-[9px] text-zinc-650 mt-0.5">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar display */}
        <button
          onClick={() => onNavigate('settings')}
          className="flex items-center gap-2 focus:outline-none"
        >
          {user?.avatar ? (
            <img
              src={user.avatar}
              alt={user.name}
              className="w-7 h-7 rounded-full object-cover border border-zinc-800"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 flex items-center justify-center font-bold text-xs uppercase">
              {user?.name.slice(0, 2)}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
