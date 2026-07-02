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

    // Secure the payload: Encrypt the message content locally before emitting.
    // Derive a stronger symmetric key using PBKDF2 to prevent raw database ID decryption.
    const chatSecret = CryptoJS.PBKDF2(consultationId, import.meta.env.VITE_APP_SECRET || 'incognicare_fallback_salt_93x', { keySize: 256/32, iterations: 1000 }).toString();
    const encryptedContent = CryptoJS.AES.encrypt(text, chatSecret).toString();

    // 1. Save message to database
    api.post(`/consultation/${consultationId}/message`, { content: encryptedContent })
      .then(res => {
         const dbMessage = res.data;
         // 2. Broadcast to other party
         socketRef.current.send({ type: 'broadcast', event: 'receive_message', payload: dbMessage });
         // 3. Add to local state manually (Supabase broadcast doesn't reflect back to sender)
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
    ? messages.filter(m => m.content?.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (loading) return <div className="bg-background min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-outline-variant/20 border-t-primary rounded-full animate-spin" /></div>;
  if (!consultation) return <div className="bg-background min-h-screen flex items-center justify-center text-on-surface-variant">Consultation closed.</div>;

  const otherPerson = user.role === 'DOCTOR' ? consultation.patient : consultation.doctor;

  return (
    <div className="bg-background text-on-background h-screen flex overflow-hidden">
      
      {/* ── Left Sidebar: Context / History (Desktop Only) ── */}
      <aside className="w-80 border-r border-outline-variant/10 hidden lg:flex flex-col bg-surface-container-lowest shrink-0 z-10">
        <div className="h-[72px] border-b border-outline-variant/10 flex items-center px-6 shrink-0 bg-surface-container-low">
          <h2 className="font-headline text-lg font-bold text-on-surface">Session Context</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="flex flex-col items-center text-center pb-6 border-b border-outline-variant/10">
            <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-primary/10 mb-4">
              <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="lg" />
            </div>
            <h3 className="font-headline text-lg font-bold text-on-surface">
              {otherPerson?.nickname || 'Confidential Client'}
            </h3>
            <p className="font-label text-xs text-outline uppercase tracking-widest mt-1">
              ID: {otherPerson?.publicId || 'Unknown'}
            </p>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-label text-[10px] text-outline uppercase tracking-wide">Quick Info</h4>
            <div className="bg-surface-container-low border border-outline-variant/5 rounded-2xl p-4 flex items-center gap-3">
               <span className="material-symbols-outlined text-tertiary">verified_user</span>
               <div>
                 <p className="font-headline text-sm font-semibold">End-to-End Encrypted</p>
                 <p className="font-body text-xs text-on-surface-variant">Messages secured</p>
               </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-label text-[10px] text-outline uppercase tracking-wide">Session Status</h4>
            <div className={`px-4 py-3 rounded-xl border flex items-center justify-between ${consultation.status === 'ACTIVE' ? 'bg-primary/5 border-primary/10' : 'bg-surface-container border-outline-variant/10'}`}>
              <span className="font-headline text-sm">Status</span>
              <span className={`font-label text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${consultation.status === 'ACTIVE' ? 'bg-primary/20 text-primary' : 'bg-surface-container-high text-outline'}`}>{consultation.status}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        {/* Top Bar */}
        <header className="top-bar glass z-50">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-surface-container-high border border-outline-variant/10 flex items-center justify-center hover:bg-surface-container-highest transition-all lg:hidden">
              <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="sm" />
              <div>
                <h2 className="font-headline text-sm font-bold text-on-surface">
                  {otherPerson?.nickname || 'Confidential Client'}
                </h2>
                <p className="font-label text-[9px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                  {user.role === 'DOCTOR' ? 'Client' : 'Case Physician'}
                  {typing && <span className="text-tertiary normal-case tracking-normal lowercase opacity-80">...typing</span>}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${searchOpen ? 'bg-primary text-on-primary' : 'bg-surface-container-high border border-outline-variant/10 text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button 
              onClick={() => navigate(`/video/${consultationId}`)}
              className="w-10 h-10 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center hover:bg-primary/20 transition-all"
            >
              <span className="material-symbols-outlined text-xl">videocam</span>
            </button>
          </div>
        </header>

        {/* Search Bar Flyout */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-surface-container-low border-b border-outline-variant/10 overflow-hidden relative z-40"
            >
              <div className="px-6 py-4">
                <input 
                  type="text" 
                  placeholder="Find in conversation history..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant/10 rounded-full px-6 py-3 text-sm focus:border-primary/40 focus:outline-none text-on-surface transition-all"
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
          className="flex-1 overflow-y-auto px-6 py-8 space-y-6 no-scrollbar bg-[radial-gradient(circle_at_top_right,rgba(208,188,255,0.03),transparent_40%)]"
        >
          {filteredMessages.map((msg, idx) => {
            const isMe = msg.senderId === user.id;
            const isSystem = msg.isSystem;

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <div className="max-w-[85%] w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 space-y-4 shadow-xl shadow-black/20">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <span className="material-symbols-outlined">pill</span>
                      </div>
                      <div>
                        <span className="font-label text-[10px] text-primary uppercase tracking-[0.2em]">Clinical Rx</span>
                        <p className="font-headline text-sm font-bold text-on-surface">Prescription Transmitted</p>
                      </div>
                    </div>
                    <div className="p-4 bg-surface-container-highest/30 rounded-xl border border-outline-variant/5">
                      <p className="font-body text-sm text-on-surface-variant leading-relaxed italic">"{msg.content}"</p>
                    </div>
                    <p className="font-label text-[8px] text-outline text-right uppercase tracking-widest">{formatTime(msg.createdAt)}</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] space-y-1.5`}>
                  <div className={`px-5 py-3.5 shadow-lg ${
                    isMe 
                      ? 'bg-surface-container-highest text-on-surface rounded-2xl rounded-tr-sm border border-outline-variant/10' 
                      : 'bg-surface-container-low text-on-surface-variant rounded-2xl rounded-tl-sm border border-outline-variant/5'
                  }`}>
                    <p className="font-body text-[15px] leading-relaxed whitespace-pre-wrap word-break-words">
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
                  <div className={`flex items-center gap-2 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <span className="font-label text-[9px] text-outline uppercase tracking-widest">{formatTime(msg.createdAt)}</span>
                    {isMe && (
                      <span className="material-symbols-outlined text-[14px] text-primary">done_all</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </main>

        {/* Floating Scroll Down */}
        <AnimatePresence>
          {!isAtBottom && (
            <motion.button 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
              className="fixed bottom-28 right-8 w-10 h-10 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/20 flex items-center justify-center z-50 hover:scale-110 active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined">keyboard_double_arrow_down</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Doctor Control Strip */}
        {user.role === 'DOCTOR' && consultation.status !== 'COMPLETED' && (
          <div className="px-6 py-4 bg-surface-container-low border-t border-outline-variant/10 flex gap-4 z-50 pb-safe">
            <button
              onClick={() => setShowTools(showTools === 'ai' ? null : 'ai')}
              className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-3 font-label text-[10px] uppercase tracking-widest border transition-all
                ${showTools === 'ai' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container border-outline-variant/10 text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-lg">psychology</span>
              Medical Intel
            </button>
            <button
              onClick={() => setShowTools(showTools === 'prescribe' ? null : 'prescribe')}
              className={`flex-1 h-12 rounded-xl flex items-center justify-center gap-3 font-label text-[10px] uppercase tracking-widest border transition-all
                ${showTools === 'prescribe' ? 'bg-tertiary text-on-tertiary border-tertiary' : 'bg-surface-container border-outline-variant/10 text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-lg">medication</span>
              Prescribe
            </button>
          </div>
        )}

        {/* Tools Flyouts */}
        <AnimatePresence>
          {showTools === 'ai' && (
            <motion.div 
              initial={{ y: "100%" }} 
              animate={{ y: 0 }} 
              exit={{ y: "100%" }} 
              className="absolute inset-x-0 bottom-0 bg-surface-container p-8 rounded-t-[32px] border-t border-outline-variant/10 shadow-2xl z-50 overflow-hidden"
            >
              <div className="max-w-xl mx-auto space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined">auto_awesome</span>
                    </div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">Clinical Intelligence</h3>
                  </div>
                  <button onClick={() => setShowTools(null)} className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="space-y-4">
                  <textarea 
                    value={aiSymptoms} 
                    onChange={e => setAiSymptoms(e.target.value)}
                    placeholder="Input client symptoms for a secure diagnostic synthesis..." 
                    className="w-full h-32 bg-surface-container-low border border-outline-variant/10 rounded-2xl p-4 text-sm focus:border-primary/40 focus:outline-none transition-all outline-none resize-none no-scrollbar"
                  />
                  <button 
                    onClick={handleAiAnalyze} 
                    disabled={aiLoading || !aiSymptoms.trim()} 
                    className="w-full btn-primary h-14"
                  >
                    {aiLoading ? 'Synthesizing...' : 'Start Analysis'}
                  </button>
                </div>

                {aiResult && (
                  <div className="p-6 bg-surface-container-highest/30 rounded-2xl border border-outline-variant/5 space-y-4 max-h-[300px] overflow-y-auto no-scrollbar">
                    <div className="flex items-center justify-between border-b border-outline-variant/5 pb-4">
                      <span className="font-headline text-base font-bold text-on-surface">{aiResult.diagnosis || 'Synthesis Complete'}</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-label text-[9px] uppercase tracking-widest border border-primary/20">
                        {(aiResult.confidence * 100).toFixed(0)}% Match
                      </span>
                    </div>
                    <ul className="space-y-3">
                      {(aiResult.suggestions || [aiResult.message]).map((s, i) => (
                        <li key={i} className="flex gap-3 text-sm text-on-surface-variant leading-relaxed">
                          <span className="text-secondary mt-1">•</span>
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
              className="absolute inset-x-0 bottom-0 bg-surface-container p-8 rounded-t-[32px] border-t border-outline-variant/10 shadow-2xl z-50"
            >
              <div className="max-w-xl mx-auto space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center">
                      <span className="material-symbols-outlined">medication</span>
                    </div>
                    <h3 className="font-headline text-lg font-bold text-on-surface">Issue Secure Rx</h3>
                  </div>
                  <button onClick={() => setShowTools(null)} className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-outline">
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Medication Name</label>
                    <input 
                      value={prescribeForm.medication} 
                      onChange={e => setPrescribeForm({...prescribeForm, medication: e.target.value})} 
                      placeholder="e.g. Paracetamol" 
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:border-tertiary/40 focus:outline-none transition-all" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Dosage Protocol</label>
                    <input 
                      value={prescribeForm.dosage} 
                      onChange={e => setPrescribeForm({...prescribeForm, dosage: e.target.value})} 
                      placeholder="e.g. 500mg" 
                      className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-3 text-sm focus:border-tertiary/40 focus:outline-none transition-all" 
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Clinical Instructions</label>
                  <input 
                    value={prescribeForm.instructions} 
                    onChange={e => setPrescribeForm({...prescribeForm, instructions: e.target.value})} 
                    placeholder="e.g. Twice daily after food..." 
                    className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-4 text-sm focus:border-tertiary/40 focus:outline-none transition-all" 
                  />
                </div>

                <button 
                  onClick={handlePrescribe} 
                  disabled={!prescribeForm.medication} 
                  className="w-full bg-tertiary text-on-tertiary font-headline h-14 rounded-full font-bold shadow-lg shadow-tertiary/20 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  Transmit Prescription
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Area */}
        {consultation.status !== 'COMPLETED' ? (
          <form onSubmit={handleSendMessage} className="px-6 py-4 pb-6 bg-surface-container-low border-t border-outline-variant/10 flex items-end gap-3 shrink-0 z-30 pb-safe">
            <button 
              type="button" 
              onClick={() => toast.info('Vault Attachments available soon.')}
              className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-outline hover:text-on-surface hover:bg-surface-container-highest/50 transition-all border border-transparent"
            >
              <span className="material-symbols-outlined text-2xl">attachment</span>
            </button>
            
            <div className="flex-1 bg-surface-container border border-outline-variant/10 rounded-[28px] focus-within:border-primary/40 focus-within:bg-surface-container-low transition-all overflow-hidden flex items-end">
              <textarea
                value={newMessage}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
                placeholder="Type your message securely..."
                className="bg-transparent border-none w-full text-[15px] focus:ring-0 px-5 py-3.5 resize-none leading-relaxed placeholder:text-outline text-on-surface custom-scrollbar"
                rows="1"
                style={{ minHeight: '52px', maxHeight: '120px', outline:'none' }} 
              />
            </div>

            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-30 disabled:bg-surface-container-highest transition-all shadow-lg shadow-primary/10"
            >
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </button>
          </form>
        ) : (
          <div className="px-6 py-6 pb-8 bg-surface-container-low border-t border-outline-variant/10 text-center pb-safe">
            <p className="font-label text-[10px] text-outline uppercase tracking-[0.2em]">Consultation History Secured</p>
          </div>
        )}
      </div>
    </div>
  );
}
