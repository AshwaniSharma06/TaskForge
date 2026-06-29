import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 select-none">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <span className="absolute left-3.5 text-zinc-500 pointer-events-none">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            className={`w-full bg-surface-container-high/60 border border-outline-variant/30 text-sm text-on-surface placeholder-on-surface-variant/45 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all ${
              icon ? 'pl-10' : ''
            } ${error ? 'border-error focus:ring-error focus:border-error' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
