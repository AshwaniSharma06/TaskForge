import React from 'react';

/**
 * Props mapping interface for the Select select input wrapper.
 */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string; // Optional field descriptive text placed above the dropdown
  options: { value: string; label: string }[]; // Array of selectable value/label keypairs
  error?: string; // Error validation string displayed beneath input container
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
