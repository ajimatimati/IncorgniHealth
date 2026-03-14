import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import BreathingSkeleton from '../components/BreathingSkeleton';
import { ChevronLeft, Send, Search, Paperclip, Check, CheckCheck, Sparkles, Pill, X, ChevronDown } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  back: <ChevronLeft className="w-5 h-5 shrink-0" strokeWidth={2} />,
  send: <Send className="w-5 h-5 shrink-0" strokeWidth={2} />,
  search: <Search className="w-5 h-5 shrink-0" strokeWidth={2} />,
  clip: <Paperclip className="w-5 h-5 shrink-0" strokeWidth={2} />,
  check: <Check className="w-3 h-3 shrink-0" strokeWidth={3} />,
  doubleCheck: <CheckCheck className="w-3 h-3 shrink-0" strokeWidth={3} />,
  sparkles: <Sparkles className="w-4 h-4 shrink-0" strokeWidth={2} />,
  pill: <Pill className="w-5 h-5 shrink-0" strokeWidth={2} />,
  close: <X className="w-5 h-5 shrink-0" strokeWidth={2} />,
  down: <ChevronDown className="w-6 h-6 shrink-0" strokeWidth={2} />,
};

const ChatRoom = () => {
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
  const [showTools, setShowTools] = useState(null);
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
        toast.error('Could not access this consultation.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();

    const serverUrl = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3001';
    const authToken = localStorage.getItem('token');
    socketRef.current = io(serverUrl, { auth: { token: authToken } });
    socketRef.current.emit('join_room', consultationId);

    socketRef.current.on('receive_message', (message) => {
      setMessages((prev) => [...prev, message]);
      if (document.hidden) document.title = '💬 New Log — IncorgniHealth';
    });

    socketRef.current.on('typing', () => setTyping(true));
    socketRef.current.on('stop_typing', () => setTyping(false));

    return () => socketRef.current.disconnect();
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

    const optimisticMsg = {
      id: `opt-${Date.now()}`,
      consultationId,
      senderId: user.id,
      content: text,
      createdAt: new Date().toISOString(),
      isRead: false,
      isSystem: false,
    };
    setMessages(prev => [...prev, optimisticMsg]);

    socketRef.current.emit('send_message', { consultationId, senderId: user.id, content: text });
    socketRef.current.emit('stop_typing', consultationId);
    setNewMessage('');
  };

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);
    if (e.target.value.trim()) socketRef.current.emit('typing', consultationId);
    else socketRef.current.emit('stop_typing', consultationId);
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
      toast.error('Analysis failed.');
    } finally {
      setAiLoading(false);
    }
  };

  const handlePrescribe = async () => {
    const { medication, dosage, instructions } = prescribeForm;
    if (!medication) return;
    try {
      await api.post('/ai/prescribe', { consultationId, medication, dosage, instructions: instructions || 'Take as directed' });
      toast.success('Prescription issued.');
      setShowTools(null);
      setPrescribeForm({ medication: '', dosage: '', instructions: '' });
    } catch {
      toast.error('Failed to issue prescription.');
    }
  };

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

  if (loading) return (
    <div className="flex flex-col h-[100dvh] bg-[#F8F7F6]">
      <div className="px-6 py-4 bg-white border-b border-[#E8E6E3] flex items-center gap-4 shrink-0 shadow-sm">
         <BreathingSkeleton className="w-10 h-10 rounded-full bg-[#18181B]/10" />
         <div className="space-y-2">
            <BreathingSkeleton className="w-32 h-4 rounded-full bg-[#18181B]/10" />
            <BreathingSkeleton className="w-20 h-3 rounded-full bg-[#18181B]/10" />
         </div>
      </div>
      <div className="flex-1 p-6 space-y-6 flex flex-col">
         <BreathingSkeleton className="w-2/3 h-16 rounded-br-2xl rounded-tr-2xl rounded-tl-2xl bg-white self-start" />
         <BreathingSkeleton className="w-3/4 h-24 rounded-bl-2xl rounded-tr-2xl rounded-tl-2xl bg-[#F0FDF4] self-end" />
      </div>
    </div>
  );
  if (!consultation) return <div className="p-8 text-center text-[#A1A1AA] flex items-center justify-center h-screen bg-[#F8F7F6]">Consultation not found.</div>;

  const otherPerson = user.role === 'DOCTOR' ? consultation.patient : consultation.doctor;
  let lastDate = null;

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="flex flex-col h-[100dvh] bg-[#F8F7F6] text-[#18181B]"
    >
      {/* ─── Header ─── */}
      <div className="px-6 py-4 bg-white border-b border-[#E8E6E3] flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="w-10 h-10 border border-[#E8E6E3] rounded-full hover:bg-[#F4F4F5] flex items-center justify-center transition-colors">
            {Icons.back}
          </button>
          <div className="flex items-center gap-3">
            <AvatarGenerator seed={otherPerson?.avatar || otherPerson?.publicId} size="sm" />
            <div>
              <h2 className="font-bold text-[#18181B] leading-tight">
                {otherPerson?.nickname || `Client ${otherPerson?.publicId.substring(0,6)}`}
              </h2>
              <p className="text-[11px] text-[#A1A1AA] uppercase tracking-wider flex items-center gap-2 mt-0.5">
                {user.role === 'DOCTOR' ? 'Client' : 'Consulting Physician'}
                {typing && <span className="text-[#6D28D9] font-medium animate-pulse normal-case tracking-normal">...typing</span>}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => { setSearchOpen(!searchOpen); setSearchQuery(''); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${searchOpen ? 'bg-[#18181B] text-white' : 'bg-white border border-[#E8E6E3] hover:bg-[#F4F4F5]'}`}
          >
            {Icons.search}
          </button>
          {consultation.status !== 'COMPLETED' && (
            <button
               onClick={async () => {
                 try { await api.put(`/consultation/${consultationId}/close`); toast.success('Consultation Concluded.'); navigate(-1); } 
                 catch { toast.error('Error concluding consultation.'); }
               }}
               className="px-4 py-2 border border-[#E8E6E3] rounded-full text-[#71717A] text-xs font-semibold hover:bg-[#FEE2E2] hover:text-[#DC2626] hover:border-[#FECACA] transition-colors"
            >
              End Consult
            </button>
          )}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white border-b border-[#E8E6E3] overflow-hidden shadow-sm z-10"
          >
            <div className="px-6 py-4">
              <input 
                type="text" 
                placeholder="Search conversation..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F4F4F5] rounded-xl px-4 py-3 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#6D28D9] transition-all"
                autoFocus
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Messages ─── */}
      <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6 scroll-smooth">
         {filteredMessages.length === 0 && (
           <div className="h-full flex flex-col items-center justify-center text-[#A1A1AA] p-8">
             <p className="text-sm">This is the beginning of your clinical history.</p>
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
                 <div className="flex items-center justify-center my-8">
                   <div className="h-px w-12 bg-[#E8E6E3]" />
                   <span className="px-4 text-xs text-[#A1A1AA] font-semibold">{msgDate}</span>
                   <div className="h-px w-12 bg-[#E8E6E3]" />
                 </div>
               )}

               {isSystem ? (
                 <div className="flex justify-center my-6">
                   <div className="w-full max-w-sm p-5 bg-white rounded-2xl border border-[#E8E6E3] shadow-card-sm text-center">
                     <div className="w-10 h-10 rounded-full bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center mx-auto mb-3">
                       {Icons.pill}
                     </div>
                     <span className="block text-xs font-bold text-[#6D28D9] uppercase tracking-wider mb-2">Prescription Issued</span>
                     <p className="text-[14px] text-[#18181B] leading-relaxed mb-4">{msg.content}</p>
                     <p className="text-[11px] text-[#A1A1AA]">{formatTime(msg.createdAt)}</p>
                   </div>
                 </div>
               ) : (
                 <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group mb-1.5`}>
                   <div className={`max-w-[80%] md:max-w-[65%] px-5 py-3.5 shadow-sm text-[15px] leading-relaxed ${
                     isMe 
                       ? 'bg-[#18181B] text-white rounded-t-2xl rounded-bl-2xl rounded-br-sm' 
                       : 'bg-white border border-[#E8E6E3] text-[#18181B] rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                   }`}>
                     <p className="whitespace-pre-wrap">{msg.content}</p>
                     <div className={`flex items-center justify-end gap-1.5 mt-1.5`}>
                       <span className={`text-[10px] ${isMe ? 'text-white/60' : 'text-[#A1A1AA]'}`}>{formatTime(msg.createdAt)}</span>
                       {isMe && (
                         <span className={`${idx < messages.length - 1 ? 'text-[#34D399]' : 'text-white/60'}`}>
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
      <AnimatePresence>
        {!isAtBottom && !searchQuery && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="absolute bottom-28 right-6 w-10 h-10 bg-white border border-[#E8E6E3] flex items-center justify-center z-30 shadow-card hover:bg-[#F4F4F5] transition-colors rounded-full"
          >
            {Icons.down}
          </motion.button>
        )}
      </AnimatePresence>

      {/* ─── Doctor Tools ─── */}
      {user.role === 'DOCTOR' && consultation.status !== 'COMPLETED' && (
        <div className="px-4 py-3 bg-white border-t border-[#E8E6E3] flex gap-3 z-10 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => setShowTools(showTools === 'ai' ? null : 'ai')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
              showTools === 'ai' ? 'bg-[#18181B] text-white border-[#18181B]' : 'bg-white border-[#E8E6E3] text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            {Icons.sparkles} Medical Intel
          </button>
          <button
            onClick={() => setShowTools(showTools === 'prescribe' ? null : 'prescribe')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-full border transition-colors ${
              showTools === 'prescribe' ? 'bg-[#6D28D9] text-white border-[#6D28D9]' : 'bg-white border-[#E8E6E3] text-[#18181B] hover:bg-[#F4F4F5]'
            }`}
          >
            {Icons.pill} Prescribe
          </button>
        </div>
      )}

      {/* Doctor Flyouts */}
      <AnimatePresence>
        {showTools === 'ai' && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-white border-t border-[#E8E6E3] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-20 absolute bottom-[72px] inset-x-0 rounded-t-3xl">
            <div className="p-6 relative">
              <button onClick={() => setShowTools(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center hover:bg-[#E8E6E3] transition-colors text-[#71717A]">{Icons.close}</button>
              <h4 className="text-sm font-bold text-[#18181B] mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center">{Icons.sparkles}</span>
                Diagnostic Copilot
              </h4>
              <div className="flex gap-3">
                <input 
                  value={aiSymptoms} onChange={e => setAiSymptoms(e.target.value)}
                  placeholder="Input client symptoms for AI analysis..." 
                  className="flex-1 bg-white rounded-xl border border-[#E8E6E3] px-4 py-3 text-sm focus:border-[#6D28D9] focus:outline-none transition-colors"
                />
                <button onClick={handleAiAnalyze} disabled={aiLoading || !aiSymptoms.trim()} className="px-6 rounded-xl bg-[#18181B] disabled:opacity-50 text-white font-semibold text-sm hover:bg-[#27272A] transition-colors">
                   {aiLoading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
              {aiResult && (
                <div className="mt-5 p-5 border border-[#E8E6E3] rounded-2xl bg-[#F9F9FB]">
                  <div className="flex justify-between items-baseline mb-3 pb-3 border-b border-[#E8E6E3]">
                    <span className="text-lg font-bold text-[#18181B] font-heading">{aiResult.diagnosis || 'Analysis Complete'}</span>
                    {aiResult.confidence && <span className="text-[11px] font-bold bg-[#F0FDF4] text-[#059669] px-2.5 py-1 rounded-full border border-[#BBF7D0]">Confidence: {(aiResult.confidence * 100).toFixed(0)}%</span>}
                  </div>
                  <ul className="list-disc pl-4 space-y-1.5 text-[13px] text-[#71717A]">
                     {aiResult.suggestions?.map((s, i) => <li key={i}>{s}</li>) || <li>{aiResult.message}</li>}
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {showTools === 'prescribe' && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-white border-t border-[#E8E6E3] overflow-hidden shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-20 absolute bottom-[72px] inset-x-0 rounded-t-3xl">
             <div className="p-6 relative">
               <button onClick={() => setShowTools(null)} className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center hover:bg-[#E8E6E3] transition-colors text-[#71717A]">{Icons.close}</button>
               <h4 className="text-sm font-bold text-[#18181B] mb-5 flex items-center gap-2">
                 <span className="w-6 h-6 rounded-full bg-[#F5F3FF] text-[#6D28D9] flex items-center justify-center">{Icons.pill}</span>
                 New Prescription
               </h4>
               <div className="grid grid-cols-2 gap-4 mb-4">
                 <div>
                   <label className="section-label mb-1.5 block">Medication</label>
                   <input value={prescribeForm.medication} onChange={e => setPrescribeForm({...prescribeForm, medication: e.target.value})} placeholder="e.g. Amoxicillin" className="w-full bg-white rounded-xl border border-[#E8E6E3] px-4 py-2.5 text-sm focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] focus:outline-none transition-all" />
                 </div>
                 <div>
                   <label className="section-label mb-1.5 block">Dosage</label>
                   <input value={prescribeForm.dosage} onChange={e => setPrescribeForm({...prescribeForm, dosage: e.target.value})} placeholder="e.g. 500mg" className="w-full bg-white rounded-xl border border-[#E8E6E3] px-4 py-2.5 text-sm focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] focus:outline-none transition-all" />
                 </div>
               </div>
               <div className="mb-5">
                  <label className="section-label mb-1.5 block">Instructions</label>
                 <input value={prescribeForm.instructions} onChange={e => setPrescribeForm({...prescribeForm, instructions: e.target.value})} placeholder="e.g. Take twice daily after meals" className="w-full bg-white rounded-xl border border-[#E8E6E3] px-4 py-2.5 text-sm focus:border-[#6D28D9] focus:ring-1 focus:ring-[#6D28D9] focus:outline-none transition-all" />
               </div>
               <button onClick={handlePrescribe} disabled={!prescribeForm.medication} className="w-full py-3 rounded-xl bg-[#6D28D9] disabled:opacity-50 text-white font-bold text-sm hover:bg-[#5B21B6] transition-colors">
                  Issue Prescription Securely
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Input Area ─── */}
      {consultation.status !== 'COMPLETED' ? (
        <form onSubmit={handleSendMessage} className="px-4 py-4 bg-white border-t border-[#E8E6E3] flex items-end gap-3 shrink-0 z-30">
          <button 
            type="button" 
            onClick={() => toast.info('Attachments coming soon.')}
            className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full text-[#A1A1AA] hover:text-[#18181B] hover:bg-[#F4F4F5] transition-colors"
          >
            {Icons.clip}
          </button>
          <div className="flex-1 flex items-center bg-[#F9F9FB] border border-[#E8E6E3] rounded-[24px] focus-within:border-[#6D28D9] focus-within:bg-white transition-all overflow-hidden">
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
              className="bg-transparent border-none w-full text-[15px] focus:ring-0 px-4 py-3 resize-none leading-relaxed placeholder:text-[#A1A1AA]"
              rows="1"
              style={{ minHeight: '48px', maxHeight: '120px', outline:'none' }} 
            />
          </div>
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="w-12 h-12 shrink-0 flex items-center justify-center rounded-full bg-[#18181B] text-white disabled:opacity-30 disabled:bg-[#E8E6E3] hover:bg-[#27272A] transition-colors"
          >
            {Icons.send}
          </button>
        </form>
      ) : (
        <div className="p-6 text-center bg-white border-t border-[#E8E6E3]">
          <p className="section-label">Consultation Concluded</p>
        </div>
      )}
    </motion.div>
  );
};

export default ChatRoom;
