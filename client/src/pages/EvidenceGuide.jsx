import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    id: 'window',
    icon: 'timer',
    title: 'The 72-Hour Window',
    color: 'text-tertiary',
    bg: 'bg-tertiary/10',
    content: 'If an assault has just occurred, getting to a Sexual Assault Referral Centre (SARC) or hospital within 72 hours is critical. Within this window, medical professionals can administer Post-Exposure Prophylaxis (PEP) to prevent HIV and emergency contraception to prevent pregnancy.',
    tag: 'Critical Timing'
  },
  {
    id: 'physical',
    icon: 'biotech',
    title: 'Physical & Forensic Preservation',
    color: 'text-primary',
    bg: 'bg-primary/10',
    content: 'As difficult as it may be, do not shower, bathe, brush your teeth, or change your clothes until after a medical examination. Water and soap can destroy critical DNA evidence that may be linked to the perpetrator.',
    tag: 'Physical Evidence'
  },
  {
    id: 'clothing',
    icon: 'inventory_2',
    title: 'Handling Clothing',
    color: 'text-secondary',
    bg: 'bg-secondary/10',
    content: 'If you must change your clothes, place them in a breathable paper bag — not a plastic bag. Plastic bags retain moisture and cause mould, which degrades DNA evidence. Bring the bag with you to the SARC or medical centre.',
    tag: 'Material'
  },
  {
    id: 'digital',
    icon: 'smartphone',
    title: 'Digital Evidence',
    color: 'text-primary',
    bg: 'bg-primary/10',
    content: 'Do not delete threatening messages, emails, or call logs — even if they are distressing. Screenshot everything with timestamp visible, and save to a secure cloud folder. Share with a trusted person for safekeeping.',
    tag: 'Digital'
  },
  {
    id: 'medical',
    icon: 'local_hospital',
    title: 'Medical Examination',
    color: 'text-error',
    bg: 'bg-error/10',
    content: 'At a SARC or hospital, trained forensic nurses will perform an examination to collect evidence. You have the right to pause or stop at any time. Evidence collected is securely sealed and can support prosecution if you choose to report.',
    tag: 'Clinical'
  },
];

export default function EvidenceGuide() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState(SECTIONS[0].id);

  useEffect(() => {
    let pressCount = 0;
    let timeout;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        pressCount++;
        clearTimeout(timeout);
        timeout = setTimeout(() => (pressCount = 0), 1000);
        if (pressCount >= 3) window.location.replace('https://www.google.com');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col pt-6 lg:pt-0">
      
      {/* Mobile-only header spanning full width */}
      <header className="px-4 pb-4 border-b border-outline-variant/10 lg:hidden flex items-center justify-between sticky top-0 bg-background/90 backdrop-blur-md z-40">
        <button 
          onClick={() => navigate('/safe-haven')}
          className="flex items-center gap-2 text-on-surface hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-lg">arrow_back</span>
          <span className="font-label text-xs uppercase tracking-widest">Back</span>
        </button>
        <button
          onClick={() => window.location.replace('https://www.google.com')}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-error/10 text-error font-label text-[10px] uppercase tracking-widest"
        >
          Quick Exit
        </button>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] mx-auto w-full">
        
        {/* Left Sidebar (Documentation Nav) */}
        <aside className="hidden lg:flex w-72 xl:w-80 border-r border-outline-variant/10 flex-col sticky top-0 h-screen overflow-y-auto no-scrollbar bg-surface-container-lowest">
          <div className="p-8 pb-4">
             <button 
               onClick={() => navigate('/safe-haven')}
               className="flex items-center gap-2 text-outline hover:text-on-surface transition-colors mb-8"
             >
               <span className="material-symbols-outlined text-sm">arrow_back</span>
               <span className="font-label text-[10px] uppercase tracking-widest">Safe Haven</span>
             </button>
             
             <p className="font-label text-[10px] text-error uppercase tracking-[0.2em] mb-2">Confidential Guide</p>
             <h1 className="font-headline text-2xl font-bold text-on-surface">Evidence Preservation</h1>
          </div>
          
          <nav className="flex-1 px-4 pb-8 space-y-1">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  activeSection === sec.id 
                    ? 'bg-error/10 text-error font-semibold' 
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined text-[16px] ${activeSection === sec.id ? 'text-error' : 'text-outline'}`}>
                    {sec.icon}
                  </span>
                  <span className="font-body text-sm block truncate">{sec.title}</span>
                </div>
              </button>
            ))}
          </nav>
        </aside>

        {/* Main Content Pane */}
        <main className="flex-1 px-4 sm:px-8 lg:px-16 xl:px-24 py-10 lg:py-16 overflow-y-auto relative">
          
          {/* Desktop Right Quick Exit Floating */}
          <div className="hidden lg:block absolute top-8 right-8">
            <button
              onClick={() => window.location.replace('https://www.google.com')}
              className="flex items-center gap-2 h-10 px-5 rounded-full bg-error text-on-error hover:brightness-110 shadow-lg shadow-error/20 transition-all group"
            >
              <span className="material-symbols-outlined text-base">exit_to_app</span>
              <span className="font-label text-[9px] uppercase tracking-widest font-bold opacity-0 w-0 overflow-hidden group-hover:opacity-100 group-hover:w-auto transition-all duration-300">Quick Exit (Esc 3x)</span>
            </button>
          </div>

          <div className="max-w-3xl">
            <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-12">Actionable Care Guide</p>
            
            <div className="space-y-16">
              {SECTIONS.map((section, index) => (
                <div key={section.id} id={section.id} className="scroll-mt-24 group relative">
                  {/* Stripe-style Section Anchors/Markers */}
                  <div className="absolute -left-12 top-1.5 hidden xl:flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="material-symbols-outlined text-outline text-[18px]">link</span>
                  </div>
                  
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface leading-tight tracking-tight">{section.title}</h2>
                    {section.tag && (
                      <span className="px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/10 font-mono text-[10px] text-on-surface-variant whitespace-nowrap">
                        {section.tag}
                      </span>
                    )}
                  </div>
                  
                  <p className="font-body text-base lg:text-[17px] text-on-surface-variant leading-relaxed opacity-90 max-w-2xl">
                    {section.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Emergency Panel */}
            <div className="mt-20 bg-error/10 border border-error/20 rounded-[24px] p-8 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-error" />
              <h3 className="font-headline text-lg font-bold text-on-surface mb-3">Need Immediate Help?</h3>
              <p className="font-body text-[15px] text-on-surface-variant leading-relaxed opacity-90 mb-6 max-w-xl">
                If you are in immediate danger, please contact emergency services or your nearest Sexual Assault Referral Centre right now.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 max-w-md">
                <a href="tel:112" className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-error text-on-error font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-error/20">
                  <span className="material-symbols-outlined text-base">call</span>
                  112 — Emergency
                </a>
                <a href="tel:08139841886" className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-error/30 text-error font-label text-[10px] uppercase tracking-widest hover:bg-error/20 transition-all">
                  <span className="material-symbols-outlined text-base">call</span>
                  DSVRT Hotline
                </a>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
