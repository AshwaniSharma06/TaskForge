import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, hoverEffect = false, className = '', ...props }) => {
  return (
    <div
      className={`glass-card rounded-xl p-5 border border-zinc-800/60 transition-all duration-300 ${
        hoverEffect ? 'hover:scale-[1.005] hover:border-zinc-700/60 hover:bg-zinc-900/35 shadow-lg shadow-black/5' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
