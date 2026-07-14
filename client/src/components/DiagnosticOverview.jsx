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

const BodyDot = ({ color = 'primary', label }) => {
  const palette = {
    primary:   { bg: 'bg-primary/20',     dot: 'bg-primary',     text: 'text-primary' },
    tertiary:  { bg: 'bg-tertiary/20',    dot: 'bg-tertiary',    text: 'text-tertiary' },
    secondary: { bg: 'bg-secondary/20',   dot: 'bg-secondary',   text: 'text-secondary' },
    error:     { bg: 'bg-error/20',       dot: 'bg-error',       text: 'text-error' },
  };
  const c = palette[color] || palette.primary;

  return (
    <div className="relative group/dot cursor-pointer select-none" style={{ width: 16, height: 16 }}>
      <div className={`absolute inset-0 rounded-full ${c.bg} flex items-center justify-center border border-white/5`}>
        <span className={`w-2 h-2 rounded-full ${c.dot} shadow-sm`} />
      </div>

      <div className="
        absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none
        opacity-0 group-hover/dot:opacity-100 transition-opacity duration-200
        whitespace-nowrap bg-surface-container-highest border border-outline-variant/20
        px-3 py-1.5 rounded-full shadow-card-lg z-50 backdrop-blur-md
      ">
        <span className={`font-label text-[10px] font-bold uppercase tracking-wider ${c.text}`}>
          {label}
        </span>
      </div>
    </div>
  );
};

const DiagnosticOverview = ({
  patientData,
  vitals   = defaultVitals,
  title    = 'Client Profile',
  readOnly = false,
}) => {
  const patientName = patientData?.nickname || 'Confidential Client';

  return (
    <div className="w-full flex flex-col lg:flex-row bg-surface-container-low rounded-2xl overflow-hidden border border-outline-variant/5 shadow-card-md relative" style={{ minHeight: 480 }}>
      
      {/* ── LEFT PANEL — Vitals ─────────────────────────────────── */}
      <div className="w-full lg:w-[320px] shrink-0 flex flex-col z-10 p-8 lg:border-r border-outline-variant/5 bg-surface-container-low/80 backdrop-blur-md">
        <div className="mb-8">
          <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] mb-1">{title}</p>
          <h2 className="font-headline text-2xl font-black text-on-surface truncate">
            {patientName}
          </h2>
          <div className={`mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold font-label uppercase tracking-widest ${
            vitals.status === 'Optimal'
              ? 'bg-primary/10 text-primary border border-primary/20'
              : 'bg-warning/10 text-warning border border-warning/20'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${vitals.status === 'Optimal' ? 'bg-primary' : 'bg-warning'}`} />
            {vitals.status}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-1">
          <VitalCard label="Heart Rate"     value={`${vitals.heartRate} bpm`} variant="primary" />
          <VitalCard label="BP"             value={vitals.bloodPressure}      variant="neutral" />
          <VitalCard label="SpO2"           value={vitals.oxygen}             variant="tertiary" />
          <VitalCard label="Temp"           value={vitals.temperature}        variant="secondary" />
          
          <div className="col-span-2 mt-4 pt-4 border-t border-outline-variant/5">
            <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] mb-4">Biometrics</p>
          </div>
          
          <VitalCard label="Height" value={vitals.height} variant="neutral" />
          <VitalCard label="Weight" value={vitals.weight} variant="neutral" />
          <VitalCard label="BMI"    value={vitals.bmi}    variant="neutral" />
          <VitalCard label="Age"    value={patientData?.age ? `${patientData.age} yrs` : '—'} variant="neutral" />
        </div>

        {!readOnly && (
          <button className="btn-secondary mt-6 w-full text-[10px]">
            Consult Records
          </button>
        )}
      </div>

      {/* ── RIGHT PANEL — 3D Model ─────────────────── */}
      <div className="flex-1 relative min-h-[400px] flex items-center justify-center cursor-grab active:cursor-grabbing overflow-hidden bg-surface-container-lowest group">
        
        {/* Interaction Hint */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="font-label text-[9px] text-on-surface-variant font-bold uppercase tracking-[0.2em] flex items-center gap-2 bg-surface-container-highest/80 backdrop-blur-md px-4 py-2 rounded-full border border-outline-variant/10 shadow-lg">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={2.5} />
            Rotate Visualization
          </span>
        </div>

        <Suspense fallback={
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-2 border-outline-variant/20 rounded-full border-t-primary animate-spin" />
            <p className="font-label text-[10px] text-outline uppercase tracking-widest">Constructing Model...</p>
          </div>
        }>
          <Canvas camera={{ position: [0, 0.5, 5.5], fov: 45 }} gl={{ antialias: true }} shadows className="absolute inset-0">
            {/* Soft, professional medical lighting */}
            <ambientLight intensity={0.8} />
            <pointLight position={[10, 10, 10]} intensity={1.5} color="#d0bcff" />
            <pointLight position={[-10, 5, -5]} intensity={0.5} color="#8ccdff" />
            <spotLight position={[0, 10, 0]} intensity={1} angle={0.3} penumbra={1} castShadow />

            <OrbitControls
              enableZoom={true}
              enablePan={false}
              minDistance={3}
              maxDistance={7}
              autoRotate={true}
              autoRotateSpeed={0.8}
              minPolarAngle={Math.PI * 0.25}
              maxPolarAngle={Math.PI * 0.75}
            />

            <AnatomicalModel />

            <Html position={[0.22, 0.5, 0.4]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="primary" label="Heart Normal" severity="normal" />
            </Html>
            <Html position={[0.15, 2.0, 0.3]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="tertiary" label="Neurological Check" severity="warning" />
            </Html>
            <Html position={[-0.28, 0.6, 0.35]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="secondary" label="SpO2 Normal" severity="normal" />
            </Html>
            <Html position={[0.1, -0.1, 0.4]} distanceFactor={8} zIndexRange={[50, 0]}>
              <BodyDot color="primary" label="Core Vitals" severity="normal" />
            </Html>
          </Canvas>
        </Suspense>

        {/* Global HUD indicator */}
        <div className="absolute bottom-6 left-6 z-20">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-highest/50 backdrop-blur-md rounded-lg border border-outline-variant/10 font-label text-[8px] text-outline uppercase tracking-[0.2em]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            Real-time Rendering
          </div>
        </div>
      </div>
    </div>
  );
};

const VitalCard = ({ label, value, variant = 'neutral' }) => {
  const styles = {
    primary:   'text-primary',
    tertiary:  'text-tertiary',
    secondary: 'text-secondary',
    neutral:   'text-on-surface',
  };

  return (
    <div className="bg-surface-container-highest/30 border border-outline-variant/5 rounded-xl p-3.5 flex flex-col justify-between hover:bg-surface-container-highest/50 transition-colors">
      <span className="font-label text-[8px] text-outline font-bold uppercase tracking-[0.15em] mb-1">{label}</span>
      <span className={`font-headline text-sm font-bold truncate ${styles[variant]}`}>{value}</span>
    </div>
  );
};

export default DiagnosticOverview;
