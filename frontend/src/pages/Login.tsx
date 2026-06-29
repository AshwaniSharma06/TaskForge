import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, ArrowRight } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      login(res.data.token, res.data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Failed to sign in. Please try again.';
      setError(errMsg);
      
      // If email is not verified, redirect to verification screen
      if (err.response?.status === 403 && err.response?.data?.emailNotVerified) {
        onNavigate('verify-email', { email: err.response.data.email });
      }
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
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-400 mb-3 shadow-lg shadow-indigo-600/5">
            <span className="font-bold text-xl tracking-wider">TF</span>
          </div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Welcome to TaskForge</h1>
          <p className="text-zinc-400 text-xs mt-1">Manage your team tasks and AI workflows</p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-xl border border-zinc-800/80">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-3.5 py-2.5 rounded-lg">
                {error}
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

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-zinc-400 select-none">Password</label>
                <button
                  type="button"
                  onClick={() => onNavigate('forgot-password')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-all"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock size={16} />}
                required
              />
            </div>

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Sign In <ArrowRight size={15} className="ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-zinc-500 text-xs mt-6">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('signup')}
            className="text-indigo-400 hover:text-indigo-300 font-semibold transition-all"
          >
            Sign up for free
          </button>
        </p>
      </div>
    </div>
  );
};
