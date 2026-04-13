import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PanicButton from '../components/PanicButton';

const TABS = ['Guided Breathing', 'Daily Check-in & Journal', 'Grounding (5-4-3-2-1)'];

const MOODS = [
  { emoji: '😞', label: 'Low', val: 1 },
  { emoji: '😕', label: 'Struggling', val: 2 },
  { emoji: '😐', label: 'Neutral', val: 3 },
  { emoji: '🙂', label: 'Good', val: 4 },
  { emoji: '😊', label: 'Great', val: 5 },
];

const GROUNDING = [
  { prompt: '5 things you can see', icon: 'visibility' },
  { prompt: '4 things you can touch', icon: 'touch_app' },
  { prompt: '3 things you can hear', icon: 'hearing' },
  { prompt: '2 things you can smell', icon: 'air' },
  { prompt: '1 thing you can taste', icon: 'restaurant' },
];

const BREATHE_PHASES = [
  { label: 'Breathe In',  duration: 4 },
  { label: 'Hold',        duration: 4 },
  { label: 'Breathe Out', duration: 6 },
  { label: 'Hold',        duration: 2 },
];

export default function MentalWellness() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalText, setJournalText] = useState('');
  const [journalSaved, setJournalSaved] = useState(false);

  // Breathing state
  const [breathingActive, setBreathingActive] = useState(false);
  const [phase, setPhase] = useState(0);
  const [countdown, setCountdown] = useState(BREATHE_PHASES[0].duration);
  const timerRef = useRef(null);

  const startBreathing = () => {
    setBreathingActive(true);
    setPhase(0);
    setCountdown(BREATHE_PHASES[0].duration);
  };

  const stopBreathing = () => {
    clearTimeout(timerRef.current);
    setBreathingActive(false);
    setPhase(0);
    setCountdown(BREATHE_PHASES[0].duration);
  };

  useEffect(() => {
    if (!breathingActive) return;
    if (countdown > 0) {
      timerRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    } else {
      const next = (phase + 1) % BREATHE_PHASES.length;
      setPhase(next);
      setCountdown(BREATHE_PHASES[next].duration);
    }
    return () => clearTimeout(timerRef.current);
  }, [breathingActive, countdown, phase]);

  // Clean timer when switching away from tab
  useEffect(() => {
    if (activeTab !== TABS[0]) {
      stopBreathing();
    }
  }, [activeTab]);

  const handleSaveJournal = () => {
    if (!journalText.trim()) return;
    const prev = localStorage.getItem('ih_journal_draft') || '';
    const ts = new Date().toLocaleString();
    localStorage.setItem('ih_journal_draft', prev + `\n\n[${ts} - Mental Wellness Hub]\n` + journalText);
    
    setJournalSaved(true);
    setTimeout(() => setJournalSaved(false), 3000);
    setJournalText('');
  };

  const ringScale = breathingActive
    ? (phase === 0 || phase === 1 ? 1.3 : 1)
    : 1;

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings:"'FILL' 1" }}>self_improvement</span>
            <div>
              <p className="font-label text-[11px] text-tertiary uppercase tracking-[0.2em] mb-1">Private & Secure</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Mental Wellness</h1>
            </div>
          </div>
        </header>

        {/* High-Density Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Persistent Left Nav */}
          <nav className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-between h-14 lg:h-auto lg:py-4 px-6 lg:px-5 rounded-[20px] lg:rounded-2xl shrink-0 transition-all ${
                  activeTab === tab
                    ? 'bg-surface-container-highest text-on-surface shadow-md'
                    : 'bg-surface-container-low border border-outline-variant/5 text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">
                    {idx === 0 ? 'air' : idx === 1 ? 'mood' : 'nature_people'}
                  </span>
                  <span className="font-label text-[9px] uppercase tracking-widest text-left whitespace-nowrap">{tab}</span>
                </div>
                {activeTab === tab && <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-tertiary" />}
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === TABS[0] && (
                <motion.div key="breathe" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
                  {/* Breathing Guide */}
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-10 lg:p-16 text-center space-y-12 relative overflow-hidden shadow-lg shadow-tertiary/5">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-tertiary/30 to-transparent" />
                    
                    <div>
                      <h2 className="font-headline text-2xl font-bold text-on-surface mb-2">Box Breathing</h2>
                      <p className="font-body text-sm text-on-surface-variant opacity-80 max-w-sm mx-auto">A powerful relaxation technique to return your breathing to its normal rhythm and clear your mind.</p>
                    </div>

                    {/* Breathing Ring */}
                    <div className="flex items-center justify-center my-10">
                      <div className="relative w-56 h-56">
                        <motion.div
                          animate={{ scale: ringScale, opacity: breathingActive ? 0.15 : 0.05 }}
                          transition={{ duration: phase === 0 ? 4 : phase === 2 ? 6 : 0.5, ease: 'easeInOut' }}
                          className="absolute inset-0 rounded-full bg-tertiary mix-blend-screen"
                        />
                        <motion.div
                          animate={{ scale: breathingActive ? (ringScale * 0.8) : 0.8, opacity: breathingActive ? 0.3 : 0.1 }}
                          transition={{ duration: phase === 0 ? 4 : phase === 2 ? 6 : 0.5, ease: 'easeInOut' }}
                          className="absolute inset-4 rounded-full bg-tertiary"
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <span className="font-headline text-5xl font-black text-on-surface tabular-nums">
                            {breathingActive ? countdown : '—'}
                          </span>
                          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em] mt-2">
                            {breathingActive ? BREATHE_PHASES[phase].label : 'Ready'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={breathingActive ? stopBreathing : startBreathing}
                      className={`h-14 px-10 rounded-2xl font-headline font-bold text-[12px] uppercase tracking-widest transition-all ${
                        breathingActive
                          ? 'bg-error/10 border border-error/20 text-error hover:bg-error/20'
                          : 'bg-tertiary text-on-tertiary shadow-lg shadow-tertiary/20'
                      }`}
                    >
                      {breathingActive ? 'Stop Session' : 'Begin Session'}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[1] && (
                <motion.div key="journal" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {/* Mood Check-in */}
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 flex flex-col">
                    <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] mb-6">Daily Mood</p>
                    <div className="grid grid-cols-5 gap-2 mb-6">
                      {MOODS.map(m => (
                        <button
                          key={m.val}
                          onClick={() => {
                            setSelectedMood(m.val);
                            const prev = JSON.parse(localStorage.getItem('ih_mood_logs') || '[]');
                            prev.push({ date: new Date().toISOString(), mood: m.label, val: m.val });
                            localStorage.setItem('ih_mood_logs', JSON.stringify(prev));
                          }}
                          className={`flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all ${
                            selectedMood === m.val
                              ? 'bg-tertiary/10 border-tertiary/40 shadow-sm'
                              : 'bg-surface-container border-outline-variant/10 hover:border-tertiary/20'
                          }`}
                        >
                          <span className="text-2xl lg:text-3xl filter hover:saturate-150 transition-all">{m.emoji}</span>
                        </button>
                      ))}
                    </div>
                    {selectedMood && (
                      <div className="mt-auto bg-tertiary/5 border border-tertiary/10 rounded-2xl p-4">
                        <p className="text-center font-body text-sm text-tertiary italic opacity-90">
                          Thank you for checking in. Your feelings are valid and seen.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Journal */}
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 flex flex-col">
                    <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] mb-6">Mood Journal</p>
                    <textarea
                      value={journalText}
                      onChange={e => setJournalText(e.target.value)}
                      placeholder="What's on your mind today? This entry stays private..."
                      className="w-full flex-1 min-h-[160px] bg-surface-container border border-outline-variant/10 rounded-2xl p-5 text-sm text-on-surface focus:border-tertiary/40 focus:outline-none resize-none placeholder:text-outline leading-relaxed mb-6"
                    />
                    <button
                      onClick={handleSaveJournal}
                      disabled={!journalText.trim()}
                      className={`w-full h-12 rounded-xl font-headline text-[11px] font-bold uppercase tracking-widest transition-all ${
                        journalSaved
                          ? 'bg-tertiary/20 text-tertiary'
                          : 'bg-surface-container-highest border border-outline-variant/10 text-on-surface hover:bg-surface-container-high disabled:opacity-30'
                      }`}
                    >
                      {journalSaved ? '✓ Entry Saved Privately' : 'Save Entry'}
                    </button>
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[2] && (
                <motion.div key="grounding" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
                  {/* 5-4-3-2-1 Grounding */}
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 lg:p-10 shadow-sm">
                    <div className="mb-8">
                      <p className="font-label text-[10px] text-tertiary uppercase tracking-[0.2em] mb-2">Grounding Exercise</p>
                      <h3 className="font-headline text-2xl font-bold text-on-surface mt-1">5-4-3-2-1 Technique</h3>
                      <p className="font-body text-sm text-on-surface-variant mt-2 opacity-80">Use your senses to bring yourself back to the present moment.</p>
                    </div>
                    <ul className="space-y-4">
                      {GROUNDING.map((item, i) => (
                        <li key={i} className="flex items-center gap-5 p-5 rounded-[24px] bg-surface-container border border-outline-variant/5 hover:border-tertiary/20 transition-colors">
                          <div className="w-12 h-12 rounded-[16px] bg-tertiary/10 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-tertiary text-xl">{item.icon}</span>
                          </div>
                          <p className="font-body text-[15px] text-on-surface font-medium">{item.prompt}</p>
                          <span className="ml-auto font-headline text-4xl font-black text-outline/10 select-none">{5 - i}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
      <PanicButton />
    </div>
  );
}
