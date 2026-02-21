import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const HolographicModal = ({ isOpen, onClose, children, className = '' }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-primary/40 backdrop-blur-md"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", bounce: 0.3, duration: 0.6 }}
              className={`relative w-full max-w-md pointer-events-auto ${className}`}
            >
              {/* Holographic Border Glow */}
              <div 
                className="absolute -inset-[2px] rounded-3xl bg-gradient-to-r from-action via-accent-purple to-neon opacity-50 blur-md"
                style={{ mixBlendMode: 'screen', animation: 'gradient-shift 6s ease infinite' }}
              />

              {/* Holographic Inner Content */}
              <div className="relative bg-secondary/80 backdrop-blur-2xl border border-white/20 rounded-3xl p-6 shadow-2xl overflow-hidden">
                 {/* Internal Glare */}
                 <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-gradient-to-br from-white/10 to-transparent rotate-45 pointer-events-none" />
                 
                <div className="relative z-10 text-white">
                  {children}
                </div>
              </div>
            </motion.div>
          </div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};

export default HolographicModal;
