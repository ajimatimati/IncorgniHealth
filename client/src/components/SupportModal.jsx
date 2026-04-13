import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['Technical Issue', 'Billing / Payments', 'Privacy Concern', 'Clinical / Medical', 'Account Access', 'Other'];

/**
 * SupportModal — In-app categorized support ticket form.
 * Inspired by Zocdoc / Linear / Intercom.
 * Generates local reference ID, no backend needed.
 */
export default function SupportModal({ isOpen, onClose }) {
  const [category, setCategory] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [ticketRef, setTicketRef] = useState('');
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);
  const [fileName, setFileName] = useState('');

  const reset = () => {
    setCategory('');
    setSubject('');
    setMessage('');
    setSubmitted(false);
    setTicketRef('');
    setFileName('');
    setLoading(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !subject.trim() || !message.trim()) return;
    setLoading(true);
    const ref = `IH-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    setTimeout(() => {
      setTicketRef(ref);
      setSubmitted(true);
      setLoading(false);
    }, 900);
  };

  const isValid = category && subject.trim().length > 2 && message.trim().length > 10;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="support-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            key="support-modal"
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            className="fixed top-0 right-0 bottom-0 w-full sm:w-[440px] z-[101] overflow-y-auto"
          >
            <div className="h-full bg-background border-l border-outline-variant/15 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>support_agent</span>
                  </div>
                  <div>
                    <h2 className="font-headline text-base font-bold text-on-surface">Contact Support</h2>
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest">Response within 24 hours</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-container-low text-outline hover:text-on-surface transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
                      {/* Category */}
                      <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline">Category *</label>
                        <div className="flex flex-wrap gap-2">
                          {CATEGORIES.map(cat => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => setCategory(cat)}
                              className={`px-3 py-1.5 rounded-full font-label text-[10px] uppercase tracking-wide transition-all border ${
                                category === cat
                                  ? 'bg-primary text-on-primary border-primary'
                                  : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant hover:border-primary/30'
                              }`}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Subject */}
                      <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline" htmlFor="support-subject">Subject *</label>
                        <input
                          id="support-subject"
                          type="text"
                          maxLength={80}
                          value={subject}
                          onChange={e => setSubject(e.target.value)}
                          placeholder="Brief description of your issue"
                          className="w-full h-12 bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 text-sm text-on-surface placeholder:text-outline focus:outline-none transition-colors"
                        />
                      </div>

                      {/* Message */}
                      <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline" htmlFor="support-message">Message *</label>
                        <textarea
                          id="support-message"
                          value={message}
                          onChange={e => setMessage(e.target.value)}
                          placeholder="Describe the issue in detail. The more context, the faster we can help."
                          maxLength={2000}
                          className="w-full h-40 bg-surface-container-low border border-outline-variant/20 focus:border-primary/50 rounded-xl px-4 py-3 text-sm text-on-surface placeholder:text-outline focus:outline-none resize-none transition-colors leading-relaxed"
                        />
                        <div className="flex justify-end">
                          <span className="font-label text-[9px] text-outline/50">{message.length}/2000</span>
                        </div>
                      </div>

                      {/* File attachment */}
                      <div className="space-y-2">
                        <label className="font-label text-[10px] uppercase tracking-widest text-outline">Attachment (optional)</label>
                        <input
                          ref={fileRef}
                          type="file"
                          accept="image/*,.pdf"
                          className="hidden"
                          onChange={e => setFileName(e.target.files[0]?.name || '')}
                        />
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-full h-11 rounded-xl border border-dashed border-outline-variant/30 text-outline hover:border-primary/30 hover:text-primary transition-all font-label text-[10px] uppercase tracking-wide flex items-center justify-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">attach_file</span>
                          {fileName || 'Attach screenshot or file'}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={!isValid || loading}
                        className="w-full h-13 py-3.5 rounded-2xl bg-primary text-on-primary font-headline font-bold text-[13px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        {loading ? (
                          <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Submitting…</>
                        ) : (
                          <><span className="material-symbols-outlined text-base">send</span> Submit Ticket</>
                        )}
                      </button>

                      <p className="text-center font-body text-xs text-outline/50">
                        Your privacy is protected. No personal data beyond this form is shared.
                      </p>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center justify-center text-center py-16 gap-5"
                    >
                      <div className="w-20 h-20 rounded-3xl bg-tertiary/15 border border-tertiary/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-tertiary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
                      </div>
                      <div>
                        <h3 className="font-headline text-2xl font-bold text-on-surface mb-2">Ticket Submitted</h3>
                        <p className="font-body text-sm text-on-surface-variant leading-relaxed max-w-xs">
                          Our support team will respond within 24 hours via your secure inbox.
                        </p>
                      </div>
                      <div className="px-6 py-3 rounded-2xl bg-surface-container-high border border-outline-variant/15">
                        <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-1">Reference Number</p>
                        <p className="font-headline text-2xl font-black text-primary tracking-widest">{ticketRef}</p>
                      </div>
                      <button
                        onClick={handleClose}
                        className="mt-2 h-12 px-8 rounded-2xl bg-surface-container-high border border-outline-variant/15 text-on-surface font-label text-[10px] uppercase tracking-widest hover:bg-surface-container transition-all"
                      >
                        Close
                      </button>
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
