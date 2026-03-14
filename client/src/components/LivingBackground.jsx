import React from "react";

const LivingBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-primary">
        {/* Subtle, harsh noise filter for the film-grain feel */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
      {/* Clean neutral background context */}
      <div className="absolute top-1/2 left-0 w-full h-px bg-white/5 opacity-50 transform -translate-y-1/2" />
      <div className="absolute top-0 left-1/4 w-px h-full bg-white/5 opacity-50" />
      <div className="absolute top-0 right-1/4 w-px h-full bg-white/5 opacity-50" />
    </div>
  );
};

export default LivingBackground;

