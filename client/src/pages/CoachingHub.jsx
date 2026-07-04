import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

const COACHES = {
  cancer: {
    name: 'Coach Sarah, RN',
    title: 'Oncology Navigator & Support Coach',
    bio: 'Sarah has 8 years of clinical oncology nursing experience. She specializes in chemotherapy symptom management, emotional support, and helping patients navigate recovery pipelines anonymously.',
    avatar: '👩‍⚕️',
    initialMsg: 'Hello. I am Sarah, your oncology navigator. Our sessions are fully anonymous under your Ghost ID. How are you managing your treatment side effects today?'
  },
  diabetes: {
    name: 'Coach David, CDCES',
    title: 'Certified Diabetes Care & Education Specialist',
    bio: 'David helps patients optimize blood glucose control, refine insulin calculations, and set daily nutrition targets. He focus on supportive, non-judgmental habits.',
    avatar: '👨‍⚕️',
    initialMsg: 'Hi there, I am David, your diabetes support coach. No judgment here, only care. Let’s work together on your glucose trends and active lifestyle habits.'
  }
};

const DEFAULT_ONCOLOGY_TASKS = [
  { id: 1, label: 'Monitor and log body temperature', done: false },
  { id: 2, label: 'Track chemotherapy symptoms & fatigue', done: false },
  { id: 3, label: 'Hydrate (target: 2.5L water)', done: false },
  { id: 4, label: 'Take scheduled medications / anti-nausea pills', done: false },
  { id: 5, label: 'Perform 10 minutes of gentle stretching', done: false }
];

const DEFAULT_DIABETES_TASKS = [
  { id: 1, label: 'Check and log fasting blood glucose', done: false },
  { id: 2, label: 'Track carbohydrate intake for breakfast/lunch', done: false },
  { id: 3, label: 'Take prescription insulin or oral therapeutics', done: false },
  { id: 4, label: 'Log 30 minutes of cardiovascular walking', done: false },
  { id: 5, label: 'Check feet for proper circulation/abrasions', done: false }
];

const AI_INSIGHTS = {
  cancer: {
    title: 'AI Diagnostics in Precision Oncology',
    content: 'Machine learning algorithms analyze genomic data and histology images to predict tumor subtypes and tailor targeted clinical therapies. AI helps doctors catch micro-metastases months before they appear on standard scans, empowering early, aggressive response strategies.'
  },
  diabetes: {
    title: 'AI Trends in Glucose Predictors',
    content: 'Modern Continuous Glucose Monitors (CGMs) utilize deep neural networks to predict blood sugar spikes 30-45 minutes before they happen. By warning you in advance, AI-driven trackers allow preemptive adjustment of insulin dosages or dietary decisions, preventing critical hypoglycemic crashes.'
  }
};

export default function CoachingHub() {
  // Synchronous lazy initializers avoid useEffect state cascades and comply with ESLint rules
  const [ghostId] = useState(() => {
    const storedGhost = localStorage.getItem('incogni_ghost_id');
    if (storedGhost) return storedGhost;
    const randomId = 'GHOST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    localStorage.setItem('incogni_ghost_id', randomId);
    return randomId;
  });

  const [specialty, setSpecialty] = useState(() => {
    return localStorage.getItem('coaching_specialty') || null;
  });

  const [hasMatched, setHasMatched] = useState(() => {
    return !!localStorage.getItem('coaching_specialty');
  });

  const [quizStep, setQuizStep] = useState(0);

  const [tasks, setTasks] = useState(() => {
    const storedSpecialty = localStorage.getItem('coaching_specialty');
    if (!storedSpecialty) return [];
    const storedTasks = localStorage.getItem(`tasks_${storedSpecialty}`);
    if (storedTasks) return JSON.parse(storedTasks);
    return storedSpecialty === 'cancer' ? DEFAULT_ONCOLOGY_TASKS : DEFAULT_DIABETES_TASKS;
  });

  const [chatMessages, setChatMessages] = useState(() => {
    const storedSpecialty = localStorage.getItem('coaching_specialty');
    if (!storedSpecialty) return [];
    const storedChat = localStorage.getItem(`chat_${storedSpecialty}`);
    if (storedChat) return JSON.parse(storedChat);
    return [
      { sender: 'coach', text: COACHES[storedSpecialty].initialMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
  });

  const [inputMsg, setInputMsg] = useState('');

  const handleStartQuiz = () => {
    setQuizStep(1);
  };

  const handleSelectSpecialty = (type) => {
    setSpecialty(type);
    setQuizStep(2);
  };

  const handleSelectGoal = () => {
    setQuizStep(3);
  };

  const handleFinishQuiz = () => {
    // Save to local storage to persist the match
    localStorage.setItem('coaching_specialty', specialty);
    const initialTasks = specialty === 'cancer' ? DEFAULT_ONCOLOGY_TASKS : DEFAULT_DIABETES_TASKS;
    setTasks(initialTasks);
    localStorage.setItem(`tasks_${specialty}`, JSON.stringify(initialTasks));

    const initialChat = [
      { sender: 'coach', text: COACHES[specialty].initialMsg, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }
    ];
    setChatMessages(initialChat);
    localStorage.setItem(`chat_${specialty}`, JSON.stringify(initialChat));

    setHasMatched(true);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const timeString = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg = { sender: 'user', text: inputMsg, time: timeString };
    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    setInputMsg('');
    localStorage.setItem(`chat_${specialty}`, JSON.stringify(updatedMessages));

    // Simulate coach reply after a slight delay
    setTimeout(() => {
      const coachReply = {
        sender: 'coach',
        text: `Understood. I've noted that in your de-identified file. Keep tracking your daily objectives, and don't hesitate to reach out if you notice any changes in your biometrics.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      const finalMessages = [...updatedMessages, coachReply];
      setChatMessages(finalMessages);
      localStorage.setItem(`chat_${specialty}`, JSON.stringify(finalMessages));
    }, 1200);
  };

  const handleToggleTask = (taskId) => {
    const updated = tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t);
    setTasks(updated);
    localStorage.setItem(`tasks_${specialty}`, JSON.stringify(updated));
  };

  const handleResetCoaching = () => {
    if (window.confirm('Reset your coach and start matching quiz again? Chat records will be cleared.')) {
      localStorage.removeItem('coaching_specialty');
      localStorage.removeItem('tasks_cancer');
      localStorage.removeItem('tasks_diabetes');
      localStorage.removeItem('chat_cancer');
      localStorage.removeItem('chat_diabetes');
      setHasMatched(false);
      setSpecialty(null);
      setQuizStep(0);
      setChatMessages([]);
    }
  };

  const completedCount = tasks.filter(t => t.done).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-outline-variant/10 pb-6">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>diversity_1</span>
            <div>
              <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em] mb-1">Empowering Survivor Support</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">IncogniCare</h1>
            </div>
          </div>

          <div className="flex items-center gap-2.5 bg-surface-container-low px-4 py-2 rounded-xl border border-outline-variant/10 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <span className="font-label text-[10px] text-outline uppercase tracking-wider">
              Secure Ledger: <span className="text-on-surface font-mono font-bold">{ghostId}</span>
            </span>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {!hasMatched ? (
            <motion.div
              key="quiz-section"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-2xl mx-auto"
            >
              {/* Match Quiz Screen */}
              {quizStep === 0 && (
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 sm:p-12 text-center space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary">
                    <span className="material-symbols-outlined text-3xl">psychology</span>
                  </div>
                  <div className="space-y-2">
                    <h2 className="font-headline text-2xl font-bold text-on-surface">Find Your Clinical Support Coach</h2>
                    <p className="font-body text-sm text-on-surface-variant max-w-md mx-auto leading-relaxed">
                      Connect 1-1 with certified health coaches for Diabetes management or Cancer recovery support. All conversations are private, protected, and fully de-identified.
                    </p>
                  </div>
                  <div className="h-px bg-outline-variant/10 my-4" />
                  <button onClick={handleStartQuiz} className="btn btn-primary w-full sm:w-auto px-8">
                    Start Match Quiz
                  </button>
                </div>
              )}

              {quizStep === 1 && (
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 sm:p-12 space-y-6">
                  <p className="font-label text-[10px] text-primary uppercase tracking-widest text-center">Step 1 of 3</p>
                  <h3 className="font-headline text-xl font-bold text-on-surface text-center">What specialty support do you require?</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                    <button
                      onClick={() => handleSelectSpecialty('cancer')}
                      className="p-6 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 hover:border-primary/40 text-left transition-all group"
                    >
                      <span className="text-3xl block mb-3">🎗️</span>
                      <h4 className="font-headline text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Cancer Support</h4>
                      <p className="font-body text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                        1-1 guidance for chemotherapy support, pain navigation, emotional coping, and recovery care tracking.
                      </p>
                    </button>
                    <button
                      onClick={() => handleSelectSpecialty('diabetes')}
                      className="p-6 rounded-2xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 hover:border-primary/40 text-left transition-all group"
                    >
                      <span className="text-3xl block mb-3">🩸</span>
                      <h4 className="font-headline text-sm font-bold text-on-surface group-hover:text-primary transition-colors">Diabetes Management</h4>
                      <p className="font-body text-xs text-on-surface-variant mt-1.5 leading-relaxed">
                        1-1 help for continuous glucose monitoring (CGM), carbohydrate tracking, lifestyle planning, and insulin advice.
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {quizStep === 2 && (
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 sm:p-12 space-y-6">
                  <p className="font-label text-[10px] text-primary uppercase tracking-widest text-center">Step 2 of 3</p>
                  <h3 className="font-headline text-xl font-bold text-on-surface text-center">What is your primary care objective?</h3>
                  <div className="space-y-3 pt-4">
                    {[
                      'Establishing daily habits and compliance checklist tracking',
                      'Direct chat guidance for medication adjustments and symptoms',
                      'Emotional coping and stress reduction coaching',
                      'Biometric and glucose monitoring optimization'
                    ].map((opt, idx) => (
                      <button
                        key={idx}
                        onClick={handleSelectGoal}
                        className="w-full p-4 rounded-xl bg-surface-container hover:bg-surface-container-high border border-outline-variant/10 text-left font-body text-xs text-on-surface transition-all active:scale-[0.99]"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizStep === 3 && (
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-8 sm:p-12 text-center space-y-6">
                  <p className="font-label text-[10px] text-primary uppercase tracking-widest">Step 3 of 3</p>
                  <div className="w-16 h-16 rounded-full bg-tertiary/10 border border-tertiary/20 flex items-center justify-center mx-auto text-tertiary">
                    <span className="material-symbols-outlined text-3xl">done_all</span>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-headline text-xl font-bold text-on-surface">We have matched your profile!</h3>
                    <p className="font-body text-xs text-on-surface-variant max-w-sm mx-auto">
                      Your coach is ready. You will communicate anonymously under your random Ghost ID to ensure complete clinical confidentiality.
                    </p>
                  </div>
                  <div className="h-px bg-outline-variant/10 my-4" />
                  <button onClick={handleFinishQuiz} className="btn btn-primary w-full">
                    Meet My Coach
                  </button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="coaching-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
            >
              {/* Left Column: Coach Card + AI Diagnostic Highlight */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* Active Coach card */}
                <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-6 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-2xl">
                      {COACHES[specialty].avatar}
                    </div>
                    <div>
                      <h3 className="font-headline text-sm font-bold text-on-surface">{COACHES[specialty].name}</h3>
                      <p className="font-label text-[9px] text-primary uppercase tracking-wider">{COACHES[specialty].title}</p>
                    </div>
                  </div>

                  <p className="font-body text-xs text-on-surface-variant leading-relaxed opacity-90">
                    {COACHES[specialty].bio}
                  </p>

                  <div className="h-px bg-outline-variant/10" />

                  <div className="flex items-center justify-between text-[10px] font-label text-outline uppercase tracking-wider">
                    <span>Privacy Safeguard:</span>
                    <span className="text-tertiary font-bold">100% De-Identified</span>
                  </div>

                  <button
                    onClick={handleResetCoaching}
                    className="btn btn-secondary w-full py-2.5 h-auto text-[9px]"
                  >
                    Change / Reset Coach
                  </button>
                </div>

                {/* AI Diagnostics Feature Card */}
                <div className="bg-gradient-to-br from-surface-container-low/40 to-surface-container-low border border-outline-variant/10 rounded-3xl p-6 space-y-4 shadow-sm relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-tertiary/10 rounded-full blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-tertiary text-lg">neurology</span>
                    <h4 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                      AI Diagnostic Insights
                    </h4>
                  </div>
                  <h3 className="font-headline text-sm font-semibold text-tertiary leading-tight">
                    {AI_INSIGHTS[specialty].title}
                  </h3>
                  <p className="font-body text-[11px] text-on-surface-variant leading-relaxed opacity-85">
                    {AI_INSIGHTS[specialty].content}
                  </p>
                </div>
              </div>

              {/* Middle/Right Columns: Chat panel & Daily Tracker Checklist */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                
                {/* 1-1 Chat Panel (7 cols on md) */}
                <div className="md:col-span-7 bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden flex flex-col h-[520px] shadow-sm">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-outline-variant/10 bg-surface-container-low/60 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="font-headline text-xs font-bold text-on-surface">Consultation Feed</span>
                    </div>
                    <span className="font-label text-[8px] text-outline uppercase tracking-wider">Secure Tunnel</span>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex flex-col max-w-[80%] ${
                          msg.sender === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                        }`}
                      >
                        <span className="font-label text-[8px] text-outline uppercase tracking-wider mb-1 px-1">
                          {msg.sender === 'user' ? 'Ghost ID (You)' : COACHES[specialty].name}
                        </span>
                        <div
                          className={`p-3 rounded-2xl text-xs leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-primary text-on-primary rounded-tr-none'
                              : 'bg-surface-container-highest text-on-surface rounded-tl-none border border-outline-variant/10'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[8px] text-outline mt-1 px-1">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-outline-variant/10 bg-background/40 flex gap-2">
                    <input
                      type="text"
                      placeholder="Send secure message anonymously..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-outline-variant/20 focus:border-primary/50 text-xs text-on-surface placeholder:text-outline/60 outline-none transition-colors"
                    />
                    <button type="submit" className="btn btn-primary px-5 min-h-0 h-auto py-2.5 rounded-xl text-[10px]">
                      Send
                    </button>
                  </form>
                </div>

                {/* Daily Adherence Checklist (5 cols on md) */}
                <div className="md:col-span-5 bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 space-y-6 shadow-sm">
                  <div className="space-y-1">
                    <h3 className="font-headline text-xs font-bold text-on-surface uppercase tracking-wider">
                      Daily Care Objectives
                    </h3>
                    <p className="font-body text-[10px] text-on-surface-variant opacity-80">
                      Adherence score is updated in your encrypted medical card.
                    </p>
                  </div>

                  {/* Progress Ring / Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between font-label text-[9px] text-outline uppercase tracking-wider font-bold">
                      <span>Daily Completion</span>
                      <span className="text-primary">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-outline-variant/10">
                      <motion.div
                        className="h-full bg-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  <div className="h-px bg-outline-variant/10" />

                  {/* Checklist Items */}
                  <div className="space-y-3">
                    {tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className="w-full flex items-start gap-3 p-2.5 rounded-xl bg-background/40 border border-outline-variant/5 hover:border-outline-variant/20 text-left transition-colors active:scale-[0.98]"
                      >
                        <div className="mt-0.5 shrink-0 flex items-center justify-center">
                          <span className={`material-symbols-outlined text-base select-none ${
                            task.done ? 'text-primary' : 'text-outline/40'
                          }`}>
                            {task.done ? 'check_box' : 'check_box_outline_blank'}
                          </span>
                        </div>
                        <span className={`font-body text-[11px] leading-snug ${
                          task.done ? 'text-on-surface-variant line-through opacity-60' : 'text-on-surface'
                        }`}>
                          {task.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
