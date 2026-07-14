import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PanicButton from '../components/PanicButton';
import CryptoJS from 'crypto-js';
import LivingBackground from '../components/LivingBackground';

const TABS = ['Emergency Support', 'Clinical Protocols', 'Private Secure Log'];

const EMERGENCY = [
  { icon: 'local_hospital', title: 'Find a SARC', desc: 'Locate the nearest Sexual Assault Referral Centre. Open 24/7, staffed by specialist clinical nurses.', actionName: 'Find SARC', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10',
    action: (navigate) => navigate('/sarc') },
  { icon: 'call', title: 'Crisis Line', desc: 'Speak to a trained crisis counsellor right now. Anonymous, free, and available around the clock.', actionName: 'Call Now', color: 'text-white/60', bg: 'bg-white/5', border: 'border-white/10',
    action: () => window.dispatchEvent(new Event('open-crisis-line')) },
  { icon: 'emergency', title: 'Emergency Services', desc: 'Contact emergency medical services for immediate physical care.', actionName: '999 / 112', color: 'text-white', bg: 'bg-white/5', border: 'border-white/10',
    action: () => window.dispatchEvent(new Event('open-sos')) },
];

const PROTOCOL_STEPS = [
  { step: '01', title: 'Seek Safety First', desc: 'Get to a place where you feel safe. Your wellbeing is the immediate priority.' },
  { step: '02', title: 'Go to a SARC or Hospital', desc: 'A SARC can provide medical care, emotional support, and evidence collection — all your choice.' },
  { step: '03', title: 'Preserve Evidence (If You Choose)', desc: 'Try not to shower, change clothes, or clean up. This preserves options — reporting is entirely your decision.' },
  { step: '04', title: 'Receive Support', desc: 'You do not need to report to police to receive care. SARC services are available regardless.' },
  { step: '05', title: 'Follow-Up Care', desc: 'Ongoing counselling, medical care, and legal advice are available when you are ready.' },
];

const LOG_PROMPTS = [
  'What happened today?',
  'How are you feeling right now?',
  'What do you need most in this moment?',
  'What felt safe or comforting today?',
];

// ── Text Decryption Scrambler Micro-animation ──────────────────────────────
function DecryptText({ text, active, onComplete }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    if (!active) return;
    let iterations = 0;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$&*";
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (index < iterations) return text[index];
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iterations >= text.length) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
      iterations += 1 / 2;
    }, 40);

    return () => clearInterval(interval);
  }, [active, text, onComplete]);

  return <span className="font-mono tracking-wider">{display}</span>;
}

export default function SafeHaven() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [logText, setLogText] = useState('');
  const [logSaved, setLogSaved] = useState(false);
  const [prompt, setPrompt] = useState(LOG_PROMPTS[0]);

  // --- CRYPTOGRAPHIC ENCLAVE STATES ---
  const [hasSetup, setHasSetup] = useState(Boolean(localStorage.getItem('_app_session_token')));
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [unlockMode, setUnlockMode] = useState(''); // 'REAL' or 'DURESS'
  const [currentPin, setCurrentPin] = useState('');
  
  // Setup fields
  const [setupMaster, setSetupMaster] = useState('');
  const [setupDuress, setSetupDuress] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupError, setSetupError] = useState('');

  // Lock fields
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [decrypting, setDecrypting] = useState(false);
  const [decryptTarget, setDecryptTarget] = useState(null);

  // Decrypted contents
  const [logsList, setLogsList] = useState([]);

  // Benign default logs for Duress Mode
  const DURESS_DEFAULT_LOGS = [
    { id: '1', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), text: 'Review biology chapter 4 questions. Focus on cellular respiration definitions and diagram labeling.' },
    { id: '2', date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), text: 'Grocery shopping list: Oats, skimmed milk, Greek yoghurt, almond butter, spinach, multi-vitamin supplements.' },
    { id: '3', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), text: 'SARC general emergency contact helpline numbers copied from Nigerian government clinical guides.' }
  ];

  // Initialize secure enclave
  const handleSetup = (e) => {
    e.preventDefault();
    setSetupError('');
    if (setupMaster.length !== 4 || setupDuress.length !== 4 || setupConfirm.length !== 4) {
      setSetupError('All PIN codes must be exactly 4 digits.');
      return;
    }
    if (setupMaster !== setupConfirm) {
      setSetupError('Confirm PIN does not match Master PIN.');
      return;
    }
    if (setupMaster === setupDuress) {
      setSetupError('Master PIN and Duress PIN must be different.');
      return;
    }

    // Hash PINs using SHA-256
    const masterHash = CryptoJS.SHA256(setupMaster).toString();
    const duressHash = CryptoJS.SHA256(setupDuress).toString();

    localStorage.setItem('_app_session_token', masterHash);
    localStorage.setItem('_app_cohort_id', duressHash);
    
    // Encrypt empty logs list with the Master PIN
    const encryptedEmpty = CryptoJS.AES.encrypt('[]', setupMaster).toString();
    localStorage.setItem('_app_sync_payload', encryptedEmpty);
    
    // Initialize empty duress logs list
    localStorage.setItem('_app_metrics_cache', JSON.stringify(DURESS_DEFAULT_LOGS));

    setHasSetup(true);
    setSetupMaster('');
    setSetupDuress('');
    setSetupConfirm('');
  };

  // Trigger Decryption Overlay prior to unlocking
  const startDecryptionSequence = (mode, logs, pin = '') => {
    setDecrypting(true);
    setDecryptTarget({ mode, logs, pin });
  };

  const resolveDecryption = () => {
    if (!decryptTarget) return;
    setLogsList(decryptTarget.logs);
    setCurrentPin(decryptTarget.pin);
    setUnlockMode(decryptTarget.mode);
    setIsUnlocked(true);
    setDecrypting(false);
    setDecryptTarget(null);
    setEnteredPin('');
  };

  // Unlock secure enclave
  const handleUnlock = (pinToSubmit = enteredPin) => {
    setPinError('');
    if (pinToSubmit.length !== 4) return;

    const enteredHash = CryptoJS.SHA256(pinToSubmit).toString();
    const masterHash = localStorage.getItem('_app_session_token');
    const duressHash = localStorage.getItem('_app_cohort_id');

    if (enteredHash === masterHash) {
      // Unlock Real Mode
      const encryptedLogs = localStorage.getItem('_app_sync_payload') || '[]';
      try {
        const decryptedBytes = CryptoJS.AES.decrypt(encryptedLogs, pinToSubmit);
        const decryptedText = decryptedBytes.toString(CryptoJS.enc.Utf8);
        if (!decryptedText) {
          throw new Error('Failed decryption');
        }
        const parsed = JSON.parse(decryptedText);
        startDecryptionSequence('REAL', parsed, pinToSubmit);
      } catch {
        setPinError('Decryption failed. Secure enclave compromised.');
      }
    } else if (enteredHash === duressHash) {
      // Unlock Duress Mode
      const rawDuress = localStorage.getItem('_app_metrics_cache');
      const parsed = rawDuress ? JSON.parse(rawDuress) : DURESS_DEFAULT_LOGS;
      startDecryptionSequence('DURESS', parsed);
    } else {
      setPinError('Invalid PIN code. Access denied.');
      setEnteredPin('');
    }
  };

  // Lock enclave
  const handleLock = () => {
    setIsUnlocked(false);
    setUnlockMode('');
    setLogsList([]);
    setCurrentPin('');
    setEnteredPin('');
  };

  // Save new log entry
  const handleSaveLog = () => {
    if (!logText.trim()) return;

    const newLog = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      text: logText.trim()
    };

    const updated = [newLog, ...logsList];
    setLogsList(updated);

    if (unlockMode === 'REAL') {
      // Encrypt and store
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(updated), currentPin).toString();
      localStorage.setItem('_app_sync_payload', encrypted);
    } else {
      // Just save to duress logs in cleartext (since it's benign)
      localStorage.setItem('_app_metrics_cache', JSON.stringify(updated));
    }

    setLogSaved(true);
    setTimeout(() => setLogSaved(false), 2000);
    setLogText('');
    setPrompt(LOG_PROMPTS[Math.floor(Math.random() * LOG_PROMPTS.length)]);
  };

  // Delete log entry
  const handleDeleteLog = (id) => {
    const updated = logsList.filter(log => log.id !== id);
    setLogsList(updated);

    if (unlockMode === 'REAL') {
      const encrypted = CryptoJS.AES.encrypt(JSON.stringify(updated), currentPin).toString();
      localStorage.setItem('_app_sync_payload', encrypted);
    } else {
      localStorage.setItem('_app_metrics_cache', JSON.stringify(updated));
    }
  };

  // Handle PIN input digit clicking or keyboard entering
  const handlePinKeyPress = (digit) => {
    if (enteredPin.length >= 4) return;
    const nextPin = enteredPin + digit;
    setEnteredPin(nextPin);
    if (nextPin.length === 4) {
      setTimeout(() => handleUnlock(nextPin), 150);
    }
  };

  return (
    <div className="bg-[#131313] text-white min-h-screen select-none relative">
      <LivingBackground mode="metallic" />

      {/* ── Decrypting splash ── */}
      <AnimatePresence>
        {decrypting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#131313] z-[9999] flex flex-col items-center justify-center select-none"
          >
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <span className="material-symbols-outlined text-white text-xl">lock_open</span>
              </div>
              <h2 className="text-sm font-sans font-bold uppercase tracking-[0.2em]">
                <DecryptText
                  text="Opening Private Journal"
                  active={decrypting}
                  onComplete={resolveDecryption}
                />
              </h2>
              <p className="font-sans text-xs text-white/50">Securing session memory</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14 space-y-10 relative z-10">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shadow-md">
              <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
            </div>
            <div>
              <p className="font-sans text-[10px] text-primary uppercase tracking-[0.2em] font-extrabold mb-0.5">Personal Care & Support</p>
              <h1 className="font-sans text-3xl lg:text-4xl font-black text-white tracking-tight">Safe Haven</h1>
            </div>
          </div>
          {/* Quick Exit */}
          <button
            onClick={() => window.location.replace('https://www.google.com')}
            className="flex items-center gap-2 h-11 px-6 rounded-full bg-white text-black hover:bg-white/95 transition-all shadow-lg active:scale-95"
          >
            <span className="material-symbols-outlined text-base">exit_to_app</span>
            <span className="font-sans text-xs uppercase tracking-wider font-extrabold">Quick Exit</span>
          </button>
        </header>

        {/* Privacy alert bar */}
        <section className="bg-white/[0.02] rounded-3xl border border-white/5 p-5 flex items-start gap-4 bento-glass">
          <span className="material-symbols-outlined text-primary text-lg mt-0.5">verified_user</span>
          <p className="font-sans text-xs text-white/70 leading-relaxed">
            <strong>Your Privacy is Guaranteed.</strong> All journal logs remain stored locally on your device. Tapping Quick Exit redirects immediately to Google and clears current view memory.
          </p>
        </section>

        {/* Bento Shell layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Left Tab Navigation */}
          <nav className="w-full lg:w-60 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-between h-12 lg:h-auto lg:py-3.5 px-5 rounded-full shrink-0 transition-all font-sans text-xs select-none relative
                  ${activeTab === tab
                    ? 'text-white font-bold bg-white/5 border border-white/10'
                    : 'text-white/40 hover:text-white bg-transparent border border-transparent'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[16px]">
                    {idx === 0 ? 'medical_services' : idx === 1 ? 'account_tree' : 'lock_clock'}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-widest text-left whitespace-nowrap">{tab}</span>
                </div>
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              
              {/* Emergency Support Tab */}
              {activeTab === TABS[0] && (
                <motion.div key="emergency" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {EMERGENCY.map((item, i) => (
                      <div key={i} className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 flex flex-col justify-between h-full hover:border-white/10 transition-all duration-300 bento-glass group">
                        <div className="mb-6 space-y-4">
                           <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                             <span className="material-symbols-outlined text-base" style={{ fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
                           </div>
                           <h3 className="font-sans text-lg font-bold text-white group-hover:text-white/80 transition-colors">{item.title}</h3>
                           <p className="font-sans text-xs text-white/50 leading-relaxed">{item.desc}</p>
                        </div>
                        <button onClick={() => item.action(navigate)} className="w-full h-10 rounded-full border border-white/10 text-white hover:bg-white/5 font-mono text-[9px] uppercase tracking-widest transition-all">
                          {item.actionName}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Protocols Tab */}
              {activeTab === TABS[1] && (
                <motion.div key="protocol" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4 max-w-4xl">
                  <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold pl-1">Standard Clinical Care Pathways</p>
                  <div className="space-y-3">
                    {PROTOCOL_STEPS.map((step, i) => (
                      <div key={i} className="flex gap-6 bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                        <span className="font-sans text-3xl font-black text-white/10 shrink-0 w-12">{step.step}</span>
                        <div>
                          <h3 className="font-sans text-sm font-bold text-white mb-1">{step.title}</h3>
                          <p className="font-sans text-xs text-white/50 leading-relaxed">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Secure Logs Vault Tab */}
              {activeTab === TABS[2] && (
                <motion.div key="log" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
                  
                  {/* Setup PIN Screen */}
                  {!hasSetup && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-lg max-w-md mx-auto bento-glass">
                      <header className="text-center mb-6 space-y-2">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white mb-2">
                          <span className="material-symbols-outlined text-xl">enhanced_encryption</span>
                        </div>
                        <h3 className="font-sans text-lg font-bold text-white">Initialize Vault Lock</h3>
                        <p className="font-sans text-xs text-white/50 leading-relaxed">
                          Encrypt journal entries locally. Choose private PIN keys to structure your secure space.
                        </p>
                      </header>

                      <form onSubmit={handleSetup} className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest pl-1">Master PIN (4 digits)</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupMaster}
                            onChange={e => setSetupMaster(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 text-center text-lg font-mono tracking-[0.5em] text-white focus:border-white/20 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest pl-1">Confirm Master PIN</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupConfirm}
                            onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 text-center text-lg font-mono tracking-[0.5em] text-white focus:border-white/20 focus:outline-none"
                          />
                        </div>

                        <div className="space-y-1.5 bg-red-500/[0.02] border border-red-500/10 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-1 text-red-400">
                            <span className="material-symbols-outlined text-xs">gpp_maybe</span>
                            <label className="font-mono text-[8px] uppercase tracking-widest font-semibold">Duress Cover PIN (4 digits)</label>
                          </div>
                          <p className="font-sans text-[10px] text-white/45 mb-3 leading-relaxed">
                            Entering this secondary PIN displays generic, benign logs (e.g. biology study notes, groceries) to hide sensitive entries under coercion.
                          </p>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupDuress}
                            onChange={e => setSetupDuress(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 text-center text-lg font-mono tracking-[0.5em] text-red-400 focus:border-red-500/20 focus:outline-none"
                          />
                        </div>

                        {setupError && <p className="text-red-400 text-xs font-mono text-center">{setupError}</p>}

                        <button
                          type="submit"
                          className="w-full h-11 rounded-full bg-white text-black font-sans font-bold text-xs uppercase tracking-wider hover:bg-white/95 active:scale-[0.98] transition-all"
                        >
                          Initialize Secure Locker
                        </button>
                      </form>
                    </div>
                  )}

                  {/* Access PIN Lock Screen */}
                  {hasSetup && !isUnlocked && (
                    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 sm:p-10 shadow-lg max-w-sm mx-auto text-center bento-glass">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/5 border border-white/10 text-white mb-2">
                        <span className="material-symbols-outlined text-xl">lock</span>
                      </div>
                      <h3 className="font-sans text-lg font-bold text-white">Unlock Secure Vault</h3>
                      <p className="font-sans text-xs text-white/50 pl-1 mt-0.5">
                        Enter your 4-digit PIN to access logs.
                      </p>

                      <div className="flex justify-center gap-3 my-6">
                        {[0, 1, 2, 3].map(idx => (
                          <div
                            key={idx}
                            className={`w-3 h-3 rounded-full border border-white/20 transition-all ${
                              enteredPin.length > idx ? 'bg-white scale-110 shadow-sm shadow-white/40' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {pinError && <p className="text-red-400 text-xs font-mono mb-4">{pinError}</p>}

                      {/* Custom Luxury Numpad Grid */}
                      <div className="grid grid-cols-3 gap-2.5 max-w-[210px] mx-auto">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKeyPress(String(num))}
                            className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-lg font-mono flex items-center justify-center active:scale-95 transition-all text-white"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEnteredPin('')}
                          className="w-14 h-14 rounded-full text-[10px] font-mono uppercase text-white/40 hover:text-white flex items-center justify-center transition-all"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinKeyPress('0')}
                          className="w-14 h-14 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-lg font-mono flex items-center justify-center active:scale-95 transition-all text-white"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnteredPin(p => p.slice(0, -1))}
                          className="w-14 h-14 rounded-full text-white/40 hover:text-white flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined text-base">backspace</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Decrypted Vault View */}
                  {hasSetup && isUnlocked && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Enclave State Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 rounded-2xl p-5 bento-glass">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined ${unlockMode === 'DURESS' ? 'text-white/40' : 'text-white'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {unlockMode === 'DURESS' ? 'visibility_off' : 'lock_open'}
                          </span>
                          <div>
                            <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">Session Status</p>
                            <h4 className="font-sans text-xs font-bold text-white">
                              {unlockMode === 'DURESS' ? 'Benign Mode Active' : 'Decrypted Enclave Vault Unlocked'}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={handleLock}
                          className="h-9 px-5 rounded-full border border-white/10 font-mono text-[9px] uppercase tracking-widest text-white hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-sm">lock</span>
                          Lock Enclave
                        </button>
                      </div>

                      {/* Log Creator Form */}
                      <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 sm:p-8 shadow-lg bento-glass">
                        <header className="mb-4">
                           <p className="font-mono text-[8px] text-white/40 flex items-center gap-1.5 uppercase tracking-[0.2em] font-semibold mb-2">
                              <span className="material-symbols-outlined text-sm">edit</span> Create Entry
                           </p>
                           <p className="font-sans text-xs text-white/60 italic border-l border-white/20 pl-4 py-0.5">"{prompt}"</p>
                        </header>
                        <textarea
                          value={logText}
                          onChange={e => setLogText(e.target.value)}
                          placeholder="Decrypting text fields. Type freely..."
                          className="input-field h-32 py-4 text-xs resize-none"
                        />
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                          <button
                            onClick={handleSaveLog}
                            disabled={!logText.trim()}
                            className={`w-full sm:w-auto h-10 px-8 rounded-full font-sans font-bold text-xs uppercase tracking-wider transition-all ${
                              logSaved ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black hover:bg-white/95 disabled:opacity-20'
                            }`}
                          >
                            {logSaved ? '✓ Log Encrypted' : 'Commit Entry'}
                          </button>
                          <p className="font-mono text-[8px] text-white/35 max-w-[280px] text-center sm:text-left leading-normal">
                            All journal payload states are encoded under locally randomized encryption variables.
                          </p>
                        </div>
                      </div>

                      {/* Entries logs lists */}
                      <div className="space-y-4">
                        <h4 className="font-sans text-sm font-bold text-white uppercase tracking-wider pl-1">Vault Logs ({logsList.length})</h4>
                        {logsList.length === 0 ? (
                          <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-10 text-center text-white/30 bento-glass">
                            <span className="material-symbols-outlined text-2xl mb-1">folder_open</span>
                            <p className="font-sans text-xs">Zero records logged in vault.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {logsList.map(log => (
                              <div key={log.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 space-y-3 relative group bento-glass">
                                <header className="flex items-center justify-between border-b border-white/5 pb-2">
                                  <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">
                                    {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  >
                                    <span className="material-symbols-outlined text-base">delete</span>
                                  </button>
                                </header>
                                <p className="font-sans text-xs text-white/70 leading-relaxed whitespace-pre-wrap pl-1">{log.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
      <PanicButton />
    </div>
  );
}
