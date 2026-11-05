import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

export interface World2DProps {
  currentScene: number; // Índice de escena: 0 a 7
  sceneLocalFrame: number; // Fotograma local dentro de la escena activa (inicia en 0)
}

export const THEME = {
  colors: {
    bg: "#0B132B",
    slate: "#1C2541",
    blueLight: "#3A506B",
    cyan: "#00F5D4",
    alert: "#FF2A54",
    warning: "#FFBE0B",
    emerald: "#10B981",
    purple: "#8B5CF6",
    orange: "#F97316",
    white: "#F8F9FA",
  },
  fonts: {
    main: "system-ui, -apple-system, sans-serif",
    mono: "monospace",
  },
};

/* ───────────────────────── Constantes y utilidades ───────────────────────── */

const C = THEME.colors;
const FONT = THEME.fonts;
const CX = 540;
const CY = 980;
const CORE_R = 56; // círculo central del radar = punto de cierre del loop
// La escena 7 se contrae hacia el círculo central entre estos fotogramas locales al final de la escena.
const LOOP_START = 760;
const LOOP_END = 860;

const CL = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (cx: number, cy: number, r: number, deg: number) => ({
  x: cx + r * Math.cos(rad(deg)),
  y: cy + r * Math.sin(rad(deg)),
});
const prog = (v: number, a: number, b: number) => interpolate(v, [a, b], [0, 1], CL);
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeIO = (t: number) => t * t * (3 - 2 * t);
const poly = (pts: { x: number; y: number }[]) => "M" + pts.map((p) => `${p.x} ${p.y}`).join(" L");

/* ───────────────────────── Contexto + primitivas de movimiento ───────────────────────── */

const Ctx = React.createContext({ frame: 0, sceneLocalFrame: 0, fps: 60 });
const useCtx = () => React.useContext(Ctx);

const useEnter = (delay: number) => {
  const { sceneLocalFrame, fps } = useCtx();
  return spring({ frame: sceneLocalFrame - delay, fps, config: { damping: 12, stiffness: 120 } });
};

interface PProps {
  x: number;
  y: number;
  d: number;
  amp?: number;
  phase?: number;
  breathe?: number;
  alpha?: number;
  children?: React.ReactNode;
}

// Entrada con resorte (scale + translateY + opacity) + idle continuo con sin(frame * 0.05)
const P: React.FC<PProps> = ({ x, y, d, amp = 8, phase = 0, breathe = 0.012, alpha = 1, children }) => {
  const { frame } = useCtx();
  const p = useEnter(d);
  const w = Math.sin(frame * 0.05 + phase);
  const scale = interpolate(p, [0, 1], [0.35, 1]) * (1 + w * breathe);
  const ty = (1 - p) * 120 + w * amp;
  return (
    <g
      transform={`translate(${x} ${y + ty}) scale(${scale})`}
      opacity={Math.min(1, Math.max(0, p * 1.5)) * alpha}
    >
      {children}
    </g>
  );
};

interface TProps {
  x: number;
  y: number;
  d: number;
  size: number;
  fill?: string;
  stroke?: string;
  anchor?: "start" | "middle" | "end";
  weight?: number;
  ls?: number;
  amp?: number;
  phase?: number;
  alpha?: number;
  mono?: boolean;
  children?: React.ReactNode;
}

// Tipografía cinética colosal
const T: React.FC<TProps> = ({
  x,
  y,
  d,
  size,
  fill = C.white,
  stroke,
  anchor = "middle",
  weight = 900,
  ls = -2,
  amp = 6,
  phase = 0,
  alpha = 1,
  mono = false,
  children,
}) => (
  <P x={x} y={y} d={d} amp={amp} phase={phase} alpha={alpha} breathe={0.01}>
    <text
      textAnchor={anchor}
      dominantBaseline="central"
      fontFamily={mono ? FONT.mono : FONT.main}
      fontWeight={weight}
      fontSize={size}
      letterSpacing={ls}
      fill={stroke ? "none" : fill}
      stroke={stroke}
      strokeWidth={stroke ? 4 : 0}
      strokeLinejoin="round"
    >
      {children}
    </text>
  </P>
);

/* ───────────────────────── Fondo vivo ───────────────────────── */

const ACCENTS = [C.cyan, C.alert, C.warning, C.cyan, C.purple, C.emerald, C.emerald, C.cyan];
const DUST = Array.from({ length: 28 }, (_, i) => ({
  x: (i * 397) % 1080,
  y: (i * 613) % 1920,
  r: 2 + (i % 3),
}));

const Backdrop: React.FC<{ scene: number }> = ({ scene }) => {
  const { frame } = useCtx();
  const accent = ACCENTS[scene] ?? C.cyan;
  return (
    <g>
      <defs>
        <radialGradient id="bgGlow">
          <stop offset="0%" stopColor={accent} stopOpacity={0.22} />
          <stop offset="100%" stopColor={accent} stopOpacity={0} />
        </radialGradient>
      </defs>
      <circle
        cx={540 + Math.sin(frame * 0.05) * 40}
        cy={960 + Math.cos(frame * 0.05) * 40}
        r={900}
        fill="url(#bgGlow)"
      />
      {DUST.map((p, i) => (
        <circle
          key={i}
          cx={p.x + Math.sin(frame * 0.05 + i) * 14}
          cy={p.y + Math.cos(frame * 0.05 + i * 1.3) * 18}
          r={p.r}
          fill={C.white}
          opacity={0.12 + 0.1 * Math.sin(frame * 0.05 + i)}
        />
      ))}
    </g>
  );
};

/* ───────────────────────── ESCENA 0 · Radar geopolítico ───────────────────────── */

const Scene0: React.FC = () => {
  const { frame, sceneLocalFrame: sl } = useCtx();
  const R = 470;
  const sweep = frame * 2.4;
  const blips = [
    { a: 20, r: 300 },
    { a: 95, r: 380 },
    { a: 160, r: 210 },
    { a: 215, r: 420 },
    { a: 300, r: 330 },
    { a: 340, r: 150 },
  ];
  const wedge = (a0: number, a1: number) => {
    const p0 = pt(0, 0, R, a0);
    const p1 = pt(0, 0, R, a1);
    return `M0 0 L${p0.x} ${p0.y} A${R} ${R} 0 0 1 ${p1.x} ${p1.y} Z`;
  };
  const tip = pt(0, 0, R, sweep);
  const coreR = CORE_R + Math.sin(frame * 0.05) * interpolate(sl, [0, 40], [0, 5], CL);

  return (
    <g>
      <P x={CX} y={CY} d={4} amp={5}>
        {[120, 235, 350, R].map((r) => (
          <circle key={r} r={r} fill="none" stroke={C.blueLight} strokeWidth={r === R ? 5 : 2} opacity={0.7} />
        ))}
        {Array.from({ length: 12 }, (_, i) => {
          const a = pt(0, 0, R, i * 30);
          return <line key={i} x1={0} y1={0} x2={a.x} y2={a.y} stroke={C.blueLight} strokeWidth={2} opacity={0.5} />;
        })}
        {Array.from({ length: 72 }, (_, i) => {
          const long = i % 6 === 0;
          const a = pt(0, 0, R, i * 5);
          const b = pt(0, 0, R - (long ? 28 : 12), i * 5);
          return (
            <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.cyan} strokeWidth={long ? 4 : 2} opacity={long ? 0.8 : 0.4} />
          );
        })}
        {Array.from({ length: 28 }, (_, i) => (
          <path
            key={i}
            d={wedge(sweep - (i + 1) * 2.5, sweep - i * 2.5)}
            fill={C.cyan}
            opacity={0.42 * Math.pow(1 - i / 28, 2)}
          />
        ))}
        <line x1={0} y1={0} x2={tip.x} y2={tip.y} stroke={C.cyan} strokeWidth={4} strokeLinecap="round" filter="url(#glow)" />
        {blips.map((b, i) => {
          const pos = pt(0, 0, b.r, b.a);
          const diff = (((sweep - b.a) % 360) + 360) % 360;
          const br = Math.max(0.15, diff < 140 ? 1 - diff / 140 : 0);
          return <circle key={i} cx={pos.x} cy={pos.y} r={8 + br * 6} fill={C.cyan} opacity={br} />;
        })}
      </P>

      {/* Foco pulsante: Irán */}
      <P x={CX + 170} y={CY - 110} d={36} amp={5} phase={1}>
        {[0, 1, 2].map((i) => {
          const k = (frame * 0.018 + i / 3) % 1;
          return <circle key={i} r={18 + k * 120} fill="none" stroke={C.alert} strokeWidth={4} opacity={(1 - k) * 0.9} />;
        })}
        <g transform={`rotate(${frame * 0.8})`} stroke={C.alert} strokeWidth={5} fill="none" strokeLinecap="round">
          {[0, 90, 180, 270].map((a) => (
            <path key={a} transform={`rotate(${a})`} d="M-50 -22 V-50 H-22" />
          ))}
        </g>
        <circle r={13} fill={C.alert} filter="url(#glow)" />
        <path d="M16 -16 L70 -62 H170" fill="none" stroke={C.white} strokeWidth={3} opacity={0.8} />
        <text x={176} y={-62} dominantBaseline="central" fontFamily={FONT.mono} fontWeight={700} fontSize={44} fill={C.white}>
          IRÁN
        </text>
      </P>

      {/* Círculo central: ancla exacta del loop */}
      <circle cx={CX} cy={CY} r={coreR} fill={C.cyan} fillOpacity={0.15} stroke={C.cyan} strokeWidth={6} />

      <T x={CX} y={235} d={6} size={250} fill={C.white}>CRISIS</T>
      <T x={CX} y={420} d={14} size={190} stroke={C.cyan}>GLOBAL</T>
      <T x={CX} y={1650} d={60} size={190} fill={C.warning}>¿LISTO?</T>
    </g>
  );
};

/* ───────────────────────── ESCENA 1 · Estrecho de Ormuz ───────────────────────── */

const CONTAINER_COLORS = [C.orange, C.cyan, C.purple, C.warning, C.emerald];

const Scene1: React.FC = () => {
  const { frame, sceneLocalFrame: sl, fps } = useCtx();
  const move = easeOut(prog(sl, 12, 115));
  const recoil = spring({ frame: sl - 115, fps, config: { damping: 10, stiffness: 120 } });
  const shipX = -40 + 470 * move - 34 * recoil;
  const speed = 0.12 + 0.88 * Math.pow(1 - prog(sl, 12, 115), 2);
  const wakeLen = 280 * speed;
  const flow = 100 - 85 * easeOut(prog(sl, 100, 190));
  const flowDrop = Math.round(85 * easeOut(prog(sl, 100, 190)));
  const ARC = Math.PI * 250;

  return (
    <g>
      {/* Canal */}
      <P x={CX} y={980} d={0} amp={4}>
        <rect x={-540} y={-300} width={1080} height={600} fill="#0E1E3F" />
        {Array.from({ length: 6 }, (_, i) => {
          const base = -230 + i * 90;
          const pts = Array.from({ length: 37 }, (_, n) => {
            const x = -540 + n * 30;
            return { x, y: base + Math.sin((x + frame * (2 + (i % 2))) * 0.02 + i) * 10 };
          });
          return <path key={i} d={poly(pts)} fill="none" stroke={C.cyan} strokeWidth={3} opacity={0.22} />;
        })}
      </P>

      {/* Costa norte */}
      <P x={CX} y={600} d={2} amp={4} phase={1}>
        <g transform="translate(-540 -600)">
          <path
            d="M0 420 H1080 V770 C960 800 880 750 740 780 C600 810 480 760 340 790 C200 820 90 770 0 800 Z"
            fill={C.slate}
            stroke={C.blueLight}
            strokeWidth={5}
          />
          <path d="M120 640 L220 520 L320 640 Z" fill={C.blueLight} opacity={0.5} />
          <path d="M700 680 L830 530 L960 680 Z" fill={C.blueLight} opacity={0.5} />
          <text x={540} y={600} textAnchor="middle" fontFamily={FONT.main} fontWeight={800} fontSize={54} fill={C.white} opacity={0.5} letterSpacing={8}>
            IRÁN
          </text>
        </g>
      </P>

      {/* Costa sur */}
      <P x={CX} y={1320} d={4} amp={4} phase={2}>
        <g transform="translate(-540 -1320)">
          <path
            d="M0 1450 H1080 V1190 C950 1160 850 1210 720 1180 C570 1150 440 1210 300 1180 C180 1155 80 1190 0 1170 Z"
            fill={C.slate}
            stroke={C.blueLight}
            strokeWidth={5}
          />
          <path d="M160 1400 L270 1290 L380 1400 Z" fill={C.blueLight} opacity={0.5} />
          <path d="M640 1410 L760 1300 L880 1410 Z" fill={C.blueLight} opacity={0.5} />
          <text x={540} y={1370} textAnchor="middle" fontFamily={FONT.main} fontWeight={800} fontSize={54} fill={C.white} opacity={0.5} letterSpacing={8}>
            OMÁN
          </text>
        </g>
      </P>

      {/* Buque portacontenedores */}
      <P x={shipX} y={980} d={6} amp={8} phase={0.5}>
        {/* estela */}
        <g opacity={0.35 + 0.5 * speed}>
          <path d={`M-175 14 L${-175 - wakeLen} ${14 - wakeLen * 0.2}`} stroke={C.white} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          <path d={`M-175 14 L${-175 - wakeLen} ${14 + wakeLen * 0.2}`} stroke={C.white} strokeWidth={5} strokeLinecap="round" opacity={0.6} />
          {Array.from({ length: 6 }, (_, i) => (
            <circle
              key={i}
              cx={-190 - ((frame * 4 + i * 45) % 240) * speed}
              cy={14 + Math.sin(frame * 0.2 + i) * 8}
              r={6 - i * 0.6}
              fill={C.white}
              opacity={0.6}
            />
          ))}
        </g>
        {/* contenedores */}
        {[0, 1, 2].map((r) =>
          Array.from({ length: 6 - r }, (_, c) => (
            <rect
              key={`${r}-${c}`}
              x={-110 + c * 48 + r * 20}
              y={-34 - (r + 1) * 26}
              width={44}
              height={24}
              rx={3}
              fill={CONTAINER_COLORS[(r * 2 + c) % 5]}
            />
          ))
        )}
        {/* puente */}
        <rect x={-172} y={-112} width={48} height={78} rx={4} fill={C.white} />
        <rect x={-164} y={-100} width={32} height={10} fill={C.cyan} />
        <rect x={-150} y={-136} width={14} height={24} fill={C.alert} />
        {/* casco */}
        <path d="M-175 -34 L190 -34 L150 28 L-150 28 Q-172 28 -175 0 Z" fill="#2B3A67" stroke={C.blueLight} strokeWidth={3} />
        <path d="M-160 10 H165 L150 28 H-150 Z" fill={C.alert} opacity={0.9} />
      </P>

      {/* Barrera láser */}
      <P x={700} y={980} d={60} amp={4} phase={2}>
        <rect x={-24} y={-200} width={48} height={400} fill={C.alert} opacity={0.1 + 0.08 * Math.sin(frame * 0.3)} />
        {[-14, 0, 14].map((o) => (
          <line
            key={o}
            x1={o}
            y1={-200}
            x2={o}
            y2={200}
            stroke={C.alert}
            strokeWidth={o === 0 ? 8 : 4}
            strokeDasharray="30 14"
            strokeDashoffset={-frame * 3}
            strokeLinecap="round"
            filter="url(#glow)"
          />
        ))}
        <rect x={-30} y={-232} width={60} height={34} rx={8} fill={C.slate} stroke={C.alert} strokeWidth={4} />
        <rect x={-30} y={198} width={60} height={34} rx={8} fill={C.slate} stroke={C.alert} strokeWidth={4} />
        <circle r={46} fill={C.bg} stroke={C.alert} strokeWidth={6} />
        <rect x={-6} y={-24} width={12} height={30} rx={5} fill={C.alert} />
        <circle cy={20} r={7} fill={C.alert} />
      </P>

      {/* Medidor de flujo petrolero */}
      <P x={CX} y={1760} d={95} amp={4} phase={3}>
        <path d="M-250 0 A250 250 0 0 1 250 0" fill="none" stroke={C.blueLight} strokeWidth={34} strokeLinecap="round" opacity={0.6} />
        <path
          d="M-250 0 A250 250 0 0 1 250 0"
          fill="none"
          stroke={flow < 50 ? C.alert : C.warning}
          strokeWidth={34}
          strokeLinecap="round"
          strokeDasharray={`${(ARC * flow) / 100} ${ARC}`}
          filter="url(#glow)"
        />
        <g transform={`rotate(${180 + flow * 1.8 + Math.sin(frame * 0.3) * 0.8})`}>
          <line x1={0} y1={0} x2={205} y2={0} stroke={C.white} strokeWidth={8} strokeLinecap="round" />
        </g>
        <circle r={16} fill={C.white} />
        <text y={-90} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.main} fontWeight={900} fontSize={190} letterSpacing={-6} fill={C.alert}>
          {`-${flowDrop}%`}
        </text>
        <text y={64} textAnchor="middle" dominantBaseline="central" fontFamily={FONT.main} fontWeight={700} fontSize={42} letterSpacing={6} fill={C.white} opacity={0.75}>
          FLUJO PETROLERO
        </text>
      </P>

      <T x={CX} y={250} d={0} size={240}>ORMUZ</T>
    </g>
  );
};

/* ───────────────────────── ESCENA 2 · Ciberataque y apagón ───────────────────────── */

const BUILDINGS = [
  { x: 40, w: 120, h: 380 },
  { x: 170, w: 150, h: 560 },
  { x: 330, w: 110, h: 300 },
  { x: 450, w: 170, h: 700 },
  { x: 630, w: 120, h: 420 },
  { x: 760, w: 150, h: 520 },
  { x: 920, w: 120, h: 340 },
];

const Scene2: React.FC = () => {
  const { frame, sceneLocalFrame: sl } = useCtx();
  const lanes = [
    { y: -70, bx: -200, bt: 50 },
    { y: 0, bx: 0, bt: 70 },
    { y: 70, bx: 200, bt: 90 },
  ];
  const tick = Math.floor(frame / 3);
  const offline = sl > 100;
  const flicker = offline && frame % 14 < 2 ? 0.55 : 1;

  return (
    <g>
      <T x={CX} y={250} d={0} size={250} stroke={C.warning} alpha={sl > 40 && frame % 18 < 2 ? 0.5 : 1}>APAGÓN</T>

      {/* Horizonte */}
      <P x={CX} y={1120} d={0} amp={2}>
        <line x1={-540} y1={0} x2={540} y2={0} stroke={C.blueLight} strokeWidth={4} />
      </P>

      {/* Rascacielos */}
      {BUILDINGS.map((b, bi) => {
        const cols = Math.floor((b.w - 24) / 34);
        const rows = Math.floor((b.h - 30) / 44);
        return (
          <P key={bi} x={b.x + b.w / 2} y={1120} d={bi * 4} amp={3} phase={bi} breathe={0.006}>
            <rect x={-b.w / 2} y={-b.h} width={b.w} height={b.h} fill={C.slate} stroke={C.blueLight} strokeWidth={3} />
            {Array.from({ length: rows * cols }, (_, n) => {
              const r = Math.floor(n / cols);
              const c = n % cols;
              const left = 40 + bi * 9 + r * 2 + c * 1.5 - sl;
              const lit = left > 8 || (left > 0 && Math.floor(sl / 2) % 2 === 0);
              return (
                <rect
                  key={n}
                  x={-b.w / 2 + 16 + c * 34}
                  y={-b.h + 20 + r * 44}
                  width={20}
                  height={26}
                  rx={3}
                  fill={lit ? ((bi + r + c) % 3 === 0 ? C.cyan : C.warning) : C.blueLight}
                  opacity={lit ? 0.95 : 0.28}
                />
              );
            })}
            {bi === 3 && (
              <g>
                <line x1={0} y1={-b.h} x2={0} y2={-b.h - 70} stroke={C.blueLight} strokeWidth={6} />
                <circle cy={-b.h - 76} r={9} fill={C.alert} opacity={0.4 + 0.6 * Math.abs(Math.sin(frame * 0.08))} />
              </g>
            )}
          </P>
        );
      })}

      {/* Cables de fibra con errores */}
      <P x={CX} y={1290} d={30} amp={4} phase={1}>
        {lanes.map((l, i) => {
          const broken = sl > l.bt;
          return (
            <g key={i}>
              <path d={`M-540 ${l.y} Q ${(-540 + l.bx) / 2} ${l.y + 36} ${l.bx - 22} ${l.y + 10}`} fill="none" stroke={C.cyan} strokeWidth={5} opacity={0.5} />
              <path d={`M-540 ${l.y} Q ${(-540 + l.bx) / 2} ${l.y + 36} ${l.bx - 22} ${l.y + 10}`} fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeDasharray="6 44" strokeDashoffset={-frame * 4} />
              <path d={`M${l.bx + 22} ${l.y + 10} Q ${(l.bx + 540) / 2} ${l.y + 36} 540 ${l.y}`} fill="none" stroke={broken ? C.blueLight : C.cyan} strokeWidth={5} opacity={broken ? 0.35 : 0.5} />
              {!broken && (
                <path d={`M${l.bx + 22} ${l.y + 10} Q ${(l.bx + 540) / 2} ${l.y + 36} 540 ${l.y}`} fill="none" stroke={C.white} strokeWidth={6} strokeLinecap="round" strokeDasharray="6 44" strokeDashoffset={-frame * 4} />
              )}
              {broken && (
                <g transform={`translate(${l.bx} ${l.y + 10})`}>
                  <circle r={16 + (tick % 3) * 4} fill={C.alert} opacity={0.25} />
                  {Array.from({ length: 10 }, (_, k) => {
                    const a = pt(0, 0, 8, k * 36 + tick * 17);
                    const b = pt(0, 0, 10 + ((k * 37 + tick * 11) % 34), k * 36 + tick * 17);
                    return <line key={k} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={k % 2 ? C.warning : C.alert} strokeWidth={4} strokeLinecap="round" />;
                  })}
                </g>
              )}
            </g>
          );
        })}
      </P>

      <T x={CX} y={1470} d={70} size={70} weight={800} ls={4}>RED ELÉCTRICA</T>
      <T x={CX} y={1620} d={90} size={220} fill={C.alert} alpha={flicker}>OFFLINE</T>

      {/* Estados de servicio */}
      {[
        { y: 1790, label: "INTERNET", state: "CAÍDO", d: 110 },
        { y: 1850, label: "TRANSPORTE", state: "CAÍDO", d: 120 },
      ].map((r, i) => (
        <P key={i} x={CX} y={r.y} d={r.d} amp={3} phase={i}>
          <circle cx={-300} r={10} fill={C.alert} opacity={0.5 + 0.5 * Math.abs(Math.sin(frame * 0.1 + i))} />
          <text x={-270} dominantBaseline="central" fontFamily={FONT.mono} fontWeight={700} fontSize={44} fill={C.white}>{r.label}</text>
          <text x={300} textAnchor="end" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={700} fontSize={44} fill={C.alert}>{r.state}</text>
        </P>
      ))}
    </g>
  );
};

/* ───────────────────────── ESCENA 3 · Reloj de 72 horas ───────────────────────── */

const Scene3: React.FC = () => {
  const { frame, sceneLocalFrame: sl } = useCtx();
  const R = 350;
  const rot = 1080 * easeOut(prog(sl, 0, 200)) + frame * 0.15;
  const ringR = 212;
  const circ = 2 * Math.PI * ringR;
  const dash = circ * prog(sl, 10, 200);
  const ambDx = Math.cos(frame * 0.025);
  const amb = 200 + Math.sin(frame * 0.025) * 60;
  const siren = Math.floor(frame / 8) % 2 === 0;

  return (
    <g>
      <T x={CX} y={210} d={0} size={175}>SIN AYUDA</T>

      {/* Cronógrafo */}
      <P x={CX} y={720} d={0} amp={6}>
        <g transform={`rotate(${rot})`}>
          <circle r={R} fill="none" stroke={C.blueLight} strokeWidth={16} />
          {Array.from({ length: 72 }, (_, i) => {
            const major = i % 6 === 0;
            const ang = i * 5 - 90;
            const a = pt(0, 0, R - 8, ang);
            const b = pt(0, 0, R - 8 - (major ? 46 : 22), ang);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={major ? C.cyan : C.white} strokeWidth={major ? 8 : 4} opacity={major ? 1 : 0.6} strokeLinecap="round" />;
          })}
          {Array.from({ length: 12 }, (_, k) => {
            const i = k * 6;
            const p = pt(0, 0, R - 84, i * 5 - 90);
            return (
              <g key={i} transform={`translate(${p.x} ${p.y}) rotate(${-rot})`}>
                <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT.mono} fontWeight={700} fontSize={40} fill={C.white} opacity={0.9}>{i}</text>
              </g>
            );
          })}
        </g>
        <circle r={ringR} fill="none" stroke={C.slate} strokeWidth={12} />
        <circle r={ringR} fill="none" stroke={C.cyan} strokeWidth={12} strokeLinecap="round" strokeDasharray={`${dash} ${circ}`} transform="rotate(-90)" filter="url(#glow)" />
        <path d={`M-24 ${-R - 34} L24 ${-R - 34} L0 ${-R + 14} Z`} fill={C.alert} filter="url(#glow)" />
      </P>
      <T x={CX} y={720} d={10} size={200} fill={C.cyan} ls={-4}>72H</T>
      <T x={CX} y={850} d={22} size={44} weight={700} ls={4} alpha={0.7}>HORAS CRÍTICAS</T>

      <T x={CX} y={1215} d={40} size={100} fill={C.cyan}>ESCUDO CIVIL</T>

      {/* Escudo protector */}
      <P x={CX} y={1790} d={50} amp={3} phase={1}>
        <path d="M-430 0 A430 430 0 0 1 430 0 Z" fill={C.cyan} opacity={0.08} />
        <path d="M-430 0 A430 430 0 0 1 430 0" fill="none" stroke={C.cyan} strokeWidth={10} filter="url(#glow)" />
        {[0, 1, 2].map((i) => {
          const k = (frame * 0.012 + i / 3) % 1;
          const r = 200 + k * 230;
          return <path key={i} d={`M${-r} 0 A${r} ${r} 0 0 1 ${r} 0`} fill="none" stroke={C.cyan} strokeWidth={4} opacity={(1 - k) * 0.6} />;
        })}
        <line x1={-480} y1={0} x2={480} y2={0} stroke={C.blueLight} strokeWidth={6} />

        {/* Hospital */}
        <g transform="translate(-170 0)">
          <rect x={-130} y={-200} width={260} height={200} fill={C.slate} stroke={C.blueLight} strokeWidth={4} />
          <rect x={-60} y={-250} width={120} height={50} fill={C.slate} stroke={C.blueLight} strokeWidth={4} />
          <circle cy={-225} r={26} fill={C.white} />
          <rect x={-6} y={-241} width={12} height={32} rx={3} fill={C.alert} />
          <rect x={-16} y={-231} width={32} height={12} rx={3} fill={C.alert} />
          {Array.from({ length: 8 }, (_, n) => (
            <rect key={n} x={-100 + (n % 4) * 52} y={-170 + Math.floor(n / 4) * 56} width={34} height={36} rx={4} fill={C.warning} opacity={0.65 + 0.3 * Math.sin(frame * 0.05 + n)} />
          ))}
          <rect x={-26} y={-60} width={52} height={60} rx={4} fill={C.cyan} opacity={0.8} />
        </g>

        {/* Ambulancia */}
        <g transform={`translate(${amb} 0) scale(${ambDx >= 0 ? 1 : -1} 1)`}>
          <rect x={-90} y={-100} width={120} height={80} rx={8} fill={C.white} />
          <path d="M30 -100 H70 L100 -60 V-20 H30 Z" fill={C.white} />
          <path d="M42 -88 H66 L86 -62 H42 Z" fill={C.cyan} opacity={0.8} />
          <rect x={-90} y={-50} width={190} height={10} fill={C.alert} />
          <rect x={-38} y={-86} width={16} height={44} rx={3} fill={C.alert} />
          <rect x={-52} y={-72} width={44} height={16} rx={3} fill={C.alert} />
          <rect x={-20} y={-112} width={40} height={12} rx={4} fill={siren ? C.alert : "#3B82F6"} />
          <circle cx={0} cy={-120} r={30} fill={siren ? C.alert : "#3B82F6"} opacity={0.25} />
          {[-55, 65].map((wx) => (
            <circle key={wx} cx={wx} cy={-14} r={18} fill={C.bg} stroke={C.white} strokeWidth={6} />
          ))}
        </g>
      </P>
    </g>
  );
};

/* ───────────────────────── ESCENA 4 · Modelo nórdico y desastres ───────────────────────── */

const SHIELD = "M-110 -140 H110 V30 C110 100 55 150 0 185 C-55 150 -110 100 -110 30 Z";

const Shield: React.FC<{ k: number }> = ({ k }) => {
  const bg = ["#006AA7", "#F8F9FA", "#BA0C2F"][k];
  return (
    <g>
      <clipPath id={`shd${k}`}>
        <path d={SHIELD} />
      </clipPath>
      <path d={SHIELD} fill={bg} />
      <g clipPath={`url(#shd${k})`}>
        {k === 0 && (
          <>
            <rect x={-65} y={-140} width={40} height={340} fill="#FECC00" />
            <rect x={-110} y={-25} width={220} height={40} fill="#FECC00" />
          </>
        )}
        {k === 1 && (
          <>
            <rect x={-67} y={-140} width={44} height={340} fill="#003580" />
            <rect x={-110} y={-27} width={220} height={44} fill="#003580" />
          </>
        )}
        {k === 2 && (
          <>
            <rect x={-75} y={-140} width={60} height={340} fill={C.white} />
            <rect x={-110} y={-35} width={220} height={60} fill={C.white} />
            <rect x={-61} y={-140} width={32} height={340} fill="#00205B" />
            <rect x={-110} y={-21} width={220} height={32} fill="#00205B" />
          </>
        )}
      </g>
      <path d={SHIELD} fill="none" stroke={C.cyan} strokeWidth={6} strokeLinejoin="round" />
    </g>
  );
};

const quake = (tt: number, ev: number, amp: number) =>
  tt < ev ? 0 : amp * Math.exp(-(tt - ev) / 45) * Math.sin((tt - ev) * 0.85) * Math.min(1, (tt - ev) / 4);
const ampAt = (tt: number) =>
  tt < 0 ? 0 : Math.max(-210, Math.min(210, 7 * Math.sin(tt * 0.6) + quake(tt, 60, 150) + quake(tt, 120, 110) + quake(tt, 180, 160)));

const Scene4: React.FC = () => {
  const { frame, sceneLocalFrame: sl } = useCtx();
  const hit = (ev: number) => sl >= ev && sl < ev + 30;
  const trace = Array.from({ length: 193 }, (_, n) => {
    const x = -480 + n * 5;
    return { x, y: ampAt(sl - (480 - x) / 4) };
  });
  const pen = ampAt(sl);
  const words = [
    { w: "MÉXICO", y: 980, ev: 60, d: 20 },
    { w: "CHILE", y: 1100, ev: 120, d: 30 },
    { w: "JAPÓN", y: 1220, ev: 180, d: 40 },
  ];

  return (
    <g>
      <T x={CX} y={185} d={0} size={175}>DEFENSA</T>
      <T x={CX} y={340} d={8} size={175} stroke={C.purple}>TOTAL</T>

      {[
        { k: 0, x: 210, name: "SUECIA" },
        { k: 1, x: 540, name: "FINLANDIA" },
        { k: 2, x: 870, name: "NORUEGA" },
      ].map((s) => (
        <React.Fragment key={s.k}>
          <P x={s.x} y={620} d={14 + s.k * 8} amp={7} phase={s.k * 1.3}>
            <Shield k={s.k} />
          </P>
          <T x={s.x} y={865} d={22 + s.k * 8} size={44} weight={700} ls={2}>{s.name}</T>
        </React.Fragment>
      ))}

      {/* Palabras clave de desastres */}
      {words.map((w, i) => (
        <T key={w.w} x={70} y={w.y} d={w.d} size={120} anchor="start" fill={hit(w.ev) ? C.alert : C.white}>
          {w.w}
        </T>
      ))}

      {/* Iconos: huracán, falla, ola */}
      <P x={900} y={980} d={26} amp={6}>
        <g transform={`rotate(${frame * 3})`} fill="none" stroke={C.cyan} strokeWidth={8} strokeLinecap="round">
          {[0, 120, 240].map((a) => (
            <path key={a} d={poly(Array.from({ length: 12 }, (_, i) => pt(0, 0, 10 + (i / 11) * 58, a + (i / 11) * 220)))} />
          ))}
        </g>
        <circle r={8} fill={C.cyan} />
      </P>
      <P x={900} y={1100} d={36} amp={6} phase={1}>
        <path d="M-40 -50 L-10 -20 L-30 0 L10 25 L-8 45 L35 62" fill="none" stroke={C.alert} strokeWidth={9} strokeLinejoin="round" strokeLinecap="round" />
      </P>
      <P x={900} y={1220} d={46} amp={6} phase={2}>
        <path d="M-62 30 Q-22 -52 24 -22 Q48 -4 30 12 Q10 -20 -12 12" fill="none" stroke={C.cyan} strokeWidth={9} strokeLinecap="round" strokeLinejoin="round" />
        <path d="M-62 52 H62" stroke={C.cyan} strokeWidth={9} strokeLinecap="round" opacity={0.6} />
      </P>

      <T x={CX} y={1335} d={50} size={60} weight={800} ls={3} fill={C.cyan}>NADIE ESTÁ A SALVO</T>

      {/* Sismógrafo */}
      <P x={CX} y={1640} d={56} amp={4}>
        {Array.from({ length: 12 }, (_, k) => {
          const x = 480 - ((4 * sl + k * 80) % 960);
          return <line key={k} x1={x} y1={-210} x2={x} y2={210} stroke={C.blueLight} strokeWidth={2} opacity={0.4} />;
        })}
        {[-160, -80, 0, 80, 160].map((y) => (
          <line key={y} x1={-480} y1={y} x2={480} y2={y} stroke={C.blueLight} strokeWidth={y === 0 ? 3 : 2} opacity={y === 0 ? 0.7 : 0.35} />
        ))}
        <path d={poly(trace)} fill="none" stroke={C.cyan} strokeWidth={5} strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />
        <line x1={480} y1={pen} x2={600} y2={pen} stroke={C.white} strokeWidth={5} />
        <circle cx={480} cy={pen} r={11} fill={C.alert} filter="url(#glow)" />
      </P>
    </g>
  );
};

/* ───────────────────────── ESCENA 5 · Kit parte 1: agua, comida, luz ───────────────────────── */

const CAN = "M-110 -120 H60 L110 -70 V140 Q110 160 90 160 H-90 Q-110 160 -110 140 Z";

const Scene5: React.FC = () => {
  const { frame, sceneLocalFrame: sl, fps } = useCtx();
  const fill = easeOut(prog(sl, 30, 120));
  const liters = Math.round(9 * fill);
  const top = 160 - 280 * 0.92 * fill;
  const wave = Array.from({ length: 25 }, (_, n) => {
    const x = -120 + n * 10;
    return { x, y: top + Math.sin((x + frame * 3) * 0.05) * 6 };
  });
  const tab = Math.min(1, spring({ frame: sl - 75, fps, config: { damping: 10, stiffness: 100 } }));
  const dial = Math.sin(frame * 0.05) * 30;

  return (
    <g>
      <T x={CX} y={215} d={0} size={190}>KIT 72H</T>

      {/* Agua */}
      <P x={300} y={640} d={10} amp={8}>
        <clipPath id="canClip">
          <path d={CAN} />
        </clipPath>
        <path d={CAN} fill="#2F4A33" />
        <g clipPath="url(#canClip)">
          <path d={`${poly(wave)} L120 170 L-120 170 Z`} fill={C.cyan} opacity={0.85} />
        </g>
        <path d="M-80 -30 L80 130 M80 -30 L-80 130" stroke="#1C2F20" strokeWidth={8} opacity={0.6} />
        <rect x={-90} y={-100} width={80} height={44} rx={14} fill={C.bg} stroke="#6B8F5E" strokeWidth={5} />
        <rect x={20} y={-152} width={50} height={36} rx={6} fill={C.white} />
        <path d={CAN} fill="none" stroke="#6B8F5E" strokeWidth={6} strokeLinejoin="round" />
        {[0, 1, 2].map((i) => (
          <line key={i} x1={118} y1={20 + i * 50} x2={150} y2={20 + i * 50} stroke={C.white} strokeWidth={5} strokeLinecap="round" opacity={0.7} />
        ))}
      </P>
      <T x={700} y={600} d={20} size={420} fill={C.cyan} ls={-8}>{liters}</T>
      <T x={700} y={810} d={28} size={110}>LITROS</T>

      {/* Comida */}
      <P x={300} y={1170} d={40} amp={8} phase={1}>
        <path d="M-110 -60 V100 A110 30 0 0 0 110 100 V-60 Z" fill={C.orange} />
        <path d="M-110 10 A110 30 0 0 0 110 10 V60 A110 30 0 0 1 -110 60 Z" fill={C.white} />
        <path d="M-70 120 V-40" stroke={C.white} strokeWidth={10} opacity={0.2} strokeLinecap="round" />
        <ellipse cy={-60} rx={110} ry={30} fill="#CBD5E1" />
        <ellipse cy={-60} rx={92} ry={22} fill="#94A3B8" />
        <ellipse cy={-60} rx={80 * tab} ry={18 * tab} fill="#1E293B" />
        <g transform={`translate(-30 -62) rotate(${-tab * 80})`}>
          <rect x={0} y={-5} width={80} height={10} rx={5} fill="#E2E8F0" />
          <circle cx={80} r={18} fill="none" stroke="#E2E8F0" strokeWidth={7} />
        </g>
      </P>
      <T x={720} y={1130} d={50} size={170} fill={C.warning} ls={-4}>3 DÍAS</T>
      <T x={720} y={1262} d={58} size={64} weight={800} ls={4}>RACIONES</T>

      {/* Linterna + radio */}
      <P x={250} y={1640} d={70} amp={6} phase={2}>
        <defs>
          <linearGradient id="beam" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor={C.warning} stopOpacity={0.6} />
            <stop offset="1" stopColor={C.warning} stopOpacity={0} />
          </linearGradient>
        </defs>
        <path d="M105 -42 L440 -210 V210 L105 42 Z" fill="url(#beam)" />
        {Array.from({ length: 5 }, (_, i) => (
          <line key={i} x1={105} y1={-30 + i * 15} x2={440} y2={-190 + i * 95} stroke={C.warning} strokeWidth={4} opacity={0.2 + 0.15 * Math.sin(frame * 0.05 + i)} />
        ))}
        <rect x={-120} y={-34} width={160} height={68} rx={14} fill="#26324F" stroke={C.blueLight} strokeWidth={4} />
        {[-90, -60, -30].map((x) => (
          <line key={x} x1={x} y1={-24} x2={x} y2={24} stroke={C.blueLight} strokeWidth={5} strokeLinecap="round" />
        ))}
        <path d="M40 -34 L100 -56 V56 L40 34 Z" fill="#94A3B8" stroke={C.blueLight} strokeWidth={4} />
        <ellipse cx={102} rx={10} ry={50} fill={C.white} filter="url(#glow)" />
        <circle cx={0} cy={-34} r={9} fill={C.alert} />
      </P>

      <P x={830} y={1640} d={95} amp={6} phase={3}>
        {[0, 1, 2].map((i) => {
          const k = (frame * 0.015 + i / 3) % 1;
          return <path key={i} d={`M${100 + 18 + k * 50} ${-170 - k * 20} a${20 + k * 50} ${20 + k * 50} 0 0 1 0 ${40 + k * 40}`} fill="none" stroke={C.cyan} strokeWidth={4} opacity={1 - k} />;
        })}
        <line x1={100} y1={-80} x2={160} y2={-170} stroke={C.white} strokeWidth={6} strokeLinecap="round" />
        <circle cx={160} cy={-170} r={9} fill={C.cyan} />
        <rect x={-130} y={-80} width={260} height={160} rx={22} fill="#24304F" stroke={C.warning} strokeWidth={5} />
        <circle cx={-60} cy={10} r={54} fill={C.bg} stroke={C.blueLight} strokeWidth={4} />
        {[16, 32, 46].map((r) => (
          <circle key={r} cx={-60} cy={10} r={r} fill="none" stroke={C.blueLight} strokeWidth={3} />
        ))}
        <rect x={20} y={-52} width={92} height={46} rx={8} fill={C.bg} />
        {Array.from({ length: 9 }, (_, i) => (
          <line key={i} x1={30 + i * 9} y1={-26} x2={30 + i * 9} y2={-12} stroke={C.white} strokeWidth={2} opacity={0.6} />
        ))}
        <line x1={66 + dial} y1={-50} x2={66 + dial} y2={-8} stroke={C.warning} strokeWidth={4} strokeLinecap="round" />
        <circle cx={55} cy={42} r={14} fill="#94A3B8" />
        <circle cx={95} cy={42} r={14} fill="#94A3B8" />
      </P>
      <T x={830} y={1775} d={104} size={60} ls={3}>AM/FM</T>
    </g>
  );
};

/* ───────────────────────── ESCENA 6 · Kit parte 2: salud y respaldo ───────────────────────── */

const PILLS = [C.white, C.warning, C.cyan, C.alert, C.white];

const Strip: React.FC = () => (
  <g>
    <rect x={-85} y={-38} width={170} height={76} rx={14} fill="#CBD5E1" />
    {PILLS.map((col, i) => (
      <g key={i}>
        <circle cx={-60 + i * 30} r={11} fill={col} />
        <circle cx={-64 + i * 30} cy={-4} r={3.5} fill={C.white} opacity={0.8} />
      </g>
    ))}
  </g>
);

const Bill: React.FC = () => (
  <g>
    <rect x={-140} y={-65} width={280} height={130} rx={12} fill={C.emerald} />
    <rect x={-126} y={-52} width={252} height={104} rx={8} fill="none" stroke={C.white} strokeWidth={3} opacity={0.5} />
    <circle r={36} fill="#047857" />
    <text textAnchor="middle" dominantBaseline="central" fontFamily={FONT.main} fontWeight={900} fontSize={50} fill={C.white}>$</text>
  </g>
);

const Scene6: React.FC = () => {
  const strips = [
    { x: 200, y: 520, r: -16, d: 20 },
    { x: 880, y: 470, r: 14, d: 28 },
    { x: 210, y: 770, r: 10, d: 36 },
    { x: 870, y: 770, r: -12, d: 44 },
  ];

  return (
    <g>
      <T x={CX} y={200} d={0} size={190}>SALUD</T>

      {/* Maletín médico */}
      <P x={CX} y={600} d={10} amp={7}>
        <path d="M-70 -150 V-185 Q-70 -200 -55 -200 H55 Q70 -200 70 -185 V-150" fill="none" stroke={C.blueLight} strokeWidth={16} strokeLinecap="round" />
        <rect x={-250} y={-150} width={500} height={300} rx={34} fill={C.alert} />
        <line x1={-250} y1={-90} x2={250} y2={-90} stroke={C.bg} strokeWidth={5} opacity={0.3} />
        {[-168, 132].map((x) => (
          <rect key={x} x={x} y={-108} width={36} height={36} rx={8} fill={C.white} opacity={0.85} />
        ))}
        <rect x={-22} y={-50} width={44} height={150} rx={10} fill={C.white} />
        <rect x={-75} y={3} width={150} height={44} rx={10} fill={C.white} />
      </P>
      {strips.map((s, i) => (
        <P key={i} x={s.x} y={s.y} d={s.d} amp={9} phase={i * 1.1}>
          <g transform={`rotate(${s.r})`}>
            <Strip />
          </g>
        </P>
      ))}
      <T x={CX} y={880} d={50} size={130} fill={C.emerald}>7 DÍAS</T>

      <T x={CX} y={1070} d={62} size={175}>RESPALDO</T>

      {/* Bolsa hermética */}
      <P x={CX} y={1430} d={70} amp={6} phase={1}>
        <clipPath id="pouchClip">
          <rect x={-260} y={-190} width={520} height={420} rx={40} />
        </clipPath>
        <g transform="translate(-30 -10) rotate(-8)"><Bill /></g>
        <g transform="translate(0 30) rotate(4)"><Bill /></g>
        <g transform="translate(20 60) rotate(12)"><Bill /></g>
        <g transform="translate(70 90) rotate(-5)">
          <rect x={-120} y={-75} width={240} height={150} rx={14} fill={C.white} />
          <rect x={-120} y={-75} width={240} height={30} rx={14} fill={C.cyan} />
          <rect x={-120} y={-60} width={240} height={15} fill={C.cyan} />
          <circle cx={-62} cy={-5} r={26} fill={C.blueLight} />
          <path d="M-100 58 Q-62 10 -24 58 Z" fill={C.blueLight} />
          <rect x={0} y={-12} width={90} height={12} rx={6} fill={C.slate} />
          <rect x={0} y={14} width={70} height={12} rx={6} fill={C.blueLight} />
          <rect x={0} y={40} width={50} height={12} rx={6} fill={C.blueLight} />
        </g>
        <rect x={-260} y={-190} width={520} height={420} rx={40} fill={C.cyan} opacity={0.1} stroke={C.cyan} strokeWidth={6} filter="url(#glow)" />
        <path d="M-200 -170 L-120 -170 L-220 210 L-260 210 Z" fill={C.white} opacity={0.1} />
        <rect x={-260} y={-190} width={520} height={50} rx={30} fill={C.cyan} opacity={0.25} />
        <line x1={-240} y1={-165} x2={240} y2={-165} stroke={C.white} strokeWidth={4} opacity={0.7} />
        <line x1={-240} y1={-150} x2={240} y2={-150} stroke={C.white} strokeWidth={4} opacity={0.7} />
        <rect x={-30 + Math.sin(useCtx().frame * 0.05) * 6} y={-182} width={60} height={40} rx={10} fill={C.white} opacity={0.9} />
        <g clipPath="url(#pouchClip)">
          {Array.from({ length: 10 }, (_, i) => (
            <ellipse key={i} cx={-230 + i * 51} cy={-130 + ((useCtx().frame * 2.2 + i * 97) % 400)} rx={6} ry={9} fill={C.cyan} opacity={0.7} />
          ))}
        </g>
      </P>
      <T x={CX} y={1775} d={86} size={100} stroke={C.cyan}>100% ESTANCO</T>
    </g>
  );
};

/* ───────────────────────── ESCENA 7 · Cierre y loop perfecto ───────────────────────── */

const Scene7: React.FC = () => {
  const { frame, sceneLocalFrame: sl } = useCtx();
  const e = easeIO(prog(sl, LOOP_START, LOOP_END));
  const nodes = Array.from({ length: 8 }, (_, i) => {
    const a = i * 45 - 90;
    return { x: CX + 390 * Math.cos(rad(a)), y: CY + 360 * Math.sin(rad(a)) };
  });
  const linesOn = prog(sl, 30, 55);
  const ringR = 150 + (CORE_R - 150) * e + Math.sin(frame * 0.05) * 6 * (1 - e);

  const link = (a: { x: number; y: number }, b: { x: number; y: number }, key: string, off: number) => {
    const t = (frame * 0.012 + off) % 1;
    return (
      <g key={key} opacity={linesOn}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={C.cyan} strokeWidth={3} opacity={0.45} />
        <circle cx={a.x + (b.x - a.x) * t} cy={a.y + (b.y - a.y) * t} r={7} fill={C.cyan} filter="url(#glow)" />
      </g>
    );
  };

  return (
    <g>
      <g
        transform={`translate(${CX} ${CY}) rotate(${e * 90}) scale(${1 - e}) translate(${-CX} ${-CY})`}
        opacity={1 - e * e * e}
      >
        {/* Red comunitaria */}
        {nodes.map((n, i) => link({ x: CX, y: CY }, n, `s${i}`, i * 0.125))}
        {nodes.map((n, i) => link(n, nodes[(i + 1) % 8], `r${i}`, i * 0.09 + 0.3))}

        {nodes.map((n, i) => {
          const k = (frame * 0.012 + i * 0.12) % 1;
          return (
            <P key={i} x={n.x} y={n.y} d={20 + i * 4} amp={6} phase={i}>
              <circle r={40 + k * 28} fill="none" stroke={C.cyan} strokeWidth={3} opacity={(1 - k) * 0.6} />
              <path d="M-34 6 L0 -34 L34 6 V42 H-34 Z" fill={C.slate} stroke={C.cyan} strokeWidth={5} strokeLinejoin="round" />
              <rect x={-8} y={14} width={16} height={28} rx={3} fill={C.warning} />
            </P>
          );
        })}

        {/* Ciudadano resiliente */}
        <P x={CX} y={CY} d={8} amp={6} phase={1}>
          <rect x={-104} y={-6} width={44} height={92} rx={16} fill={C.orange} />
          <path d="M-78 90 C-78 20 -50 -10 0 -10 C50 -10 78 20 78 90 Z" fill={C.white} />
          <circle cy={-70} r={42} fill={C.white} />
          <circle cy={34} r={12} fill={C.cyan} />
        </P>

        <T x={CX} y={230} d={4} size={190}>PREVIENE</T>
        <T x={CX} y={410} d={12} size={190} stroke={C.cyan}>JUNTOS</T>
        <T x={CX} y={1700} d={60} size={190} fill={C.cyan}>KIT 72H</T>
      </g>

      {/* Aura que se contrae hasta el círculo central del radar (loop) */}
      <circle
        cx={CX}
        cy={CY}
        r={ringR}
        fill={C.cyan}
        fillOpacity={0.15}
        stroke={C.cyan}
        strokeWidth={6}
        opacity={Math.min(1, sl / 10)}
      />
    </g>
  );
};

/* ───────────────────────── Raíz ───────────────────────── */

const SCENES: React.FC[] = [Scene0, Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7];

export const World2D: React.FC<World2DProps> = ({ currentScene, sceneLocalFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const Active = SCENES[Math.max(0, Math.min(7, currentScene))] ?? Scene0;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        backgroundColor: THEME.colors.bg,
        overflow: "hidden",
      }}
    >
      <Ctx.Provider value={{ frame, sceneLocalFrame, fps }}>
        <svg width={1080} height={1920} viewBox="0 0 1080 1920" style={{ position: "absolute", inset: 0 }}>
          <defs>
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <Backdrop scene={currentScene} />
          <Active />
        </svg>
      </Ctx.Provider>
    </div>
  );
};
