import React, { useRef } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

const ParallaxCard = ({ children, className = '', onClick }) => {
  const ref = useRef(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 20 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 20 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={`relative rounded-3xl cursor-pointer ${className}`}
    >
      <div
        className="w-full h-full bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl relative overflow-hidden"
        style={{ transform: 'translateZ(30px)' }}
      >
        <div
          className="absolute inset-0 z-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at ${useTransform(
              mouseXSpring,
              [-0.5, 0.5],
              ['0%', '100%']
            )} ${useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%'])}, rgba(255,255,255,0.08) 0%, transparent 60%)`,
          }}
        />
        <div className="relative z-10 w-full h-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
};

export default ParallaxCard;
