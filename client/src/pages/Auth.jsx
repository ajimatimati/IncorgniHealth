import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import api from '../api';
import PartnerRegistrationModal from '../components/PartnerRegistrationModal';

const ROLES = [
  { id: 'PATIENT',       label: 'Patient',       icon: 'person'          },
  { id: 'DOCTOR',        label: 'Doctor',         icon: 'stethoscope'     },
  { id: 'PHARMACY',      label: 'Pharmacy',       icon: 'pill'            },
  { id: 'RIDER',         label: 'Rider',          icon: 'directions_bike' },
  { id: 'LAB_SCIENTIST', label: 'Lab / Imaging',  icon: 'biotech'         },
];

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
        login(token, userData);
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
        login(token, userData);
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
      login(token, userData);
    } catch (err) {
      setError(err.response?.data?.msg || 'Verification failed. Please check your code.');
    } finally {
      setLoading(false);
    }
  };

  /* ── render ────────────────────────────────────── */
  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col md:flex-row overflow-x-hidden">

      {/* ── Left: Branding panel (desktop) ── */}
      <aside className="hidden md:flex md:w-[46%] bg-surface-container-lowest relative overflow-hidden flex-col justify-between p-12 border-r border-outline-variant/10">
        {/* Brand */}
        <div className="z-10">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings:"'FILL' 1" }}>shield_with_heart</span>
            <h1 className="font-headline text-xl tracking-wider text-primary uppercase">IncogniCare</h1>
          </div>
          <p className="font-label text-xs text-secondary mt-2 tracking-wide opacity-60">Supportive. Confidential. Yours.</p>
        </div>

        {/* Hero content */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h2 className="font-headline text-5xl leading-tight text-on-surface">
              Your health,<br />
              <span className="text-primary">your privacy.</span>
            </h2>
            <p className="text-on-surface-variant max-w-md text-lg leading-relaxed">
              Confidential care you can trust. Speak to real doctors, get prescriptions, and access health resources — privately.
            </p>
          </div>
        </div>

        {/* Trust badges */}
        <div className="z-10 flex items-center gap-8 border-t border-outline-variant/20 pt-8">
          {[
            { icon: 'lock', label: 'Encrypted' },
            { icon: 'visibility_off', label: 'Anonymous' },
            { icon: 'verified_user', label: 'Private' },
          ].map(b => (
            <div key={b.label} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-tertiary text-sm">{b.icon}</span>
              <span className="font-label text-[10px] uppercase tracking-widest text-secondary">{b.label}</span>
            </div>
          ))}
        </div>

        {/* Atmospheric glow */}
        <div className="absolute top-[-20%] right-[-20%] w-[80%] h-[80%] bg-primary/5 rounded-full blur-[120px]" />
      </aside>

      {/* ── Right: Auth form ── */}
      <main className="flex-1 flex flex-col justify-center items-center px-6 py-12 md:p-24 relative">
        <div className="w-full max-w-md space-y-10">

          {/* ── STEP 1: Email + Role ── */}
          {step === 1 && (
            <section className="space-y-8">
              <header className="space-y-2">
                <span className="font-label text-xs text-primary uppercase tracking-[0.2em]">Sign In / Register</span>
                <h3 className="font-headline text-3xl text-on-surface">Welcome back</h3>
                <p className="text-on-surface-variant text-sm">Your health information is safe and confidential.</p>
              </header>

              <form onSubmit={handleContinue} className="space-y-6">
                {/* Role selector */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline">I am a…</label>
                  <div className="bg-surface-container-high rounded-full p-1.5 flex flex-wrap gap-1">
                    {ROLES.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setRole(r.id)}
                        className={`flex-1 min-w-fit px-3 py-2 rounded-full font-body text-xs font-medium transition-all whitespace-nowrap
                          ${role === r.id
                            ? 'bg-primary text-on-primary'
                            : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline" htmlFor="email">Email Address</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined">mail</span>
                    </div>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="yourname@domain.com"
                      className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-primary py-4 pl-12 pr-4 text-on-surface font-label tracking-wider transition-all outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-error text-sm font-label">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary w-full text-sm py-4 h-auto"
                >
                  {loading ? 'Please wait…' : 'Continue'}
                </button>

                {/* Google Sign In */}
                <div className="flex flex-col items-center gap-4 pt-2">
                  <div className="flex items-center w-full gap-3">
                    <div className="h-[1px] bg-outline-variant/30 flex-1" />
                    <span className="font-label text-[9px] uppercase tracking-widest text-outline opacity-60">or</span>
                    <div className="h-[1px] bg-outline-variant/30 flex-1" />
                  </div>
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
                </div>

                {['DOCTOR', 'PHARMACY', 'LAB_SCIENTIST'].includes(role) && (
                  <div className="pt-4 border-t border-outline-variant/10 text-center">
                    <p className="font-body text-sm text-on-surface-variant mb-3">
                      Are you a new provider?
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPartnerForm(true)}
                      className="btn btn-secondary w-full text-sm py-3 h-auto"
                    >
                      Apply to Join Network
                    </button>
                  </div>
                )}
              </form>
            </section>
          )}

          {/* Partner Registration Modal */}
          <PartnerRegistrationModal 
            isOpen={showPartnerForm} 
            onClose={() => setShowPartnerForm(false)} 
            initialRole={role} 
          />

          {/* ── STEP 2: Passcode PIN ── */}
          {step === 2 && (
            <section className="space-y-8">
              <header className="space-y-2">
                <span className="font-label text-xs text-tertiary uppercase tracking-[0.2em]">Security</span>
                <h3 className="font-headline text-3xl text-on-surface">
                  {isExisting ? 'Enter your passcode' : 'Create your passcode'}
                </h3>
                <p className="text-on-surface-variant text-sm">
                  {isExisting
                    ? 'Enter your 6-digit PIN to access your secure space.'
                    : 'Set a secure 6-digit PIN to protect your account.'}
                </p>
                <p className="text-on-surface font-label text-xs mt-1">{email}</p>
              </header>

              <form onSubmit={handleVerify} className="space-y-10">
                {!isExisting && (
                  <div className="space-y-4">
                    <label className="font-label text-[10px] uppercase tracking-widest text-outline">
                      Email Verification Code
                    </label>
                    <div className="flex justify-between gap-2">
                      {emailOtp.map((digit, i) => (
                        <input
                          key={`emailOtp-${i}`}
                          id={`emailOtp-${i}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={e => handleEmailOtpChange(e.target.value, i)}
                          className="w-12 h-16 sm:w-16 sm:h-20 bg-surface-container-high border-b-4 border-outline-variant focus:border-primary text-center text-2xl font-headline rounded-lg text-primary transition-all outline-none"
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {!isExisting && (
                    <label className="font-label text-[10px] uppercase tracking-widest text-outline">
                      Create 6-Digit PIN
                    </label>
                  )}
                  {/* OTP Passcode Grid */}
                  <div className="flex justify-between gap-2">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        id={`otp-${i}`}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpChange(e.target.value, i)}
                        className="w-12 h-16 sm:w-16 sm:h-20 bg-surface-container-high border-b-4 border-outline-variant focus:border-primary text-center text-2xl font-headline rounded-lg text-primary transition-all outline-none"
                      />
                    ))}
                  </div>
                </div>

                {error && <p className="text-error text-sm font-label">{error}</p>}

                <div className="flex flex-col items-center gap-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary w-full text-sm py-4 h-auto"
                  >
                    {loading ? 'Please wait…' : (isExisting ? 'Sign In' : 'Register & Enter')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(['','','','','','']); setEmailOtp(['','','','','','']); setError(''); }}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label text-[10px] uppercase tracking-widest group"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Change email
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ── STEP 3: TOTP 2FA Verification ── */}
          {step === 3 && (
            <section className="space-y-8">
              <header className="space-y-2">
                <span className="font-label text-xs text-error uppercase tracking-[0.2em]">Secure Verification</span>
                <h3 className="font-headline text-3xl text-on-surface">Authenticator App</h3>
                <p className="text-on-surface-variant text-sm">
                  {tempCreds?.mfaSetup
                    ? 'Enter this key in your Authenticator app (e.g. Google Authenticator) to generate codes:'
                    : `Your role (${tempCreds?.user.role.replace('_', ' ')}) uses two-step verification. Enter the code from your authenticator app.`}
                </p>
                {tempCreds?.mfaSetup && (
                  <div className="bg-surface-container border border-outline-variant/15 rounded-xl p-4 text-center my-3 select-all">
                    <p className="font-label text-[10px] text-outline uppercase tracking-widest">MFA Setup Key</p>
                    <p className="font-mono text-base text-primary mt-1 font-bold tracking-wider">{tempCreds?.mfaSecret}</p>
                    <p className="font-body text-[10px] text-on-surface-variant mt-2">
                      Copy the key above and add it as a "Time-based" key in Google Authenticator or Authy.
                    </p>
                  </div>
                )}
              </header>

              <form onSubmit={handleTotpSubmit} className="space-y-10">
                <div className="flex justify-between gap-2">
                  {totp.map((digit, i) => (
                    <input
                      key={`totp-${i}`}
                      id={`totp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleTotpChange(e.target.value, i)}
                      className="w-12 h-16 sm:w-16 sm:h-20 bg-surface-container-high border-b-4 border-error focus:border-error text-center text-2xl font-headline rounded-lg text-on-surface transition-all outline-none"
                    />
                  ))}
                </div>

                {error && <p className="text-error text-sm font-label">{error}</p>}

                <div className="flex flex-col items-center gap-6">
                  <button
                    type="submit"
                    className="btn btn-danger w-full text-sm py-4 h-auto"
                  >
                    Authenticate
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(2); setTotp(['','','','','','']); setError(''); }}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label text-[10px] uppercase tracking-widest group"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Cancel Login
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        {/* Atmospheric glows */}
        <div className="fixed bottom-[-10%] left-[-5%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="fixed top-[10%] right-[-5%] w-[30%] h-[30%] bg-tertiary/5 rounded-full blur-[100px] pointer-events-none" />
      </main>
    </div>
  );
}
