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
    <header className="h-16 bg-surface/80 backdrop-blur-xl border-b border-outline-variant/10 flex items-center justify-between px-6 shrink-0 relative z-20 shadow-sm">
      {/* Search Trigger */}
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-all w-64 text-left group shadow-inner border border-outline-variant/10 hover:border-outline-variant/30"
      >
        <Search size={14} className="text-outline group-hover:text-primary transition-colors" />
        <span className="text-xs font-medium font-label">Search tasks...</span>
        <kbd className="ml-auto text-[9px] font-bold bg-surface-container px-1.5 py-0.5 rounded text-outline border border-outline-variant/20">
          Ctrl K
        </kbd>
      </button>

      {/* Right utilities */}
      <div className="flex items-center gap-4">
        {/* AI helper banner */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1.2 rounded-full">
          <Sparkles size={11} className="animate-pulse" />
          <span>AI Assistants Ready</span>
        </div>

        {/* Notification Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-full relative transition-all duration-200"
          >
            <Bell size={16} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error border border-background ring-2 ring-error/25 animate-pulse" />
            )}
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-2xl overflow-hidden z-30 border border-outline-variant/10">
              {/* Header */}
              <div className="px-4 py-3 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-high/85 backdrop-blur-xl">
                <span className="text-xs font-semibold text-on-surface font-label">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-[10px] text-primary hover:text-secondary font-semibold flex items-center gap-1 transition-all duration-200"
                  >
                    <Check size={10} /> Mark all read
                  </button>
                )}
              </div>

              {/* Items List */}
              <div className="max-h-[300px] overflow-y-auto divide-y divide-outline-variant/10 custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-xs text-on-surface-variant/40 italic">
                    No notifications yet
                  </div>
                ) : (
                  notifications.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`w-full text-left px-4 py-3 text-xs transition-all flex flex-col gap-1 hover:bg-surface-container-highest/40 ${
                        n.isRead ? 'opacity-60' : 'bg-primary/[0.02]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold ${n.isRead ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                          {n.title}
                        </span>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-on-surface-variant leading-tight">{n.message}</p>
                      <span className="text-[9px] text-on-surface-variant/40 mt-0.5">
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
              className="w-7 h-7 rounded-full object-cover border border-outline-variant/30"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs uppercase">
              {user?.name.slice(0, 2)}
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
