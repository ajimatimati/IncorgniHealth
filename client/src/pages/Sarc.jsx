import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SarcLocator from '../components/SarcLocator';

const Sarc = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-[#010101] min-h-screen text-white select-none"
    >
      <div className="max-w-5xl mx-auto px-6 sm:px-10 py-10 lg:py-14 space-y-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/5">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
                <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
              </div>
              <h1 className="font-sans text-3xl lg:text-4xl font-black text-white tracking-tight">
                SARC Centre
              </h1>
            </div>
            <p className="font-sans text-xs text-white/50 leading-relaxed max-w-md">
              Locate verified Sexual Assault Referral Centre options nearby, or connect anonymously with trauma counsellors right now.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-white/10 font-mono text-[9px] uppercase tracking-widest transition-all shrink-0 active:scale-95"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            Go back
          </button>
        </header>

        {/* Immediate Counsellor Contact */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-8 bento-glass">
          <div className="mb-6">
            <h2 className="font-sans text-lg font-bold text-white flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              </span>
              Immediate Counsellor Support
            </h2>
            <p className="font-sans text-xs text-white/50 mt-2 leading-relaxed">
              Connect confidentially with a trained trauma specialist. Free, anonymous, and available 24/7.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="tel:08140432362"
              className="flex items-center justify-center gap-2.5 h-11 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all bg-white text-black hover:bg-white/95 active:scale-95 shadow"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              Call 0814 043 2362
            </a>
            <a
              href="https://wa.me/2348140432362"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 h-11 rounded-full font-mono text-[9px] uppercase tracking-widest transition-all bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95"
            >
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              WhatsApp message
            </a>
          </div>
        </section>

        {/* SARC Locator Map Stage */}
        <section className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 md:p-8 bento-glass">
          <h2 className="font-sans text-lg font-bold text-white mb-6 uppercase tracking-wider">Verified SARC Locator</h2>
          <SarcLocator />
        </section>
      </div>
    </motion.div>
  );
};

export default Sarc;
