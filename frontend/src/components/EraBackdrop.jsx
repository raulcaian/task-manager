import { mix, ridge, seeded } from '../lib/backdrop';

const W = 1600;
const H = 700; // the bottom edge (y = 700) sits on the road

/*
 * Illustrated scenery behind the road, one per era, drawn in SVG from the
 * era's colours (bg_color and accent_color from the database). No photos,
 * so there are no copyright questions and each scene weighs almost nothing.
 */
export default function EraBackdrop({ era, visible }) {
  const Scene = SCENES[era.year_label] ?? Horizon;
  const sky = mix(era.bg_color, era.accent_color, 0.22);
  const id = `sky-${era.id}`;
  return (
    <svg
      className={`era-backdrop${visible ? ' is-visible' : ''}`}
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={era.bg_color} />
          <stop offset="1" stopColor={sky} />
        </linearGradient>
      </defs>
      <rect width={W} height={H} fill={`url(#${id})`} />
      <Scene bg={era.bg_color} accent={era.accent_color} />
    </svg>
  );
}

const shade = (bg, t) => mix(bg, '#000000', t);

// 1931 · a Stuttgart workshop: sawtooth factory roofs and chimneys
function Workshop({ bg, accent }) {
  const random = seeded(1931);
  const roofs = [];
  for (let x = 120; x < 1480; x += 90) roofs.push(`L${x},520 L${x + 90},470 L${x + 90},520`);
  const windows = [];
  for (let x = 160; x < 1440; x += 60) {
    for (let y = 560; y < 660; y += 40) windows.push(<rect key={`${x}-${y}`} x={x} y={y} width="26" height="22" fill={mix(accent, bg, 0.45)} opacity={0.35 + random() * 0.4} />);
  }
  return (
    <g>
      <path d={ridge(random, { width: W, base: 700, height: 180, peaks: 7 })} fill={shade(bg, 0.15)} />
      <path d={`M120,700 L120,520 ${roofs.join(' ')} L1480,700 Z`} fill={shade(bg, 0.45)} />
      <rect x="360" y="330" width="34" height="200" fill={shade(bg, 0.5)} />
      <rect x="1180" y="370" width="28" height="160" fill={shade(bg, 0.5)} />
      <circle cx="380" cy="300" r="40" fill={mix(bg, accent, 0.25)} opacity="0.35" />
      <circle cx="420" cy="250" r="56" fill={mix(bg, accent, 0.2)} opacity="0.25" />
      {windows}
    </g>
  );
}

// 1948 · Gmünd in the Austrian Alps: layered peaks with snow
function Alps({ bg }) {
  const random = seeded(1948);
  return (
    <g>
      <path d={ridge(random, { width: W, base: 700, height: 460, peaks: 9, jitter: 0.25 })} fill={mix(bg, '#ffffff', 0.12)} />
      <path d={ridge(seeded(48), { width: W, base: 700, height: 330, peaks: 11 })} fill={shade(bg, 0.25)} />
      <path d={ridge(seeded(4), { width: W, base: 700, height: 180, peaks: 15 })} fill={shade(bg, 0.5)} />
    </g>
  );
}

// 1963 · the Frankfurt motor show: exhibition hall and searchlights
function MotorShow({ bg, accent }) {
  return (
    <g>
      {[300, 800, 1300].map((x, i) => (
        <polygon key={x} points={`${x},700 ${x - 30 + i * 30 - 260},0 ${x + i * 30 - 150},0`} fill={accent} opacity="0.07" />
      ))}
      <path d="M200,700 L200,470 Q800,300 1400,470 L1400,700 Z" fill={shade(bg, 0.35)} />
      {Array.from({ length: 11 }, (_, i) => (
        <rect key={i} x={260 + i * 110} y="500" width="8" height="200" fill={shade(bg, 0.55)} />
      ))}
      <rect x="40" y="380" width="120" height="320" fill={shade(bg, 0.5)} />
      <rect x="1440" y="340" width="130" height="360" fill={shade(bg, 0.5)} />
    </g>
  );
}

// 1970 · Le Mans at dusk: grandstand, footbridge and flags
function LeMans({ bg, accent }) {
  const random = seeded(1970);
  const crowd = Array.from({ length: 160 }, (_, i) => (
    <circle key={i} cx={80 + (i % 80) * 9.5 + random() * 4} cy={560 + Math.floor(i / 80) * 22 + random() * 6} r="3.2" fill={mix(bg, accent, 0.3 + random() * 0.4)} opacity="0.6" />
  ));
  return (
    <g>
      <circle cx="1250" cy="520" r="120" fill={accent} opacity="0.35" />
      <path d="M60,700 L60,540 L880,500 L880,700 Z" fill={shade(bg, 0.4)} />
      <path d="M40,540 L900,470 L900,490 L40,560 Z" fill={shade(bg, 0.55)} />
      {crowd}
      <path d="M980,700 L980,470 Q1250,380 1520,470 L1520,700 L1490,700 L1490,490 Q1250,410 1010,490 L1010,700 Z" fill={shade(bg, 0.5)} />
      <rect x="990" y="455" width="520" height="22" fill={shade(bg, 0.55)} />
      {[940, 1560].map((x) => (
        <g key={x}>
          <rect x={x} y="380" width="4" height="320" fill={shade(bg, 0.6)} />
          <path d={`M${x + 4},384 L${x + 60},398 L${x + 4},412 Z`} fill={accent} opacity="0.8" />
        </g>
      ))}
    </g>
  );
}

// 1996 · a coastal road in the sun: sea, hills and a low sun
function Coast({ bg, accent }) {
  return (
    <g>
      <circle cx="1180" cy="470" r="110" fill={mix(accent, '#ffffff', 0.3)} opacity="0.45" />
      <rect x="0" y="560" width={W} height="140" fill={mix(bg, '#3a5b7a', 0.5)} />
      {[580, 610, 640].map((y) => (
        <rect key={y} x="0" y={y} width={W} height="2" fill="#ffffff" opacity="0.08" />
      ))}
      <path d={ridge(seeded(96), { width: 760, base: 700, height: 240, peaks: 5 })} fill={shade(bg, 0.35)} />
      <path d="M1400,700 Q1500,560 1600,600 L1600,700 Z" fill={shade(bg, 0.45)} />
    </g>
  );
}

// 2002 · the first SUV: forested mountains
function Forest({ bg, accent }) {
  const random = seeded(2002);
  const trees = Array.from({ length: 70 }, (_, i) => {
    const x = i * 24 + random() * 10;
    const h = 60 + random() * 70;
    return <path key={i} d={`M${x},700 L${x + 14},${700 - h} L${x + 28},700 Z`} fill={shade(bg, 0.55)} />;
  });
  return (
    <g>
      <path d={ridge(random, { width: W, base: 700, height: 400, peaks: 7 })} fill={mix(bg, accent, 0.18)} />
      <path d={ridge(seeded(22), { width: W, base: 700, height: 260, peaks: 10 })} fill={shade(bg, 0.3)} />
      {trees}
    </g>
  );
}

// 2019 · electric night city: skyline with lit windows
function NightCity({ bg, accent }) {
  const random = seeded(2019);
  const buildings = [];
  let x = 0;
  while (x < W) {
    const w = 50 + random() * 90;
    const h = 120 + random() * 330;
    buildings.push({ x, w, h });
    x += w + 6;
  }
  return (
    <g>
      <circle cx="1360" cy="130" r="46" fill={mix(accent, '#ffffff', 0.6)} opacity="0.5" />
      {buildings.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={700 - b.h} width={b.w} height={b.h} fill={shade(bg, 0.35 + (i % 3) * 0.1)} />
          {Array.from({ length: Math.floor(b.h / 28) * Math.floor(b.w / 22) }, (_, j) => {
            if (random() > 0.35) return null;
            const cols = Math.floor(b.w / 22);
            return <rect key={j} x={b.x + 8 + (j % cols) * 22} y={700 - b.h + 14 + Math.floor(j / cols) * 28} width="8" height="12" fill={accent} opacity={0.35 + random() * 0.5} />;
          })}
        </g>
      ))}
    </g>
  );
}

// Today · the software-defined car: a network of data over a grid
function DataGrid({ bg, accent }) {
  const random = seeded(2026);
  const nodes = Array.from({ length: 26 }, () => ({ x: random() * W, y: 120 + random() * 440 }));
  const lines = [];
  nodes.forEach((a, i) => {
    const b = nodes[(i * 7 + 3) % nodes.length];
    lines.push(<line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={accent} strokeOpacity="0.18" strokeWidth="1.5" />);
  });
  return (
    <g>
      {Array.from({ length: 17 }, (_, i) => (
        <line key={`v${i}`} x1={800 + (i - 8) * 30} y1="420" x2={800 + (i - 8) * 260} y2="700" stroke={mix(bg, accent, 0.4)} strokeOpacity="0.5" />
      ))}
      {[440, 480, 540, 620].map((y) => (
        <line key={y} x1="0" y1={y} x2={W} y2={y} stroke={mix(bg, accent, 0.4)} strokeOpacity="0.4" />
      ))}
      {lines}
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={3 + (i % 3)} fill={accent} opacity="0.7" />
      ))}
    </g>
  );
}

function Horizon({ bg }) {
  return <path d={ridge(seeded(1), { width: W, base: 700, height: 200, peaks: 8 })} fill={shade(bg, 0.3)} />;
}

const SCENES = {
  1931: Workshop,
  1948: Alps,
  1963: MotorShow,
  1970: LeMans,
  1996: Coast,
  2002: Forest,
  2019: NightCity,
  Today: DataGrid,
};
