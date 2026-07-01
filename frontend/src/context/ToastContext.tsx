import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  addToast: (message: string, type?: ToastType) => void;
}

const TOAST_DISMISS_DELAY = 4000; // Auto-dismiss delay for screen notifications in milliseconds

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DISMISS_DELAY);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const icons = {
    success: <CheckCircle size={15} className="text-emerald-450 shrink-0" />,
    error: <AlertCircle size={15} className="text-rose-450 shrink-0" />,
    warning: <AlertCircle size={15} className="text-amber-450 shrink-0" />,
    info: <Info size={15} className="text-indigo-400 shrink-0" />
  };

  const borderColors = {
    success: 'border-emerald-500/20 bg-emerald-950/20 text-emerald-300',
    error: 'border-rose-500/20 bg-rose-950/20 text-rose-350',
    warning: 'border-amber-500/20 bg-amber-950/20 text-amber-300',
    info: 'border-indigo-500/20 bg-indigo-950/20 text-indigo-300'
  };

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast Portal Container */}
      <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 max-w-sm w-full select-none">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className={`flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md shadow-2xl ${borderColors[t.type]}`}
            >
              {icons[t.type]}
              <p className="text-xs font-semibold leading-relaxed flex-grow">{t.message}</p>
              <button
                onClick={() => removeToast(t.id)}
                className="text-zinc-550 hover:text-zinc-350 transition-all shrink-0 p-0.5 rounded"
              >
                <X size={12} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
};
