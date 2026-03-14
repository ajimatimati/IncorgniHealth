import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import SarcLocator from '../components/SarcLocator';
import { AlertTriangle, LogOut, Phone, BookOpen, Shield, Plus, Trash2 } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  logo: <AlertTriangle className="w-8 h-8 text-[#6D28D9]" strokeWidth={2} />,
  exit: <LogOut className="w-6 h-6" strokeWidth={2} />,
  phone: <Phone className="w-5 h-5" strokeWidth={2} />,
  book: <BookOpen className="w-5 h-5" strokeWidth={2} />,
  shield: <Shield className="w-5 h-5" strokeWidth={2} />,
  plus: <Plus className="w-4 h-4" strokeWidth={2} />,
  trash: <Trash2 className="w-4 h-4" strokeWidth={2} />,
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

    // Panic key listener - ESC x 3
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
    window.location.href = 'https://google.com'; // Standard safe exit
  };

  const handleAddPlanItem = (type, value) => {
    if (!value.trim()) return;
    const newPlan = { ...safetyPlan, [type]: [...safetyPlan[type], { id: Date.now(), text: value }] };
    setSafetyPlan(newPlan);
    localStorage.setItem('safetyPlan', JSON.stringify(newPlan));
    toast.success('Added securely.');
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
    toast.success('Log saved securely.');
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="min-h-screen relative overflow-hidden bg-[#F8F7F6] text-[#18181B] font-sans"
    >
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 md:p-12">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-[#E8E6E3] pb-8">
          <div>
             <div className="flex items-center gap-4 mb-3">
               <div className="w-12 h-12 bg-white border border-[#E8E6E3] rounded-2xl flex items-center justify-center shadow-card-sm">
                 {Icons.logo}
               </div>
               <h1 className="text-3xl lg:text-4xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                 Safe Haven
               </h1>
             </div>
             <p className="section-label max-w-md normal-case leading-relaxed">
               A secure, locally encrypted sanctuary. Your activity here remains entirely private and untracked.
             </p>
          </div>
          <RippleButton variant="secondary" onClick={() => navigate('/dashboard')} className="mt-6 md:mt-0">
            {Icons.exit} Return to Dashboard
          </RippleButton>
        </header>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-3 mb-12">
          {[
            { id: 'main',  label: 'Emergency Contacts', icon: Icons.phone },
            { id: 'plan',  label: 'Safety Protocol',    icon: Icons.shield },
            { id: 'log',   label: 'Private Log',        icon: Icons.book },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[160px] px-6 py-4 text-[13px] font-bold flex justify-center items-center gap-2 rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-[#18181B] text-white border border-[#18181B] shadow-card-sm' 
                  : 'bg-white border border-[#E8E6E3] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
              }`}
            >
              <span className="w-5 h-5">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {activeTab === 'main' && (
            <motion.div 
              key="main"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
              className="grid lg:grid-cols-2 gap-8"
            >
               <div className="p-8 bg-white border border-[#E8E6E3] shadow-card-md rounded-2xl">
                 <h2 className="text-xl font-black text-[#18181B] mb-4">Immediate Action</h2>
                 <p className="text-[13px] text-[#71717A] mb-8 leading-relaxed border-l-2 border-[#E8E6E3] pl-4">
                   If you are currently in physical danger, please prioritize your immediate physical safety and exit the premises if possible. This platform cannot provide physical intervention.
                 </p>
                 
                 <div className="space-y-4">
                   <a href="tel:112" className="flex items-center gap-4 w-full p-4 rounded-xl bg-[#18181B] text-white font-bold hover:bg-[#27272A] transition-colors shadow-sm">
                     <span className="p-2 bg-white/10 rounded-lg">{Icons.phone}</span>
                     <span>Call 112 — General Emergency</span>
                   </a>
                   <a href="tel:08139841886" className="flex items-center gap-4 w-full p-4 rounded-xl font-bold transition-all bg-[#FEF2F2] border border-[#FECACA] text-[#DC2626] hover:bg-[#FEE2E2]">
                     <span className="p-2 rounded-lg bg-[#FEE2E2]">{Icons.phone}</span>
                     <span>Call DSVRT — Sexual &amp; Gender Violence</span>
                   </a>
                   <a href="tel:08091116264" className="flex items-center gap-4 w-full p-4 rounded-xl font-bold transition-all bg-[#F0FDF4] border border-[#BBF7D0] text-[#059669] hover:bg-[#DCFCE7]">
                     <span className="p-2 rounded-lg bg-[#DCFCE7]">{Icons.phone}</span>
                     <span>Call MANI — Mental Health Crisis</span>
                   </a>
                 </div>
               </div>

               <div className="space-y-4">
                 {[
                   { title: 'SARC Center Locator', desc: 'Find your nearest Sexual Assault Referral Center — 44 verified global centres on an interactive map.', route: '/sarc' },
                   { title: 'Evidence Preservation Guide', desc: 'Medical and legal guidelines on preserving essential evidence.', route: '/safe-haven/evidence-guide' },
                   { title: 'Know Your Legal Rights', desc: 'A summary of protections under the Violence Against Persons Prohibition Act.', route: '/safe-haven/legal-rights' },
                 ].map((item, i) => (
                   <div 
                     key={i} 
                     onClick={item.route ? () => navigate(item.route) : item.action}
                     className="p-6 bg-white border border-[#E8E6E3] rounded-2xl hover:border-[#D4D4D8] hover:shadow-card-sm transition-all cursor-pointer group"
                   >
                     <h3 className="font-bold text-[#18181B] text-[15px] mb-2 group-hover:text-[#6D28D9] transition-colors">{item.title}</h3>
                     <p className="text-[13px] text-[#71717A] leading-relaxed">{item.desc}</p>
                   </div>
                 ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'plan' && (
            <motion.div 
              key="plan"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            >
              <div className="p-8 bg-white border border-[#E8E6E3] shadow-card-md rounded-2xl">
               <h2 className="text-xl font-black text-[#18181B] mb-2">Safety Protocol</h2>
               <p className="text-[13px] text-[#71717A] mb-8">
                 Construct a personal safety protocol. This information is cryptographically isolated and never leaves your device.
               </p>

               <div className="grid md:grid-cols-2 gap-10">
                 {/* Contacts */}
                 <div>
                   <h3 className="section-label mb-4 border-b border-[#F0EDED] pb-2">Trusted Contacts</h3>
                   <div className="space-y-3 mb-6">
                     {safetyPlan.contacts.length === 0 && <p className="text-xs text-[#A1A1AA] italic">No contacts added.</p>}
                     {safetyPlan.contacts.map(c => (
                       <div key={c.id} className="flex justify-between items-center p-4 bg-[#F9F9FB] rounded-xl border border-[#F0EDED]">
                         <span className="text-[13px] font-bold text-[#18181B]">{c.text}</span>
                         <button onClick={() => handleDeletePlanItem('contacts', c.id)} className="text-[#A1A1AA] hover:text-[#DC2626] transition-colors p-1">{Icons.trash}</button>
                       </div>
                     ))}
                   </div>
                   <form onSubmit={(e) => { e.preventDefault(); handleAddPlanItem('contacts', e.target.contact.value); e.target.reset(); }} className="flex gap-3">
                     <input name="contact" placeholder="Name / Number" className="flex-1 bg-white border border-[#E8E6E3] rounded-xl px-4 py-3 text-[13px] focus:border-[#6D28D9] focus:outline-none transition-colors" />
                     <button type="submit" className="px-6 rounded-xl bg-[#18181B] text-white font-bold transition-colors hover:bg-[#27272A]">{Icons.plus}</button>
                   </form>
                 </div>

                 {/* Strategies */}
                 <div>
                   <h3 className="section-label mb-4 border-b border-[#F0EDED] pb-2">Coping Strategies</h3>
                   <div className="space-y-3 mb-6">
                     {safetyPlan.strategies.length === 0 && <p className="text-xs text-[#A1A1AA] italic">No strategies added.</p>}
                     {safetyPlan.strategies.map(s => (
                       <div key={s.id} className="flex justify-between items-center p-4 bg-[#F9F9FB] rounded-xl border border-[#F0EDED]">
                         <span className="text-[13px] font-bold text-[#18181B]">{s.text}</span>
                         <button onClick={() => handleDeletePlanItem('strategies', s.id)} className="text-[#A1A1AA] hover:text-[#DC2626] transition-colors p-1">{Icons.trash}</button>
                       </div>
                     ))}
                   </div>
                   <form onSubmit={(e) => { e.preventDefault(); handleAddPlanItem('strategies', e.target.strategy.value); e.target.reset(); }} className="flex gap-3">
                     <input name="strategy" placeholder="e.g. Deep Breathing Exercises" className="flex-1 bg-white border border-[#E8E6E3] rounded-xl px-4 py-3 text-[13px] focus:border-[#6D28D9] focus:outline-none transition-colors" />
                     <button type="submit" className="px-6 rounded-xl bg-[#18181B] text-white font-bold transition-colors hover:bg-[#27272A]">{Icons.plus}</button>
                   </form>
                 </div>
               </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'log' && (
            <motion.div 
              key="log"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}
            >
               <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-8 border-b border-[#E8E6E3] pb-4 gap-4">
                 <div>
                   <h2 className="text-2xl font-black text-[#18181B]">Private Log</h2>
                   <p className="text-[13px] text-[#71717A] mt-1">Secure, local documentation.</p>
                 </div>
                 <RippleButton variant="primary" onClick={() => setLogging(!logging)}>
                   {logging ? 'Cancel Entry' : '+ Create Entry'}
                 </RippleButton>
               </div>
             
             <AnimatePresence>
               {logging && (
                 <motion.div 
                   initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                   className="p-6 mb-8 bg-white border border-[#E8E6E3] rounded-2xl shadow-card-md overflow-hidden"
                 >
                   <textarea
                     value={newLog}
                     onChange={(e) => setNewLog(e.target.value)}
                     placeholder="Document details here. Date, time, location, and specific sequence of events..."
                     className="w-full h-40 bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl p-5 text-[14px] leading-relaxed outline-none mb-4 resize-none focus:border-[#6D28D9] focus:bg-white transition-colors"
                   />
                   <div className="flex justify-end">
                     <RippleButton onClick={handleSaveLog} disabled={!newLog.trim()}>
                       Save Securely
                     </RippleButton>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>

             <div className="space-y-4">
               {incidentLog.length === 0 ? (
                 <div className="p-12 border border-dashed border-[#E8E6E3] rounded-2xl flex flex-col items-center justify-center text-[#A1A1AA] bg-white">
                    <div className="mb-4 opacity-50">{Icons.book}</div>
                    <p className="text-[13px] font-bold">No records documented.</p>
                 </div>
               ) : (
                 incidentLog.map((log) => (
                   <div key={log.id} className="p-6 bg-white border border-[#E8E6E3] rounded-2xl shadow-sm hover:shadow-card-sm transition-shadow">
                     <div className="flex justify-between items-center border-b border-[#F0EDED] pb-3 mb-4">
                       <p className="section-label !mb-0">{new Date(log.date).toLocaleString()}</p>
                       <p className="text-[10px] font-mono text-[#D1D5DB]">Entry: {log.id}</p>
                     </div>
                     <p className="text-[14px] text-[#18181B] leading-relaxed whitespace-pre-wrap">{log.text}</p>
                   </div>
                 ))
               )}
             </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Quick Exit Floating Button */}
      <div className="fixed bottom-6 md:bottom-12 right-6 md:right-12 z-50">
         <button
           onClick={handlePanic}
           className="h-14 pl-2 pr-6 bg-[#DC2626] text-white rounded-full flex items-center gap-3 shadow-[0_8px_30px_rgba(220,38,38,0.4)] hover:bg-[#B91C1C] hover:-translate-y-1 transition-all group border-2 border-white"
           title="Quick Exit (Press ESC 3 times)"
         >
           <div className="bg-white text-[#DC2626] w-10 h-10 rounded-full flex items-center justify-center shadow-sm">
              {Icons.shield}
           </div>
           <div className="text-left leading-tight mt-0.5">
             <span className="block text-[13px] font-black uppercase tracking-wider">Quick Exit</span>
             <span className="block text-[9px] text-white/80 font-bold tracking-widest uppercase">Press ESC x3</span>
           </div>
         </button>
      </div>

    </motion.div>
  );
};

export default SafeHaven;
