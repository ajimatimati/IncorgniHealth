import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

function ToastItem({ toast, onRemove }) {
  const styles = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D', icon: '#22C55E' },
    error:   { bg: '#FEF2F2', border: '#FECACA', text: '#991B1B', icon: '#EF4444' },
    info:    { bg: '#F5F3FF', border: '#DDD6FE', text: '#5B21B6', icon: '#7C3AED' },
  };

  const s = styles[toast.type] || styles.info;

  const icons = {
    success: <CheckCircle2 className="w-4 h-4 shrink-0" strokeWidth={2} />,
    error: <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={2} />,
    info: <Info className="w-4 h-4 shrink-0" strokeWidth={2} />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.97 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
      className="flex items-center gap-3 px-4 py-3 rounded-2xl border shadow-card-md"
      role="alert"
      aria-live="polite"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <span style={{ color: s.icon }}>{icons[toast.type]}</span>
      <p className="text-sm font-medium flex-1">{toast.message}</p>
      <button
        onClick={() => onRemove(toast.id)}
        className="opacity-40 hover:opacity-80 transition-opacity p-0.5 ml-1"
        aria-label="Dismiss"
        style={{ color: s.text }}
      >
        <X className="w-3.5 h-3.5" strokeWidth={2} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 4200);
  }, [removeToast]);

  const api = {
    success: (m) => addToast(m, 'success'),
    error:   (m) => addToast(m, 'error'),
    info:    (m) => addToast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[100] flex flex-col gap-2 max-w-[340px] w-full pointer-events-none bottom-20 right-4 sm:bottom-6 sm:right-6">
        <AnimatePresence mode="popLayout">
          {toasts.map(t => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem toast={t} onRemove={removeToast} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
