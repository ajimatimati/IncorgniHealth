import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import { AnatomicalModel } from './AnatomicalModel';
import { RefreshCw } from 'lucide-react';

const defaultVitals = {
  heartRate:     72,
  bloodPressure: '120/80',
  weight:        '75kg',
  height:        '180cm',
  bmi:           '23.1',
  temperature:   '36.8°C',
  oxygen:        '98%',
  status:        'Optimal',
};

// ─── Clean, non-glowing diagnostic dot ────────────────────────────────
const BodyDot = ({ color = 'blue', label, severity = 'normal' }) => {
  const palette = {
    blue:   { bg: 'bg-[#EDE9FE]', dot: 'bg-[#6D28D9]', text: 'text-[#6D28D9]' }, // Violet
    orange: { bg: 'bg-[#FEF3C7]', dot: 'bg-[#D97706]', text: 'text-[#D97706]' }, // Amber
    green:  { bg: 'bg-[#D1FAE5]', dot: 'bg-[#059669]', text: 'text-[#059669]' }, // Green
    red:    { bg: 'bg-[#FEE2E2]', dot: 'bg-[#DC2626]', text: 'text-[#DC2626]' }, // Red
  };
  const c = palette[color] || palette.blue;

  return (
    <div className="relative group/dot cursor-pointer select-none" style={{ width: 16, height: 16 }}>
      {severity === 'warning' && (
        <span className={`absolute inset-0 rounded-full ${c.bg} opacity-50 animate-ping`} />
      )}
      <div className={`absolute inset-0 rounded-full ${c.bg} flex items-center justify-center`}>
        <span className={`w-2 h-2 rounded-full ${c.dot}`} />
      </div>

      <div className="
        absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none
        opacity-0 group-hover/dot:opacity-100 transition-opacity duration-150
        whitespace-nowrap bg-white border border-[#E8E6E3]
        px-2.5 py-1.5 rounded-lg shadow-card z-50
      ">
        <span className={`text-[10.5px] font-bold ${c.text}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

const DiagnosticOverview = ({
  patientData,
  vitals   = defaultVitals,
  title    = 'Diagnostic Profile',
  readOnly = false,
}) => {
  const patientName = patientData?.nickname || patientData?.publicId || 'Unknown Client';

  return (
    <div className="w-full flex flex-col md:flex-row bg-white rounded-2xl overflow-hidden border border-[#E8E6E3] shadow-card-md relative" style={{ minHeight: 440 }}>
      {/* ── LEFT PANEL — Vitals ─────────────────────────────────── */}
      <div className="w-full md:w-[320px] shrink-0 flex flex-col z-10 p-6 md:border-r border-[#F0EDED] bg-white">
        <div className="mb-6">
          <p className="section-label mb-1">{title}</p>
          <h2 className="text-xl font-black text-[#18181B] truncate" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            {patientName}
          </h2>
          <div className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold ${
            vitals.status === 'Optimal'
              ? 'bg-[#D1FAE5] text-[#059669]'
              : 'bg-[#FEF3C7] text-[#D97706]'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${vitals.status === 'Optimal' ? 'bg-[#059669]' : 'bg-[#D97706]'}`} />
            {vitals.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <VitalCard label="Heart Rate"     value={`${vitals.heartRate} bpm`} accent="violet" />
          <VitalCard label="Blood Pressure" value={vitals.bloodPressure}      accent="gray" />
          <VitalCard label="SpO2"           value={vitals.oxygen}             accent="green" />
          <VitalCard label="Temp"           value={vitals.temperature}        accent="amber" />
          <div className="col-span-2 border-t border-[#F0EDED] pt-3 mt-1">
            <p className="section-label mb-3">Biometrics</p>
          </div>
          <VitalCard label="Height" value={vitals.height} accent="gray" />
          <VitalCard label="Weight" value={vitals.weight} accent="gray" />
          <VitalCard label="BMI"    value={vitals.bmi}    accent="gray" />
          <VitalCard label="Age"    value={patientData?.age ? `${patientData.age} yrs` : '—'} accent="gray" />
        </div>

        {!readOnly && (
          <button className="mt-5 w-full py-2.5 text-xs font-bold text-[#18181B] bg-white border border-[#E8E6E3] rounded-xl hover:bg-[#F4F4F5] transition-colors">
            Update Biometrics
          </button>
        )}
      </div>

      {/* ── RIGHT PANEL — 3D Model ─────────────────── */}
      <div className="flex-1 relative min-h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-[#F9F9FB] group">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-full border border-[#E8E6E3] shadow-sm">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2} />
            Drag to rotate
          </span>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#E8E6E3] rounded-full border-t-[#6D28D9] animate-spin" />
            <p className="section-label">Loading Model...</p>
          </div>
        }>
          <Canvas camera={{ position: [0, 0.5, 5.5], fov: 50 }} gl={{ antialias: true }} shadows className="absolute inset-0">
            {/* Very clean studio lighting for the white/matte model */}
            <ambientLight intensity={1.5} />
            <directionalLight position={[5, 10, 5]} intensity={2.0} color="#ffffff" castShadow />
            <directionalLight position={[-5, 5, -5]} intensity={1.0} color="#f8fafc" />

            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={2.5}
              maxDistance={8}
              autoRotate={true}
              autoRotateSpeed={0.5}
              minPolarAngle={Math.PI * 0.2}
              maxPolarAngle={Math.PI * 0.8}
            />

            <AnatomicalModel />

            <Html position={[0.22, 0.5, 0.4]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="blue" label="Heart Rate Nominal" severity="normal" />
            </Html>
            <Html position={[0.15, 2.0, 0.3]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="orange" label="Cortisol Elevated" severity="warning" />
            </Html>
            <Html position={[-0.28, 0.6, 0.35]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="green" label="SpO2 98% — Optimal" severity="normal" />
            </Html>
            <Html position={[0.1, -0.1, 0.4]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="blue" label="Core Vitals Stable" severity="normal" />
            </Html>
          </Canvas>
        </Suspense>
      </div>
    </div>
  );
};

const ACCENT = {
  violet:  'text-[#6D28D9]',
  green:   'text-[#059669]',
  amber:   'text-[#D97706]',
  gray:    'text-[#18181B]',
};

const VitalCard = ({ label, value, accent = 'gray' }) => (
  <div className="bg-[#F9F9FB] border border-[#F0EDED] rounded-xl p-3 flex flex-col justify-between">
    <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest">{label}</span>
    <span className={`text-[13px] font-bold mt-1 ${ACCENT[accent]}`}>{value}</span>
  </div>
);

export default DiagnosticOverview;
