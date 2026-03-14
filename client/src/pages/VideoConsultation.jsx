import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { motion } from 'framer-motion';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { Pill, Check } from 'lucide-react';
import api from '../api';

const Icons = {
  pill:   <Pill className="w-5 h-5 shrink-0 text-[#00D4B8]" strokeWidth={1.5} />,
  check:  <Check className="w-4 h-4" strokeWidth={2} />,
};

const JITSI_CONFIG = {
  startWithAudioMuted: false,
  disableModeratorIndicator: true,
  startScreenSharing: false,
  enableEmailInStats: false,
  prejoinPageEnabled: false, // Jump straight in
  disableDeepLinking: true,
  defaultLanguage: 'en',
};

const JITSI_INTERFACE_CONFIG = {
  DISABLE_JOIN_LEAVE_NOTIFICATIONS: true,
  SHOW_JITSI_WATERMARK: false,
  SHOW_BRAND_WATERMARK: false,
  SHOW_POWERED_BY: false,
  DEFAULT_LOGO_URL: '',
  DEFAULT_WELCOME_PAGE_LOGO_URL: '',
  HIDE_DEEP_LINKING_LOGO: true,
  TOOLBAR_BUTTONS: [
    'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
    'fodeviceselection', 'hangup', 'profile', 'chat', 'settings',
    'videoquality', 'filmstrip', 'shortcuts', 'tileview'
  ],
};

const VideoConsultation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [notes, setNotes]         = useState('');
  const [rxName, setRxName]       = useState('');
  const [rxDosage, setRxDosage]   = useState('');
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSent, setRxSent]       = useState(false);

  // Investigation State
  const [testName, setTestName]   = useState('');
  const [invLoading, setInvLoading] = useState(false);
  const [invSent, setInvSent]     = useState(false);

  // AI State
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  // Derive a unique, secure room name based on the consultation ID
  // e.g., "IncorgniHealth-Consult-abc123xyz"
  const roomName = `IncorgniHealth-Consult-${id || 'demo'}`;

  const endSession = async () => {
    try {
      await api.put(`/consultation/${id}/close`);
    } catch (err) {
      console.error('Failed to close consultation officially', err);
    }
    if (user?.role === 'PATIENT') {
      navigate(`/review/${id}`);
    } else {
      navigate('/doctor-dashboard');
    }
  };

  const handleSendRx = async () => {
    if (!rxName.trim() || !rxDosage.trim()) return;
    setRxLoading(true);
    try {
      await api.post('/ai/prescribe', {
        consultationId: id,
        medication:     rxName.trim(),
        dosage:         rxDosage.trim(),
        instructions:   'Take as directed by physician',
      });
      setRxSent(true);
      toast.success(`Prescription for "${rxName}" sent to pharmacy.`);
      setRxName('');
      setRxDosage('');
      setTimeout(() => setRxSent(false), 3000);
    } catch (err) {
      const msg = err.response?.data?.msg || 'Failed to send prescription. Try again.';
      toast.error(msg);
    } finally {
      setRxLoading(false);
    }
  };

  const handleSendInv = async () => {
    if (!testName.trim()) return;
    setInvLoading(true);
    try {
      await api.post(`/doctor/investigate/${id}`, {
        tests: [testName.trim()]
      });
      setInvSent(true);
      toast.success(`Investigation for "${testName}" requested.`);
      setTestName('');
      setTimeout(() => setInvSent(false), 3000);
    } catch (err) {
      toast.error('Failed to request investigation.');
    } finally {
      setInvLoading(false);
    }
  };

  const handleAiAnalyze = async () => {
    if (!aiSymptoms.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const res = await api.post('/ai/analyze', { symptoms: aiSymptoms });
      setAiResult(res.data);
    } catch (err) {
      toast.error('AI analysis failed. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="h-[100dvh] w-full bg-[#040B14] flex flex-col md:flex-row overflow-hidden font-sans"
    >
      {/* ── Jitsi Video Area ── */}
        <div className="absolute inset-0 z-0 bg-dots opacity-20 pointer-events-none" />
        <JitsiMeeting
          domain="meet.jit.si"
          roomName={roomName}
          configOverwrite={JITSI_CONFIG}
          interfaceConfigOverwrite={JITSI_INTERFACE_CONFIG}
          userInfo={{
            displayName: user?.nickname || user?.publicId || (user?.role === 'DOCTOR' ? 'Doctor' : 'Client'),
            email: ''
          }}
          onApiReady={(externalApi) => {
            externalApi.addListener('videoConferenceLeft', () => {
              endSession();
            });
          }}
          getIFrameRef={(iframeRef) => {
            iframeRef.style.height = 'calc(100% - 24px)';
            iframeRef.style.width = 'calc(100% - 24px)';
            iframeRef.style.margin = '12px';
            iframeRef.style.borderRadius = '24px';
            iframeRef.style.border = '1px solid rgba(255,255,255,0.1)';
            iframeRef.style.overflow = 'hidden';
          }}
        />
      </div>

      {/* ── Doctor Sidebar ── */}
      {user?.role === 'DOCTOR' && (
        <div className="w-full md:w-[400px] bg-[#0A0A0A] border-l border-white/5 flex flex-col h-[50vh] md:h-full shrink-0 z-10 font-sans">
        <div className="p-5 bento-glass !bg-white/5 border-b border-white/5 mb-4">
          <h2 className="text-[10px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Clinical Command
          </h2>
          <p className="text-[9px] text-gray-500 mt-1 uppercase tracking-widest font-mono">Session_ID: {id?.slice(0,8)}</p>
        </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {/* Notes Section */}
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-white/5 pb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Observation Notes
              </label>
              <textarea
                className="w-full h-32 bg-[#111] border border-white/10 text-white p-3 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-500/50 focus:bg-blue-900/10 transition-all font-mono leading-relaxed"
                placeholder="Client presents with..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>

            {/* Auto-Prescribe System */}
            <div className="bento-glass p-5 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 glow-point opacity-10 translate-x-10 translate-y-[-10px]" style={{ '--glow-color': '#00D4B8' }} />
              
              <h3 className="text-[10px] font-black text-[#00D4B8] uppercase tracking-widest mb-4 flex items-center gap-2 pb-3 border-b border-white/5">
                {Icons.pill} Prescription Protocol
              </h3>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Medication</label>
                  <input
                    type="text"
                    value={rxName}
                    onChange={e => setRxName(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-white p-3 rounded-xl text-xs focus:outline-none focus:border-[#00D4B8]/50 transition-all"
                    placeholder="e.g. Doxycycline"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Dosage Pattern</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={e => setRxDosage(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 text-[#00D4B8] font-mono font-bold p-3 rounded-xl text-xs focus:outline-none focus:border-[#00D4B8]/50 transition-all"
                    placeholder="e.g. 100mg BID x 7"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSendRx}
                    disabled={rxLoading || rxSent || !rxName.trim() || !rxDosage.trim()}
                    className={`w-full py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                      rxSent 
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                        : 'bg-[#00D4B8] hover:bg-[#00E5C8] border border-[#00D4B8] text-[#040B14] shadow-[0_0_20px_rgba(0,212,184,0.2)]'
                    }`}
                  >
                    {rxSent ? 'Dispatched' : 'Issue Rx'}
                  </button>
                </div>
              </div>
            </div>

            {/* AI Clinical Decision Support */}
            <div className={`bento-glass p-5 rounded-3xl relative overflow-hidden transition-all duration-300 ${showAi ? ' ring-1 ring-blue-500/30' : ''}`}>
              <div className="absolute top-0 right-0 w-24 h-24 glow-point opacity-10" style={{ '--glow-color': '#3B82F6' }} />
              
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/5">
                <h3 className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" /> Diagnostic Copilot
                </h3>
                <button onClick={() => setShowAi(!showAi)} className="text-[9px] font-black text-gray-500 hover:text-white uppercase">
                  {showAi ? 'Minimize' : 'Expand'}
                </button>
              </div>

              {showAi ? (
                <div className="space-y-4 relative z-10">
                  <textarea
                    value={aiSymptoms}
                    onChange={e => setAiSymptoms(e.target.value)}
                    className="w-full h-24 bg-white/5 border border-white/10 text-white p-3 rounded-xl text-xs focus:outline-none focus:border-blue-500/50 transition-all font-mono resize-none"
                    placeholder="Enter clinical observations..."
                  />
                  <button
                    onClick={handleAiAnalyze}
                    disabled={aiLoading || !aiSymptoms.trim()}
                    className="w-full py-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Run Analysis'}
                  </button>

                  <AnimatePresence>
                    {aiResult && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
                        <div className="flex justify-between items-start">
                          <p className="text-[13px] font-black text-white leading-tight">{aiResult.diagnosis}</p>
                          <span className="text-[9px] font-mono bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full border border-blue-500/20">
                            CONF: {(aiResult.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Protocol Path</p>
                          <ul className="space-y-2">
                            {aiResult.suggestions?.map((s, idx) => (
                              <li key={idx} className="text-[11px] text-gray-300 flex items-start gap-2 leading-relaxed">
                                <span className="w-1 h-1 rounded-full bg-blue-500 mt-1.5 shrink-0" /> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button onClick={() => setShowAi(true)} className="w-full py-3 text-[10px] font-black text-gray-500 border border-dashed border-white/10 rounded-xl hover:bg-white/5 transition-all uppercase tracking-widest">
                  Initialize Copilot
                </button>
              )}
            </div>

            {/* Lab/Imaging Request System */}
            <div className="bg-[#111] border border-white/10 p-5 rounded-xl shadow-2xl relative overflow-hidden group">
              <h3 className="text-[10px] font-bold text-[#D97706] uppercase tracking-widest mb-4 flex items-center gap-2 pb-3 border-b border-white/5">
                <span className="text-[#D97706]">●</span> Diagnostic Intel — Lab/Imaging Request
              </h3>

              <div className="space-y-4 relative z-10">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Required Investigation</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-white/10 text-white p-3 rounded text-sm focus:outline-none focus:border-[#D97706]/50 focus:ring-1 focus:ring-[#D97706]/30 transition-all font-mono"
                    placeholder="e.g. Pelvic Ultrasound"
                  />
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleSendInv}
                    disabled={invLoading || invSent || !testName.trim()}
                    className={`w-full py-3 px-4 rounded font-bold uppercase tracking-widest text-[10px] transition-all flex items-center justify-center gap-2 ${
                      invSent 
                        ? 'bg-[#D97706]/20 text-[#D97706] border border-[#D97706]/50'
                        : 'bg-[#D97706] hover:bg-[#B45309] border border-[#D97706] text-white shadow-[0_0_16px_rgba(217,119,6,0.3)]'
                    } disabled:opacity-40`}
                  >
                    {invLoading ? 'Transmitting...' : invSent ? 'Requested' : 'Send Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-white/5">
            <button
               onClick={endSession}
               className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded transition-colors"
            >
               Return to Command
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default VideoConsultation;
