import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, ArrowLeft, Clock, Dna, Phone, AlertTriangle, Hospital } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  shield: <Shield className="w-5 h-5" strokeWidth={2} />,
  back: <ArrowLeft className="w-5 h-5" strokeWidth={2} />,
  clock: <Clock className="w-5 h-5 text-amber-500" strokeWidth={2} />,
  dna: <Dna className="w-5 h-5 text-[#02361b] dark:text-[#34d399]" strokeWidth={2} />,
  phone: <Phone className="w-5 h-5 text-[#011e3b] dark:text-[#60a5fa]" strokeWidth={2} />,
  warning: <AlertTriangle className="w-5 h-5" strokeWidth={2} />,
  medical: <Hospital className="w-5 h-5 text-red-500" strokeWidth={2} />,
};

const EvidenceGuide = () => {
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
      title: 'The 72-Hour Window',
      icon: Icons.clock,
      content: 'If an assault has just occurred, getting to a Sexual Assault Referral Centre (SARC) or hospital within 72 hours is critical. Within this window, medical professionals can administer Post-Exposure Prophylaxis (PEP) to prevent HIV and emergency contraception to prevent pregnancy.'
    },
    {
      title: 'Physical & Forensic Preservation (Do Not Wash)',
      icon: Icons.dna,
      content: 'As difficult as it may be, do not shower, bathe, douche, brush your teeth, wash your hands, or change your clothes until after a medical examination. Water and soap destroy critical DNA evidence (saliva, hair, skin cells) that can be linked to the perpetrator.'
    },
    {
      title: 'Handling Clothing',
      icon: Icons.shield,
      content: 'If you must change your clothes or if they were torn, place them in a breathable paper bag—not a plastic bag. Plastic bags retain moisture and cause mold, which degrades DNA evidence. Bring the paper bag with you to the police or medical center.'
    },
    {
      title: 'Digital Evidence',
      icon: Icons.phone,
      content: 'Do not delete threatening text messages, emails, WhatsApp chats, social media DMs, or call logs—even if they are distressing. Take screenshots immediately, ensuring the date and time stamps are visible. Save these screenshots to a secure cloud folder (like Google Drive) and send a copy to a trusted emergency contact.'
    },
    {
      title: 'Medical Examination (Rape Kit)',
      icon: Icons.medical,
      content: 'At the SARC or hospital, trained forensic nurses or doctors will perform an examination to collect evidence. You have the right to pause or stop this examination at any time if you feel overwhelmed. The evidence collected is securely sealed and can be crucial for prosecution.'
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
                {Icons.dna}
             </div>
             <div>
                <h1 className="text-3xl lg:text-4xl font-heading font-black tracking-tight text-[#011e3b] dark:text-white mb-2">
                  Evidence Preservation Guide
                </h1>
                <p className="text-sm font-bold text-[#02361b] dark:text-[#34d399] uppercase tracking-wider mb-2">Immediate Actions to Take After an Incident</p>
                <p className="text-sm text-text-muted dark:text-text-dark-muted max-w-xl leading-relaxed">
                  Preserving evidence immediately after an assault strengthens medical and legal intervention. These guidelines are medically sound standards for evidence collection in Nigeria.
                </p>
             </div>
          </div>
        </header>

        {/* Content */}
        <div className="grid gap-6">
          {sections.map((section, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-8 bg-white dark:bg-[#02274d] border border-border dark:border-border-dark shadow-editorial dark:shadow-editorial-dark flex gap-6"
            >
              <div className="hidden sm:flex shrink-0 w-12 h-12 rounded-full border border-border dark:border-[#333] bg-surface-alt dark:bg-[#111] items-center justify-center">
                {section.icon}
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-[#011e3b] dark:text-white mb-3 flex items-center gap-2">
                  {section.title}
                </h2>
                <p className="text-sm font-sans text-text-muted dark:text-text-dark-muted leading-relaxed">
                  {section.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Action Panel */}
        <div className="mt-12 p-8 bg-[#011e3b] dark:bg-white text-white dark:text-[#011e3b] shadow-editorial-action font-sans">
          <h3 className="text-lg font-bold mb-4">Need Immediate Help?</h3>
          <p className="text-sm mb-6 leading-relaxed opacity-90">
            If you are in immediate danger or need to find your nearest Sexual Assault Referral Centre (SARC), contact the emergency hotlines right now.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
             <a href="tel:112" className="px-6 py-4 bg-white text-[#011e3b] dark:bg-[#011e3b] dark:text-white font-bold text-center border active:scale-95 transition-transform flex items-center justify-center gap-2">
                {Icons.phone} 112 (General)
             </a>
             <a href="tel:08139841886" className="px-6 py-4 border border-white/30 dark:border-[#011e3b]/30 font-bold text-center active:scale-95 transition-transform hover:bg-white/10 dark:hover:bg-[#011e3b]/10 flex items-center justify-center gap-2">
                {Icons.phone} Contact DSVRT
             </a>
          </div>
        </div>

      </div>
    </motion.div>
  );
};

export default EvidenceGuide;
