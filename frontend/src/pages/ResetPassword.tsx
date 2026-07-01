import React, { useState } from 'react';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface ResetPasswordProps {
  params?: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ params, onNavigate }) => {
  const [email, setEmail] = useState(params?.email || '');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      // Trim reset code input to handle potential leading/trailing whitespaces gracefully
      const sanitizedCode = code.trim();
      await api.post('/auth/reset-password', { email, code: sanitizedCode, newPassword });
      setSuccess('Password reset successfully! Redirecting to login...');
      setTimeout(() => {
        onNavigate('login');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Password reset failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950/20 via-zinc-950 to-zinc-950 flex flex-col justify-center items-center p-4">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Reset password</h1>
          <p className="text-zinc-400 text-xs mt-1">Set a secure new password for your account</p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-xl border border-zinc-800/80">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-3.5 py-2.5 rounded-lg">
                {success}
              </div>
            )}

            <Input
              label="Email address"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />

            <Input
              label="Reset Code (from terminal)"
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Reset Password <ArrowRight size={15} className="ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-zinc-500 text-xs mt-6">
          <button
            onClick={() => onNavigate('login')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all"
          >
            Go back to Login
          </button>
        </p>
      </div>
    </div>
  );
};
