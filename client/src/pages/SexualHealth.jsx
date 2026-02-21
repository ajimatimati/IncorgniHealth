import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ParallaxCard from '../components/ParallaxCard';
import RippleButton from '../components/RippleButton';

/* ── SVG Icons ── */
const Icons = {
  vial: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-4.769.06l-.311-.31a3.375 3.375 0 00-4.773-.063L5 14.5m14 0V17a3 3 0 01-3 3h-2.25" />
    </svg>
  ),
  pill: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  heart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0h18M5.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
    </svg>
  ),
};

const Quiz = ({ onFinish }) => {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const questions = [
    {
      q: 'Do you have a new sexual partner?',
      options: [
        { label: 'Yes', risk: 2 },
        { label: 'No', risk: 0 },
      ],
    },
    {
      q: 'Do you use condoms consistently?',
      options: [
        { label: 'Always', risk: 0 },
        { label: 'Sometimes', risk: 2 },
        { label: 'Never', risk: 3 },
      ],
    },
    {
      q: 'Have you been tested in the last 6 months?',
      options: [
        { label: 'Yes, all clear', risk: 0 },
        { label: 'Yes, tested positive', risk: 1 },
        { label: 'No', risk: 2 },
      ],
    },
    {
      q: 'Do you have any current symptoms (pain, discharge, bumps)?',
      options: [
        { label: 'Yes', risk: 5 }, // Immediate referral
        { label: 'Not sure', risk: 2 },
        { label: 'No', risk: 0 },
      ],
    },
  ];

  const handleAnswer = (risk) => {
    const nextScore = score + risk;
    if (step < questions.length - 1) {
      setScore(nextScore);
      setStep(step + 1);
    } else {
      onFinish(nextScore);
    }
  };

  const currentQ = questions[step];

  return (
    <div className="animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold text-text-primary">Risk Assessment</h3>
        <span className="text-xs font-mono text-text-muted">Question {step + 1}/{questions.length}</span>
      </div>
      
      <div className="w-full bg-surface-alt rounded-full h-1.5 mb-8">
        <div 
          className="bg-rose-500 h-1.5 rounded-full transition-all duration-300" 
          style={{ width: `${((step + 1) / questions.length) * 100}%` }}
        />
      </div>

      <h4 className="text-xl font-bold text-white mb-8">{currentQ.q}</h4>

      <div className="space-y-3">
        {currentQ.options.map((opt, i) => (
          <RippleButton
            key={i}
            onClick={() => handleAnswer(opt.risk)}
            variant="secondary"
            className="w-full text-left justify-start bg-surface-alt hover:bg-white/10 border border-white/5 !py-4 transition-all"
          >
            <span className="font-medium text-text-primary">{opt.label}</span>
          </RippleButton>
        ))}
      </div>
    </div>
  );
};

const EducationAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);
  
  const items = [
    { title: 'Safe Practices Guide', content: 'Consistency is key. Internal and external condoms, when used correctly, are 98% effective...' },
    { title: 'Testing Frequency', content: 'Sexually active individuals should get tested at least once a year. If you have new partners, every 3-6 months is recommended...' },
    { title: 'PrEP & PEP Explained', content: 'PrEP is taken before exposure to prevent HIV (up to 99% effective). PEP is an emergency medication taken within 72 hours after exposure...' },
    { title: 'Myth Busting', content: 'Myth: You can tell if someone has an STI by looking. Fact: Most STIs have no visible symptoms...' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="glass-card overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <span className="font-semibold text-text-primary text-sm">{item.title}</span>
            <span className={`transform transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''} text-text-dim`}>
              {Icons.chevronDown}
            </span>
          </button>
          <div className={`accordion-content ${openIndex === i ? 'open max-h-40' : 'max-h-0'}`}>
            <div className="px-4 pb-4 text-sm text-text-muted leading-relaxed">
              {item.content}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const SexualHealth = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('resources');
  const [quizResult, setQuizResult] = useState(null);

  const startConsult = () => navigate('/dashboard'); // Should trigger consult flow

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto relative z-10"
    >
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Sexual Health</h1>
        <p className="text-sm text-text-muted mt-1">
          Confidential screening, education, and care. Zero judgment.
        </p>
      </div>

      <div className="bg-gradient-to-r from-rose-500/10 to-pink-500/10 border border-rose-500/20 rounded-2xl p-5 mb-8 flex items-start gap-4">
        <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400">
          {Icons.lock}
        </div>
        <div>
          <h3 className="font-bold text-text-primary text-sm">Your privacy is absolute</h3>
          <p className="text-xs text-text-secondary mt-1 leading-relaxed">
            We use zero-knowledge encryption for health data. Consultations are anonymous. No billing descriptions will ever mention sexual health services.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {['resources', 'assessment', 'education', 'book'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab
                ? 'bg-rose-500 text-white shadow-glow'
                : 'bg-surface hover:bg-white/5 text-text-muted hover:text-white'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'resources' && (
          <motion.div 
            key="resources"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
          {[
            { icon: Icons.vial, title: 'STI Testing', desc: 'Home kits or lab referral', grad: 'from-rose-500/20 to-pink-500/20' },
            { icon: Icons.pill, title: 'PrEP / PEP', desc: 'HIV prevention meds', grad: 'from-blue-500/20 to-cyan-500/20' },
            { icon: Icons.heart, title: 'Reproductive', desc: 'Fertility & wellness', grad: 'from-emerald-500/20 to-teal-500/20' },
            { icon: Icons.lock, title: 'Consultation', desc: 'Chat with a specialist', grad: 'from-amber-500/20 to-orange-500/20' },
          ].map((r, i) => (
            <ParallaxCard
              key={i}
              onClick={startConsult}
              className={`p-6 text-left transition bg-gradient-to-br ${r.grad}`}
            >
              <div className="text-white mb-3">{r.icon}</div>
              <h3 className="font-bold text-text-primary mb-1">{r.title}</h3>
              <p className="text-xs text-text-muted">{r.desc}</p>
            </ParallaxCard>
          ))}
        </motion.div>
      )}

      {activeTab === 'assessment' && (
        <motion.div 
          key="assessment"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6 md:p-8"
        >
          {quizResult === null ? (
            <Quiz onFinish={setQuizResult} />
          ) : (
            <div className="text-center animate-scale-in">
              <div className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center mb-6 text-3xl ${
                quizResult > 3 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'
              }`}>
                {quizResult > 3 ? '!' : '✓'}
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-2">Assessment Complete</h3>
              <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto">
                {quizResult > 3
                  ? 'Based on your answers, we recommend scheduling a consultation or screening soon. Better safe than sorry.'
                  : 'Your risk profile appears low, but regular check-ups are always a good idea.'}
              </p>
              <div className="flex gap-3 justify-center">
                <RippleButton onClick={() => setQuizResult(null)} variant="secondary" className="text-sm justify-center">Retake</RippleButton>
                <RippleButton onClick={startConsult} className="text-sm justify-center">Book Consultation</RippleButton>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {activeTab === 'education' && (
        <motion.div 
          key="education"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          <EducationAccordion />
        </motion.div>
      )}

      {activeTab === 'book' && (
        <motion.div 
          key="book"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            {Icons.calendar} Schedule Appointment
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-text-muted mb-2 block">Preferred Date</label>
              <input type="date" className="input-field w-full" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-2 block">Preferred Time</label>
              <select className="input-field w-full text-text-secondary">
                <option>Morning (9AM - 12PM)</option>
                <option>Afternoon (1PM - 4PM)</option>
                <option>Evening (5PM - 8PM)</option>
              </select>
            </div>
            <div className="pt-4">
              <RippleButton onClick={startConsult} className="w-full justify-center">
                Book Consultation Now
              </RippleButton>
              <p className="text-[10px] text-text-dim text-center mt-3">
                No payment required until doctor confirmation.
              </p>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SexualHealth;
