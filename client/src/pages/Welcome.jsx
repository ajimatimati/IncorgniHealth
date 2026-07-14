import React, { useRef, useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function ProductZeroModel() {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.45;
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.12;
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.12;
  });

  return (
    <group ref={groupRef}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.2, 0.7]} />
        <meshPhysicalMaterial
          color="#0a0a0a"
          roughness={0.05}
          metalness={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.05}
          transmission={0.6}
          thickness={0.8}
          transparent
          opacity={0.85}
        />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.1, 1.8, 0.3]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.2}
          metalness={0.9}
          emissive="#ffffff"
          emissiveIntensity={0.15}
        />
      </mesh>
    </group>
  );
}

function ThreeDViewer({ type = 'product' }) {
  const [activeRegion, setActiveRegion] = useState('sexual');
  const navigate = useNavigate();

  const regions = {
    head: { title: 'Mental & Neurological Support', desc: 'Stress, trauma counseling, and anonymous therapy sessions with certified SARC officers.', action: 'Book Therapy', link: '/auth' },
    chest: { title: 'Cardiovascular & Vitals', desc: 'Blood pressure tracking, chest vitals, and virtual doctor consultations.', action: 'Consult Doctor', link: '/auth' },
    abdomen: { title: 'Metabolic & Digestive Health', desc: 'Diabetes coaching, glucose test kits, and nutrition counseling.', action: 'View Test Kits', link: '/auth' },
    sexual: { title: 'Sexual & Reproductive Health', desc: 'Anonymous STI panels, HIV rapid kits, emergency care dispatches with plain packaging.', action: 'Explore Pharmacy', link: '/auth' },
  };

  if (type === 'product') {
    return (
      <div className="w-full h-full relative min-h-[320px] flex flex-col justify-between p-4">
        <Suspense fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-5 h-5 border border-white/20 border-t-white animate-spin" />
            <p className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Loading 3D Model...</p>
          </div>
        }>
          <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
            <ambientLight intensity={1.8} />
            <pointLight position={[10, 10, 10]} intensity={1.8} />
            <directionalLight position={[-10, -10, -10]} intensity={0.5} />
            <ProductZeroModel />
            <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
          </Canvas>
        </Suspense>
      </div>
    );
  }

  const current = regions[activeRegion];

  return (
    <div className="w-full h-full relative min-h-[320px] flex flex-col justify-between p-3">
      <div className="grid grid-cols-2 gap-2 mb-3">
        {[
          { id: 'head', label: 'Mental Wellness', icon: 'psychology' },
          { id: 'chest', label: 'Cardio & Vitals', icon: 'favorite' },
          { id: 'abdomen', label: 'Metabolic Care', icon: 'medical_services' },
          { id: 'sexual', label: 'Sexual Health', icon: 'shield_with_heart' },
        ].map(r => (
          <button
            key={r.id}
            type="button"
            onClick={() => setActiveRegion(r.id)}
            className={`p-3 border text-left flex items-center gap-2 transition-all duration-200 ${
              activeRegion === r.id
                ? 'bg-white text-black border-white'
                : 'bg-transparent border-white/10 text-white/70 hover:text-white hover:border-white/30'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{r.icon}</span>
            <span className="font-sans text-[11px] font-bold tracking-tight">{r.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 bg-black/80 p-5 border border-white/10 flex flex-col justify-between space-y-3">
        <div>
          <span className="text-micro-caps text-amber-200/80">Clinical Navigator</span>
          <h4 className="font-serif text-lg font-normal text-white mt-1">{current.title}</h4>
          <p className="font-sans text-xs text-white/70 leading-relaxed mt-1">{current.desc}</p>
        </div>
        <button
          onClick={() => navigate(current.link)}
          className="btn btn-primary w-full text-xs"
        >
          <span>{current.action}</span>
          <span className="material-symbols-outlined text-sm">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}

function LedgerModel() {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.2;
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
  });

  const count = 12;
  const points = [];
  for (let i = 0; i < count; i++) {
    const radius = 1.5;
    const theta = Math.acos(2 * (i / count) - 1);
    const phi = Math.sqrt(count * Math.PI) * theta;
    const x = Math.sin(theta) * Math.cos(phi) * radius;
    const y = Math.sin(theta) * Math.sin(phi) * radius;
    const z = Math.cos(theta) * radius;
    points.push([x, y, z]);
  }

  return (
    <group ref={groupRef}>
      {points.map((p, i) => (
        <group key={i} position={p}>
          <mesh>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
      {points.map((p1, i) => {
        const p2 = points[(i + 1) % points.length];
        const p3 = points[(i + 3) % points.length];
        return (
          <group key={i}>
            <line>
              <bufferGeometry attach="geometry">
                <float32BufferAttribute attach="attributes-position" args={[new Float32Array([...p1, ...p2]), 3]} />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" linewidth={0.5} transparent opacity={0.15} />
            </line>
            <line>
              <bufferGeometry attach="geometry">
                <float32BufferAttribute attach="attributes-position" args={[new Float32Array([...p1, ...p3]), 3]} />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" linewidth={0.5} transparent opacity={0.15} />
            </line>
          </group>
        );
      })}
    </group>
  );
}

function LedgerViewer() {
  return (
    <div className="w-full h-full relative select-none">
      <div className="absolute inset-x-6 top-6 flex flex-col gap-1 z-10 pointer-events-none">
        <span className="text-micro-caps">PRIVATE RECORD LEDGER</span>
        <p className="font-sans text-xs text-white/60 text-left">De-identified transaction logs map to temporary, random security hash codes.</p>
      </div>
      <div className="w-full h-full absolute inset-0 opacity-70">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <LedgerModel />
        </Canvas>
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between border-t border-white/10 pt-4 z-10 pointer-events-none">
        <span className="font-mono text-[9px] text-white/40">HASH // 0x4f92...a811</span>
        <span className="font-mono text-[9px] text-white/60 uppercase tracking-widest">Record Synced</span>
      </div>
    </div>
  );
}

function DuressDemo() {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('Enter Secure PIN');
  const [vaultType, setVaultType] = useState('locked');

  useEffect(() => {
    let active = true;
    const sequence = async () => {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      while (active) {
        setPin(''); setStatus('Enter Secure PIN'); setVaultType('locked');
        await sleep(1500);
        if (!active) break;

        for (let digit of '1111') { setPin(prev => prev + digit); await sleep(300); }
        if (!active) break;

        setStatus('Verifying...');
        await sleep(600);
        if (!active) break;

        setVaultType('success'); setStatus('Master Lock Decrypted');
        await sleep(3000);
        if (!active) break;

        setPin(''); setStatus('Enter Secure PIN'); setVaultType('locked');
        await sleep(1500);
        if (!active) break;

        for (let digit of '9999') { setPin(prev => prev + digit); await sleep(300); }
        if (!active) break;

        setStatus('Verifying...');
        await sleep(600);
        if (!active) break;

        setVaultType('duress'); setStatus('Duress View Activated');
        await sleep(3000);
      }
    };
    sequence();
    return () => { active = false; };
  }, []);

  return (
    <div className="w-full h-full p-6 flex flex-col justify-between bg-black/80 border border-white/10">
      <div className="text-center py-1">
        <p className="text-micro-caps">{status}</p>
        <div className="flex justify-center gap-3 my-3">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 border border-white/40 transition-all duration-200 ${
                pin.length > idx ? 'bg-white' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[110px] flex items-center justify-center bg-black border border-white/10 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {vaultType === 'locked' && (
            <motion.div key="locked" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="text-center space-y-2">
              <span className="material-symbols-outlined text-white/40 text-xl">lock</span>
              <p className="font-sans text-xs text-white/50">Encrypted Journal Locked</p>
            </motion.div>
          )}
          {vaultType === 'success' && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full space-y-2 text-left">
              <div className="flex items-center gap-2 text-white border-b border-white/10 pb-1.5 mb-1.5">
                <span className="material-symbols-outlined text-xs">lock_open</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">Private Secure Log</span>
              </div>
              <div className="space-y-1.5 font-sans text-xs text-white/80 leading-relaxed">
                <p className="bg-white/5 p-2 border border-white/5">*"Met SARC advisor. Safe housing confirmed."*</p>
                <p className="bg-white/5 p-2 border border-white/5">*"Prescription filled under Private ID."*</p>
              </div>
            </motion.div>
          )}
          {vaultType === 'duress' && (
            <motion.div key="duress" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="w-full space-y-2 text-left">
              <div className="flex items-center gap-2 text-white/40 border-b border-white/10 pb-1.5 mb-1.5">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span className="font-mono text-[9px] uppercase tracking-wider">Biology Class Notes</span>
              </div>
              <div className="space-y-1 font-sans text-xs text-white/60 leading-relaxed">
                <p className="border-b border-white/5 pb-1">1. Cellular respiration pathways (ATP, Krebs)</p>
                <p className="border-b border-white/5 pb-1">2. DNA replication & transcription enzymes</p>
                <p>3. Mendelian genetics laws and cross charts</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 max-w-[150px] mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((k) => {
          const isPressed = pin.charAt(pin.length - 1) === String(k);
          return (
            <div
              key={k}
              className={`w-9 h-9 flex items-center justify-center text-xs font-mono border transition-all duration-150 select-none ${
                isPressed ? 'bg-white text-black border-white' : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              {k}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfiniteProductScroll() {
  const navigate = useNavigate();

  const products = [
    { name: 'Complete STI Panel', price: '₦12,500', desc: 'Comprehensive testing for HIV, Chlamydia, Gonorrhoea, and Syphilis.', badge: 'Popular', icon: 'science' },
    { name: 'HIV Rapid Test Kit', price: '₦4,500', desc: 'Secure home collection test yielding results within 15 minutes.', badge: 'Rapid', icon: 'biotech' },
    { name: 'Hepatitis B & C Combo', price: '₦7,200', desc: 'Dual-antibody detection screening package.', badge: 'Lab-grade', icon: 'water_drop' },
    { name: 'Emergency Contraception', price: '₦3,500', desc: 'Levonorgestrel 1.5mg express dispatch.', badge: 'Rx Fast', icon: 'medication' },
    { name: 'Zinc + Selenium Bundle', price: '₦4,200', desc: 'Immune health and clinical reproductive support supplements.', badge: 'Wellness', icon: 'spa' }
  ];

  const duplicatedProducts = [...products, ...products];

  return (
    <div className="w-full overflow-hidden py-4 select-none">
      <div className="animate-marquee flex gap-6">
        {duplicatedProducts.map((p, i) => (
          <div
            key={i}
            className="shrink-0 w-[290px] sm:w-[340px] bg-black/90 border border-white/10 p-6 flex flex-col justify-between hover:border-white/30 transition-all duration-300 group"
          >
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 border border-white/20 flex items-center justify-center text-white group-hover:border-primary/50 transition-colors">
                  <span className="material-symbols-outlined text-lg">{p.icon}</span>
                </div>
                <span className="badge">{p.badge}</span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-normal text-white group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="font-sans text-xs text-white/60 leading-relaxed mt-1">{p.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <span className="font-mono text-base font-bold text-white">{p.price}</span>
              <button onClick={() => navigate('/auth')} className="btn btn-secondary py-1.5 px-4 text-[10px]">
                Order Kit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FadeInSection({ children, className = '', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function StatCounter({ value, label }) {
  return (
    <div className="text-center">
      <p className="font-mono text-2xl sm:text-3xl font-bold text-white">{value}</p>
      <p className="font-sans text-[10px] uppercase tracking-widest text-white/50 mt-1">{label}</p>
    </div>
  );
}

export default function Welcome() {
  const navigate = useNavigate();
  const pinnedRef = useRef(null);
  const rightPinRef = useRef(null);

  const [modelType, setModelType] = useState('product');
  const [activeFeature, setActiveFeature] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

  const featureRefs = useRef([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      gsap.to(".welcome-loader", {
        opacity: 0,
        duration: 0.8,
        ease: "power2.out",
        onComplete: () => setIsWelcomeLoading(false)
      });
    }, 1400);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Smooth Cinematic Video Scrubbing with seeking guard
  useEffect(() => {
    if (isWelcomeLoading) return;
    const video = document.getElementById('hero-physician-video');
    if (!video) return;

    video.pause(); // Take over manual control

    let targetTime = 0;
    let currentTime = 0;
    let rafId;

    const setupScrubbing = () => {
      const heroEl = document.getElementById('hero-section');
      if (!heroEl) return;

      ScrollTrigger.create({
        trigger: heroEl,
        start: 'top top',
        end: 'bottom bottom',
        scrub: true,
        onUpdate: (self) => {
          if (video.duration) {
            targetTime = video.duration * self.progress;
          }
        },
      });

      const tick = () => {
        // Smooth lerp - buttery interpolation
        currentTime += (targetTime - currentTime) * 0.08;

        // Critical seeking guard from screenshot: only seek when browser is ready
        if (!video.seeking && Math.abs(video.currentTime - currentTime) > 0.01) {
          video.currentTime = currentTime;
        }

        rafId = requestAnimationFrame(tick);
      };
      tick();
    };

    if (video.readyState >= 1) {
      setupScrubbing();
    } else {
      video.addEventListener('loadedmetadata', setupScrubbing);
    }

    return () => {
      cancelAnimationFrame(rafId);
      video.removeEventListener('loadedmetadata', setupScrubbing);
    };
  }, [isWelcomeLoading]);

  useEffect(() => {
    if (isWelcomeLoading || !pinnedRef.current || !rightPinRef.current) return;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: pinnedRef.current,
        start: 'top top+=80',
        end: 'bottom bottom',
        pin: rightPinRef.current,
        scrub: true,
      });

      featureRefs.current.forEach((el, index) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center+=100',
          end: 'bottom center+=100',
          onEnter: () => setActiveFeature(index),
          onEnterBack: () => setActiveFeature(index),
        });
      });
    });
    return () => ctx.revert();
  }, [isWelcomeLoading]);

  return (
    <div className="min-h-screen text-white font-sans overflow-x-hidden bg-black relative flex flex-col justify-between">

      {/* Loader */}
      {isWelcomeLoading && (
        <div className="welcome-loader fixed inset-0 flex flex-col items-center justify-center bg-black z-[99999] select-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-10 h-10 border border-white/20 border-t-primary animate-spin rounded-full" />
            <div className="flex flex-col items-center gap-2">
              <span className="font-mono text-xs uppercase tracking-[0.3em] text-white">IncogniCare</span>
              <span className="font-sans text-[10px] text-white/40">Loading secure environment...</span>
            </div>
          </motion.div>
        </div>
      )}

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-black/60 border-b border-white/[0.06] px-6 sm:px-12 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 interactive" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-primary text-lg">shield_with_heart</span>
          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">IncogniCare</span>
        </div>

        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="font-sans text-[11px] uppercase tracking-widest text-white/60 hover:text-white transition-all">Services</a>
          <a href="#showcase" className="font-sans text-[11px] uppercase tracking-widest text-white/60 hover:text-white transition-all">Pharmacy</a>
          <a href="#protocol" className="font-sans text-[11px] uppercase tracking-widest text-white/60 hover:text-white transition-all">Privacy</a>
          <a href="#contact" className="font-sans text-[11px] uppercase tracking-widest text-white/60 hover:text-white transition-all">Contact</a>
          <button onClick={() => navigate('/auth')} className="btn btn-primary py-2.5 px-7 text-xs">
            Get Started
          </button>
        </div>

        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-9 h-9 flex items-center justify-center text-white/80 hover:text-white rounded-full border border-white/10"
        >
          <span className="material-symbols-outlined text-lg">{menuOpen ? "close" : "menu"}</span>
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 bg-black/95 backdrop-blur-xl border-b border-white/10 py-8 px-6 flex flex-col gap-5"
            >
              <a href="#features" onClick={() => setMenuOpen(false)} className="font-sans text-sm text-white/80 hover:text-white py-2 border-b border-white/5">Services</a>
              <a href="#showcase" onClick={() => setMenuOpen(false)} className="font-sans text-sm text-white/80 hover:text-white py-2 border-b border-white/5">Pharmacy</a>
              <a href="#protocol" onClick={() => setMenuOpen(false)} className="font-sans text-sm text-white/80 hover:text-white py-2 border-b border-white/5">Privacy</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="font-sans text-sm text-white/80 hover:text-white py-2 border-b border-white/5">Contact</a>
              <button
                onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                className="btn btn-primary w-full text-xs py-3.5 mt-2"
              >
                Get Started
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* HERO SECTION WITH CORRECT SCROLL-SCRUBBING ON PHYSICIAN VIDEO */}
      <section id="hero-section" className="relative min-h-[200vh] bg-[#0a0a0a]">
        {/* Sticky inner container - pins the layout in screen during the scroll */}
        <div className="sticky top-0 h-screen flex flex-col justify-between overflow-hidden">
          
          {/* Cinematic Grain Overlay */}
          <div className="hero-grain" />

          {/* Radial Violet Glow */}
          <div className="absolute inset-0 z-0" style={{ background: 'radial-gradient(ellipse 60% 80% at 20% 50%, rgba(208, 188, 255, 0.06) 0%, transparent 70%)' }} />

          {/* Content Grid */}
          <div className="relative z-10 flex-1 flex items-center max-w-7xl mx-auto w-full px-6 sm:px-12 pt-20 gap-8 lg:gap-16">
            
            {/* LEFT - Editorial Hero Text */}
            <FadeInSection className="flex-1 space-y-8 max-w-xl">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-primary">
                  Confidential Healthcare &bull; Lagos, Nigeria
                </span>
              </div>

              <h1 className="text-fluid-hero text-white !text-[clamp(2.8rem,7vw,5.5rem)] !leading-[0.92]">
                You deserve care<br />
                <span className="font-serif-editorial">without</span><br />
                compromise.
              </h1>

              <p className="font-sans text-base sm:text-lg text-white/60 leading-relaxed">
                Speak with licensed doctors, order home test kits, and receive prescriptions — all under complete anonymity.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => navigate('/auth')}
                  className="btn btn-primary px-8 py-4 text-xs font-bold shadow-lg shadow-primary/20"
                >
                  <span>Start Private Consultation</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
                <a href="#overview" className="btn btn-secondary px-8 py-4 text-xs">
                  How It Works
                </a>
              </div>
            </FadeInSection>

            {/* RIGHT - Scroll-Scrubbed Physician Video */}
            <div className="hidden lg:block relative flex-shrink-0 w-[45%] h-[80vh] overflow-hidden bg-black/20 border border-white/[0.05] rounded-2xl">
              {!videoLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-20">
                  <div className="w-10 h-10 border border-white/20 border-t-primary animate-spin rounded-full" />
                </div>
              )}
              {/* Left-edge gradient fade */}
              <div className="absolute inset-y-0 left-0 w-32 z-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
              {/* Bottom-edge gradient fade */}
              <div className="absolute inset-x-0 bottom-0 h-32 z-10 bg-gradient-to-t from-[#0a0a0a] to-transparent" />
              <video
                id="hero-physician-video"
                src="/physician_standing.mp4"
                muted
                playsInline
                preload="auto"
                controls={false}
                disablePictureInPicture
                className="w-full h-full object-cover object-top"
                onLoadedData={() => setVideoLoaded(true)}
              />
            </div>

          </div>

          {/* Stats Bar at Bottom of Sticky Container */}
          <div className="relative z-10 max-w-7xl mx-auto w-full px-6 sm:px-12 pb-10 border-t border-white/[0.06] pt-6">
            <div className="flex flex-wrap items-center justify-between gap-8">
              <StatCounter value="24/7" label="Always Available" />
              <StatCounter value="5,000+" label="Patients Served" />
              <StatCounter value="100%" label="End-to-End Encrypted" />
              <StatCounter value="48hr" label="Kit Delivery" />
            </div>
          </div>

        </div>
      </section>

      {/* OVERVIEW */}
      <section id="overview" className="relative bg-black z-10">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28 sm:py-36">
          <FadeInSection>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-micro-caps text-primary">Our Mission</span>
                <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                  Reclaiming privacy as a fundamental human right in clinical care.
                </h2>
                <p className="font-sans text-base text-white/70 leading-relaxed">
                  IncogniCare provides a safe, anonymous medical portal designed specifically for individuals navigating sensitive health challenges, trauma recovery, or chronic care management where privacy is paramount.
                </p>
                <p className="font-sans text-sm text-white/50 leading-relaxed">
                  By decoupling patient identities from medical ledgers and enforcing client-side encryption, we ensure that every consultation, prescription, and diagnostic test kit remains completely private.
                </p>
              </div>

              <div className="lg:col-span-5 border border-white/10 p-8 space-y-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="font-serif text-xl font-normal text-white border-b border-white/10 pb-4">
                  Clinical Support Specifications
                </h3>

                <div className="space-y-0 text-xs font-mono">
                  {[
                    ['SERVICE HOURS', '24 Hours / 7 Days'],
                    ['COVERAGE', 'Lagos, Abuja & Nationwide'],
                    ['MEDICAL STAFF', 'Licensed Doctors & SARC Officers'],
                    ['PACKAGING', 'Plain, Unmarked Sealed Boxes'],
                    ['ENCRYPTION', 'AES-256-GCM End-to-End'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-3.5 border-b border-white/5">
                      <span className="text-white/40">{label}</span>
                      <span className="text-white font-bold">{value}</span>
                    </div>
                  ))}
                </div>

                <button onClick={() => navigate('/auth')} className="btn btn-primary w-full text-xs">
                  Get Started Now
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* SERVICES */}
      <section id="features" className="relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28 sm:py-36">
          <FadeInSection>
            <header className="mb-20 space-y-4 max-w-3xl">
              <span className="text-micro-caps text-primary">Clinical Services</span>
              <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                Comprehensive care built <span className="font-serif-editorial">for your peace of mind</span>
              </h2>
              <p className="font-sans text-sm text-white/50">
                From telehealth consultations to anonymous test kits, every service is engineered for maximum privacy.
              </p>
            </header>
          </FadeInSection>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7 space-y-0">
              {[
                { num: '01', title: 'Private Telehealth Consultations', desc: 'Book secure video or text chat sessions with verified physicians and SARC counselors anytime, anywhere without exposing your personal identity.', icon: 'video_call' },
                { num: '02', title: 'Discreet Express Delivery', desc: 'Prescriptions filled by certified partner pharmacies and delivered in plain, unmarked packages with secure PIN-code handover.', icon: 'local_shipping' },
                { num: '03', title: 'Home Diagnostic Test Kits', desc: 'STI & HIV testing kits shipped anonymously to your doorstep. Accurate lab results delivered straight to your encrypted log.', icon: 'science' },
                { num: '04', title: 'Safe Haven Private Log', desc: 'A local client-side encrypted journal with anti-coercion PIN locks to record sensitive health entries with complete peace of mind.', icon: 'lock' },
              ].map((service, idx) => (
                <FadeInSection key={idx} delay={idx * 0.1}>
                  <div className="border-b border-white/[0.06] py-8 space-y-3 group hover:border-white/20 transition-colors">
                    <div className="flex items-start gap-5">
                      <div className="w-12 h-12 shrink-0 border border-white/10 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                        <span className="material-symbols-outlined text-white/60 group-hover:text-primary transition-colors">{service.icon}</span>
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] text-primary/70">{service.num}</span>
                          <h3 className="font-serif text-xl font-normal text-white">{service.title}</h3>
                        </div>
                        <p className="font-sans text-sm text-white/55 leading-relaxed">{service.desc}</p>
                      </div>
                    </div>
                  </div>
                </FadeInSection>
              ))}
            </div>

            <FadeInSection delay={0.2} className="lg:col-span-5 border border-white/10 p-4 bg-black sticky top-24">
              <div className="p-2 border-b border-white/10 flex items-center justify-between mb-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setModelType('product')}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase transition-all ${
                      modelType === 'product' ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Care Pack
                  </button>
                  <button
                    onClick={() => setModelType('anatomy')}
                    className={`px-3 py-1.5 text-[10px] font-mono uppercase transition-all ${
                      modelType === 'anatomy' ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Body Map
                  </button>
                </div>
                <span className="font-mono text-[9px] text-white/40 uppercase">Interactive</span>
              </div>
              <ThreeDViewer type={modelType} />
            </FadeInSection>
          </div>
        </div>
      </section>

      {/* PATIENT STORIES */}
      <section className="relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28">
          <FadeInSection>
            <header className="mb-16 space-y-3">
              <span className="text-micro-caps text-primary">Real Patient Journeys</span>
              <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                Empowerment through <span className="font-serif-editorial">compassionate care</span>
              </h2>
            </header>
          </FadeInSection>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: 'Anonymous Cancer Support', tag: 'ONCOLOGY CARE', desc: 'Connecting patients with expert cancer coaches under complete anonymity for treatment guidance and mental well-being.', icon: 'volunteer_activism' },
              { title: 'Empowering Chronic Wellness', tag: 'DIABETES HUB', desc: 'Providing 1-1 guidance and clinical tracking tools for diabetes management with dedicated coaching.', icon: 'monitor_heart' },
              { title: 'Survivor Safety Protocols', tag: 'CLINICAL DISCRETION', desc: 'Unmarked packaging, duress lock keypads, and de-identified medical ledgers protecting patient privacy at every step.', icon: 'shield' },
            ].map((story, idx) => (
              <FadeInSection key={idx} delay={idx * 0.15}>
                <div className="group border border-white/[0.06] p-8 space-y-5 hover:border-white/20 transition-all bg-gradient-to-b from-white/[0.02] to-transparent h-full">
                  <div className="w-14 h-14 border border-white/10 flex items-center justify-center group-hover:border-primary/30 group-hover:bg-primary/5 transition-all">
                    <span className="material-symbols-outlined text-2xl text-white/50 group-hover:text-primary transition-colors">{story.icon}</span>
                  </div>
                  <div className="space-y-2">
                    <span className="font-mono text-[9px] text-primary/80 uppercase tracking-widest">{story.tag}</span>
                    <h3 className="font-serif text-xl font-normal text-white">{story.title}</h3>
                    <p className="font-sans text-sm text-white/55 leading-relaxed">{story.desc}</p>
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CAROUSEL */}
      <section id="showcase" className="relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28">
          <FadeInSection>
            <header className="mb-12 space-y-3">
              <span className="text-micro-caps text-primary">Pharmacy & Care Packages</span>
              <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                Discreet Clinical Diagnostics & <span className="font-serif-editorial">Care</span>
              </h2>
              <p className="font-sans text-sm text-white/50">
                Unmarked, tamper-evident packaging dispatched nationwide within 48 hours.
              </p>
            </header>
          </FadeInSection>

          <InfiniteProductScroll />
        </div>
      </section>

      {/* SAFETY & PRIVACY (Pinned) */}
      <section id="protocol" ref={pinnedRef} className="pinned-container relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28 flex flex-col lg:flex-row gap-16 items-start">
          <div className="w-full lg:w-1/2 space-y-24 py-6">
            <FadeInSection>
              <div className="space-y-4">
                <span className="text-micro-caps text-primary">Safety & Privacy Mechanics</span>
                <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                  Built to protect <span className="font-serif-editorial">what matters most</span>
                </h2>
                <p className="font-sans text-sm text-white/60 leading-relaxed">
                  Scroll down to inspect our defense-in-depth measures engineered to protect patients from exposure, coercion, and identity tracking.
                </p>
              </div>
            </FadeInSection>

            {[
              { title: 'Local Encrypted Journal (Safe Haven)', desc: 'Your journal logs remain stored directly on your personal device using client-side encryption keys generated from your Master PIN. Plain text records never reach our servers.' },
              { title: 'Anti-Coercion Duress Keypad', desc: 'If forced to open your vault by an outside party, entering your optional Duress PIN unlocks a benign mockup view containing study notes and grocery lists instead of your real entries.' },
              { title: 'Anonymous Record System', desc: 'No personal identification is linked to your medical consultations or wallet payment history. Everything is indexed under a temporary Private ID.' }
            ].map((item, idx) => (
              <div
                key={idx}
                ref={el => featureRefs.current[idx] = el}
                className="space-y-3 border-l-2 border-white/10 pl-6 py-3 hover:border-primary transition-colors"
              >
                <h3 className="font-serif text-xl font-normal text-white">{item.title}</h3>
                <p className="font-sans text-sm text-white/55 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div ref={rightPinRef} className="pinned-right w-full lg:w-1/2 h-[380px] lg:h-[480px] border border-white/10 bg-black flex items-center justify-center relative overflow-hidden self-start">
            <div className="absolute top-4 left-6 z-20">
              <span className="font-mono text-[9px] uppercase tracking-widest text-primary/90">
                {activeFeature === 0 ? 'Protected Data Storage' : activeFeature === 1 ? 'Anti-Coercion Mode' : 'Anonymous Record Index'}
              </span>
            </div>

            <div className="w-full h-full flex items-center justify-center relative z-10">
              <AnimatePresence mode="wait">
                {activeFeature === 0 && (
                  <motion.div key="feature-lottie" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="w-[180px] sm:w-[220px] aspect-square flex items-center justify-center border border-white/20"
                  >
                    <span className="material-symbols-outlined text-white text-5xl">shield</span>
                  </motion.div>
                )}
                {activeFeature === 1 && (
                  <motion.div key="feature-duress" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} transition={{ duration: 0.3 }}
                    className="w-full h-full p-4 flex items-center justify-center"
                  >
                    <DuressDemo />
                  </motion.div>
                )}
                {activeFeature === 2 && (
                  <motion.div key="feature-ledger" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.3 }}
                    className="w-full h-full"
                  >
                    <LedgerViewer />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* NGO / HUMANITARIAN */}
      <section className="relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28">
          <FadeInSection>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-micro-caps text-primary">NGO & Government Alignment</span>
                <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                  Aligning with international standards for human rights protection
                </h2>
                <p className="font-sans text-base leading-relaxed text-white/60">
                  IncogniCare's technical protocols are engineered to support survivors of domestic abuse, gender-based violence (GBV), and marginalized groups. We decouple identities from health data, enforce browser-only storage locks, and support stealth interfaces to protect users at risk of coercion.
                </p>
              </div>

              <div className="lg:col-span-5 border border-white/10 p-8 space-y-6 bg-gradient-to-b from-white/[0.02] to-transparent">
                <h3 className="font-serif text-lg font-normal text-white">Humanitarian Partnerships</h3>
                <p className="font-sans text-sm text-white/55 leading-relaxed">
                  Are you an NGO partner, health officer, or clinical agency representative? Contact our partnership board to explore clinic integrations, custom crisis hubs, and secure voucher funding methods.
                </p>
                <button onClick={() => navigate('/auth')} className="btn btn-secondary w-full text-xs">
                  Request Integration Guide
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="relative bg-black z-10 border-t border-white/[0.06]">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28">
          <FadeInSection>
            <div className="max-w-3xl mx-auto space-y-12">
              <div className="text-center space-y-4">
                <span className="text-micro-caps text-primary">Get In Touch</span>
                <h2 className="text-fluid-title text-white !text-[clamp(1.5rem,4vw,2.5rem)]">
                  Contact <span className="font-serif-editorial">IncogniCare</span>
                </h2>
                <p className="font-sans text-sm text-white/50">
                  Have questions about clinical confidentiality or agency partnerships? Reach out below.
                </p>
              </div>

              <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/50 mb-2 tracking-widest">First Name</label>
                    <input type="text" placeholder="John" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/50 mb-2 tracking-widest">Last Name</label>
                    <input type="text" placeholder="Doe" className="input-field" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/50 mb-2 tracking-widest">Email Address</label>
                    <input type="email" placeholder="john@example.com" className="input-field" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono uppercase text-white/50 mb-2 tracking-widest">Phone Number</label>
                    <input type="tel" placeholder="+234..." className="input-field" />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-white/50 mb-2 tracking-widest">Your Message</label>
                  <textarea rows={4} placeholder="How can our clinical team assist you?" className="input-field py-3 min-h-[120px]" />
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/[0.06]">
                  <div className="flex items-center gap-6 text-xs font-mono text-white/50">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="topic" defaultChecked className="accent-primary" />
                      <span>General Inquiry</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="topic" className="accent-primary" />
                      <span>NGO Partnership</span>
                    </label>
                  </div>

                  <button type="submit" className="btn btn-primary w-full sm:w-auto px-8">
                    Send Message
                    <span className="material-symbols-outlined text-sm">send</span>
                  </button>
                </div>
              </form>
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.06] py-16 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs font-mono">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-base">shield_with_heart</span>
              <span className="font-bold tracking-[0.2em] uppercase text-white">IncogniCare</span>
            </div>
            <p className="font-sans text-xs text-white/45 leading-relaxed">
              Empowering individuals and survivors with end-to-end confidential healthcare and counseling.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Navigation</h4>
            <ul className="space-y-2.5 text-white/50">
              <li><a href="#features" className="hover:text-white transition-colors">Clinical Services</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Discreet Pharmacy</a></li>
              <li><a href="#protocol" className="hover:text-white transition-colors">Safety Protocol</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Legal & Ethics</h4>
            <ul className="space-y-2.5 text-white/50">
              <li><span className="hover:text-white transition-colors cursor-pointer">Patient Dignity Charter</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Zero-Log Encryption</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">De-Identified Data Ledger</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Survivor Safety Guide</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Direct Line</h4>
            <p className="text-white/60">+234 (0) 800 INCOGNI</p>
            <p className="text-white/40">Lagos, Nigeria</p>
            <p className="text-white/30 pt-4">&copy; {new Date().getFullYear()} IncogniCare Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
