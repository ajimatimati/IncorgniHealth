import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';

const PROMPTS = [
  'What\'s on your mind right now?',
  'What felt heavy or light today?',
  'Describe one thing you\'re grateful for.',
  'Write a letter to your future self.',
  'What do you need to forgive yourself for?'
];

/**
 * JournalModal — Quick private journal entry.
 * Inspired by BetterHelp / Calm journaling UX.
 * Auto-saves to localStorage['incogni_journal'].
 */
export default function JournalModal({ isOpen, onClose }) {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);
  const [entryCount, setEntryCount] = useState(0);
  const [prompt] = useState(() => PROMPTS[Math.floor(Math.random() * PROMPTS.length)]);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setText('');
      setSaved(false);
      const entries = JSON.parse(localStorage.getItem('incogni_journal') || '[]');
      setEntryCount(entries.length);
      setTimeout(() => textareaRef.current?.focus(), 200);
    }
  }, [isOpen]);

  const handleSave = () => {
    if (!text.trim()) return;
    const entries = JSON.parse(localStorage.getItem('incogni_journal') || '[]');
    entries.unshift({ text: text.trim(), date: new Date().toISOString() });
    localStorage.setItem('incogni_journal', JSON.stringify(entries));
    setSaved(true);
    setEntryCount(entries.length);
    setTimeout(() => {
      setSaved(false);
      setText('');
      onClose();
    }, 1400);
  };

  const charsLeft = 1000 - text.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="journal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="journal-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[520px] z-[101]"
          >
            <div className="bg-background border border-outline-variant/20 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-outline-variant/10">
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
                  <div>
                    <p className="font-headline text-sm font-bold text-on-surface">Journal Entry</p>
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest">{entryCount} entries saved locally</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              {/* Prompt */}
              <div className="px-6 pt-5">
                <p className="font-body text-sm text-on-surface-variant italic border-l-2 border-primary/30 pl-3 py-1 mb-4">
                  "{prompt}"
                </p>
                <textarea
                  ref={textareaRef}
                  value={text}
                  onChange={e => e.target.value.length <= 1000 && setText(e.target.value)}
                  placeholder="Write freely. This stays private on your device..."
                  className="w-full h-44 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none resize-none placeholder:text-outline leading-relaxed"
                />
                <div className="flex justify-end mt-1">
                  <span className={`font-label text-[9px] ${charsLeft < 100 ? 'text-error' : 'text-outline/50'}`}>
                    {charsLeft} chars remaining
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-5 flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 h-12 rounded-2xl border border-outline-variant/20 text-on-surface-variant font-label text-[11px] uppercase tracking-widest hover:bg-surface-container-low transition-all"
                >
                  Discard
                </button>
                <button
                  onClick={handleSave}
                  disabled={!text.trim() || saved}
                  className={`flex-2 min-w-[140px] h-12 rounded-2xl font-headline font-bold text-[12px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                    saved
                      ? 'bg-tertiary/15 text-tertiary border border-tertiary/30'
                      : 'bg-primary text-on-primary disabled:opacity-30 hover:brightness-110'
                  }`}
                >
                  {saved ? (
                    <><span className="material-symbols-outlined text-base">check_circle</span> Saved</>
                  ) : (
                    <>Save Locally</>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
