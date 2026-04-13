import React from 'react';
import { motion } from 'framer-motion';

/**
 * RippleButton — Dark Design System
 * Works on both dark and light backgrounds.
 */
const RippleButton = ({
  children,
  onClick,
  className = '',
  variant = 'primary',
  disabled = false,
  type = 'button',
  size = 'md',
}) => {
  const sizes = {
    sm: 'min-h-[38px] px-4 text-[12px]',
    md: 'min-h-[48px] px-6 text-[13px]',
    lg: 'min-h-[56px] px-8 text-[14px]',
  };

  const variants = {
    primary:   'bg-primary text-on-primary hover:brightness-110 active:brightness-90',
    secondary: 'bg-surface-container-low text-on-surface border border-outline-variant/20 hover:bg-surface-container-high active:bg-surface-container-highest',
    violet:    'bg-primary text-on-primary hover:brightness-110',
    teal:      'bg-tertiary text-on-tertiary hover:brightness-110',
    amber:     'bg-secondary text-on-secondary hover:brightness-110',
    danger:    'bg-error text-on-error hover:brightness-110',
    ghost:     'bg-transparent text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-label font-semibold rounded-full uppercase tracking-wide
        transition-all duration-150
        disabled:opacity-40 disabled:pointer-events-none
        select-none
        ${sizes[size] || sizes.md}
        ${variants[variant] || variants.primary}
        ${className}
      `}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full">
        {children}
      </span>
    </motion.button>
  );
};

export default RippleButton;
