import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

const STATUS_COLS = [
  { key: 'PENDING',    label: 'Inbound',    icon: 'inbox',        color: 'text-outline'  },
  { key: 'PROCESSING', label: 'Analysing', icon: 'biotech',      color: 'text-tertiary' },
  { key: 'UPLOADED',   label: 'Reports Ready', icon: 'assignment_turned_in', color: 'text-primary' },
];

function InvCard({ inv, onAccept, onUpload }) {
  const date = new Date(inv.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const tests = Array.isArray(inv.tests) ? inv.tests : [];

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-headline text-sm font-semibold text-on-surface">{inv.publicInvId || `INV-${inv.id?.slice(-6).toUpperCase()}`}</p>
          <p className="font-label text-[10px] text-outline uppercase tracking-wide mt-0.5">
            Pt. {inv.patient?.publicId || '—'} · {date}
          </p>
        </div>
      </div>
      {tests.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tests.slice(0, 4).map((t, i) => (
            <span key={i} className="font-label text-[9px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
              {t}
            </span>
          ))}
        </div>
      )}
      {inv.status === 'PENDING' && (
        <button
          onClick={() => onAccept(inv.id)}
          className="w-full py-2 rounded-xl bg-primary text-on-primary font-label text-[11px] uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Accept Investigation
        </button>
      )}
      {inv.status === 'PROCESSING' && (
        <button
          onClick={() => onUpload(inv.id)}
          className="w-full py-2 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 font-label text-[11px] uppercase tracking-widest hover:bg-tertiary hover:text-background transition-all"
        >
          Upload Report
        </button>
      )}
      {inv.status === 'UPLOADED' && inv.pdfReportUrl && (
        <a
          href={inv.pdfReportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-surface-container-high text-on-surface font-label text-[11px] uppercase tracking-widest hover:bg-surface-container-highest transition-all"
        >
          <span className="material-symbols-outlined text-base">open_in_new</span>
          View Report
        </a>
      )}
    </div>
  );
}

export default function LabDashboard() {
  const [investigations, setInvestigations] = useState([]);
  const [loading, setLoading]               = useState(true);
  const [reportUrl, setReportUrl]           = useState('');
  const [uploadingId, setUploadingId]       = useState(null);
  const [visibleCounts, setVisibleCounts] = useState({
    PENDING: 10,
    PROCESSING: 10,
    UPLOADED: 10
  });

  const fetchFeed = useCallback(async () => {
    try {
      const res = await api.get('/lab/feed');
      setInvestigations(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Lab feed error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeed();
    const iv = setInterval(fetchFeed, 30_000);
    return () => clearInterval(iv);
  }, [fetchFeed]);

  const handleAccept = async (id) => {
    try {
      await api.post(`/lab/accept/${id}`);
      fetchFeed();
    } catch (err) { console.error(err); }
  };

  const handleUpload = (id) => setUploadingId(id);

  const submitReport = async () => {
    if (!uploadingId || !reportUrl.trim()) return;
    try {
      await api.post(`/lab/upload/${uploadingId}`, { pdfReportUrl: reportUrl.trim() });
      setUploadingId(null);
      setReportUrl('');
      fetchFeed();
    } catch (err) { console.error(err); }
  };

  const byStatus = (status) => investigations.filter(i => i.status === status);

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        <header className="mb-8">
          <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Lab & Imaging</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Investigation Pipeline</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1 opacity-70">Real-time feed — refreshes every 30 seconds.</p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {STATUS_COLS.map(col => (
            <div key={col.key} className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5">
              <span className={`material-symbols-outlined text-xl ${col.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{col.icon}</span>
              <p className="font-headline text-2xl font-bold text-on-surface mt-3">
                {loading ? '—' : byStatus(col.key).length}
              </p>
              <p className="font-label text-[10px] text-outline uppercase tracking-widest mt-0.5">{col.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STATUS_COLS.map(col => {
            const items = byStatus(col.key);
            return (
              <div key={col.key} className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${col.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{col.icon}</span>
                    <h2 className="font-headline text-sm font-bold text-on-surface">{col.label}</h2>
                  </div>
                  <span className={`font-label text-[10px] px-2 py-0.5 rounded-full bg-surface-container-high ${col.color}`}>{items.length}</span>
                </div>
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-3 min-h-[200px] flex-1 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-25rem)] pr-2 custom-scrollbar">
                    {loading ? (
                      <div className="h-24 rounded-2xl bg-surface-container-high" />
                    ) : items.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <span className="material-symbols-outlined text-3xl text-outline opacity-30">{col.icon}</span>
                        <p className="font-body text-xs text-on-surface-variant mt-2 opacity-50">Nothing here</p>
                      </div>
                    ) : (
                      items.slice(0, visibleCounts[col.key]).map(inv => (
                        <motion.div key={inv.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                          <InvCard inv={inv} onAccept={handleAccept} onUpload={handleUpload} />
                        </motion.div>
                      ))
                    )}
                  </div>
                  {!loading && items.length > visibleCounts[col.key] && (
                    <button 
                      onClick={() => setVisibleCounts(prev => ({ ...prev, [col.key]: prev[col.key] + 10 }))}
                      className="w-full h-10 mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-highest text-on-surface hover:bg-surface-container-high font-label text-[9px] uppercase tracking-widest transition-colors"
                    >
                      Load More
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Upload modal */}
        {uploadingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-8 w-full max-w-md space-y-5">
              <h3 className="font-headline text-xl font-bold text-on-surface">Upload Report</h3>
              <p className="font-body text-sm text-on-surface-variant opacity-70">Enter the URL of the completed PDF report.</p>
              <input
                type="url"
                value={reportUrl}
                onChange={e => setReportUrl(e.target.value)}
                placeholder="https://storage.example.com/report.pdf"
                className="w-full bg-surface-container-high border border-outline-variant/10 rounded-xl px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary transition-all"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setUploadingId(null); setReportUrl(''); }}
                  className="flex-1 py-3 rounded-xl bg-surface-container-high text-on-surface-variant font-label text-xs uppercase tracking-widest hover:bg-surface-container-highest transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reportUrl.trim()}
                  className="flex-1 py-3 rounded-xl bg-primary text-on-primary font-label text-xs uppercase tracking-widest hover:brightness-110 disabled:opacity-50 transition-all"
                >
                  Submit Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
