import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Atmospheric glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none animate-breathing" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="text-center max-w-md animate-fade-in relative z-10">

        {/* Animated SVG illustration */}
        <div className="relative w-44 h-44 mx-auto mb-8">
          <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
            {/* Outer rings */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(208,188,255,0.08)" strokeWidth="1" strokeDasharray="6 5" />
            <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(160,120,255,0.1)" strokeWidth="1" />
            <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(208,188,255,0.06)" strokeWidth="1" strokeDasharray="3 8" />

            {/* Central glassy square */}
            <rect x="68" y="62" width="64" height="64" rx="18"
              fill="rgba(208,188,255,0.05)" stroke="rgba(208,188,255,0.2)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate"
                values="0 100 94;6 100 94;0 100 94;-6 100 94;0 100 94" dur="9s" repeatCount="indefinite" />
            </rect>

            {/* Question mark */}
            <text x="100" y="106" textAnchor="middle" fill="url(#nf-grad)"
              fontSize="38" fontFamily="Space Grotesk, sans-serif" fontWeight="700" opacity="0.9">?</text>

            {/* Orbiting dots */}
            <circle cx="100" cy="14" r="4.5" fill="#d0bcff" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="14" r="3" fill="#a078ff" opacity="0.5">
              <animateTransform attributeName="transform" type="rotate" values="120 100 100;480 100 100" dur="14s" repeatCount="indefinite" />
            </circle>
            <circle cx="186" cy="100" r="3" fill="#8ccdff" opacity="0.45">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;-360 100 100" dur="18s" repeatCount="indefinite" />
            </circle>

            <defs>
              <linearGradient id="nf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#d0bcff" />
                <stop offset="100%" stopColor="#a078ff" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 backdrop-blur-lg">
          {/* 404 heading */}
          <div className="mb-4 relative inline-block">
            <span
              className="text-6xl font-black bg-gradient-to-r from-primary to-tertiary bg-clip-text text-transparent"
              style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.04em' }}
            >
              404
            </span>
          </div>

          <p className="text-lg text-on-surface mb-1.5 font-semibold font-headline">
            Signal lost
          </p>
          <p className="text-sm text-on-surface-variant mb-8 leading-relaxed opacity-70">
            This ghost ID doesn't match any page. It may have been moved, deleted, or never existed in the first place.
          </p>

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="h-12 px-6 rounded-full bg-surface-container-high border border-outline-variant/10 text-on-surface-variant hover:text-on-surface font-label text-[11px] uppercase tracking-widest transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Go Back
            </button>
            <button
              onClick={() => navigate('/dashboard')}
              className="h-12 px-6 rounded-full bg-primary text-on-primary font-label text-[11px] uppercase tracking-widest hover:brightness-110 transition-all"
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
