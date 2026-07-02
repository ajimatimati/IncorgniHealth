import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ONBOARDING_ROLES = [
  { id: 'DOCTOR', label: 'Doctor', icon: 'stethoscope' },
  { id: 'PHARMACY', label: 'Pharmacy', icon: 'pill' },
  { id: 'LAB_SCIENTIST', label: 'Lab / Imaging', icon: 'biotech' },
];

const SPECIALIZATIONS = {
  DOCTOR: ['General Medicine', 'Gynecology', 'Psychiatry', 'Infectious Disease', 'Urology', 'Internal Medicine'],
  PHARMACY: ['Retail Pharmacy', 'Specialised Dispensary', 'Wholesale/Distribution'],
  LAB_SCIENTIST: ['Clinical Pathology', 'Radiology/Imaging', 'Microbiology', 'Phlebotomy Center'],
};

export default function PartnerRegistrationModal({ isOpen, onClose, initialRole = 'DOCTOR' }) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState(initialRole);
  
  // Data States
  const [baseProfile, setBaseProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [credentials, setCredentials] = useState({ licenseNumber: '', specialization: '' });
  const [facility, setFacility] = useState({ name: '', address: '', hours: '08:00 AM - 05:00 PM', is247: false });
  const [docs, setDocs] = useState([]);
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRole(initialRole || 'DOCTOR');
      setStep(1);
      setCredentials({ licenseNumber: '', specialization: '' });
      setDocs([]);
    }
  }, [isOpen, initialRole]);

  if (!isOpen) return null;

  const handleNext = () => setStep(s => s + 1);
  const handlePrev = () => setStep(s => s - 1);

  const handleSubmit = () => {
    setSubmitting(true);
    // Mock network request
    setTimeout(() => {
      setSubmitting(false);
      setStep(5); // Success state
    }, 2000);
  };

  const addMockDoc = () => {
    if (docs.length >= 3) return;
    setDocs([...docs, { id: Date.now(), name: `Verification_Document_${docs.length + 1}.pdf`, size: '1.2 MB' }]);
  };

  // ── Step Renderers ────────────────────────────────────────────────────────
  
  const renderStep1 = () => (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <label className="space-y-1.5 flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">First Name</span>
          <input
            type="text"
            value={baseProfile.firstName}
            onChange={e => setBaseProfile({ ...baseProfile, firstName: e.target.value })}
            className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
            placeholder="Dr. John"
          />
        </label>
        <label className="space-y-1.5 flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Last Name</span>
          <input
            type="text"
            value={baseProfile.lastName}
            onChange={e => setBaseProfile({ ...baseProfile, lastName: e.target.value })}
            className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
            placeholder="Doe"
          />
        </label>
      </div>
      <label className="space-y-1.5 flex flex-col">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">Work Email Address</span>
        <input
          type="email"
          value={baseProfile.email}
          onChange={e => setBaseProfile({ ...baseProfile, email: e.target.value })}
          className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          placeholder="doctor@hospital.com"
        />
      </label>
      <label className="space-y-1.5 flex flex-col">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">Direct Phone / WhatsApp</span>
        <input
          type="tel"
          value={baseProfile.phone}
          onChange={e => setBaseProfile({ ...baseProfile, phone: e.target.value })}
          className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          placeholder="+234 800 000 0000"
        />
      </label>
    </div>
  );

  const renderStep2 = () => {
    let licenseLabel = 'Medical License Number';
    if (role === 'DOCTOR') licenseLabel = 'MDCN Folio Number / License Registration';
    if (role === 'PHARMACY') licenseLabel = 'PCN Registration Number';
    if (role === 'LAB_SCIENTIST') licenseLabel = 'MLSCN Registration Number';

    return (
      <div className="space-y-5">
        <div className="space-y-3">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Application Role</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ONBOARDING_ROLES.map(r => (
              <button
                key={r.id}
                onClick={() => { setRole(r.id); setCredentials({ licenseNumber: '', specialization: '' }); }}
                className={`py-3 px-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                  role === r.id ? 'bg-primary/10 border-primary shadow-sm' : 'bg-surface border-outline-variant/20 hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-2xl ${role === r.id ? 'text-primary' : 'text-outline'}`}>{r.icon}</span>
                <span className={`font-label text-[10px] uppercase tracking-widest ${role === r.id ? 'text-primary' : 'text-on-surface'}`}>{r.label}</span>
              </button>
            ))}
          </div>
        </div>

        <label className="space-y-1.5 flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">{licenseLabel}</span>
          <input
            type="text"
            value={credentials.licenseNumber}
            onChange={e => setCredentials({ ...credentials, licenseNumber: e.target.value })}
            className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
            placeholder="e.g. MDCN/0000/0000"
          />
        </label>

        <label className="space-y-1.5 flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Area of Specialisation</span>
          <select
            value={credentials.specialization}
            onChange={e => setCredentials({ ...credentials, specialization: e.target.value })}
            className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors appearance-none"
          >
            <option value="">Select Specialisation...</option>
            {SPECIALIZATIONS[role]?.map(spec => (
              <option key={spec} value={spec}>{spec}</option>
            ))}
            <option value="Other">Other / General</option>
          </select>
        </label>
      </div>
    );
  };

  const renderStep3 = () => (
    <div className="space-y-5">
      <label className="space-y-1.5 flex flex-col">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">
          {role === 'DOCTOR' ? 'Primary Hospital / Clinic Name' : role === 'PHARMACY' ? 'Pharmacy Name' : 'Laboratory Center Name'}
        </span>
        <input
          type="text"
          value={facility.name}
          onChange={e => setFacility({ ...facility, name: e.target.value })}
          className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors"
          placeholder={`Enter the name of your ${role === 'DOCTOR' ? 'clinic' : 'facility'}`}
        />
      </label>
      <label className="space-y-1.5 flex flex-col">
        <span className="font-label text-[10px] uppercase tracking-widest text-outline">Full Operational Address</span>
        <textarea
          value={facility.address}
          onChange={e => setFacility({ ...facility, address: e.target.value })}
          className="w-full h-24 pt-3 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors resize-none"
          placeholder="123 Health Ave, Lagos, Nigeria"
        />
      </label>
      <div className="grid grid-cols-[1fr_auto] items-end gap-4">
        <label className="space-y-1.5 flex flex-col">
          <span className="font-label text-[10px] uppercase tracking-widest text-outline">Working / Support Hours</span>
          <input
            type="text"
            value={facility.hours}
            disabled={facility.is247}
            onChange={e => setFacility({ ...facility, hours: e.target.value })}
            className="w-full h-12 bg-surface border border-outline-variant/20 rounded-xl px-4 text-sm focus:border-primary/50 focus:outline-none transition-colors disabled:opacity-50"
          />
        </label>
        <button
          onClick={() => setFacility(f => ({ ...f, is247: !f.is247, hours: !f.is247 ? '24/7 Operations' : '08:00 AM - 05:00 PM' }))}
          className={`h-12 px-4 rounded-xl border flex items-center justify-center gap-2 font-label text-[10px] uppercase tracking-widest transition-all ${
            facility.is247 ? 'bg-primary/10 border-primary text-primary' : 'bg-surface border-outline-variant/20 text-outline'
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">{facility.is247 ? 'check_circle' : 'radio_button_unchecked'}</span>
          24/7 Active
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-sm leading-relaxed text-on-surface-variant">
        To complete verification, we require copies of your governmental photo ID and your practising license.
      </div>
      
      <button onClick={addMockDoc} disabled={docs.length >= 3} className="w-full h-24 border-2 border-dashed border-primary/40 rounded-2xl bg-surface-container-low hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed">
        <span className="material-symbols-outlined text-primary text-2xl">cloud_upload</span>
        <span className="font-label text-[11px] uppercase tracking-widest text-on-surface">Click to Upload Document</span>
      </button>

      <div className="space-y-2">
        {docs.map(d => (
          <div key={d.id} className="flex items-center justify-between p-3 bg-surface rounded-xl border border-outline-variant/20">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-outline">description</span>
              <div>
                <p className="font-headline text-xs font-bold text-on-surface">{d.name}</p>
                <p className="font-label text-[9px] text-outline tracking-wider uppercase mt-0.5">{d.size}</p>
              </div>
            </div>
            <button onClick={() => setDocs(docs.filter(x => x.id !== d.id))} className="material-symbols-outlined text-[18px] text-error p-2 hover:bg-error/10 rounded-full transition-colors">delete</button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="py-8 flex flex-col items-center text-center space-y-4">
      <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-4">
        <span className="material-symbols-outlined text-4xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>task_alt</span>
      </div>
      <h2 className="font-headline text-2xl font-bold text-on-surface">Application Submitted</h2>
      <p className="text-sm text-on-surface-variant max-w-sm leading-relaxed">
        Thank you for applying to join the IncogniCare Network. Our security and compliance team is reviewing your verified credentials.
      </p>
      <p className="text-sm text-on-surface-variant opacity-80 max-w-sm border-t border-outline-variant/20 pt-4 mt-2">
        You will receive an email at <span className="font-bold">{baseProfile.email || 'your email'}</span> once your account securely unlocks.
      </p>
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={step === 5 ? onClose : undefined} />
          
          <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }} className="relative bg-surface border border-outline-variant/10 rounded-[32px] w-full max-w-xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Header */}
            {step < 5 && (
              <div className="px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-lowest">
                <div>
                  <h2 className="font-headline text-xl font-bold text-on-surface">Partner Registration</h2>
                  <p className="font-label text-[10px] uppercase tracking-widest text-primary mt-1">Step {step} of 4</p>
                </div>
                <button onClick={onClose} className="w-10 h-10 bg-surface-container rounded-full flex items-center justify-center text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* Stepper Progress */}
            {step < 5 && (
              <div className="h-1 w-full bg-surface-container">
                <motion.div className="h-full bg-primary" initial={{ width: 0 }} animate={{ width: `${(step / 4) * 100}%` }} transition={{ duration: 0.3 }} />
              </div>
            )}

            {/* Content Body */}
            <div className="px-8 py-8 min-h-[400px]">
              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
            </div>

            {/* Footer Actions */}
            {step < 5 && (
              <div className="px-8 py-5 border-t border-outline-variant/10 bg-surface-container-lowest flex items-center justify-between">
                <div>
                  {step > 1 && (
                    <button onClick={handlePrev} className="px-5 py-2.5 rounded-xl font-label text-[11px] uppercase tracking-widest text-on-surface-variant hover:bg-surface-container-low transition-colors">
                      Back
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={onClose} className="px-5 py-2.5 rounded-xl font-label text-[11px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors">
                    Cancel
                  </button>
                  {step < 4 ? (
                    <button onClick={handleNext} className="btn btn-primary px-6">
                      Next Step
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={submitting} className="btn btn-primary px-6 flex items-center gap-2">
                      {submitting ? <><span className="w-4 h-4 border-2 border-on-primary/30 border-t-on-primary rounded-full animate-spin" /> Submitting</> : 'Submit Application'}
                    </button>
                  )}
                </div>
              </div>
            )}
            
            {step === 5 && (
              <div className="px-8 py-6 bg-surface-container-lowest border-t border-outline-variant/10 flex justify-center">
                <button onClick={onClose} className="btn btn-primary px-8">
                  Return to Home
                </button>
              </div>
            )}
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
