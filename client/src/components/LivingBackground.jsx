import React, { useEffect, useRef } from "react";

const LivingBackground = ({ mode = "ambient" }) => {
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    // ── Particle System Setup ────────────────────────────────────────────────
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let particles = [];

    // Adjust particle density based on screen width (responsiveness)
    const getParticleCount = () => {
      const width = window.innerWidth;
      if (width < 768) return 30; // Mobile
      if (width < 1024) return 60; // Tablet
      return 100; // Desktop
    };

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 1.5 + 0.5;
        this.speedX = Math.random() * 0.15 - 0.075;
        this.speedY = Math.random() * 0.15 - 0.075;
        this.opacity = Math.random() * 0.5 + 0.15;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        // Bounce or wrap edges
        if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
        if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.fill();
      }
    }

    const initParticles = () => {
      particles = [];
      const count = getParticleCount();
      for (let i = 0; i < count; i++) {
        particles.push(new Particle());
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw and update particles
      particles.forEach((p) => {
        p.update();
        p.draw();
      });

      // Draw faint connection lines between close particles (desktop only)
      if (window.innerWidth >= 768) {
        for (let i = 0; i < particles.length; i++) {
          for (let j = i + 1; j < particles.length; j++) {
            const dx = particles[i].x - particles[j].x;
            const dy = particles[i].y - particles[j].y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 100) {
              ctx.beginPath();
              ctx.moveTo(particles[i].x, particles[i].y);
              ctx.lineTo(particles[j].x, particles[j].y);
              ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * (1 - dist / 100)})`;
              ctx.lineWidth = 0.5;
              ctx.stroke();
            }
          }
        }
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();
    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

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
      default:         return '/bg_ethereal.mp4';
    }
  };

  return (
    <>
      {/* ── Video Background (Scoped to Hero Section) ─────────────────────── */}
      <div id="scroll-video-container" className={mode === 'hero' || mode === 'scroll' ? 'hero-scoped' : ''}>
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
          className="opacity-[0.45] object-cover w-full h-full pointer-events-none select-none"
          style={{ display: 'block', pointerEvents: 'none' }}
        />
        <div className="overlay" />
      </div>

      {/* ── Particle Overlay ───────────────────────────────────────────────── */}
      <canvas ref={canvasRef} id="particles-canvas" />
    </>
  );
};

export default LivingBackground;
