import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PanicButton from '../components/PanicButton';

const TABS = ['Clinical Testing', 'Health Education', 'Confidential Consult'];

const SERVICES = [
  {
    icon: 'home_health',
    title: 'At-Home STI Kit',
    desc: 'Order a discreet, certified testing kit delivered directly to you. Results shared only with you.',
    actionName: 'Order Kit',
    color: 'text-primary',
    bg: 'bg-primary/10',
    border: 'border-primary/20',
    action: (navigate) => navigate('/pharmacy'),
  },
  {
    icon: 'location_on',
    title: 'Find a Partner Lab',
    desc: 'Locate a certified, confidential testing centre near you for in-person analysis.',
    actionName: 'Find Lab',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    border: 'border-secondary/20',
    action: (navigate) => navigate('/directory'),
  },
  {
    icon: 'chat_bubble',
    title: 'Anonymous Counselling',
    desc: 'Speak privately with a qualified health counsellor — no real identity revealed.',
    actionName: 'Start Consult',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    border: 'border-tertiary/20',
    action: (navigate) => navigate('/directory'),
  },
  {
    icon: 'shield',
    title: 'Evidence Preservation',
    desc: 'Secure and document clinical evidence with your consent, for your records only.',
    actionName: 'Learn More',
    color: 'text-outline',
    bg: 'bg-surface-container-highest/50',
    border: 'border-outline-variant/10',
    action: (navigate) => navigate('/safe-haven/evidence-guide'),
  },
];

const RESOURCES = [
  { q: 'How soon should I get tested after exposure?', a: 'Testing windows vary by infection. For HIV, most tests are accurate after 2–4 weeks. For STIs like chlamydia and gonorrhoea, 1–2 weeks. Always confirm timing with a healthcare provider.' },
  { q: 'Is my test result shared with anyone?', a: 'No. All results are transmitted directly to you and are end-to-end encrypted. Nothing is shared without your explicit written consent.' },
  { q: 'What if I test positive?', a: 'Most STIs are treatable. A physician on the platform can guide you through next steps — including treatment and, if you choose, partner notification support.' },
];

export default function SexualHealth() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const navigate = useNavigate();

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">
        
        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings:"'FILL' 1" }}>biotech</span>
            <div>
              <p className="font-label text-[11px] text-secondary uppercase tracking-[0.2em] mb-1">Health Hub</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Sexual Health</h1>
            </div>
          </div>
        </header>

        {/* Hero Banner */}
        <section className="bg-secondary/5 rounded-[32px] border border-secondary/20 p-8 lg:p-10 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-2xl">
            <h2 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface leading-tight mb-3">Healthcare, <br className="hidden md:block" />without compromise.</h2>
            <p className="font-body text-base text-on-surface-variant leading-relaxed opacity-90">
              Everything in this hub is private. Your biological data and consultation details are protected by strict clinical confidentiality and zero-knowledge encryption.
            </p>
          </div>
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
                    {idx === 0 ? 'science' : idx === 1 ? 'school' : 'chat_bubble'}
                  </span>
                  <span className="font-label text-[9px] uppercase tracking-widest text-left whitespace-nowrap">{tab}</span>
                </div>
                {activeTab === tab && <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-secondary" />}
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {activeTab === TABS[0] && (
                <motion.div key="testing" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 columns-masonry">
                    {SERVICES.filter((_, i) => i < 2).map((s, i) => (
                      <div key={i} className={`bg-surface-container-low rounded-[32px] border ${s.border} p-8 flex flex-col justify-between h-full hover:shadow-lg transition-shadow`}>
                        <div className="mb-6">
                           <div className={`w-14 h-14 rounded-[20px] ${s.bg} flex items-center justify-center mb-6`}>
                             <span className={`material-symbols-outlined text-[28px] ${s.color}`} style={{ fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
                           </div>
                           <h3 className="font-headline text-xl font-bold text-on-surface mb-2">{s.title}</h3>
                           <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{s.desc}</p>
                        </div>
                        <button onClick={() => s.action(navigate)} className={`w-full h-12 rounded-xl border ${s.border} ${s.color} ${s.bg} font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all`}>
                          {s.actionName}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[1] && (
                <motion.div key="education" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-4xl">
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-6">Frequently Asked Questions</p>
                  <div className="space-y-4">
                    {RESOURCES.map((r, i) => (
                      <div key={i} className="bg-surface-container-low rounded-[24px] border border-outline-variant/10 overflow-hidden hover:bg-surface-container/50 transition-colors">
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === i ? null : i)}
                          className="w-full text-left px-8 py-6 flex items-center justify-between gap-6"
                        >
                          <span className="font-headline text-[15px] font-bold text-on-surface leading-snug">{r.q}</span>
                          <span className={`material-symbols-outlined text-outline shrink-0 transition-transform ${expandedFAQ === i ? 'rotate-180' : ''} bg-surface-container p-2 rounded-full`}>expand_more</span>
                        </button>
                        <AnimatePresence>
                          {expandedFAQ === i && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="px-8 pb-8 pt-2">
                                <div className="h-px w-full bg-outline-variant/10 mb-6" />
                                <p className="font-body text-[15px] text-on-surface-variant leading-relaxed opacity-90">{r.a}</p>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[2] && (
                <motion.div key="consult" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 columns-masonry">
                    {SERVICES.filter((_, i) => i >= 2).map((s, i) => (
                      <div key={i} className={`bg-surface-container-low rounded-[32px] border ${s.border} p-8 flex flex-col justify-between h-full hover:shadow-lg transition-shadow`}>
                        <div className="mb-6">
                           <div className={`w-14 h-14 rounded-[20px] ${s.bg} flex items-center justify-center mb-6`}>
                             <span className={`material-symbols-outlined text-[28px] ${s.color}`} style={{ fontVariationSettings:"'FILL' 1" }}>{s.icon}</span>
                           </div>
                           <h3 className="font-headline text-xl font-bold text-on-surface mb-2">{s.title}</h3>
                           <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{s.desc}</p>
                        </div>
                        <button
                          onClick={() => s.action(navigate)}
                          className={`w-full h-12 rounded-xl border ${s.border} ${s.color} ${s.bg} font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all`}
                        >
                          {s.actionName}
                        </button>
                      </div>
                    ))}
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
