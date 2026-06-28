import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ShieldCheck, Mail, ArrowRight } from 'lucide-react';

interface VerifyEmailProps {
  params?: Record<string, string>;
  onNavigate: (page: string, params?: Record<string, string>) => void;
}

export const VerifyEmail: React.FC<VerifyEmailProps> = ({ params, onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState(params?.email || '');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await api.post('/auth/verify-email', { email, code });
      setSuccess('Email verified successfully! Redirecting...');
      login(res.data.token, res.data.user);
      setTimeout(() => {
        onNavigate('dashboard');
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
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
            <ShieldCheck size={24} />
          </div>
          <h1 className="text-2xl font-bold text-zinc-50 tracking-tight">Verify your email</h1>
          <p className="text-zinc-400 text-xs mt-1">Enter the 6-digit confirmation code sent to you</p>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-xs text-indigo-300 mb-5 leading-relaxed">
          <strong>Development Note:</strong> Since real mail services are not configured, the verification code was output directly to the **backend terminal console**. Check the logs there to copy your code!
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
              label="Verification code"
              type="text"
              placeholder="e.g. 123456"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />

            <Button type="submit" variant="primary" className="w-full mt-2" isLoading={loading}>
              Verify Code <ArrowRight size={15} className="ml-2" />
            </Button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-zinc-500 text-xs mt-6">
          Didn't receive a code?{' '}
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
