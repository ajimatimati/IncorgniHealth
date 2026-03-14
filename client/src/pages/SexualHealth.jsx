import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { useToast } from '../components/Toast';
import { TestTubes, Pill, HeartPulse, Lock, ChevronDown, Calendar, ShieldCheck, MapPin, Truck, Stethoscope } from 'lucide-react';

/* ── SVG Icons ── */
const Icons = {
  vial: <TestTubes className="w-8 h-8" strokeWidth={1.5} />,
  pill: <Pill className="w-8 h-8" strokeWidth={1.5} />,
  heart: <HeartPulse className="w-8 h-8" strokeWidth={1.5} />,
  lock: <Lock className="w-8 h-8" strokeWidth={1.5} />,
  chevronDown: <ChevronDown className="w-4 h-4" strokeWidth={2} />,
  calendar: <Calendar className="w-5 h-5" strokeWidth={1.5} />,
  shield: <ShieldCheck className="w-5 h-5 shrink-0" strokeWidth={1.5} />,
  truck: <Truck className="w-8 h-8 shrink-0" strokeWidth={1.5} />,
  mapPin: <MapPin className="w-8 h-8 shrink-0" strokeWidth={1.5} />,
  stethoscope: <Stethoscope className="w-8 h-8 shrink-0" strokeWidth={1.5} />,
};

/* ── Animated tab definitions ── */
const TABS = [
  { id: 'testing',    label: 'STI Testing'  },
  { id: 'education',  label: 'Education'  },
  { id: 'consult',    label: 'Consultation' },
];

/* ── Education Accordion ── */
const EducationAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const items = [
    { title: 'Safe Practices Guide', content: 'Consistency is key. Internal and external condoms, when used correctly, are 98% effective at preventing most STIs and unintended pregnancy. Lubrication reduces breakage risk.' },
    { title: 'Testing Frequency', content: 'Sexually active individuals should get tested at least once a year. If you have new or multiple partners, testing every 3–6 months is recommended.' },
    { title: 'PrEP & PEP Explained', content: 'PrEP is taken before exposure to prevent HIV — up to 99% effective when taken daily. PEP is an emergency medication taken within 72 hours after potential exposure.' },
    { title: 'Myth Busting', content: 'Myth: You can tell if someone has an STI by looking. Fact: Most STIs have no visible symptoms. The only way to know is to get tested.' },
  ];

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} className="bg-white rounded-xl border border-[#E8E6E3] shadow-card-sm overflow-hidden">
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-5 text-left hover:bg-[#F9F9FB] transition-colors"
          >
            <span className="font-bold text-[#18181B] text-[15px]">{item.title}</span>
            <motion.span animate={{ rotate: openIndex === i ? 180 : 0 }} transition={{ duration: 0.25 }} className="text-[#A1A1AA]">
              {Icons.chevronDown}
            </motion.span>
          </button>
          <AnimatePresence initial={false}>
            {openIndex === i && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }} className="overflow-hidden">
                <div className="px-5 pb-5 text-[14px] text-[#71717A] leading-relaxed border-t border-[#F0EDED] pt-4 bg-[#F9F9FB]">
                  {item.content}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ))}
    </div>
  );
};

/* ── Main Page ── */
const SexualHealth = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('testing');

  const startConsult = () => navigate('/dashboard'); // Initiating consult takes them to dashboard normally, or a specific API call

  const handleTestOption = (type) => {
    toast.success(`Selected: ${type}. Redirecting to processing...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
      className="p-4 sm:p-8 max-w-4xl mx-auto font-sans pb-28"
    >
      {/* Page header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl lg:text-4xl font-black text-[#18181B] mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Sexual Health
        </h1>
        <p className="text-[14px] text-[#71717A] font-medium leading-relaxed">
          Confidential screening, education, and care. Zero judgment.
        </p>
      </div>

      {/* Privacy banner */}
      <div className="relative overflow-hidden border border-[#FECDD3] rounded-2xl bg-[#FFF1F2] p-6 mb-10 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-white border border-[#FDA4AF] text-[#E11D48] flex items-center justify-center shrink-0 shadow-sm">
          {Icons.shield}
        </div>
        <div className="relative z-10 text-center sm:text-left">
          <h3 className="font-bold text-[16px] text-[#E11D48] flex items-center justify-center sm:justify-start gap-2 mb-1.5">
            Your privacy is absolute
            <span className="w-1.5 h-1.5 rounded-full bg-[#E11D48] animate-pulse" />
          </h3>
          <p className="text-[13px] text-[#881337] leading-relaxed max-w-xl">
            Zero-knowledge encryption for all health data. Consultations are anonymous. Billing never mentions sexual health services.
          </p>
        </div>
      </div>

      {/* Animated Tab Pills */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`relative px-5 py-2.5 rounded-full text-[12px] font-bold uppercase tracking-wider transition-colors flex-shrink-0 border ${
              activeTab === tab.id 
                ? 'bg-[#18181B] text-white border-[#18181B] shadow-card-sm' 
                : 'bg-white border-[#E8E6E3] text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#18181B]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'testing' && (
          <motion.div key="testing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="space-y-5">
            <h2 className="text-xl font-black text-[#18181B] mb-2">Select STI Testing Option</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {[
                { icon: Icons.truck,  title: 'Home Kit / Phlebotomist', desc: 'Securely delivered to your home', color: '#E11D48', bg: '#FFF1F2', border: '#FECDD3', action: () => handleTestOption('Home Kit') },
                { icon: Icons.heart,  title: 'Local Hospital', desc: 'Via an intermediary facility', color: '#6D28D9', bg: '#F5F3FF', border: '#EDE9FE', action: () => handleTestOption('Local Hospital') },
                { icon: Icons.mapPin, title: 'Go Directly', desc: 'Walk-in directly for testing', color: '#059669', bg: '#F0FDF4', border: '#BBF7D0', action: () => handleTestOption('Direct Visit') },
              ].map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.35 }}>
                  <button
                    onClick={r.action}
                    className="flex flex-col items-center text-center w-full p-6 rounded-2xl transition-all hover:-translate-y-1 shadow-sm hover:shadow-card-md bg-white border border-[#E8E6E3]"
                  >
                    <div className="w-14 h-14 flex items-center justify-center mb-5 rounded-xl border" style={{ background: r.bg, color: r.color, borderColor: r.border }}>
                      {r.icon}
                    </div>
                    <h3 className="font-bold text-[16px] text-[#18181B] mb-1">{r.title}</h3>
                    <p className="text-[13px] font-semibold" style={{ color: r.color }}>{r.desc}</p>
                  </button>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28, duration: 0.35 }} className="mt-6 flex flex-col md:flex-row items-center justify-between p-6 bg-[#F9F9FB] rounded-2xl border border-[#E8E6E3] gap-4">
              <div className="text-center md:text-left">
                <h3 className="font-bold text-[16px] text-[#18181B]">Want to skip testing?</h3>
                <p className="text-[13px] text-[#71717A] mt-1 line-clamp-2 leading-relaxed max-w-md">Speak directly with a physician now or schedule a consultation for a later time that suits you.</p>
              </div>
              <RippleButton onClick={() => setActiveTab('consult')} variant="primary" className="whitespace-nowrap">Skip to Consultation</RippleButton>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'education' && (
          <motion.div key="education" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <EducationAccordion />
          </motion.div>
        )}

        {activeTab === 'consult' && (
          <motion.div key="consult" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 md:grid-cols-2 gap-5">
             <div className="p-8 bg-white border border-[#E8E6E3] shadow-card-sm rounded-2xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-[#FFF1F2] border border-[#FECDD3] rounded-full flex items-center justify-center text-[#E11D48] mb-4 shadow-sm">
                     {Icons.stethoscope}
                 </div>
                 <h3 className="text-xl font-black text-[#18181B] mb-2">Immediate Consultation</h3>
                 <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed">Connect with an available doctor right now for urgent questions, diagnosis or care.</p>
                 <RippleButton onClick={startConsult} className="w-full justify-center !py-4" size="lg">Speak to Physician Now</RippleButton>
             </div>
             
             <div className="p-8 bg-white border border-[#E8E6E3] shadow-card-sm rounded-2xl flex flex-col items-center text-center">
                 <div className="w-16 h-16 bg-[#FEF3C7] border border-[#FDE68A] rounded-full flex items-center justify-center text-[#D97706] mb-4 shadow-sm">
                     {Icons.calendar}
                 </div>
                 <h3 className="text-xl font-black text-[#18181B] mb-2">Schedule for Later</h3>
                 <p className="text-[14px] text-[#71717A] mb-8 leading-relaxed">Book a specific time slot that works best for your privacy and your schedule.</p>
                 <RippleButton onClick={() => setActiveTab('book')} className="w-full justify-center !py-4 bg-[#D97706] hover:bg-[#B45309]" size="lg">Book Appointment</RippleButton>
             </div>
          </motion.div>
        )}

        {activeTab === 'book' && (
          <motion.div key="book" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }} className="bg-white rounded-2xl border border-[#E8E6E3] p-6 sm:p-10 shadow-card-sm max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-[#F0EDED]">
              <h3 className="section-label !mb-0 flex items-center gap-3 !text-[#18181B] !text-base">
                <span className="text-[#D97706]">{Icons.calendar}</span> Schedule Appointment
              </h3>
              <button onClick={() => setActiveTab('consult')} className="text-[13px] font-bold text-[#A1A1AA] hover:text-[#18181B] transition-colors">
                Back
              </button>
            </div>
            <div className="space-y-6">
              <div>
                <label className="section-label mb-2 block">Preferred Date</label>
                <input type="date" className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] text-[#18181B] focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors" />
              </div>
              <div>
                <label className="section-label mb-2 block">Preferred Time</label>
                <select className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] text-[#18181B] focus:outline-none focus:border-[#D97706] focus:bg-white transition-colors appearance-none">
                  <option value="morning">Morning (9AM – 12PM)</option>
                  <option value="afternoon">Afternoon (1PM – 4PM)</option>
                  <option value="evening">Evening (5PM – 8PM)</option>
                </select>
              </div>
              <div className="pt-6 border-t border-[#F0EDED] mt-4">
                <RippleButton onClick={() => toast.success('Appointment booked successfully.')} className="w-full justify-center !py-4 bg-[#D97706] hover:bg-[#B45309]" size="lg">Confirm Booking</RippleButton>
                <p className="text-[12px] font-bold text-[#A1A1AA] text-center mt-4">No payment required until doctor confirmation.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default SexualHealth;
