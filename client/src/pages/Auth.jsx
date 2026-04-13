import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import PartnerRegistrationModal from '../components/PartnerRegistrationModal';

const ROLES = [
  { id: 'PATIENT',       label: 'Patient',       icon: 'person'          },
  { id: 'DOCTOR',        label: 'Doctor',         icon: 'stethoscope'     },
  { id: 'PHARMACY',      label: 'Pharmacy',       icon: 'pill'            },
  { id: 'RIDER',         label: 'Rider',          icon: 'directions_bike' },
  { id: 'LAB_SCIENTIST', label: 'Lab / Imaging',  icon: 'biotech'         },
];

const ROLE_ROUTES = {
  PATIENT:       '/dashboard',
  DOCTOR:        '/doctor/dashboard',
  PHARMACY:      '/pharmacy',
  RIDER:         '/rider',
  LAB_SCIENTIST: '/lab',
};

export default function Auth() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep]       = useState(1);   // 1 = phone+role, 2 = SMS OTP, 3 = Authenticator TOTP
  const [role, setRole]       = useState('PATIENT');
  const [phone, setPhone]     = useState('');
  const [otp, setOtp]         = useState(['', '', '', '', '', '']);
  const [totp, setTotp]       = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [debugOtp, setDebugOtp] = useState('');
  const [tempCreds, setTempCreds] = useState(null);
  const [showPartnerForm, setShowPartnerForm] = useState(false);

  /* ── step 1: register / send OTP ─────────────── */
  const handleContinue = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Please enter your phone number.'); return; }
    setError('');
    setLoading(true);
    
    // MOCK LOGIN BYPASS: Simulate a successful response without the backend
    setTimeout(() => {
      setDebugOtp('123456');
      setStep(2);
      setLoading(false);
    }, 800);
  };

  /* ── step 2: verify OTP ───────────────────────── */
  const handleOtpChange = (val, idx) => {
    const next = [...otp];
    next[idx] = val.slice(-1);
    setOtp(next);
    if (val && idx < 5) document.getElementById(`otp-${idx + 1}`)?.focus();
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the full 6-digit code.'); return; }
    setError('');
    setLoading(true);

    // MOCK OTP Bypass
    setTimeout(() => {
      const mockUser = {
        id: 'mock-uuid',
        phone: phone.trim(),
        role: role,
        name: `${role.charAt(0) + role.slice(1).toLowerCase()} User` // e.g. "Doctor User"
      };
      
      const requires2FA = ['DOCTOR', 'ADMIN', 'SARC_OFFICER'].includes(role);
      
      if (requires2FA) {
        setTempCreds({ token: 'mock-jwt-token', refreshToken: 'mock-refresh', user: mockUser });
        setStep(3);
      } else {
        localStorage.setItem('refreshToken', 'mock-refresh');
        login('mock-jwt-token', mockUser);
        navigate(ROLE_ROUTES[mockUser.role] || '/dashboard');
      }
      setLoading(false);
    }, 800);
  };

  /* ── step 3: MFA / TOTP ───────────────────────── */
  const handleTotpChange = (val, idx) => {
    const next = [...totp];
    next[idx] = val.slice(-1);
    setTotp(next);
    if (val && idx < 5) document.getElementById(`totp-${idx + 1}`)?.focus();
  };

  const handleTotpSubmit = (e) => {
    e.preventDefault();
    const code = totp.join('');
    if (code.length < 6) { setError('Please enter your 6-digit Authenticator code.'); return; }
    
    // In a real app, we would verify this against the backend.
    // For this demonstration, we accept any 6 digits to prove the UX flow.
    localStorage.setItem('refreshToken', tempCreds.refreshToken);
    login(tempCreds.token, tempCreds.user);
    navigate(ROLE_ROUTES[tempCreds.user.role] || '/dashboard');
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
            <h1 className="font-headline text-xl tracking-wider text-primary uppercase">IncogniHealth</h1>
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

          {/* ── STEP 1: Phone + Role ── */}
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

                {/* Phone */}
                <div className="space-y-3">
                  <label className="font-label text-[10px] uppercase tracking-widest text-outline" htmlFor="phone">Phone Number</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-outline group-focus-within:text-primary transition-colors">
                      <span className="material-symbols-outlined">call</span>
                    </div>
                    <input
                      id="phone"
                      type="tel"
                      autoComplete="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="w-full bg-surface-container-lowest border-b-2 border-outline-variant/30 focus:border-primary py-4 pl-12 pr-4 text-on-surface font-label tracking-wider transition-all outline-none"
                    />
                  </div>
                </div>

                {error && <p className="text-error text-sm font-label">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary font-headline py-4 rounded-full text-lg shadow-lg shadow-primary/10 hover:shadow-primary/20 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? 'Please wait…' : 'Continue'}
                </button>

                {['DOCTOR', 'PHARMACY', 'LAB_SCIENTIST'].includes(role) && (
                  <div className="pt-4 border-t border-outline-variant/10 text-center">
                    <p className="font-body text-sm text-on-surface-variant mb-3">
                      Are you a new provider?
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowPartnerForm(true)}
                      className="w-full bg-surface-container-low border border-primary/20 text-primary font-headline py-3 rounded-full text-sm hover:bg-primary/5 transition-all"
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

          {/* ── STEP 2: OTP Verification ── */}
          {step === 2 && (
            <section className="space-y-8">
              <header className="space-y-2">
                <span className="font-label text-xs text-tertiary uppercase tracking-[0.2em]">Verification</span>
                <h3 className="font-headline text-3xl text-on-surface">Enter the code</h3>
                <p className="text-on-surface-variant text-sm">
                  We sent a 6-digit code to{' '}
                  <span className="text-on-surface font-label">{phone}</span>
                </p>
                {/* Dev mode hint */}
                {debugOtp && (
                  <div className="bg-tertiary/10 border border-tertiary/20 rounded-xl px-4 py-3 mt-2">
                    <p className="font-label text-[10px] text-tertiary uppercase tracking-widest">Test Mode — OTP</p>
                    <p className="font-headline text-2xl font-black text-on-surface tracking-[0.3em] mt-1">{debugOtp}</p>
                  </div>
                )}
              </header>

              <form onSubmit={handleVerify} className="space-y-10">
                {/* OTP Grid */}
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpChange(e.target.value, i)}
                      className="w-12 h-16 sm:w-16 sm:h-20 bg-surface-container-high border-b-4 border-outline-variant focus:border-primary text-center text-2xl font-headline rounded-lg text-primary transition-all outline-none"
                    />
                  ))}
                </div>

                {error && <p className="text-error text-sm font-label">{error}</p>}

                <div className="flex flex-col items-center gap-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-on-primary font-headline py-4 rounded-full text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                  >
                    {loading ? 'Verifying…' : 'Verify & Continue'}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setStep(1); setOtp(['','','','','','']); setError(''); setDebugOtp(''); }}
                    className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors font-label text-[10px] uppercase tracking-widest group"
                  >
                    <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                    Change number
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
                  Your role (<strong className="text-on-surface">{tempCreds?.user.role.replace('_', ' ')}</strong>) uses two-step verification. Enter the code from your authenticator app.
                </p>
                <div className="bg-error/10 border border-error/20 rounded-xl px-4 py-3 mt-2">
                  <p className="font-label text-[10px] text-error uppercase tracking-widest">Test Mode</p>
                  <p className="font-body text-xs text-error mt-1 opacity-80">Enter ANY 6 digits to bypass.</p>
                </div>
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
                    className="w-full bg-error text-white font-headline py-4 rounded-full text-lg shadow-lg hover:brightness-110 active:scale-[0.98] transition-all"
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
