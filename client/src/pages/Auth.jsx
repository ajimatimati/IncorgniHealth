import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { GoogleLogin } from '@react-oauth/google';
import AppleLogin from 'react-apple-signin-auth';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

const ROLES = [
  { value: 'PATIENT',       label: 'Patient'       },
  { value: 'DOCTOR',        label: 'Doctor'        },
  { value: 'PHARMACY',      label: 'Pharmacist'    },
  { value: 'RIDER',         label: 'Rider'         },
  { value: 'LAB_SCIENTIST', label: 'Lab Technician' },
];

const ROLE_ROUTES = {
  DOCTOR: '/doctor-dashboard',
  PHARMACY: '/pharmacy-dashboard',
  RIDER: '/rider-dashboard',
  LAB_SCIENTIST: '/lab-dashboard',
  ADMIN: '/admin',
};

const Auth = () => {
  const [step, setStep]     = useState(1);
  const [phone, setPhone]   = useState('');
  const [role, setRole]     = useState('PATIENT');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const otpRefs = useRef([]);

  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const otpString = otp.join('');

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Enter your phone number to continue.'); return; }
    if (role === 'LAB_SCIENTIST' && !licenseNumber.trim()) { setError('Enter your facility license number.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/signup', { phone, role, licenseNumber: role === 'LAB_SCIENTIST' ? licenseNumber : undefined });
      toast.info(`OTP sent (Debug: ${res.data.debugOtp})`);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.msg === 'User already registered.') {
        setStep(2); toast.info('Account found. Enter your OTP.');
      } else {
        setError(err.response?.data?.msg || 'Connection failed. Ensure both servers are running.');
      }
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e?.preventDefault();
    if (otpString.length < 6) { setError('Enter the 6-digit code.'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify', { phone, otp: otpString });
      const { token, refreshToken: rToken, user } = res.data;
      login(token, user);
      if (rToken) localStorage.setItem('refreshToken', rToken);
      navigate(ROLE_ROUTES[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || 'Incorrect code. Try again.');
      setOtp(['', '', '', '', '', '']);
      otpRefs.current[0]?.focus();
    } finally { setLoading(false); }
  };

  const handleOtpChange = (idx, val) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    if (digit && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (digit && idx === 5 && next.every(d => d)) {
      setTimeout(() => handleVerify(), 100);
    }
  };

  const handleOtpKey = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    const next = Array(6).fill('');
    digits.forEach((d, i) => { next[i] = d; });
    setOtp(next);
    otpRefs.current[Math.min(digits.length, 5)]?.focus();
  };

  const handleSocialAuth = async (endpoint, payload) => {
    setLoading(true); setError('');
    try {
      const res = await api.post(endpoint, { ...payload, role });
      const { token, refreshToken: rToken, user } = res.data;
      login(token, user);
      if (rToken) localStorage.setItem('refreshToken', rToken);
      navigate(ROLE_ROUTES[user.role] || '/dashboard');
      toast.success('Signed in securely');
    } catch (err) {
      setError(err.response?.data?.msg || 'Sign-in failed. Try again.');
    } finally { setLoading(false); }
  };

  const fade = {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    exit:    { opacity: 0, y: -8 },
  };

  return (
    <div className="min-h-dvh flex flex-col lg:flex-row relative overflow-hidden font-sans bg-[#F8F7F6]">

      {/* ── Background Elements (Visible on Mobile too) ── */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#F4F4F5]">
        {/* Removed blobs for a flat, professional aesthetic */}
      </div>

      {/* ── Left: Hero panel (desktop only) ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[46%] flex-col items-center justify-between bg-[#FFFFFF] p-14 relative z-10 border-r border-[#E4E4E7]">
        {/* Brand */}
        <div className="w-full">
          <span className="text-sm font-bold text-[#18181B] tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Incognihealth
          </span>
        </div>

        {/* Illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col items-center text-center gap-8 max-w-sm relative"
        >
          {/* Decorative rings behind image */}
          <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#6D28D9]/10 rounded-full pointer-events-none" />
          
          <img
            src="/hero-illustration.png"
            alt="Healthcare illustration"
            className="w-64 h-64 object-contain drop-shadow-xl"
            draggable={false}
          />
          <div>
            <h1 className="text-4xl font-black text-[#18181B] leading-[1.1] mb-4" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Maximum health <br/><span className="text-[#A1A1AA]">Outcome.</span>
            </h1>
            <p className="text-base text-[#71717A] leading-relaxed">
              Minimum social exposure.
            </p>
          </div>
        </motion.div>

        {/* Trust indicators */}
        <div className="flex items-center gap-8">
          {['Encrypted', 'Anonymous', 'Private'].map(b => (
            <div key={b} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
              <span className="text-xs font-medium text-[#A1A1AA]">{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right: Auth form ──────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center min-h-dvh lg:min-h-0 p-6 sm:p-10 relative z-10">

        {/* Mobile brand sequence */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="lg:hidden mb-12 text-center"
        >
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl font-black text-[#18181B] tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
              Incognihealth
            </span>
          </div>
          <p className="text-[13px] font-medium text-[#A1A1AA]">Secure authentication portal</p>
        </motion.div>

        {/* Container for the form to give it a solid, grounded feel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[400px] bg-white p-8 border border-[#E4E4E7] rounded-none lg:rounded-[12px] shadow-sm"
        >
          <AnimatePresence mode="wait">

            {/* ── Step 1: Phone + Role ── */}
            {step === 1 && (
              <motion.form
                key="step1"
                variants={fade} initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.25 }}
                onSubmit={handleSignup}
                className="space-y-7"
              >
                <div>
                  <h2 className="text-2xl font-bold text-[#18181B] mb-2 tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Welcome back
                  </h2>
                  <p className="text-sm font-medium text-[#71717A]">Sign in or create an account to securely access your data.</p>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-[#DC2626] bg-[#FEE2E2] px-4 py-3 rounded-2xl font-medium border border-[#FECACA]"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Role selector — Segmented Pill */}
                <div>
                  <label className="block text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-3 pl-1">I am a</label>
                  <div
                    role="group"
                    aria-label="Select your role"
                    className="relative flex items-center bg-[#F4F4F5]/80 backdrop-blur-sm rounded-full p-1 gap-0.5 border border-[#E8E6E3]"
                  >
                    {/* Sliding active indicator */}
                    <motion.span
                      layoutId="role-pill"
                      className="absolute top-1 bottom-1 rounded-full bg-white shadow-sm border border-[#E8E6E3]/50"
                      style={{
                        left: `calc(${ROLES.findIndex(r => r.value === role)} * 20% + 4px)`,
                        width: 'calc(20% - 4px)',
                      }}
                      transition={{ type: 'spring', stiffness: 420, damping: 36 }}
                    />
                    {ROLES.map(r => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`relative z-10 flex-1 py-2.5 text-[12px] font-bold rounded-full transition-colors duration-150 ${
                          role === r.value
                            ? 'text-[#18181B]'
                            : 'text-[#A1A1AA] hover:text-[#71717A]'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label className="block text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2 pl-1">Phone number</label>
                  <input
                    type="tel"
                    value={phone}
                    autoComplete="tel"
                    onChange={e => setPhone(e.target.value)}
                    placeholder="e.g. 08140432362"
                    className="w-full bg-[#FAFAFA] border border-[#D4D4D8] rounded-md px-4 py-3 text-[15px] font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#18181B] focus:border-[#18181B] transition-colors"
                  />
                </div>

                {/* License input (only for LAB_SCIENTIST) */}
                <AnimatePresence>
                  {role === 'LAB_SCIENTIST' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[11px] font-bold text-[#A1A1AA] uppercase tracking-widest mb-2 pl-1 mt-4">Facility License</label>
                      <input
                        type="text"
                        value={licenseNumber}
                        onChange={e => setLicenseNumber(e.target.value)}
                        placeholder="e.g. HEFA-123456"
                        className="w-full bg-[#FAFAFA] border border-[#D4D4D8] rounded-md px-4 py-3 text-[15px] font-medium text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:ring-1 focus:ring-[#18181B] focus:border-[#18181B] transition-colors"
                      />
                      <p className="text-[10px] font-medium text-[#A1A1AA] mt-2 pl-1">Required for lab facility verification.</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full min-h-[54px] mt-2 bg-[#18181B] hover:bg-[#27272A] active:bg-[#3F3F46] text-white font-semibold rounded-md transition-colors disabled:opacity-50 text-[15px]"
                >
                  {loading ? 'Connecting…' : 'Continue securely'}
                </button>

                {/* Social auth divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-[#E8E6E3]" />
                  <span className="text-xs text-[#A1A1AA]">or continue with</span>
                  <div className="flex-1 h-px bg-[#E8E6E3]" />
                </div>

                {/* Social logins */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <GoogleLogin
                      onSuccess={cred => handleSocialAuth('/auth/google', { tokenId: cred.credential })}
                      onError={() => setError('Google sign-in failed.')}
                      theme="outline" shape="pill" width="100%"
                    />
                  </div>
                  <AppleLogin
                    clientId="com.mcnuels.incorgnihealth"
                    redirectURI={`${window.location.origin}/auth`}
                    onSuccess={r => handleSocialAuth('/auth/apple', { idToken: r.authorization?.id_token })}
                    onError={() => setError('Apple sign-in failed.')}
                    render={({ onClick }) => (
                      <button type="button" onClick={onClick}
                        className="w-full min-h-[40px] rounded-full bg-[#18181B] text-white text-xs font-semibold flex items-center justify-center gap-2 hover:bg-[#27272A] transition-colors"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98l-.09.06c-.22.14-2.18 1.27-2.16 3.8.03 3.02 2.65 4.03 2.67 4.04-.03.07-.42 1.44-1.36 2.78M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                        </svg>
                        Apple
                      </button>
                    )}
                  />
                </div>

                <p className="text-center">
                  <a href="mailto:ajimatimati@gmail.com"
                    className="text-xs text-[#A1A1AA] hover:text-[#6D28D9] transition-colors"
                  >
                    Need help? Contact support
                  </a>
                </p>
              </motion.form>
            )}

            {/* ── Step 2: OTP ── */}
            {step === 2 && (
              <motion.form
                key="step2"
                variants={fade} initial="initial" animate="animate" exit="exit"
                transition={{ duration: 0.25 }}
                onSubmit={handleVerify}
                className="space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold text-[#18181B] mb-2 tracking-tight" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    Verify identity
                  </h2>
                  <p className="text-sm font-medium text-[#71717A]">
                    We sent a secure 6-digit code to <span className="font-bold text-[#18181B]">{phone}</span>
                  </p>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.p
                      initial={{ opacity: 0, y: -6, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="text-sm text-[#DC2626] bg-[#FEE2E2] px-4 py-3 rounded-2xl font-medium border border-[#FECACA]"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* OTP boxes */}
                <div className="flex gap-2 justify-between" onPaste={handleOtpPaste}>
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => otpRefs.current[idx] = el}
                      type="text" inputMode="numeric" maxLength={2}
                      value={digit}
                      onChange={e => handleOtpChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKey(idx, e)}
                      className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-black rounded-2xl border-2 transition-all outline-none shadow-sm ${
                        digit
                          ? 'border-[#6D28D9] bg-[#F5F3FF] text-[#6D28D9]'
                          : 'border-[#E8E6E3] bg-white text-[#18181B] focus:border-[#6D28D9]/40 focus:bg-[#FAFAFA]'
                      }`}
                      style={{ caretColor: '#6D28D9' }}
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading || otpString.length < 6}
                  className="w-full min-h-[54px] bg-[#18181B] hover:bg-[#27272A] active:bg-[#3F3F46] text-white font-semibold rounded-md transition-colors disabled:opacity-50 text-[15px]"
                >
                  {loading ? 'Confirming…' : 'Access Account'}
                </button>

                <button
                  type="button"
                  onClick={() => { setStep(1); setError(''); setOtp(['','','','','','']); }}
                  className="w-full text-[13px] font-bold text-[#A1A1AA] hover:text-[#18181B] transition-colors py-2 uppercase tracking-widest"
                >
                  Change number
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
