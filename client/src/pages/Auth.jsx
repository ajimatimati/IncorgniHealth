import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { GoogleLogin } from '@react-oauth/google';
import AppleLogin from 'react-apple-signin-auth';
import api from '../api';

const Auth = () => {
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('PATIENT');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ghostId, setGhostId] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) { setError('Enter your phone number to continue.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/signup', { phone, role });
      setGhostId(res.data.tempId ? `Your OTP: ${res.data.debugOtp}` : '');
      toast.info(`Debug OTP: ${res.data.debugOtp}`);
      setStep(2);
    } catch (err) {
      if (err.response?.data?.msg === "User already registered.") {
        setStep(2);
        toast.info('Account found. Enter your OTP to sign in.');
      } else {
        setError(err.response?.data?.msg || "Something went wrong. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { setError('Enter the 6-digit code we sent you.'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify', { phone, otp });
      const { token, refreshToken: rToken, user } = res.data;
      login(token, user);
      if (rToken) localStorage.setItem('refreshToken', rToken);

      const routes = {
        DOCTOR: '/doctor-dashboard',
        PHARMACIST: '/pharmacy-dashboard',
        RIDER: '/rider-dashboard',
        ADMIN: '/admin',
      };
      navigate(routes[user.role] || '/dashboard');
    } catch (err) {
      setError(err.response?.data?.msg || "That code didn't work. Double-check and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/google', { 
        tokenId: credentialResponse.credential, 
        role 
      });
      
      const { token, refreshToken: rToken, user } = res.data;
      login(token, user);
      if (rToken) localStorage.setItem('refreshToken', rToken);

      const routes = {
        DOCTOR: '/doctor-dashboard',
        PHARMACIST: '/pharmacy-dashboard',
        RIDER: '/rider-dashboard',
        ADMIN: '/admin',
      };
      navigate(routes[user.role] || '/dashboard');
      toast.success('Signed in securely with Google');
    } catch (err) {
      setError(err.response?.data?.msg || "Google Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAppleResponse = async (response) => {
    if (!response.authorization) {
        setError('Apple Sign-In was cancelled or failed.');
        return;
    }
    
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/apple', { 
        idToken: response.authorization.id_token, 
        role 
      });
      
      const { token, refreshToken: rToken, user } = res.data;
      login(token, user);
      if (rToken) localStorage.setItem('refreshToken', rToken);

      const routes = {
        DOCTOR: '/doctor-dashboard',
        PHARMACIST: '/pharmacy-dashboard',
        RIDER: '/rider-dashboard',
        ADMIN: '/admin',
      };
      navigate(routes[user.role] || '/dashboard');
      toast.success('Signed in securely with Apple');
    } catch (err) {
      setError(err.response?.data?.msg || "Apple Sign-In failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex text-text-primary relative overflow-hidden">
      {/* Background is handled globally in App.jsx now, but we add localized specific glows */}
      
      {/* Left brand panel — desktop only */}
      <div className="hidden lg:flex w-1/2 flex-col items-center justify-center relative z-10 px-12">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-transparent z-[-1]" />
        
        <div className="max-w-xl animate-fade-in space-y-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-action to-action-end p-[1px] shadow-glow">
            <div className="w-full h-full rounded-2xl bg-white flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="IncorgniHealth Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            Healthcare, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-action to-action-end animate-pulse-soft">
              without the stigma.
            </span>
          </h1>
          
          <p className="text-lg text-text-secondary leading-relaxed max-w-md">
            See a real doctor. Get real prescriptions. Access real support. 
            <span className="text-white font-medium"> Your identity stays yours</span> — we work with your Ghost ID instead.
          </p>

          <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-lg">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_currentColor]" />
              <span className="text-sm font-medium">End-to-end Encrypted</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/5 backdrop-blur-lg">
              <div className="w-2 h-2 rounded-full bg-action shadow-[0_0_10px_currentColor]" />
              <span className="text-sm font-medium">Zero PII Storage</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative z-10">
        <div className="w-full max-w-md animate-slide-up relative">
          
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-action to-action-end p-[1px] mx-auto mb-4 shadow-glow">
              <div className="w-full h-full rounded-xl bg-white flex items-center justify-center overflow-hidden">
                <img src="/logo.png" alt="IncorgniHealth Logo" className="w-full h-full object-cover" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-white">IncorgniHealth</h2>
          </div>

          {/* Glass Card */}
          <div className="glass-card p-8 lg:p-10 relative overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-action/20 rounded-full blur-[80px]" />
            
            <div className="relative z-10">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">
                  {step === 1 ? 'Enter securely' : 'Verify identity'}
                </h2>
                <p className="text-sm text-text-secondary">
                  {step === 1
                    ? "Your phone number is hashed instantly. We never see the raw digits."
                    : "Enter the code sent to your device."
                  }
                </p>
              </div>

              {error && (
                <div className="bg-emergency/10 border border-emergency/20 rounded-xl px-4 py-3 mb-6 animate-slide-down flex items-start gap-3">
                  <svg className="w-5 h-5 text-emergency shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-sm text-red-200">{error}</p>
                </div>
              )}

              {step === 1 ? (
                <form onSubmit={handleSignup} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Joining as</label>
                    <div className="relative">
                      <select
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        className="input-field appearance-none cursor-pointer hover:border-action/30"
                      >
                        <option value="PATIENT">Start-up Founder (Patient)</option>
                        <option value="DOCTOR">Consultant (Doctor)</option>
                        <option value="PHARMACIST">Logistics Manager (Pharmacist)</option>
                        <option value="RIDER">Delivery Partner (Rider)</option>
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+234 800 000 0000"
                      className="input-field font-mono"
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full group">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Continue
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                      </span>
                    )}
                  </button>

                  <div className="relative py-4 flex items-center justify-center">
                    <div className="absolute inset-x-0 h-px bg-white/10" />
                    <span className="relative bg-panel px-4 text-xs font-semibold uppercase tracking-wider text-text-muted">or continue with</span>
                  </div>
                  
                  <div className="flex flex-col gap-3">
                    <div className="flex justify-center w-full [&>div]:w-full overflow-hidden rounded-xl bg-white focus-within:ring-2 focus-within:ring-action">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google Sign-In was cancelled or failed.')}
                        useOneTap
                        shape="square"
                        width="100%"
                        text="continue_with"
                        theme="outline"
                        size="large"
                      />
                    </div>
                    
                    <div className="flex justify-center w-full">
                      <AppleLogin 
                        clientId="com.mcnuels.incorgnihealth.client" 
                        redirectURI="https://incorgnihealth.surge.sh/auth"
                        usePopup={true}
                        callback={handleAppleResponse}
                        scope="email name"
                        responseMode="query"
                        render={(renderProps) => (
                           <button 
                            type="button" 
                            onClick={renderProps.onClick}
                            disabled={renderProps.disabled} 
                            className="w-full h-[40px] rounded flex items-center justify-center gap-2 bg-white text-black font-semibold text-[14px] hover:bg-gray-100 transition whitespace-nowrap border border-gray-300"
                            style={{fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'}}
                        >
                            <svg className="w-5 h-5 mb-1" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M17.05 19.34a10.05 10.05 0 01-10.1-10.1A10.05 10.05 0 0117.05-.75a10.05 10.05 0 0110.1 10.1 10.05 10.05 0 01-10.1 10.09zm0-18.4A8.34 8.34 0 008.7 9.24a8.34 8.34 0 008.34 8.34 8.34 8.34 0 008.35-8.34 8.34 8.34 0 00-8.34-8.35z" fill="black" transform="translate(-5.05 5.05)"/>
                                <path d="M16.98 12.04c-.38-.28-1-.54-1.62-.57-1.12-.06-2.19.46-2.76 1.15-.55.67-.84 1.56-.84 2.5 0 1.95 1.5 3.5 3.48 3.5.76 0 1.55-.32 1.96-.5v-1.18c-.4.2-1.07.45-1.57.45-1.03 0-1.85-.73-2.07-1.7h3.83v-.68c0-.66-.4-1.32-1.03-1.74zm-3.08 1.91c.22-.65.73-1.04 1.35-1.04.57 0 1.02.29 1.15.84h-2.5v.2zM21.9 12.28h-1.1v-1.1h-1.1v1.1h-1.1v1.1h1.1v1.1h1.1v-1.1h1.1v-1.1z" />
                            </svg>
                            Continue with Apple
                          </button>
                        )}
                      />
                    </div>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-text-muted ml-1 text-center block">One-Time Code</label>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="input-field text-center text-3xl tracking-[0.5em] font-mono h-16 border-action/30 shadow-glow focus:shadow-glow-lg"
                      required
                      autoFocus
                    />
                  </div>

                  <button type="submit" disabled={loading} className="btn-primary w-full">
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Unlocking...
                      </span>
                    ) : 'Verify & Enter'}
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => { setStep(1); setError(''); setOtp(''); }}
                    className="w-full text-xs font-semibold text-text-muted hover:text-white transition text-center uppercase tracking-wider"
                  >
                    Use a different number
                  </button>
                </form>
              )}
            </div>
          </div>
          
          {/* Footer */}
          <p className="mt-8 text-center text-xs text-text-dim">
            &copy; 2026 McNuels IncorgniHealth. <br/>
            <span className="opacity-50">Designed for privacy first.</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
