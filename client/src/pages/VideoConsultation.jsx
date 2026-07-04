import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { supabase } from '../supabase';

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

  // Mic/Cam Toggles
  const [micMuted, setMicMuted] = useState(false);
  const [camOff, setCamOff] = useState(false);
  const [showWorkspace, setShowWorkspace] = useState(true);

  const toggleMic = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setMicMuted(!micMuted);
      toast.success(micMuted ? "Microphone active" : "Microphone muted");
    }
  };

  const toggleCam = () => {
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setCamOff(!camOff);
      toast.success(camOff ? "Camera active" : "Camera muted");
    }
  };

  useEffect(() => {
    // 1. Initialize WebRTC Signaling Channel via Supabase Realtime
    const channel = supabase.channel(`webrtc-${id}`);

    const sendSignal = (signalType, payload) => {
      // Send message via Supabase Broadcast
      channel.send({ type: 'broadcast', event: 'SIGNAL', payload: { signalType, payload, senderId: user.id } });
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

    // 4. Handle Incoming Signals via Supabase Channel
    channel.on('broadcast', { event: 'SIGNAL' }, async (payload) => {
      const data = payload.payload;
      if (data.senderId === user.id) return; // Ignore our own signals

      try {
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
        console.error('WebRTC error parsing signal', e);
      }
    });

    channel.subscribe();
    socketRef.current = channel;

    return () => {
      if (localVideoRef.current?.srcObject) {
        localVideoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
      pc.close();
      supabase.removeChannel(channel);
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
    <div className="h-screen w-full bg-[#010101] flex flex-col md:flex-row overflow-hidden relative select-none">
      
      {/* Immersive HUD Overlay Title */}
      <div className="absolute top-6 left-6 z-40 flex items-center gap-3">
        <div className="bg-[#010101]/60 backdrop-blur-xl border border-white/5 px-4 py-2 rounded-full flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
          <span className="font-mono text-[9px] text-white/50 uppercase tracking-[0.2em] font-semibold">P2P Encrypted Tunnel</span>
        </div>
      </div>

      {/* Main FaceTime-style stream stage */}
      <main className="flex-1 relative bg-black flex items-center justify-center p-4 overflow-hidden h-full">
        {/* Remote full viewport video */}
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black flex items-center justify-center border border-white/5 shadow-2xl">
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover opacity-90"
          />
          {!remoteVideoRef.current?.srcObject && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center animate-pulse">
                <span className="material-symbols-outlined text-white/30 text-2xl">videocam_off</span>
              </div>
              <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.3em]">Awaiting clinical peer connection</p>
            </div>
          )}
        </div>

        {/* Local Feed PIP (floating rounded capsule) */}
        <div className="absolute bottom-6 right-6 w-28 h-40 md:w-44 md:h-64 rounded-3xl overflow-hidden border border-white/15 shadow-2xl z-30 bg-black">
          <video 
            ref={localVideoRef} 
            autoPlay 
            playsInline 
            muted 
            className="w-full h-full object-cover transform scale-x-[-1]" 
          />
          {!cameraActive && (
             <div className="absolute inset-0 bg-[#010101]/80 flex flex-col items-center justify-center gap-2">
               <div className="w-5 h-5 border border-white/20 border-t-white rounded-full animate-spin" />
               <span className="font-mono text-[8px] text-white/40 uppercase tracking-wider">Syncing feed</span>
             </div>
          )}
        </div>
      </main>

      {/* Doctor Floating Case Management Sidebar */}
      {user?.role === 'DOCTOR' && (
        <AnimatePresence>
          {showWorkspace && (
            <motion.aside 
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute right-6 top-24 bottom-24 w-[380px] bg-black/40 backdrop-blur-3xl border border-white/5 rounded-[2.5rem] flex flex-col h-[70vh] md:h-auto shrink-0 z-40 shadow-2xl overflow-hidden bento-glass"
            >
              <header className="p-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
                <div>
                  <h2 className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold mb-0.5">Clinical Desk</h2>
                  <p className="font-sans text-sm font-bold text-white">Case Management</p>
                </div>
                <button onClick={() => setShowWorkspace(false)} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </header>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {/* Observations Note */}
                <section className="space-y-2">
                  <label className="font-mono text-[9px] text-white/40 uppercase tracking-widest font-semibold">Consultation Log Notes</label>
                  <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Document diagnostic notes..."
                    className="input-field h-24 py-3 text-xs resize-none"
                  />
                </section>

                {/* Medication Prescribe */}
                <section className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <span className="material-symbols-outlined text-white/50 text-sm">pill</span>
                    <h3 className="font-mono text-[9px] text-white/50 uppercase tracking-widest font-bold">Authorize Medication</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Medication Name</label>
                      <input
                        type="text"
                        value={rxName}
                        onChange={e => setRxName(e.target.value)}
                        placeholder="e.g. Amoxicillin"
                        className="input-field py-2 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Dosage Routine</label>
                      <input
                        type="text"
                        value={rxDosage}
                        onChange={e => setRxDosage(e.target.value)}
                        placeholder="e.g. 500mg BID x 7"
                        className="input-field py-2 text-xs font-mono"
                      />
                    </div>
                    <button
                      onClick={handleSendRx}
                      disabled={rxLoading || rxSent || !rxName.trim()}
                      className={`w-full h-10 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${rxSent ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black hover:bg-white/95'}`}
                    >
                      {rxSent ? 'Transmitted' : 'Authorize Prescription'}
                    </button>
                  </div>
                </section>

                {/* Diagnostic Tests */}
                <section className="bg-white/[0.02] border border-white/5 p-5 rounded-[2rem] space-y-4">
                  <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                    <span className="material-symbols-outlined text-white/50 text-sm">biotech</span>
                    <h3 className="font-mono text-[9px] text-white/50 uppercase tracking-widest font-bold">Order Diagnostic Lab</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Panel / Test Name</label>
                      <input
                        type="text"
                        value={testName}
                        onChange={e => setTestName(e.target.value)}
                        placeholder="e.g. STI Blood Panel"
                        className="input-field py-2 text-xs"
                      />
                    </div>
                    <button
                      onClick={handleSendInv}
                      disabled={invLoading || invSent || !testName.trim()}
                      className={`w-full h-10 rounded-full font-sans text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2
                        ${invSent ? 'bg-white/10 text-white border border-white/20' : 'bg-white text-black hover:bg-white/95'}`}
                    >
                      {invSent ? 'Ordered' : 'Send directive to Lab'}
                    </button>
                  </div>
                </section>

                {/* AI Assistant */}
                <section className={`bg-white/[0.02] border p-5 rounded-[2rem] space-y-4 transition-all ${showAi ? 'border-white/20' : 'border-white/5'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                      <p className="font-mono text-[9px] text-white uppercase tracking-widest font-bold">Clinical Synthesis</p>
                    </div>
                    <button onClick={() => setShowAi(!showAi)} className="font-mono text-[8px] text-white/50 uppercase hover:text-white transition-colors">
                      {showAi ? 'Hide' : 'Reveal'}
                    </button>
                  </div>

                  {showAi ? (
                    <div className="space-y-3">
                      <textarea
                        value={aiSymptoms}
                        onChange={e => setAiSymptoms(e.target.value)}
                        className="input-field h-20 py-2.5 text-xs resize-none"
                        placeholder="Describe observations..."
                      />
                      <button
                        onClick={handleAiAnalyze}
                        disabled={aiLoading || !aiSymptoms.trim()}
                        className="w-full h-10 bg-white text-black font-sans text-[10px] font-bold uppercase tracking-wider rounded-full hover:bg-white/95"
                      >
                        {aiLoading ? 'Synthesizing...' : 'Run Synthesis'}
                      </button>

                      <AnimatePresence>
                        {aiResult && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-3 border-t border-white/5 space-y-3">
                            <div className="flex justify-between items-start">
                              <p className="text-xs font-bold text-white leading-tight">{aiResult.diagnosis}</p>
                              <span className="text-[8px] font-mono bg-white/10 text-white px-2 py-0.5 rounded-full border border-white/20">
                                {(aiResult.confidence * 100).toFixed(0)}% Match
                              </span>
                            </div>
                            <ul className="space-y-1.5">
                              {aiResult.suggestions?.map((s, idx) => (
                                <li key={idx} className="text-[10px] text-white/60 flex items-start gap-2 leading-relaxed">
                                  <span className="text-white mt-1">•</span> {s}
                                </li>
                              ))}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <button onClick={() => setShowAi(true)} className="w-full py-3.5 border border-dashed border-white/15 hover:border-white/30 rounded-2xl font-mono text-[8px] text-white/40 uppercase tracking-widest hover:bg-white/5 transition-all">
                      Initialize AI Assistant
                    </button>
                  )}
                </section>
              </div>

              <footer className="p-6 border-t border-white/5">
                <button
                   onClick={endSession}
                   className="w-full h-12 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white font-sans text-xs font-bold uppercase tracking-wider rounded-full transition-all"
                >
                   Conclude Session
                </button>
              </footer>
            </motion.aside>
          )}
        </AnimatePresence>
      )}

      {/* Floating FaceTime HUD bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-[#010101]/60 backdrop-blur-xl border border-white/5 px-6 py-3.5 rounded-full shadow-2xl">
        <button 
          onClick={toggleMic} 
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
            micMuted 
              ? 'bg-red-500/15 border-red-500/30 text-red-400' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-base">{micMuted ? 'mic_off' : 'mic'}</span>
        </button>

        <button 
          onClick={toggleCam} 
          className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
            camOff 
              ? 'bg-red-500/15 border-red-500/30 text-red-400' 
              : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
          }`}
        >
          <span className="material-symbols-outlined text-base">{camOff ? 'videocam_off' : 'videocam'}</span>
        </button>

        {user?.role === 'DOCTOR' && (
          <button 
            onClick={() => setShowWorkspace(!showWorkspace)} 
            className={`w-10 h-10 rounded-full flex items-center justify-center border transition-all ${
              showWorkspace 
                ? 'bg-white border-white text-black' 
                : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
            }`}
          >
            <span className="material-symbols-outlined text-base">clinical_feasibility</span>
          </button>
        )}

        <button 
          onClick={endSession} 
          className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white transition-all shadow-lg active:scale-95 border border-red-500/30"
        >
          <span className="material-symbols-outlined text-base">call_end</span>
        </button>
      </div>

    </div>
  );
}
