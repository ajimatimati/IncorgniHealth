import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PullToRefresh from '../components/PullToRefresh';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion, AnimatePresence } from 'framer-motion';

export default function SarcOfficerDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('inbound');
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(10);
  const [selectedCase, setSelectedCase] = useState(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setCases([
          { id: 'C-084', type: 'anonymous_report', status: 'PENDING', timestamp: new Date(Date.now() - 1500000).toISOString(), priority: 'HIGH', location: 'Lagos Mainland', description: 'Anonymous incident report filed 25 mins ago.', reporter: 'Undisclosed', actionsTaken: [] },
          { id: 'C-083', type: 'support_request', status: 'ACTIVE', timestamp: new Date(Date.now() - 3600000).toISOString(), priority: 'MEDIUM', identity: 'Ghost-9xA2', description: 'Seeking contact for initial consultation. Patient has arrived safely at Safe Haven point.', reporter: 'Staff Nurse', actionsTaken: ['Dispatched Team', 'Notified Legal'] }
        ]);
        setLoading(false);
      }, 800);
    } catch {
      toast.error('Failed to connect to SARC feed');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    const interval = setInterval(fetchCases, 30000);
    return () => clearInterval(interval);
  }, []);

  const pendingCases = cases.filter(c => c.status === 'PENDING');
  const activeCases = cases.filter(c => c.status === 'ACTIVE');

  const MOCK_AUDIT = [
    { id: 'tx-9a8b7', hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', action: 'SARC Report #882 Accessed', user: 'Dr. Sarah Jenkins', time: '10 mins ago', valid: true },
    { id: 'tx-1c2d3', hash: '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92', action: 'Evidence Kit B-492 Logged', user: 'Officer M. Cole', time: '2 hrs ago', valid: true },
    { id: 'tx-4e5f6', hash: '05e3f228b7e05fc944ece1ce58e3eec1dc3f5d5a86aff3ca12020c923adc6c11', action: 'Video Consultation Initiated', user: 'System (Automated)', time: '5 hrs ago', valid: true },
  ];

  return (
    <PullToRefresh onRefresh={fetchCases}>
      <div className="bg-background min-h-full text-on-background">
        <div className="px-4 sm:px-6 lg:px-10 max-w-[1440px] mx-auto py-8 lg:py-10 space-y-8">
          {/* Page Header */}
          <header className="flex items-center gap-3 mb-2">
            <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>local_hospital</span>
            <div>
              <p className="font-label text-[11px] text-error uppercase tracking-[0.2em]">Response Portal</p>
              <h1 className="font-headline text-4xl font-bold text-on-surface">SARC Command</h1>
            </div>
          </header>
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-surface-container-low rounded-[32px] p-6 border border-error/20 flex flex-col justify-between h-36 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-error/30" />
              <div className="w-10 h-10 rounded-2xl bg-error/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-error" style={{ fontVariationSettings: "'FILL' 1" }}>error</span>
              </div>
              <div>
                <p className="font-label text-[9px] text-outline uppercase tracking-widest">Inbound Alerts</p>
                <p className="font-headline text-3xl font-black text-error tracking-tight">{pendingCases.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 flex flex-col justify-between h-36">
              <div className="w-10 h-10 rounded-2xl bg-tertiary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>shield_with_heart</span>
              </div>
              <div>
                <p className="font-label text-[9px] text-outline uppercase tracking-widest">Active Cases</p>
                <p className="font-headline text-3xl font-black text-tertiary tracking-tight">{activeCases.length}</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 flex flex-col justify-between h-36">
              <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
              </div>
              <div>
                <p className="font-label text-[9px] text-outline uppercase tracking-widest">Resolved (Today)</p>
                <p className="font-headline text-3xl font-black text-primary tracking-tight">3</p>
              </div>
            </div>
            <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 flex flex-col justify-between h-36">
               <div className="w-10 h-10 rounded-2xl bg-surface-container-highest flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
              </div>
              <div>
                <p className="font-label text-[9px] text-outline uppercase tracking-widest">Avg Response</p>
                <p className="font-headline text-2xl font-black text-on-surface tracking-tight">4m 12s</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] lg:h-[calc(100vh-320px)] min-h-[500px]">
            {/* ── Left Pane: Master List ── */}
            <section className="flex-[0.45] bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-6 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6 flex-shrink-0">
                <div>
                  <h2 className="font-headline text-base font-bold text-on-surface">Tracking Queue</h2>
                  <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em]">Priority Triage</p>
                </div>
                <div className="flex gap-2 p-1 bg-surface-container rounded-full shrink-0 overflow-x-auto no-scrollbar">
                  <button onClick={() => { setActiveTab('inbound'); setVisibleCount(10); setSelectedCase(null); }} className={`px-4 py-1.5 rounded-full font-label text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'inbound' ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant'}`}>
                    Inbound ({pendingCases.length})
                  </button>
                  <button onClick={() => { setActiveTab('active'); setVisibleCount(10); setSelectedCase(null); }} className={`px-4 py-1.5 rounded-full font-label text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'active' ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant'}`}>
                    Active ({activeCases.length})
                  </button>
                  <button onClick={() => { setActiveTab('audit'); setVisibleCount(10); setSelectedCase(null); }} className={`px-4 py-1.5 rounded-full font-label text-[9px] uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === 'audit' ? 'bg-surface-container-highest text-on-surface' : 'text-on-surface-variant'}`}>
                    Audit Trail
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scrollbar">
                <AnimatePresence mode="popLayout">
                  {loading && activeTab !== 'audit' ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-container rounded-2xl" />)}
                    </div>
                  ) : (
                    <>
                      {/* Master Queue List */}
                      {(activeTab === 'inbound' || activeTab === 'active') && (
                        <>
                          {(activeTab === 'inbound' ? pendingCases : activeCases)
                            .sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .slice(0, visibleCount)
                            .map((c, i) => {
                              const isSelected = selectedCase?.id === c.id;
                              return (
                                <motion.div
                                  layout
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95 }}
                                  transition={{ duration: 0.3, delay: (i % 10) * 0.05 }}
                                  key={c.id}
                                  onClick={() => setSelectedCase(c)}
                                  className={`p-5 rounded-[24px] border mb-4 cursor-pointer transition-all hover:border-primary/40 ${
                                    isSelected 
                                      ? 'bg-primary/5 border-primary shadow-[0_0_20px_rgba(208,188,255,0.1)]' 
                                      : c.priority === 'HIGH' && activeTab === 'inbound' 
                                        ? 'bg-error/5 border-error/20' 
                                        : 'bg-surface-container border-outline-variant/10'
                                  }`}
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="flex items-center gap-3">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${c.type === 'anonymous_report' ? 'bg-error/10 text-error' : 'bg-tertiary/10 text-tertiary'}`}>
                                        <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                                          {c.type === 'anonymous_report' ? 'campaign' : 'support'}
                                        </span>
                                      </div>
                                      <div>
                                        <p className="font-headline text-sm font-bold text-on-surface">{c.id}</p>
                                        <p className="font-mono text-[10px] text-on-surface-variant opacity-70">
                                          {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                      </div>
                                    </div>
                                    {c.priority === 'HIGH' && (
                                      <span className="px-2 py-1 rounded-md bg-error text-on-error font-label text-[8px] uppercase tracking-widest">Priority</span>
                                    )}
                                  </div>
                                  <p className="font-body text-xs text-on-surface-variant opacity-90 leading-relaxed truncate">
                                    {c.description}
                                  </p>
                                </motion.div>
                              )
                          })}
                          
                          {(activeTab === 'inbound' ? pendingCases : activeCases).length === 0 && (
                            <div className="h-40 flex flex-col items-center justify-center opacity-60">
                              <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
                              <p className="font-body text-sm text-on-surface-variant">Queue is clear.</p>
                            </div>
                          )}
                        </>
                      )}

                      {/* Audit Trail Tab */}
                      {activeTab === 'audit' && (
                        <motion.div key="audit" initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="space-y-4">
                          <div className="bg-error/10 border border-error/20 p-4 rounded-2xl flex items-start gap-4 mb-4">
                            <span className="material-symbols-outlined text-error">gavel</span>
                            <p className="font-body text-xs text-error/90 leading-relaxed">
                              <strong>Immutable Ledger Active.</strong> All actions recorded on this dashboard are cryptographically signed.
                            </p>
                          </div>
                          {MOCK_AUDIT.map(log => (
                            <div key={log.id} className="bg-surface-container-low rounded-2xl border border-outline-variant/10 p-4 space-y-3 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-3">
                                <span className="material-symbols-outlined text-[14px] text-primary" title="Cryptographically Valid">verified</span>
                              </div>
                              <div>
                                <h4 className="font-headline text-sm font-bold text-on-surface">{log.action}</h4>
                                <p className="font-label text-[9px] text-outline uppercase tracking-wider mt-1">{log.user} • {log.time}</p>
                              </div>
                              <div className="bg-surface-container-highest/50 rounded-lg p-2 overflow-x-auto no-scrollbar">
                                <p className="font-mono text-[8px] text-on-surface-variant/60 whitespace-nowrap">SHA-256: {log.hash}</p>
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </>
                  )}
                </AnimatePresence>
              </div>
            </section>

            {/* ── Right Pane: Details or Map ── */}
            <section className="flex-[0.55] rounded-[32px] border border-outline-variant/10 overflow-hidden relative flex flex-col bg-surface-container-low">
               {selectedCase ? (
                 <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="flex flex-col h-full">
                    {/* Header Details */}
                    <div className="p-8 border-b border-outline-variant/10 bg-surface-container flex items-start justify-between shrink-0">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`px-2.5 py-1 rounded-md font-label text-[9px] uppercase tracking-widest ${selectedCase.priority === 'HIGH' ? 'bg-error text-on-error' : 'bg-surface-container-highest text-on-surface-variant'}`}>{selectedCase.priority}</span>
                          <span className="font-label text-[10px] text-outline uppercase tracking-widest">{selectedCase.id}</span>
                        </div>
                        <h2 className="font-headline text-2xl font-bold text-on-surface">Incident Report</h2>
                        <p className="font-body text-sm text-on-surface-variant mt-1.5 flex items-center gap-2">
                          <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                          {new Date(selectedCase.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                         <button className="w-10 h-10 rounded-full border border-outline-variant/10 bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface">
                           <span className="material-symbols-outlined text-[20px]">print</span>
                         </button>
                         <button onClick={() => setSelectedCase(null)} className="w-10 h-10 rounded-full border border-outline-variant/10 bg-surface-container-high flex items-center justify-center hover:bg-surface-container-highest transition-colors text-on-surface-variant hover:text-on-surface">
                           <span className="material-symbols-outlined text-[20px]">close</span>
                         </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                      {/* Identity & Location Row */}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-label text-[10px] text-outline uppercase tracking-widest">Reporter Alias</label>
                          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 font-mono text-sm text-on-surface">
                            {selectedCase.identity || selectedCase.reporter}
                          </div>
                        </div>
                         <div className="space-y-2">
                          <label className="font-label text-[10px] text-outline uppercase tracking-widest">Last Known Location</label>
                          <div className="p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/10 flex items-center gap-2">
                             <span className="material-symbols-outlined text-outline text-[18px]">location_on</span>
                             <span className="font-body text-sm text-on-surface">{selectedCase.location || 'Safe Haven Transit'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Description Narrative */}
                      <div className="space-y-2">
                         <label className="font-label text-[10px] text-outline uppercase tracking-widest">Narrative Payload</label>
                         <div className="p-5 rounded-2xl bg-surface-container-lowest border border-outline-variant/10 font-body text-[15px] leading-relaxed text-on-surface">
                            {selectedCase.description}
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="space-y-3">
                         <label className="font-label text-[10px] text-outline uppercase tracking-widest">Actions Ledger</label>
                         <ul className="space-y-2 border-l-2 border-outline-variant/10 pl-4 ml-2">
                           {selectedCase.actionsTaken.length > 0 ? selectedCase.actionsTaken.map((act, i) => (
                             <li key={i} className="font-body text-sm text-on-surface-variant flex items-center gap-3">
                                <span className="w-1.5 h-1.5 rounded-full bg-outline-variant shrink-0" />
                                {act}
                             </li>
                           )) : (
                             <li className="font-body text-sm text-outline italic">No actions logged yet.</li>
                           )}
                         </ul>
                      </div>
                    </div>

                    {/* Footer Action Bar */}
                    <div className="p-6 border-t border-outline-variant/10 bg-surface-container flex gap-3 shrink-0 pb-safe">
                       {selectedCase.status === 'PENDING' ? (
                          <button className="flex-1 py-4 rounded-xl bg-error text-on-error font-headline font-bold text-[13px] uppercase tracking-widest hover:brightness-110 shadow-lg shadow-error/20 transition-all flex items-center justify-center gap-2">
                             <span className="material-symbols-outlined">how_to_reg</span>
                             Establish First Contact
                          </button>
                       ) : (
                          <>
                            <button className="flex-1 py-3 rounded-xl border border-outline-variant/20 bg-surface-container-highest text-on-surface font-label text-[11px] uppercase tracking-widest transition-all">
                               Request Transit
                            </button>
                            <button className="flex-1 py-3 rounded-xl border border-tertiary/30 bg-tertiary/10 text-tertiary font-label text-[11px] uppercase tracking-widest transition-all shadow-lg shadow-tertiary/10">
                               Dispatch SART Unit
                            </button>
                          </>
                       )}
                    </div>
                 </motion.div>
               ) : (
                 <>
                   {/* Idle Map State */}
                   <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest/50 backdrop-blur-md absolute top-0 left-0 right-0 z-10 flex items-center justify-between">
                     <div>
                       <h2 className="font-headline text-base font-bold text-on-surface">Coverage Area</h2>
                       <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] flex items-center gap-1">
                         <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live Regional Monitor
                       </p>
                     </div>
                   </div>
                   
                   <div className="flex-1 bg-surface-container-lowest relative min-h-[300px] flex items-center justify-center">
                     <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at center, #D0BCFF 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
                     
                     <div className="text-center z-10 p-8 rounded-[32px] bg-surface-container/50 backdrop-blur-md border border-outline-variant/5">
                        <span className="material-symbols-outlined text-[64px] text-outline opacity-40 mb-4 block">map</span>
                        <h3 className="font-headline text-lg font-bold text-on-surface">Terminal Locked</h3>
                        <p className="font-body text-sm text-on-surface-variant max-w-xs mx-auto mt-2 opacity-80">
                          Select a case from the triage queue to decrypt incident details and authorize action.
                        </p>
                     </div>
                   </div>
                 </>
               )}
            </section>
          </div>
        </div>
      </div>
    </PullToRefresh>
  );
}
