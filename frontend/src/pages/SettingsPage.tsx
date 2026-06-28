import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { User, Lock, Settings, Moon, Sun, Bell } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'theme' | 'notifications'>('profile');

  // Form states: Profile
  const [name, setName] = useState(user?.name || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Form states: Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdError, setPwdError] = useState('');
  const [pwdSuccess, setPwdSuccess] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);

  // Form states: Notifications
  const [notifConfig, setNotifConfig] = useState({
    taskAssigned: true,
    taskCompleted: true,
    commentAdded: true,
    mentionNotify: true
  });
  const [notifSuccess, setNotifSuccess] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    setProfileLoading(true);

    try {
      const res = await api.put('/users/profile', { name, avatar });
      updateUser(res.data);
      setProfileSuccess('Profile details updated successfully!');
    } catch (err: any) {
      setProfileError(err.response?.data?.error || 'Failed to update profile details.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError('');
    setPwdSuccess('');

    if (newPassword !== confirmPassword) {
      return setPwdError('New passwords do not match');
    }

    setPwdLoading(true);

    try {
      await api.put('/users/change-password', { currentPassword, newPassword });
      setPwdSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPwdError(err.response?.data?.error || 'Failed to update password.');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    setNotifSuccess('Notification preferences saved successfully!');
    setTimeout(() => setNotifSuccess(''), 2000);
  };

  return (
    <div className="p-6 flex flex-col gap-6 h-full overflow-y-auto max-w-5xl mx-auto select-none">
      {/* Title */}
      <div>
        <h1 className="text-xl font-bold text-zinc-50 tracking-tight flex items-center gap-2">
          <Settings size={18} className="text-indigo-400" />
          Settings Panel
        </h1>
        <p className="text-xs text-zinc-400 mt-1">Configure profile details, password, theme settings, and preferences</p>
      </div>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row gap-6 mt-2">
        {/* Left Side Tab Selector */}
        <div className="w-full md:w-56 shrink-0 flex flex-row md:flex-col gap-1.5 overflow-x-auto md:overflow-x-visible">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-lg text-left transition-all whitespace-nowrap md:whitespace-normal border border-transparent ${
              activeTab === 'profile'
                ? 'bg-zinc-800 text-zinc-50 border-white/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <User size={14} /> Profile Settings
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-lg text-left transition-all whitespace-nowrap md:whitespace-normal border border-transparent ${
              activeTab === 'password'
                ? 'bg-zinc-800 text-zinc-50 border-white/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Lock size={14} /> Password & Security
          </button>
          <button
            onClick={() => setActiveTab('theme')}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-lg text-left transition-all whitespace-nowrap md:whitespace-normal border border-transparent ${
              activeTab === 'theme'
                ? 'bg-zinc-800 text-zinc-50 border-white/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Moon size={14} /> Theme Preferences
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold rounded-lg text-left transition-all whitespace-nowrap md:whitespace-normal border border-transparent ${
              activeTab === 'notifications'
                ? 'bg-zinc-800 text-zinc-50 border-white/5'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/30'
            }`}
          >
            <Bell size={14} /> Notifications
          </button>
        </div>

        {/* Right Side Content Card */}
        <Card className="flex-1 min-h-[350px] p-6 glass-panel border border-zinc-800 bg-zinc-900/10">
          
          {/* Tab: Profile */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="flex flex-col gap-5 max-w-md">
              <div>
                <h3 className="text-sm font-semibold text-zinc-50">Profile Settings</h3>
                <p className="text-[10px] text-zinc-500">Update your public display name and avatar image link</p>
              </div>

              {profileError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs px-3 py-2 rounded-lg">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg">
                  {profileSuccess}
                </div>
              )}

              <Input
                label="Full name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <Input
                label="Avatar URL (Image link)"
                type="text"
                placeholder="https://images.unsplash.com/photo..."
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
              />

              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold text-zinc-550 select-none">Email Address (Read Only)</span>
                <span className="text-xs font-semibold text-zinc-500 bg-zinc-950/40 border border-zinc-850 px-3.5 py-2.5 rounded-lg select-all">
                  {user?.email}
                </span>
              </div>

              <Button type="submit" variant="primary" className="self-start mt-2" isLoading={profileLoading}>
                Save Profile
              </Button>
            </form>
          )}

          {/* Tab: Password */}
          {activeTab === 'password' && (
            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-5 max-w-md">
              <div>
                <h3 className="text-sm font-semibold text-zinc-50">Change Password</h3>
                <p className="text-[10px] text-zinc-500">Change your secret credentials regularly to secure your projects</p>
              </div>

              {pwdError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs px-3 py-2 rounded-lg">
                  {pwdError}
                </div>
              )}
              {pwdSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg">
                  {pwdSuccess}
                </div>
              )}

              <Input
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />

              <Input
                label="New Password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />

              <Input
                label="Confirm New Password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />

              <Button type="submit" variant="primary" className="self-start mt-2" isLoading={pwdLoading}>
                Change Password
              </Button>
            </form>
          )}

          {/* Tab: Theme */}
          {activeTab === 'theme' && (
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-sm font-semibold text-zinc-50">Theme Settings</h3>
                <p className="text-[10px] text-zinc-500">Select which theme TaskForge should show on your device</p>
              </div>

              <div className="grid grid-cols-2 gap-4 max-w-md">
                <button
                  onClick={() => theme === 'light' && toggleTheme()}
                  className={`p-5 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all select-none ${
                    theme === 'dark'
                      ? 'bg-zinc-900 border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-650/5'
                      : 'bg-zinc-950/20 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Moon size={22} />
                  <span className="text-xs font-semibold">Dark Mode</span>
                </button>

                <button
                  onClick={() => theme === 'dark' && toggleTheme()}
                  className={`p-5 rounded-xl border flex flex-col items-center justify-center gap-3 transition-all select-none ${
                    theme === 'light'
                      ? 'bg-zinc-900 border-indigo-500/30 text-indigo-400 shadow-lg shadow-indigo-650/5'
                      : 'bg-zinc-950/20 border-zinc-800 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Sun size={22} />
                  <span className="text-xs font-semibold">Light Mode</span>
                </button>
              </div>
            </div>
          )}

          {/* Tab: Notifications */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleSaveNotifications} className="flex flex-col gap-5 max-w-md">
              <div>
                <h3 className="text-sm font-semibold text-zinc-50">Notifications Preferences</h3>
                <p className="text-[10px] text-zinc-500">Select which actions trigger real-time notification alerts</p>
              </div>

              {notifSuccess && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3 py-2 rounded-lg">
                  {notifSuccess}
                </div>
              )}

              <div className="flex flex-col gap-3.5 mt-2">
                <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={notifConfig.taskAssigned}
                    onChange={(e) => setNotifConfig((prev) => ({ ...prev, taskAssigned: e.target.checked }))}
                    className="rounded border-zinc-850 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-zinc-200 font-semibold">New Task Assigned</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Get notified when someone assigns a task to you</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={notifConfig.taskCompleted}
                    onChange={(e) => setNotifConfig((prev) => ({ ...prev, taskCompleted: e.target.checked }))}
                    className="rounded border-zinc-850 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-zinc-200 font-semibold">Task Completed</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Get notified when a task in your project is finished</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={notifConfig.commentAdded}
                    onChange={(e) => setNotifConfig((prev) => ({ ...prev, commentAdded: e.target.checked }))}
                    className="rounded border-zinc-850 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-zinc-200 font-semibold">Comment Added</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Get notified when someone replies on your task thread</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer text-xs select-none">
                  <input
                    type="checkbox"
                    checked={notifConfig.mentionNotify}
                    onChange={(e) => setNotifConfig((prev) => ({ ...prev, mentionNotify: e.target.checked }))}
                    className="rounded border-zinc-850 bg-zinc-950 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="text-zinc-200 font-semibold">Mentions</p>
                    <p className="text-[10px] text-zinc-500 font-medium">Get notified whenever someone @mentions your name</p>
                  </div>
                </label>
              </div>

              <Button type="submit" variant="primary" className="self-start mt-2">
                Save Preferences
              </Button>
            </form>
          )}

        </Card>
      </div>
    </div>
  );
};
