import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { Wind, BookOpen, Moon, Hand, Calendar, Trash2 } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  lung: <Wind className="w-6 h-6" strokeWidth={1.5} />,
  book: <BookOpen className="w-6 h-6" strokeWidth={1.5} />,
  moon: <Moon className="w-6 h-6" strokeWidth={1.5} />,
  hand: <Hand className="w-6 h-6" strokeWidth={1.5} />,
  calendar: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
  trash: <Trash2 className="w-4 h-4" strokeWidth={1.5} />,
};

const MOODS = [
  { id: 1, label: 'Awful', color: 'text-[#DC2626]', bg: 'bg-[#FEF2F2]', border: 'border-[#FECACA]' },
  { id: 2, label: 'Bad', color: 'text-[#EA580C]', bg: 'bg-[#FFF7ED]', border: 'border-[#FFEDD5]' },
  { id: 3, label: 'Okay', color: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#FDE68A]' },
  { id: 4, label: 'Good', color: 'text-[#059669]', bg: 'bg-[#F0FDF4]', border: 'border-[#BBF7D0]' },
  { id: 5, label: 'Great', color: 'text-[#6D28D9]', bg: 'bg-[#F5F3FF]', border: 'border-[#EDE9FE]' },
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
    <div className="flex items-end justify-between h-32 gap-3 mt-6 border-b border-[#E8E6E3] pb-2">
      {days.map((date) => {
        const entry = history.find(h => h.date === date);
        const mood = entry ? MOODS.find(m => m.id === entry.mood) : null;
        const height = mood ? `${mood.id * 20}%` : '5%';
        const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
        
        return (
          <div key={date} className="flex flex-col items-center gap-2 flex-1 group h-full">
            <div className="w-full relative flex items-end justify-center h-full bg-[#F4F4F5] rounded-t-lg overflow-hidden shrink-0">
               <div 
                 style={{ height }} 
                 className={`w-full transition-all duration-500 rounded-t-sm ${mood ? mood.bg : 'bg-transparent'} ${mood ? '' : 'opacity-30'}`}
               />
               {mood && (
                 <div className={`absolute bottom-0 w-full h-1 bg-current ${mood.color}`} />
               )}
            </div>
            <span className={`text-[10px] uppercase font-bold tracking-wider ${date === new Date().toISOString().split('T')[0] ? 'text-[#18181B]' : 'text-[#A1A1AA]'}`}>
              {dayLabel}
            </span>
          </div>
        );
      })}
    </div>
  );
};

const MentalWellness = () => {
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
            if (activePanel === 'breathing') runCycle();
          }, 8000);
        }, 7000);
      }, 4000);
    };
    runCycle();
  };
  
  const groundingSteps = [
    { count: 5, text: 'Things you can see', icon: '👀', placeholder: 'Name 5 things around you...' },
    { count: 4, text: 'Things you can touch', icon: '✋', placeholder: 'Texture of your shirt, the table...' },
    { count: 3, text: 'Things you can hear', icon: '👂', placeholder: 'Traffic, A/C process...' },
    { count: 2, text: 'Things you can smell', icon: '👃', placeholder: 'Coffee, rain, soap...' },
    { count: 1, text: 'Thing you can taste', icon: '👅', placeholder: 'Toothpaste, gum, or just water...' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto font-sans pb-28"
    >
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl lg:text-4xl font-black text-[#18181B] mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Mental Wellness
        </h1>
        <p className="text-[14px] text-[#71717A] leading-relaxed max-w-xl">
          Evidence-based tools for grounding, reflection, and calmness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
        {/* Breathing Card */}
        <button
          onClick={startBreathing}
          className="group block w-full text-left p-6 sm:p-8 bg-white border border-[#E8E6E3] hover:border-[#D4D4D8] hover:shadow-card-sm transition-all rounded-2xl"
        >
          <div className="w-12 h-12 bg-[#EFF6FF] text-[#3B82F6] flex items-center justify-center mb-5 rounded-xl border border-[#DBEAFE] group-hover:bg-[#3B82F6] group-hover:text-white transition-colors">
            {Icons.lung}
          </div>
          <h3 className="font-bold text-lg text-[#18181B] mb-1.5">Breathing Exercise</h3>
          <p className="text-[13px] text-[#71717A] leading-relaxed">4-7-8 technique for instant nervous system regulation.</p>
        </button>

        {/* Journal Card */}
        <button
          onClick={() => setActivePanel('journal')}
          className="group block w-full text-left p-6 sm:p-8 bg-white border border-[#E8E6E3] hover:border-[#D4D4D8] hover:shadow-card-sm transition-all rounded-2xl"
        >
           <div className="w-12 h-12 bg-[#FEF3C7] text-[#D97706] flex items-center justify-center mb-5 rounded-xl border border-[#FDE68A] group-hover:bg-[#D97706] group-hover:text-white transition-colors">
            {Icons.book}
          </div>
          <h3 className="font-bold text-lg text-[#18181B] mb-1.5">Mood Journal</h3>
          <p className="text-[13px] text-[#71717A] leading-relaxed">Track your feelings and identify patterns.</p>
        </button>

         {/* Grounding Card */}
         <button
          onClick={() => { setActivePanel('grounding'); setGroundingStep(0); }}
          className="group block w-full text-left p-6 sm:p-8 bg-white border border-[#E8E6E3] hover:border-[#D4D4D8] hover:shadow-card-sm transition-all rounded-2xl"
        >
           <div className="w-12 h-12 bg-[#F0FDF4] text-[#059669] flex items-center justify-center mb-5 rounded-xl border border-[#BBF7D0] group-hover:bg-[#059669] group-hover:text-white transition-colors">
            {Icons.hand}
          </div>
          <h3 className="font-bold text-lg text-[#18181B] mb-1.5">Grounding 5-4-3-2-1</h3>
          <p className="text-[13px] text-[#71717A] leading-relaxed">Stop anxiety attacks by reconnecting with senses.</p>
        </button>

        {/* Sleep Tips */}
        <button
          onClick={() => setActivePanel('tips')}
          className="group block w-full text-left p-6 sm:p-8 bg-white border border-[#E8E6E3] hover:border-[#D4D4D8] hover:shadow-card-sm transition-all rounded-2xl"
        >
           <div className="w-12 h-12 bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center mb-5 rounded-xl border border-[#EDE9FE] group-hover:bg-[#6D28D9] group-hover:text-white transition-colors">
            {Icons.moon}
          </div>
          <h3 className="font-bold text-lg text-[#18181B] mb-1.5">Sleep Hygiene</h3>
          <p className="text-[13px] text-[#71717A] leading-relaxed">Protocols for deep, restorative rest.</p>
        </button>
      </div>

      {/* ─── Active Panels ─── */}

      {activePanel === 'breathing' && (
        <div className="bg-white border border-[#E8E6E3] p-8 lg:p-12 text-center rounded-2xl shadow-card-sm mb-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#EFF6FF] rounded-full blur-3xl opacity-50 -mr-20 -mt-20 pointer-events-none" />
          <h3 className="text-xl font-black text-[#18181B] mb-8 relative z-10">4-7-8 Breathing</h3>
          
          <div className="relative w-48 h-48 mx-auto mb-10 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border border-[#3B82F6] transition-all duration-[4000ms] ${breathPhase?.includes('Inhale') ? 'scale-100 opacity-100' : breathPhase?.includes('Hold') ? 'scale-100 opacity-40' : 'scale-75 opacity-10'}`} />
            <div className={`absolute inset-4 rounded-full bg-[#EFF6FF] blur-xl transition-all duration-[4000ms] ${breathPhase?.includes('Inhale') ? 'scale-110 opacity-100' : 'scale-90 opacity-40'}`} />
            <p className="text-2xl font-black text-[#3B82F6] animate-pulse relative z-10">{breathPhase || 'Get Ready...'}</p>
          </div>
          
          <RippleButton onClick={() => setActivePanel(null)} variant="secondary" className="mx-auto !bg-white">End Session</RippleButton>
        </div>
      )}

      {activePanel === 'journal' && (
        <div className="bg-white border border-[#E8E6E3] p-6 lg:p-10 mb-12 rounded-2xl shadow-card-sm">
          <div className="flex justify-between items-center mb-8 border-b border-[#F0EDED] pb-4">
            <h3 className="text-xl font-black text-[#18181B]">New Entry</h3>
            <button onClick={() => setActivePanel(null)} className="text-[13px] font-bold text-[#A1A1AA] hover:text-[#18181B] transition-colors">Cancel</button>
          </div>

          <div className="mb-8">
            <label className="section-label mb-3 block">How are you feeling?</label>
            <div className="flex flex-wrap sm:flex-nowrap justify-between gap-3">
              {MOODS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMood(m.id)}
                  className={`flex-1 min-w-[70px] py-4 rounded-xl transition-all ${
                    selectedMood === m.id
                      ? `${m.bg} border-2 ${m.border} ${m.color} shadow-sm font-black`
                      : 'bg-white border border-[#E8E6E3] text-[#71717A] hover:bg-[#F9F9FB] font-bold'
                  }`}
                >
                  <span className="text-[13px]">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <textarea
            value={journalEntry}
            onChange={(e) => setJournalEntry(e.target.value)}
            placeholder="Document your thoughts here. Stored locally only..."
            className="w-full h-40 bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl p-5 text-[14px] leading-relaxed focus:border-[#6D28D9] focus:bg-white focus:outline-none transition-colors mb-6 resize-none"
          />

          <RippleButton onClick={saveJournal} disabled={!selectedMood && !journalEntry.trim()} className="w-full justify-center" size="lg">
            Save Securely
          </RippleButton>
        </div>
      )}
      
      {/* Journal History & Chart */}
      <div className="bg-white border border-[#E8E6E3] p-6 lg:p-8 mb-12 rounded-2xl shadow-card-sm">
        <h3 className="section-label mb-6">Mood Trends (Last 7 Days)</h3>
        {moodHistory.length > 0 ? (
          <MoodChart history={moodHistory} />
        ) : (
          <div className="h-40 flex items-center justify-center text-[13px] font-bold text-[#A1A1AA] border border-dashed border-[#E8E6E3] rounded-xl bg-[#F9F9FB] mt-2">
             No mood data documented
          </div>
        )}
      </div>

      {journalHistory.length > 0 && (
        <div className="space-y-4">
          <h3 className="section-label mb-4">Recent Entries</h3>
          {journalHistory.slice(0, 5).map((entry) => (
            <div key={entry.id} className="bg-white border border-[#E8E6E3] rounded-2xl p-6 hover:border-[#D4D4D8] transition-colors shadow-sm">
              <div className="flex justify-between items-center mb-4 border-b border-[#F0EDED] pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5">
                    <span className="text-[#18181B]">{Icons.calendar}</span>
                    {new Date(entry.timestamp).toLocaleDateString()}
                  </span>
                  {entry.mood && (
                    <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-widest border ${
                      MOODS.find(m => m.id === entry.mood)?.bg
                    } ${MOODS.find(m => m.id === entry.mood)?.color} ${MOODS.find(m => m.id === entry.mood)?.border}`}>
                      {MOODS.find(m => m.id === entry.mood)?.label}
                    </span>
                  )}
                </div>
                <button onClick={() => deleteEntry(entry.id)} className="text-[#A1A1AA] hover:text-[#DC2626] transition-colors" title="Delete Entry">
                  {Icons.trash}
                </button>
              </div>
              <p className="text-[14px] text-[#18181B] leading-relaxed whitespace-pre-wrap">{entry.text}</p>
            </div>
          ))}
        </div>
      )}

      {/* Sleep Tips Modal */}
      <AnimatePresence>
        {activePanel === 'tips' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-[#E8E6E3] max-w-md w-full p-8 rounded-2xl shadow-card-md border-t-4 border-t-[#6D28D9]">
              <button onClick={() => setActivePanel(null)} className="absolute top-5 right-5 text-[#A1A1AA] hover:text-[#18181B] p-2 font-bold transition-colors">✕</button>
              <h3 className="text-xl font-black text-[#18181B] mb-6 flex items-center gap-3 pb-4 border-b border-[#F0EDED]">
                <span className="text-[#6D28D9]">{Icons.moon}</span> Sleep Hygiene
              </h3>
              <ul className="space-y-4">
                {['Keep a consistent sleep schedule.', 'No screens 30 mins before bed.', 'Keep room cool if possible, or use a fan.', 'Limit heavy meals late at night.', 'Practice 4-7-8 breathing if you can\'t drift off.'].map((tip, i) => (
                  <li key={i} className="flex gap-4 text-[14px] text-[#18181B] leading-relaxed items-start">
                    <span className="w-6 h-6 rounded-full bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center text-[10px] shrink-0 font-bold tracking-widest leading-none mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Grounding Modal */}
      <AnimatePresence>
        {activePanel === 'grounding' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
             <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white border border-[#E8E6E3] max-w-md w-full p-8 text-center rounded-2xl shadow-card-md border-t-4 border-t-[#059669]">
               <h3 className="text-xl font-black text-[#18181B] mb-2">5-4-3-2-1 Grounding</h3>
               <p className="text-[13px] text-[#71717A] mb-8 pb-5 border-b border-[#F0EDED]">Use your senses to anchor yourself in the present.</p>
               
               <div className="mb-10">
                 <div className="text-5xl mb-5 mx-auto bg-[#F0FDF4] w-24 h-24 rounded-full flex items-center justify-center">{groundingSteps[groundingStep].icon}</div>
                 <p className="text-3xl font-black text-[#18181B] mb-2">Find {groundingSteps[groundingStep].count}</p>
                 <p className="text-[12px] font-bold uppercase tracking-widest text-[#059669] mb-4">{groundingSteps[groundingStep].text}</p>
                 <p className="text-[13px] text-[#A1A1AA] italic bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl p-4 font-medium">{groundingSteps[groundingStep].placeholder}</p>
               </div>
               
               <div className="flex gap-3 mt-8">
                 <RippleButton onClick={() => setActivePanel(null)} variant="secondary" className="flex-1 justify-center !py-3 !bg-white">Dismiss</RippleButton>
                 {groundingStep < 4 ? (
                   <RippleButton onClick={() => setGroundingStep(s => s + 1)} className="flex-1 justify-center !py-3 bg-[#18181B]">Next Step</RippleButton>
                 ) : (
                   <RippleButton onClick={() => { setActivePanel(null); setGroundingStep(0); }} className="flex-1 justify-center !py-3 bg-[#059669] text-white">Finish</RippleButton>
                 )}
               </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
};

export default MentalWellness;
