import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxCard from '../components/ParallaxCard';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  lung: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" />
    </svg>
  ),
  book: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  moon: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
  ),
  hand: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.05 4.575a1.575 1.575 0 10-3.15 0v3m3.15-3v-1.5a1.575 1.575 0 013.15 0v1.5m-3.15 0l.075 5.925m3.075.75V4.575m0 0a1.575 1.575 0 013.15 0V15M6.9 7.575V12a6.75 6.75 0 006.75 6.75H18M13.5 15h.008v.008H13.5V15zm0 1.5h.008v.008H13.5v-.008zm1.5-.75h.008v.008H15v-.008zM15 16.5h.008v.008H15v-.008z" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0h18M5.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
  trash: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
  ),
};

const MOODS = [
  { id: 1, label: 'Awful', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30' },
  { id: 2, label: 'Bad', color: 'text-orange-400', bg: 'bg-orange-500/20', border: 'border-orange-500/30' },
  { id: 3, label: 'Okay', color: 'text-yellow-400', bg: 'bg-yellow-500/20', border: 'border-yellow-500/30' },
  { id: 4, label: 'Good', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30' },
  { id: 5, label: 'Great', color: 'text-action', bg: 'bg-action/20', border: 'border-action/30' },
];

/* ─── Components ─── */
const MoodChart = ({ history }) => {
  // Get last 7 days including today
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  return (
    <div className="flex items-end justify-between h-32 gap-2 mt-4">
      {days.map((date) => {
        const entry = history.find(h => h.date === date);
        const mood = entry ? MOODS.find(m => m.id === entry.mood) : null;
        const height = mood ? `${mood.id * 20}%` : '5%';
        const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'narrow' });
        
        return (
          <div key={date} className="flex flex-col items-center gap-2 flex-1 group">
            <div className="w-full relative flex items-end justify-center h-full bg-surface-alt rounded-lg overflow-hidden">
               <div 
                 style={{ height }} 
                 className={`w-full transition-all duration-500 ${mood ? mood.bg : 'bg-white/5'} ${mood ? '' : 'opacity-30'}`}
               />
               {mood && (
                 <div className={`absolute bottom-0 w-full h-1 ${mood.color.replace('text-', 'bg-')}`} />
               )}
            </div>
            <span className={`text-[10px] font-medium ${date === new Date().toISOString().split('T')[0] ? 'text-action' : 'text-text-muted'}`}>
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MentalWellness = () => {
  const navigate = useNavigate();
  const [activePanel, setActivePanel] = useState(null);
  
  // Breathing
  const [breathPhase, setBreathPhase] = useState(null);
  const [breathCount, setBreathCount] = useState(0);
  
  // Journal & Mood
  const [journalEntry, setJournalEntry] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [journalHistory, setJournalHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  
  // Grounding
  const [groundingStep, setGroundingStep] = useState(0);

  useEffect(() => {
    const savedJournal = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const savedMoods = JSON.parse(localStorage.getItem('moodHistory') || '[]');
    setJournalHistory(savedJournal);
    setMoodHistory(savedMoods);
  }, []);

  const saveJournal = () => {
    if (!journalEntry.trim() && !selectedMood) {
      setActivePanel(null);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newEntry = {
      id: Date.now(),
      date: today,
      text: journalEntry,
      mood: selectedMood,
      timestamp: new Date().toISOString(),
    };

    const newHistory = [newEntry, ...journalHistory];
    setJournalHistory(newHistory);
    localStorage.setItem('journalEntries', JSON.stringify(newHistory));

    if (selectedMood) {
      // Update mood history (max 1 per day for chart simplicity, overwrite if exists)
      const otherMoods = moodHistory.filter(m => m.date !== today);
      const newMoods = [...otherMoods, { date: today, mood: selectedMood }];
      setMoodHistory(newMoods);
      localStorage.setItem('moodHistory', JSON.stringify(newMoods));
    }

    setJournalEntry('');
    setSelectedMood(null);
    setActivePanel(null);
  };

  const deleteEntry = (id) => {
    const filtered = journalHistory.filter(e => e.id !== id);
    setJournalHistory(filtered);
    localStorage.setItem('journalEntries', JSON.stringify(filtered));
  };

  const startBreathing = () => {
    setActivePanel('breathing');
    setBreathCount(0);
    const runCycle = () => {
      setBreathPhase('Inhale (4s)');
      setTimeout(() => {
        setBreathPhase('Hold (7s)');
        setTimeout(() => {
          setBreathPhase('Exhale (8s)');
          setTimeout(() => {
            setBreathCount(c => c + 1);
            if (activePanel === 'breathing') runCycle(); // Check if still active not trivial here due to closure, but simple enough for demo
          }, 8000);
        }, 7000);
      }, 4000);
    };
    runCycle();
  };
  
  // Grounding technique 5-4-3-2-1
  const groundingSteps = [
    { count: 5, text: 'Things you can see', icon: '👀', placeholder: 'Name 5 things around you...' },
    { count: 4, text: 'Things you can touch', icon: '✋', placeholder: 'Texture of your shirt, the table...' },
    { count: 3, text: 'Things you can hear', icon: '👂', placeholder: 'Traffic, A/C process...' },
    { count: 2, text: 'Things you can smell', icon: '👃', placeholder: 'Coffee, rain, soap...' },
    { count: 1, text: 'Thing you can taste', icon: '👅', placeholder: 'Toothpaste, gum, or just water...' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto relative z-10"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Mental Wellness</h1>
        <p className="text-sm text-text-muted mt-1">
          Evidence-based tools for grounding, reflection, and calmness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {/* Breathing Card */}
        <ParallaxCard
          onClick={startBreathing}
          className="group glass-card p-6 text-left hover:bg-surface-alt/50 transition-all border-l-4 border-l-blue-400"
        >
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {Icons.lung}
          </div>
          <h3 className="font-bold text-text-primary">Breathing Exercise</h3>
          <p className="text-xs text-text-muted mt-1">4-7-8 technique for instant nervous system regulation.</p>
        </ParallaxCard>

        {/* Journal Card */}
        <ParallaxCard
          onClick={() => setActivePanel('journal')}
          className="group glass-card p-6 text-left hover:bg-surface-alt/50 transition-all border-l-4 border-l-amber-400"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {Icons.book}
          </div>
          <h3 className="font-bold text-text-primary">Mood Journal</h3>
          <p className="text-xs text-text-muted mt-1">Track your feelings and identify patterns.</p>
        </ParallaxCard>

         {/* Grounding Card */}
         <ParallaxCard
          onClick={() => { setActivePanel('grounding'); setGroundingStep(0); }}
          className="group glass-card p-6 text-left hover:bg-surface-alt/50 transition-all border-l-4 border-l-emerald-400"
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {Icons.hand}
          </div>
          <h3 className="font-bold text-text-primary">Grounding 5-4-3-2-1</h3>
          <p className="text-xs text-text-muted mt-1">Stop anxiety attacks by reconnecting with senses.</p>
        </ParallaxCard>

        {/* Sleep Tips */}
        <ParallaxCard
          onClick={() => setActivePanel('tips')}
          className="group glass-card p-6 text-left hover:bg-surface-alt/50 transition-all border-l-4 border-l-purple-400"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            {Icons.moon}
          </div>
          <h3 className="font-bold text-text-primary">Sleep Hygiene</h3>
          <p className="text-xs text-text-muted mt-1">Protocols for deep, restorative rest.</p>
        </ParallaxCard>
      </div>

      {/* ─── Active Panels ─── */}

      {activePanel === 'breathing' && (
        <div className="glass-card-glow p-8 text-center animate-scale-in mb-8">
          <h3 className="text-xl font-bold text-text-primary mb-6">4-7-8 Breathing</h3>
          
          <div className="relative w-48 h-48 mx-auto mb-8 flex items-center justify-center">
            {/* Animated rings */}
            <div className={`absolute inset-0 rounded-full border-2 border-blue-500/30 transition-all duration-[4000ms] ${breathPhase?.includes('Inhale') ? 'scale-100 opacity-100' : breathPhase?.includes('Hold') ? 'scale-100 opacity-50' : 'scale-75 opacity-30'}`} />
            <div className={`absolute inset-4 rounded-full bg-blue-500/10 blur-xl transition-all duration-[4000ms] ${breathPhase?.includes('Inhale') ? 'scale-110 opacity-100' : 'scale-90 opacity-40'}`} />
            
            <p className="text-2xl font-bold text-blue-400 animate-pulse relative z-10">
              {breathPhase || 'Get Ready...'}
            </p>
          </div>
          
          <RippleButton onClick={() => setActivePanel(null)} variant="secondary" className="text-sm">
            End Session
          </RippleButton>
        </div>
      )}

      {activePanel === 'journal' && (
        <div className="glass-card p-6 animate-scale-in mb-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-text-primary">New Entry</h3>
            <button onClick={() => setActivePanel(null)} className="text-xs text-text-dim hover:text-text-primary">Cancel</button>
          </div>

          <div className="mb-4">
            <label className="text-xs text-text-muted mb-2 block">How are you feeling?</label>
            <div className="flex justify-between gap-1">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex-1 py-3 rounded-xl text-center transition-all border ${
                    selectedMood === m.id
                      ? `${m.bg} ${m.border} ${m.color} scale-105 shadow-glow`
                      : 'bg-surface border-white/5 text-text-muted hover:bg-white/5'
                  }`}
                >
                  <span className="text-xs font-bold">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Write your thoughts here. Stored locally only..."
            className="input-field w-full h-32 resize-none mb-4"
          />

          <RippleButton onClick={saveJournal} className="w-full justify-center">Save Entry</RippleButton>
        </div>
      )}
      
      {/* Journal History & Chart */}
      <div className="glass-card p-6 mb-8">
        <h3 className="font-bold text-text-primary mb-2">Mood Trends (Last 7 Days)</h3>
        {moodHistory.length > 0 ? (
          <MoodChart history={moodHistory} />
        ) : (
          <div className="h-32 flex items-center justify-center text-xs text-text-dim border border-dashed border-white/10 rounded-xl bg-surface-alt/30">
            No mood data yet
          </div>
        )}
      </div>

      {journalHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-title">Recent Entries</h3>
          {journalHistory.slice(0, 5).map((entry) => (
            <div key={entry.id} className="card relative group">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-text-dim text-xs flex items-center gap-1">
                    {Icons.calendar}
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  {entry.mood && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      MOODS.find(m => m.id === entry.mood)?.bg
                    } ${MOODS.find(m => m.id === entry.mood)?.color}`}>
                      {MOODS.find(m => m.id === entry.mood)?.label}
                    </span>
                  )}
                </div>
                <button 
                  onClick={() => deleteEntry(entry.id)}
                  className="text-text-dim hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {Icons.trash}
                </button>
              </div>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{entry.text}</p>
            </div>
          ))}
        </div>
      )}

      {activePanel === 'tips' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card max-w-md w-full p-6 relative animate-scale-in">
            <button onClick={() => setActivePanel(null)} className="absolute top-4 right-4 text-text-dim hover:text-white">✕</button>
            <h3 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
              {Icons.moon} Sleep Hygiene
            </h3>
            <ul className="space-y-4">
              {[
                'Keep a consistent sleep schedule.',
                'No screens 30 mins before bed.',
                'Keep room cool if possible, or use a rechargeable fan during power outages.',
                'Cut heavy carbs (like swallow) late at night.',
                '4-7-8 breathing if you can\'t drift off.'
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm text-text-secondary">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-xs shrink-0 font-bold">{i + 1}</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {activePanel === 'grounding' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
           <div className="glass-card max-w-md w-full p-6 text-center animate-scale-in border-t-4 border-emerald-400">
             <h3 className="text-lg font-bold text-emerald-400 mb-2">5-4-3-2-1 Grounding</h3>
             <p className="text-sm text-text-muted mb-6">Use your senses to anchor yourself in the present.</p>
             
             <div className="mb-8">
               <div className="text-4xl mb-2">{groundingSteps[groundingStep].icon}</div>
               <p className="text-2xl font-bold text-white mb-1">Find {groundingSteps[groundingStep].count}</p>
               <p className="text-lg text-emerald-400 font-medium">{groundingSteps[groundingStep].text}</p>
               <p className="text-sm text-text-dim mt-2 italic">{groundingSteps[groundingStep].placeholder}</p>
             </div>
             
             <div className="flex gap-3 mt-8">
               <RippleButton onClick={() => setActivePanel(null)} variant="secondary" className="flex-1 justify-center">Stop</RippleButton>
               {groundingStep < 4 ? (
                 <RippleButton onClick={() => setGroundingStep(s => s + 1)} className="flex-1 justify-center">Next Step</RippleButton>
               ) : (
                 <RippleButton onClick={() => { setActivePanel(null); setGroundingStep(0); }} className="flex-1 justify-center">Finish</RippleButton>
               )}
             </div>
           </div>
        </div>
      )}

    </motion.div>
  );
};

export default MentalWellness;
