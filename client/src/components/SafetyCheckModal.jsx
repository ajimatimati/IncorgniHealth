import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const OPTIONS = [
  {
    icon: 'check_circle',
    label: "I'm Safe",
    sub: 'No immediate danger',
    action: 'safe',
    color: 'border-tertiary/30 bg-tertiary/5 hover:bg-tertiary/15',
    iconColor: 'text-tertiary',
    iconBg: 'bg-tertiary/20',
  },
  {
    icon: 'self_improvement',
    label: 'I Need Support',
    sub: 'Talk to someone / breathing tools',
    action: 'support',
    color: 'border-primary/30 bg-primary/5 hover:bg-primary/15',
    iconColor: 'text-primary',
    iconBg: 'bg-primary/20',
  },
  {
    icon: 'emergency',
    label: "I'm In Danger",
    sub: 'Emergency — call for help now',
    action: 'danger',
    color: 'border-error/30 bg-error/5 hover:bg-error/15',
    iconColor: 'text-error',
    iconBg: 'bg-error/20',
  },
];

/**
 * SafetyCheckModal — 3-choice triage modal.
 * Inspired by SafeUT / Crisis Text Line.
 */
export default function SafetyCheckModal({ isOpen, onClose, onSOS }) {
  const navigate = useNavigate();

  const handleAction = (action) => {
    onClose();
    if (action === 'safe') {
      // Stay on page, no navigation needed — just close
    } else if (action === 'support') {
      navigate('/mental-wellness');
    } else if (action === 'danger') {
      // Elevate to SOS
      onSOS?.();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="safety-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="safety-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[400px] z-[101]"
          >
            <div className="bg-background border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 pt-6 pb-3 border-b border-outline-variant/10 text-center">
                <div className="w-12 h-12 rounded-2xl bg-surface-container-high flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-on-surface text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>health_and_safety</span>
                </div>
                <h2 className="font-headline text-xl font-bold text-on-surface">Safety Check</h2>
                <p className="font-body text-sm text-on-surface-variant/70 mt-1 mb-1">How are you right now?</p>
              </div>

              <div className="p-4 space-y-2.5">
                {OPTIONS.map((opt) => (
                  <button
                    key={opt.action}
                    onClick={() => handleAction(opt.action)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all active:scale-[0.98] ${opt.color}`}
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${opt.iconBg}`}>
                      <span className={`material-symbols-outlined text-xl ${opt.iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                        {opt.icon}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className="font-headline text-sm font-bold text-on-surface">{opt.label}</p>
                      <p className="font-label text-[9px] uppercase tracking-wide text-on-surface-variant mt-0.5">{opt.sub}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="px-4 pb-4">
                <button
                  onClick={onClose}
                  className="w-full h-10 rounded-xl text-outline font-label text-[9px] uppercase tracking-widest hover:text-on-surface transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
