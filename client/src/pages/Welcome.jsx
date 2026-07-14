import React, { useRef, useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LivingBackground from '../components/LivingBackground';

gsap.registerPlugin(ScrollTrigger);

// ── 3D Product Zero Model Component ──────────────────────────────────────────
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

// ── Interactive Clinical Navigator Component ─────────────────────────────────
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
      <div className="w-full h-full relative min-h-[280px] flex flex-col justify-between p-4">
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
    <div className="w-full h-full relative min-h-[280px] flex flex-col justify-between p-2">
      <div className="grid grid-cols-2 gap-2 mb-2">
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
            className={`p-3 border text-left flex items-center gap-2 transition-all ${
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

// ── 3D Ledger Model Component ────────────────────────────────────────────────
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
                <float32BufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...p1, ...p2]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" linewidth={0.5} transparent opacity={0.15} />
            </line>
            <line>
              <bufferGeometry attach="geometry">
                <float32BufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...p1, ...p3]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#ffffff" linewidth={0.5} transparent opacity={0.15} />
            </line>
          </group>
        );
      })}
    </group>
  );
}

// ── 3D Ledger Viewer Container ───────────────────────────────────────────────
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

// ── Interactive Duress Demo Component ─────────────────────────────────────────
function DuressDemo() {
  const [pin, setPin] = useState('');
  const [status, setStatus] = useState('Enter Secure PIN');
  const [vaultType, setVaultType] = useState('locked'); // locked, success, duress
  
  useEffect(() => {
    let active = true;
    const sequence = async () => {
      const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      
      while (active) {
        setPin('');
        setStatus('Enter Secure PIN');
        setVaultType('locked');
        await sleep(1500);
        if (!active) break;

        for (let digit of '1111') {
          setPin(prev => prev + digit);
          await sleep(300);
        }
        if (!active) break;
        
        setStatus('Verifying...');
        await sleep(600);
        if (!active) break;
        
        setVaultType('success');
        setStatus('Master Lock Decrypted');
        await sleep(3000);
        if (!active) break;

        setPin('');
        setStatus('Enter Secure PIN');
        setVaultType('locked');
        await sleep(1500);
        if (!active) break;

        for (let digit of '9999') {
          setPin(prev => prev + digit);
          await sleep(300);
        }
        if (!active) break;
        
        setStatus('Verifying...');
        await sleep(600);
        if (!active) break;
        
        setVaultType('duress');
        setStatus('Duress View Activated');
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
              className={`w-2.5 h-2.5 border border-white/40 flex items-center justify-center transition-all duration-200 ${
                pin.length > idx ? 'bg-white' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[110px] flex items-center justify-center bg-black border border-white/10 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {vaultType === 'locked' && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-2"
            >
              <span className="material-symbols-outlined text-white/40 text-xl">lock</span>
              <p className="font-sans text-xs text-white/50">Encrypted Journal Locked</p>
            </motion.div>
          )}

          {vaultType === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-2 text-left"
            >
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
            <motion.div
              key="duress"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full space-y-2 text-left"
            >
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
                isPressed
                  ? 'bg-white text-black border-white'
                  : 'bg-white/5 border-white/10 text-white/70'
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

// ── Infinite Product Carousel Component ──────────────────────────────────────
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
                <div className="w-9 h-9 border border-white/20 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-lg">{p.icon}</span>
                </div>
                <span className="badge">
                  {p.badge}
                </span>
              </div>
              <div>
                <h3 className="font-serif text-lg font-normal text-white group-hover:text-amber-200 transition-colors">{p.name}</h3>
                <p className="font-sans text-xs text-white/60 leading-relaxed mt-1">{p.desc}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
              <span className="font-mono text-base font-bold text-white">{p.price}</span>
              <button
                onClick={() => navigate('/auth')}
                className="btn btn-secondary py-1.5 px-4 text-[10px]"
              >
                Order Kit
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// ── Main Page Component ──────────────────────────────────────────────────────
export default function Welcome() {
  const navigate = useNavigate();
  const pinnedRef = useRef(null);
  const rightPinRef = useRef(null);
  
  const [modelType, setModelType] = useState('product'); // 'product' or 'anatomy'
  const [activeFeature, setActiveFeature] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  
  const featureRefs = useRef([]);

  // Welcome Loader sequence
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

  // Initialize Smooth Ambient Loop with Scroll Acceleration
  useEffect(() => {
    const video = document.getElementById("welcome-scroll-video");
    if (!video) return;

    video.play().catch(() => {});

    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: (self) => {
        video.playbackRate = 1.0 + self.getVelocity() * 0.0005;
      }
    });
  }, []);

  // Pinning & individual features transitions
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
      
      {/* ── Welcome Animated Loader ── */}
      {isWelcomeLoading && (
        <div className="welcome-loader fixed inset-0 flex flex-col items-center justify-center bg-black z-[99999] select-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-8 h-8 border border-white/20 border-t-white animate-spin" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-white">IncogniCare</span>
          </motion.div>
        </div>
      )}

      {/* ── Header / Minimal Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 border-b border-white/10 px-6 sm:px-12 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3 interactive" onClick={() => navigate('/')}>
          <span className="material-symbols-outlined text-white text-lg">shield_with_heart</span>
          <span className="text-xs font-mono font-bold tracking-[0.2em] uppercase text-white">IncogniCare</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-10">
          <a href="#features" className="font-sans text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all">Services</a>
          <a href="#showcase" className="font-sans text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all">Pharmacy</a>
          <a href="#protocol" className="font-sans text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all">Privacy</a>
          <a href="#contact" className="font-sans text-xs uppercase tracking-widest text-white/70 hover:text-white transition-all">Contact</a>
          <button
            onClick={() => navigate('/auth')}
            className="btn btn-secondary py-2 px-6 text-xs"
          >
            Sign In
          </button>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-white/80 hover:text-white"
        >
          <span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span>
        </button>

        {/* Mobile Fullscreen Glass Overlay */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-full left-0 right-0 bg-black border-b border-white/10 py-8 px-6 flex flex-col gap-6"
            >
              <a href="#features" onClick={() => setMenuOpen(false)} className="font-sans text-xs uppercase tracking-widest text-white/80 hover:text-white py-2">Services</a>
              <a href="#showcase" onClick={() => setMenuOpen(false)} className="font-sans text-xs uppercase tracking-widest text-white/80 hover:text-white py-2">Pharmacy</a>
              <a href="#protocol" onClick={() => setMenuOpen(false)} className="font-sans text-xs uppercase tracking-widest text-white/80 hover:text-white py-2">Privacy</a>
              <a href="#contact" onClick={() => setMenuOpen(false)} className="font-sans text-xs uppercase tracking-widest text-white/80 hover:text-white py-2">Contact</a>
              <button
                onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                className="btn btn-primary w-full text-xs py-3"
              >
                Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── SECTION 1: HERO (Raw video background, giant serif title) ── */}
      <section className="relative min-h-screen flex flex-col justify-between pt-32 pb-16 px-6 sm:px-12 bg-black overflow-hidden">
        
        {/* Living Background Video (Raw, No Overlay Vignette) */}
        <LivingBackground mode="hero" />

        <div className="w-full max-w-7xl mx-auto my-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
          
          {/* Main Editorial Hero Title */}
          <div className="lg:col-span-8 space-y-6">
            <span className="text-micro-caps text-amber-200/90">Confidential Healthcare & Counseling</span>
            
            <h1 className="text-fluid-hero text-white">
              Healthcare <br />
              <span className="font-serif-editorial">designed around</span> <br />
              your dignity.
            </h1>
          </div>

          {/* Structured Hero Info & CTA Column */}
          <div className="lg:col-span-4 space-y-6 text-left border-l border-white/10 pl-6 lg:pl-8 py-2">
            <p className="font-sans text-sm text-white/80 leading-relaxed">
              Consult with top licensed medical professionals, order home diagnostic test kits, and receive prescriptions in plain packaging. 100% confidential.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => navigate('/auth')}
                className="btn btn-primary w-full sm:w-auto text-xs font-bold"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <a
                href="#overview"
                className="btn btn-secondary w-full sm:w-auto text-xs"
              >
                Learn More
              </a>
            </div>

            <div className="pt-4 flex items-center gap-6 text-[11px] font-mono text-white/50 uppercase tracking-wider">
              <span>24/7 Available</span>
              <span>•</span>
              <span>Lagos, Nigeria</span>
            </div>
          </div>
        </div>

        {/* Footer info line on Hero */}
        <div className="w-full max-w-7xl mx-auto pt-12 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-white/40 uppercase tracking-widest relative z-10">
          <span>+234 (0) 800 INCOGNI</span>
          <span>End-to-End Client Confidentiality</span>
          <span>Scroll Down ↓</span>
        </div>
      </section>

      {/* ── SECTION 2: ABOUT / OVERVIEW ── */}
      <section id="overview" className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-24 sm:py-32 border-t border-white/10 bg-black relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          <div className="lg:col-span-7 space-y-6">
            <span className="text-micro-caps text-amber-200/90">Our Mission</span>
            <h2 className="text-fluid-title text-white">
              Reclaiming privacy as a fundamental human right in clinical care.
            </h2>
            <p className="font-sans text-sm sm:text-base text-white/70 leading-relaxed">
              IncogniCare provides a safe, anonymous medical portal designed specifically for individuals navigating sensitive health challenges, trauma recovery, or chronic care management where privacy is paramount.
            </p>
            <p className="font-sans text-sm text-white/60 leading-relaxed">
              By decoupling patient identities from medical ledgers and enforcing client-side encryption, we ensure that every consultation, prescription, and diagnostic test kit remains completely private.
            </p>
          </div>

          <div className="lg:col-span-5 border border-white/10 p-8 space-y-6 bg-black">
            <h3 className="font-serif text-xl font-normal text-white border-b border-white/10 pb-4">
              Clinical Support Specifications
            </h3>
            
            <div className="space-y-4 text-xs font-mono">
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">SERVICE HOURS</span>
                <span className="text-white font-bold">24 Hours / 7 Days</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">COVERAGE</span>
                <span className="text-white font-bold">Lagos, Abuja & Nationwide</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">MEDICAL STAFF</span>
                <span className="text-white font-bold">Licensed Doctors & SARC Officers</span>
              </div>
              <div className="flex justify-between py-2 border-b border-white/5">
                <span className="text-white/40">PACKAGING</span>
                <span className="text-white font-bold">Plain, Unmarked Sealed Boxes</span>
              </div>
            </div>

            <button
              onClick={() => navigate('/auth')}
              className="btn btn-secondary w-full text-xs"
            >
              Get Started Now →
            </button>
          </div>

        </div>
      </section>

      {/* ── SECTION 3: SERVICES (Text List Left + Interactive Navigator Right) ── */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-24 sm:py-32 border-t border-white/10 bg-black relative z-10">
        <header className="mb-16 space-y-3">
          <span className="text-micro-caps text-amber-200/90">Clinical Services</span>
          <h2 className="text-fluid-title text-white">
            Comprehensive care built <span className="font-serif-editorial">for your peace of mind</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Services Text List */}
          <div className="lg:col-span-7 space-y-8">
            {[
              {
                num: '01',
                title: 'Private Telehealth Consultations',
                desc: 'Book secure video or text chat sessions with verified physicians and SARC counselors anytime, anywhere without exposing your personal identity.',
              },
              {
                num: '02',
                title: 'Discreet Express Delivery',
                desc: 'Prescriptions filled by certified partner pharmacies and delivered in plain, unmarked packages with secure PIN-code handover.',
              },
              {
                num: '03',
                title: 'Home Diagnostic Test Kits',
                desc: 'STI & HIV testing kits shipped anonymously to your doorstep. Accurate lab results delivered straight to your encrypted log.',
              },
              {
                num: '04',
                title: 'Safe Haven Private Log',
                desc: 'A local client-side encrypted journal with anti-coercion PIN locks to record sensitive health entries with complete peace of mind.',
              },
            ].map((service, idx) => (
              <div key={idx} className="border-b border-white/10 pb-8 space-y-3 hover:border-white/30 transition-colors">
                <div className="flex items-center gap-4">
                  <span className="font-mono text-xs text-amber-200/80">{service.num}</span>
                  <h3 className="font-serif text-2xl font-normal text-white">{service.title}</h3>
                </div>
                <p className="font-sans text-sm text-white/60 leading-relaxed pl-8">
                  {service.desc}
                </p>
              </div>
            ))}
          </div>

          {/* Interactive 3D Model Column */}
          <div className="lg:col-span-5 border border-white/10 p-4 bg-black">
            <div className="p-2 border-b border-white/10 flex items-center justify-between mb-4">
              <div className="flex gap-2">
                <button
                  onClick={() => setModelType('product')}
                  className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${
                    modelType === 'product' ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Care Pack
                </button>
                <button
                  onClick={() => setModelType('anatomy')}
                  className={`px-3 py-1 text-[10px] font-mono uppercase transition-all ${
                    modelType === 'anatomy' ? 'bg-white text-black font-bold' : 'text-white/40 hover:text-white'
                  }`}
                >
                  Body Map
                </button>
              </div>
              <span className="font-mono text-[9px] text-white/40 uppercase">3D Preview</span>
            </div>

            <ThreeDViewer type={modelType} />
          </div>

        </div>
      </section>

      {/* ── SECTION 4: PATIENT STORIES GALLERY (Asymmetric Image Grid) ── */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-24 border-t border-white/10 bg-black relative z-10">
        <header className="mb-16 space-y-3">
          <span className="text-micro-caps text-amber-200/90">Real Patient Journeys</span>
          <h2 className="text-fluid-title text-white">
            Empowerment through <span className="font-serif-editorial">compassionate care</span>
          </h2>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              src: '/story_1.png',
              title: 'Anonymous Cancer Support',
              tag: 'ONCOLOGY CARE',
              desc: 'Connecting patients with expert cancer coaches under complete anonymity for treatment guidance and mental well-being.'
            },
            {
              src: '/story_2.png',
              title: 'Empowering Chronic Wellness',
              tag: 'DIABETES HUB',
              desc: 'Providing 1-1 guidance and clinical tracking tools for diabetes management with dedicated coaching.'
            },
            {
              src: '/story_3.png',
              title: 'Survivor Safety Protocols',
              tag: 'CLINICAL DISCRETION',
              desc: 'Unmarked packaging, duress lock keypads, and de-identified medical ledgers protecting patient privacy at every step.'
            }
          ].map((story, idx) => (
            <div key={idx} className="space-y-4">
              <div className="aspect-[4/3] w-full bg-black border border-white/10 overflow-hidden">
                <img 
                  src={story.src} 
                  alt={story.title} 
                  className="w-full h-full object-cover opacity-85 hover:opacity-100 transition-opacity duration-300" 
                />
              </div>
              <div className="space-y-1.5">
                <span className="font-mono text-[9px] text-amber-200/80 uppercase tracking-widest">{story.tag}</span>
                <h3 className="font-serif text-xl font-normal text-white">{story.title}</h3>
                <p className="font-sans text-xs text-white/60 leading-relaxed">{story.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: PRODUCT SHOWCASE / CAROUSEL ── */}
      <section id="showcase" className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-24 border-t border-white/10 bg-black relative z-10">
        <header className="mb-12 space-y-3">
          <span className="text-micro-caps text-amber-200/90">Pharmacy & Care Packages</span>
          <h2 className="text-fluid-title text-white">
            Discreet Clinical Diagnostics & <span className="font-serif-editorial">Care</span>
          </h2>
          <p className="font-sans text-xs text-white/60">
            Unmarked, tamper-evident packaging dispatched nationwide.
          </p>
        </header>

        <InfiniteProductScroll />
      </section>

      {/* ── SECTION 6: SAFETY & PRIVACY (Pinned GSAP Section) ── */}
      <section id="protocol" ref={pinnedRef} className="pinned-container max-w-7xl mx-auto w-full px-6 sm:px-12 py-28 border-t border-white/10 relative z-10 flex flex-col lg:flex-row gap-16 items-start bg-black">
        
        {/* Left scrolling copy column */}
        <div className="w-full lg:w-1/2 space-y-24 py-6">
          <div className="space-y-4">
            <span className="text-micro-caps text-amber-200/90">Safety & Privacy Mechanics</span>
            <h2 className="text-fluid-title text-white">
              Built to protect <span className="font-serif-editorial">what matters most</span>
            </h2>
            <p className="font-sans text-sm text-white/70 leading-relaxed">
              Scroll down to inspect our defense-in-depth measures engineered to protect patients from exposure, coercion, and identity tracking.
            </p>
          </div>

          {[
            {
              title: 'Local Encrypted Journal (Safe Haven)',
              desc: 'Your journal logs remain stored directly on your personal device using client-side encryption keys generated from your Master PIN. Plain text records never reach our servers.'
            },
            {
              title: 'Anti-Coercion Duress Keypad',
              desc: 'If forced to open your vault by an outside party, entering your optional Duress PIN unlocks a benign mockup view containing study notes and grocery lists instead of your real entries.'
            },
            {
              title: 'Anonymous Record System',
              desc: 'No personal identification is linked to your medical consultations or wallet payment history. Everything is indexed under a temporary Private ID.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              ref={el => featureRefs.current[idx] = el}
              className="space-y-3 border-l border-white/20 pl-6 py-2 hover:border-white transition-colors"
            >
              <h3 className="font-serif text-xl font-normal text-white">{item.title}</h3>
              <p className="font-sans text-sm text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Right pinned preview column */}
        <div ref={rightPinRef} className="pinned-right w-full lg:w-1/2 h-[380px] lg:h-[480px] border border-white/10 bg-black flex items-center justify-center relative overflow-hidden self-start">
          <div className="absolute top-4 left-6 z-20">
            <span className="font-mono text-[9px] uppercase tracking-widest text-amber-200/90">
              {activeFeature === 0 ? 'Protected Data Storage' : activeFeature === 1 ? 'Anti-Coercion Mode' : 'Anonymous Record Index'}
            </span>
          </div>
          
          <div className="w-full h-full flex items-center justify-center relative z-10">
            <AnimatePresence mode="wait">
              {activeFeature === 0 && (
                <motion.div
                  key="feature-lottie"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-[180px] sm:w-[220px] aspect-square flex items-center justify-center border border-white/20"
                >
                  <span className="material-symbols-outlined text-white text-5xl">shield</span>
                </motion.div>
              )}

              {activeFeature === 1 && (
                <motion.div
                  key="feature-duress"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full p-4 flex items-center justify-center"
                >
                  <DuressDemo />
                </motion.div>
              )}

              {activeFeature === 2 && (
                <motion.div
                  key="feature-ledger"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="w-full h-full"
                >
                  <LedgerViewer />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: HUMANITARIAN / NGO ALIGNMENT ── */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-24 border-t border-white/10 bg-black relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <span className="text-micro-caps text-amber-200/90">NGO & Government Alignment</span>
            <h2 className="text-fluid-title text-white">
              Aligning with international standards for human rights protection
            </h2>
            <p className="font-sans text-sm leading-relaxed text-white/70">
              IncogniCare's technical protocols are engineered to support survivors of domestic abuse, gender-based violence (GBV), and marginalized groups. We decouple identities from health data, enforce browser-only storage locks, and support stealth interfaces to protect users at risk of coercion.
            </p>
          </div>

          <div className="lg:col-span-5 border border-white/10 p-8 space-y-6 bg-black">
            <h3 className="font-serif text-lg font-normal text-white">Humanitarian Support</h3>
            <p className="font-sans text-xs text-white/60 leading-relaxed">
              Are you an NGO partner, health officer, or clinical agency representative? Contact our partnership board to explore clinic integrations, custom crisis hubs, and secure voucher funding methods.
            </p>
            <button
              onClick={() => navigate('/auth')}
              className="btn btn-secondary w-full text-xs"
            >
              Request Integration Guide
            </button>
          </div>
        </div>
      </section>

      {/* ── SECTION 8: CONTACT FORM (Matching Reference) ── */}
      <section id="contact" className="max-w-7xl mx-auto w-full px-6 sm:px-12 py-28 border-t border-white/10 bg-black relative z-10">
        <div className="max-w-3xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-micro-caps text-amber-200/90">Get In Touch</span>
            <h2 className="text-fluid-title text-white">
              Contact <span className="font-serif-editorial">IncogniCare</span>
            </h2>
            <p className="font-sans text-xs text-white/60">
              Have questions about clinical confidentiality or agency partnerships? Reach out below.
            </p>
          </div>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-2">First Name</label>
                <input type="text" placeholder="John" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-2">Last Name</label>
                <input type="text" placeholder="Doe" className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-2">Email Address</label>
                <input type="email" placeholder="john@example.com" className="input-field" />
              </div>
              <div>
                <label className="block text-xs font-mono uppercase text-white/50 mb-2">Phone Number</label>
                <input type="tel" placeholder="+234..." className="input-field" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-white/50 mb-2">Your Message</label>
              <textarea rows={4} placeholder="How can our clinical team assist you?" className="input-field py-3 min-h-[120px]" />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4 border-t border-white/10">
              <div className="flex items-center gap-6 text-xs font-mono text-white/50">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="topic" defaultChecked className="accent-white" />
                  <span>General Inquiry</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="topic" className="accent-white" />
                  <span>NGO Partnership</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary w-full sm:w-auto px-8">
                Send Message
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── SECTION 9: FOOTER (4-Column Editorial) ── */}
      <footer className="border-t border-white/10 py-16 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-12 grid grid-cols-1 md:grid-cols-4 gap-12 text-xs font-mono">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-white text-base">shield_with_heart</span>
              <span className="font-bold tracking-[0.2em] uppercase text-white">IncogniCare</span>
            </div>
            <p className="font-sans text-xs text-white/50 leading-relaxed">
              Empowering individuals and survivors with end-to-end confidential healthcare and counseling.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Navigation</h4>
            <ul className="space-y-2 text-white/60">
              <li><a href="#features" className="hover:text-white transition-colors">Clinical Services</a></li>
              <li><a href="#showcase" className="hover:text-white transition-colors">Discreet Pharmacy</a></li>
              <li><a href="#protocol" className="hover:text-white transition-colors">Safety Protocol</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Us</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Legal & Ethics</h4>
            <ul className="space-y-2 text-white/60">
              <li><span className="hover:text-white transition-colors">Patient Dignity Charter</span></li>
              <li><span className="hover:text-white transition-colors">Zero-Log Encryption</span></li>
              <li><span className="hover:text-white transition-colors">De-Identified Data Ledger</span></li>
              <li><span className="hover:text-white transition-colors">Survivor Safety Guide</span></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-micro-caps text-white">Direct Line</h4>
            <p className="text-white/60">+234 (0) 800 INCOGNI</p>
            <p className="text-white/40">Lagos, Nigeria</p>
            <p className="text-white/30 pt-4">© {new Date().getFullYear()} IncogniCare Inc.</p>
          </div>

        </div>
      </footer>
    </div>
  );
}
