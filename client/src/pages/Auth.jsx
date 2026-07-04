import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import PartnerRegistrationModal from '../components/PartnerRegistrationModal';
import LivingBackground from '../components/LivingBackground';

const ROLES = [
  { id: 'PATIENT',       label: 'Patient',       icon: 'person'          },
  { id: 'DOCTOR',        label: 'Doctor',         icon: 'stethoscope'     },
  { id: 'PHARMACY',      label: 'Pharmacy',       icon: 'pill'            },
  { id: 'RIDER',         label: 'Rider',          icon: 'directions_bike' },
  { id: 'LAB_SCIENTIST', label: 'Lab / Imaging',  icon: 'biotech'         },
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
      iterations += 1 / 3;
    }, 30);

    return () => clearInterval(interval);
  }, [active, text, onComplete]);

  return <span className="font-mono tracking-wider">{display}</span>;
}

export default function Auth() {
  const { login } = useAuth();

  const [step, setStep]       = useState(1);   // 1 = email+role, 2 = passcode PIN, 3 = Authenticator TOTP
  const [role, setRole]       = useState('PATIENT');
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [totp, setTotp]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [isExisting, setIsExisting] = useState(false);
  const [tempCreds, setTempCreds] = useState(null);
  const [showPartnerForm, setShowPartnerForm] = useState(false);
  
  // Custom decryption states
  const [decrypting, setDecrypting] = useState(false);
  const [finalTarget, setFinalTarget] = useState(null);

  const handleContinue = async (e) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim() || !emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setLoading(true);
    
    try {
      const response = await api.post('/auth/signup', {
        email: email.trim(),
        role: role,
      });
      setIsExisting(response.data.isExisting);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to check email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── step 2: verify PIN Passcode ──────────────── */
  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleEmailOtpChange = (val, idx) => {
    const next = [...emailOtp];
    next[idx] = val.slice(-1);
    setEmailOtp(next);
    if (val && idx < 5) document.getElementById(`emailOtp-${idx + 1}`)?.focus();
  };

  // Numpad key input handler
  const handleNumpadInput = (num) => {
    // Determine active input array
    let activeOtp = [...otp];
    let activeType = 'pin';
    
    // If not existing, we have two fields. We prioritize active focused element or PIN if none.
    const isPinFocused = document.activeElement && document.activeElement.id.startsWith('otp-');
    const isEmailOtpFocused = document.activeElement && document.activeElement.id.startsWith('emailOtp-');
    
    if (isEmailOtpFocused) {
      activeOtp = [...emailOtp];
      activeType = 'email';
    }

    const firstEmptyIndex = activeOtp.findIndex(val => val === '');
    if (firstEmptyIndex !== -1) {
      if (activeType === 'pin') {
        handleOtpChange(num, firstEmptyIndex);
      } else {
        handleEmailOtpChange(num, firstEmptyIndex);
      }
    }
  };

  const handleNumpadDelete = () => {
    let activeOtp = [...otp];
    let activeType = 'pin';
    
    const isPinFocused = document.activeElement && document.activeElement.id.startsWith('otp-');
    const isEmailOtpFocused = document.activeElement && document.activeElement.id.startsWith('emailOtp-');
    
    if (isEmailOtpFocused) {
      activeOtp = [...emailOtp];
      activeType = 'email';
    }

    // Find last filled index
    let lastFilledIndex = activeOtp.length - 1;
    while (lastFilledIndex >= 0 && activeOtp[lastFilledIndex] === '') {
      lastFilledIndex--;
    }

    if (lastFilledIndex >= 0) {
      if (activeType === 'pin') {
        const next = [...otp];
        next[lastFilledIndex] = '';
        setOtp(next);
        document.getElementById(`otp-${lastFilledIndex}`)?.focus();
      } else {
        const next = [...emailOtp];
        next[lastFilledIndex] = '';
        setEmailOtp(next);
        document.getElementById(`emailOtp-${lastFilledIndex}`)?.focus();
      }
    }
  };

  const triggerDecryptionSuccess = (token, userData) => {
    setDecrypting(true);
    setFinalTarget({ token, userData });
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit passcode.'); return; }
    
    let verificationOtp = '';
    if (!isExisting) {
      verificationOtp = emailOtp.join('');
      if (verificationOtp.length < 6) { setError('Please enter the 6-digit email verification code.'); return; }
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify', {
        email: email.trim(),
        otp: code,
        role: role,
        ...(verificationOtp && { emailOtp: verificationOtp }),
      });

      const { token, refreshToken, user: userData, requires2FA, tempToken, mfaSetup, mfaSecret } = response.data;

      if (requires2FA) {
        setTempCreds({ token, refreshToken, user: userData, tempToken, mfaSetup, mfaSecret });
        setStep(3);
      } else {
        localStorage.setItem('refreshToken', refreshToken);
        triggerDecryptionSuccess(token, userData);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Google OAuth Sign-in ─────────────────────── */
  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/auth/google', {
        tokenId: credentialResponse.credential,
        role: role,
      });
      const { token, refreshToken, user: userData, requires2FA, tempToken, mfaSetup, mfaSecret } = response.data;

      if (requires2FA) {
        setTempCreds({ token, refreshToken, user: userData, tempToken, mfaSetup, mfaSecret });
        setStep(3);
      } else {
        localStorage.setItem('refreshToken', refreshToken);
        triggerDecryptionSuccess(token, userData);
      }
    } catch (err) {
      setError(err.response?.data?.msg || 'Google Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /* ── step 3: MFA / TOTP ───────────────────────── */
  const handleTotpChange = (val, idx) => {
    const next = [...totp];
    next[idx] = val.slice(-1);
    setTotp(next);
    if (val && idx < 5) document.getElementById(`totp-${idx + 1}`)?.focus();
  };

  const handleTotpSubmit = async (e) => {
    e.preventDefault();
    const code = totp.join('');
    if (code.length < 6) { setError('Please enter your 6-digit Authenticator code.'); return; }
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-2fa', {
        tempToken: tempCreds.tempToken,
        code,
      });
      const { token, refreshToken, user: userData } = response.data;
      localStorage.setItem('refreshToken', refreshToken);
      triggerDecryptionSuccess(token, userData);
    } catch (err) {
      setError(err.response?.data?.msg || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  /* ── render ────────────────────────────────────── */
  return (
    <div className="bg-[#010101] text-white min-h-screen flex flex-col md:flex-row overflow-x-hidden relative font-sans">
      
      {/* Ambient background loops */}
      <LivingBackground mode="ambient" />

      {/* Cryptographic Decryption Success Panel Overlay */}
      <AnimatePresence>
        {decrypting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#010101] z-[99999] flex flex-col items-center justify-center select-none"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mx-auto mb-2 shadow-lg">
                <span className="material-symbols-outlined text-white text-2xl animate-pulse">lock_open</span>
              </div>
              <h2 className="text-xl font-mono uppercase tracking-[0.25em]">
                <DecryptText
                  text="ENCLAVE ACCESS DECRYPTED"
                  active={decrypting}
                  onComplete={() => {
                    if (finalTarget) {
                      login(finalTarget.token, finalTarget.userData);
                    }
                  }}
                />
              </h2>
              <p className="font-mono text-[9px] uppercase tracking-widest text-white/40">Synchronizing secure session parameters</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left Side Branding Panel ── */}
      <aside className="hidden md:flex md:w-[42%] relative overflow-hidden flex-col justify-between p-12 select-none">
        <div className="z-10">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-white text-base">shield_with_heart</span>
            <h1 className="font-mono text-sm tracking-[0.15em] text-white uppercase">IncogniCare</h1>
          </div>
          <p className="font-mono text-[9px] text-white/50 mt-1 uppercase tracking-widest">Supportive. Confidential. Yours.</p>
        </div>

        <div className="relative z-10 space-y-4">
          <h2 className="leading-[1] tracking-tighter">
            Your health,<br />
            <span className="text-white/40">your safety.</span>
          </h2>
          <p className="text-white/50 max-w-sm text-base leading-relaxed">
            Confidential care you can trust. Speak to real doctors, get prescriptions, and access resources — privately.
          </p>
        </div>

        <div className="z-10 flex items-center gap-8 border-t border-white/5 pt-8">
          {[
            { icon: 'lock', label: 'Encrypted' },
            { icon: 'visibility_off', label: 'Anonymous' },
            { icon: 'verified_user', label: 'Licensed' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2 text-white/40">
              <span className="material-symbols-outlined text-sm">{b.icon}</span>
              <span className="font-mono text-[8px] uppercase tracking-widest font-semibold">{b.label}</span>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Right Side Form Panel ── */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-20 md:p-24 relative z-10">
        <div className="w-full max-w-md bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl relative">
          
          <AnimatePresence mode="wait">
            
            {/* STEP 1: Email & Role */}
            {step === 1 && (
              <motion.section
                key="step1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <header className="space-y-1">
                  <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">Secure Terminal</span>
                  <h3 className="font-sans text-2xl font-black text-white leading-none">Welcome back</h3>
                  <p className="font-sans text-xs text-white/50">Your health information remains safe and confidential.</p>
                </header>

                <form onSubmit={handleContinue} className="space-y-6">
                  {/* Role selection */}
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">Access Level</label>
                    <div className="grid grid-cols-5 gap-1.5 p-1 bg-white/5 rounded-full border border-white/5">
                      {ROLES.map(r => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setRole(r.id)}
                          className={`py-2 rounded-full font-sans text-[10px] font-bold transition-all whitespace-nowrap text-center
                            ${role === r.id
                              ? 'bg-white text-black'
                              : 'text-white/50 hover:text-white'}`}
                        >
                          {r.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-white/40" htmlFor="email">Email Address</label>
                    <div className="relative">
                      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-white/30">mail</span>
                      <input
                        id="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="email@domain.com"
                        className="input-field pl-12"
                      />
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full text-xs font-bold py-3.5 rounded-full"
                  >
                    {loading ? 'Consulting secure keys…' : 'Authenticate Credentials'}
                  </button>

                  {/* Divider */}
                  <div className="flex items-center w-full gap-3 py-1">
                    <div className="h-[1px] bg-white/5 flex-1" />
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/30">OAuth</span>
                    <div className="h-[1px] bg-white/5 flex-1" />
                  </div>

                  {/* Google OAuth button */}
                  <div className="w-full flex justify-center">
                    <GoogleLogin
                      onSuccess={handleGoogleSuccess}
                      onError={() => setError('Google Sign-in failed.')}
                      useOneTap
                      theme="filled_dark"
                      size="large"
                      width="100%"
                    />
                  </div>

                  {/* Provider Integration Apply */}
                  {['DOCTOR', 'PHARMACY', 'LAB_SCIENTIST'].includes(role) && (
                    <div className="pt-4 border-t border-white/5 text-center space-y-2">
                      <p className="font-sans text-[11px] text-white/45">Apply to join IncogniCare network.</p>
                      <button
                        type="button"
                        onClick={() => setShowPartnerForm(true)}
                        className="btn btn-secondary w-full text-[10px] py-2 rounded-full border-white/10"
                      >
                        Register Medical Provider
                      </button>
                    </div>
                  )}
                </form>
              </motion.section>
            )}

            {/* STEP 2: Passcode PIN / OTP */}
            {step === 2 && (
              <motion.section
                key="step2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <header className="space-y-1">
                  <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em]">Encryption Key</span>
                  <h3 className="font-sans text-2xl font-black text-white leading-none">
                    {isExisting ? 'Decryption Code' : 'Initialize Passcode'}
                  </h3>
                  <p className="font-sans text-xs text-white/50">
                    {isExisting
                      ? 'Enter your 6-digit passcode to unlock vault.'
                      : 'Set a secure 6-digit PIN code to secure your data.'}
                  </p>
                  <p className="font-mono text-[10px] text-white/80 mt-1 select-all">{email}</p>
                </header>

                <form onSubmit={handleVerify} className="space-y-6">
                  {!isExisting && (
                    <div className="space-y-2">
                      <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                        Email Validation Code
                      </label>
                      <div className="flex justify-between gap-1.5">
                        {emailOtp.map((digit, i) => (
                          <input
                            key={`emailOtp-${i}`}
                            id={`emailOtp-${i}`}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={e => handleEmailOtpChange(e.target.value, i)}
                            className="w-10 h-12 bg-white/5 border border-white/5 focus:border-white text-center text-lg font-bold rounded-xl text-white transition-all outline-none"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="font-mono text-[9px] uppercase tracking-widest text-white/40">
                      {isExisting ? 'Passcode PIN' : 'Initialize 6-Digit PIN'}
                    </label>
                    <div className="flex justify-between gap-1.5">
                      {otp.map((digit, i) => (
                        <input
                          key={i}
                          id={`otp-${i}`}
                          type="password"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleOtpChange(e.target.value, i)}
                          className="w-10 h-12 bg-white/5 border border-white/5 focus:border-white text-center text-lg font-bold rounded-xl text-white transition-all outline-none"
                        />
                      ))}
                    </div>
                  </div>

                  {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                  {/* Custom Luxury Visual Numpad Grid */}
                  <div className="grid grid-cols-3 gap-1.5 max-w-[180px] mx-auto pt-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleNumpadInput(String(num))}
                        className="w-12 h-12 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center font-mono text-sm transition-all"
                      >
                        {num}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => handleNumpadDelete()}
                      className="w-12 h-12 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center font-mono text-[10px] transition-all"
                    >
                      DEL
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNumpadInput('0')}
                      className="w-12 h-12 rounded-full border border-white/5 bg-white/5 hover:bg-white/10 active:scale-95 flex items-center justify-center font-mono text-sm transition-all"
                    >
                      0
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-12 h-12 rounded-full border border-white/20 bg-white text-black hover:bg-white/95 active:scale-95 flex items-center justify-center transition-all"
                    >
                      <span className="material-symbols-outlined text-base">check</span>
                    </button>
                  </div>

                  <div className="flex flex-col items-center gap-4 pt-4 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => { setStep(1); setOtp(['','','','','','']); setEmailOtp(['','','','','','']); setError(''); }}
                      className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors font-mono text-[9px] uppercase tracking-widest group"
                    >
                      <span className="material-symbols-outlined text-xs group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                      Adjust Credentials
                    </button>
                  </div>
                </form>
              </motion.section>
            )}

            {/* STEP 3: TOTP */}
            {step === 3 && (
              <motion.section
                key="step3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <header className="space-y-1">
                  <span className="font-mono text-[9px] text-red-400 uppercase tracking-[0.2em]">Two-Step Protocol</span>
                  <h3 className="font-sans text-2xl font-black text-white leading-none">Security Key</h3>
                  <p className="font-sans text-xs text-white/50">
                    {tempCreds?.mfaSetup
                      ? 'Link this secret key in your Google Authenticator/Authy app to generate codes:'
                      : `Access requires secondary authentication. Enter your token.`}
                  </p>
                  {tempCreds?.mfaSetup && (
                    <div className="bg-white/5 border border-white/5 rounded-2xl p-4 text-center my-3 select-all">
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest">Secret Key</p>
                      <p className="font-mono text-sm text-white mt-1 font-bold tracking-wider">{tempCreds?.mfaSecret}</p>
                      <p className="font-sans text-[9px] text-white/40 mt-2">
                        Add as a Time-based key to Authenticator.
                      </p>
                    </div>
                  )}
                </header>

                <form onSubmit={handleTotpSubmit} className="space-y-6">
                  <div className="flex justify-between gap-1.5">
                    {totp.map((digit, i) => (
                      <input
                        key={`totp-${i}`}
                        id={`totp-${i}`}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleTotpChange(e.target.value, i)}
                        className="w-10 h-12 bg-white/5 border border-white/5 focus:border-red-400 text-center text-lg font-bold rounded-xl text-white transition-all outline-none"
                      />
                    ))}
                  </div>

                  {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

                  <div className="flex flex-col items-center gap-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-danger w-full text-xs font-bold py-3.5 rounded-full"
                    >
                      {loading ? 'Validating Authenticator Key…' : 'Verify Security Key'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setStep(2); setTotp(['','','','','','']); setError(''); }}
                      className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors font-mono text-[9px] uppercase tracking-widest group"
                    >
                      <span className="material-symbols-outlined text-xs group-hover:-translate-x-0.5 transition-transform">arrow_back</span>
                      Cancel Authenticator
                    </button>
                  </div>
                </form>
              </motion.section>
            )}

          </AnimatePresence>
        </div>
      </main>

      <PartnerRegistrationModal 
        isOpen={showPartnerForm} 
        onClose={() => setShowPartnerForm(false)} 
        initialRole={role} 
      />
    </div>
  );
}
