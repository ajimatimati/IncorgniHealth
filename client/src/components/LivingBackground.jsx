import React, { useEffect, useRef } from "react";

const LivingBackground = ({ mode = "ambient" }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    // ── Video Autoplay handling ──────────────────────────────────────────────
    if (videoRef.current) {
      videoRef.current.play().catch(() => {
        console.log("Autoplay blocked, waiting for user interaction");
      });
    }
  }, [mode]);

  const getVideoSource = () => {
    switch (mode) {
      case 'ethereal': return '/bg_ethereal.mp4';
      case 'metallic': return '/bg_light_metallic.mp4';
      case 'scroll':   return '/welcome_hero.mp4';
      case 'hero':     return '/welcome_hero.mp4';
      default:         return '/bg_ethereal.mp4';
    }
  };

  return (
    <div id="scroll-video-container" className="hero-scoped">
      <video
        ref={videoRef}
        id={mode === 'scroll' || mode === 'hero' ? 'welcome-scroll-video' : 'ambient-video'}
        src={getVideoSource()}
        muted
        loop
        autoPlay
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        controls={false}
        disablePictureInPicture
        preload="auto"
        className="opacity-[0.55] object-cover w-full h-full pointer-events-none select-none"
        style={{ display: 'block', pointerEvents: 'none' }}
      />
    </div>
  );
};

export default LivingBackground;
