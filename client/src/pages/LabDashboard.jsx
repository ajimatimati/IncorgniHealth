import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { FlaskConical, Clock, CheckCircle, UploadCloud, Microscope } from 'lucide-react';

const Icons = {
  flask:     <FlaskConical className="w-5 h-5" strokeWidth={1.5} />,
  time:      <Clock className="w-5 h-5" strokeWidth={1.5} />,
  check:     <CheckCircle className="w-5 h-5" strokeWidth={1.5} />,
  microscope:<Microscope className="w-6 h-6" strokeWidth={1.5} />,
  upload:    <UploadCloud className="w-4 h-4 ml-2" strokeWidth={1.5} />,
};

const COL_CONFIG = [
  { title: 'Inbound Requests',   status: 'PENDING',    emptyText: 'NETWORK IDLE',      color: 'violet' },
  { title: 'Currently Analyzing',status: 'PROCESSING', emptyText: 'NO ACTIVE TESTS',   color: 'amber' },
  { title: 'Results Uploaded',   status: 'UPLOADED',   emptyText: 'QUEUE CLEARED',     color: 'green' },
];

const COLORS = {
  violet: { text: 'text-[#6D28D9]', bg: 'bg-[#F5F3FF]', border: 'border-[#EDE9FE]' },
  amber:  { text: 'text-[#D97706]', bg: 'bg-[#FEF3C7]', border: 'border-[#FEF08A]' },
  green:  { text: 'text-[#059669]', bg: 'bg-[#D1FAE5]', border: 'border-[#A7F3D0]' },
};

const LabDashboard = () => {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchInvestigations();
    const interval = setInterval(fetchInvestigations, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchInvestigations = async () => {
    try {
      const res = await api.get('/lab/feed');
      setInvestigations(res.data.data || []);
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleAccept = async (invId) => {
    try {
      await api.post(`/lab/accept/${invId}`);
      toast.success('Investigation accepted.');
      fetchInvestigations();
    } catch { toast.error('Could not accept investigation.'); }
  };

  const handleUploadReport = async (invId) => {
    try {
      // Stub to simulate PDF / report upload
      await api.post(`/lab/upload/${invId}`, { pdfReportUrl: 'https://placeholder.report/dummy.pdf' });
      toast.success('Report uploaded successfully.');
      fetchInvestigations();
    } catch { toast.error('Update failed.'); }
  };

  const pending    = investigations.filter(i => i.status === 'PENDING');
  const processing = investigations.filter(i => i.status === 'PROCESSING');
  const uploaded   = investigations.filter(i => i.status === 'UPLOADED' || i.status === 'REVIEWED');

  const statCards = [
    { label: 'Inbound',    value: pending.length,    icon: Icons.time,  color: 'violet' },
    { label: 'Analyzing',  value: processing.length, icon: Icons.flask, color: 'amber' },
    { label: 'Completed',  value: uploaded.length,   icon: Icons.check, color: 'green' },
  ];

  const colItems = [pending, processing, uploaded];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh bg-[#F8F7F6] pb-28 lg:pb-12 px-4 pt-6 lg:px-8 lg:pt-10 max-w-6xl mx-auto"
    >
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#6D28D9] bg-[#F5F3FF]">
              {Icons.microscope}
            </div>
            <div>
              <p className="section-label mb-0.5">Imaging & Lab Center</p>
              <h1 className="text-2xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {user?.nickname || 'Lab Scientist'}
              </h1>
              <p className="text-[11px] text-[#059669] font-bold flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#059669]" /> Lab Active
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="section-label mb-1">Authenticated Node</p>
            <p className="text-sm font-bold text-[#18181B] bg-[#F4F4F5] px-3 py-1.5 rounded-lg uppercase">{user?.publicId || 'SYS_PENDING'}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-[#E8E6E3] shadow-card-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <span className={`p-3 rounded-xl ${COLORS[s.color].bg} ${COLORS[s.color].text}`}>
                  {s.icon}
                </span>
                <span className="text-3xl font-black text-[#18181B] tracking-tight">
                  {String(s.value).padStart(2, '0')}
                </span>
              </div>
              <p className="section-label border-t border-[#F0EDED] pt-3">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Kanban Columns ── */}
        {loading ? (
          <div className="py-20 text-center">
            <p className="section-label animate-pulse">Syncing diagnostic network…</p>
          </div>
        ) : investigations.length === 0 ? (
          <div className="py-20 bg-white border border-[#E8E6E3] rounded-2xl flex flex-col items-center justify-center text-center shadow-card-sm">
            <p className="section-label">No active investigations detected</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 pb-12">
            {COL_CONFIG.map((col, ci) => {
              const cStyles = COLORS[col.color];
              return (
                <div key={ci} className="flex flex-col bg-white rounded-2xl overflow-hidden border border-[#E8E6E3] shadow-card h-[600px]">
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-5 py-4 border-b border-[#F0EDED] bg-[#F9F9FB]`}>
                    <h2 className={`text-[11px] font-bold uppercase tracking-wider text-[#18181B]`}>{col.title}</h2>
                    <span className={`text-[11.5px] font-bold px-2.5 py-0.5 rounded-full ${cStyles.bg} ${cStyles.text}`}>
                      {String(colItems[ci].length).padStart(2, '0')}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto">
                    {colItems[ci].length === 0 ? (
                      <div className="py-12 text-center rounded-xl bg-[#F9F9FB] border border-dashed border-[#E8E6E3]">
                        <p className="section-label">{col.emptyText}</p>
                      </div>
                    ) : (
                      <AnimatePresence>
                        {colItems[ci].map((inv) => (
                          <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="p-5 rounded-xl bg-white border border-[#E8E6E3] shadow-sm flex flex-col gap-4"
                          >
                            <div className="flex justify-between items-start border-b border-[#F0EDED] pb-3">
                              <div>
                                <p className="section-label mb-0.5">Inv ID</p>
                                <p className="font-bold text-[#18181B] text-sm uppercase">{inv.publicInvId}</p>
                              </div>
                              <StatusBadge status={inv.status} />
                            </div>

                            <div className="p-4 rounded-xl bg-[#F9F9FB] border border-[#F0EDED] space-y-3">
                              <p className="section-label border-b border-[#E8E6E3] pb-2">Requested Tests</p>
                              {inv.tests?.length > 0 ? inv.tests.map((test, idx) => (
                                <div key={idx} className="flex items-center gap-2 pt-1 text-[13px] font-bold text-[#18181B]">
                                  <div className="w-1.5 h-1.5 rounded-full bg-[#6D28D9]" />
                                  {typeof test === 'string' ? test : test?.name}
                                </div>
                              )) : (
                                <p className="section-label !text-[#DC2626]">No test data</p>
                              )}
                            </div>

                            {inv.status === 'PENDING' && (
                              <RippleButton onClick={() => handleAccept(inv.id)} size="sm" className="w-full justify-center">
                                Accept Request
                              </RippleButton>
                            )}
                            {inv.status === 'PROCESSING' && (
                              <RippleButton variant="amber" onClick={() => handleUploadReport(inv.id)} size="sm" className="w-full justify-center">
                                Generate & Upload Report {Icons.upload}
                              </RippleButton>
                            )}
                            {inv.status === 'UPLOADED' && (
                              <div className={`flex items-center justify-between p-4 rounded-xl ${cStyles.bg} ${cStyles.border} border`}>
                                <span className={`section-label !text-[#059669]`}>Report Sent</span>
                                <span className="text-[10px] font-bold text-[#059669] tabular-nums tracking-widest pt-1">
                                  SUCCESS
                                </span>
                              </div>
                            )}
                            {inv.status === 'REVIEWED' && (
                              <div className={`p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0]`}>
                                <p className="section-label !text-[#059669] mb-1">Doctor Remarks</p>
                                <p className="text-[13px] text-[#065F46] font-medium leading-relaxed">{inv.doctorRemarks || 'Reviewed successfully.'}</p>
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
  );
};

export default LabDashboard;
