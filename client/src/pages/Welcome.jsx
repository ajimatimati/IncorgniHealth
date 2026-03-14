import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, ChevronRight } from 'lucide-react';

const STORY = [
  {
    image: '/story_1.png',
    title: 'Maximum health Outcome.',
    desc: 'Verify, consult, and take control securely from your device.',
  },
  {
    image: '/story_2.png',
    title: 'Discreet home delivery.',
    desc: 'Get your prescribed test kits and medication delivered safely and anonymously.',
  },
  {
    image: '/story_3.png',
    title: 'Expert, private care.',
    desc: 'Zero social exposure. Absolute clinical confidentiality from dedicated professionals.',
  }
];

const Welcome = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      navigate('/auth', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % STORY.length);
    }, 4500); // 4.5s slide duration
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-dvh bg-[#18181B] flex flex-col relative overflow-hidden font-sans">
      
      {/* ── Background Story Carousel ── */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="popLayout">
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <img 
              src={STORY[step].image} 
              alt="Story" 
              className="w-full h-full object-cover transition-opacity"
            />
            {/* Dark gradient overlay to ensure text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#18181B]/40 via-transparent to-[#18181B]/95" />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Main Content Container ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 relative z-10 w-full max-w-[480px] mx-auto h-full min-h-dvh">
        
        {/* Top: Brand & Badge */}
        <div className="pt-8 flex flex-col items-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="flex items-center gap-2 mb-6"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-md">
              <Shield className="w-4 h-4" strokeWidth={2.5} />
            </div>
            <span className="text-2xl font-black text-white tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Incognihealth
            </span>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-black/80 border border-white/20"
          >
            <Activity className="w-3.5 h-3.5 text-[#A1A1AA]" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-white">Clinical Portal Access</span>
          </motion.div>
        </div>

        {/* Bottom: Typography & Actions */}
        <div className="pb-8">
          
          <div className="h-[120px] mb-8 relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute inset-0 flex flex-col justify-end text-center"
              >
                <h1 className="text-[32px] sm:text-[36px] font-black text-white leading-[1.15] tracking-tight drop-shadow-lg mb-3" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                  {STORY[step].title}
                </h1>
                <p className="text-[14px] font-medium text-[#D4D4D8] leading-relaxed drop-shadow-md px-2">
                  {STORY[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mb-8">
            {STORY.map((_, i) => (
              <div 
                key={i} 
                className={`transition-all duration-500 rounded-full ${i === step ? 'w-6 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/30'}`} 
              />
            ))}
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="flex flex-col gap-3"
          >
            <button 
              onClick={() => navigate('/auth')}
              className="group relative w-full h-[54px] bg-white text-[#18181B] rounded-md font-bold text-[15px] hover:bg-[#F4F4F5] active:bg-[#E4E4E7] transition-all flex items-center justify-center gap-2"
            >
              <span>Access Secure Portal</span>
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
            <p className="text-center text-xs text-white/50 mt-2">
              Secured by end-to-end clinical encryption.
            </p>
          </motion.div>
        </div>

      </div>
    </div>
  );
};

export default Welcome;
