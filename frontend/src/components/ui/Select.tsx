import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  error?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 select-none">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`w-full bg-surface-container-high/60 border border-outline-variant/30 text-sm text-on-surface rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all cursor-pointer ${
            error ? 'border-error focus:ring-error' : ''
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-surface-container-high text-on-surface">
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="text-[11px] text-rose-500 font-medium">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
