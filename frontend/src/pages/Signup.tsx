import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

interface SignupProps {
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const Signup: React.FC<SignupProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const res = await api.post('/auth/register', { name, email, password });
      login(res.data.token, res.data.user);
      onNavigate('dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#13131b] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-[#13131b] to-[#13131b] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Glow Backdrops */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-6">
          <img src="/logo.png" alt="TaskForge Logo" className="w-20 h-20 mx-auto mb-2 object-contain" />
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">Create your account</h1>
          <p className="text-on-surface-variant/75 text-xs mt-1">Get started with a free TaskForge workspace</p>
        </div>

        {/* Main Card */}
        <div className="glass-panel p-8 rounded-2xl shadow-2xl border border-outline-variant/15 bg-gradient-to-br from-surface-container-low/75 to-surface-container/75">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            {error && (
              <div className="bg-error/10 border border-error/25 text-error text-xs px-3.5 py-2.5 rounded-lg font-medium">
                {error}
              </div>
            )}

            <Input
              label="Full name"
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              icon={<User size={16} />}
              required
            />

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
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Create Account <ArrowRight size={15} className="ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-on-surface-variant/40 text-xs mt-6">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate('login')}
            className="text-primary hover:text-secondary font-semibold transition-all"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};
