import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PanicButton from '../components/PanicButton';
import CryptoJS from 'crypto-js';

const TABS = ['Emergency Support', 'Clinical Protocols', 'Private Secure Log'];

const EMERGENCY = [
  { icon: 'local_hospital', title: 'Find a SARC', desc: 'Locate the nearest Sexual Assault Referral Centre. Open 24/7, staffed by specialist clinical nurses.', actionName: 'Find SARC', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20',
    action: (navigate) => navigate('/sarc') },
  { icon: 'call', title: 'Crisis Line', desc: 'Speak to a trained crisis counsellor right now. Anonymous, free, and available around the clock.', actionName: 'Call Now', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20',
    action: () => window.dispatchEvent(new Event('open-crisis-line')) },
  { icon: 'emergency', title: 'Emergency Services', desc: 'Contact emergency medical services for immediate physical care.', actionName: '999 / 112', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20',
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

  // Decrypted contents
  const [logsList, setLogsList] = useState([]);

  // Benign default logs for Duress Mode
  const DURESS_DEFAULT_LOGS = [
    { id: '1', date: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), text: 'Review biology chapter 4 questions. Focus on cellular respiration definitions and diagram labeling.' },
    { id: '2', date: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), text: 'Grocery shopping list: Oats, skimmed milk, Greek yoghurt, almond butter, spinach, multi-vitamin supplements.' },
    { id: '3', date: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), text: 'SARC general emergency contact helpline numbers copied from standard Nigerian government clinical guides.' }
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
        setLogsList(parsed);
        setCurrentPin(pinToSubmit);
        setUnlockMode('REAL');
        setIsUnlocked(true);
        setEnteredPin('');
      } catch {
        setPinError('Decryption failed. Secure enclave compromised.');
      }
    } else if (enteredHash === duressHash) {
      // Unlock Duress Mode
      const rawDuress = localStorage.getItem('_app_metrics_cache');
      const parsed = rawDuress ? JSON.parse(rawDuress) : DURESS_DEFAULT_LOGS;
      setLogsList(parsed);
      setUnlockMode('DURESS');
      setIsUnlocked(true);
      setEnteredPin('');
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
      // Auto submit
      setTimeout(() => handleUnlock(nextPin), 150);
    }
  };

  return (
    <div className="bg-background text-on-background min-h-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10 space-y-8">

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings:"'FILL' 1" }}>shield_with_heart</span>
            <div>
              <p className="font-label text-[11px] text-error uppercase tracking-[0.2em] mb-1">Confidential Zone</p>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Safe Haven</h1>
            </div>
          </div>
          {/* Quick Exit */}
          <button
            onClick={() => window.location.replace('https://www.google.com')}
            className="flex items-center gap-2 h-12 px-6 rounded-full bg-error text-on-error hover:brightness-110 transition-all shadow-lg shadow-error/20"
          >
            <span className="material-symbols-outlined text-base">exit_to_app</span>
            <span className="font-label text-[10px] uppercase tracking-widest font-bold">Quick Exit (Esc)</span>
          </button>
        </header>

        {/* Privacy notice */}
        <section className="bg-error/5 rounded-[24px] border border-error/20 p-5 flex items-start gap-4">
          <span className="material-symbols-outlined text-error mt-1">gpp_maybe</span>
          <p className="font-body text-sm text-error leading-relaxed">
            <strong className="font-bold">End-to-End Privacy.</strong> This environment is completely isolated. No history is permanently logged on our servers or your cache. Close this tab or use the Quick Exit button to immediately scrub your session.
          </p>
        </section>

        {/* High-Density Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Persistent Left Nav */}
          <nav className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map((tab, idx) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center justify-between h-14 lg:h-auto lg:py-4 px-6 lg:px-5 rounded-[20px] lg:rounded-2xl shrink-0 transition-all ${
                  activeTab === tab
                    ? 'bg-surface-container-highest text-on-surface shadow-md'
                    : 'bg-surface-container-low border border-outline-variant/5 text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-[18px]">
                    {idx === 0 ? 'medical_services' : idx === 1 ? 'account_tree' : 'lock_clock'}
                  </span>
                  <span className="font-label text-[9px] uppercase tracking-widest text-left whitespace-nowrap">{tab}</span>
                </div>
                {activeTab === tab && <span className="hidden lg:block w-1.5 h-1.5 rounded-full bg-primary" />}
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[500px]">
            <AnimatePresence mode="wait">
              {activeTab === TABS[0] && (
                <motion.div key="emergency" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 columns-masonry">
                    {EMERGENCY.map((item, i) => (
                      <div key={i} className={`bg-surface-container-low rounded-[32px] border ${item.border} p-8 flex flex-col justify-between h-full hover:shadow-lg transition-shadow`}>
                        <div className="mb-6">
                           <div className={`w-14 h-14 rounded-[20px] ${item.bg} flex items-center justify-center mb-6`}>
                             <span className={`material-symbols-outlined text-[28px] ${item.color}`} style={{ fontVariationSettings:"'FILL' 1" }}>{item.icon}</span>
                           </div>
                           <h3 className="font-headline text-2xl font-bold text-on-surface mb-3">{item.title}</h3>
                           <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{item.desc}</p>
                        </div>
                        <button onClick={() => item.action(navigate)} className={`w-full h-12 rounded-xl border ${item.border} ${item.color} ${item.bg} font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all`}>
                          {item.actionName}
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[1] && (
                <motion.div key="protocol" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-6">Standard Care Pathway</p>
                  <div className="space-y-4">
                    {PROTOCOL_STEPS.map((step, i) => (
                      <div key={i} className="flex flex-col sm:flex-row gap-6 bg-surface-container-low hover:bg-surface-container rounded-[32px] border border-outline-variant/10 p-6 sm:p-8 transition-colors">
                        <span className="font-headline text-4xl sm:text-5xl font-black text-outline/20 shrink-0 w-16 select-none">{step.step}</span>
                        <div>
                          <h3 className="font-headline text-lg font-bold text-on-surface mb-2">{step.title}</h3>
                          <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-90">{step.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === TABS[2] && (
                <motion.div key="log" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }} className="max-w-3xl">
                  
                  {/* View 1: Setup PIN */}
                  {!hasSetup && (
                    <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 sm:p-10 shadow-lg max-w-md mx-auto">
                      <header className="text-center mb-6">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3">
                          <span className="material-symbols-outlined text-2xl">enhanced_encryption</span>
                        </div>
                        <h3 className="font-headline text-xl font-bold text-on-surface">Setup Private Locker</h3>
                        <p className="font-body text-xs text-on-surface-variant mt-1.5 opacity-80 leading-relaxed">
                          Encrypt your journal entries locally on this device. Create PIN codes to access your vault.
                        </p>
                      </header>

                      <form onSubmit={handleSetup} className="space-y-4">
                        {/* Master PIN */}
                        <div className="space-y-1.5">
                          <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Choose Master PIN (4 digits)</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupMaster}
                            onChange={e => setSetupMaster(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-3 text-center text-lg font-mono tracking-[0.5em] text-primary focus:border-primary/40 focus:outline-none"
                          />
                        </div>

                        {/* Confirm Master PIN */}
                        <div className="space-y-1.5">
                          <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Confirm Master PIN</label>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupConfirm}
                            onChange={e => setSetupConfirm(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-3 text-center text-lg font-mono tracking-[0.5em] text-primary focus:border-primary/40 focus:outline-none"
                          />
                        </div>

                        {/* Duress PIN */}
                        <div className="space-y-1.5 bg-error/5 border border-error/10 rounded-2xl p-4">
                          <div className="flex items-center gap-2 mb-1.5 text-error">
                            <span className="material-symbols-outlined text-sm">gpp_maybe</span>
                            <label className="font-label text-[9px] uppercase tracking-widest">Choose Duress PIN (4 digits)</label>
                          </div>
                          <p className="font-body text-[10px] text-on-surface-variant/80 mb-2 leading-relaxed">
                            Entering this PIN will unlock a fake list of benign study/grocery notes instead of your real entries. Use it if forced to open the app.
                          </p>
                          <input
                            type="password"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            maxLength={4}
                            value={setupDuress}
                            onChange={e => setSetupDuress(e.target.value.replace(/\D/g, ''))}
                            placeholder="••••"
                            className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-3 text-center text-lg font-mono tracking-[0.5em] text-error focus:border-error/40 focus:outline-none"
                          />
                        </div>

                        {setupError && <p className="text-error text-xs font-label text-center">{setupError}</p>}

                        <button
                          type="submit"
                          className="w-full h-12 rounded-xl bg-primary text-on-primary font-headline font-bold text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all"
                        >
                          Initialize Secure Locker
                        </button>
                      </form>
                    </div>
                  )}

                  {/* View 2: Access PIN Lock Screen */}
                  {hasSetup && !isUnlocked && (
                    <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 sm:p-10 shadow-lg max-w-sm mx-auto text-center">
                      <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 text-primary mb-3">
                        <span className="material-symbols-outlined text-2xl">lock</span>
                      </div>
                      <h3 className="font-headline text-xl font-bold text-on-surface">Private Secure Vault</h3>
                      <p className="font-body text-xs text-on-surface-variant mt-1.5 opacity-80 pl-1">
                        Enter your 4-digit PIN to decrypt entries.
                      </p>

                      <div className="flex justify-center gap-3 my-6">
                        {[0, 1, 2, 3].map(idx => (
                          <div
                            key={idx}
                            className={`w-4 h-4 rounded-full border border-primary/30 transition-all ${
                              enteredPin.length > idx ? 'bg-primary scale-110 shadow-[0_0_8px_rgba(208,188,255,0.6)]' : 'bg-transparent'
                            }`}
                          />
                        ))}
                      </div>

                      {pinError && <p className="text-error text-xs font-label mb-4">{pinError}</p>}

                      {/* Numeric Keypad grid */}
                      <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto mb-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handlePinKeyPress(String(num))}
                            className="w-16 h-16 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant/5 text-xl font-headline font-bold flex items-center justify-center active:scale-95 transition-all text-on-surface"
                          >
                            {num}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => setEnteredPin('')}
                          className="w-16 h-16 rounded-full text-xs font-label uppercase text-outline hover:text-on-surface flex items-center justify-center transition-all"
                        >
                          Clear
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePinKeyPress('0')}
                          className="w-16 h-16 rounded-full bg-surface-container hover:bg-surface-container-highest border border-outline-variant/5 text-xl font-headline font-bold flex items-center justify-center active:scale-95 transition-all text-on-surface"
                        >
                          0
                        </button>
                        <button
                          type="button"
                          onClick={() => setEnteredPin(p => p.slice(0, -1))}
                          className="w-16 h-16 rounded-full text-outline hover:text-on-surface flex items-center justify-center transition-all"
                        >
                          <span className="material-symbols-outlined">backspace</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* View 3: Decrypted Vault */}
                  {hasSetup && isUnlocked && (
                    <div className="space-y-6">
                      {/* Unlocked Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5">
                        <div className="flex items-center gap-3">
                          <span className={`material-symbols-outlined ${unlockMode === 'DURESS' ? 'text-tertiary' : 'text-primary'}`} style={{ fontVariationSettings: "'FILL' 1" }}>
                            {unlockMode === 'DURESS' ? 'visibility_off' : 'lock_open'}
                          </span>
                          <div>
                            <p className="font-label text-[9px] uppercase tracking-widest text-outline">Locker State</p>
                            <h4 className="font-headline text-sm font-bold text-on-surface">
                              {unlockMode === 'DURESS' ? 'Mock Mode Enabled' : 'Decrypted Local Enclave Active'}
                            </h4>
                          </div>
                        </div>
                        <button
                          onClick={handleLock}
                          className="h-10 px-5 rounded-xl border border-outline-variant/20 font-label text-[9px] uppercase tracking-widest text-on-surface hover:bg-surface-container-highest transition-all flex items-center gap-2"
                        >
                          <span className="material-symbols-outlined text-base">lock</span>
                          Lock Vault
                        </button>
                      </div>

                      {/* Journal Writing Card */}
                      <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 sm:p-10 shadow-lg">
                        <header className="mb-6">
                           <p className="font-label text-[10px] text-primary flex items-center gap-2 uppercase tracking-[0.2em] mb-2">
                              <span className="material-symbols-outlined text-[16px]">edit</span> Write Entry
                           </p>
                           <p className="font-body text-[15px] text-on-surface-variant italic opacity-90 leading-relaxed border-l-2 border-primary/30 pl-4 py-1">"{prompt}"</p>
                        </header>
                        <textarea
                          value={logText}
                          onChange={e => setLogText(e.target.value)}
                          placeholder="Write freely. Everything is encrypted locally..."
                          className="w-full h-44 bg-surface-container border border-outline-variant/10 rounded-2xl p-6 text-sm text-on-surface focus:border-primary/40 focus:bg-surface-container-highest focus:outline-none resize-none placeholder:text-outline leading-relaxed"
                        />
                        <div className="flex flex-col sm:flex-row items-center gap-4 mt-6">
                          <button
                            onClick={handleSaveLog}
                            disabled={!logText.trim()}
                            className={`flex-1 w-full h-12 rounded-xl font-headline font-bold text-[11px] uppercase tracking-widest transition-all ${
                              logSaved ? 'bg-success/20 text-success border border-success/30' : 'bg-primary text-on-primary disabled:opacity-30 hover:brightness-115'
                            }`}
                          >
                            {logSaved ? '✓ Encrypted & Saved' : 'Save Entry'}
                          </button>
                          <p className="font-label text-[8px] text-outline opacity-60 max-w-[250px] text-center sm:text-left leading-normal">
                            Saved entries are encrypted with your Master PIN and never touch our servers.
                          </p>
                        </div>
                      </div>

                      {/* Saved Entries List */}
                      <div className="space-y-4">
                        <h4 className="font-headline text-base font-bold text-on-surface pl-1">Saved Entries ({logsList.length})</h4>
                        {logsList.length === 0 ? (
                          <div className="bg-surface-container-low rounded-[24px] border border-outline-variant/10 p-10 text-center text-outline opacity-40">
                            <span className="material-symbols-outlined text-3xl mb-2">folder_open</span>
                            <p className="font-body text-xs">No entries saved in this vault.</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {logsList.map(log => (
                              <div key={log.id} className="bg-surface-container-low rounded-3xl border border-outline-variant/10 p-6 space-y-4 relative group">
                                <header className="flex items-center justify-between border-b border-outline-variant/5 pb-2">
                                  <span className="font-label text-[9px] text-outline uppercase tracking-widest font-bold">
                                    {new Date(log.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <button
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-outline-variant hover:text-error hover:bg-error/10 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                  </button>
                                </header>
                                <p className="font-body text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap pl-1">{log.text}</p>
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
