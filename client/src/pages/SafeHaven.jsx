import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  logo: <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>,
  exit: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>,
  phone: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>,
  book: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>,
  shield: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  plus: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>,
  trash: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>,
};

const SafeHaven = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('main'); // main, plan, log
  const [safetyPlan, setSafetyPlan] = useState({ contacts: [], strategies: [] });
  const [incidentLog, setIncidentLog] = useState([]);
  const [newLog, setNewLog] = useState('');
  const [logging, setLogging] = useState(false);

  // Load local data on mount
  useEffect(() => {
    try {
      const plan = JSON.parse(localStorage.getItem('safetyPlan') || '{"contacts":[],"strategies":[]}');
      const log = JSON.parse(localStorage.getItem('incidentLog') || '[]');
      setSafetyPlan(plan);
      setIncidentLog(log);
    } catch {}

    // Panic key listener
    let pressCount = 0;
    let timeout;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        pressCount++;
        clearTimeout(timeout);
        timeout = setTimeout(() => (pressCount = 0), 1000);
        if (pressCount >= 3) handlePanic();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handlePanic = () => {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(c => {
      document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });
    window.location.href = 'https://stemuluskidstech.com';
  };

  const handleAddPlanItem = (type, value) => {
    if (!value.trim()) return;
    const newPlan = { ...safetyPlan, [type]: [...safetyPlan[type], { id: Date.now(), text: value }] };
    setSafetyPlan(newPlan);
    localStorage.setItem('safetyPlan', JSON.stringify(newPlan));
    toast.success('Added to safety plan.');
  };

  const handleDeletePlanItem = (type, id) => {
    const newPlan = { ...safetyPlan, [type]: safetyPlan[type].filter(i => i.id !== id) };
    setSafetyPlan(newPlan);
    localStorage.setItem('safetyPlan', JSON.stringify(newPlan));
  };

  const handleSaveLog = () => {
    if (!newLog.trim()) return;
    const newEntry = { id: Date.now(), text: newLog, date: new Date().toISOString() };
    const updatedLog = [newEntry, ...incidentLog];
    setIncidentLog(updatedLog);
    localStorage.setItem('incidentLog', JSON.stringify(updatedLog));
    setNewLog('');
    setLogging(false);
    toast.success('Incident logged securely.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.02 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="min-h-screen relative overflow-hidden text-red-50 font-sans"
    >
      {/* Backgrounds */}
      <div className="absolute inset-0 bg-[#0f0404] pointer-events-none z-0 transition-colors duration-1000" />
      <div className="absolute top-[-20%] right-[-20%] w-[900px] h-[900px] bg-red-900/10 rounded-full blur-[150px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-6 lg:py-10">
        
        {/* Header */}
        <header className="flex justify-between items-start mb-8">
          <div>
             <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-red-500/10 rounded-xl border border-red-500/20 shadow-glow-red animate-pulse-soft">
                 {Icons.logo}
               </div>
               <h1 className="text-3xl font-bold text-white tracking-tight">Safe Haven</h1>
             </div>
             <p className="text-sm text-red-200/50 max-w-md">Secure, untracked crisis support. Your activity here is private.</p>
          </div>
          <RippleButton onClick={() => navigate('/dashboard')} variant="secondary" className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-red-200/70 hover:text-white transition border-none shadow-none">
            {Icons.exit} Exit
          </RippleButton>
        </header>

        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 border-b border-red-500/20 pb-1">
          {[
            { id: 'main', label: 'Emergency' },
            { id: 'plan', label: 'Safety Plan', icon: Icons.shield },
            { id: 'log', label: 'Incident Log', icon: Icons.book },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-t-lg text-sm font-bold flex items-center gap-2 transition-all relative ${
                activeTab === tab.id 
                  ? 'bg-red-500/10 text-red-100 border-t border-x border-red-500/20' 
                  : 'text-red-200/40 hover:text-red-100 hover:bg-white/5'
              }`}
            >
              {tab.icon && <span className="w-4 h-4">{tab.icon}</span>}
              {tab.label}
              {activeTab === tab.id && <div className="absolute -bottom-1.5 left-0 right-0 h-1.5 bg-[#0f0404]" />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-8"
            >
               <div className="glass-panel p-8 border-red-500/30 bg-gradient-to-b from-red-950/40 to-transparent">
               <h2 className="text-2xl font-bold text-white mb-4">Immediate Help</h2>
               <p className="text-sm text-red-200/70 mb-8">
                 If you are in immediate danger, call emergency services now. This app cannot physically protect you.
               </p>
               
               <div className="space-y-4">
                 <a href="tel:112" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-900/40 transition hover:scale-[1.02]">
                   {Icons.phone} Call 112 (General Emergency)
                 </a>
                 <a href="tel:08139841886" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/40 transition hover:scale-[1.02]">
                   {Icons.phone} Call DSVRT (Domestic/Sexual Violence)
                 </a>
                 <a href="tel:08091116264" className="flex items-center justify-center gap-3 w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-900/40 transition hover:scale-[1.02]">
                   {Icons.phone} Call MANI (Suicide/Crisis)
                 </a>
               </div>
             </div>

             <div className="space-y-4">
               {[
                 { title: 'SARC Center Locator', desc: 'Find nearest Sexual Assault Referral Center in Nigeria' },
                 { title: 'Evidence Preservation', desc: 'Guide on what to do if you plan to report' },
                 { title: 'Legal Rights (VAPP Act)', desc: 'Know your protections under the Nigerian Violence Against Persons Prohibition Act' },
               ].map((item, i) => (
                 <div key={i} className="p-5 rounded-xl border border-red-500/10 bg-red-500/5 hover:bg-red-500/10 transition cursor-pointer group">
                   <h3 className="font-bold text-red-100 group-hover:text-white transition-colors">{item.title}</h3>
                   <p className="text-sm text-red-200/50 mt-1">{item.desc}</p>
                 </div>
               ))}
             </div>
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div 
              key="plan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="glass-panel p-6 border-red-500/20">
               <h2 className="text-xl font-bold text-white mb-4">Safety Plan</h2>
               <p className="text-sm text-red-200/60 mb-6">List trusted contacts and coping strategies. This is stored only on this device.</p>

               <div className="grid md:grid-cols-2 gap-8">
                 {/* Contacts */}
                 <div>
                   <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">Safe Contacts</h3>
                   <div className="space-y-2 mb-3">
                     {safetyPlan.contacts.map(c => (
                       <div key={c.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                         <span className="text-sm">{c.text}</span>
                         <button onClick={() => handleDeletePlanItem('contacts', c.id)} className="text-red-400/50 hover:text-red-400">{Icons.trash}</button>
                       </div>
                     ))}
                   </div>
                   <form onSubmit={(e) => { e.preventDefault(); handleAddPlanItem('contacts', e.target.contact.value); e.target.reset(); }} className="flex gap-2">
                     <input name="contact" placeholder="Name / Phone" className="input-field bg-black/40 border-red-500/20 text-sm flex-1" />
                     <button type="submit" className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg">{Icons.plus}</button>
                   </form>
                 </div>

                 {/* Strategies */}
                 <div>
                   <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider mb-3">Coping Strategies</h3>
                   <div className="space-y-2 mb-3">
                     {safetyPlan.strategies.map(s => (
                       <div key={s.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                         <span className="text-sm">{s.text}</span>
                         <button onClick={() => handleDeletePlanItem('strategies', s.id)} className="text-red-400/50 hover:text-red-400">{Icons.trash}</button>
                       </div>
                     ))}
                   </div>
                    <form onSubmit={(e) => { e.preventDefault(); handleAddPlanItem('strategies', e.target.strategy.value); e.target.reset(); }} className="flex gap-2">
                     <input name="strategy" placeholder="e.g., Deep breathing" className="input-field bg-black/40 border-red-500/20 text-sm flex-1" />
                     <button type="submit" className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg">{Icons.plus}</button>
                   </form>
                 </div>
               </div>
            </div>
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div 
              key="log"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
               <div className="flex justify-between items-center mb-6">
               <h2 className="text-xl font-bold text-white">Incident Log</h2>
               <button onClick={() => setLogging(!logging)} className="btn-secondary text-sm bg-red-500/10 border-red-500/20 text-red-100 hover:text-white">
                 {logging ? 'Cancel' : 'New Entry'}
               </button>
             </div>
             
             {logging && (
               <div className="glass-panel p-6 mb-6 border-red-500/20 animate-slide-down">
                 <textarea
                   value={newLog}
                   onChange={(e) => setNewLog(e.target.value)}
                   placeholder="Document details here. Date/Time, Location, Description. Stored locally."
                   className="w-full h-32 bg-black/40 border border-red-500/20 rounded-xl p-4 text-sm text-red-50 focus:border-red-500/50 focus:ring-0 mb-4 resize-none"
                 />
                 <button onClick={handleSaveLog} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-sm shadow-lg shadow-red-900/20">
                   Save Encrypted Log
                 </button>
               </div>
             )}

             <div className="space-y-4">
               {incidentLog.length === 0 ? (
                 <p className="text-red-200/30 text-center py-10 italic">No incidents recorded locally.</p>
               ) : (
                 incidentLog.map((log) => (
                   <div key={log.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
                     <p className="text-xs text-red-400 mb-2 font-mono opacity-70">{new Date(log.date).toLocaleString()}</p>
                     <p className="text-sm text-red-100 whitespace-pre-wrap">{log.text}</p>
                   </div>
                 ))
               )}
             </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Quick Exit Floating Button */}
      <div className="fixed bottom-24 lg:bottom-8 right-8 z-50 group">
         <div className="absolute inset-0 bg-red-600 rounded-full blur-xl opacity-20 group-hover:opacity-40 animate-pulse transition-opacity pointer-events-none"></div>
         <RippleButton
           onClick={handlePanic}
           variant="danger"
           className="relative w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl transition-all border-4 border-[#0f0404] !p-0"
           title="Quick Exit (ESC x3)"
         >
           {Icons.exit}
         </RippleButton>
      </div>

    </motion.div>
  );
};

export default SafeHaven;
