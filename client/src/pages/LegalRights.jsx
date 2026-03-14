import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, AlertTriangle, BookOpen } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  shield: <Shield className="w-5 h-5" strokeWidth={2} />,
  back: <ArrowLeft className="w-5 h-5" strokeWidth={2} />,
  warning: <AlertTriangle className="w-5 h-5" strokeWidth={2} />,
  book: <BookOpen className="w-5 h-5" strokeWidth={2} />,
};

const LegalRights = () => {
  const navigate = useNavigate();

  // Panic key listener - ESC x 3
  useEffect(() => {
    let pressCount = 0;
    let timeout;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        pressCount++;
        clearTimeout(timeout);
        timeout = setTimeout(() => (pressCount = 0), 1000);
        if (pressCount >= 3) {
          window.location.href = 'https://stemuluskidstech.com';
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const sections = [
    {
      title: 'What is the VAPP Act?',
      content: 'The Violence Against Persons (Prohibition) Act of 2015 is a comprehensive federal law in Nigeria designed to protect citizens from all forms of violence, including physical, sexual, psychological, domestic, and economic abuse. It significantly expands the rights of survivors and imposes strict penalties on offenders.'
    },
    {
      title: '1. Rape & Sexual Violence (Section 1)',
      content: 'The VAPP Act modernized the legal definition of rape. It now recognizes that rape can happen to anyone, regardless of gender, and is not limited to traditional definitions. The penalty for rape under the VAPP Act is up to life imprisonment, and anyone convicted of aiding or abetting rape faces a minimum of 12 years to life.'
    },
    {
      title: '2. Emotional & Psychological Abuse (Section 14)',
      content: 'Abuse does not have to leave physical scars to be a crime. The Act criminalizes patterns of degrading behavior, extreme jealousy, isolation from family/friends, and repeated verbal threats. Offenders can face imprisonment of up to 1 year, a fine, or both.'
    },
    {
      title: '3. Spousal Battery / Domestic Violence (Section 19)',
      content: 'It is a criminal offense to physically assault a spouse. The law does not recognize marriage as an excuse for violence. Anyone convicted of spousal battery is liable to up to 3 years imprisonment or a significant fine.'
    },
    {
      title: '4. Economic Abuse (Section 12)',
      content: 'Economic abuse involves the unreasonable deprivation of economic or financial resources to which a person is entitled by law or custom, or which the person requires out of necessity. This includes restricting your access to your own money, refusing to pay rent/mortgage as a form of control, or destroying your property.'
    },
    {
      title: '5. Protection Orders (Section 38)',
      content: 'A Protection Order is a legally binding court directive that forbids an abuser from coming near you, your home, or your workplace. Under the VAPP Act, you, your lawyer, a police officer, or a recognized NGO can apply for this order on your behalf to ensure your immediate physical safety.'
    },
    {
      title: '6. The Right to Privacy',
      content: 'Under the VAPP Act, the identity of survivors must be protected. The press is prohibited from publishing the name, address, or any identifying details of a survivor of sexual or gender-based violence without explicit permission.'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-primary dark:bg-primary-dark text-text-primary dark:text-text-dark-primary font-sans py-8 lg:py-16"
    >
      <div className="max-w-4xl mx-auto px-6">
        
        {/* Header */}
        <header className="mb-12 border-b border-border dark:border-border-dark pb-8">
          <button 
            onClick={() => navigate('/safe-haven')} 
            className="flex items-center gap-2 text-sm font-medium text-text-muted hover:text-[#011e3b] dark:text-text-dark-muted dark:hover:text-white transition-colors mb-8"
          >
            {Icons.back} Back to Safe Haven
          </button>
          
          <div className="flex items-start gap-4 mb-4">
             <div className="w-12 h-12 shrink-0 bg-[#02274d] border border-[#011e3b] dark:border-white text-white flex items-center justify-center shadow-editorial dark:shadow-editorial-dark">
                {Icons.book}
             </div>
             <div>
                <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight text-[#011e3b] dark:text-white mb-2">
                  Know Your Legal Rights
                </h1>
                <p className="text-sm text-text-muted dark:text-text-dark-muted max-w-xl leading-relaxed">
                  A simplified summary of your protections under the Violence Against Persons (Prohibition) Act 2015. 
                  <span className="block mt-2 font-bold text-[#02361b] dark:text-[#34d399]">This is educational information, not formal legal advice.</span>
                </p>
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-white dark:bg-[#02274d] border border-border dark:border-border-dark shadow-editorial dark:shadow-editorial-dark"
            >
              <h2 className="text-lg font-heading font-bold text-[#011e3b] dark:text-white mb-3">
                {section.title}
              </h2>
              <p className="text-sm font-sans text-text-muted dark:text-text-dark-muted leading-relaxed">
                {section.content}
              </p>
            </motion.div>
          ))}
        </div>

        {/* Legal Disclaimer */}
        <div className="mt-12 p-6 border border-border dark:border-border-dark bg-surface-alt dark:bg-[#050505] flex items-start gap-4">
          <div className="text-amber-500 shrink-0 mt-1">{Icons.warning}</div>
          <p className="text-xs text-text-muted dark:text-gray-400 leading-relaxed uppercase tracking-wider font-bold">
            Legal Disclaimer: This document is intended for general informational purposes only and does not constitute formal legal counsel. If you need immediate legal representation, please contact the Legal Aid Council or a registered NGO via the Safe Haven dashboard.
          </p>
        </div>

      </div>
    </motion.div>
  );
};

export default LegalRights;
