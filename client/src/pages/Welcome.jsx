import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';

/* ════════════════════════════════════════════════════════════════════════════
   DATA
   ════════════════════════════════════════════════════════════════════════════ */
const STORY = [
  {
    image: '/story_1.png',
    title: 'Maximum health outcomes.',
    desc: 'Consult with top doctors and manage your health securely.',
  },
  {
    image: '/story_2.png',
    title: 'Private, reliable delivery.',
    desc: 'Get your prescribed test kits and medication delivered safely and discretely.',
  },
  {
    image: '/story_3.png',
    title: 'Professional, confidential care.',
    desc: 'Supportive and confidential care from dedicated professionals without any stigma.',
  }
];

const FEATURES = [
  {
    icon: 'video_camera_front',
    title: 'Private Video Consultations',
    desc: 'Face-to-face consultations with verified doctors in a comfortable, confidential environment.',
    color: '#d0bcff',
  },
  {
    icon: 'local_pharmacy',
    title: 'Anonymous Prescriptions',
    desc: 'Get medications prescribed and delivered safely in unmarked packaging straight to your door.',
    color: '#8ccdff',
  },
  {
    icon: 'biotech',
    title: 'Confidential Lab Testing',
    desc: 'Order home test kits for STIs, HIV, and more. Results sent directly to your secure portal.',
    color: '#4caf7d',
  },
  {
    icon: 'shield_with_heart',
    title: 'Supportive Resources',
    desc: 'Access SARC locations, evidence guides, and mental wellness tools in a safe, supportive space.',
    color: '#f0b429',
  },
];

const STATS = [
  { value: '100%', label: 'Safe & Encrypted' },
  { value: '0', label: 'Data Shared Without Consent' },
  { value: '24/7', label: 'Access to Care' },
  { value: '5min', label: 'Average Wait Time' },
];

const TRUST_BADGES = [
  { icon: 'lock', label: 'Industry Standard Security' },
  { icon: 'visibility_off', label: 'Complete Privacy' },
  { icon: 'verified_user', label: 'Medically Compliant' },
  { icon: 'fingerprint', label: 'Secure Access' },
];

/* ════════════════════════════════════════════════════════════════════════════
   ANIMATION VARIANTS
   ════════════════════════════════════════════════════════════════════════════ */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

/* ════════════════════════════════════════════════════════════════════════════
   SECTION WRAPPER (animate on scroll)
   ════════════════════════════════════════════════════════════════════════════ */
function Section({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   WELCOME PAGE
   ════════════════════════════════════════════════════════════════════════════ */
const Welcome = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % STORY.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  /* ── Shared CTA button ── */
  const GetStartedButton = ({ size = 'lg', className = '' }) => (
    <button
      onClick={() => navigate('/auth')}
      className={`group relative bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-full font-bold hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/15 font-headline ${
        size === 'lg'
          ? 'h-[56px] px-10 text-[16px]'
          : 'h-[48px] px-8 text-[14px]'
      } ${className}`}
    >
      <span>Get Started</span>
      <span className="material-symbols-outlined text-lg transition-transform group-hover:translate-x-1">
        arrow_forward
      </span>
    </button>
  );

  return (
    <div className="min-h-dvh bg-background text-on-surface font-sans overflow-x-hidden">

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  HERO SECTION                                                     ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <header className="relative min-h-dvh flex flex-col lg:flex-row overflow-hidden">

        {/* ── Background Story Carousel ── */}
        <div className="absolute inset-0 lg:relative lg:w-[50%] lg:min-h-dvh z-0 lg:z-auto">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={step}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              className="absolute inset-0"
            >
              <img
                src={STORY[step].image}
                alt="Story"
                className="w-full h-full object-cover"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              {/* Gradient overlays */}
              <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background/95 lg:bg-gradient-to-r lg:from-transparent lg:via-background/20 lg:to-background" />
            </motion.div>
          </AnimatePresence>

          {/* Desktop: overlay story text on image half */}
          <div className="hidden lg:flex absolute inset-0 flex-col justify-end p-12 z-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                <h2 className="font-headline text-4xl font-black text-white leading-tight tracking-tight drop-shadow-lg mb-3">
                  {STORY[step].title}
                </h2>
                <p className="text-base font-medium text-white/80 leading-relaxed drop-shadow-md max-w-md">
                  {STORY[step].desc}
                </p>
              </motion.div>
            </AnimatePresence>
            {/* Dots */}
            <div className="flex items-center gap-2 mt-6">
              {STORY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`transition-all duration-500 rounded-full ${i === step ? 'w-8 h-2 bg-white' : 'w-2 h-2 bg-white/30 hover:bg-white/50'}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right: Hero content ── */}
        <div className="flex-1 flex flex-col justify-between relative z-10 lg:z-auto">
          {/* Top: Navbar */}
          <nav className="p-6 sm:p-8 lg:p-10 pt-6 lg:pt-8 flex items-center justify-between">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/10 backdrop-blur-md flex items-center justify-center border border-primary/20 shadow-md">
                <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
              </div>
              <span className="text-xl font-black text-on-surface tracking-tight font-headline">
                Incognihealth
              </span>
            </motion.div>

            {/* Desktop nav links */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="hidden lg:flex items-center gap-6"
            >
              <a href="#features" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-label tracking-wide">Features</a>
              <a href="#how-it-works" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-label tracking-wide">How It Works</a>
              <a href="#security" className="text-sm text-on-surface-variant hover:text-on-surface transition-colors font-label tracking-wide">Security</a>
              <GetStartedButton size="sm" />
            </motion.div>
          </nav>

          {/* Center: Hero text (desktop) */}
          <div className="hidden lg:flex flex-col items-start px-10 flex-1 justify-center max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/8 border border-primary/15 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-primary font-label">Now Available in Nigeria</span>
              </div>

              <h1 className="font-headline text-5xl xl:text-6xl font-black text-on-surface leading-[1.05] tracking-tight">
                Your health,<br />
                <span className="text-primary">fully supported.</span>
              </h1>
              <p className="text-on-surface-variant text-lg leading-relaxed max-w-lg opacity-80">
                Access verified doctors, confidential lab tests, discreet prescriptions, and critical health resources — all from the comfort and safety of your own space.
              </p>

              <div className="flex items-center gap-4 pt-2">
                <GetStartedButton size="lg" />
                <a
                  href="#features"
                  className="flex items-center gap-2 h-[56px] px-6 rounded-full border border-outline-variant/30 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/50 transition-all font-label text-sm"
                >
                  <span className="material-symbols-outlined text-lg">play_circle</span>
                  Learn More
                </a>
              </div>
            </motion.div>
          </div>

          {/* Mobile: Bottom content */}
          <div className="p-6 sm:p-8 lg:hidden pb-8">
            <div className="h-[120px] mb-6 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="absolute inset-0 flex flex-col justify-end text-center"
                >
                  <h1 className="text-[32px] sm:text-[36px] font-black text-on-surface leading-[1.15] tracking-tight drop-shadow-lg mb-3 font-headline">
                    {STORY[step].title}
                  </h1>
                  <p className="text-[14px] font-medium text-on-surface-variant leading-relaxed drop-shadow-md px-2">
                    {STORY[step].desc}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Dots (mobile) */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {STORY.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className={`transition-all duration-500 rounded-full ${i === step ? 'w-6 h-1.5 bg-primary' : 'w-1.5 h-1.5 bg-outline'}`}
                />
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-3 max-w-md mx-auto"
            >
              <GetStartedButton size="lg" className="w-full" />
              <p className="text-center text-xs text-on-surface-variant/50 mt-2">
                Your health journey, completely confidential.
              </p>
            </motion.div>
          </div>

          {/* Desktop: Stats ribbon at bottom */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="hidden lg:flex items-center justify-between px-10 py-6 border-t border-outline-variant/10"
          >
            {STATS.map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <span className="text-2xl font-black text-primary font-headline">{s.value}</span>
                <span className="text-[10px] font-label uppercase tracking-widest text-on-surface-variant">{s.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Atmospheric glows */}
        <div className="hidden lg:block fixed top-[-20%] right-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      </header>

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  FEATURES SECTION (Desktop)                                       ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <div id="features" className="hidden lg:block">
        <Section className="max-w-6xl mx-auto px-10 py-24">
          <div className="text-center mb-16">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-primary">What We Offer</span>
            <h2 className="font-headline text-4xl font-black mt-3 mb-4">
              Healthcare designed around <span className="text-primary">your dignity</span>
            </h2>
            <p className="text-on-surface-variant text-lg max-w-2xl mx-auto">
              Every feature is built with privacy as the foundation — not an afterthought.
            </p>
          </div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 gap-6"
          >
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group card card-p flex gap-5 hover:bg-surface-container-low/50 transition-all duration-300 cursor-default"
              >
                <div
                  className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
                  style={{ backgroundColor: `${f.color}15`, border: `1px solid ${f.color}25` }}
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: f.color, fontVariationSettings: "'FILL' 1" }}
                  >
                    {f.icon}
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="font-headline text-lg font-bold text-on-surface">{f.title}</h3>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </Section>
      </div>

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  HOW IT WORKS (Desktop)                                           ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <div id="how-it-works" className="hidden lg:block">
        <Section className="max-w-6xl mx-auto px-10 py-24">
          <div className="text-center mb-16">
            <span className="font-label text-[11px] uppercase tracking-[0.2em] text-tertiary">How It Works</span>
            <h2 className="font-headline text-4xl font-black mt-3 mb-4">
              Three steps to <span className="text-tertiary">private healthcare</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: 'login',
                title: 'Secure Sign In',
                desc: 'Authenticate with phone + OTP. Doctors and sensitive roles use 2FA via Authenticator apps. No emails, no names needed.',
              },
              {
                step: '02',
                icon: 'forum',
                title: 'Consult Privately',
                desc: 'Browse verified doctors, book video or chat consultations. Everything is encrypted. Your identity stays hidden — even from us.',
              },
              {
                step: '03',
                icon: 'package_2',
                title: 'Receive Discreetly',
                desc: 'Prescriptions filled by partner pharmacies and delivered in plain packaging by verified riders. Lab kits arrive the same way.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                className="relative text-center space-y-4 p-8"
              >
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-surface-container-high border border-outline-variant/15 mb-2">
                  <span className="material-symbols-outlined text-2xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {item.icon}
                  </span>
                </div>
                <div className="text-[10px] font-label tracking-[0.2em] text-outline uppercase">Step {item.step}</div>
                <h3 className="font-headline text-xl font-bold text-on-surface">{item.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{item.desc}</p>

                {/* Connector line */}
                {i < 2 && (
                  <div className="absolute top-12 -right-4 w-8 h-px bg-outline-variant/20 hidden xl:block" />
                )}
              </motion.div>
            ))}
          </div>
        </Section>
      </div>

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  SECURITY / TRUST SECTION (Desktop)                               ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <div id="security" className="hidden lg:block">
        <Section className="max-w-6xl mx-auto px-10 py-24">
          <div className="grid grid-cols-2 gap-16 items-center">
            {/* Left: Text */}
            <div className="space-y-6">
              <span className="font-label text-[11px] uppercase tracking-[0.2em] text-error/80">Your Privacy Matters</span>
              <h2 className="font-headline text-4xl font-black leading-tight">
                Built for people who<br />
                <span className="text-error/90">deserve safe care.</span>
              </h2>
              <p className="text-on-surface-variant text-base leading-relaxed">
                IncogniHealth believes everyone deserves access to great healthcare in a safe, judgement-free environment. 
                We built a system where your health journey remains fully confidential and solely between you and your 
                dedicated care provider.
              </p>
              <div className="grid grid-cols-2 gap-4 pt-4">
                {TRUST_BADGES.map((b, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-high/50 border border-outline-variant/10"
                  >
                    <span className="material-symbols-outlined text-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{b.icon}</span>
                    <span className="font-label text-[10px] uppercase tracking-widest text-on-surface-variant">{b.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Visual shield */}
            <div className="relative flex items-center justify-center h-[400px]">
              {/* Pulsing rings */}
              <div className="absolute w-64 h-64 rounded-full border border-primary/10 breathing-ring" />
              <div className="absolute w-48 h-48 rounded-full border border-primary/15 breathing-ring" style={{ animationDelay: '1s' }} />
              <div className="absolute w-32 h-32 rounded-full border border-primary/20 breathing-ring" style={{ animationDelay: '2s' }} />
              {/* Center icon */}
              <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  encrypted
                </span>
              </div>
              {/* Glow */}
              <div className="absolute w-40 h-40 bg-primary/8 rounded-full blur-[60px]" />
            </div>
          </div>
        </Section>
      </div>

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  CTA FOOTER (Desktop)                                             ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <div className="hidden lg:block">
        <Section className="max-w-4xl mx-auto px-10 py-24 text-center">
          <div className="card card-p py-16 px-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-tertiary/5" />
            <div className="relative z-10 space-y-6">
              <h2 className="font-headline text-4xl font-black">
                Ready to take control of<br />
                <span className="text-primary">your health journey?</span>
              </h2>
              <p className="text-on-surface-variant text-lg max-w-xl mx-auto">
                Join thousands who have chosen dignity in healthcare. It takes less than 2 minutes to get started.
              </p>
              <div className="flex items-center justify-center gap-4 pt-4">
                <GetStartedButton size="lg" />
              </div>
              <p className="text-xs text-on-surface-variant/40 mt-4">
                No email required • Phone + OTP authentication • Zero data collection
              </p>
            </div>
          </div>
        </Section>
      </div>

      {/* ╔════════════════════════════════════════════════════════════════════╗
         ║  FOOTER (Desktop)                                                 ║
         ╚════════════════════════════════════════════════════════════════════╝ */}
      <footer className="hidden lg:block border-t border-outline-variant/10 py-8 px-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
            <span className="font-label text-xs text-on-surface-variant tracking-wider">INCOGNIHEALTH</span>
          </div>
          <p className="font-label text-[10px] text-on-surface-variant/50 tracking-wider uppercase">
            Empowering your health journey with completely confidential care. © {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
