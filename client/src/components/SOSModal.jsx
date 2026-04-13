import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SOSModal — Press-and-hold (1.5s) emergency overlay.
 * Inspired by Apple Emergency SOS + Noonlight.
 * Three options: Call 999, Find SARC, Crisis Support.
 *
 * Props:
 *  isOpen   — boolean
 *  onClose  — () => void
 */
export default function SOSModal({ isOpen, onClose }) {
  const navigate = useNavigate();

  const handleCall999 = () => {
    onClose();
    window.location.href = 'tel:999';
  };

  const handleFindSARC = () => {
    onClose();
    navigate('/sarc');
  };

  const handleCrisisSupport = () => {
    onClose();
    navigate('/mental-wellness');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="sos-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            key="sos-modal"
            initial={{ opacity: 0, scale: 0.92, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[101] select-none"
          >
            <div className="bg-[#1a0808] border border-error/30 rounded-3xl overflow-hidden shadow-2xl shadow-error/20">
              {/* Header */}
              <div className="px-6 pt-7 pb-5 text-center border-b border-error/10">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-error/15 border border-error/30 mb-4">
                  <span
                    className="material-symbols-outlined text-error text-3xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    emergency
                  </span>
                </div>
                <h2 className="font-headline text-2xl font-black text-white">Emergency Help</h2>
                <p className="font-body text-sm text-white/50 mt-1">
                  Choose how you need assistance right now.
                </p>
              </div>

              {/* Options */}
              <div className="p-4 space-y-3">
                {/* Call 999 */}
                <button
                  onClick={handleCall999}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-error/15 border border-error/30 hover:bg-error/25 hover:border-error/50 active:scale-[0.98] transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-error flex items-center justify-center shrink-0 shadow-lg shadow-error/30">
                    <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-headline text-base font-bold text-white">Call 999 / 112</p>
                    <p className="font-label text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Immediate emergency services</p>
                  </div>
                  <span className="material-symbols-outlined text-white/30 group-hover:text-white/60 transition-colors">chevron_right</span>
                </button>

                {/* Find SARC */}
                <button
                  onClick={handleFindSARC}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#1c1224] border border-primary/20 hover:bg-primary/10 hover:border-primary/40 active:scale-[0.98] transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-headline text-base font-bold text-white">Find a SARC</p>
                    <p className="font-label text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Sexual Assault Referral Centre — 24/7</p>
                  </div>
                  <span className="material-symbols-outlined text-white/30 group-hover:text-white/60 transition-colors">chevron_right</span>
                </button>

                {/* Crisis Support */}
                <button
                  onClick={handleCrisisSupport}
                  className="w-full flex items-center gap-4 p-5 rounded-2xl bg-[#121c1f] border border-tertiary/20 hover:bg-tertiary/10 hover:border-tertiary/40 active:scale-[0.98] transition-all group"
                >
                  <div className="w-11 h-11 rounded-xl bg-tertiary/20 border border-tertiary/30 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-tertiary text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>self_improvement</span>
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-headline text-base font-bold text-white">Crisis Support</p>
                    <p className="font-label text-[10px] uppercase tracking-widest text-white/50 mt-0.5">Breathing tools &amp; grounding techniques</p>
                  </div>
                  <span className="material-symbols-outlined text-white/30 group-hover:text-white/60 transition-colors">chevron_right</span>
                </button>
              </div>

              {/* Cancel */}
              <div className="px-4 pb-5">
                <button
                  onClick={onClose}
                  className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-all font-label text-[10px] uppercase tracking-widest"
                >
                  Cancel — I'm Safe
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ─── Holdable SOS Trigger Button ────────────────────────────────────────────
 * Wrap any element with this. On 1.5s press-hold → opens SOSModal.
 * Usage: <SOSTrigger onActivate={openModal} />
 */
export function SOSTrigger({ onActivate, children, className = '' }) {
  const holdRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(null);

  const startHold = useCallback(() => {
    const startTime = Date.now();
    const duration = 1500;
    progressRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(progressRef.current);
        setProgress(0);
        onActivate();
      }
    }, 16);
  }, [onActivate]);

  const cancelHold = useCallback(() => {
    clearInterval(progressRef.current);
    setProgress(0);
  }, []);

  return (
    <div
      className={`relative cursor-pointer select-none ${className}`}
      onMouseDown={startHold}
      onMouseUp={cancelHold}
      onMouseLeave={cancelHold}
      onTouchStart={startHold}
      onTouchEnd={cancelHold}
    >
      {children}
      {progress > 0 && (
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 44 44"
        >
          <circle
            cx="22" cy="22" r="19"
            fill="none"
            stroke="#ff5449"
            strokeWidth="3"
            strokeDasharray={`${(progress / 100) * 119.4} 119.4`}
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
