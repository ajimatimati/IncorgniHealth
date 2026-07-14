import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

const LINES = [
  { name: 'Samaritans Nigeria', number: '0800-800-2000', available: '24/7', icon: 'call' },
  { name: 'WARIF Crisis Line', number: '0800-888-8888', available: '8am – 10pm', icon: 'headset_mic' },
  { name: 'SMS Crisis Support', number: 'SMS "HELP" to 1234', available: '24/7', icon: 'sms' },
];

/**
 * CrisisLineModal — Crisis hotline with direct call + copy number.
 * Inspired by Samaritans UK / Crisis Text Line app.
 */
export default function CrisisLineModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(null);

  const handleCopy = (number) => {
    navigator.clipboard.writeText(number).then(() => {
      setCopied(number);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleCall = (number) => {
    // Only call actual phone numbers, not SMS instructions
    const isPhone = /^[\d\s\-+()]+$/.test(number);
    if (isPhone) window.location.href = `tel:${number.replace(/\D/g, '')}`;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="crisis-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            key="crisis-modal"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-x-4 bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[420px] z-[101]"
          >
            <div className="bg-background border border-tertiary/20 rounded-3xl overflow-hidden shadow-2xl">
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-tertiary/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tertiary/15 flex items-center justify-center">
                    <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>headset_mic</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-base font-bold text-on-surface">Crisis Support Lines</h2>
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest">Confidential &amp; anonymous</p>
                  </div>
                </div>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-container-low text-outline hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-base">close</span>
                </button>
              </div>

              <div className="p-4 space-y-3">
                {LINES.map((line) => (
                  <div key={line.name} className="p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-headline text-sm font-bold text-on-surface">{line.name}</p>
                        <p className="font-label text-[9px] text-outline uppercase tracking-widest mt-0.5">{line.available}</p>
                      </div>
                      <span className="material-symbols-outlined text-tertiary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{line.icon}</span>
                    </div>
                    <p className="font-label text-base text-on-surface tracking-widest mb-3">{line.number}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCopy(line.number)}
                        className="btn btn-secondary flex-1 h-9 min-h-0 text-[9px] flex items-center justify-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-sm">{copied === line.number ? 'check' : 'content_copy'}</span>
                        {copied === line.number ? 'Copied!' : 'Copy'}
                      </button>
                      {/^[\d\s\-+()]+$/.test(line.number) && (
                        <button
                          onClick={() => handleCall(line.number)}
                          className="btn btn-primary flex-2 min-w-[100px] h-9 min-h-0 text-[9px] flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
                          Call Now
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                <p className="text-center font-body text-xs text-outline/50 px-4 pb-2">
                  All calls are anonymous. No caller ID is passed to our servers.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
