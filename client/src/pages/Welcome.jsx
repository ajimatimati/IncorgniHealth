import React, { useRef, useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LivingBackground from '../components/LivingBackground';

// Register GSAP ScrollTrigger
gsap.registerPlugin(ScrollTrigger);

// ── 3D Anatomy Model Component ───────────────────────────────────────────────
function AnatomyModel() {
  const { scene } = useGLTF('/human_anatomy.glb');
  return <primitive object={scene} scale={2.2} position={[0, -2, 0]} />;
}

// ── 3D Product Zero Model Component ──────────────────────────────────────────
function ProductZeroModel() {
  const groupRef = useRef();

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.45;
    groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.12;
    groupRef.current.position.y = Math.sin(t * 1.2) * 0.12; // Floating effect
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

// ── 3D Canvas Container ───────────────────────────────────────────────────────
function ThreeDViewer({ type = 'product' }) {
  return (
    <div className="w-full h-full relative min-h-[300px]">
      <Suspense fallback={
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 border border-white/20 border-t-white rounded-full animate-spin" />
          <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">
            Resolving 3D {type === 'product' ? 'Product' : 'Anatomy'}
          </p>
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={1.8} />
          <pointLight position={[10, 10, 10]} intensity={1.8} />
          <directionalLight position={[-10, -10, -10]} intensity={0.5} />
          {type === 'product' ? <ProductZeroModel /> : <AnatomyModel />}
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.8} />
        </Canvas>
      </Suspense>
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
        <span className="font-mono text-[9px] text-white/50 uppercase tracking-widest text-left">GHOST-ID LEDGER</span>
        <p className="font-sans text-[10px] text-white/60 opacity-80 text-left">De-identified transaction logs map to temporary, random security hash codes.</p>
      </div>
      <div className="w-full h-full absolute inset-0 opacity-70">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <LedgerModel />
        </Canvas>
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between border-t border-white/5 pt-4 z-10 pointer-events-none">
        <span className="font-mono text-[9px] text-white/30">HASH // 0x4f92...a811</span>
        <span className="font-mono text-[8px] text-white/60 uppercase tracking-widest">Ledger Synced</span>
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
    <div className="w-full h-full p-6 flex flex-col justify-between bg-black/40 backdrop-blur-md rounded-[2rem] border border-white/5">
      <div className="text-center py-1">
        <p className="font-mono text-[8px] uppercase tracking-widest text-white/40">{status}</p>
        <div className="flex justify-center gap-3 my-2.5">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className={`w-2.5 h-2.5 rounded-full border border-white/20 flex items-center justify-center transition-all duration-200 ${
                pin.length > idx ? 'bg-white shadow-sm shadow-white/40' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[120px] flex items-center justify-center bg-black/60 rounded-2xl border border-white/5 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {vaultType === 'locked' && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-2"
            >
              <span className="material-symbols-outlined text-white/30 text-xl animate-pulse">lock</span>
              <p className="font-sans text-[10px] text-white/40">Encrypted Journal Locked</p>
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
                <span className="material-symbols-outlined text-xs">decrypted</span>
                <span className="font-mono text-[8px] uppercase tracking-wider">Private Secure Log</span>
              </div>
              <div className="space-y-1.5 font-sans text-[9px] text-white/80 leading-relaxed">
                <p className="bg-white/5 p-1.5 rounded border border-white/5">*"Met SARC advisor. Safe housing confirmed."*</p>
                <p className="bg-white/5 p-1.5 rounded border border-white/5">*"Prescription filled under Ghost ID."*</p>
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
                <span className="font-mono text-[8px] uppercase tracking-wider">Biology Class Study Notes</span>
              </div>
              <div className="space-y-1 font-sans text-[9px] text-white/60 leading-relaxed">
                <p className="border-b border-white/5 pb-1">1. Cellular respiration pathways (ATP, Krebs)</p>
                <p className="border-b border-white/5 pb-1">2. DNA replication & transcription enzymes</p>
                <p>3. Mendelian genetics laws and cross charts</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-1.5 mt-4 max-w-[140px] mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((k) => {
          const isPressed = pin.charAt(pin.length - 1) === String(k);
          return (
            <div
              key={k}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono border transition-all duration-150 select-none ${
                isPressed
                  ? 'bg-white text-black border-white scale-95 shadow-sm'
                  : 'bg-white/5 border-white/5 text-white/70'
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
  const scrollRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const interactionTimeoutRef = useRef(null);

  const products = [
    { name: 'Complete STI Panel', price: '₦12,500', desc: 'Comprehensive testing for HIV, Chlamydia, Gonorrhoea, and Syphilis.', badge: 'Popular', icon: 'science' },
    { name: 'HIV Rapid Test Kit', price: '₦4,500', desc: 'Secure home collection test yielding results within 15 minutes.', badge: 'Rapid', icon: 'biotech' },
    { name: 'Hepatitis B & C Combo', price: '₦7,200', desc: 'Dual-antibody detection screening package.', badge: 'Lab-grade', icon: 'water_drop' },
    { name: 'Emergency Contraception', price: '₦3,500', desc: 'Levonorgestrel 1.5mg express dispatch.', badge: 'Rx Fast', icon: 'medication' },
    { name: 'Zinc + Selenium Bundle', price: '₦4,200', desc: 'Immune health and clinical reproductive support supplements.', badge: 'Wellness', icon: 'spa' }
  ];

  const triplicatedProducts = [...products, ...products, ...products];

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const totalSetWidth = container.scrollWidth / 3;
    container.scrollLeft = totalSetWidth;

    const handleScroll = () => {
      if (container.scrollLeft < totalSetWidth / 2) {
        container.scrollLeft += totalSetWidth;
      } else if (container.scrollLeft > totalSetWidth * 1.8) {
        container.scrollLeft -= totalSetWidth;
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let animId;
    const speed = 0.4;

    const animate = () => {
      if (!isInteracting) {
        container.scrollLeft += speed;
      }
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [isInteracting]);

  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (interactionTimeoutRef.current) {
      clearTimeout(interactionTimeoutRef.current);
    }
  };

  const handleInteractionEnd = () => {
    interactionTimeoutRef.current = setTimeout(() => {
      setIsInteracting(false);
    }, 3000);
  };

  return (
    <div
      ref={scrollRef}
      onMouseEnter={handleInteractionStart}
      onMouseLeave={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      className="flex gap-6 overflow-x-auto snap-x snap-mandatory pb-6 no-scrollbar"
      style={{ scrollBehavior: isInteracting ? 'smooth' : 'auto' }}
    >
      {triplicatedProducts.map((p, i) => (
        <div
          key={i}
          className="snap-center shrink-0 w-[290px] sm:w-[330px] bg-black/40 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white">
                <span className="material-symbols-outlined text-lg">{p.icon}</span>
              </div>
              <span className="font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white">
                {p.badge}
              </span>
            </div>
            <div>
              <h3 className="font-sans text-base font-bold text-white">{p.name}</h3>
              <p className="font-sans text-xs text-white/60 leading-relaxed mt-1">{p.desc}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <span className="font-mono text-base font-bold text-white">{p.price}</span>
            <button
              onClick={() => navigate('/auth')}
              className="btn btn-secondary h-8 min-h-0 px-4 text-[9px] rounded-full"
            >
              Order
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}


// ── Main Page Component ──────────────────────────────────────────────────────
export default function Welcome() {
  const navigate = useNavigate();
  const pinnedRef = useRef(null);
  const rightPinRef = useRef(null);
  const cardsGridRef = useRef(null);
  const storiesGridRef = useRef(null);
  const lottieRef = useRef(null);
  
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
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  // Initialize Scroll Video Scrubbing
  useEffect(() => {
    const video = document.getElementById("welcome-scroll-video");
    if (!video) return;

    const initVideoScrub = () => {
      const duration = video.duration;
      if (isNaN(duration)) return;

      ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.5,
        onUpdate: (self) => {
          video.currentTime = self.progress * duration;
        }
      });
    };

    if (video.readyState >= 1) {
      initVideoScrub();
    } else {
      video.addEventListener("loadedmetadata", initVideoScrub);
    }

    return () => {
      video.removeEventListener("loadedmetadata", initVideoScrub);
    };
  }, []);

  // Initialize GSAP card gradient masking scroll reveals
  useEffect(() => {
    if (isWelcomeLoading) return;

    const setupMaskReveal = (gridRef) => {
      if (!gridRef.current) return;
      ScrollTrigger.create({
        trigger: gridRef.current,
        start: "top bottom-=50",
        end: "bottom top+=50",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          const grid = gridRef.current;
          if (!grid) return;
          const revealPct = progress * 130;
          const isMobile = window.innerWidth < 768;
          if (isMobile) {
            grid.style.maskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 25}%)`;
            grid.style.webkitMaskImage = `linear-gradient(to bottom, black ${revealPct}%, transparent ${revealPct + 25}%)`;
          } else {
            grid.style.maskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
            grid.style.webkitMaskImage = `linear-gradient(to right, black ${revealPct}%, transparent ${revealPct + 15}%)`;
          }
        }
      });
    };

    setupMaskReveal(cardsGridRef);
    setupMaskReveal(storiesGridRef);
  }, [isWelcomeLoading]);

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
    <div className="min-h-screen text-white font-sans overflow-x-hidden bg-dots relative flex flex-col justify-between">
      
      {/* ── Background Engine (Scroll Mode) ── */}
      <LivingBackground mode="scroll" />

      {/* ── Welcome Animated Loader ── */}
      {isWelcomeLoading && (
        <div className="welcome-loader fixed inset-0 flex flex-col items-center justify-center bg-[#010101] z-[99999] select-none">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="w-10 h-10 border border-white/10 border-t-white rounded-full animate-spin" />
            <span className="font-mono text-[9px] uppercase tracking-[0.4em] text-white/50 animate-pulse">Establishing Enclave</span>
          </motion.div>
        </div>
      )}

      {/* ── Header / Glass Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#010101]/40 backdrop-blur-xl border-b border-white/5 px-6 sm:px-10 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5 interactive" onClick={() => navigate('/')}>
          <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-white text-base">shield_with_heart</span>
          </div>
          <span className="text-sm font-mono font-bold tracking-[0.12em] uppercase">IncogniCare</span>
        </div>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="font-mono text-[9px] text-white/50 hover:text-white uppercase tracking-widest transition-all">Services</a>
          <a href="#showcase" className="font-mono text-[9px] text-white/50 hover:text-white uppercase tracking-widest transition-all">Discreet Products</a>
          <a href="#protocol" className="font-mono text-[9px] text-white/50 hover:text-white uppercase tracking-widest transition-all">Security Protocol</a>
          <button
            onClick={() => navigate('/auth')}
            className="btn btn-secondary h-9 min-h-0 px-5 text-[9px] rounded-full border-white/10"
          >
            Auth Terminal
          </button>
        </div>

        {/* Mobile Hamburger Trigger */}
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden w-8 h-8 flex items-center justify-center text-white/70 hover:text-white"
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
              className="absolute top-full left-0 right-0 bg-[#010101]/95 backdrop-blur-2xl border-b border-white/5 py-8 px-6 flex flex-col gap-6"
            >
              <a href="#features" onClick={() => setMenuOpen(false)} className="font-mono text-[10px] text-white/60 hover:text-white uppercase tracking-widest py-2">Services</a>
              <a href="#showcase" onClick={() => setMenuOpen(false)} className="font-mono text-[10px] text-white/60 hover:text-white uppercase tracking-widest py-2">Discreet Products</a>
              <a href="#protocol" onClick={() => setMenuOpen(false)} className="font-mono text-[10px] text-white/60 hover:text-white uppercase tracking-widest py-2">Security Protocol</a>
              <button
                onClick={() => { setMenuOpen(false); navigate('/auth'); }}
                className="btn btn-primary w-full text-[10px] py-3 rounded-full"
              >
                Sign In to Terminal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ── Hero Section ── */}
      <main className="flex-1 flex flex-col justify-center relative z-10 pt-28">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-12 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-white/60">
                Interactive 3D Diagnostics Active
              </span>
            </div>

            <h1 className="leading-[0.98] tracking-tighter">
              Healthcare<br />
              designed around<br />
              <span className="text-white/40">your privacy.</span>
            </h1>

            <p className="font-sans text-base sm:text-lg text-white/60 max-w-xl leading-relaxed">
              Consult with top medical professionals, request lab tests, and receive prescriptions in plain, unmarked packaging. No judgment, no social exposure, absolute peace of mind.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/auth')}
                className="btn btn-primary w-full sm:w-auto h-12 rounded-full px-8 text-xs flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              <a
                href="#features"
                className="btn btn-secondary w-full sm:w-auto h-12 rounded-full px-6 text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">explore</span>
                View Services
              </a>
            </div>

            {/* Trust Ribbon */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-white/5">
              {[
                { icon: 'lock', label: 'Secure Enclave' },
                { icon: 'package_2', label: 'Plain Packaging' },
                { icon: 'verified_user', label: 'Licensed Doctors' },
                { icon: 'crisis_hotline', label: '24/7 Crisis Help' },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/40">
                  <span className="material-symbols-outlined text-white text-base">{badge.icon}</span>
                  <span className="font-mono text-[8px] uppercase tracking-wider font-semibold">{badge.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right Column (3D interactive model wrapper) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] p-4 bg-black/40 border border-white/5 bento-glass overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-white/20 transition-all duration-500">
              
              <div className="p-2 flex items-center justify-between border-b border-white/5 bg-white/5 rounded-2xl">
                <div className="flex gap-1">
                  <button
                    onClick={() => setModelType('product')}
                    className={`h-7 px-3 rounded-lg font-mono text-[8px] uppercase tracking-wider transition-all ${
                      modelType === 'product'
                        ? 'bg-white text-black font-bold'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Care Pack
                  </button>
                  <button
                    onClick={() => setModelType('anatomy')}
                    className={`h-7 px-3 rounded-lg font-mono text-[8px] uppercase tracking-wider transition-all ${
                      modelType === 'anatomy'
                        ? 'bg-white text-black font-bold'
                        : 'text-white/40 hover:text-white'
                    }`}
                  >
                    Body Map
                  </button>
                </div>
                <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest">
                  {modelType === 'product' ? 'Product Zero' : 'Anatomy'}
                </span>
              </div>

              <div className="flex-1 my-4 rounded-2xl overflow-hidden bg-black/50 border border-white/5 flex items-center justify-center relative select-none">
                <ThreeDViewer type={modelType} />
              </div>

              <div className="p-4 bg-black/60 rounded-2xl space-y-2 border border-white/5">
                <p className="font-sans text-xs font-bold text-white">
                  {modelType === 'product' ? 'Interactive 3D Care Pack' : '3D Anatomical Body Mapping'}
                </p>
                <p className="font-sans text-[11px] text-white/50 leading-relaxed">
                  {modelType === 'product'
                    ? 'Examine our unmarked, tamper-evident 3D package (Product Zero). Real-time 360° inspection shows secure handover seals.'
                    : 'Drag with your cursor to rotate the clinical wireframe. Track diagnostics and mark symptom regions in real-time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Services Section ── */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 lg:py-32 border-t border-white/5 relative z-10">
        <header className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Confidential Services</p>
          <h2 className="font-sans text-3xl sm:text-5xl font-black text-white tracking-tight">
            Healthcare designed around your dignity
          </h2>
          <p className="font-sans text-base text-white/60">
            A comprehensive suite of medical and counseling services built with end-to-end client confidentiality at the core.
          </p>
        </header>

        {/* cardsGridRef is used by GSAP for the linear-gradient scroll masking */}
        <div ref={cardsGridRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-all duration-300">
          {[
            {
              icon: 'video_camera_front',
              title: 'Private Telehealth',
              desc: 'Book secure video or text chat sessions with verified physicians and SARC counselors.',
            },
            {
              icon: 'local_pharmacy',
              title: 'Discreet Delivery',
              desc: 'Prescriptions filled by partner stores and delivered in plain, unmarked packages with secure PIN verification.',
            },
            {
              icon: 'biotech',
              title: 'Home Lab Testing',
              desc: 'STI & HIV testing kits shipped anonymously. Get fast results sent securely to your log.',
            },
            {
              icon: 'shield_with_heart',
              title: 'Safe Haven Log',
              desc: 'A local client-side encrypted journal with Duress PIN locks to hide sensitive evidence safely.',
            },
          ].map((service, idx) => (
            <div
              key={idx}
              className="card p-8 flex flex-col justify-between hover:border-white/20 transition-all duration-300 group cursor-default shadow-sm"
            >
              <div className="space-y-8">
                <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-xl">{service.icon}</span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-sans text-lg font-bold text-white group-hover:text-white/80 transition-colors">
                    {service.title}
                  </h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    {service.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Patient Stories Gallery ── */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-16 border-t border-white/5 relative z-10">
        <header className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Real Patient Journeys</p>
          <h2 className="font-sans text-3xl sm:text-4xl font-black text-white tracking-tight">
            Empowerment through Compassionate Care
          </h2>
          <p className="font-sans text-sm text-white/60">
            Discover how IncogniCare works behind the scenes to support survivors, manage chronic health challenges, and ensure complete clinical confidentiality.
          </p>
        </header>

        {/* storiesGridRef is used by GSAP for the linear-gradient scroll masking */}
        <div ref={storiesGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              src: '/story_1.png',
              title: 'Anonymous Cancer Coaching',
              tag: 'Oncology Support',
              desc: 'Connecting patients with expert cancer support coaches under complete anonymity. We help navigate treatments, nutrition, and mental well-being securely.'
            },
            {
              src: '/story_2.png',
              title: 'Empowering Chronic Wellness',
              tag: 'Diabetes Hub',
              desc: 'Providing 1-1 guidance and clinical tracking tools for diabetes management. Take control of your blood glucose levels with dedicated coaching.'
            },
            {
              src: '/story_3.png',
              title: 'Survivor-First Safety Protocols',
              tag: 'Clinical Discretion',
              desc: 'Unmarked packaging, duress lock keypads, and de-identified medical ledgers ensure your privacy is fiercely protected at every single step.'
            }
          ].map((story, idx) => (
            <div key={idx} className="card overflow-hidden flex flex-col hover:border-white/20 transition-all duration-300 group shadow-lg">
              <div className="aspect-[4/3] w-full overflow-hidden bg-black relative">
                <img 
                  src={story.src} 
                  alt={story.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80" 
                />
                <span className="absolute top-4 left-4 bg-white text-black font-mono text-[9px] uppercase tracking-wider font-semibold px-3 py-1 rounded-full">
                  {story.tag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-sans text-lg font-bold text-white group-hover:text-white/80 transition-colors">
                    {story.title}
                  </h3>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">
                    {story.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CSS Scroll-Snap Product Showcase ── */}
      <section id="showcase" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-16 border-t border-white/5 relative z-10">
        <header className="mb-10 text-left">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Product Showcase</p>
          <h2 className="font-sans text-2xl sm:text-3xl font-black text-white mt-2">
            Discreet Clinical Diagnostics & Care
          </h2>
          <p className="font-sans text-xs text-white/50 mt-1">
            Swipe or scroll horizontally. Cards snap automatically to center. Plain, unmarked packaging guaranteed.
          </p>
        </header>

        <InfiniteProductScroll />
      </section>

      {/* ── GSAP ScrollTrigger Pinned Feature Showcase ── */}
      <section ref={pinnedRef} className="pinned-container max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 border-t border-white/5 relative z-10 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left scrolling copy column */}
        <div className="w-full lg:w-1/2 space-y-24 py-10">
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Securing Your Space</p>
            <h2 className="font-sans text-3xl sm:text-4xl font-black text-white">
              Next-generation privacy mechanics
            </h2>
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              Scroll down to inspect our defense-in-depth measures designed to protect patients from exposure, coercion, and metadata tracking.
            </p>
          </div>

          {[
            {
              title: 'Client-Side Cryptography (Safe Haven)',
              desc: 'Your journal logs are encrypted directly on your local device using military-grade AES-256 keys generated from your Master PIN. The plain text records never reach our servers, preventing intercept leaks.'
            },
            {
              title: 'Anti-Coercion Duress Keypad',
              desc: 'If forced to open your vault by an outside party, entering your optional Duress PIN unlocks a benign mockup vault containing first aid guides, grocery lists, and school notes instead of your real entries.'
            },
            {
              title: 'De-Identified Data Ledger',
              desc: 'No personal identification is linked to your medical consultations or wallet payment history. Everything is indexed under a random public Ghost ID, decoupling your true identity from critical care.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              ref={el => featureRefs.current[idx] = el}
              className="space-y-4 border-l border-white/20 pl-6 py-2 hover:border-white transition-colors"
            >
              <h3 className="font-sans text-lg sm:text-xl font-bold text-white">{item.title}</h3>
              <p className="font-sans text-sm text-white/60 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Right pinned Lottie preview column */}
        <div ref={rightPinRef} className="pinned-right w-full lg:w-1/2 h-[350px] lg:h-[480px] rounded-[2.5rem] bg-black/40 border border-white/5 bento-glass flex items-center justify-center relative overflow-hidden self-start">
          <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <p className="font-mono text-[8px] uppercase tracking-widest text-white/50">
              {activeFeature === 0 ? 'Active Security Enclave' : activeFeature === 1 ? 'Coercion Detection Engine' : 'Anonymous Data Ledger'}
            </p>
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
                  className="w-[200px] sm:w-[260px] aspect-square flex items-center justify-center bg-white/5 border border-white/5 rounded-full"
                >
                  <span className="material-symbols-outlined text-white text-5xl animate-pulse">shield</span>
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

      {/* ── Humanitarian quote block ── */}
      <section className="max-w-4xl mx-auto w-full px-6 sm:px-10 py-12 lg:py-16 relative z-10">
        <div className="text-center space-y-6">
          <span className="material-symbols-outlined text-white/50 text-3xl">format_quote</span>
          <blockquote className="font-sans text-xl sm:text-2xl font-medium text-white italic leading-relaxed">
            "Clinical confidentiality is not just a technology protocol — it is a basic human safeguard that restores choice, safety, and dignity to patients when they need it most."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-white" />
            <p className="font-mono text-[9px] uppercase tracking-widest text-white/50">Advocacy and Care Support Board</p>
          </div>
        </div>
      </section>

      {/* ── Sponsoring section (NGO Fundable Feature) ── */}
      <section id="protocol" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 lg:py-32 border-t border-white/5 relative z-10">
        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden bento-glass">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-white/5 border border-white/10">
                <span className="material-symbols-outlined text-white text-xs">verified</span>
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/70 font-bold">
                  NGO & Government Alignment
                </span>
              </div>

              <h2 className="font-sans text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                Aligning with international standards for human rights protection
              </h2>

              <p className="font-sans text-sm leading-relaxed text-white/60">
                IncogniCare's technical protocols are engineered to support survivors of domestic abuse, gender-based violence (GBV), and marginalized groups. We decouple identities from health data, enforce browser-only storage locks, and support stealth interfaces to protect users at risk of coercion.
              </p>

              <div className="space-y-4 pt-4">
                {[
                  { title: 'Zero Personal Identifier Logs', desc: 'No phone numbers, emails, or names are ever stored in plain text on our servers.' },
                  { title: 'Survivor-Safety Anti-Coercion Features', desc: 'Duress PIN locks load harmless, generic data screens instantly when under duress.' },
                  { title: 'Decoupled Consultation Ledger', desc: 'Medical records are indexed under random public Ghost IDs, protecting patient metadata.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-white mt-2 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-sans text-xs font-bold text-white">{item.title}</h4>
                      <p className="font-sans text-xs text-white/50 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="p-6 rounded-3xl bg-black/40 border border-white/5 space-y-6 w-full max-w-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-white text-xl">health_and_safety</span>
                  <h3 className="font-sans text-sm font-bold text-white">Humanitarian Support</h3>
                </div>
                <div className="h-[1px] w-full bg-white/5" />
                <p className="font-sans text-xs text-white/60 leading-relaxed">
                  Are you an NGO partner, health officer, or clinical agency representative? Contact our partnership board to explore clinic integrations, custom crisis hubs, and secure voucher funding methods.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="btn btn-secondary w-full text-[10px] rounded-full border-white/10"
                >
                  Request Integration Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 bg-black/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-sm">shield_with_heart</span>
            <span className="font-mono text-[10px] text-white/60 tracking-wider uppercase font-bold">
              IncogniCare
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-mono text-white/50 uppercase tracking-wider font-bold">
            <a href="#features" className="hover:text-white transition-colors">Services</a>
            <a href="#showcase" className="hover:text-white transition-colors">Discreet Products</a>
            <a href="#protocol" className="hover:text-white transition-colors">Security Protocol</a>
            <button onClick={() => navigate('/auth')} className="hover:text-white transition-colors bg-transparent border-none cursor-pointer">Auth Terminal</button>
          </div>

          <p className="font-mono text-[9px] text-white/30 tracking-wider uppercase">
            © {new Date().getFullYear()} IncogniCare. Empowering survivors with confidential care.
          </p>
        </div>
      </footer>
    </div>
  );
}
