/**
 * World2D.tsx — "¿Por qué la ciencia moderna destruiría la magia?"
 * 60 s · 3600 frames @ 60 fps · 1080×1920 (9:16)
 *
 * Todo se dibuja en SVG vectorial (cero cajas flotantes / emojis):
 *  - Contornos de tinta #11161B (4–6 px, terminaciones redondeadas)
 *  - Line-boil real: filtro feTurbulence + feDisplacementMap con semilla nueva a 15 fps
 *  - Entradas con spring() elástico
 *  - SFX vía staticFile("assets/audio/sfx/...") y VFX vía staticFile("assets/2d/vfx/...")
 *
 * Uso: <World2D currentScene={n} sceneLocalFrame={frameRelativoAlaEscena} />
 */
import React from "react";
import {
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Img,
  Audio,
  staticFile,
  Easing,
} from "remotion";

/* ───────────────────────────── PALETA ───────────────────────────── */
const C = {
  ink: "#11161B",
  bg: "#1C151B",
  stone: "#3D353F",
  fire: "#FF5416",
  smoke: "#221C20",
  cyan: "#00F0FF",
  violet: "#A855F7",
  white: "#FFFFFF",
  skin: "#FEEAD3",
  cloth: "#1A1D28",
  cloth2: "#2C354D",
  leather: "#78350F",
  blue: "#0A192F",
  grid: "#00F0FF33",
  alert: "#FF0055",
  void: "#0B0E14",
  gold: "#D9A441",
  flash: "#EAFFFF", // blanco-cian compartido por el cierre (esc. 8) y el arranque (esc. 0) → loop sin costura
};

const W = 1080;
const H = 1920;
const SW = 5;
const ink = { stroke: C.ink, strokeWidth: SW, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const thin = { fill: "none", stroke: C.cyan, strokeWidth: 1.8 } as const;
const MONO = "'Courier New', ui-monospace, monospace";
const COMIC = "Impact, 'Arial Black', sans-serif";

type Pt = { x: number; y: number };
type P = { f: number };

/* ──────────────────────────── HELPERS ──────────────────────────── */
const clampO = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const ip = (f: number, inp: number[], out: number[], easing?: (t: number) => number) =>
  interpolate(f, inp, out, { ...clampO, easing });
const rnd = (n: number) => {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
const ELASTIC = { damping: 8, stiffness: 120, mass: 0.7 };
const useSp = () => {
  const { fps } = useVideoConfig();
  return (f: number, delay = 0, config: Record<string, number> = ELASTIC) =>
    spring({ frame: Math.max(0, f - delay), fps, config });
};

/** Punta del dedo índice (pose "point") en coordenadas de mundo. */
const tipOf = (x: number, y: number, rot = 0, s = 1, flip = false): Pt => {
  const lx = (flip ? 35 : -35) * s;
  const ly = -170 * s;
  const a = (rot * Math.PI) / 180;
  return { x: x + lx * Math.cos(a) - ly * Math.sin(a), y: y + lx * Math.sin(a) + ly * Math.cos(a) };
};

/** SFX táctil: se monta en el frame local `at` (suena desde su inicio). */
const Sfx: React.FC<{ f: number; src: string; at?: number; volume?: number }> = ({ f, src, at = 0, volume = 0.8 }) =>
  f >= at ? <Audio src={staticFile(`assets/audio/sfx/${src}`)} volume={volume} /> : null;

/** VFX bitmap (light_01 / smoke_01) en coordenadas de pantalla. */
const Glare: React.FC<{
  src: string; x: number; y: number; size: number; opacity?: number; rot?: number;
  blend?: React.CSSProperties["mixBlendMode"];
}> = ({ src, x, y, size, opacity = 1, rot = 0, blend = "screen" }) => (
  <Img
    src={staticFile(src)}
    style={{
      position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
      opacity, transform: `rotate(${rot}deg)`, mixBlendMode: blend, pointerEvents: "none",
    }}
  />
);

const Stage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
    {children}
  </svg>
);

const Cam: React.FC<{
  f: number; z?: number; cx?: number; cy?: number; rot?: number; shake?: number; children: React.ReactNode;
}> = ({ f, z = 1, cx = 540, cy = 960, rot = 0, shake = 0, children }) => {
  const st = Math.floor(f / 2);
  const sx = (rnd(st * 3 + 1) - 0.5) * shake;
  const sy = (rnd(st * 5 + 2) - 0.5) * shake;
  return (
    <g transform={`translate(${540 + sx} ${960 + sy}) rotate(${rot}) scale(${z}) translate(${-cx} ${-cy})`}>
      {children}
    </g>
  );
};

/* ─────────────────── ARCO VOLTAICO (plasma cian) ─────────────────── */
const Arc: React.FC<{
  a: Pt; b: Pt; f: number; seed?: number; amp?: number; count?: number; width?: number; color?: string;
}> = ({ a, b, f, seed = 0, amp = 40, count = 3, width = 6, color = C.cyan }) => {
  const st = Math.floor(f / 2);
  const dx = b.x - a.x, dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len, ny = dx / len;
  const paths = Array.from({ length: count }).map((_, k) => {
    const pts = Array.from({ length: 10 }).map((__, i) => {
      const t = i / 9;
      const j = i === 0 || i === 9 ? 0 : (rnd(st * 31 + k * 7 + i + seed) - 0.5) * amp * (1 - Math.abs(t - 0.5) * 0.6);
      return `${a.x + dx * t + nx * j},${a.y + dy * t + ny * j}`;
    });
    return "M" + pts.join(" L");
  });
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow)">
      {paths.map((d, k) => (
        <g key={k}>
          <path d={d} stroke={color} strokeWidth={width} opacity={0.9} />
          <path d={d} stroke="#fff" strokeWidth={width * 0.35} />
        </g>
      ))}
    </g>
  );
};

const hexPath = (r: number) =>
  Array.from({ length: 6 })
    .map((_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${i ? "L" : "M"}${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`;
    })
    .join(" ") + " Z";

/* ───────────────────────── PROTAGONISTA ───────────────────────── */
const Hero: React.FC<{
  x: number; y: number; s?: number; smile?: number; look?: Pt; blink?: number; glow?: number; brow?: number;
}> = ({ x, y, s = 1, smile = 0, look = { x: 0, y: 0 }, blink = 0, glow = 0.4, brow = 0 }) => {
  const my = 112;
  const face = { stroke: C.ink, strokeWidth: 3.5, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} {...ink}>
      {/* cuello + torso de erudito exiliado */}
      <path d="M-62 120 L-62 310 L62 310 L62 120 Z" fill={C.skin} />
      <path d="M-340 660 C-340 400 -190 330 -70 300 L70 300 C190 330 340 400 340 660 Z" fill={C.cloth} />
      <path d="M-70 300 L0 430 L70 300 Z" fill={C.skin} />
      <path d="M-70 300 L-130 480 L-40 530 L0 430 Z" fill={C.cloth2} />
      <path d="M70 300 L130 480 L40 530 L0 430 Z" fill={C.cloth2} />
      <path d="M-270 430 L190 660 L270 660 L-200 400 Z" fill={C.leather} />
      <circle cx={170} cy={620} r={16} fill={C.gold} />
      {/* cabeza */}
      <ellipse cx={-150} cy={10} rx={24} ry={38} fill={C.skin} />
      <ellipse cx={150} cy={10} rx={24} ry={38} fill={C.skin} />
      <path d="M-150 -20 C-150 -170 150 -170 150 -20 C150 130 90 195 0 200 C-90 195 -150 130 -150 -20 Z" fill={C.skin} />
      {/* ojos */}
      {[-1, 1].map((sx) => (
        <g key={sx} transform={`translate(${sx * 62} -8)`}>
          <ellipse rx={36} ry={Math.max(2, 27 * (1 - blink))} fill="#fff" {...face} />
          <g transform={`scale(1 ${Math.max(0.05, 1 - blink)})`}>
            <circle cx={look.x} cy={look.y} r={30} fill={C.cyan} opacity={glow * 0.3} stroke="none" filter="url(#glow)" />
            <circle cx={look.x} cy={look.y} r={19} fill={C.cyan} stroke={C.ink} strokeWidth={3} />
            <circle cx={look.x} cy={look.y} r={8} fill={C.ink} stroke="none" />
            <circle cx={look.x - 6} cy={look.y - 7} r={4.5} fill="#fff" stroke="none" />
          </g>
          <path d={`M-38 -4 Q0 ${-34 + 6 * smile} 38 -4`} fill="none" {...face} />
        </g>
      ))}
      {/* nariz + boca */}
      <path d="M2 38 Q-12 72 8 78" fill="none" {...face} />
      <path
        d={`M-40 ${my - 4 * smile} Q0 ${my + 8 + 40 * smile} 42 ${my - 6 - 10 * smile}`}
        fill={smile > 0.7 ? "#fff" : "none"} strokeWidth={5}
      />
      {/* cabello */}
      <path
        d="M-165 -10 C-200 -240 -40 -280 40 -258 C170 -266 218 -140 165 -10 C150 -80 112 -100 64 -104 L38 -50 L8 -112 L-30 -48 L-62 -112 C-108 -98 -140 -70 -165 -10 Z"
        fill="#232B40"
      />
      <path d="M-60 -200 Q0 -230 70 -205" fill="none" stroke={C.cyan} strokeWidth={3} opacity={0.6} />
      {/* cejas */}
      {[-1, 1].map((sx) => (
        <path
          key={sx}
          d={`M${sx * 100} ${-58 - brow * 4} Q${sx * 62} ${-82 - brow * 16} ${sx * 24} ${-62 - brow * 8}`}
          fill="none" strokeWidth={9}
        />
      ))}
    </g>
  );
};

/* ─────────────────── MANO CON GUANTE RÚNICO ─────────────────── */
const Hand: React.FC<{
  x: number; y: number; rot?: number; s?: number; point?: boolean; flip?: boolean; rune?: number;
}> = ({ x, y, rot = 0, s = 1, point = true, flip = false, rune = 0.7 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${flip ? -s : s} ${s})`} {...ink}>
    {/* antebrazo (piel) + manga arremangada + puño de guante */}
    <path d="M-70 130 L-92 1000 L92 1000 L70 130 Z" fill={C.skin} />
    <path d="M-102 640 L-98 730 L98 730 L102 640 Z" fill={C.cloth2} />
    <path d="M-102 690 Q0 720 102 690" fill="none" strokeWidth={4} />
    <path d="M-80 120 L-88 320 L88 320 L80 120 Z" fill={C.leather} />
    <rect x={-94} y={290} width={188} height={42} rx={16} fill="#5B2A0A" />
    {/* palma y dedos */}
    <rect x={-78} y={-30} width={156} height={170} rx={50} fill={C.leather} />
    {point ? (
      <>
        <rect x={-52} y={-170} width={34} height={170} rx={17} fill={C.leather} />
        <rect x={-14} y={-38} width={34} height={72} rx={17} fill={C.leather} />
        <rect x={22} y={-30} width={34} height={66} rx={17} fill={C.leather} />
        <rect x={50} y={-18} width={30} height={58} rx={15} fill={C.leather} />
      </>
    ) : (
      <>
        <rect x={-76} y={-150} width={32} height={160} rx={16} fill={C.leather} />
        <rect x={-38} y={-192} width={32} height={202} rx={16} fill={C.leather} />
        <rect x={0} y={-184} width={32} height={194} rx={16} fill={C.leather} />
        <rect x={40} y={-142} width={30} height={152} rx={15} fill={C.leather} />
      </>
    )}
    <path d="M-70 50 C-125 30 -142 -40 -114 -74 C-92 -90 -72 -62 -62 -30 Z" fill={C.leather} />
    {/* runas cian */}
    <g stroke={C.cyan} strokeWidth={3} fill="none" opacity={rune}>
      <path d="M-30 60 L0 30 L30 60 M-30 100 L30 100 M0 30 L0 124" />
      <circle cx={0} cy={78} r={42} />
    </g>
  </g>
);

/* ─────────────────────── SALA DE PIEDRA ─────────────────────── */
const StoneRoom: React.FC<{ f: number; torches?: number[]; moon?: boolean }> = ({ f, torches = [110], moon = false }) => {
  const st = Math.floor(f / 4);
  return (
    <g>
      <rect width={W} height={H} fill={C.bg} />
      {Array.from({ length: 18 }).map((_, r) =>
        Array.from({ length: 7 }).map((__, c) => (
          <rect
            key={`${r}-${c}`} x={c * 180 + (r % 2 ? -90 : 0) + 3} y={r * 110 + 3} width={174} height={104} rx={14}
            fill={C.stone} opacity={0.5 + rnd(r * 9 + c) * 0.5} stroke={C.ink} strokeWidth={4}
          />
        ))
      )}
      {moon && (
        <g>
          <path d="M700 760 L700 360 Q830 140 960 360 L960 760 Z" fill="#1F2A44" stroke={C.ink} strokeWidth={7} />
          <path d="M830 200 L830 760 M700 520 L960 520" stroke={C.ink} strokeWidth={6} />
          <path d="M700 760 L960 760 L760 1500 L420 1500 Z" fill="#7BA0FF" opacity={0.07} />
        </g>
      )}
      {torches.map((tx, i) => {
        const fl = 1 + rnd(st * 3 + i) * 0.22;
        return (
          <g key={i} transform={`translate(${tx} 560)`}>
            <circle r={380} fill="url(#warmGlow)" opacity={0.5 + rnd(st + i) * 0.15} />
            <path d="M-20 0 L20 0 L12 120 L-12 120 Z" fill={C.leather} {...ink} />
            <g transform={`scale(${fl} ${fl})`}>
              <path d="M-30 0 C-46 -44 -12 -76 0 -130 C12 -76 46 -44 30 0 Z" fill={C.fire} {...ink} />
              <path d="M-14 0 C-22 -26 -4 -44 0 -66 C6 -44 22 -26 14 0 Z" fill="#FFB347" />
            </g>
            <circle cx={rnd(i) * 20} cy={-170 - (f % 90)} r={16 + (f % 90) * 0.3} fill={C.smoke} opacity={0.6 * (1 - (f % 90) / 90)} />
          </g>
        );
      })}
      <rect width={W} height={H} fill="url(#roomDark)" />
    </g>
  );
};

/* ═════════════════════════ ESCENA 0 · EL OJO ═════════════════════════ */
const Scene0: React.FC<P> = ({ f }) => {
  const sp = useSp();
  const open = sp(f, 6, { damping: 11, stiffness: 240, mass: 0.55 }); // el ojo se abre de golpe
  const uy = 960 - 640 * open;
  const ly = 960 + 520 * open;
  const eye = `M70 960 C250 ${uy} 830 ${uy} 1010 960 C830 ${ly} 250 ${ly} 70 960 Z`;
  const pupil = ip(f, [0, 70, 130], [78, 46, 96]);
  const look = Math.sin(f * 0.05) * 18;
  const z =
    ip(f, [0, 22], [1.35, 1], Easing.out(Easing.cubic)) *
    (1 + ip(f, [22, 125], [0, 0.1])) *
    (1 + ip(f, [130, 180], [0, 3.6], Easing.in(Easing.cubic))); // inmersión final hacia la pupila
  const bez = (t: number) => {
    const m = 1 - t;
    return {
      x: m ** 3 * 70 + 3 * m * m * t * 250 + 3 * m * t * t * 830 + t ** 3 * 1010,
      y: m ** 3 * 960 + 3 * m * m * t * uy + 3 * m * t * t * uy + t ** 3 * 960,
    };
  };
  const formulas = [
    { t: "PV = nRT", r: 238, a: 0, w: 0.6 },
    { t: "ΔU = Q − W", r: 192, a: 140, w: -0.8 },
    { t: "η = 1 − Tc/Th", r: 148, a: 250, w: 0.5 },
    { t: "F = q(E + v×B)", r: 214, a: 300, w: -0.4 },
  ];
  return (
    <>
      <Stage>
        <defs><clipPath id="eyeClip"><path d={eye} /></clipPath></defs>
        <Cam f={f} z={z} cx={540 + look * 0.2} cy={960} shake={ip(f, [6, 12, 30], [0, 22, 0])}>
          <rect x={-600} y={-600} width={2280} height={3120} fill="url(#skinG)" />
          <path d="M20 700 Q540 230 1060 700" fill="none" stroke={C.ink} strokeWidth={14} opacity={0.6} />
          <g clipPath="url(#eyeClip)">
            <rect x={0} y={300} width={W} height={1320} fill="#EFE6DC" />
            <g transform={`translate(${540 + look} 960)`}>
              <circle r={300} fill="url(#irisG)" stroke={C.ink} strokeWidth={8} />
              {Array.from({ length: 48 }).map((_, i) => {
                const a = (i / 48) * Math.PI * 2;
                return (
                  <line key={i} x1={Math.cos(a) * (pupil + 8)} y1={Math.sin(a) * (pupil + 8)}
                    x2={Math.cos(a) * 290} y2={Math.sin(a) * 290} stroke="#fff" strokeWidth={2} opacity={0.22} />
                );
              })}
              <circle r={262} fill="none" stroke="#fff" strokeWidth={2} strokeDasharray="6 14" transform={`rotate(${f * 0.8})`} />
              <circle r={168} fill="none" stroke={C.violet} strokeWidth={4} strokeDasharray="26 10" transform={`rotate(${-f * 1.1})`} />
              <circle r={pupil} fill={C.ink} />
              {formulas.map((m, i) => (
                <g key={i} transform={`rotate(${m.a + f * m.w})`}>
                  <text x={0} y={-m.r} textAnchor="middle" fontFamily={MONO} fontSize={32} fontWeight={700} fill="#fff" opacity={0.92}>
                    {m.t}
                  </text>
                </g>
              ))}
              <ellipse cx={-90} cy={-120} rx={46} ry={26} fill="#fff" opacity={0.85} transform="rotate(-30 -90 -120)" />
            </g>
          </g>
          <path d={eye} fill="none" stroke={C.ink} strokeWidth={10} />
          {Array.from({ length: 11 }).map((_, i) => {
            const t = 0.08 + i * 0.084;
            const p = bez(t);
            const dx = (t - 0.5) * 1.4;
            const n = Math.hypot(dx, 1);
            const len = 60 + (i % 3) * 14;
            return <line key={i} x1={p.x} y1={p.y} x2={p.x + (dx / n) * len} y2={p.y - (1 / n) * len} stroke={C.ink} strokeWidth={9} strokeLinecap="round" />;
          })}
          <circle cx={540} cy={960} r={ip(f, [6, 40], [80, 1000])} fill="none" stroke="#fff"
            strokeWidth={ip(f, [6, 40], [24, 2])} opacity={ip(f, [6, 40], [0.9, 0])} />
        </Cam>
      </Stage>
      <div style={{ position: "absolute", inset: 0, background: C.flash, opacity: ip(f, [0, 10], [1, 0]) }} />
      <div style={{ position: "absolute", inset: 0, background: C.cyan, opacity: ip(f, [152, 178], [0, 1]) }} />
    </>
  );
};

/* ═══════════════════ ESCENA 1 · DESPERTAR ISEKAI ═══════════════════ */
const Scene1: React.FC<P> = ({ f }) => {
  const smile = ip(f, [78, 108], [0, 1]);
  const lookY = ip(f, [0, 40, 80, 100], [10, 10, 10, -2]);
  const brow = ip(f, [0, 30, 70], [0.8, 1, 0.2]);
  const blink = f % 90 > 84 ? 1 : 0;
  const tremble = Math.sin(f * 1.7) * ip(f, [0, 60], [3, 0.5]);
  const rotL = ip(f, [30, 80], [8, 18]);
  const rotR = ip(f, [30, 80], [-8, -18]);
  const snap = f >= 110;
  const tip = tipOf(800, 1520 + tremble, rotR, 1, false);
  const st = Math.floor(f / 2);
  const flick = f < 40 ? 0.55 + rnd(st) * 0.4 : 1; // luces de la sala parpadeando (powerdown)
  const glow = ip(f, [100, 120], [0.3, 1]);
  const sparkA = ip(f, [108, 118], [0, 1]);
  return (
    <Stage>
      <Cam f={f} z={ip(f, [0, 180], [1, 1.08]) + ip(f, [110, 116, 130], [0, 0.05, 0])} cy={1100}
        shake={ip(f, [110, 114, 130], [0, 14, 0])}>
        <g opacity={flick}>
          <StoneRoom f={f} torches={[110]} moon />
        </g>
        {/* espejo quebrado */}
        <defs>
          <clipPath id="mirrorClip">
            <path d="M170 1080 L170 770 Q170 590 290 590 Q410 590 410 770 L410 1080 Z" />
          </clipPath>
        </defs>
        <path d="M130 1120 L130 760 Q130 540 290 540 Q450 540 450 760 L450 1120 Z" fill={C.leather} {...ink} />
        <path d="M170 1080 L170 770 Q170 590 290 590 Q410 590 410 770 L410 1080 Z" fill="#27324D" {...ink} />
        <g clipPath="url(#mirrorClip)">
          <g opacity={0.32}>
            <Hero x={290} y={840} s={0.42} smile={smile} glow={glow} />
          </g>
          <path d="M290 800 L170 640 M290 800 L410 700 M290 800 L230 1080 M290 800 L410 960 M290 800 L170 930"
            stroke="#fff" strokeWidth={3} opacity={0.55} />
          <path d="M290 800 L350 590 L410 590 L410 700 Z" fill={C.bg} />
          <circle cx={290} cy={800} r={sparkA * 60} fill={C.cyan} opacity={0.35 * sparkA} />
        </g>
        <path d="M290 800 L170 640 M290 800 L410 700 M290 800 L230 1080 M290 800 L410 960" stroke={C.ink} strokeWidth={3} fill="none" />
        {/* protagonista */}
        <Hero x={640} y={1000} s={1.2} smile={smile} look={{ x: 0, y: lookY }} blink={blink} glow={glow} brow={brow} />
        <Hand x={470} y={1520 + tremble} rot={rotL} flip point={false} rune={0.4 + glow * 0.5} />
        <Hand x={800} y={1520 + tremble} rot={rotR} point={snap} rune={0.4 + glow * 0.6} />
        {/* chasquido → arco voltaico */}
        {f >= 112 && (
          <g opacity={sparkA}>
            <circle cx={tip.x} cy={tip.y} r={44 + Math.sin(f) * 8} fill="url(#sphereG)" />
            {[0, 1, 2].map((k) => {
              const a = rnd(st * 9 + k) * Math.PI * 2;
              const L = 70 + rnd(st * 5 + k) * 60;
              return <Arc key={k} a={tip} b={{ x: tip.x + Math.cos(a) * L, y: tip.y + Math.sin(a) * L }} f={f} seed={k * 11} amp={26} count={1} width={5} />;
            })}
          </g>
        )}
        {f >= 108 && f < 120 &&
          [-1, 0, 1].map((k) => (
            <line key={k} x1={tip.x + k * 34} y1={tip.y - 30} x2={tip.x + k * 60} y2={tip.y - 80} stroke="#fff" strokeWidth={5} strokeLinecap="round" />
          ))}
      </Cam>
    </Stage>
  );
};

/* ═══════════════════ ESCENA 2 · EL MAGO INEFICIENTE ═══════════════════ */
const Wizard: React.FC<{ x: number; y: number; s: number; f: number; shout: number }> = ({ x, y, s, f, shout }) => {
  const st = Math.floor(f / 3);
  const bob = Math.sin(f * 0.18) * 8 * shout;
  const jaw = shout * (0.5 + 0.5 * Math.sin(f * 0.9));
  const sway = Math.sin(f * 0.1) * 14;
  const limb = (d: string, w: number, col: string) => (
    <>
      <path d={d} fill="none" stroke={C.ink} strokeWidth={w + 12} strokeLinecap="round" />
      <path d={d} fill="none" stroke={col} strokeWidth={w} strokeLinecap="round" />
    </>
  );
  return (
    <g transform={`translate(${x} ${y + bob}) scale(${s})`} {...ink}>
      {shout > 0.2 && (
        <polygon
          points={Array.from({ length: 28 }).map((_, i) => {
            const a = (i / 28) * Math.PI * 2;
            const r = i % 2 ? 330 : 470 + rnd(st * 3 + i) * 50;
            return `${Math.cos(a) * r},${Math.sin(a) * r + 40}`;
          }).join(" ")}
          fill="#C98F3C" opacity={0.55 * shout}
        />
      )}
      {/* báculo */}
      <path d="M290 460 L290 -330" stroke={C.ink} strokeWidth={24} />
      <path d="M290 460 L290 -330" stroke={C.gold} strokeWidth={12} />
      <circle cx={290} cy={-370} r={44} fill={C.fire} />
      {/* túnica */}
      <path d="M-260 800 C-250 330 -130 150 0 140 C130 150 250 330 260 800 Z" fill="#5A2E3A" />
      <path d="M-260 800 L260 800" stroke={C.gold} strokeWidth={22} />
      <path d="M-60 170 L0 800 L60 170" fill="none" stroke={C.gold} strokeWidth={14} />
      {limb("M120 230 Q260 190 290 -20", 70, "#5A2E3A")}
      <circle cx={290} cy={-30} r={36} fill="#F2C9A7" />
      {limb("M-120 240 Q-250 210 -300 90", 70, "#5A2E3A")}
      <circle cx={-300} cy={70} r={38} fill="#F2C9A7" />
      {[-1, 0, 1].map((k) => (
        <line key={k} x1={-300 + k * 18} y1={50} x2={-318 + k * 34} y2={10} strokeWidth={9} />
      ))}
      {/* cabeza, barba, sombrero */}
      <circle cx={0} cy={0} r={118} fill="#F2C9A7" />
      <path d={`M-112 20 C-160 200 -80 330 ${sway * 0.3} 370 C80 330 160 200 112 20 C70 90 -70 90 -112 20 Z`} fill="#E8DFD0" />
      <ellipse cx={0} cy={92} rx={42} ry={8 + 36 * jaw} fill="#3A0D14" />
      <path d="M-84 62 Q-40 28 0 64 Q40 28 84 62 Q40 96 0 72 Q-40 96 -84 62 Z" fill="#E8DFD0" />
      <circle cx={0} cy={28} r={34} fill="#EBB596" />
      {[-1, 1].map((sx) => (
        <g key={sx}>
          <circle cx={sx * 46} cy={-18} r={21} fill="#fff" strokeWidth={4} />
          <circle cx={sx * 46 - 4} cy={-14} r={8} fill={C.ink} stroke="none" />
          <path d={`M${sx * 88} ${-66} L${sx * 22} ${-40}`} strokeWidth={13} />
        </g>
      ))}
      <ellipse cx={0} cy={-76} rx={196} ry={42} fill="#3C2F55" />
      <path d={`M-124 -76 C-104 -210 -20 -310 ${60 + sway} -430 C${64 + sway} -300 124 -190 124 -76 Z`} fill="#3C2F55" />
      <path d="M-122 -92 Q0 -62 122 -92" fill="none" stroke={C.gold} strokeWidth={16} />
    </g>
  );
};

const fireAt = (t: number) => ({
  x: ip(t, [100, 330], [260, 210], Easing.inOut(Easing.quad)),
  y: ip(t, [100, 330], [900, 1260], Easing.inOut(Easing.quad)),
  r: ip(t, [100, 300], [30, 190]),
});

const Scene2: React.FC<P> = ({ f }) => {
  const sp = useSp();
  const shout = ip(f, [30, 50, 150, 190], [0, 1, 1, 0.3]);
  const fb = fireAt(f);
  const st = Math.floor(f / 4);
  const sputter = ip(f, [300, 360], [1, 0.62]);
  const pop = sp(f, 44, { damping: 7, stiffness: 160, mass: 0.6 });
  const blobs = Array.from({ length: 7 }).map((_, i) => {
    const a = (i / 7) * Math.PI * 2 + st * 0.5;
    const rr = fb.r * sputter * (0.82 + rnd(st * 7 + i) * 0.3);
    return { cx: Math.cos(a) * fb.r * sputter * 0.7, cy: Math.sin(a) * fb.r * sputter * 0.7 - fb.r * 0.1, r: rr * 0.42, c: i % 2 ? C.fire : "#FF7A2E" };
  });
  return (
    <Stage>
      <Cam f={f} z={ip(f, [0, 360], [1, 1.07])} cy={1050} shake={ip(f, [40, 60, 150], [0, 6, 0])}>
        <StoneRoom f={f} torches={[110, 970]} />
        <Hero x={200} y={1570} s={0.5} smile={0.12} brow={-0.6} look={{ x: -4, y: -6 }} blink={f % 100 > 94 ? 1 : 0} glow={0.5} />
        <Wizard x={620} y={820} s={1.05} f={f} shout={shout} />
        {/* humo negro disperso */}
        {Array.from({ length: 14 }).map((_, i) => {
          const birth = 100 + i * 16;
          const age = f - birth;
          if (age < 0) return null;
          const o = fireAt(birth);
          return (
            <circle key={i} cx={o.x + (rnd(i) - 0.5) * 120 + age * (rnd(i + 3) - 0.35) * 0.9} cy={o.y - age * 1.7}
              r={22 + age * 0.55} fill={C.smoke} stroke={C.ink} strokeWidth={4} opacity={ip(age, [0, 15, 160], [0, 0.9, 0])} />
          );
        })}
        {/* bola de fuego pesada y lenta */}
        {f >= 100 && (
          <g transform={`translate(${fb.x} ${fb.y})`}>
            {blobs.map((b, i) => <circle key={`o${i}`} cx={b.cx} cy={b.cy} r={b.r + SW} fill={C.ink} />)}
            <circle r={fb.r * sputter + SW} fill={C.ink} />
            <circle r={fb.r * sputter} fill={C.fire} />
            {blobs.map((b, i) => <circle key={`f${i}`} cx={b.cx} cy={b.cy} r={b.r} fill={b.c} />)}
            <circle r={fb.r * sputter * 0.55} fill="#FFB347" />
            <circle r={fb.r * sputter * 0.28} fill="#FFE29A" />
          </g>
        )}
        {f >= 44 && (
          <g transform={`translate(560 ${300 + (1 - Math.min(pop, 1.1)) * 80}) rotate(${-6 + Math.sin(f * 0.7) * 1.5}) scale(${Math.min(pop, 1.15)})`}
            opacity={ip(f, [150, 200], [1, 0])}>
            <text textAnchor="middle" fontFamily={COMIC} fontSize={92} fill="#FFD166" stroke={C.ink} strokeWidth={14} paintOrder="stroke"
              strokeLinejoin="round">¡IGNIS MAGNA!</text>
          </g>
        )}
      </Cam>
    </Stage>
  );
};

/* ═══════════════════ ESCENA 3 · BLUEPRINT TÉRMICO ═══════════════════ */
const Scene3: React.FC<P> = ({ f }) => {
  const xo = ip(f, [0, 24], [1400, 0], Easing.out(Easing.cubic)); // whip-pan
  const bl = ip(f, [0, 24], [28, 0]);
  const grow = ip(f, [24, 130], [0, 1], Easing.out(Easing.cubic));
  const on = f % 24 < 15;
  const cx = 540, cy = 800, R = 230;
  const minor = Array.from({ length: 33 }).map((_, i) => `M${i * 60} 0 L${i * 60} ${H}`).join(" ") +
    Array.from({ length: 33 }).map((_, i) => `M0 ${i * 60} L${W} ${i * 60}`).join(" ");
  const major = Array.from({ length: 5 }).map((_, i) => `M${i * 300} 0 L${i * 300} ${H}`).join(" ") +
    Array.from({ length: 7 }).map((_, i) => `M0 ${i * 300} L${W} ${i * 300}`).join(" ");
  const filled = Math.floor(ip(f, [60, 110], [0, 4]));
  const typed = (s: string, at: number) => s.slice(0, Math.max(0, Math.floor((f - at) * 0.6)));
  const labels = [
    { a: -40, t: "radiación IR", d: 120 },
    { a: 20, t: "convección", d: 150 },
    { a: 150, t: "hollín + humo", d: 180 },
    { a: 215, t: "Q perdido", d: 210 },
  ];
  return (
    <div style={{ position: "absolute", inset: 0, transform: `translateX(${xo}px)`, filter: bl > 0.1 ? `blur(${bl}px)` : undefined }}>
      <Stage>
        <rect width={W} height={H} fill={C.blue} />
        <path d={minor} stroke={C.grid} strokeWidth={1.5} fill="none" />
        <path d={major} stroke="#00F0FF55" strokeWidth={2} fill="none" />
        {/* esquinas de visor */}
        {[[60, 60, 1, 1], [1020, 60, -1, 1], [60, 1860, 1, -1], [1020, 1860, -1, -1]].map(([x, y, a, b], i) => (
          <path key={i} d={`M${x} ${y + 70 * b} L${x} ${y} L${x + 70 * a} ${y}`} {...thin} strokeWidth={2} />
        ))}
        <text x={540} y={150} textAnchor="middle" fontFamily={MONO} fontSize={30} fill={C.cyan}>
          ANÁLISIS TÉRMICO · BOLA DE FUEGO
        </text>
        <g transform={`translate(930 230) rotate(${f * 0.6})`}>
          <circle r={46} {...thin} /><circle r={26} {...thin} strokeDasharray="6 6" /><circle r={7} fill={C.cyan} />
        </g>
        {/* esquema de la bola de fuego */}
        <circle cx={cx} cy={cy} r={R} {...thin} strokeWidth={2} />
        <circle cx={cx} cy={cy} r={R * 0.68} {...thin} strokeDasharray="10 8" />
        <circle cx={cx} cy={cy} r={R * 0.34} {...thin} strokeDasharray="4 6" />
        <path d={`M${cx - R - 50} ${cy} L${cx + R + 50} ${cy} M${cx} ${cy - R - 50} L${cx} ${cy + R + 50}`} {...thin} strokeWidth={1.5} />
        {/* flechas rojas de disipación */}
        {Array.from({ length: 12 }).map((_, k) => {
          const a = (k / 12) * Math.PI * 2;
          const len = (110 + 70 * rnd(k)) * grow;
          const r0 = R + 18, r1 = r0 + len;
          const hx = cx + Math.cos(a) * r1, hy = cy + Math.sin(a) * r1;
          const px = -Math.sin(a), py = Math.cos(a);
          return (
            <g key={k} stroke={C.alert} fill={C.alert} strokeWidth={2.5} strokeLinecap="round">
              <line x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0} x2={hx} y2={hy} />
              <path d={`M${hx + Math.cos(a) * 20} ${hy + Math.sin(a) * 20} L${hx + px * 11} ${hy + py * 11} L${hx - px * 11} ${hy - py * 11} Z`} stroke="none" />
            </g>
          );
        })}
        {labels.map((l, i) => {
          const a = (l.a * Math.PI) / 180;
          const x0 = cx + Math.cos(a) * (R + 130), y0 = cy + Math.sin(a) * (R + 130);
          const right = Math.cos(a) >= 0;
          return (
            <g key={i} opacity={ip(f, [l.d, l.d + 10], [0, 1])}>
              <path d={`M${x0} ${y0} L${x0 + (right ? 60 : -60)} ${y0 - 30}`} {...thin} />
              <text x={x0 + (right ? 68 : -68)} y={y0 - 26} textAnchor={right ? "start" : "end"} fontFamily={MONO} fontSize={26} fill={C.cyan}>{l.t}</text>
            </g>
          );
        })}
        {/* telemetría */}
        <text x={540} y={1330} textAnchor="middle" fontFamily={MONO} fontSize={88} fontWeight={700} fill={C.alert}
          opacity={f < 36 ? 0 : on ? 1 : 0.2}>Eficiencia: 8%</text>
        {Array.from({ length: 50 }).map((_, i) => (
          <line key={i} x1={140 + i * 16} x2={140 + i * 16} y1={1400} y2={1470}
            stroke={i < filled ? C.alert : C.cyan} strokeWidth={i < filled ? 5 : 1.8} opacity={i < filled ? 1 : 0.45} />
        ))}
        <path d="M140 1490 L940 1490 M140 1384 L140 1490 M940 1384 L940 1490" {...thin} />
        <text x={110} y={1620} fontFamily={MONO} fontSize={28} fill={C.cyan}>{typed("T_llama ≈ 1100 K", 70)}</text>
        <text x={110} y={1670} fontFamily={MONO} fontSize={28} fill={C.cyan}>{typed("η = W / Q_h = 0.08", 100)}</text>
        <text x={110} y={1720} fontFamily={MONO} fontSize={28} fill={C.alert}>{typed("ΔS_universo >> 0  (calor desperdiciado)", 130)}</text>
      </Stage>
      {f < 24 && ( // estela de whip-pan
        <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", left: 0, top: 0 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <rect key={i} x={-1400} y={rnd(i) * H} width={1500 + 900 * rnd(i + 4)} height={6 + rnd(i + 8) * 16} fill="#fff" opacity={0.12} />
          ))}
        </svg>
      )}
    </div>
  );
};

/* ═══════════════════ ESCENA 4 · COMPRESIÓN ADIABÁTICA ═══════════════════ */
const Scene4: React.FC<P> = ({ f }) => {
  const sp = useSp();
  const tip = tipOf(540, 1500, 0, 1.3);
  const c = ip(f, [60, 390], [0, 1], Easing.in(Easing.cubic));
  const z = ip(f, [0, 400], [1, 1.45]) + ip(f, [400, 412], [0, 0.15]) - ip(f, [412, 470], [0, 0.1]);
  const shake = f < 400 ? c * 7 : ip(f, [400, 430, 520], [26, 12, 2]);
  const sph = f >= 400 ? sp(f, 400, { damping: 7, stiffness: 140, mass: 0.6 }) : 0;
  const R = 30 * sph * (1 + 0.06 * Math.sin(f * 0.4));
  return (
    <>
      <Stage>
        <rect width={W} height={H} fill="url(#bgPlasma)" />
        <Cam f={f} z={z} cx={tip.x} cy={tip.y} shake={shake}>
          <g opacity={0.5} style={{ filter: "blur(8px)" }}>
            <Hero x={540} y={520} s={1.5} smile={0.2} glow={0.4 + c * 0.6} look={{ x: -2, y: 8 }} brow={0.6} />
          </g>
          <Hand x={540} y={1500} s={1.3} point rune={0.5 + c * 0.5} />
          {/* hexágonos que comprimen el aire */}
          {Array.from({ length: 6 }).map((_, i) => {
            const r0 = 470 - i * 55, r1 = 38 + i * 9;
            const t = ip(f, [40 + i * 22, 380], [0, 1], Easing.in(Easing.quad));
            const r = (r0 + (r1 - r0) * t) * ip(f, [392, 402], [1, 0.2]);
            const o = ip(f, [20 + i * 10, 40 + i * 10], [0, 1]) * ip(f, [392, 404], [1, 0]);
            const d = hexPath(r);
            const rot = f * 0.8 * (i % 2 ? 1 : -1) + i * 10;
            return (
              <g key={i} transform={`translate(${tip.x} ${tip.y}) rotate(${rot})`} opacity={o}>
                <path d={d} fill={C.violet} fillOpacity={0.05 + 0.1 * c} stroke={C.ink} strokeWidth={10} strokeLinejoin="round" />
                <path d={d} fill="none" stroke={i % 2 ? C.violet : C.cyan} strokeWidth={4} strokeLinejoin="round" filter="url(#glow)" />
              </g>
            );
          })}
          {/* partículas de aire comprimido */}
          {f < 400 &&
            Array.from({ length: 36 }).map((_, k) => {
              const ph = (f * 0.006 * (0.6 + rnd(k)) + rnd(k + 50)) % 1;
              const rr = 520 * (1 - ph) + 20;
              const a = rnd(k + 9) * 6.283 + ph * 3;
              return <circle key={k} cx={tip.x + Math.cos(a) * rr} cy={tip.y + Math.sin(a) * rr} r={3 + rnd(k + 3) * 4} fill="#fff" opacity={0.15 + 0.6 * ph} />;
            })}
          {/* telemetría fina */}
          <g opacity={ip(f, [80, 110], [0, 1]) * ip(f, [396, 406], [1, 0])} fontFamily={MONO} fontSize={26} fill={C.cyan}>
            <path d={`M${tip.x + 60} ${tip.y - 40} L${tip.x + 150} ${tip.y - 90} L${tip.x + 330} ${tip.y - 90}`} {...thin} />
            <text x={tip.x + 160} y={tip.y - 100}>{`T = ${Math.round(300 + c * 14000)} K`}</text>
            <text x={tip.x + 160} y={tip.y - 66} fill={C.violet}>{`P = ${Math.round(1 + c * c * 9000)} atm`}</text>
          </g>
          {/* ignición → micro-esfera azul láser */}
          {f >= 395 && (
            <g>
              <circle cx={tip.x} cy={tip.y} r={ip(f, [395, 410, 440], [0, 260, 0])} fill="#fff" opacity={0.9} />
              <circle cx={tip.x} cy={tip.y} r={ip(f, [400, 450], [20, 520])} fill="none" stroke="#fff" strokeWidth={ip(f, [400, 450], [18, 1])} opacity={ip(f, [400, 450], [0.9, 0])} />
              <circle cx={tip.x} cy={tip.y} r={R * 2.2} fill="url(#sphereG)" filter="url(#glow)" />
              <circle cx={tip.x} cy={tip.y} r={R} fill="#fff" stroke="#2A6BFF" strokeWidth={3} />
              {Array.from({ length: 8 }).map((_, k) => {
                const a = (k / 8) * 6.283 + f * 0.1;
                return <circle key={k} cx={tip.x + Math.cos(a) * R * 2.6} cy={tip.y + Math.sin(a) * R * 2.6} r={3} fill={C.cyan} />;
              })}
            </g>
          )}
        </Cam>
      </Stage>
      {f >= 400 && (
        <Glare src="assets/2d/vfx/particles/light_01.png" x={540} y={960} size={900 * sph} opacity={0.85} rot={f * 0.5} />
      )}
    </>
  );
};

/* ═══════════════════ ESCENA 5 · CAÑÓN DE RIEL ═══════════════════ */
const Scene5: React.FC<P> = ({ f }) => {
  const sp = useSp();
  const shot = f >= 300;
  const e = ip(f, [300, 340], [0, 1], Easing.in(Easing.cubic));
  const camY = ip(f, [296, 348], [960, -1100], Easing.inOut(Easing.cubic));
  const shake = shot ? ip(f, [300, 330, 420], [30, 18, 0]) : ip(f, [220, 300], [0, 8]);
  const spinA = ip(f, [30, 140], [0, 1800], Easing.out(Easing.quad));
  const csx = Math.max(0.1, Math.abs(Math.cos((spinA * Math.PI) / 180)));
  const base = ip(f, [30, 100], [1500, 1100], Easing.out(Easing.cubic));
  const coinY = shot ? 1100 - 3100 * e : base + (f > 100 ? Math.sin(f * 0.08) * 10 : 0);
  const stretch = shot ? 1 + 2 * Math.min(1, e * 8) : 1 + 0.12 * ip(f, [30, 50, 100], [0, 1, 0]);
  const ringsY = [1000, 780, 560];
  const charge = ip(f, [220, 300], [0, 1]);
  const impact = ip(f, [345, 520], [0, 1]);
  const impY = 960 + (-1900 - camY);
  return (
    <>
      <Stage>
        <Cam f={f} cy={camY} shake={shake}>
          <rect x={-200} y={-2400} width={1480} height={4500} fill="url(#sky5)" />
          {Array.from({ length: 80 }).map((_, i) => (
            <circle key={i} cx={rnd(i) * W} cy={-2300 + rnd(i + 90) * 2200} r={1.5 + rnd(i + 7) * 2.5} fill="#fff" opacity={0.3 + 0.5 * rnd(i + 3)} />
          ))}
          <path d="M540 1100 L540 -1900" stroke={C.cyan} strokeWidth={1.8} strokeDasharray="10 14" opacity={ip(f, [200, 230], [0, 0.6])} />
          <Hand x={540} y={1780} s={1.2} point={false} rune={0.8} />
          {/* mitades traseras de los anillos */}
          {ringsY.map((cy, i) => {
            const t = sp(f, 100 + i * 40);
            const fl = ip(f, [300 + i * 8, 312 + i * 8, 340], [0, 1, 0]);
            return (
              <g key={`b${i}`} transform={`translate(540 ${cy}) rotate(${(1 - Math.min(t, 1)) * (i % 2 ? -50 : 50)}) scale(${Math.min(t, 1.15)})`} opacity={Math.min(1, t * 3)}>
                <path d="M-190 0 A190 54 0 0 1 190 0" fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
                <path d="M-190 0 A190 54 0 0 1 190 0" fill="none" stroke="#2F7BFF" strokeWidth={8} strokeLinecap="round" filter="url(#glow)" />
                <path d="M-190 0 A190 54 0 0 1 190 0" fill="none" stroke="#fff" strokeWidth={8} opacity={fl} />
              </g>
            );
          })}
          {/* arcos entre anillos mientras carga */}
          {f > 220 && f < 300 && [0, 1].map((k) => (
            <Arc key={k} a={{ x: 540, y: ringsY[k] }} b={{ x: 540, y: ringsY[k + 1] }} f={f} seed={k * 13} amp={44} count={2} width={5} />
          ))}
          {f > 220 && f < 300 && <circle cx={540} cy={coinY} r={80 + 90 * charge} fill={C.cyan} opacity={0.18 * charge} filter="url(#glow)" />}
          {/* estela hipersónica + conos de Mach */}
          {shot && (
            <g>
              <rect x={520} y={coinY} width={40} height={Math.max(0, 1100 - coinY)} fill="#fff" opacity={ip(f, [300, 420, 540], [0.5, 0.3, 0])} />
              {f < 350 && [0, 1, 2, 3].map((i) => {
                const ay = coinY + 60 + i * 90;
                const hw = 70 + i * 50;
                return (
                  <g key={i}>
                    <path d={`M540 ${ay} L${540 - hw} ${ay + 330} L${540 + hw} ${ay + 330} Z`} fill="#fff" opacity={0.07} />
                    <path d={`M${540 - hw} ${ay + 330} L540 ${ay} L${540 + hw} ${ay + 330}`} fill="none" stroke="#fff" strokeWidth={5 - i} opacity={0.75 - i * 0.15} strokeLinecap="round" />
                  </g>
                );
              })}
              {Array.from({ length: 24 }).map((_, k) => {
                const yk = 1100 - k * 130;
                const age = f - (300 + (k * 130) / 77);
                if (age < 0) return null;
                const r = 30 + age * 0.9;
                return <ellipse key={k} cx={540} cy={yk} rx={r} ry={r * 0.3} fill="none" stroke="#fff" strokeWidth={3} opacity={ip(age, [0, 150], [0.8, 0])} />;
              })}
            </g>
          )}
          {/* moneda */}
          {coinY > -2200 && (
            <g transform={`translate(540 ${coinY}) scale(${csx} ${stretch})`}>
              {csx < 0.3 && <rect x={-9} y={-70} width={18} height={140} fill="#9A6B1E" {...ink} />}
              <ellipse rx={70} ry={70} fill={C.gold} {...ink} />
              <ellipse rx={50} ry={50} fill="none" stroke="#9A6B1E" strokeWidth={5} />
              <path d="M0 -26 L8 -8 L26 -8 L12 4 L17 22 L0 12 L-17 22 L-12 4 L-26 -8 L-8 -8 Z" fill="#9A6B1E" stroke="none" />
            </g>
          )}
          {/* mitades delanteras de los anillos */}
          {ringsY.map((cy, i) => {
            const t = sp(f, 100 + i * 40);
            return (
              <g key={`f${i}`} transform={`translate(540 ${cy}) rotate(${(1 - Math.min(t, 1)) * (i % 2 ? -50 : 50)}) scale(${Math.min(t, 1.15)})`} opacity={Math.min(1, t * 3)}>
                <path d="M-190 0 A190 54 0 0 0 190 0" fill="none" stroke={C.ink} strokeWidth={18} strokeLinecap="round" />
                <path d="M-190 0 A190 54 0 0 0 190 0" fill="none" stroke="#2F7BFF" strokeWidth={8} strokeLinecap="round" filter="url(#glow)" />
              </g>
            );
          })}
          {/* impacto lejano */}
          {f >= 345 && (
            <g>
              <circle cx={540} cy={-1900} r={160 * ip(f, [345, 360, 420], [0, 1, 0])} fill="#fff" />
              <circle cx={540} cy={-1900} r={600 * impact} fill="none" stroke="#fff" strokeWidth={14 * (1 - impact) + 1} opacity={1 - impact} />
              <circle cx={540} cy={-1900} r={380 * impact} fill="none" stroke={C.cyan} strokeWidth={8 * (1 - impact) + 1} opacity={1 - impact} />
              <text x={110} y={-1400} fontFamily={MONO} fontSize={28} fill={C.cyan} opacity={ip(f, [380, 395], [0, 1])}>
                {"MACH 7.2 · 2.4 km/s".slice(0, Math.max(0, Math.floor((f - 380) * 0.7)))}
              </text>
            </g>
          )}
        </Cam>
        {shot && f < 346 && Array.from({ length: 16 }).map((_, i) => (
          <rect key={i} x={rnd(i) * W} y={0} width={2 + rnd(i + 5) * 5} height={H} fill="#fff" opacity={0.16} />
        ))}
        {f >= 300 && f < 312 && Array.from({ length: 10 }).map((_, i) => (
          <rect key={i} x={0} y={rnd(i + Math.floor(f / 2)) * H} width={W} height={3 + rnd(i + 2) * 12} fill="#fff" opacity={0.45} />
        ))}
      </Stage>
      {f >= 345 && (
        <Glare src="assets/2d/vfx/particles/light_01.png" x={540} y={impY} size={700 * ip(f, [345, 375, 470], [0, 1, 0.4])} opacity={0.9} />
      )}
    </>
  );
};

/* ═══════════════════ ESCENA 6 · ONDA TERMOBÁRICA ═══════════════════ */
const Cloud: React.FC<{ x: number; y: number; s: number; o?: number }> = ({ x, y, s, o = 1 }) => {
  const parts = [[-60, 10, 50], [0, -20, 70], [70, 5, 55], [20, 25, 60]];
  return (
    <g transform={`translate(${x} ${y})`} opacity={o}>
      {parts.map(([a, b, r], i) => <circle key={`i${i}`} cx={a * s} cy={b * s} r={r * s + SW} fill={C.ink} />)}
      {parts.map(([a, b, r], i) => <circle key={`c${i}`} cx={a * s} cy={b * s} r={r * s} fill="#5A4767" />)}
    </g>
  );
};

const Knight: React.FC<{
  x: number; y: number; s: number; f: number; seed: number; astonished: number; push: number; rim: string;
}> = ({ x, y, s, f, seed, astonished, push, rim }) => {
  const bob = Math.sin((f + seed * 23) * 0.07) * 3;
  const sway = Math.sin((f + seed * 11) * 0.12) * 8;
  return (
    <g transform={`translate(${x} ${y - push * 18 + bob}) rotate(${(seed % 2 ? 1 : -1) * push * -14}) scale(${s})`} {...ink}>
      <path d="M96 -20 L96 -390" strokeWidth={8} />
      <path d={`M96 -390 L${150 + sway} -372 L96 -352 Z`} fill="#B23A48" />
      <rect x={-34} y={-90} width={26} height={90} rx={10} fill="#3B3441" />
      <rect x={8} y={-90} width={26} height={90} rx={10} fill="#3B3441" />
      <path d="M-52 -90 L-60 -200 Q0 -235 60 -200 L52 -90 Z" fill="#5A5260" />
      <path d="M52 -200 L46 -100" stroke={rim} strokeWidth={4} opacity={0.85} />
      <path d={`M52 -195 L96 ${-150 - astonished * 110}`} strokeWidth={20} />
      <path d={`M52 -195 L96 ${-150 - astonished * 110}`} strokeWidth={10} stroke="#6C6474" />
      <path d="M-95 -210 L-45 -210 L-45 -140 Q-70 -105 -95 -140 Z" fill="#8A3B45" />
      <path d="M-34 -222 Q-34 -272 0 -272 Q34 -272 34 -222 Z" fill="#6C6474" />
      <rect x={-22} y={-248 - astonished * 8} width={44} height={9} rx={4} fill={C.ink} stroke="none" />
      <path d={`M0 -272 Q${24 + sway} -300 10 -330 Q-6 -300 0 -272`} fill="#B23A48" />
    </g>
  );
};

const Scene6: React.FC<P> = ({ f }) => {
  const ep = { x: 540, y: 760 };
  const z = ip(f, [0, 600], [1, 1.12]);
  const astonished = ip(f, [60, 110], [0, 1]);
  const sphT = ip(f, [80, 240], [0, 1], Easing.in(Easing.quad));
  const sphere = { x: 540, y: 120 + sphT * 640 };
  const conv = ip(f, [240, 340], [0, 1], Easing.in(Easing.cubic));
  const s = ip(f, [342, 470], [0, 1], Easing.out(Easing.cubic));
  const push = ip(f, [340, 380, 470], [0, 1, 0.35], Easing.out(Easing.quad));
  const clearO = ip(f, [380, 480], [0, 1]);
  const rim = f < 340 ? C.cyan : "#FF9A3C";
  const scr = (p: Pt) => ({ x: 540 + (p.x - 540) * z, y: 960 + (p.y - 960) * z });
  const eps = scr(ep);
  const clouds = [
    { x: 150, y: 300, s: 1.4 }, { x: 520, y: 200, s: 1.8 }, { x: 900, y: 330, s: 1.3 }, { x: 300, y: 560, s: 1.5 },
    { x: 760, y: 600, s: 1.6 }, { x: 540, y: 430, s: 1.2 }, { x: 100, y: 780, s: 1.1 }, { x: 980, y: 820, s: 1.2 },
  ];
  const rows = [
    { y: 1380, s: 0.75, xs: [90, 240, 390, 540, 690, 840, 990] },
    { y: 1540, s: 1.0, xs: [150, 345, 540, 735, 930] },
    { y: 1730, s: 1.3, xs: [130, 400, 680, 950] },
  ];
  return (
    <>
      <Stage>
        <defs>
          <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14122B" /><stop offset="0.55" stopColor="#4A2F55" /><stop offset="0.7" stopColor="#B5573A" />
          </linearGradient>
          <linearGradient id="skyB" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#2A2D6B" /><stop offset="0.6" stopColor="#F2A65A" /><stop offset="0.7" stopColor="#FFD9A0" />
          </linearGradient>
        </defs>
        <Cam f={f} z={z} shake={ip(f, [342, 360, 470], [0, 26, 0])}>
          <rect width={W} height={H} fill="url(#skyA)" />
          <rect width={W} height={H} fill="url(#skyB)" opacity={clearO} />
          {/* nubes: convergen al vacío y salen despedidas */}
          {clouds.map((cl, i) => {
            const dx = ep.x - cl.x, dy = ep.y - cl.y;
            const blast = f >= 342 ? ip(f, [342, 440], [0, 2.4], Easing.out(Easing.cubic)) : 0;
            const k = f < 342 ? conv * 0.6 : 0.6 - blast;
            return <Cloud key={i} x={cl.x + dx * k} y={cl.y + dy * k} s={cl.s * (1 - (f < 342 ? conv * 0.4 : 0))} o={f < 342 ? 1 : ip(f, [342, 450], [1, 0])} />;
          })}
          {/* horizonte + campo */}
          <path d="M0 1180 Q200 1110 420 1170 T820 1150 T1080 1170 L1080 1920 L0 1920 Z" fill="#2A2230" {...ink} />
          {/* esfera que desciende */}
          {f >= 80 && f < 342 && (
            <g>
              <line x1={540} y1={-50} x2={sphere.x} y2={sphere.y} stroke={C.cyan} strokeWidth={4} opacity={0.6} filter="url(#glow)" />
              <circle cx={sphere.x} cy={sphere.y} r={14} fill="#fff" stroke="#2A6BFF" strokeWidth={3} />
            </g>
          )}
          {/* ejército */}
          {rows.map((r, ri) =>
            r.xs.map((kx, ki) => (
              <Knight key={`${ri}-${ki}`} x={kx} y={r.y} s={r.s} f={f} seed={ri * 7 + ki} astonished={f < 340 ? astonished : 0.4} push={push} rim={rim} />
            ))
          )}
          {/* vacío: cúpula que implosiona */}
          {f >= 240 && f < 342 && (
            <g>
              <circle cx={ep.x} cy={ep.y} r={1100 * (1 - conv) + 40} fill="#000" opacity={0.35 * conv} />
              <circle cx={ep.x} cy={ep.y} r={1100 * (1 - conv) + 40} fill="none" stroke="#fff" strokeWidth={3} opacity={0.4 + 0.5 * conv} />
            </g>
          )}
          {/* onda de choque circular masiva */}
          {f >= 342 && (
            <g>
              <circle cx={ep.x} cy={ep.y} r={520 * ip(f, [342, 400, 470], [0, 1, 0.4])} fill="url(#fireG)" />
              {[1, 0.78, 0.6].map((m, i) => (
                <g key={i}>
                  <circle cx={ep.x} cy={ep.y} r={1900 * s * m} fill="none" stroke={C.ink} strokeWidth={(26 * (1 - s) + 6) * (1 - i * 0.2)} opacity={0.9} />
                  <circle cx={ep.x} cy={ep.y} r={1900 * s * m} fill="none" stroke={i ? "#FFB347" : "#fff"} strokeWidth={(14 * (1 - s) + 3) * (1 - i * 0.2)} />
                </g>
              ))}
            </g>
          )}
          <rect width={W} height={H} fill="#000" opacity={ip(f, [240, 340], [0, 0.45]) * (f < 342 ? 1 : 0)} />
        </Cam>
        <rect width={W} height={H} fill="#fff" opacity={ip(f, [338, 344, 372], [0, 1, 0])} />
      </Stage>
      {f >= 342 && (
        <Glare src="assets/2d/vfx/smoke/smoke_01.png" x={eps.x} y={eps.y} size={2400 * s + 10} opacity={0.5 * (1 - s)} blend="normal" rot={f * 0.3} />
      )}
      {f >= 450 && [0, 1, 2].map((i) => (
        <Glare key={i} src="assets/2d/vfx/smoke/smoke_01.png" x={eps.x + (i - 1) * 140} y={eps.y + 260 - (f - 450) * (0.8 + i * 0.2)}
          size={500 + (f - 450) * 2} opacity={0.55 * ip(f, [450, 480, 600], [0, 1, 0.5])} blend="normal" rot={i * 40} />
      ))}
      {f >= 80 && f < 342 && <Glare src="assets/2d/vfx/particles/light_01.png" x={scr(sphere).x} y={scr(sphere).y} size={260} opacity={0.9} />}
    </>
  );
};

/* ═══════════════════ ESCENA 7 · LEYES DEL COSMOS ═══════════════════ */
const Scene7: React.FC<P> = ({ f }) => {
  const rows = [
    [0, 17], [0, 1, 12, 13, 14, 15, 16, 17], [0, 1, 12, 13, 14, 15, 16, 17],
    Array.from({ length: 18 }, (_, i) => i), Array.from({ length: 18 }, (_, i) => i),
    Array.from({ length: 18 }, (_, i) => i), Array.from({ length: 18 }, (_, i) => i),
  ];
  const pulse = new Set([0, 17, 23, 31, 36, 50, 53, 74, 88, 100]);
  const rot = ip(f, [0, 420], [-5, 5]);
  const camX = ip(f, [0, 420], [480, 600]);
  const heroSX = ip(f, [0, 420], [0.94, 1.06]);
  const tug = Math.sin(f * 0.12) * 14;
  const look = f < 330 ? { x: 0, y: 10 } : { x: 0, y: -2 };
  const smile = ip(f, [320, 360], [0.1, 0.65]);
  const glow = 0.6 + 0.4 * Math.sin(f * 0.1);
  const steam = (hx: number, hy: number, seed: number) =>
    Array.from({ length: 6 }).map((_, i) => {
      const age = (f * 0.7 + i * 22 + seed * 9) % 130;
      return <circle key={i} cx={hx + (rnd(i + seed) - 0.5) * 60 + Math.sin(age * 0.1) * 12} cy={hy - age * 2.4} r={16 + age * 0.4} fill="#E6EEF7" opacity={0.4 * (1 - age / 130)} />;
    });
  return (
    <Stage>
      <rect width={W} height={H} fill="url(#bgPlasma)" />
      <Cam f={f} cx={camX} cy={960} rot={rot} z={1.04}>
        {/* mandala gigante */}
        <g transform="translate(540 800) scale(1 0.9)">
          <circle r={400} fill="url(#mandalaG)" />
          <circle r={520} fill="none" stroke={C.violet} strokeWidth={3} strokeDasharray="30 14" transform={`rotate(${f * 0.12})`} />
          <circle r={470} {...thin} strokeWidth={2} />
          {Array.from({ length: 36 }).map((_, i) => (
            <line key={i} x1={0} y1={-470} x2={0} y2={-490 - (i % 3) * 8} stroke={C.cyan} strokeWidth={2} transform={`rotate(${i * 10 - f * 0.2})`} />
          ))}
          {[0, 60, 120].map((rr, k) => (
            <g key={k} transform={`rotate(${rr + f * 0.1 * (k + 1)})`}>
              <ellipse rx={430} ry={150} fill="none" stroke={k === 1 ? C.violet : C.cyan} strokeWidth={2.5} opacity={0.9} />
              <circle cx={430 * Math.cos(f * 0.03 * (k + 1) + k)} cy={150 * Math.sin(f * 0.03 * (k + 1) + k)} r={13} fill="#fff" filter="url(#glow)" />
            </g>
          ))}
          {/* tabla periódica en el centro */}
          <g transform="translate(-360 -140)">
            {rows.map((cols, r) =>
              cols.map((c) => {
                const idx = r * 18 + c;
                const hot = pulse.has(idx) && Math.floor(f / 20 + idx) % 3 === 0;
                return (
                  <rect key={idx} x={c * 40} y={r * 40} width={36} height={36} rx={4}
                    fill={hot ? C.cyan : C.violet} fillOpacity={hot ? 0.55 : 0.09}
                    stroke={C.cyan} strokeWidth={1.6} opacity={0.85} />
                );
              })
            )}
          </g>
        </g>
        {/* protagonista de espaldas al cosmos, ajustando sus guantes */}
        <g transform={`translate(540 0) scale(${heroSX} 1) translate(-540 0)`}>
          <Hero x={540} y={1230} s={1.3} smile={smile} look={look} glow={glow} brow={ip(f, [330, 360], [0, 0.6])} />
        </g>
        <Hand x={290 + tug * 0.4} y={1800} rot={26} flip point={false} s={0.95} rune={glow} />
        <Hand x={790 - tug} y={1760 + tug * 0.6} rot={-30} point={false} s={0.95} rune={glow} />
        {steam(290, 1500, 1)}
        {steam(790, 1480, 4)}
      </Cam>
    </Stage>
  );
};

/* ═══════════════════ ESCENA 8 · LOOP & CTA ═══════════════════ */
const Scene8: React.FC<P> = ({ f }) => {
  const sp = useSp();
  const st = Math.floor(f / 4);
  const arrive = sp(f, 60, { damping: 12, stiffness: 100, mass: 0.8 });
  const flickSalute = ip(f, [130, 150], [0, 1]);
  const toCam = ip(f, [170, 215], [0, 1], Easing.inOut(Easing.cubic));
  const salute = { x: 820 + 30 * flickSalute, y: 930 - 20 * flickSalute, rot: -50 + 30 * flickSalute };
  const hx = salute.x + (610 - salute.x) * toCam;
  const hy = (2100 + (salute.y - 2100) * Math.min(arrive, 1)) + (1250 - salute.y) * toCam;
  const rot = salute.rot * (1 - toCam);
  const hs = 1.1 + 0.7 * toCam;
  const snapAt = 236;
  const snapped = f >= snapAt;
  const tip = tipOf(hx, hy, rot, hs, false);
  const cta = sp(f, 150, { damping: 8, stiffness: 120, mass: 0.7 });
  return (
    <>
      <Stage>
        <rect width={W} height={H} fill="url(#bgPlasma)" />
        {Array.from({ length: 60 }).map((_, i) => (
          <circle key={i} cx={rnd(i) * W} cy={rnd(i + 70) * H * 0.7} r={1.5 + rnd(i + 3) * 2.5} fill="#fff"
            opacity={0.3 + 0.6 * Math.abs(Math.sin(f * 0.05 + i))} />
        ))}
        <Cam f={f} cy={1000} z={1 + ip(f, [0, 236], [0, 0.04])} shake={snapped ? ip(f, [snapAt, snapAt + 10, snapAt + 40], [28, 14, 0]) : 0}>
          <Hero x={540} y={950} s={1.55} smile={ip(f, [20, 70], [0.2, 0.75])} look={{ x: 0, y: 0 }}
            blink={f % 120 > 114 ? 1 : 0} glow={0.9} brow={ip(f, [150, 170], [0, 0.8])} />
          <Hand x={hx} y={hy} rot={rot} s={hs} point={snapped ? false : true} rune={1} />
          {snapped && (
            <g>
              <Arc a={tip} b={{ x: tip.x + 80, y: tip.y - 90 }} f={f} seed={3} amp={30} count={2} width={6} />
              <Arc a={tip} b={{ x: tip.x - 90, y: tip.y - 60 }} f={f} seed={9} amp={30} count={2} width={6} />
              <circle cx={tip.x} cy={tip.y} r={ip(f, [snapAt, snapAt + 30], [20, 700])} fill="none" stroke="#fff"
                strokeWidth={ip(f, [snapAt, snapAt + 30], [20, 2])} opacity={ip(f, [snapAt, snapAt + 30], [1, 0])} />
            </g>
          )}
        </Cam>
        {f >= 150 && f < snapAt + 4 && (
          <g transform={`translate(540 ${250 + (1 - Math.min(cta, 1)) * 60}) rotate(${-3 + Math.sin(f * 0.5) * 0.6}) scale(${Math.min(cta, 1.1)})`}>
            <text textAnchor="middle" fontFamily={COMIC} fontSize={74} fill={C.cyan} stroke={C.ink} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
              ¿Qué otro hechizo
            </text>
            <text y={86} textAnchor="middle" fontFamily={COMIC} fontSize={74} fill="#fff" stroke={C.ink} strokeWidth={14} paintOrder="stroke" strokeLinejoin="round">
              desmontamos?
            </text>
          </g>
        )}
      </Stage>
      {snapped && <Glare src="assets/2d/vfx/particles/light_01.png" x={540} y={Math.min(1250, 960 + (tip.y - 960))} size={ip(f, [snapAt, snapAt + 30], [200, 1800])} opacity={0.9} />}
      {/* flashbang: termina en blanco-cian, idéntico al arranque de la escena 0 → loop sin costura */}
      <div style={{ position: "absolute", inset: 0, background: C.flash, opacity: ip(f, [snapAt - 2, snapAt + 6, 299], [0, 1, 1]) }} />
      <div style={{ position: "absolute", inset: 0, background: C.cyan, opacity: ip(f, [snapAt - 2, snapAt + 3], [0, 0.6]) * ip(f, [snapAt + 3, snapAt + 6], [1, 0]) }} />
    </>
  );
};

/* ═══════════════════════════ COMPONENTE RAÍZ ═══════════════════════════ */
export interface World2DProps {
  currentScene: number; // 0 a 8
  sceneLocalFrame: number; // frame relativo a la escena actual
}

export const World2D: React.FC<World2DProps> = ({ currentScene, sceneLocalFrame }) => {
  const frame = useCurrentFrame();
  useVideoConfig();
  const f = sceneLocalFrame;

  // Line-boil a 15 fps (cada 4 frames @ 60 fps)
  const stepFrame = Math.floor(frame / 4);
  const boilX = Math.sin(stepFrame * 13.37) * 1.2;
  const boilY = Math.cos(stepFrame * 17.51) * 1.2;
  const boilRot = ((stepFrame % 3) - 1) * 0.25;

  const box = { position: "absolute", inset: 0 } as const;

  return (
    <div
      style={{
        position: "absolute", inset: 0, width: 1080, height: 1920, backgroundColor: C.void, overflow: "hidden",
        transform: `translate(${boilX}px, ${boilY}px) rotate(${boilRot}deg)`,
      }}
    >
      {/* DEFS GLOBALES: line-boil orgánico, glow y gradientes compartidos */}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="boil" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.012 0.016" numOctaves={2} seed={(stepFrame % 6) + 1} result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale={5} xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <radialGradient id="roomDark" cx="50%" cy="50%" r="75%">
            <stop offset="0.35" stopColor="#000" stopOpacity={0} /><stop offset="1" stopColor="#000" stopOpacity={0.78} />
          </radialGradient>
          <radialGradient id="warmGlow"><stop offset="0" stopColor={C.fire} stopOpacity={0.55} /><stop offset="1" stopColor={C.fire} stopOpacity={0} /></radialGradient>
          <radialGradient id="skinG" cx="50%" cy="50%" r="70%"><stop offset="0.3" stopColor={C.skin} /><stop offset="1" stopColor="#B98764" /></radialGradient>
          <radialGradient id="irisG">
            <stop offset="0.35" stopColor="#001018" /><stop offset="0.38" stopColor={C.cyan} />
            <stop offset="0.9" stopColor="#0A7C99" /><stop offset="1" stopColor="#063045" />
          </radialGradient>
          <radialGradient id="sphereG">
            <stop offset="0" stopColor="#fff" /><stop offset="0.35" stopColor={C.cyan} /><stop offset="0.7" stopColor="#2A6BFF" stopOpacity={0.7} />
            <stop offset="1" stopColor="#2A6BFF" stopOpacity={0} />
          </radialGradient>
          <radialGradient id="fireG">
            <stop offset="0" stopColor="#FFF3C4" /><stop offset="0.45" stopColor={C.fire} stopOpacity={0.85} /><stop offset="1" stopColor={C.fire} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="mandalaG"><stop offset="0" stopColor={C.violet} stopOpacity={0.28} /><stop offset="1" stopColor={C.violet} stopOpacity={0} /></radialGradient>
          <linearGradient id="bgPlasma" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0B0E14" /><stop offset="0.6" stopColor="#14102A" /><stop offset="1" stopColor="#1B1038" />
          </linearGradient>
          <linearGradient id="sky5" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#050714" /><stop offset="1" stopColor="#16122B" />
          </linearGradient>
        </defs>
      </svg>

      {/* ESCENAS (con line-boil de trazo aplicado al contenido vectorial) */}
      <div style={{ ...box, filter: "url(#boil)" }}>
        {currentScene === 0 && (
          <div style={box}>
            <Sfx f={f} src="impacts/sub_impact_thud.wav" volume={0.8} />
            <Sfx f={f} src="ui/switch1.wav" at={40} volume={0.5} />
            <Scene0 f={f} />
          </div>
        )}
        {currentScene === 1 && (
          <div style={box}>
            <Sfx f={f} src="glitches/electrical_powerdown.wav" volume={0.7} />
            <Sfx f={f} src="ui/click2.wav" at={110} volume={0.7} />
            <Scene1 f={f} />
          </div>
        )}
        {currentScene === 2 && (
          <div style={box}>
            <Sfx f={f} src="whooshes/whoosh_cinematic.wav" volume={0.6} />
            <Scene2 f={f} />
          </div>
        )}
        {currentScene === 3 && (
          <div style={box}>
            <Sfx f={f} src="whooshes/whoosh_fast.wav" volume={0.8} />
            <Sfx f={f} src="ui/switch20.wav" at={36} volume={0.5} />
            <Scene3 f={f} />
          </div>
        )}
        {currentScene === 4 && (
          <div style={box}>
            <Sfx f={f} src="ambience/tension_riser.wav" volume={0.5} />
            <Scene4 f={f} />
          </div>
        )}
        {currentScene === 5 && (
          <div style={box}>
            {[100, 140, 180].map((at) => <Sfx key={at} f={f} src="ui/click1.wav" at={at} volume={0.9} />)}
            <Sfx f={f} src="glitches/radio_static_burst.wav" at={300} volume={0.8} />
            <Scene5 f={f} />
          </div>
        )}
        {currentScene === 6 && (
          <div style={box}>
            <Sfx f={f} src="impacts/sub_impact_thud.wav" at={338} volume={0.9} />
            <Scene6 f={f} />
          </div>
        )}
        {currentScene === 7 && (
          <div style={box}>
            <Sfx f={f} src="ui/switch30.wav" at={20} volume={0.6} />
            <Scene7 f={f} />
          </div>
        )}
        {currentScene === 8 && (
          <div style={box}>
            <Sfx f={f} src="ui/switch4.wav" at={236} volume={0.8} />
            <Scene8 f={f} />
          </div>
        )}
      </div>

      {/* CAPA GLOBAL: GRANO DE PAPEL + VIÑETA */}
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ position: "absolute", inset: 0, mixBlendMode: "overlay", opacity: 0.16, pointerEvents: "none", zIndex: 40 }}>
        <filter id="grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={(stepFrame % 9) + 1} />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width={W} height={H} filter="url(#grain)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, boxShadow: "inset 0 0 160px rgba(0, 0, 0, 0.85)", pointerEvents: "none", zIndex: 50 }} />
    </div>
  );
};
