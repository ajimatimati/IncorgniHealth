import React, { useRef, useEffect, Suspense, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import lottie from 'lottie-web';

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
      {/* Outer sleek dark glassmorphic box */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1.5, 2.2, 0.7]} />
        <meshPhysicalMaterial
          color="#1c1b1b"
          roughness={0.1}
          metalness={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transmission={0.4}
          thickness={0.8}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Internal glowing elements (representing the medicine pack) */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.1, 1.8, 0.3]} />
        <meshStandardMaterial
          color="#a078ff"
          roughness={0.4}
          metalness={0.8}
          emissive="#a078ff"
          emissiveIntensity={0.2}
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
          <div className="w-10 h-10 border-2 border-outline-variant/20 border-t-primary rounded-full animate-spin" />
          <p className="font-label text-[9px] uppercase tracking-widest text-outline">
            Loading 3D {type === 'product' ? 'Product...' : 'Anatomy...'}
          </p>
        </div>
      }>
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
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
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color={i === 5 ? "#d0bcff" : "#8ccdff"} />
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
              <lineBasicMaterial color="#494454" linewidth={1} transparent opacity={0.6} />
            </line>
            <line>
              <bufferGeometry attach="geometry">
                <float32BufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...p1, ...p3]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="#494454" linewidth={1} transparent opacity={0.6} />
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
        <span className="font-label text-[9px] text-tertiary uppercase tracking-widest text-left">GHOST-ID LEDGER</span>
        <p className="font-body text-[10px] text-on-surface-variant opacity-80 text-left">De-identified transaction logs map to temporary, random security hash codes.</p>
      </div>
      <div className="w-full h-full absolute inset-0 opacity-70">
        <Canvas camera={{ position: [0, 0, 4.5], fov: 45 }}>
          <ambientLight intensity={1.5} />
          <LedgerModel />
        </Canvas>
      </div>
      <div className="absolute inset-x-6 bottom-6 flex items-center justify-between border-t border-outline-variant/10 pt-4 z-10 pointer-events-none">
        <span className="font-mono text-[9px] text-outline">HASH // 0x4f92...a811</span>
        <span className="font-label text-[8px] text-success uppercase tracking-widest">Ledger Synced</span>
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
    <div className="w-full h-full p-6 flex flex-col justify-between bg-background/20 rounded-[2rem] border border-outline-variant/10">
      <div className="text-center py-1">
        <p className="font-label text-[8px] uppercase tracking-widest text-outline">{status}</p>
        <div className="flex justify-center gap-3 my-2.5">
          {[...Array(4)].map((_, idx) => (
            <div
              key={idx}
              className={`w-3 h-3 rounded-full border border-primary/30 flex items-center justify-center transition-all duration-200 ${
                pin.length > idx ? 'bg-primary shadow-sm shadow-primary/40' : 'bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 min-h-[120px] flex items-center justify-center bg-background/50 rounded-2xl border border-outline-variant/5 p-4 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {vaultType === 'locked' && (
            <motion.div
              key="locked"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-2"
            >
              <span className="material-symbols-outlined text-outline text-2xl animate-pulse">lock</span>
              <p className="font-body text-[10px] text-outline">Encrypted Journal Locked</p>
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
              <div className="flex items-center gap-2 text-primary border-b border-primary/20 pb-1.5 mb-1.5">
                <span className="material-symbols-outlined text-xs">decrypted</span>
                <span className="font-label text-[8px] uppercase tracking-wider">Private Secure Log</span>
              </div>
              <div className="space-y-1.5 font-body text-[9px] text-on-surface-variant leading-relaxed">
                <p className="bg-primary/5 p-1.5 rounded border border-primary/10">*"Met SARC advisor. Safe housing confirmed."*</p>
                <p className="bg-primary/5 p-1.5 rounded border border-primary/10">*"Prescription filled under Ghost ID."*</p>
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
              <div className="flex items-center gap-2 text-tertiary border-b border-tertiary/20 pb-1.5 mb-1.5">
                <span className="material-symbols-outlined text-xs">visibility</span>
                <span className="font-label text-[8px] uppercase tracking-wider text-tertiary">Biology Class Study Notes</span>
              </div>
              <div className="space-y-1 font-body text-[9px] text-on-surface-variant opacity-85 leading-relaxed">
                <p className="border-b border-outline-variant/5 pb-1">1. Cellular respiration pathways (ATP, Krebs)</p>
                <p className="border-b border-outline-variant/5 pb-1">2. DNA replication & transcription enzymes</p>
                <p>3. Mendelian genetics laws and cross charts</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4 max-w-[160px] mx-auto w-full">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, '*', 0, '#'].map((k) => {
          const isPressed = pin.charAt(pin.length - 1) === String(k);
          return (
            <div
              key={k}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-label border transition-all duration-150 select-none ${
                isPressed
                  ? 'bg-primary text-on-primary border-primary scale-90 shadow-sm'
                  : 'bg-surface-container-high border-outline-variant/10 text-on-surface-variant'
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
          className="snap-center shrink-0 w-[290px] sm:w-[330px] bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-6 flex flex-col justify-between hover:border-primary/30 transition-all duration-300 shadow-sm"
        >
          <div className="space-y-4">
            <div className="flex justify-between items-start">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-lg">{p.icon}</span>
              </div>
              <span className="font-label text-[8px] uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                {p.badge}
              </span>
            </div>
            <div>
              <h3 className="font-headline text-base font-bold text-on-surface">{p.name}</h3>
              <p className="font-body text-xs text-on-surface-variant opacity-75 leading-relaxed mt-1">{p.desc}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-outline-variant/5">
            <span className="font-headline text-base font-black text-on-surface">{p.price}</span>
            <button
              onClick={() => navigate('/auth')}
              className="btn btn-secondary h-8 min-h-0 px-4 text-[9px]"
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
  const lottieRef = useRef(null);
  const [modelType, setModelType] = useState('product'); // 'product' or 'anatomy'
  const [activeFeature, setActiveFeature] = useState(0);
  const featureRefs = useRef([]);

  // Initialize Lottie animation dynamically on slide 0
  useEffect(() => {
    if (activeFeature !== 0 || !lottieRef.current) return;
    const anim = lottie.loadAnimation({
      container: lottieRef.current,
      renderer: 'svg',
      loop: true,
      autoplay: true,
      path: '/shield-pulse.json'
    });
    return () => anim.destroy();
  }, [activeFeature]);

  // Initialize GSAP pinning and slide scroll triggers
  useEffect(() => {
    if (!pinnedRef.current || !rightPinRef.current) return;
    const ctx = gsap.context(() => {
      // General section pinning
      ScrollTrigger.create({
        trigger: pinnedRef.current,
        start: 'top top+=80',
        end: 'bottom bottom',
        pin: rightPinRef.current,
        scrub: true,
      });

      // Individual slide detectors
      featureRefs.current.forEach((el, index) => {
        if (!el) return;
        ScrollTrigger.create({
          trigger: el,
          start: 'top center+=150',
          end: 'bottom center+=150',
          onEnter: () => setActiveFeature(index),
          onEnterBack: () => setActiveFeature(index),
        });
      });
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans overflow-x-hidden bg-dots relative flex flex-col justify-between">
      
      {/* Premium Ambient Glow Orbs (Disabled) */}
      <div className="hidden absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/8 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="hidden absolute bottom-[20%] right-[-15%] w-[60%] h-[60%] bg-tertiary/6 rounded-full blur-[140px] pointer-events-none" />

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-md">
            <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
          </div>
          <span className="text-lg font-headline font-black text-on-surface tracking-tight uppercase">
            IncogniCare
          </span>
        </div>

        <div className="flex items-center gap-6">
          <a href="#features" className="hidden md:block font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
            Services
          </a>
          <a href="#showcase" className="hidden md:block font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
            Discreet Products
          </a>
          <a href="#protocol" className="hidden md:block font-label text-[10px] text-on-surface-variant hover:text-primary uppercase tracking-widest transition-colors">
            Security Protocol
          </a>
          <button
            onClick={() => navigate('/auth')}
            className="btn btn-secondary h-10 min-h-0 px-6 text-[9px]"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero Section (with 3D rotatable model) ────────────────────────── */}
      <main className="flex-1 flex flex-col justify-center relative z-10">
        <div className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-12 lg:py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Left Column (Copy + CTA) */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              <span className="font-label text-[9px] uppercase tracking-[0.15em] text-primary">
                Interactive 3D Diagnostics Active
              </span>
            </div>

            <h1 className="font-headline text-4xl sm:text-5xl lg:text-7xl font-black text-on-surface leading-[1.02] tracking-tighter">
              Healthcare that<br />
              respects your<br />
              <span className="bg-gradient-to-r from-primary via-primary-container to-tertiary bg-clip-text text-transparent">
                confidentiality.
              </span>
            </h1>

            <p className="font-body text-base sm:text-lg text-on-surface-variant max-w-xl leading-relaxed opacity-95">
              Consult with top medical professionals, request lab tests, and receive prescriptions in plain, unmarked packaging. No judgment, no social exposure, absolute peace of mind.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={() => navigate('/auth')}
                className="btn btn-primary w-full sm:w-auto h-14 min-h-0 px-8 text-xs flex items-center justify-center gap-2"
              >
                <span>Get Started</span>
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </button>
              <a
                href="#features"
                className="btn btn-secondary w-full sm:w-auto h-14 min-h-0 px-6 text-xs flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-base">explore</span>
                View Services
              </a>
            </div>

            {/* Trust Ribbon */}
            <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-outline-variant/10">
              {[
                { icon: 'lock', label: 'Secure Enclave' },
                { icon: 'package_2', label: 'Plain Packaging' },
                { icon: 'verified_user', label: 'Licensed Doctors' },
                { icon: 'crisis_hotline', label: '24/7 Crisis Help' },
              ].map((badge, idx) => (
                <div key={idx} className="flex items-center gap-2 text-outline-variant">
                  <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>{badge.icon}</span>
                  <span className="font-label text-[9px] uppercase tracking-wider text-outline font-bold">
                    {badge.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Hero Right Column (Three.js 360 rotatable zero product canvas) */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-md aspect-[4/5] rounded-[2.5rem] p-4 bg-surface-container-low/40 border border-outline-variant/15 bento-glass overflow-hidden shadow-2xl flex flex-col justify-between group hover:border-primary/25 transition-all duration-500">
              {/* Decorative light reflection */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
              
              <div className="p-3 flex items-center justify-between border-b border-outline-variant/10 bg-background/20 rounded-2xl">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setModelType('product')}
                    className={`h-7 px-3 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all ${
                      modelType === 'product'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Care Pack
                  </button>
                  <button
                    onClick={() => setModelType('anatomy')}
                    className={`h-7 px-3 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all ${
                      modelType === 'anatomy'
                        ? 'bg-primary text-on-primary font-bold'
                        : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Body Map
                  </button>
                </div>
                <span className="font-mono text-[8px] text-tertiary uppercase tracking-widest">
                  {modelType === 'product' ? 'Product Zero' : 'Anatomy'}
                </span>
              </div>

              {/* Three.js canvas replaces static image */}
              <div className="flex-1 my-4 rounded-2xl overflow-hidden bg-background/30 border border-outline-variant/5 flex items-center justify-center relative select-none">
                <ThreeDViewer type={modelType} />
              </div>

              <div className="p-4 bg-background/40 rounded-2xl space-y-2 border border-outline-variant/5">
                <p className="font-headline text-xs font-bold text-on-surface">
                  {modelType === 'product' ? 'Interactive 3D Care Pack' : '3D Anatomical Body Mapping'}
                </p>
                <p className="font-body text-[11px] text-on-surface-variant leading-relaxed opacity-80">
                  {modelType === 'product'
                    ? 'Examine our unmarked, tamper-evident 3D package (Product Zero). Real-time 360° inspection shows secure handover seals.'
                    : 'Drag with your cursor to rotate the clinical wireframe. Track diagnostics and mark symptom regions in real-time.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ── Services Section ─────────────────────────────────────────────── */}
      <section id="features" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 lg:py-32 border-t border-outline-variant/10 relative z-10">
        <header className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">Confidential Services</p>
          <h2 className="font-headline text-3xl sm:text-5xl font-black text-on-surface tracking-tight">
            Healthcare designed around <span className="text-primary">your dignity</span>
          </h2>
          <p className="font-body text-base text-on-surface-variant opacity-85">
            A comprehensive suite of medical and counseling services built with end-to-end client confidentiality at the core.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: 'video_camera_front',
              title: 'Private Telehealth',
              desc: 'Book secure video or text chat sessions with verified physicians and SARC counselors.',
              color: 'text-primary',
              bg: 'bg-primary/10',
              border: 'border-primary/20',
            },
            {
              icon: 'local_pharmacy',
              title: 'Discreet Delivery',
              desc: 'Prescriptions filled by partner stores and delivered in plain, unmarked packages with secure PIN verification.',
              color: 'text-tertiary',
              bg: 'bg-tertiary/10',
              border: 'border-tertiary/20',
            },
            {
              icon: 'biotech',
              title: 'Home Lab Testing',
              desc: 'STI & HIV testing kits shipped anonymously. Get fast results sent securely to your log.',
              color: 'text-secondary',
              bg: 'bg-secondary/10',
              border: 'border-secondary/20',
            },
            {
              icon: 'shield_with_heart',
              title: 'Safe Haven Log',
              desc: 'A local client-side encrypted journal with Duress PIN locks to hide sensitive evidence safely.',
              color: 'text-error',
              bg: 'bg-error/10',
              border: 'border-error/20',
            },
          ].map((service, idx) => (
            <div
              key={idx}
              className="bg-surface-container-low border border-outline-variant/10 rounded-[2.25rem] p-8 flex flex-col justify-between hover:border-outline-variant/30 hover:bg-surface-container transition-all duration-300 group cursor-default shadow-sm hover:shadow-md"
            >
              <div className="space-y-8">
                <div className={`w-14 h-14 rounded-[20px] ${service.bg} border ${service.border} flex items-center justify-center ${service.color}`}>
                  <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {service.icon}
                  </span>
                </div>
                <div className="space-y-3">
                  <h3 className="font-headline text-lg font-bold text-on-surface group-hover:text-primary transition-colors">
                    {service.title}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed opacity-75">
                    {service.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Empowerment & Care Stories Gallery ────────────────────────────── */}
      <section className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-16 border-t border-outline-variant/10 relative z-10">
        <header className="max-w-2xl mx-auto text-center mb-16 space-y-4">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary">Real Patient Journeys</p>
          <h2 className="font-headline text-3xl sm:text-4xl font-black text-on-surface tracking-tight">
            Empowerment through <span className="text-tertiary">Compassionate Care</span>
          </h2>
          <p className="font-body text-sm text-on-surface-variant opacity-85">
            Discover how IncogniCare works behind the scenes to support survivors, manage chronic health challenges, and ensure complete clinical confidentiality.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
            <div key={idx} className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] overflow-hidden flex flex-col hover:border-tertiary/20 hover:bg-surface-container transition-all duration-300 group shadow-lg">
              <div className="aspect-[4/3] w-full overflow-hidden bg-background/50 relative">
                <img 
                  src={story.src} 
                  alt={story.title} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <span className="absolute top-4 left-4 bg-tertiary text-on-tertiary font-label text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded-full">
                  {story.tag}
                </span>
              </div>
              <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <h3 className="font-headline text-lg font-bold text-on-surface group-hover:text-tertiary transition-colors">
                    {story.title}
                  </h3>
                  <p className="font-body text-xs text-on-surface-variant leading-relaxed opacity-80">
                    {story.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── CSS Scroll-Snap Product Showcase ──────────────────────────────── */}
      <section id="showcase" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-16 border-t border-outline-variant/10 relative z-10">
        <header className="mb-10 text-left">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-tertiary">Product Showcase</p>
          <h2 className="font-headline text-2xl sm:text-3xl font-black text-on-surface mt-2">
            Discreet Clinical Diagnostics & Care
          </h2>
          <p className="font-body text-xs text-on-surface-variant opacity-80 mt-1">
            Swipe or scroll horizontally. Cards snap automatically to center. Plain, unmarked packaging guaranteed.
          </p>
        </header>

        <InfiniteProductScroll />
      </section>

      {/* ── GSAP ScrollTrigger Pinned Feature Showcase ────────────────────── */}
      <section ref={pinnedRef} className="pinned-container max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 border-t border-outline-variant/10 relative z-10 flex flex-col lg:flex-row gap-12 items-start">
        
        {/* Left scrolling copy column */}
        <div className="w-full lg:w-1/2 space-y-24 py-10">
          <div className="space-y-4">
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-primary">Securing Your Space</p>
            <h2 className="font-headline text-3xl sm:text-4xl font-black text-on-surface">
              Next-generation privacy mechanics
            </h2>
            <p className="font-body text-sm text-on-surface-variant leading-relaxed">
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
              className="space-y-4 border-l-2 border-primary/20 pl-6 py-2 hover:border-primary transition-colors"
            >
              <h3 className="font-headline text-lg sm:text-xl font-bold text-on-surface">{item.title}</h3>
              <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-80">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Right pinned Lottie preview column */}
        <div ref={rightPinRef} className="pinned-right w-full lg:w-1/2 h-[350px] lg:h-[480px] rounded-[2.5rem] bg-surface-container-low/40 border border-outline-variant/10 bento-glass flex items-center justify-center relative overflow-hidden self-start">
          <div className="absolute top-4 left-6 flex items-center gap-2 z-20">
            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
            <p className="font-label text-[8px] uppercase tracking-widest text-outline">
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
                  className="w-[200px] sm:w-[260px] aspect-square flex items-center justify-center"
                >
                  <div ref={lottieRef} className="w-full h-full" />
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
          
          <div className="absolute inset-0 bg-radial-gradient from-primary/5 to-transparent pointer-events-none" />
        </div>
      </section>

      {/* ── Humanitarian quote block ─────────────────────────────────────── */}
      <section className="max-w-4xl mx-auto w-full px-6 sm:px-10 py-12 lg:py-16 relative z-10">
        <div className="text-center space-y-6">
          <span className="material-symbols-outlined text-primary text-3xl opacity-60">format_quote</span>
          <blockquote className="font-headline text-xl sm:text-2xl font-medium text-on-surface italic leading-relaxed">
            "Clinical confidentiality is not just a technology protocol — it is a basic human safeguard that restores choice, safety, and dignity to patients when they need it most."
          </blockquote>
          <div className="flex items-center justify-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            <p className="font-label text-[9px] uppercase tracking-widest text-outline">Advocacy and Care Support Board</p>
          </div>
        </div>
      </section>

      {/* ── Sponsoring section (NGO Fundable Feature) ───────────────────────── */}
      <section id="protocol" className="max-w-7xl mx-auto w-full px-6 sm:px-10 py-20 lg:py-32 border-t border-outline-variant/10 relative z-10">
        <div className="bg-gradient-to-br from-surface-container-low/40 to-surface-container-low/80 border border-outline-variant/15 rounded-[2.5rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden bento-glass">
          <div className="absolute top-[-30%] right-[-10%] w-[60%] h-[60%] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container border border-outline-variant/15">
                <span className="material-symbols-outlined text-tertiary text-xs">verified</span>
                <span className="font-label text-[9px] uppercase tracking-wider text-tertiary font-bold">
                  NGO & Government Alignment
                </span>
              </div>

              <h2 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-black text-on-surface leading-[1.1] tracking-tight">
                Aligning with international standards for <span className="text-tertiary">human rights protection</span>
              </h2>

              <p className="font-body text-sm leading-relaxed text-on-surface-variant opacity-90">
                IncogniCare's technical protocols are engineered to support survivors of domestic abuse, gender-based violence (GBV), and marginalized groups. We decouple identities from health data, enforce browser-only storage locks, and support stealth interfaces to protect users at risk of coercion.
              </p>

              <div className="space-y-4 pt-4">
                {[
                  { title: 'Zero Personal Identifier Logs', desc: 'No phone numbers, emails, or names are ever stored in plain text on our servers.' },
                  { title: 'Survivor-Safety Anti-Coercion Features', desc: 'Duress PIN locks load harmless, generic data screens instantly when under duress.' },
                  { title: 'Decoupled Consultation Ledger', desc: 'Medical records are indexed under random public Ghost IDs, protecting patient metadata.' }
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-tertiary mt-2 shrink-0 animate-pulse" />
                    <div>
                      <h4 className="font-headline text-xs font-bold text-on-surface">{item.title}</h4>
                      <p className="font-body text-xs text-on-surface-variant opacity-75 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <div className="p-6 rounded-3xl bg-background/50 border border-outline-variant/10 space-y-6 w-full max-w-sm">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary text-2xl">health_and_safety</span>
                  <h3 className="font-headline text-sm font-bold text-on-surface">Humanitarian Support</h3>
                </div>
                <div className="h-0.5 w-full bg-outline-variant/10" />
                <p className="font-body text-xs text-on-surface-variant leading-relaxed opacity-85">
                  Are you an NGO partner, health officer, or clinical agency representative? Contact our partnership board to explore clinic integrations, custom crisis hubs, and secure voucher funding methods.
                </p>
                <button
                  onClick={() => navigate('/auth')}
                  className="btn btn-secondary w-full text-[10px]"
                >
                  Request Integration Guide
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="border-t border-outline-variant/10 py-10 bg-background/60 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-6 sm:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
              shield_with_heart
            </span>
            <span className="font-label text-[10px] text-on-surface-variant tracking-wider uppercase font-bold">
              IncogniCare
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-[10px] font-label text-outline uppercase tracking-wider font-bold">
            <a href="#features" className="hover:text-primary transition-colors">Services</a>
            <a href="#showcase" className="hover:text-primary transition-colors">Discreet Products</a>
            <a href="#protocol" className="hover:text-primary transition-colors">Security Protocol</a>
            <button onClick={() => navigate('/auth')} className="hover:text-primary transition-colors">Auth Terminal</button>
          </div>

          <p className="font-label text-[9px] text-outline/50 tracking-wider uppercase">
            © {new Date().getFullYear()} IncogniCare. Empowering survivors with confidential care.
          </p>
        </div>
      </footer>
    </div>
  );
}
