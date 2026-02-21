import React from 'react';
import { motion } from 'framer-motion';

const BreathingSkeleton = ({ className = '', rounded = 'rounded-xl' }) => {
  return (
    <motion.div
      className={`bg-surface-alt relative overflow-hidden ${rounded} ${className}`}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 0.8, 0.5] }}
      transition={{
        duration: 6, // 6 seconds = calming breathing pace
        ease: "easeInOut",
        repeat: Infinity,
      }}
    >
      {/* Subtle traveling shimmer */}
      <div 
        className="absolute inset-0 z-10 w-[200%] h-full shimmer-bg"
        style={{ animation: 'shimmer 8s infinite linear' }}
      />
    </motion.div>
  );
};

export default BreathingSkeleton;
