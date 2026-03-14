import React from 'react';
import { motion } from 'framer-motion';

/**
 * RippleButton — Clean Design System
 * Pill-shaped (border-radius: 9999px). No glow. Subtle layered shadow.
 * Variants: primary (black) | secondary (white/outline) | violet | danger | ghost
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
    sm: 'min-h-[38px] px-4 text-[13px]',
    md: 'min-h-[52px] px-6 text-[14px]',
    lg: 'min-h-[58px] px-8 text-[15px]',
  };

  const variants = {
    primary:   'bg-[#18181B] text-white shadow-[0_1px_2px_rgba(0,0,0,0.12)] hover:bg-[#27272A] hover:shadow-[0_2px_8px_rgba(0,0,0,0.18)] active:bg-[#3F3F46]',
    secondary: 'bg-white text-[#18181B] border border-[#E8E6E3] shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-[#F8F7F6] hover:border-[#D1CFD0] active:bg-[#F4F4F5]',
    violet:    'bg-[#6D28D9] text-white shadow-[0_1px_2px_rgba(109,40,217,0.2)] hover:bg-[#5B21B6] hover:shadow-[0_4px_12px_rgba(109,40,217,0.25)] active:bg-[#4C1D95]',
    teal:      'bg-[#059669] text-white shadow-[0_1px_2px_rgba(5,150,105,0.2)] hover:bg-[#047857] active:bg-[#065F46]',
    amber:     'bg-[#D97706] text-white shadow-[0_1px_2px_rgba(217,119,6,0.2)] hover:bg-[#B45309] active:bg-[#92400E]',
    danger:    'bg-[#DC2626] text-white shadow-[0_1px_2px_rgba(220,38,38,0.2)] hover:bg-[#B91C1C] active:bg-[#991B1B]',
    ghost:     'bg-transparent text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B] active:bg-[#E4E4E7]',
  };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={`
        relative inline-flex items-center justify-center gap-2
        font-semibold rounded-full
        transition-colors duration-150
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
