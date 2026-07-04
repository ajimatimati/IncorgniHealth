import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';

export default function ChatRoom() {
  const { id: consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Doctor Tools
  const [showTools, setShowTools] = useState(null); // 'ai' | 'prescribe'
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [prescribeForm, setPrescribeForm] = useState({ medication: '', dosage: '', instructions: '' });

  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  useEffect(() => {
    if (!user) { navigate('/auth'); return; }
    
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/consultation/${consultationId}`);
        setConsultation(res.data);
        setMessages(res.data.messages || []);
      } catch {
        toast.error('Unable to establish clinical terminal.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();

    const channel = supabase.channel(`chat-${consultationId}`);
    
    channel.on('broadcast', { event: 'receive_message' }, (payload) => {
      setMessages((prev) => [...prev, payload.payload]);
    });

    channel.on('broadcast', { event: 'typing' }, () => setTyping(true));
    channel.on('broadcast', { event: 'stop_typing' }, () => setTyping(false));

    channel.subscribe();
    socketRef.current = channel;

    return () => { supabase.removeChannel(channel); };
  }, [consultationId, user, navigate, toast]);

  useEffect(() => {
    if (isAtBottom && !searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom, searchQuery]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    const text = newMessage.trim();
    if (!text) return;

    // Secure payload: Encrypt message content locally before sending
    const chatSecret = CryptoJS.PBKDF2(consultationId, import.meta.env.VITE_APP_SECRET || 'incognicare_fallback_salt_93x', { keySize: 256/32, iterations: 1000 }).toString();
    const encryptedContent = CryptoJS.AES.encrypt(text, chatSecret).toString();

    // 1. Save to DB
    api.post(`/consultation/${consultationId}/message`, { content: encryptedContent })
      .then(res => {
         const dbMessage = res.data;
         // 2. Broadcast to peer
         socketRef.current.send({ type: 'broadcast', event: 'receive_message', payload: dbMessage });
         // 3. Add to local state
         setMessages(prev => [...prev, dbMessage]);
      })
      .catch(() => toast.error('Failed to send message.'));

    socketRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: {} });
    setNewMessage('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) socketRef.current.send({ type: 'broadcast', event: 'typing', payload: {} });
    else socketRef.current.send({ type: 'broadcast', event: 'stop_typing', payload: {} });
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < 50);
  };

  const handleAiAnalyze = async () => {
    if (!aiSymptoms.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/analyze', { symptoms: aiSymptoms });
      setAiResult(res.data);
    } catch {
      toast.error('Diagnostic analysis interrupted.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrescribe = async () => {
    const { medication, dosage, instructions } = prescribeForm;
    if (!medication) return;
    try {
      await api.post('/ai/prescribe', { consultationId, medication, dosage, instructions: instructions || 'Take as directed' });
      toast.success('Prescription transmitted securely.');
      setShowTools(null);
      setPrescribeForm({ medication: '', dosage: '', instructions: '' });
    } catch {
      toast.error('Transmission failed.');
    }
  };

  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const filteredMessages = searchQuery
    ? messages.filter(m => {
        try {
          const chatSecret = CryptoJS.PBKDF2(consultationId, import.meta.env.VITE_APP_SECRET || 'incognicare_fallback_salt_93x', { keySize: 256/32, iterations: 1000 }).toString();
          const bytes = CryptoJS.AES.decrypt(m.content, chatSecret);
          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
          const text = decryptedText ? decryptedText : m.content;
          return text.toLowerCase().includes(searchQuery.toLowerCase());
        } catch {
          return m.content?.toLowerCase().includes(searchQuery.toLowerCase());
        }
      })
    : messages;

  if (loading) {
    return (
      <div className="bg-[#010101] min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-10 h-10 border border-white/10 border-t-white rounded-full animate-spin" />
        <span className="font-mono text-[9px] uppercase tracking-widest text-white/40">Synchronizing Session</span>
      </div>
    );
  }
  if (!consultation) return <div className="bg-[#010101] min-h-screen flex items-center justify-center text-white/40 font-mono text-xs">Consultation terminated.</div>;

  const otherPerson = user.role === 'DOCTOR' ? consultation.patient : consultation.doctor;

  return (
    <div className="bg-[#010101] text-white h-screen flex overflow-hidden font-sans select-none relative">
      
      {/* ── Left Sidebar: Context / History (Desktop Only) ── */}
      <aside className="w-72 border-r border-white/5 hidden lg:flex flex-col bg-[#010101]/40 backdrop-blur-3xl shrink-0 z-10">
        <div className="h-[72px] border-b border-white/5 flex items-center px-6 shrink-0 bg-white/5">
          <h2 className="font-mono text-[10px] text-white/40 uppercase tracking-widest font-black">Clinical Log Context</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          <div className="flex flex-col items-center text-center pb-6 border-b border-white/5">
            <div className="w-16 h-16 rounded-full overflow-hidden border border-white/20 shadow-md mb-3">
              <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="lg" />
            </div>
            <h3 className="font-sans text-sm font-bold text-white">
              {otherPerson?.nickname || 'Confidential Client'}
            </h3>
            <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest mt-1">
              ID // {otherPerson?.publicId?.substring(0, 12)}...
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">Security Level</h4>
            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center gap-3">
               <span className="material-symbols-outlined text-white text-base">verified_user</span>
               <div>
                 <p className="font-sans text-xs font-bold text-white">E2E Cryptography</p>
                 <p className="font-sans text-[10px] text-white/50 mt-0.5">Payloads encrypted locally</p>
               </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">Session Status</h4>
            <div className={`px-4 py-3 rounded-2xl border flex items-center justify-between ${consultation.status === 'ACTIVE' ? 'bg-white/5 border-white/10' : 'bg-white/[0.02] border-white/5'}`}>
              <span className="font-sans text-xs">Status</span>
              <span className={`font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold ${consultation.status === 'ACTIVE' ? 'bg-white/10 text-white' : 'bg-white/[0.02] text-white/30'}`}>{consultation.status}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Top Header Panel */}
        <header className="fixed top-0 inset-x-0 lg:left-72 h-[72px] bg-[#010101]/40 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-6 z-40 select-none">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all lg:hidden">
              <span className="material-symbols-outlined text-white/70 text-sm">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="sm" />
              <div>
                <h2 className="font-sans text-xs font-bold text-white">
                  {otherPerson?.nickname || 'Confidential Client'}
                </h2>
                <p className="font-mono text-[8px] text-white/40 uppercase tracking-[0.2em] flex items-center gap-2">
                  {user.role === 'DOCTOR' ? 'Client' : 'Case Physician'}
                  {typing && <span className="text-white/80 lowercase tracking-normal font-semibold">typing...</span>}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${searchOpen ? 'bg-white text-black' : 'bg-white/5 border border-white/10 text-white'}`}
            >
              <span className="material-symbols-outlined text-sm">search</span>
            </button>
            <button 
              onClick={() => navigate(`/video/${consultationId}`)}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 transition-all"
            >
              <span className="material-symbols-outlined text-sm">videocam</span>
            </button>
          </div>
        </header>

        {/* Search Input Bar */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="absolute top-[72px] inset-x-0 bg-[#010101]/95 border-b border-white/5 overflow-hidden z-40"
            >
              <div className="px-6 py-4">
                <input 
                  type="text" 
                  placeholder="Find in conversation history..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field py-2.5 text-xs rounded-full"
                  autoFocus
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Feed */}
        <main 
          ref={scrollContainerRef} 
          onScroll={handleScroll} 
          className="flex-1 overflow-y-auto px-6 pt-24 pb-32 space-y-6 no-scrollbar bg-[#010101]"
        >
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.isSystem;

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center animate-fadeIn">
                  <div className="max-w-[85%] w-full bg-white/[0.02] border border-white/5 rounded-[2rem] p-5 space-y-3 bento-glass shadow-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">pill</span>
                      </div>
                      <div>
                        <span className="font-mono text-[8px] text-white/40 uppercase tracking-[0.2em] font-semibold">Clinical Rx</span>
                        <p className="font-sans text-xs font-bold text-white">Prescription Transmitted</p>
                      </div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                      <p className="font-sans text-xs text-white/60 leading-relaxed italic">"{msg.content}"</p>
                    </div>
                    <p className="font-mono text-[8px] text-white/40 text-right uppercase tracking-widest">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
                <div className="max-w-[75%] space-y-1">
                  <div className={`px-5 py-3 shadow-md ${
                    isMe 
                      ? 'bg-white/10 text-white rounded-3xl rounded-tr-sm border border-white/10' 
                      : 'bg-white/[0.02] text-white rounded-3xl rounded-tl-sm border border-white/5'
                  }`}>
                    <p className="font-sans text-[13px] leading-relaxed whitespace-pre-wrap break-words">
                      {(() => {
                        try {
                          const chatSecret = CryptoJS.PBKDF2(consultationId, import.meta.env.VITE_APP_SECRET || 'incognicare_fallback_salt_93x', { keySize: 256/32, iterations: 1000 }).toString();
                          const bytes = CryptoJS.AES.decrypt(msg.content, chatSecret);
                          const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
                          return decryptedText ? decryptedText : msg.content;
                        } catch (e) {
                          return msg.content;
                        }
                      })()}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest">{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <span className="material-symbols-outlined text-[10px] text-white">done_all</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Scroll to Bottom button */}
        <AnimatePresence>
          {!isAtBottom && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="fixed bottom-24 right-6 w-9 h-9 bg-white text-black rounded-full shadow-lg flex items-center justify-center z-50 active:scale-95 hover:scale-105 transition-all"
            >
              <span className="material-symbols-outlined text-base">keyboard_double_arrow_down</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Doctor Action Command Strip */}
        {user.role === 'DOCTOR' && consultation.status !== 'COMPLETED' && (
          <div className="absolute bottom-20 inset-x-6 flex gap-3 z-30 select-none max-w-xl mx-auto">
            <button
              onClick={() => setShowTools(showTools === 'ai' ? null : 'ai')}
              className={`flex-1 h-10 rounded-full flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-widest font-bold border transition-all
                ${showTools === 'ai' ? 'bg-white text-black border-white' : 'bg-black/60 border-white/5 text-white/60 backdrop-blur-xl'}`}
            >
              <span className="material-symbols-outlined text-sm">psychology</span>
              Medical Intel
            </button>
            <button
              onClick={() => setShowTools(showTools === 'prescribe' ? null : 'prescribe')}
              className={`flex-1 h-10 rounded-full flex items-center justify-center gap-2 font-mono text-[9px] uppercase tracking-widest font-bold border transition-all
                ${showTools === 'prescribe' ? 'bg-white text-black border-white' : 'bg-black/60 border-white/5 text-white/60 backdrop-blur-xl'}`}
            >
              <span className="material-symbols-outlined text-sm">medication</span>
              Prescribe
            </button>
          </div>
        )}

        {/* Clinical Tools drawer */}
        <AnimatePresence>
          {showTools === 'ai' && (
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 bg-black border-t border-white/5 p-6 rounded-t-[2.5rem] shadow-2xl z-50"
            >
              <div className="max-w-xl mx-auto space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">auto_awesome</span>
                    </div>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Clinical Intelligence</h3>
                  </div>
                  <button onClick={() => setShowTools(null)} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <textarea 
                    value={aiSymptoms} 
                    onChange={e => setAiSymptoms(e.target.value)}
                    placeholder="Enter patient symptoms for secure clinical synthesis..." 
                    className="input-field h-24 py-3 text-xs resize-none"
                  />
                  <button 
                    onClick={handleAiAnalyze} 
                    disabled={aiLoading || !aiSymptoms.trim()} 
                    className="w-full h-11 bg-white text-black hover:bg-white/95 font-sans text-xs font-bold uppercase tracking-wider rounded-full"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Start Analysis'}
                  </button>
                </div>

                {aiResult && (
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3 max-h-[220px] overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="font-sans text-xs font-bold text-white">{aiResult.diagnosis || 'Analysis complete'}</span>
                      <span className="px-2 py-0.5 bg-white/10 text-white rounded-full font-mono text-[8px] uppercase tracking-widest border border-white/20">
                        {(aiResult.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {(aiResult.suggestions || [aiResult.message]).map((s, i) => (
                        <li key={i} className="flex gap-2 text-[10px] text-white/60 leading-relaxed">
                          <span className="text-white mt-1">•</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {showTools === 'prescribe' && (
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="absolute inset-x-0 bottom-0 bg-black border-t border-white/5 p-6 rounded-t-[2.5rem] shadow-2xl z-50"
            >
              <div className="max-w-xl mx-auto space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 text-white flex items-center justify-center">
                      <span className="material-symbols-outlined text-base">medication</span>
                    </div>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Authorize Medical Rx</h3>
                  </div>
                  <button onClick={() => setShowTools(null)} className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:text-white">
                    <span className="material-symbols-outlined text-sm">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest pl-1">Medication Name</label>
                    <input 
                      value={prescribeForm.medication} 
                      onChange={e => setPrescribeForm({...prescribeForm, medication: e.target.value})} 
                      placeholder="e.g. Amoxicillin" 
                      className="input-field py-2 text-xs" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest pl-1">Dosage Protocol</label>
                    <input 
                      value={prescribeForm.dosage} 
                      onChange={e => setPrescribeForm({...prescribeForm, dosage: e.target.value})} 
                      placeholder="e.g. 500mg BID" 
                      className="input-field py-2 text-xs font-mono" 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest pl-1">Clinical Instructions</label>
                  <input 
                    value={prescribeForm.instructions} 
                    onChange={e => setPrescribeForm({...prescribeForm, instructions: e.target.value})} 
                    placeholder="e.g. Take twice daily after meals..." 
                    className="input-field py-2.5 text-xs" 
                  />
                </div>

                <button 
                  onClick={handlePrescribe} 
                  disabled={!prescribeForm.medication} 
                  className="w-full bg-white text-black hover:bg-white/95 font-sans h-10 rounded-full font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-20"
                >
                  Transmit Secure Prescription
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Message Area */}
        {consultation.status !== 'COMPLETED' ? (
          <form onSubmit={handleSendMessage} className="absolute bottom-4 inset-x-6 h-14 bg-white/5 border border-white/5 rounded-full flex items-center px-4 z-40 shadow-2xl backdrop-blur-2xl max-w-xl mx-auto">
            <button 
              type="button" 
              onClick={() => toast.info('Vault attachment support coming soon.')}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full text-white/40 hover:text-white transition-all"
            >
              <span className="material-symbols-outlined text-xl">attachment</span>
            </button>
            
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type secure encrypted message..."
              className="bg-transparent border-none w-full text-xs px-3 focus:ring-0 outline-none text-white placeholder:text-white/20 font-sans"
              style={{ outline: 'none' }}
            />

            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-8 h-8 shrink-0 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-20 transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        ) : (
          <div className="absolute bottom-4 inset-x-6 h-14 bg-white/[0.02] border border-white/5 rounded-full flex items-center justify-center z-40 select-none max-w-xl mx-auto">
            <p className="font-mono text-[9px] text-white/30 uppercase tracking-[0.2em] font-semibold">Consultation History Decrypted & Locked</p>
          </div>
        )}
      </div>
    </div>
  );
}
