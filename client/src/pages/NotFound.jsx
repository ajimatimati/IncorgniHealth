import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { ChevronLeft } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden"
    >      
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-action/10 rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '3s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-pink-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="text-center max-w-md animate-fade-in relative z-10">

        {/* Animated SVG illustration */}
        <div className="relative w-44 h-44 mx-auto mb-8">
          <div className="scanlines rounded-full" />
          <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
            {/* Outer rings */}
            <circle cx="100" cy="100" r="88" fill="none" stroke="rgba(0,242,254,0.06)" strokeWidth="1" strokeDasharray="6 5" />
            <circle cx="100" cy="100" r="72" fill="none" stroke="rgba(139,92,246,0.08)" strokeWidth="1" />
            <circle cx="100" cy="100" r="56" fill="none" stroke="rgba(0,242,254,0.04)" strokeWidth="1" strokeDasharray="3 8" />

            {/* Central glassy square */}
            <rect x="68" y="62" width="64" height="64" rx="18"
              fill="rgba(0,242,254,0.05)" stroke="rgba(0,242,254,0.2)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate"
                values="0 100 94;6 100 94;0 100 94;-6 100 94;0 100 94" dur="9s" repeatCount="indefinite" />
            </rect>

            {/* Question mark */}
            <text x="100" y="106" textAnchor="middle" fill="url(#nf-grad)"
              fontSize="38" fontFamily="Space Grotesk, sans-serif" fontWeight="700" opacity="0.9">?</text>

            {/* Orbiting dots */}
            <circle cx="100" cy="14" r="4.5" fill="#00f2fe" opacity="0.7">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="10s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="14" r="3" fill="#8b5cf6" opacity="0.5">
              <animateTransform attributeName="transform" type="rotate" values="120 100 100;480 100 100" dur="14s" repeatCount="indefinite" />
            </circle>
            <circle cx="186" cy="100" r="3" fill="#ec4899" opacity="0.45">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;-360 100 100" dur="18s" repeatCount="indefinite" />
            </circle>

            <defs>
              <linearGradient id="nf-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="glass-card p-8 backdrop-blur-lg">
          {/* Glitch "404" heading */}
          <div className="mb-4 relative inline-block">
            <span
              className="glitch-text text-6xl font-black text-gradient"
              data-text="404"
              style={{ fontFamily: 'Space Grotesk, sans-serif', letterSpacing: '-0.04em' }}
            >
              404
            </span>
          </div>

          <p className="text-lg text-white mb-1.5 font-semibold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
            Signal lost
          </p>
          <p className="text-sm text-text-muted mb-8 leading-relaxed">
            This ghost ID doesn't match any page. It may have been moved, deleted, or never existed in the first place.
          </p>

          <div className="flex gap-3 justify-center">
            <RippleButton
              onClick={() => navigate(-1)}
              variant="secondary"
              className="text-sm px-5 items-center justify-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              Go Back
            </RippleButton>
            <RippleButton
              onClick={() => navigate('/dashboard')}
              className="text-sm px-5 justify-center"
            >
              Dashboard
            </RippleButton>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NotFound;
