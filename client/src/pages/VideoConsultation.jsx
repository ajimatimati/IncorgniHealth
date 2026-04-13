import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { io } from 'socket.io-client';

export default function VideoConsultation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [notes, setNotes]         = useState('');
  const [rxName, setRxName]       = useState('');
  const [rxDosage, setRxDosage]   = useState('');
  const [rxLoading, setRxLoading] = useState(false);
  const [rxSent, setRxSent]       = useState(false);

  const [testName, setTestName]   = useState('');
  const [invLoading, setInvLoading] = useState(false);
  const [invSent, setInvSent]     = useState(false);

  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAi, setShowAi] = useState(false);

  // WebRTC Native Implementation Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);

  useEffect(() => {
    // 1. Initialize Signaling Socket
    socketRef.current = io(import.meta.env.VITE_API_URL);
    socketRef.current.emit('join_room', id);

    const sendSignal = (signalType, payload) => {
      const content = JSON.stringify({ type: 'SIGNAL', signalType, payload });
      socketRef.current.emit('send_message', { consultationId: id, content });
    };

    // 2. Setup RTCPeerConnection
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
    peerConnectionRef.current = pc;

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) sendSignal('ICE', event.candidate);
    };

    // 3. Acquire Local Media
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setCameraActive(true);
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach(track => pc.addTrack(track, stream));
        
        // Broadcast presence
        sendSignal('READY', {});
      })
      .catch(err => {
        console.error("Camera access denied:", err);
        toast.error("Camera/Microphone permission required for P2P video.");
      });

    // 4. Handle Incoming Signals via Chat Pipeline
    socketRef.current.on('receive_message', async (msg) => {
      if (msg.senderId === user.id) return;
      try {
        const data = JSON.parse(msg.content);
        if (data.type !== 'SIGNAL') return;

        if (data.signalType === 'READY') {
          // Whoever is the DOCTOR initiates the offer upon hearing of peer's arrival
          if (user.role === 'DOCTOR') {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            sendSignal('OFFER', offer);
          }
        } else if (data.signalType === 'OFFER') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          sendSignal('ANSWER', answer);
        } else if (data.signalType === 'ANSWER') {
          await pc.setRemoteDescription(new RTCSessionDescription(data.payload));
        } else if (data.signalType === 'ICE') {
          await pc.addIceCandidate(new RTCIceCandidate(data.payload));
        }
      } catch (e) {
        // Not a JSON signal payload (normal chat string), safe to ignore here
      }
    });

    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      pc.close();
      socketRef.current?.disconnect();
    };
  }, [id, user.id, user.role, toast]);

  const endSession = async () => {
    try {
      await api.put(`/consultation/${id}/close`);
    } catch (err) {
      console.error('Failed to close consultation officially', err);
    }
    if (user?.role === 'PATIENT') {
      navigate(`/review/${id}`);
    } else {
      navigate('/doctor/dashboard');
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
      toast.success(`Prescription for ${rxName} requested.`);
      setRxName('');
      setRxDosage('');
      setTimeout(() => setRxSent(false), 3000);
    } catch (err) {
      toast.error('Unable to transmit prescription.');
    } finally {
      setRxLoading(false);
    }
  };

  const handleSendInv = async () => {
    if (!testName.trim()) return;
    setInvLoading(true);
    try {
      await api.post(`/doctor/investigate/${id}`, { tests: [testName.trim()] });
      setInvSent(true);
      toast.success(`Investigation for ${testName} requested.`);
      setTestName('');
      setTimeout(() => setInvSent(false), 3000);
    } catch (err) {
      toast.error('Unable to send clinical request.');
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
      toast.error('Diagnostic synthesis interrupted.');
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-background flex flex-col md:flex-row overflow-hidden relative">
      {/* Immersive HUD Overlay Items */}
      <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
        <div className="bg-surface-container-low/60 backdrop-blur-md border border-outline-variant/10 px-4 py-2 rounded-full flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span className="font-label text-[10px] text-on-surface uppercase tracking-[0.2em]">P2P Secure Stream</span>
        </div>
      </div>

      <div className="absolute top-6 right-6 md:right-[420px] z-50">
        <button 
          onClick={endSession}
          className="bg-error/10 hover:bg-error text-error hover:text-white border border-error/20 px-6 py-2 rounded-full font-label text-[10px] uppercase tracking-widest transition-all shadow-lg"
        >
          End Consult
        </button>
      </div>

      {/* Main Video Stage (Native WebRTC) */}
      <main className="flex-1 relative bg-surface-container-lowest flex items-center justify-center p-4 lg:p-12 overflow-hidden">
        
        {/* Remote Video Container */}
        <div className="relative w-full h-full max-w-6xl mx-auto rounded-[32px] overflow-hidden bg-black shadow-2xl shadow-primary/5 flex items-center justify-center border border-outline-variant/10">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-90"
          />
          {!remoteVideoRef.current?.srcObject && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="material-symbols-outlined text-outline text-6xl opacity-30 animate-pulse">videocam_off</span>
              <p className="font-label text-xs text-outline uppercase tracking-[0.3em] mt-4 opacity-70">Awaiting Peer Connection</p>
            </div>
          )}
        </div>

        {/* Local Picture-in-Picture */}
        <div className="absolute bottom-8 right-8 lg:right-16 lg:bottom-12 w-32 h-48 md:w-48 md:h-72 bg-surface-container-low rounded-2xl overflow-hidden border-2 border-primary/20 shadow-xl z-30">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {!cameraActive && (
             <div className="absolute inset-0 bg-surface-container-highest flex items-center justify-center">
               <span className="material-symbols-outlined text-outline text-2xl animate-spin">sync</span>
             </div>
          )}
        </div>
      </main>

      {/* Doctor Workspace Sidebar */}
      {user?.role === 'DOCTOR' && (
        <aside className="w-full md:w-[400px] bg-surface-container-low border-l border-outline-variant/10 flex flex-col h-[60vh] md:h-full shrink-0 z-40 relative">
          <header className="p-6 border-b border-outline-variant/5">
            <h2 className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mb-1">Clinical Workspace</h2>
            <p className="font-headline text-lg font-bold text-on-surface">Case Management</p>
          </header>

          <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
            {/* Notes */}
            <section className="space-y-3">
              <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Consultation Notes</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Brief clinical observations..."
                className="w-full h-32 bg-surface-container border border-outline-variant/10 rounded-2xl p-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all resize-none shadow-inner"
              />
            </section>

            {/* Prescriptions */}
            <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/10 space-y-5">
              <div className="flex items-center gap-3 border-b border-outline-variant/5 pb-3">
                <span className="material-symbols-outlined text-tertiary">pill</span>
                <h3 className="font-label text-[10px] text-tertiary uppercase tracking-widest font-black">Issue Medication</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-label text-[8px] text-outline uppercase tracking-widest">Medication</label>
                  <input
                    type="text"
                    value={rxName}
                    onChange={e => setRxName(e.target.value)}
                    placeholder="e.g. Amoxicillin"
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-tertiary/40"
                  />
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[8px] text-outline uppercase tracking-widest">Dosage Protocol</label>
                  <input
                    type="text"
                    value={rxDosage}
                    onChange={e => setRxDosage(e.target.value)}
                    placeholder="e.g. 500mg BID x 7"
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-tertiary/40 font-mono"
                  />
                </div>
                <button
                  onClick={handleSendRx}
                  disabled={rxLoading || rxSent || !rxName.trim()}
                  className={`w-full h-11 rounded-xl font-label text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
                    ${rxSent ? 'bg-primary/20 text-primary' : 'bg-tertiary text-on-tertiary'}`}
                >
                  {rxSent ? 'Transmitted' : 'Authorize Rx'}
                </button>
              </div>
            </section>

            {/* Lab Investigations */}
            <section className="bg-surface-container p-5 rounded-2xl border border-outline-variant/10 space-y-5">
              <div className="flex items-center gap-3 border-b border-outline-variant/5 pb-3">
                <span className="material-symbols-outlined text-info text-[#4fd1c5]">biotech</span>
                <h3 className="font-label text-[10px] text-[#4fd1c5] uppercase tracking-widest font-black">Order Diagnostics</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-label text-[8px] text-outline uppercase tracking-widest">Test / Panel Name</label>
                  <input
                    type="text"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                    placeholder="e.g. Comprehensive Metabolic Panel"
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:border-[#4fd1c5]/40"
                  />
                </div>
                <button
                  onClick={handleSendInv}
                  disabled={invLoading || invSent || !testName.trim()}
                  className={`w-full h-11 rounded-xl font-label text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2
                    ${invSent ? 'bg-primary/20 text-primary' : 'bg-[#4fd1c5] text-background'}`}
                >
                  {invSent ? 'Ordered' : 'Send to Lab'}
                </button>
              </div>
            </section>

            {/* AI Assistant */}
            <section className={`bg-surface-container-highest/20 p-5 rounded-2xl border transition-all ${showAi ? 'border-primary/30' : 'border-outline-variant/10'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                  <p className="font-label text-[10px] text-primary uppercase tracking-widest font-black">Clinical Synthesis</p>
                </div>
                <button onClick={() => setShowAi(!showAi)} className="font-label text-[8px] text-outline uppercase hover:text-on-surface transition-colors">
                  {showAi ? 'Hide' : 'Reveal'}
                </button>
              </div>

              {showAi ? (
                <div className="space-y-4">
                  <textarea
                    value={aiSymptoms}
                    onChange={e => setAiSymptoms(e.target.value)}
                    className="w-full h-24 bg-surface-container-low border border-outline-variant/10 rounded-xl p-3 text-xs text-on-surface focus:border-primary/40 focus:outline-none resize-none"
                    placeholder="Enter observations..."
                  />
                  <button
                    onClick={handleAiAnalyze}
                    disabled={aiLoading || !aiSymptoms.trim()}
                    className="w-full h-11 bg-primary text-on-primary rounded-xl text-[10px] font-label uppercase tracking-widest"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Run Synthesis'}
                  </button>

                  <AnimatePresence>
                    {aiResult && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4 mt-4 border-t border-outline-variant/5 space-y-4">
                        <div className="flex justify-between items-start">
                          <p className="text-sm font-bold text-on-surface leading-tight">{aiResult.diagnosis}</p>
                          <span className="text-[9px] bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                            {(aiResult.confidence * 100).toFixed(0)}% Match
                          </span>
                        </div>
                        <ul className="space-y-2">
                          {aiResult.suggestions?.map((s, idx) => (
                            <li key={idx} className="text-[11px] text-on-surface-variant flex items-start gap-2 leading-relaxed italic">
                              <span className="text-primary mt-1">•</span> {s}
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button onClick={() => setShowAi(true)} className="w-full py-4 border border-dashed border-outline-variant/20 rounded-xl font-label text-[9px] text-outline uppercase tracking-widest hover:bg-surface-container transition-all">
                  Initialize Synthesis
                </button>
              )}
            </section>
          </div>

          <footer className="p-6 border-t border-outline-variant/5">
            <button
               onClick={endSession}
               className="w-full h-12 bg-surface-container-highest text-on-surface font-label text-[9px] uppercase tracking-[0.2em] rounded-xl hover:bg-error/10 hover:text-error transition-all"
            >
               Conclude Consult
            </button>
          </footer>
        </aside>
      )}
    </div>
  );
}
