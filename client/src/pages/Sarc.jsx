import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SarcLocator from '../components/SarcLocator';

const Sarc = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="bg-background min-h-full text-on-background"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-8 border-b border-outline-variant/10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-error/10 rounded-2xl flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
              </div>
              <h1 className="font-headline text-3xl lg:text-4xl font-black text-on-surface">
                SARC Centre
              </h1>
            </div>
            <p className="font-body text-sm text-on-surface-variant opacity-70 max-w-md leading-relaxed">
              Find verified Sexual Assault Referral Centre locations near you, or connect with a professional counsellor right now.
            </p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high font-label text-xs uppercase tracking-widest transition-all shrink-0"
          >
            <span className="material-symbols-outlined text-base">arrow_back</span>
            Go back
          </button>
        </header>

        {/* Immediate Counsellor Contact */}
        <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 md:p-8 mb-8">
          <div className="mb-6">
            <h2 className="font-headline text-xl font-bold text-on-surface flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error text-base" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              </span>
              Immediate Counsellor Support
            </h2>
            <p className="font-body text-sm text-on-surface-variant mt-2 opacity-70">
              Speak confidentially with a trained trauma counsellor. Available 24 hours a day, 7 days a week.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <a
              href="tel:08140432362"
              className="flex items-center justify-center gap-3 p-4 rounded-xl font-label text-sm uppercase tracking-widest transition-all bg-primary text-on-primary hover:brightness-110 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>call</span>
              Call 0814 043 2362
            </a>
            <a
              href="https://wa.me/2348140432362"
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-4 rounded-xl font-label text-sm uppercase tracking-widest transition-all bg-tertiary/10 border border-tertiary/20 text-tertiary hover:bg-tertiary hover:text-background"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>chat</span>
              WhatsApp Message
            </a>
          </div>
        </section>

        {/* SARC Locator */}
        <section className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 md:p-8">
          <h2 className="font-headline text-xl font-bold text-on-surface mb-6">Verified SARC Locator</h2>
          <SarcLocator />
        </section>
      </div>
    </motion.div>
  );
};

export default Sarc;
