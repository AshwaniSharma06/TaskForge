import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'priority-low' | 'priority-medium' | 'priority-high' | 'priority-critical' | 'status-todo' | 'status-inprogress' | 'status-completed' | 'status-default' | 'default';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
    'priority-low': 'bg-zinc-800/55 text-zinc-400 border-zinc-700/50',
    'priority-medium': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    'priority-high': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'priority-critical': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    'status-todo': 'bg-zinc-800/80 text-zinc-400 border-zinc-700/60',
    'status-inprogress': 'bg-sky-500/10 text-sky-400 border-sky-500/20',
    'status-completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'status-default': 'bg-zinc-800/80 text-zinc-400 border border-zinc-700/60'
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
