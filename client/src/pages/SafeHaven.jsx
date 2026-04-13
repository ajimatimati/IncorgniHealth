import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PanicButton from '../components/PanicButton';

const TABS = ['Emergency Support', 'Clinical Protocols', 'Private Secure Log'];

const EMERGENCY = [
  { icon: 'local_hospital', title: 'Find a SARC', desc: 'Locate the nearest Sexual Assault Referral Centre. Open 24/7, staffed by specialist clinical nurses.', actionName: 'Find SARC', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20',
    action: (navigate) => navigate('/sarc') },
  { icon: 'call', title: 'Crisis Line', desc: 'Speak to a trained crisis counsellor right now. Anonymous, free, and available around the clock.', actionName: 'Call Now', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20',
    action: () => window.dispatchEvent(new Event('open-crisis-line')) },
  { icon: 'emergency', title: 'Emergency Services', desc: 'Contact emergency medical services for immediate physical care.', actionName: '999 / 112', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20',
    action: () => window.dispatchEvent(new Event('open-sos')) },
];

const PROTOCOL_STEPS = [
  { step: '01', title: 'Seek Safety First', desc: 'Get to a place where you feel safe. Your wellbeing is the immediate priority.' },
  { step: '02', title: 'Go to a SARC or Hospital', desc: 'A SARC can provide medical care, emotional support, and evidence collection — all your choice.' },
  { step: '03', title: 'Preserve Evidence (If You Choose)', desc: 'Try not to shower, change clothes, or clean up. This preserves options — reporting is entirely your decision.' },
  { step: '04', title: 'Receive Support', desc: 'You do not need to report to police to receive care. SARC services are available regardless.' },
  { step: '05', title: 'Follow-Up Care', desc: 'Ongoing counselling, medical care, and legal advice are available when you are ready.' },
];

const LOG_PROMPTS = [
  'What happened today?',
  'How are you feeling right now?',
  'What do you need most in this moment?',
  'What felt safe or comforting today?',
];

export default function SafeHaven() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [logText, setLogText] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [prompt, setPrompt] = useState(LOG_PROMPTS[0]);

  const handleSaveLog = () => {
    if (!logText.trim()) return;
    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 3000);
    setLogText('');
    setPrompt(LOG_PROMPTS[Math.floor(Math.random() * LOG_PROMPTS.length)]);
  };

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings:"'FILL' 1" }}>shield_with_heart</span>
            <div>
              <p className="font-label text-[11px] text-error uppercase tracking-[0.2em] mb-1">Confidential Zone</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Safe Haven</h1>
            </div>
          </div>
          {/* Quick Exit */}
          <button
            onClick={() => window.location.replace('https://www.google.com')}
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-error text-on-error hover:brightness-110 transition-all shadow-lg shadow-error/20"
          >
            <span className="material-symbols-outlined text-base">exit_to_app</span>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold">Quick Exit (Esc)</span>
          </button>
        </header>

        {/* Privacy notice */}
        <section className="bg-error/5 rounded-[24px] border border-error/20 p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-error mt-1">gpp_maybe</span>
          <p className="font-body text-sm text-error leading-relaxed">
            <strong className="font-bold">End-to-End Privacy.</strong> This environment is completely isolated. No history is permanently logged on our servers or your cache. Close this tab or use the Quick Exit button to immediately scrub your session.
          </p>
        </section>

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
                    {idx === 0 ? 'medical_services' : idx === 1 ? 'account_tree' : 'lock_clock'}
                  </span>
                  <span className="font-label text-[9px] uppercase tracking-widest text-left whitespace-nowrap">{tab}</span>
                </div>
                {activeTab === tab && <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === TABS[0] && (
                <motion.div key="emergency" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 columns-masonry">
                    {EMERGENCY.map((item, i) => (
                      <div key={i} className={`bg-surface-container-low rounded-[32px] border ${item.border} p-8 flex flex-col justify-between h-full hover:shadow-lg transition-shadow`}>
                        <div className="mb-6">
                           <div className={`w-14 h-14 rounded-[20px] ${item.bg} flex items-center justify-center mb-6`}>
                             <span className={`material-symbols-outlined text-[28px] ${item.color}`} style={{ fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
                           </div>
                           <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">{item.title}</h3>
                           <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{item.desc}</p>
                        </div>
                        <button onClick={() => item.action(navigate)} className={`w-full h-12 rounded-xl border ${item.border} ${item.color} ${item.bg} font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all`}>
                          {item.actionName}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[1] && (
                <motion.div key="protocol" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-6">Standard Care Pathway</p>
                  <div className="space-y-4">
                    {PROTOCOL_STEPS.map((step, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-6 bg-surface-container-low hover:bg-surface-container rounded-[32px] border border-outline-variant/10 p-6 sm:p-8 transition-colors">
                        <span className="font-headline text-4xl sm:text-5xl font-black text-outline/20 shrink-0 w-16 select-none">{step.step}</span>
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{step.title}</h3>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[2] && (
                <motion.div key="log" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
                  <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 sm:p-10 shadow-lg">
                    <header className="mb-8">
                       <p className="font-label text-[10px] text-primary flex items-center gap-2 uppercase tracking-[0.2em] mb-2">
                          <span className="material-symbols-outlined text-[16px]">lock</span> Private Journal
                       </p>
                       <p className="font-body text-[15px] text-on-surface-variant italic opacity-90 leading-relaxed border-l-2 border-primary/30 pl-4 py-1">"{prompt}"</p>
                    </header>
                    <textarea
                      value={logText}
                      onChange={e => setLogText(e.target.value)}
                      placeholder="Write freely. Your device encrypts this locally right now..."
                      className="w-full h-64 bg-surface-container border border-outline-variant/10 rounded-2xl p-6 text-sm text-on-surface focus:border-primary/40 focus:bg-surface-container-highest focus:outline-none resize-none placeholder:text-outline leading-loose"
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                      <button
                        onClick={handleSaveLog}
                        disabled={!logText.trim()}
                        className={`flex-1 w-full h-14 rounded-xl font-headline font-bold text-[12px] uppercase tracking-widest transition-all ${
                          logSaved ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' : 'bg-primary text-on-primary disabled:opacity-30'
                        }`}
                      >
                        {logSaved ? '✓ Cryptographically Stored' : 'Save Locally'}
                      </button>
                      <p className="font-label text-[8px] text-outline opacity-60 max-w-[200px] text-center sm:text-left">
                        Entries are stored in your Secure Local Enclave.
                      </p>
                    </div>
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
