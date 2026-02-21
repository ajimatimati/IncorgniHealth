import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  back: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>,
  send: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>,
  clip: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" /></svg>,
  check: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>,
  doubleCheck: <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5M12 9l6 6 9-13.5" /></svg>,
  sparkles: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" /></svg>,
  pill: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>,
  close: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>,
  down: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>,
};

const ChatRoom = () => {
  const { id: consultationId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  // State
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [consultation, setConsultation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Doctor Tools
  const [showTools, setShowTools] = useState(false); // 'ai', 'prescribe', or null
  const [aiSymptoms, setAiSymptoms] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [prescribeForm, setPrescribeForm] = useState({ medication: '', dosage: '', instructions: '' });

  // Refs
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  
  // ─── EFFECTS ───
  useEffect(() => {
    if (!user) { navigate('/auth'); return; }

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/consultation/${consultationId}`);
        setConsultation(res.data);
        setMessages(res.data.messages || []);
      } catch {
        toast.error('Could not load this conversation.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();

    const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const authToken = localStorage.getItem('token');
    socketRef.current = io(serverUrl, { auth: { token: authToken } });
    socketRef.current.emit('join_room', consultationId);

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      if (document.hidden) document.title = '💬 New message — IncorgniHealth';
    });

    socketRef.current.on('typing', () => setTyping(true));
    socketRef.current.on('stop_typing', () => setTyping(false));

    return () => {
      socketRef.current.disconnect();
    };
  }, [consultationId, user, navigate, toast]);

  // Auto-scroll on new message if already at bottom
  useEffect(() => {
    if (isAtBottom && !searchQuery) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAtBottom, searchQuery]);

  // ─── HANDLERS ───
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socketRef.current.emit('send_message', {
      consultationId,
      senderId: user.id,
      content: newMessage,
    });
    socketRef.current.emit('stop_typing', consultationId);
    setNewMessage('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) {
      socketRef.current.emit('typing', consultationId);
    } else {
      socketRef.current.emit('stop_typing', consultationId);
    }
  };

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    setIsAtBottom(atBottom);
  };

  const handleAiAnalyze = async () => {
    if (!aiSymptoms.trim()) return;
    setAiLoading(true);
    try {
      const res = await api.post('/ai/analyze', { symptoms: aiSymptoms });
      setAiResult(res.data);
    } catch {
      toast.error('AI analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrescribe = async () => {
    const { medication, dosage, instructions } = prescribeForm;
    if (!medication) return;
    try {
      await api.post('/ai/prescribe', {
        consultationId,
        medication,
        dosage,
        instructions: instructions || 'Take as directed',
      });
      toast.success('Prescription issued.');
      setShowTools(null);
      setPrescribeForm({ medication: '', dosage: '', instructions: '' });
    } catch {
      toast.error('Failed to issue prescription.');
    }
  };

  // ─── RENDER HELPERS ───
  const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const formatDateSeparator = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    if (d.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const filteredMessages = searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-2 border-action/30 border-t-action rounded-full animate-spin" /></div>;
  if (!consultation) return <div className="p-8 text-center text-text-muted">Conversation not found.</div>;

  const otherPerson = user.role === 'DOCTOR' ? consultation.patient : consultation.doctor;
  let lastDate = null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[100dvh]"
    >
      {/* ─── Header ─── */}
      <div className="px-5 py-3 bg-secondary/95 backdrop-blur-sm border-b border-white/5 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="w-8 h-8 rounded-lg hover:bg-white/5 flex items-center justify-center text-text-muted transition">
            {Icons.back}
          </button>
          <div className="relative">
            <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="sm" />
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-secondary" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-sm text-text-primary truncate">
              {otherPerson?.nickname || otherPerson?.publicId || 'Unknown'}
            </h2>
            <p className="text-xs text-text-dim flex items-center gap-1">
              {user.role === 'DOCTOR' ? 'Patient' : 'Doctor'}
              {typing && <span className="text-action animate-pulse">• typing...</span>}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button 
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition ${searchOpen ? 'bg-action text-white' : 'text-text-muted hover:bg-white/5'}`}
          >
            {Icons.search}
          </button>
          
          {consultation.status !== 'COMPLETED' && (
            <button
               onClick={async () => {
                 try { await api.put(`/consultation/${consultationId}/close`); toast.success('Ended.'); navigate(-1); } 
                 catch { toast.error('Error ending chat.'); }
               }}
               className="ml-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
            >
              End
            </button>
          )}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      {searchOpen && (
        <div className="px-5 py-2 bg-surface border-b border-white/5 animate-slide-down">
          <input 
            type="text" 
            placeholder="Search messages..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full text-sm h-9"
            autoFocus
          />
        </div>
      )}

      {/* ─── Messages ─── */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-5 py-4 space-y-2 scroll-smooth">
         {filteredMessages.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-text-dim pb-20 opacity-50">
             <div className="w-16 h-16 rounded-2xl bg-surface-alt flex items-center justify-center mb-4 text-3xl opacity-50">
               💭
             </div>
             <p className="text-sm">No messages yet</p>
           </div>
         )}

         {filteredMessages.map((msg, idx) => {
           const isMe = msg.senderId === user.id;
           const isSystem = msg.isSystem;
           const msgDate = formatDateSeparator(msg.createdAt);
           const showDate = msgDate !== lastDate;
           if (showDate) lastDate = msgDate;

           return (
             <div key={msg.id || idx}>
               {showDate && (
                 <div className="flex items-center justify-center my-6 opacity-60">
                   <div className="h-px w-8 bg-white/10" />
                   <span className="px-3 text-[10px] text-text-dim font-medium uppercase tracking-wider">{msgDate}</span>
                   <div className="h-px w-8 bg-white/10" />
                 </div>
               )}

               {isSystem ? (
                 <div className="flex justify-center my-4">
                   <div className="glass-card-glow max-w-sm w-full p-4 border border-emerald-500/30 bg-emerald-500/5">
                     <div className="flex items-center gap-2 mb-2">
                       <span className="text-emerald-400">{Icons.pill}</span>
                       <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Prescription</span>
                     </div>
                     <p className="text-sm text-text-secondary leading-relaxed">{msg.content}</p>
                     <p className="text-[10px] text-text-dim mt-2 text-right">{formatTime(msg.createdAt)}</p>
                   </div>
                 </div>
               ) : (
                 <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                   <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 relative shadow-sm transition-all ${
                     isMe 
                       ? 'bg-action text-white rounded-br-none hover:brightness-110' 
                       : 'bg-surface border border-white/10 text-text-on-surface rounded-bl-none hover:bg-surface-alt'
                   }`}>
                     <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                     <div className={`flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-white/60' : 'text-text-dim'}`}>
                       <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                       {isMe && (
                         <span title="Read">
                           {/* Simulated read receipt: assume read if older than 1 min or if not at bottom */}
                           {idx < messages.length - 1 ? Icons.doubleCheck : Icons.check}
                         </span>
                       )}
                     </div>
                   </div>
                 </div>
               )}
             </div>
           );
         })}
         <div ref={messagesEndRef} />
      </div>

      {/* ─── Scroll Button ─── */}
      {!isAtBottom && !searchQuery && (
        <button 
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-5 w-10 h-10 bg-action rounded-full shadow-lg shadow-action/30 flex items-center justify-center text-white z-30 animate-scale-in"
        >
          {Icons.down}
        </button>
      )}

      {/* ─── Doctor Tools ─── */}
      {user.role === 'DOCTOR' && consultation.status !== 'COMPLETED' && (
        <div className="px-5 py-2 bg-secondary/95 border-t border-white/5 flex gap-2">
          <button
            onClick={() => setShowTools(showTools === 'ai' ? null : 'ai')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showTools === 'ai' ? 'bg-accent-purple/20 text-accent-purple' : 'bg-surface text-text-muted hover:text-text-primary'
            }`}
          >
            {Icons.sparkles} AI Assist
          </button>
          <button
            onClick={() => setShowTools(showTools === 'prescribe' ? null : 'prescribe')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showTools === 'prescribe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface text-text-muted hover:text-text-primary'
            }`}
          >
            {Icons.pill} Prescribe
          </button>
        </div>
      )}

      {/* AI Panel */}
      {showTools === 'ai' && (
        <div className="bg-secondary/95 border-t border-white/5 p-4 animate-slide-up relative">
           <button onClick={() => setShowTools(null)} className="absolute top-2 right-2 p-1 text-text-dim hover:text-white">{Icons.close}</button>
           <h4 className="text-xs font-bold text-accent-purple mb-2 uppercase tracking-wider flex items-center gap-1">
             {Icons.sparkles} AI Assistant
           </h4>
           <div className="flex gap-2">
            <input 
              value={aiSymptoms} onChange={e => setAiSymptoms(e.target.value)}
              placeholder="Enter symptoms for AI analysis... (e.g. fever, headache)" className="input-field text-sm flex-1"
            />
            <RippleButton onClick={handleAiAnalyze} disabled={aiLoading || !aiSymptoms.trim()} className="text-sm px-4">
              {aiLoading ? '...' : 'Analyze'}
            </RippleButton>
          </div>
          {aiResult && (
            <div className="mt-4 p-3 rounded-xl bg-accent-purple/5 border border-accent-purple/20">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-bold text-accent-purple">{aiResult.diagnosis || 'Analysis'}</span>
                {aiResult.confidence && <span className="text-[10px] bg-accent-purple/20 px-2 py-0.5 rounded text-accent-purple">{(aiResult.confidence * 100).toFixed(0)}%</span>}
              </div>
              <p className="text-xs text-text-secondary leading-relaxed">{aiResult.suggestions?.join(', ') || aiResult.message || 'No specific suggestions found.'}</p>
            </div>
          )}
        </div>
      )}

      {/* Prescribe Panel */}
      {showTools === 'prescribe' && (
         <div className="bg-secondary/95 border-t border-white/5 p-4 animate-slide-up relative">
           <button onClick={() => setShowTools(null)} className="absolute top-2 right-2 p-1 text-text-dim hover:text-white">{Icons.close}</button>
           <h4 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider flex items-center gap-1">
             {Icons.pill} E-Prescription
           </h4>
           <div className="grid grid-cols-2 gap-2 mb-2">
             <input value={prescribeForm.medication} onChange={e => setPrescribeForm({...prescribeForm, medication: e.target.value})} placeholder="Medication Details" className="input-field text-sm" />
             <input value={prescribeForm.dosage} onChange={e => setPrescribeForm({...prescribeForm, dosage: e.target.value})} placeholder="Dosage (e.g. 500mg)" className="input-field text-sm" />
           </div>
           <input value={prescribeForm.instructions} onChange={e => setPrescribeForm({...prescribeForm, instructions: e.target.value})} placeholder="Instructions (e.g. Take twice daily after meals)" className="input-field text-sm mb-3 w-full" />
           <RippleButton onClick={handlePrescribe} disabled={!prescribeForm.medication} className="w-full justify-center">
              Send Prescription securely
           </RippleButton>
         </div>
      )}

      {/* ─── Input Area ─── */}
      {consultation.status !== 'COMPLETED' ? (
        <form onSubmit={handleSendMessage} className="px-5 py-4 bg-secondary border-t border-white/5 flex items-end gap-3 shrink-0">
          <button 
            type="button" 
            onClick={() => toast.info('Attachments coming soon')}
            className="p-2 text-text-dim hover:text-text-muted transition rounded-full hover:bg-white/5"
          >
            {Icons.clip}
          </button>
          <div className="flex-1 bg-surface border border-white/10 rounded-2xl flex items-center px-4 py-2 focus-within:border-action/50 transition-colors">
            <textarea
              value={newMessage}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type a message..."
              className="bg-transparent border-none w-full text-sm text-text-primary placeholder:text-text-dim focus:ring-0 p-0 resize-none max-h-24"
              rows="1"
              style={{ minHeight: '24px' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="p-3 bg-action text-white rounded-xl shadow-lg shadow-action/20 disabled:opacity-50 disabled:shadow-none hover:scale-105 transition-transform"
          >
            {Icons.send}
          </button>
        </form>
      ) : (
        <div className="p-6 text-center bg-secondary">
          <p className="text-text-muted text-sm">Consultation completed.</p>
        </div>
      )}
    </motion.div>
  );
};

export default ChatRoom;
