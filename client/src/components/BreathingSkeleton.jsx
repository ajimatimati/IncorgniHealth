import React from 'react';

const BreathingSkeleton = ({ className = '', rounded = 'rounded-xl' }) => {
  return (
    <div
      className={`relative overflow-hidden ${rounded} ${className}`}
      style={{ background: 'rgba(255,255,255,0.04)' }}
    >
      {/* Moving shimmer strip */}
      <div
        className="absolute inset-0 z-10"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.12) 50%, rgba(255,255,255,0.07) 60%, transparent 100%)',
          backgroundSize: '250% 100%',
          animation: 'shimmer 1.8s ease-in-out infinite',
        }}
      />
    </div>
  );
};

export default BreathingSkeleton;
