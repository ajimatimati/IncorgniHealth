import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const RippleButton = ({ children, onClick, className = '', variant = 'primary', disabled = false, type = 'button' }) => {
  const [ripples, setRipples] = useState([]);

  const addRipple = (event) => {
    if (disabled) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;
    const newRipple = { x, y, size, id: Date.now() };
    
    setRipples((prevRipples) => [...prevRipples, newRipple]);
    
    if (onClick) onClick(event);
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'btn-primary';
      case 'secondary':
        return 'btn-secondary';
      case 'danger':
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  };

  return (
    <motion.button
      type={type}
      className={`relative overflow-hidden ${getVariantClasses()} ${className}`}
      onClick={addRipple}
      whileTap={disabled ? {} : { scale: 0.96 }}
      whileHover={disabled ? {} : { scale: 1.02 }}
      disabled={disabled}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ scale: 4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => {
              setRipples((prev) => prev.filter((r) => r.id !== ripple.id));
            }}
            className="absolute bg-white/30 rounded-full pointer-events-none"
            style={{
              top: ripple.y,
              left: ripple.x,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
};

export default RippleButton;
