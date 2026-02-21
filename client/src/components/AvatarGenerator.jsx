/**
 * AvatarGenerator — Deterministic SVG avatar from any seed string.
 * Produces unique geometric patterns based on a hash of the input.
 * Zero emojis. Zero external assets. Pure SVG.
 */

const PALETTES = [
  ['#00f2fe', '#4facfe', '#0a1628'],   // Teal → Blue
  ['#7c3aed', '#c084fc', '#0f0520'],   // Violet
  ['#10b981', '#34d399', '#021a0f'],   // Emerald
  ['#f59e0b', '#fbbf24', '#1a1000'],   // Amber
  ['#ec4899', '#f472b6', '#1a0510'],   // Pink
  ['#06b6d4', '#22d3ee', '#021a20'],   // Cyan
  ['#8b5cf6', '#a78bfa', '#0d0520'],   // Purple
  ['#ef4444', '#f87171', '#1a0808'],   // Red
  ['#3b82f6', '#60a5fa', '#050d1a'],   // Blue
  ['#14b8a6', '#2dd4bf', '#021a16'],   // Teal Deep
];

function hashSeed(str) {
  let hash = 0;
  const s = String(str || 'anon');
  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed, index) {
  const x = Math.sin(seed + index * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

const SIZES = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 56,
  xl: 80,
};

export default function AvatarGenerator({
  seed = '',
  size = 'md',
  showStatus = false,
  isOnline = false,
  className = '',
}) {
  const hash = hashSeed(seed);
  const palette = PALETTES[hash % PALETTES.length];
  const [c1, c2, bg] = palette;
  const dim = SIZES[size] || SIZES.md;
  const viewBox = 100;
  const gradId = `ag-${hash}`;

  // Derive shape parameters
  const r = (i) => seededRandom(hash, i);

  const shapeCount = 3 + Math.floor(r(0) * 4); // 3–6 shapes
  const shapes = [];

  for (let i = 0; i < shapeCount; i++) {
    const type = Math.floor(r(i * 7 + 1) * 4); // 0=circle, 1=rect, 2=polygon, 3=arc
    const x = 15 + r(i * 7 + 2) * 70;
    const y = 15 + r(i * 7 + 3) * 70;
    const s = 8 + r(i * 7 + 4) * 25;
    const opacity = 0.3 + r(i * 7 + 5) * 0.5;
    const useC2 = r(i * 7 + 6) > 0.5;
    const fill = useC2 ? c2 : c1;

    switch (type) {
      case 0: // Circle
        shapes.push(
          <circle
            key={i}
            cx={x}
            cy={y}
            r={s / 2}
            fill={fill}
            opacity={opacity}
          />
        );
        break;
      case 1: { // Rounded rectangle
        const rot = r(i * 7 + 7) * 360;
        shapes.push(
          <rect
            key={i}
            x={x - s / 2}
            y={y - s / 2}
            width={s}
            height={s * (0.5 + r(i * 7 + 8) * 0.8)}
            rx={s * 0.2}
            fill={fill}
            opacity={opacity}
            transform={`rotate(${rot} ${x} ${y})`}
          />
        );
        break;
      }
      case 2: { // Triangle / polygon
        const angle1 = r(i * 7 + 7) * Math.PI * 2;
        const points = [0, 1, 2].map((j) => {
          const a = angle1 + (j * Math.PI * 2) / 3;
          return `${x + Math.cos(a) * s * 0.5},${y + Math.sin(a) * s * 0.5}`;
        }).join(' ');
        shapes.push(
          <polygon
            key={i}
            points={points}
            fill={fill}
            opacity={opacity}
          />
        );
        break;
      }
      case 3: { // Arc / half-circle
        const startAngle = r(i * 7 + 7) * Math.PI * 2;
        const endAngle = startAngle + Math.PI;
        const radius = s / 2;
        const x1 = x + Math.cos(startAngle) * radius;
        const y1 = y + Math.sin(startAngle) * radius;
        const x2 = x + Math.cos(endAngle) * radius;
        const y2 = y + Math.sin(endAngle) * radius;
        shapes.push(
          <path
            key={i}
            d={`M ${x1} ${y1} A ${radius} ${radius} 0 1 1 ${x2} ${y2}`}
            fill={fill}
            opacity={opacity}
          />
        );
        break;
      }
    }
  }

  // Central focal shape
  const centralSize = 12 + r(100) * 10;
  shapes.push(
    <circle
      key="center"
      cx={50}
      cy={50}
      r={centralSize}
      fill={`url(#${gradId})`}
      opacity={0.7}
    />
  );

  const statusSize = dim <= 32 ? 8 : dim <= 40 ? 10 : 12;
  const borderRadius = dim <= 32 ? 'rounded-lg' : 'rounded-xl';

  return (
    <div
      className={`relative inline-flex shrink-0 ${className}`}
      style={{ width: dim, height: dim }}
    >
      <svg
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        width={dim}
        height={dim}
        className={`${borderRadius} overflow-hidden`}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={c1} />
            <stop offset="100%" stopColor={c2} />
          </linearGradient>
          <clipPath id={`clip-${hash}`}>
            <rect x="0" y="0" width={viewBox} height={viewBox} rx="16" />
          </clipPath>
        </defs>
        <g clipPath={`url(#clip-${hash})`}>
          <rect x="0" y="0" width={viewBox} height={viewBox} fill={bg} />
          {shapes}
        </g>
      </svg>

      {showStatus && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 border-2 border-primary rounded-full ${
            isOnline ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-gray-500'
          }`}
          style={{ width: statusSize, height: statusSize }}
        />
      )}
    </div>
  );
}
