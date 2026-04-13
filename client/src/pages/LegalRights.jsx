import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const SECTIONS = [
  {
    id: 'overview',
    title: 'What is the VAPP Act?',
    content: 'The Violence Against Persons (Prohibition) Act 2015 is a comprehensive federal law in Nigeria designed to protect citizens from all forms of violence — including physical, sexual, psychological, domestic, and economic abuse. It significantly expands protections for survivors and imposes strict penalties on offenders.'
  },
  {
    id: 'rape',
    title: '1. Rape & Sexual Violence',
    content: 'The VAPP Act modernized the legal definition of rape. It now recognizes that rape can happen to anyone, regardless of gender. The penalty for rape is up to life imprisonment. Aiding or abetting carries a minimum of 12 years.',
    tag: 'Section 1'
  },
  {
    id: 'emotional',
    title: '2. Emotional & Psychological Abuse',
    content: 'Abuse does not have to leave physical marks to be a crime. The Act criminalizes patterns of degrading behaviour, extreme jealousy, isolation from loved ones, and repeated verbal threats. Offenders can face up to 1 year imprisonment, a fine, or both.',
    tag: 'Section 14'
  },
  {
    id: 'battery',
    title: '3. Spousal Battery / Domestic Violence',
    content: 'It is a criminal offence to physically assault a spouse. The law does not recognise marriage as an excuse for violence. Anyone convicted is liable to up to 3 years imprisonment or a significant fine.',
    tag: 'Section 19'
  },
  {
    id: 'economic',
    title: '4. Economic Abuse',
    content: 'Economic abuse includes the unreasonable deprivation of financial resources, restricting access to your own money, or destroying your property as a form of control. All are offences under the VAPP Act.',
    tag: 'Section 12'
  },
  {
    id: 'orders',
    title: '5. Protection Orders',
    content: 'A Protection Order is a legally binding court directive that forbids an abuser from approaching you, your home, or your workplace. You, your lawyer, a police officer, or a recognised NGO can apply for this order on your behalf.',
    tag: 'Section 38'
  },
  {
    id: 'privacy',
    title: '6. The Right to Privacy',
    content: 'Under the VAPP Act, your identity as a survivor must be protected. The press is prohibited from publishing your name, address, or any identifying details without your explicit consent.',
    tag: 'Protections'
  },
];

export default function LegalRights() {
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
             
             <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-2">VAPP Act 2015</p>
             <h1 className="font-headline text-2xl font-bold text-on-surface">Legal Rights Overview</h1>
          </div>
          
          <nav className="flex-1 px-4 pb-8 space-y-1">
            {SECTIONS.map((sec) => (
              <button
                key={sec.id}
                onClick={() => scrollToSection(sec.id)}
                className={`w-full text-left px-4 py-3 rounded-xl transition-all ${
                  activeSection === sec.id 
                    ? 'bg-primary/10 text-primary font-semibold' 
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="font-body text-sm block truncate">{sec.title}</span>
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
            <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-12">Educational Document</p>
            
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

            {/* Disclaimer Block */}
            <div className="mt-20 bg-surface-container-low border border-outline-variant/10 rounded-[24px] p-8 flex items-start gap-4 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-tertiary" />
              <span className="material-symbols-outlined text-tertiary mt-0.5">scale</span>
              <div>
                <h4 className="font-headline text-sm font-bold text-on-surface mb-2">Legal Disclaimer</h4>
                <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-80">
                  This document is for general informational purposes only and does not constitute formal legal advice. For immediate legal representation, please contact the Legal Aid Council or a registered NGO via the directory.
                </p>
              </div>
            </div>
            
          </div>
        </main>
      </div>
    </div>
  );
}
