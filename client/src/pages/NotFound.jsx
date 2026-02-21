import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen bg-transparent flex items-center justify-center p-6 relative overflow-hidden"
    >
      {/* Ambient glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-action/10 rounded-full blur-[120px] pointer-events-none animate-breathe" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none animate-breathe" style={{ animationDelay: '3s' }} />

      <div className="text-center max-w-md animate-fade-in relative z-10">
        {/* Animated SVG illustration */}
        <div className="relative w-40 h-40 mx-auto mb-8">
          <svg viewBox="0 0 200 200" className="w-full h-full animate-float">
            {/* Outer ring */}
            <circle cx="100" cy="100" r="80" fill="none" stroke="rgba(0,242,254,0.1)" strokeWidth="1" />
            <circle cx="100" cy="100" r="60" fill="none" stroke="rgba(0,242,254,0.06)" strokeWidth="1" strokeDasharray="8 6" />
            
            {/* Geometric shapes */}
            <rect x="70" y="65" width="60" height="60" rx="16" fill="rgba(0,242,254,0.08)" stroke="rgba(0,242,254,0.2)" strokeWidth="1.5">
              <animateTransform attributeName="transform" type="rotate" values="0 100 95;5 100 95;0 100 95;-5 100 95;0 100 95" dur="8s" repeatCount="indefinite" />
            </rect>
            
            {/* Question mark path */}
            <text x="100" y="105" textAnchor="middle" fill="url(#notfound-grad)" fontSize="36" fontFamily="Inter, sans-serif" fontWeight="700" opacity="0.8">?</text>
            
            {/* Orbiting dot */}
            <circle cx="100" cy="20" r="4" fill="#00f2fe" opacity="0.6">
              <animateTransform attributeName="transform" type="rotate" values="0 100 100;360 100 100" dur="12s" repeatCount="indefinite" />
            </circle>
            <circle cx="100" cy="20" r="4" fill="#8b5cf6" opacity="0.4">
              <animateTransform attributeName="transform" type="rotate" values="180 100 100;540 100 100" dur="16s" repeatCount="indefinite" />
            </circle>
            
            <defs>
              <linearGradient id="notfound-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00f2fe" />
                <stop offset="100%" stopColor="#4facfe" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        <div className="glass-card p-8 backdrop-blur-lg">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-action to-action-end mb-3">404</h1>
          <p className="text-lg text-text-secondary mb-1 font-medium">Page not found</p>
          <p className="text-sm text-text-muted mb-8">
            This ghost ID doesn't match any page. It might have been moved or never existed.
          </p>
          <div className="flex gap-3 justify-center">
            <RippleButton
              onClick={() => navigate(-1)}
              variant="secondary"
              className="text-sm px-5 items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
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
