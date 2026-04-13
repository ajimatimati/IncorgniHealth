import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MOODS = [
  { emoji: '😞', label: 'Low',       val: 1, color: 'border-error/40 bg-error/10',       text: 'text-error'          },
  { emoji: '😕', label: 'Struggling',val: 2, color: 'border-warning/40 bg-warning/10',   text: 'text-warning'        },
  { emoji: '😐', label: 'Neutral',   val: 3, color: 'border-outline/30 bg-surface-container', text: 'text-outline'   },
  { emoji: '🙂', label: 'Good',      val: 4, color: 'border-tertiary/40 bg-tertiary/10', text: 'text-tertiary'       },
  { emoji: '😊', label: 'Great',     val: 5, color: 'border-primary/40 bg-primary/10',   text: 'text-primary'        },
];

/**
 * MoodModal — Single-tap emoji mood check-in.
 * Inspired by Daylio. Max 2 taps to complete.
 * Stores to localStorage['incogni_moods'].
 */
export default function MoodModal({ isOpen, onClose }) {
  const [selected, setSelected] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setSelected(null);
      setConfirmed(false);
      const moods = JSON.parse(localStorage.getItem('incogni_moods') || '[]');
      setStreak(moods.length);
    }
  }, [isOpen]);

  const handleSelect = (mood) => {
    setSelected(mood);
    const moods = JSON.parse(localStorage.getItem('incogni_moods') || '[]');
    moods.unshift({ mood: mood.val, label: mood.label, date: new Date().toISOString() });
    localStorage.setItem('incogni_moods', JSON.stringify(moods));
    setConfirmed(true);
    setTimeout(onClose, 1600);
  };

  const selectedMood = MOODS.find(m => m.val === selected?.val);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="mood-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="mood-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[101]"
          >
            <div className="bg-background border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl">
              <div className="px-6 pt-6 pb-5 text-center">
                <AnimatePresence mode="wait">
                  {!confirmed ? (
                    <motion.div key="picker" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <p className="font-label text-[10px] text-outline uppercase tracking-[0.2em] mb-1">Daily Check-in</p>
                      <h2 className="font-headline text-xl font-bold text-on-surface mb-1">How are you feeling?</h2>
                      <p className="font-body text-xs text-on-surface-variant/60 mb-6">{streak} entries logged · tap once to record</p>

                      <div className="flex justify-between gap-2 mb-5">
                        {MOODS.map((mood) => (
                          <button
                            key={mood.val}
                            onClick={() => handleSelect(mood)}
                            className={`flex-1 flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all hover:scale-105 active:scale-95 ${mood.color}`}
                          >
                            <span className="text-3xl">{mood.emoji}</span>
                            <span className={`font-label text-[8px] uppercase tracking-widest ${mood.text}`}>{mood.label}</span>
                          </button>
                        ))}
                      </div>

                      <button onClick={onClose} className="font-label text-[10px] text-outline uppercase tracking-widest hover:text-on-surface transition-colors">
                        Skip for today
                      </button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="confirmed"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: 'spring', damping: 20 }}
                      className="py-6"
                    >
                      <span className="text-5xl block mb-4">{selectedMood?.emoji}</span>
                      <h2 className="font-headline text-xl font-bold text-on-surface mb-2">Logged — {selectedMood?.label}</h2>
                      <p className="font-body text-sm text-on-surface-variant/70">Your feelings are valid. Thank you for checking in.</p>
                      <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                        <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
                        <span className="font-label text-[10px] text-primary uppercase tracking-widest">{streak + 1} check-ins total</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
