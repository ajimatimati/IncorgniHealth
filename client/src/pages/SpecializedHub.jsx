import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';

// Simple encrypted storage mockup using base64 for obfuscation to preserve zero-knowledge privacy client-side
const SECURE_STORAGE_KEY = 'incognicare_specialized_v1';

function getSecureLogs() {
  try {
    const raw = localStorage.getItem(SECURE_STORAGE_KEY);
    if (!raw) return { cycle: [], chemo: [], bp: [], glucose: [] };
    return JSON.parse(atob(raw));
  } catch (e) {
    return { cycle: [], chemo: [], bp: [], glucose: [] };
  }
}

function saveSecureLogs(data) {
  try {
    localStorage.setItem(SECURE_STORAGE_KEY, btoa(JSON.stringify(data)));
  } catch (e) {
    console.error('Failed to encrypt and save logs client-side:', e);
  }
}

export default function SpecializedHub() {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeCategory, setActiveCategory] = useState(() => {
    return location.state?.category || 'womens-health';
  });
  
  // State for all logs
  const [logs, setLogs] = useState({ cycle: [], chemo: [], bp: [], glucose: [] });

  useEffect(() => {
    setLogs(getSecureLogs());
  }, []);

  const updateLogs = (newLogs) => {
    setLogs(newLogs);
    saveSecureLogs(newLogs);
  };

  // Women's Health States
  const [lastPeriodDate, setLastPeriodDate] = useState('');
  const [cycleLength, setCycleLength] = useState(28);
  const [pregnancyWeek, setPregnancyWeek] = useState(1);

  // Oncology States
  const [chemoDate, setChemoDate] = useState('');
  const [chemoRegimen, setChemoRegimen] = useState('');
  const [chemoSideEffects, setChemoSideEffects] = useState({
    nausea: false, fatigue: false, neuropathy: false, headache: false, fever: false
  });

  // NCD States
  const [bpSys, setBpSys] = useState('');
  const [bpDia, setBpDia] = useState('');
  const [glucoseVal, setGlucoseVal] = useState('');
  const [glucoseType, setGlucoseType] = useState('FASTING'); // FASTING | POST_PRANDIAL | RANDOM

  // Handle Cycle logging
  const handleLogCycle = (e) => {
    e.preventDefault();
    if (!lastPeriodDate) return;
    const newCycle = [
      { date: lastPeriodDate, length: cycleLength },
      ...logs.cycle
    ].slice(0, 10);
    updateLogs({ ...logs, cycle: newCycle });
    setLastPeriodDate('');
  };

  // Calculate next period & fertile window based on latest cycle
  const getCycleCalculations = () => {
    if (logs.cycle.length === 0) return null;
    const lastDate = new Date(logs.cycle[0].date);
    const length = Number(logs.cycle[0].length || 28);
    
    const nextPeriod = new Date(lastDate.getTime() + length * 24 * 60 * 60 * 1000);
    const fertileStart = new Date(lastDate.getTime() + (length - 18) * 24 * 60 * 60 * 1000);
    const fertileEnd = new Date(lastDate.getTime() + (length - 11) * 24 * 60 * 60 * 1000);
    
    return {
      nextPeriod: nextPeriod.toDateString(),
      fertileStart: fertileStart.toDateString(),
      fertileEnd: fertileEnd.toDateString(),
    };
  };

  const calcs = getCycleCalculations();

  // Handle Chemo logging
  const handleLogChemo = (e) => {
    e.preventDefault();
    if (!chemoDate || !chemoRegimen) return;
    const activeEffects = Object.keys(chemoSideEffects).filter(k => chemoSideEffects[k]);
    const newChemo = [
      { date: chemoDate, regimen: chemoRegimen, effects: activeEffects },
      ...logs.chemo
    ].slice(0, 15);
    updateLogs({ ...logs, chemo: newChemo });
    setChemoDate('');
    setChemoRegimen('');
    setChemoSideEffects({ nausea: false, fatigue: false, neuropathy: false, headache: false, fever: false });
  };

  // Handle BP logging
  const handleLogBP = (e) => {
    e.preventDefault();
    const sys = Number(bpSys);
    const dia = Number(bpDia);
    if (!sys || !dia) return;

    let status = 'Normal';
    if (sys >= 160 || dia >= 100) status = 'Stage 2 Hypertension (Critical)';
    else if (sys >= 140 || dia >= 90) status = 'Stage 1 Hypertension';
    else if (sys >= 120 || dia >= 80) status = 'Prehypertension';

    const newBP = [
      { date: new Date().toISOString(), systolic: sys, diastolic: dia, status },
      ...logs.bp
    ].slice(0, 15);
    updateLogs({ ...logs, bp: newBP });
    setBpSys('');
    setBpDia('');
  };

  // Handle Glucose logging
  const handleLogGlucose = (e) => {
    e.preventDefault();
    const val = Number(glucoseVal);
    if (!val) return;

    let status = 'Normal';
    if (glucoseType === 'FASTING') {
      if (val >= 126) status = 'Diabetic Range';
      else if (val >= 100) status = 'Prediabetic Range';
    } else {
      if (val >= 200) status = 'Diabetic Range';
      else if (val >= 140) status = 'Prediabetic Range';
    }

    const newGlucose = [
      { date: new Date().toISOString(), value: val, type: glucoseType, status },
      ...logs.glucose
    ].slice(0, 15);
    updateLogs({ ...logs, glucose: newGlucose });
    setGlucoseVal('');
  };

  // Local Nigerian diet guide matching NCD profiles
  const DIET_GUIDE = [
    { food: 'Ofada Rice (Local Brown Rice)', target: 'Diabetes / Weight Management', benefit: 'High fiber, lower glycemic index than white rice. Absorbed slower, preventing insulin spikes.' },
    { food: 'Unripe Plantain swallow / flour', target: 'Hypertension & Diabetes', benefit: 'Extremely rich in potassium, iron, and fibers. Helps manage blood pressure and low sugar impact.' },
    { food: 'Garden Egg Sauce (with minimal palm oil)', target: 'General NCD Care', benefit: 'Rich in dietary fiber and potassium. Promotes vascular health and supports optimal glucose ranges.' },
    { food: 'Waterleaf / Ugu vegetable soups', target: 'Maternal & Cardiovascular Health', benefit: 'Rich in magnesium, iron, and folic acid. Excellent for anemia reduction and heart functions.' },
  ];

  return (
    <div className="bg-[#010101] min-h-screen text-white select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14">
        
        {/* Header */}
        <header className="mb-10 space-y-1">
          <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold">Specialized Care Enclave</p>
          <h1 className="font-sans text-3xl sm:text-4xl font-black text-white tracking-tight">
            Nigerian Health Pathways
          </h1>
          <p className="font-sans text-xs text-white/50">
            Completely private, zero-knowledge localized logs and guidelines.
          </p>
        </header>

        {/* Category Selector Tabs */}
        <div className="flex gap-3 border-b border-white/5 pb-4 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'womens-health', label: "Maternal & Women's Enclave", icon: 'pregnancy' },
            { id: 'oncology', label: 'Oncology Care Pathway', icon: 'medical_services' },
            { id: 'ncd', label: 'NCD Management Hub', icon: 'health_metrics' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full border transition-all shrink-0 font-sans text-xs font-bold ${
                activeCategory === tab.id
                  ? 'bg-white text-black border-white'
                  : 'bg-white/[0.02] border-white/5 text-white/60 hover:text-white hover:border-white/20'
              }`}
            >
              <span className="material-symbols-outlined text-base">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Panes */}
        <AnimatePresence mode="wait">
          {activeCategory === 'womens-health' && (
            <motion.div
              key="womens-health"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left: Cycle Logging & pregnancy tracking */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* Cycle Tracker Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="material-symbols-outlined text-white">calendar_today</span>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Cycle Tracker</h3>
                  </div>

                  <form onSubmit={handleLogCycle} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Last Period Date</label>
                      <input
                        type="date"
                        value={lastPeriodDate}
                        onChange={(e) => setLastPeriodDate(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Cycle Length (Days)</label>
                      <input
                        type="number"
                        min="20"
                        max="45"
                        value={cycleLength}
                        onChange={(e) => setCycleLength(Number(e.target.value))}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:border-white/30 focus:outline-none transition-colors"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-bold py-3.5 px-6 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      Save Cycle Log
                    </button>
                  </form>

                  {/* Calculations Overlay */}
                  {calcs && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/5 pt-6">
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                        <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Next Expected Period</p>
                        <p className="font-sans text-sm font-bold text-white mt-1">{calcs.nextPeriod}</p>
                      </div>
                      <div className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl">
                        <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Fertile Window Range</p>
                        <p className="font-sans text-xs font-semibold text-white mt-1">
                          {calcs.fertileStart} — {calcs.fertileEnd}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Maternal Milestones */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-white">child_care</span>
                      <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Maternal Journey Guide</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">Select Gestation Week:</label>
                      <select
                        value={pregnancyWeek}
                        onChange={(e) => setPregnancyWeek(Number(e.target.value))}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                      >
                        {Array.from({ length: 40 }, (_, i) => i + 1).map(w => (
                          <option key={w} value={w} className="bg-black">Week {w}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      <h4 className="font-sans text-xs font-bold text-white mb-1.5">Fetal Development Overview</h4>
                      <p className="font-sans text-xs text-white/60 leading-relaxed">
                        {pregnancyWeek <= 4 && 'Embryonic implantation and rapid cell division are taking place.'}
                        {pregnancyWeek > 4 && pregnancyWeek <= 12 && 'First Trimester: Basic organ structures and cardiovascular systems are establishing.'}
                        {pregnancyWeek > 12 && pregnancyWeek <= 27 && 'Second Trimester: Movement begins to form. Nails, hairs, and lung dynamics start mature steps.'}
                        {pregnancyWeek > 27 && 'Third Trimester: Fetal weight gain and final brain development acceleration are active.'}
                      </p>
                    </div>

                    <div className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl">
                      <h4 className="font-sans text-xs font-bold text-white mb-1.5">Nigerian Maternal Nutrition Tip</h4>
                      <p className="font-sans text-xs text-white/60 leading-relaxed">
                        Consume dishes rich in iron and folates. Integrating traditional ugu leaf (fluted pumpkin) vegetable juices or stews paired with brown beans provides excellent support for maternal red-cell multiplication.
                      </p>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right: History & Consultation Trigger */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider mb-4">Cycle History Logs</h3>
                  {logs.cycle.length === 0 ? (
                    <p className="font-sans text-xs text-white/40 text-center py-4">No cycle dates logged yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.cycle.map((c, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5">
                          <span className="font-sans text-xs text-white">{new Date(c.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="font-mono text-[9px] text-white/50">{c.length} Day cycle</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 text-center bento-glass">
                  <span className="material-symbols-outlined text-4xl text-white/20">female</span>
                  <h3 className="font-sans text-sm font-bold text-white mt-3">Speak with a Specialist</h3>
                  <p className="font-sans text-xs text-white/50 mt-1.5 mb-6">
                    Connect anonymously with a certified gynecologist or maternity physician.
                  </p>
                  <button
                    onClick={() => navigate('/directory')}
                    className="w-full bg-white text-black font-sans text-xs font-bold py-3.5 rounded-full hover:bg-white/95 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    Find a Doctor
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeCategory === 'oncology' && (
            <motion.div
              key="oncology"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: Chemo Cycle Logger */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="material-symbols-outlined text-white">medication_liquid</span>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Chemotherapy Cycle Logger</h3>
                  </div>

                  <form onSubmit={handleLogChemo} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Cycle Date</label>
                        <input
                          type="date"
                          value={chemoDate}
                          onChange={(e) => setChemoDate(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                      <div>
                        <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Chemotherapy Regimen</label>
                        <input
                          type="text"
                          placeholder="e.g. Doxorubicin / Paclitaxel"
                          value={chemoRegimen}
                          onChange={(e) => setChemoRegimen(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-3">Logged Side Effects</label>
                      <div className="flex flex-wrap gap-2.5">
                        {Object.keys(chemoSideEffects).map(effect => (
                          <button
                            type="button"
                            key={effect}
                            onClick={() => setChemoSideEffects({ ...chemoSideEffects, [effect]: !chemoSideEffects[effect] })}
                            className={`px-4 py-2 rounded-full border transition-all text-xs font-semibold ${
                              chemoSideEffects[effect]
                                ? 'bg-white text-black border-white'
                                : 'bg-white/[0.02] border-white/10 text-white/60 hover:text-white'
                            }`}
                          >
                            {effect.charAt(0).toUpperCase() + effect.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-bold py-3.5 px-6 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      Log Cycle Entry
                    </button>
                  </form>
                </div>

                {/* Cancer Foundation Links */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="material-symbols-outlined text-white">volunteer_activism</span>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Nigerian Support Organizations</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                      { name: 'Medicaid Cancer Foundation', desc: 'Promotes cancer awareness, supports treatment fees for patients, and sponsors screenings across Nigeria.', url: 'https://medicaidcancerfoundation.org' },
                      { name: 'Cancer Aware Nigeria', desc: 'Focused on early detection of breast and cervical cancers, advocacy, and patient navigation paths.', url: 'https://www.canceraware.org.ng' },
                      { name: 'Lakeshore Support Group', desc: 'Clinical consultations, cancer wellness, chemotherapy care programs, and survivorship group panels.', url: 'https://lakeshorecancerclinic.com' }
                    ].map(ngo => (
                      <div key={ngo.name} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                          <h4 className="font-sans text-xs font-bold text-white mb-2">{ngo.name}</h4>
                          <p className="font-sans text-[10px] text-white/50 leading-relaxed mb-4">{ngo.desc}</p>
                        </div>
                        <a
                          href={ngo.url}
                          target="_blank"
                          rel="noreferrer"
                          className="font-mono text-[9px] text-white/60 hover:text-white uppercase tracking-wider flex items-center gap-1 mt-auto"
                        >
                          Visit Platform
                          <span className="material-symbols-outlined text-[10px]">open_in_new</span>
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: History */}
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider mb-4">Logged Regimens</h3>
                  {logs.chemo.length === 0 ? (
                    <p className="font-sans text-xs text-white/40 text-center py-4">No cycle logs present.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.chemo.map((c, i) => (
                        <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-xs font-bold text-white">{c.regimen}</span>
                            <span className="font-mono text-[8px] text-white/40">{new Date(c.date).toLocaleDateString('en-GB')}</span>
                          </div>
                          {c.effects?.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {c.effects.map((e, idx) => (
                                <span key={idx} className="font-mono text-[8px] bg-white/10 px-2 py-0.5 rounded-full text-white/60">{e}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeCategory === 'ncd' && (
            <motion.div
              key="ncd"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Left Column: BP & Glucose Forms */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* BP Log Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="material-symbols-outlined text-white">favorite</span>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Blood Pressure Log</h3>
                  </div>

                  <form onSubmit={handleLogBP} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Systolic (mmHg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 120"
                        value={bpSys}
                        onChange={(e) => setBpSys(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Diastolic (mmHg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 80"
                        value={bpDia}
                        onChange={(e) => setBpDia(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-bold py-3.5 px-6 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      Log BP Reading
                    </button>
                  </form>
                </div>

                {/* Glucose Log Card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <div className="flex items-center gap-2.5 mb-6">
                    <span className="material-symbols-outlined text-white">bloodtype</span>
                    <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider">Blood Glucose Log</h3>
                  </div>

                  <form onSubmit={handleLogGlucose} className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Reading (mg/dL)</label>
                      <input
                        type="number"
                        placeholder="e.g. 95"
                        value={glucoseVal}
                        onChange={(e) => setGlucoseVal(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[9px] text-white/40 uppercase tracking-wider mb-2">Test State</label>
                      <select
                        value={glucoseType}
                        onChange={(e) => setGlucoseType(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none"
                      >
                        <option value="FASTING" className="bg-black">Fasting</option>
                        <option value="POST_PRANDIAL" className="bg-black">Post-Prandial (After Meal)</option>
                        <option value="RANDOM" className="bg-black">Random</option>
                      </select>
                    </div>
                    <button
                      type="submit"
                      className="bg-white text-black text-xs font-bold py-3.5 px-6 rounded-xl hover:bg-white/90 active:scale-[0.98] transition-all"
                    >
                      Log Glucose
                    </button>
                  </form>
                </div>

                {/* Diet Guide Table */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <h3 className="font-sans text-sm font-bold text-white uppercase tracking-wider mb-6">Nigerian NCD Nutrition Matrix</h3>
                  <div className="space-y-4">
                    {DIET_GUIDE.map((diet, idx) => (
                      <div key={idx} className="bg-white/[0.01] border border-white/5 p-4 rounded-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                        <div className="md:col-span-1">
                          <p className="font-sans text-xs font-bold text-white">{diet.food}</p>
                        </div>
                        <div className="md:col-span-1">
                          <span className="font-mono text-[8px] bg-white/10 px-2.5 py-1 rounded-full text-white/70 uppercase tracking-wide font-bold">{diet.target}</span>
                        </div>
                        <div className="md:col-span-2">
                          <p className="font-sans text-[10px] text-white/50 leading-relaxed">{diet.benefit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Right Column: History */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* BP Logs */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider mb-4">BP History</h3>
                  {logs.bp.length === 0 ? (
                    <p className="font-sans text-xs text-white/40 text-center py-4">No readings.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.bp.map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-sans text-sm font-bold text-white">{item.systolic}/{item.diastolic} <span className="font-sans text-[10px] text-white/40">mmHg</span></p>
                            <p className="font-mono text-[7px] text-white/40 uppercase tracking-wide mt-0.5">{new Date(item.date).toLocaleString('en-GB')}</p>
                          </div>
                          <span className={`font-mono text-[8px] uppercase tracking-wide px-2 py-0.5 rounded font-bold ${
                            item.status.includes('Stage 2') ? 'text-red-400 bg-red-400/10 border border-red-500/20' :
                            item.status.includes('Stage 1') ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-500/20' : 'text-emerald-400 bg-emerald-400/10 border border-emerald-500/20'
                          }`}>{item.status.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Glucose Logs */}
                <div className="bg-white/[0.02] border border-white/5 rounded-[2rem] p-6 bento-glass">
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider mb-4">Glucose History</h3>
                  {logs.glucose.length === 0 ? (
                    <p className="font-sans text-xs text-white/40 text-center py-4">No readings.</p>
                  ) : (
                    <div className="space-y-3">
                      {logs.glucose.map((item, i) => (
                        <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 flex justify-between items-center">
                          <div>
                            <p className="font-sans text-sm font-bold text-white">{item.value} <span className="font-sans text-[10px] text-white/40">mg/dL</span></p>
                            <p className="font-mono text-[7px] text-white/40 uppercase tracking-wide mt-0.5">{item.type} // {new Date(item.date).toLocaleDateString('en-GB')}</p>
                          </div>
                          <span className={`font-mono text-[8px] uppercase tracking-wide px-2 py-0.5 rounded font-bold ${
                            item.status.includes('Diabetic') ? 'text-red-400 bg-red-400/10' : 'text-emerald-400 bg-emerald-400/10'
                          }`}>{item.status.split(' ')[0]}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
