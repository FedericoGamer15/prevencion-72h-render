/**
 * src/components/World2D.tsx
 * Animación 2D vectorial (SVG) · 1080x1920 · 60 fps · 3540 frames · 10 escenas.
 *
 * Notas de integración
 * - Los SFX se montan con <Sequence> relativos a este componente
 *   (offset = frame - sceneLocalFrame), así funciona tanto si World2D vive en la raíz
 *   de la composición como dentro de un <Sequence> por escena.
 * - VFX: si algún PNG de `public/assets/2d/vfx/` no existe, el <Img> se oculta solo
 *   (onError) y queda el destello vectorial. Ajusta VFX_FILES a los nombres reales de tu banco.
 */
import React from "react";
import {
  Audio,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export interface World2DProps {
  currentScene: number;
  sceneLocalFrame: number;
}

/* ════════════════════════ 1 · CONSTANTES Y UTILIDADES ════════════════════════ */

type V = [number, number];
type SP = { L: number; fps: number; f: number };

const W = 1080;
const H = 1920;
export const SCENE_DURATIONS = [424, 441, 419, 238, 504, 417, 281, 244, 310, 315];
export const TOTAL_FRAMES = 3593;
export const SCENE_START = SCENE_DURATIONS.reduce(
  (acc, dur, i) => {
    acc.push(acc[i] + dur);
    return acc;
  },
  [0]
);
export const SCENE_END = SCENE_START.slice(1);

const INK = "#1b1424";
const FONT = "'Poppins','Helvetica Neue',Arial,sans-serif";
const o = {
  stroke: INK,
  strokeWidth: 5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

const SFX_DIR = "assets/audio/sfx";
const SFX_LIST: { scene: number; f: number; file: string }[] = [
  { scene: 0, f: 10, file: "ui/switch1.wav" },
  { scene: 0, f: 120, file: "impacts/sub_impact_thud.wav" },
  { scene: 1, f: 5, file: "ui/click1.wav" },
  { scene: 1, f: 90, file: "ui/switch20.wav" },
  { scene: 2, f: 40, file: "ui/click2.wav" },
  { scene: 2, f: 45, file: "whooshes/whoosh_fast.wav" },
  { scene: 3, f: 10, file: "ui/switch10.wav" },
  { scene: 3, f: 80, file: "whooshes/whoosh_cinematic.wav" },
  { scene: 4, f: 60, file: "ui/click3.wav" },
  { scene: 4, f: 150, file: "ui/click4.wav" },
  { scene: 4, f: 240, file: "ui/switch30.wav" },
  { scene: 5, f: 5, file: "ambience/tension_riser.wav" },
  { scene: 5, f: 120, file: "ui/switch2.wav" },
  { scene: 6, f: 30, file: "ui/switch5.wav" },
  { scene: 6, f: 90, file: "impacts/sub_impact_thud.wav" },
  { scene: 7, f: 20, file: "ui/click5.wav" },
  { scene: 7, f: 120, file: "ui/switch15.wav" },
  { scene: 8, f: 20, file: "whooshes/whoosh_fast.wav" },
  { scene: 8, f: 90, file: "ui/switch4.wav" },
  { scene: 9, f: 10, file: "whooshes/whoosh_cinematic.wav" },
  { scene: 9, f: 180, file: "ui/switch1.wav" },
];

const VFX_DIR = "assets/2d/vfx";
const VFX_FILES = { suction: "particles/flare_01.png", dust: "smoke/smoke_01.png", sparkle: "particles/star_01.png" };
const VFX_EVENTS: Record<number, { f: number; x: number; y: number; size: number; file: string }[]> = {
  0: [
    { f: 80, x: 520, y: 1200, size: 520, file: VFX_FILES.suction },
    { f: 120, x: 380, y: 1520, size: 460, file: VFX_FILES.dust },
  ],
  2: [{ f: 45, x: 700, y: 1000, size: 480, file: VFX_FILES.suction }],
  4: [
    { f: 60, x: 200, y: 1150, size: 420, file: VFX_FILES.suction },
    { f: 150, x: 480, y: 1100, size: 380, file: VFX_FILES.suction },
    { f: 240, x: 760, y: 1100, size: 380, file: VFX_FILES.suction },
    { f: 290, x: 540, y: 440, size: 600, file: VFX_FILES.sparkle },
  ],
  8: [{ f: 90, x: 540, y: 700, size: 900, file: VFX_FILES.sparkle }],
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;
const wrap = (a: number) => ((((a + 180) % 360) + 360) % 360) - 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpV = (a: V, b: V, t: number): V => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const pts = (...p: V[]) => p.map((q) => `${q[0]},${q[1]}`).join(" ");
const dots = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

const easeIO = Easing.inOut(Easing.cubic);
const easeIn = Easing.in(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.7));
const prog = (L: number, a: number, b: number, e: (t: number) => number = easeIO) =>
  interpolate(L, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: e });
/** spring con amortiguación elástica, relativo al frame local de la escena */
const mkSp =
  (fps: number, L: number) =>
  (delay: number, damping = 9, stiffness = 110, mass = 0.7) =>
    spring({ frame: Math.max(0, L - delay), fps, config: { damping, stiffness, mass } });

/* ════════════════════════ 2 · PERSONAJE ARTICULADO ════════════════════════ */

type Arm = { out?: number; flex?: number; reach?: number; aim?: V; open?: boolean };
type Leg = { out?: number; lift?: number };
export interface Pose {
  lean?: number;
  head?: number;
  lookX?: number;
  lookY?: number;
  lid?: number;
  wink?: boolean;
  brow?: number;
  mouth?: "smile" | "grin" | "neutral" | "open" | "whistle" | "smirk" | "worry";
  armL?: Arm;
  armR?: Arm;
  legL?: Leg;
  legR?: Leg;
  seated?: boolean;
  pockets?: "L" | "R" | "both";
  bob?: number;
}
export interface Look {
  hoodie: string;
  hoodie2: string;
  pants: string;
  shoes: string;
  hair: string;
  skin: string;
  cap?: string;
  jacket?: string;
}
const PROTAG: Look = { hoodie: "#e4572e", hoodie2: "#b8401f", pants: "#2d3a6b", shoes: "#f4f1ea", hair: "#2a1a17", skin: "#f1c6a0" };
const JACKET: Look = { ...PROTAG, jacket: "#26303f" };
const DELIVERY: Look = { hoodie: "#f2a900", hoodie2: "#c98700", pants: "#3b3b46", shoes: "#222", hair: "#4a3a2a", skin: "#d9a67c", cap: "#f2a900" };
const OFFICER: Look = { hoodie: "#3a5f8f", hoodie2: "#243d5e", pants: "#1f2a3a", shoes: "#111", hair: "#2b2b2b", skin: "#e0b48e", cap: "#243d5e" };
const OFFICER2: Look = { ...OFFICER, skin: "#b98260", hair: "#111" };
const MERCHANT: Look = { hoodie: "#2f8f83", hoodie2: "#206a61", pants: "#4a4a55", shoes: "#2a2a2a", hair: "#161616", skin: "#e8bf98" };
const STUD_A: Look = { hoodie: "#6aa84f", hoodie2: "#4b7c38", pants: "#3a3f5c", shoes: "#eee", hair: "#6b3d1e", skin: "#e9b98d" };
const STUD_B: Look = { hoodie: "#7b5cc4", hoodie2: "#5a3fa0", pants: "#2c2c34", shoes: "#ddd", hair: "#1a1a1a", skin: "#a8734d" };
const STUD_C: Look = { hoodie: "#2e9bd1", hoodie2: "#1f6f99", pants: "#5a4a3a", shoes: "#fff", hair: "#d9a441", skin: "#f3cfae" };
const BG_A: Look = { hoodie: "#51607a", hoodie2: "#3c485c", pants: "#2a303d", shoes: "#aaa", hair: "#222", skin: "#d8ab86" };
const BG_B: Look = { hoodie: "#7a5160", hoodie2: "#5c3c48", pants: "#2a303d", shoes: "#999", hair: "#533", skin: "#c99a76" };

const SH_X = 68, SH_Y = -185, L1 = 96, L2 = 92, HIP_X = 30, HIP_Y = 18, THIGH = 125, SHIN = 118;

/** Brazo de 2 huesos: FK por ángulos o IK por `aim`; ambos con límites articulares (clamp). */
const solveArm = (sgn: 1 | -1, a: Arm = {}, lean = 0) => {
  const sx = -sgn * SH_X;
  const sy = SH_Y;
  const c = Math.cos(rad(lean));
  const sn = Math.sin(rad(lean));
  const S: V = [sx * c - sy * sn, sx * sn + sy * c];
  let out = a.out ?? 8;
  let flex = a.flex ?? 12;
  let l2 = L2 * (1 - 0.45 * (a.reach ?? 0));
  if (a.aim) {
    const dx = a.aim[0] - S[0];
    const dy = a.aim[1] - S[1];
    const d = clamp(Math.hypot(dx, dy), Math.abs(L1 - L2) + 2, L1 + L2 - 1);
    const an = Math.atan2(dy, dx);
    const T: V = [S[0] + Math.cos(an) * d, S[1] + Math.sin(an) * d];
    const at = deg(Math.atan2(-(T[0] - S[0]), T[1] - S[1]));
    const delta = deg(Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1)));
    const cands = [at + delta, at - delta].map((a1) => ({
      a1,
      E: [S[0] - L1 * Math.sin(rad(a1)), S[1] + L1 * Math.cos(rad(a1))] as V,
    }));
    const pick =
      sgn === 1
        ? cands[0].E[0] < cands[1].E[0] ? cands[0] : cands[1]
        : cands[0].E[0] > cands[1].E[0] ? cands[0] : cands[1];
    const a2 = deg(Math.atan2(-(T[0] - pick.E[0]), T[1] - pick.E[1]));
    out = wrap(sgn * pick.a1);
    flex = wrap(out - wrap(sgn * a2));
    l2 = L2;
  }
  out = clamp(out, -35, 178); // hombro
  flex = clamp(flex, -150, 150); // codo
  const a1 = rad(sgn * out);
  const a2 = rad(sgn * (out - flex));
  const E: V = [S[0] - L1 * Math.sin(a1), S[1] + L1 * Math.cos(a1)];
  const Hd: V = [E[0] - l2 * Math.sin(a2), E[1] + l2 * Math.cos(a2)];
  return { S, E, H: Hd, reach: a.reach ?? 0, open: !!a.open };
};

const solveLeg = (sgn: 1 | -1, l: Leg = {}, seated = false) => {
  const hip: V = [-sgn * HIP_X, HIP_Y];
  const out = clamp(l.out ?? 3, -28, 45);
  const lift = clamp(l.lift ?? 0, 0, 1);
  const th = seated ? THIGH * 0.46 : THIGH * (1 - 0.3 * lift);
  const sh = seated ? SHIN : SHIN * (1 - 0.3 * lift);
  const kO = seated ? 16 : out;
  const knee: V = [hip[0] - sgn * Math.sin(rad(kO)) * th, hip[1] + Math.cos(rad(kO)) * th];
  const aO = seated ? 8 : out * 0.4;
  const ankle: V = [knee[0] - sgn * Math.sin(rad(aO)) * sh, knee[1] + Math.cos(rad(aO)) * sh];
  return { hip, knee, ankle };
};

const handW = (x: number, y: number, s: number, sgn: 1 | -1, arm: Arm, lean = 0): V => {
  const h = solveArm(sgn, arm, lean).H;
  return [x + s * h[0], y + s * h[1]];
};

const lerpArm = (a: Arm, b: Arm, t: number): Arm => ({
  out: lerp(a.out ?? 8, b.out ?? 8, t),
  flex: lerp(a.flex ?? 12, b.flex ?? 12, t),
  reach: lerp(a.reach ?? 0, b.reach ?? 0, t),
  open: t < 0.5 ? a.open : b.open,
});

/** Ciclo de caminata de dibujo clásico (rodillas alternas + balanceo de brazos). */
const walk = (t: number, amp = 1): Pose => {
  const ph = t * 0.3;
  return {
    legL: { out: 6, lift: Math.max(0, Math.sin(ph)) * amp },
    legR: { out: 6, lift: Math.max(0, -Math.sin(ph)) * amp },
    armL: { out: 12 + 12 * amp * Math.sin(ph), flex: 14 },
    armR: { out: 12 - 12 * amp * Math.sin(ph), flex: 14 },
    bob: -Math.abs(Math.sin(ph)) * 7 * amp,
    lean: Math.sin(ph) * 1.4 * amp,
  };
};

const Tube: React.FC<{ p: V[]; w: number; c: string }> = ({ p, w, c }) => (
  <g fill="none" strokeLinejoin="round" strokeLinecap="round">
    <polyline points={pts(...p)} stroke={INK} strokeWidth={w + 9} />
    <polyline points={pts(...p)} stroke={c} strokeWidth={w} />
  </g>
);

const Hand: React.FC<{ p: V; skin: string; big?: number; open?: boolean }> = ({ p, skin, big = 1, open = false }) => (
  <g transform={`translate(${p[0]} ${p[1]}) scale(${big})`} fill={skin} {...o} strokeWidth={4}>
    {open &&
      [-27, -9, 9, 27].map((a, i) => (
        <ellipse key={i} cx={0} cy={-27} rx={6.5} ry={15} transform={`rotate(${a})`} />
      ))}
    <circle r={18} />
    <ellipse cx={-17} cy={2} rx={6} ry={11} transform="rotate(-45 -17 2)" />
  </g>
);

const Eye: React.FC<{ cid: string; cx: number; cy: number; lid: number; lx: number; ly: number; skin: string }> = ({
  cid, cx, cy, lid, lx, ly, skin,
}) => {
  const lidY = cy - 17 + 34 * lid;
  return (
    <g>
      <clipPath id={cid}>
        <ellipse cx={cx} cy={cy} rx={14} ry={16} />
      </clipPath>
      <ellipse cx={cx} cy={cy} rx={14} ry={16} fill="#fff" />
      <g clipPath={`url(#${cid})`}>
        <circle cx={cx + lx * 5} cy={cy + ly * 5} r={9} fill="#4a3226" />
        <circle cx={cx + lx * 6} cy={cy + ly * 6} r={4.6} fill={INK} />
        <circle cx={cx + lx * 5 - 3} cy={cy + ly * 5 - 3} r={2.4} fill="#fff" />
        {/* párpado opaco del color de la piel, recortado por el clipPath del ojo */}
        <rect x={cx - 16} y={cy - 18} width={32} height={Math.max(0, lidY - (cy - 18))} fill={skin} />
      </g>
      <ellipse cx={cx} cy={cy} rx={14} ry={16} fill="none" stroke={INK} strokeWidth={3.5} opacity={1 - clamp(lid * 1.3, 0, 1)} />
      <path
        d={`M ${cx - 14} ${lidY - 1} Q ${cx} ${lidY + 5} ${cx + 14} ${lidY - 1}`}
        fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" opacity={clamp(lid * 1.5, 0, 1)}
      />
    </g>
  );
};

const Mouth: React.FC<{ m: NonNullable<Pose["mouth"]> }> = ({ m }) => {
  const st = { fill: "none", stroke: INK, strokeWidth: 4, strokeLinecap: "round" as const };
  switch (m) {
    case "smile": return <path d="M -17 -242 Q 0 -224 17 -242" {...st} />;
    case "grin": return <path d="M -21 -243 Q 0 -214 21 -243 Z" fill="#fff" stroke={INK} strokeWidth={4} strokeLinejoin="round" />;
    case "open": return <ellipse cx={0} cy={-238} rx={11} ry={14} fill="#6b1f2a" stroke={INK} strokeWidth={4} />;
    case "whistle": return <circle cx={2} cy={-240} r={6} fill="#6b1f2a" stroke={INK} strokeWidth={3.5} />;
    case "smirk": return <path d="M -13 -239 Q 4 -234 19 -247" {...st} />;
    case "worry": return <path d="M -15 -234 Q 0 -246 15 -234" {...st} />;
    default: return <path d="M -13 -238 L 13 -238" {...st} />;
  }
};

const Character: React.FC<{
  id: string; x: number; y: number; s?: number; t: number; pose?: Pose; look?: Look; op?: number;
}> = ({ id, x, y, s = 1.5, t, pose = {}, look = PROTAG, op = 1 }) => {
  const P = pose;
  const k = look;
  const lean = P.lean ?? 0;
  const aL = solveArm(1, P.armL, lean);
  const aR = solveArm(-1, P.armR, lean);
  const lL = solveLeg(1, P.legL, P.seated);
  const lR = solveLeg(-1, P.legR, P.seated);
  const breathe = Math.sin(t / 21) * 1.8 + (P.bob ?? 0); // respiración continua
  const bp = (t + id.length * 41) % 190;
  const blink = bp < 9 ? Math.sin((bp / 9) * Math.PI) : 0;
  const lid = clamp(Math.max(P.lid ?? 0, blink), 0, 1);
  const lx = P.lookX ?? 0;
  const ly = P.lookY ?? 0;
  const brow = P.brow ?? 0;
  const sleeve = k.jacket ?? k.hoodie;
  const hideL = P.pockets === "L" || P.pockets === "both";
  const hideR = P.pockets === "R" || P.pockets === "both";
  const floorY = Math.max(lL.ankle[1], lR.ankle[1]) + 28;
  const pocket = (
    <path d="M -40 -66 L 40 -66 L 50 -22 L -50 -22 Z" fill={k.hoodie2} {...o} strokeWidth={4} />
  );
  return (
    <g transform={`translate(${x} ${y + breathe * 0.4}) scale(${s})`} opacity={op}>
      <ellipse cx={0} cy={floorY} rx={118} ry={18} fill="rgba(0,0,0,0.28)" />
      {/* piernas */}
      {[lL, lR].map((g, i) => (
        <g key={i}>
          <Tube p={[g.hip, g.knee, g.ankle]} w={40} c={k.pants} />
          <ellipse cx={g.ankle[0]} cy={g.ankle[1] + 12} rx={P.seated ? 28 : 31} ry={17} fill={k.shoes} {...o} strokeWidth={4} />
          <path d={`M ${g.ankle[0] - 26} ${g.ankle[1] + 20} Q ${g.ankle[0]} ${g.ankle[1] + 27} ${g.ankle[0] + 26} ${g.ankle[1] + 20}`} fill="none" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      {/* pelvis continua (sin corte en la cintura) */}
      <path d="M -64 -10 L 64 -10 Q 70 22 52 42 L 6 38 L -6 38 L -52 42 Q -70 22 -64 -10 Z" fill={k.pants} {...o} />
      <g transform={`rotate(${lean})`}>
        <rect x={-14} y={-234} width={28} height={44} fill={k.skin} {...o} strokeWidth={4} />
        {/* torso */}
        <path d="M -70 -190 Q -80 -140 -62 -70 Q -66 -22 -62 -2 L 62 -2 Q 66 -22 62 -70 Q 80 -140 70 -190 Q 0 -216 -70 -190 Z" fill={k.hoodie} {...o} />
        <path d="M -62 -20 L 62 -20 L 62 -2 L -62 -2 Z" fill={k.hoodie2} {...o} strokeWidth={3.5} />
        <path d="M -42 -200 Q 0 -168 42 -200 Q 40 -224 0 -226 Q -40 -224 -42 -200 Z" fill={k.hoodie2} {...o} />
        <path d="M -12 -178 L -15 -132 M 12 -178 L 15 -134" stroke="#fff" strokeWidth={4} strokeLinecap="round" />
        {!P.pockets && pocket}
        {k.jacket && (
          <g>
            <path d="M -70 -190 Q -80 -140 -62 -70 Q -66 -22 -62 -2 L -26 -2 L -20 -150 L -34 -196 Z" fill={k.jacket} {...o} />
            <path d="M 70 -190 Q 80 -140 62 -70 Q 66 -22 62 -2 L 26 -2 L 20 -150 L 34 -196 Z" fill={k.jacket} {...o} />
          </g>
        )}
        {/* cabeza */}
        <g transform={`translate(0 ${breathe * 0.6}) rotate(${P.head ?? 0} 0 -215)`}>
          <circle cx={-62} cy={-282} r={12} fill={k.skin} {...o} strokeWidth={4} />
          <circle cx={62} cy={-282} r={12} fill={k.skin} {...o} strokeWidth={4} />
          <ellipse cx={0} cy={-285} rx={62} ry={68} fill={k.skin} {...o} />
          <path d="M -66 -282 C -76 -352 -30 -378 8 -372 C 56 -370 82 -336 66 -282 C 58 -318 36 -334 10 -330 C -14 -326 -40 -318 -66 -282 Z" fill={k.hair} {...o} />
          {k.cap && (
            <g>
              <path d="M -67 -296 Q -67 -376 0 -378 Q 67 -376 67 -296 Z" fill={k.cap} {...o} />
              <path d="M -67 -300 Q 0 -284 84 -304 L 88 -294 Q 0 -272 -67 -290 Z" fill={k.cap} {...o} />
            </g>
          )}
          <ellipse cx={-38} cy={-258} rx={11} ry={6} fill="#ff8a7a" opacity={0.35} />
          <ellipse cx={38} cy={-258} rx={11} ry={6} fill="#ff8a7a" opacity={0.35} />
          <Eye cid={`${id}-eL`} cx={-26} cy={-282} lid={lid} lx={lx} ly={ly} skin={k.skin} />
          <Eye cid={`${id}-eR`} cx={26} cy={-282} lid={P.wink ? 1 : lid} lx={lx} ly={ly} skin={k.skin} />
          <path d={`M -40 -316 L -12 ${-316 - brow * 8}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d={`M 40 -316 L 12 ${-316 - brow * 8}`} stroke={INK} strokeWidth={6} strokeLinecap="round" />
          <path d="M -3 -270 Q 0 -262 6 -266" fill="none" stroke={INK} strokeWidth={3.5} strokeLinecap="round" />
          <Mouth m={P.mouth ?? "neutral"} />
        </g>
      </g>
      {/* brazos: manga + mano */}
      <Tube p={[aL.S, aL.E, aL.H]} w={34} c={sleeve} />
      <Tube p={[aR.S, aR.E, aR.H]} w={34} c={sleeve} />
      {!hideL && <Hand p={aL.H} skin={k.skin} big={1 + 0.9 * aL.reach} open={aL.open} />}
      {!hideR && <Hand p={aR.H} skin={k.skin} big={1 + 0.9 * aR.reach} open={aR.open} />}
      {P.pockets && <g transform={`rotate(${lean})`}>{pocket}</g>}
    </g>
  );
};

/* ════════════════════════ 3 · PROPS TANGIBLES ════════════════════════ */

const Box: React.FC<{ x: number; y: number; w: number; h: number; c?: string; label?: boolean; rot?: number }> = ({
  x, y, w, h, c = "#c98f55", label = true, rot = 0,
}) => {
  const dx = w * 0.3;
  const dy = w * 0.2;
  return (
    <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
      <polygon points={`${x + w},${y} ${x + w + dx},${y - dy} ${x + w + dx},${y + h - dy} ${x + w},${y + h}`} fill="#a9733f" {...o} strokeWidth={4} />
      <polygon points={`${x},${y} ${x + dx},${y - dy} ${x + w + dx},${y - dy} ${x + w},${y}`} fill="#dba670" {...o} strokeWidth={4} />
      <rect x={x} y={y} width={w} height={h} fill={c} {...o} strokeWidth={4} />
      {[0.14, 0.26, 0.74, 0.86].map((q, i) => (
        <line key={i} x1={x + w * q} y1={y + 4} x2={x + w * q} y2={y + h - 4} stroke="#7a4f27" strokeWidth={2} opacity={0.35} />
      ))}
      <polygon points={`${x + w * 0.42},${y} ${x + w * 0.42 + dx},${y - dy} ${x + w * 0.58 + dx},${y - dy} ${x + w * 0.58},${y}`} fill="#eadfbd" stroke={INK} strokeWidth={2.5} />
      <rect x={x + w * 0.42} y={y} width={w * 0.16} height={h} fill="#eadfbd" stroke={INK} strokeWidth={2.5} />
      {label && (
        <g>
          <rect x={x + w * 0.07} y={y + h * 0.5} width={w * 0.26} height={h * 0.36} fill="#fff" stroke={INK} strokeWidth={2.5} />
          <line x1={x + w * 0.1} y1={y + h * 0.62} x2={x + w * 0.3} y2={y + h * 0.62} stroke={INK} strokeWidth={2} />
          <line x1={x + w * 0.1} y1={y + h * 0.74} x2={x + w * 0.26} y2={y + h * 0.74} stroke={INK} strokeWidth={2} />
        </g>
      )}
    </g>
  );
};

const Book: React.FC<{ x: number; y: number; w: number; h: number; c: string; rot?: number }> = ({ x, y, w, h, c, rot = 0 }) => (
  <g transform={`rotate(${rot} ${x + w / 2} ${y + h / 2})`}>
    <rect x={x} y={y} width={w} height={h} rx={4} fill={c} {...o} strokeWidth={4} />
    <rect x={x + 12} y={y + 6} width={w - 18} height={h - 12} fill="#f8f1dc" stroke={INK} strokeWidth={2.5} />
    {[0.3, 0.5, 0.7].map((q, i) => (
      <line key={i} x1={x + 16} y1={y + h * q} x2={x + w - 10} y2={y + h * q} stroke="#c9bf9f" strokeWidth={1.5} />
    ))}
    <rect x={x} y={y} width={12} height={h} rx={4} fill="rgba(0,0,0,0.25)" />
  </g>
);

const Bill: React.FC<{ x: number; y: number; rot?: number; s?: number }> = ({ x, y, rot = 0, s = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <rect x={-34} y={-17} width={68} height={34} rx={3} fill="#8fdc9a" {...o} strokeWidth={3} />
    <circle r={9} fill="#5fb673" stroke={INK} strokeWidth={2.5} />
    <text textAnchor="middle" y={5} fontSize={14} fontWeight={800} fontFamily={FONT} fill={INK}>$</text>
  </g>
);

const Juice: React.FC<{ x: number; y: number; rot?: number }> = ({ x, y, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot})`}>
    <path d="M 8 -34 L 8 -50 L -24 -62" fill="none" stroke="#ff4d6d" strokeWidth={4} strokeLinecap="round" />
    <rect x={-20} y={-34} width={40} height={64} rx={4} fill="#ff9f1c" {...o} strokeWidth={4} />
    <rect x={-20} y={-34} width={40} height={14} fill="#ffd166" stroke={INK} strokeWidth={3} />
    <circle cx={0} cy={4} r={11} fill="#ffe29a" stroke={INK} strokeWidth={2.5} />
    <path d="M 0 4 L 0 -7 M 0 4 L 10 4 M 0 4 L -8 11" stroke="#ff9f1c" strokeWidth={2} />
  </g>
);

const Calc: React.FC<{ x: number; y: number; text: string }> = ({ x, y, text }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-34} y={-48} width={68} height={96} rx={8} fill="#3b3f4a" {...o} strokeWidth={4} />
    <rect x={-27} y={-41} width={54} height={22} rx={3} fill="#b9f2c4" stroke={INK} strokeWidth={2} />
    <text x={24} y={-24} textAnchor="end" fontSize={15} fontWeight={800} fontFamily={FONT} fill={INK}>{text}</text>
    {[0, 1, 2, 3].map((r) => [0, 1, 2].map((c) => (
      <rect key={`${r}${c}`} x={-26 + c * 19} y={-12 + r * 15} width={14} height={10} rx={2} fill={c === 2 ? "#ff9f1c" : "#d9dde6"} stroke={INK} strokeWidth={1.5} />
    )))}
  </g>
);

const Drop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <path transform={`translate(${x} ${y}) scale(${s})`} d="M 0 -14 Q 10 0 0 8 Q -10 0 0 -14 Z" fill="#7fd4ff" stroke={INK} strokeWidth={2.5} />
);

const Note: React.FC<{ x: number; y: number; r?: number; op?: number }> = ({ x, y, r = 0, op = 1 }) => (
  <g transform={`translate(${x} ${y}) rotate(${r})`} opacity={op} fill={INK}>
    <ellipse rx={9} ry={6.5} transform="rotate(-20)" />
    <path d="M 7 -3 L 7 -34 Q 20 -30 18 -18" fill="none" stroke={INK} strokeWidth={4} strokeLinecap="round" />
  </g>
);

const Suitcase: React.FC<{ x: number; y: number; w: number; c: string }> = ({ x, y, w, c }) => (
  <g>
    <polygon points={`${x},${y} ${x + w},${y} ${x + w - 26},${y - 110} ${x + 26},${y - 110}`} fill={c} {...o} />
    <rect x={x} y={y} width={w} height={64} rx={8} fill={c} {...o} />
    <rect x={x + 10} y={y + 8} width={w - 20} height={34} rx={4} fill="#2b2430" />
    {["#ff6b6b", "#ffd166", "#4cc9f0", "#9b5de5"].map((cc, i) => (
      <rect key={i} x={x + 16 + i * ((w - 50) / 4)} y={y - 10 - (i % 2) * 8} width={(w - 50) / 4 + 6} height={28} rx={6} fill={cc} stroke={INK} strokeWidth={3} />
    ))}
    <rect x={x + w / 2 - 22} y={y + 44} width={44} height={10} rx={4} fill="#d9dde6" stroke={INK} strokeWidth={3} />
  </g>
);

const Pop: React.FC<{ k: number; ax: number; ay: number; children: React.ReactNode }> = ({ k, ax, ay, children }) =>
  k <= 0.001 ? null : (
    <g transform={`translate(${ax} ${ay}) scale(${k}) translate(${-ax} ${-ay})`} opacity={clamp(k * 1.6, 0, 1)}>
      {children}
    </g>
  );

const Cloud: React.FC<{ x: number; y: number; s?: number; c?: string }> = ({ x, y, s = 1, c = "#fff" }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill={c}>
    <ellipse cx={0} cy={0} rx={90} ry={34} />
    <ellipse cx={-50} cy={-18} rx={50} ry={34} />
    <ellipse cx={20} cy={-30} rx={58} ry={40} />
    <ellipse cx={80} cy={-6} rx={46} ry={28} />
  </g>
);

const Plane: React.FC<{ x: number; y: number; s: number; rot?: number }> = ({ x, y, s, rot = 0 }) => (
  <g transform={`translate(${x} ${y}) rotate(${rot}) scale(${s})`}>
    <path d="M -60 -6 L -150 -64 L -122 -64 L -30 -10 Z" fill="#d7dde6" {...o} />
    <path d="M -190 -18 Q -190 -34 -150 -34 L 150 -34 Q 230 -30 240 0 Q 230 24 150 26 L -150 26 Q -190 26 -190 -18 Z" fill="#f5f7fb" {...o} />
    {Array.from({ length: 12 }).map((_, i) => (
      <ellipse key={i} cx={-120 + i * 22} cy={-12} rx={6} ry={8} fill="#6fa8dc" stroke={INK} strokeWidth={2} />
    ))}
    <path d="M 196 -14 Q 224 -14 232 -2 Q 214 -4 196 -2 Z" fill="#6fa8dc" stroke={INK} strokeWidth={2.5} />
    <path d="M 0 20 L -90 100 L -54 100 L 70 22 Z" fill="#cfd6e1" {...o} />
    <ellipse cx={-28} cy={66} rx={34} ry={14} fill="#aeb7c4" {...o} strokeWidth={4} />
    <path d="M -170 -30 L -214 -96 L -176 -96 L -116 -32 Z" fill="#e94f4f" {...o} />
  </g>
);

const Flash: React.FC<{ x: number; y: number; k: number; r?: number; c?: string; inward?: boolean }> = ({
  x, y, k, r = 90, c = "#9ff3ff", inward = false,
}) => {
  if (k <= 0 || k >= 1) return null;
  const rr = inward ? r * (1.2 - 0.95 * k) : r * (0.25 + 0.9 * k);
  const op = inward ? Math.sin(Math.PI * k) : 1 - k;
  return (
    <g transform={`translate(${x} ${y})`} style={{ mixBlendMode: "screen" }}>
      <circle r={rr} fill="none" stroke={c} strokeWidth={10 * op + 1} opacity={op} />
      <circle r={rr * 0.5} fill={c} opacity={0.5 * op} />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = i * (Math.PI / 4);
        const r0 = rr * 1.15;
        const r1 = rr * 0.7;
        return <line key={i} x1={Math.cos(a) * r0} y1={Math.sin(a) * r0} x2={Math.cos(a) * r1} y2={Math.sin(a) * r1} stroke={c} strokeWidth={4} opacity={op} strokeLinecap="round" />;
      })}
    </g>
  );
};

/** Contracción óptica: el objeto real se encoge hacia el destino (sin vóxeles). */
const suckT = (p: number, cx: number, cy: number, tx: number, ty: number) =>
  `translate(${cx + (tx - cx) * p} ${cy + (ty - cy) * p}) scale(${1 - 0.94 * p}) rotate(${p * 14}) translate(${-cx} ${-cy})`;
const suckOp = (p: number) => 1 - clamp((p - 0.85) / 0.15, 0, 1);

/* ════════════════════════ 4 · INTERFAZ FLOTANTE (INVENTARIO 9x4) ════════════════════════ */

type IconT = "bed" | "book" | "box" | "console" | "bill";
type Slot = { t: IconT; n: number } | null;
const COLS = 9, ROWS = 4, SLOT = 58, GAP = 6;
const GRID_W = COLS * SLOT + (COLS - 1) * GAP;
const GRID_H = ROWS * SLOT + (ROWS - 1) * GAP;
const GX0 = -GRID_W / 2;
const GY0 = -112;
const UI_ROT = -3;
const emptySlots = (): Slot[] => Array.from({ length: 36 }, () => null);
const slotLocal = (i: number): V => [GX0 + (i % COLS) * (SLOT + GAP) + SLOT / 2, GY0 + Math.floor(i / COLS) * (SLOT + GAP) + SLOT / 2];
const slotWorld = (ui: { cx: number; cy: number; s: number }, i: number): V => {
  const [lx, ly] = slotLocal(i);
  const a = rad(UI_ROT);
  return [ui.cx + ui.s * (lx * Math.cos(a) - ly * Math.sin(a)), ui.cy + ui.s * (lx * Math.sin(a) + ly * Math.cos(a))];
};

const Icon: React.FC<{ t: IconT }> = ({ t }) => {
  const st = { stroke: "#0b2230", strokeWidth: 2, strokeLinejoin: "round" as const };
  switch (t) {
    case "bed":
      return (
        <g {...st}>
          <rect x={-18} y={-12} width={4} height={26} fill="#9aa7b8" />
          <rect x={-18} y={3} width={36} height={7} fill="#ffb86b" />
          <rect x={-14} y={-5} width={13} height={8} rx={3} fill="#fff" />
          <rect x={0} y={-4} width={18} height={8} fill="#6ec1ff" />
          <rect x={14} y={-8} width={4} height={22} fill="#9aa7b8" />
        </g>
      );
    case "book":
      return (
        <g {...st}>
          <rect x={-13} y={-17} width={26} height={34} rx={3} fill="#ff6b6b" />
          <rect x={-13} y={-17} width={6} height={34} fill="#c24a4a" />
          <rect x={-2} y={-10} width={10} height={4} fill="#ffe29a" />
        </g>
      );
    case "box":
      return (
        <g {...st}>
          <polygon points="-16,-6 -8,-14 18,-14 10,-6" fill="#e6b887" />
          <rect x={-16} y={-6} width={26} height={22} fill="#d9a066" />
          <polygon points="10,-6 18,-14 18,10 10,16" fill="#b9824a" />
          <rect x={-8} y={-6} width={6} height={22} fill="#f1e5c0" />
        </g>
      );
    case "console":
      return (
        <g {...st}>
          <rect x={-17} y={-13} width={34} height={26} rx={4} fill="#f3f3f3" />
          <rect x={-17} y={-13} width={34} height={8} rx={3} fill="#3b6cff" />
          <circle cx={-6} cy={4} r={4} fill="#ff4d6d" />
          <rect x={4} y={1} width={9} height={5} rx={2} fill="#9aa7b8" />
        </g>
      );
    default:
      return (
        <g {...st}>
          <rect x={-17} y={-10} width={34} height={20} rx={2} fill="#7bd88f" />
          <circle r={5} fill="#2d8f4b" />
        </g>
      );
  }
};

const InvUI: React.FC<{
  cx: number; cy: number; s?: number; k?: number; t: number; slots: Slot[];
  title?: string; grid?: number; stack?: number; glowAll?: number;
}> = ({ cx, cy, s = 0.85, k = 1, t, slots, title = "INVENTARIO", grid = 0, stack = 0, glowAll = 0 }) => {
  if (k <= 0) return null;
  const fl = Math.sin(t / 26) * 6;
  const pulse = 1 + 0.05 * Math.sin(t / 3.2);
  const filled = slots.filter(Boolean).length;
  return (
    <g
      transform={`translate(${cx} ${cy + fl}) rotate(${UI_ROT}) scale(${s * k})`}
      opacity={clamp(k * 1.4, 0, 1)}
      style={{ filter: "drop-shadow(0 0 14px rgba(60,230,255,0.75))" }}
    >
      <rect x={-307} y={-174} width={614} height={348} rx={20} fill="rgba(8,34,52,0.74)" stroke="#5ef2ff" strokeWidth={4} />
      <rect x={-295} y={-162} width={590} height={34} rx={8} fill="rgba(94,242,255,0.14)" />
      <text x={-282} y={-138} fontFamily={FONT} fontWeight={800} fontSize={20} fill="#baf8ff" letterSpacing={3}>{title}</text>
      <text x={282} y={-138} textAnchor="end" fontFamily={FONT} fontWeight={800} fontSize={20} fill="#baf8ff">{filled}/36</text>
      {slots.map((sl, i) => {
        const [lx, ly] = slotLocal(i);
        return (
          <g key={i} transform={`translate(${lx} ${ly})`}>
            <rect x={-29} y={-29} width={58} height={58} rx={8} fill={sl ? "rgba(94,242,255,0.22)" : "rgba(94,242,255,0.07)"} stroke="#5ef2ff" strokeOpacity={sl ? 0.95 : 0.4} strokeWidth={2.5} />
            {sl && (
              <g>
                <Icon t={sl.t} />
                {sl.n > 1 && (
                  <text x={26} y={25} textAnchor="end" fontSize={15} fontWeight={800} fontFamily={FONT} fill="#fff" stroke="#06202e" strokeWidth={4} paintOrder="stroke">x{sl.n}</text>
                )}
                {glowAll > 0 && <rect x={-29} y={-29} width={58} height={58} rx={8} fill="#fff" opacity={glowAll * 0.2 * (0.6 + 0.4 * Math.sin(t / 5 + i))} />}
              </g>
            )}
          </g>
        );
      })}
      <rect x={-300} y={-174 + ((t * 2) % 348)} width={600} height={5} fill="#baf8ff" opacity={0.1} />
      {grid > 0 && (
        <g opacity={grid}>
          <rect x={GX0 - 8} y={GY0 - 8} width={GRID_W + 16} height={GRID_H + 16} rx={12} fill="none" stroke="#ffe66d" strokeWidth={5} strokeDasharray="14 8" transform={`scale(${pulse})`} />
          <g transform={`translate(0 -214) scale(${pulse})`}>
            <rect x={-170} y={-34} width={340} height={64} rx={32} fill="#ffe66d" {...o} strokeWidth={4} />
            <text textAnchor="middle" y={12} fontFamily={FONT} fontWeight={900} fontSize={36} fill={INK}>36 CASILLAS</text>
          </g>
        </g>
      )}
      {stack > 0 && (
        <g opacity={stack}>
          <g transform={`translate(${slotLocal(0)[0]} ${slotLocal(0)[1]}) scale(${pulse})`}>
            <rect x={-34} y={-34} width={68} height={68} rx={10} fill="none" stroke="#ffe66d" strokeWidth={5} />
          </g>
          <g transform={`translate(-180 -214) scale(${pulse})`}>
            <rect x={-80} y={-36} width={160} height={68} rx={34} fill="#ffe66d" {...o} strokeWidth={4} />
            <text textAnchor="middle" y={14} fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>x64</text>
          </g>
        </g>
      )}
    </g>
  );
};

/* ════════════════════════ 5 · FONDOS MULTICAPA ════════════════════════ */

const HERO = { x: 380, y: 1130, s: 1.5 };
const HERO_UI = { cx: 800, cy: 740, s: 0.85 };
const HERO_POSE: Pose = {
  seated: true,
  armR: { out: 62, flex: -118, reach: 0.55, open: true },
  armL: { out: 14, flex: 10 },
  lookX: 0.8, lookY: -0.2, mouth: "smirk", brow: 0.15, head: -3,
};

const Dorm: React.FC<{ glow?: boolean }> = ({ glow = false }) => (
  <g>
    <rect width={W} height={1300} fill={glow ? "#2a2046" : "url(#dormWall)"} />
    {Array.from({ length: 14 }).map((_, i) => (
      <rect key={i} x={i * 80} y={0} width={36} height={1300} fill="#fff" opacity={0.035} />
    ))}
    <rect x={70} y={230} width={270} height={400} fill="#0d1226" {...o} strokeWidth={8} />
    <rect x={80} y={240} width={250} height={380} fill={glow ? "url(#night)" : "url(#dawn)"} />
    {glow
      ? Array.from({ length: 14 }).map((_, i) => (
          <rect key={i} x={92 + (i % 7) * 33} y={470 + ((i * 37) % 120)} width={16} height={26 + ((i * 13) % 50)} fill="#ffd27a" opacity={0.85} />
        ))
      : <circle cx={250} cy={560} r={50} fill="#ffb27a" opacity={0.9} />}
    <rect x={198} y={240} width={8} height={380} fill="#0d1226" />
    <rect x={80} y={420} width={250} height={8} fill="#0d1226" />
    <rect x={56} y={624} width={298} height={22} rx={6} fill="#e6dfd0" {...o} />
    {!glow && (
      <g>
        <rect x={720} y={300} width={190} height={260} fill="#e9e2d0" {...o} />
        <circle cx={815} cy={400} r={46} fill="#e4572e" stroke={INK} strokeWidth={4} />
        <path d="M 735 540 L 790 460 L 830 510 L 870 450 L 898 540 Z" fill="#2d3a6b" stroke={INK} strokeWidth={4} />
        <rect x={640} y={640} width={380} height={14} fill="#8a6a4d" {...o} strokeWidth={4} />
        {["#c0392b", "#2e86c1", "#d68910", "#27ae60"].map((c, i) => (
          <rect key={i} x={660 + i * 30} y={590} width={24} height={50} fill={c} stroke={INK} strokeWidth={3} />
        ))}
        <rect x={720} y={1000} width={310} height={22} fill="#8a6a4d" {...o} />
        <rect x={740} y={1022} width={20} height={280} fill="#6b4f38" {...o} strokeWidth={4} />
        <rect x={1000} y={1022} width={20} height={280} fill="#6b4f38" {...o} strokeWidth={4} />
        <path d="M 900 1000 L 930 900 L 960 880" fill="none" stroke="#555" strokeWidth={8} strokeLinecap="round" />
        <path d="M 940 870 L 990 870 L 975 905 L 955 905 Z" fill="#ffd27a" {...o} strokeWidth={4} />
      </g>
    )}
    <rect y={1300} width={W} height={620} fill={glow ? "#4a3a52" : "#6a4a36"} />
    {[1345, 1410, 1495, 1600, 1740].map((y, i) => (
      <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#00000033" strokeWidth={3} />
    ))}
    {Array.from({ length: 10 }).map((_, i) => (
      <line key={i} x1={i * 130 + 40} y1={1300} x2={i * 160 - 120} y2={1920} stroke="#00000022" strokeWidth={3} />
    ))}
    <rect y={1286} width={W} height={18} fill="#d8d2c4" {...o} strokeWidth={4} />
  </g>
);

const Bed: React.FC = () => (
  <g>
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={72 + i * 18} y={910} width={7} height={330} fill="#aab4c2" stroke={INK} strokeWidth={3} />
    ))}
    <rect x={44} y={870} width={20} height={560} rx={8} fill="#8e99a8" {...o} />
    <rect x={44} y={870} width={150} height={20} rx={8} fill="#8e99a8" {...o} />
    <rect x={160} y={900} width={16} height={530} rx={6} fill="#8e99a8" {...o} />
    <rect x={970} y={1010} width={20} height={420} rx={8} fill="#8e99a8" {...o} />
    <rect x={90} y={1230} width={900} height={22} rx={6} fill="#8e99a8" {...o} />
    <rect x={90} y={1120} width={880} height={112} rx={20} fill="#5b7fbf" {...o} />
    <rect x={90} y={1120} width={880} height={30} rx={14} fill="#7fa0dd" stroke={INK} strokeWidth={4} />
    <rect x={120} y={1070} width={190} height={66} rx={26} fill="#f4f1ea" {...o} />
    <path d="M 640 1120 Q 760 1040 900 1120 Z" fill="#46689f" {...o} />
    {[70, 200, 940].map((x, i) => (
      <circle key={i} cx={x + 6} cy={1442} r={13} fill="#333" stroke={INK} strokeWidth={4} />
    ))}
  </g>
);

const Hall: React.FC = () => (
  <g>
    <rect width={W} height={H} fill="#2b3547" />
    <rect width={W} height={190} fill="#1a2030" />
    {[140, 540, 940].map((x, i) => (
      <g key={i}>
        <rect x={x - 130} y={110} width={260} height={30} rx={6} fill="#eaf6ff" {...o} />
        <polygon points={`${x - 130},140 ${x + 130},140 ${x + 220},330 ${x - 220},330`} fill="#eaf6ff" opacity={0.07} />
      </g>
    ))}
    <rect y={190} width={W} height={1060} fill="#3a4a5e" />
    {[90, 450, 810].map((x, i) => (
      <g key={i}>
        <rect x={x} y={420} width={180} height={380} fill="#6b4f38" {...o} />
        <rect x={x + 40} y={460} width={100} height={110} fill="#a9d6e5" stroke={INK} strokeWidth={4} />
        <rect x={x + 60} y={400} width={60} height={20} fill="#e6dfd0" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <rect x={300} y={270} width={480} height={110} fill="#d8c79a" {...o} />
    {[0, 1, 2, 3, 4].map((i) => (
      <rect key={i} x={318 + i * 92} y={288} width={72} height={76} fill={["#fff", "#ffd166", "#9ad1ff", "#ff9b9b", "#fff"][i]} stroke={INK} strokeWidth={3} transform={`rotate(${(i % 3) - 1} ${354 + i * 92} 326)`} />
    ))}
    {Array.from({ length: 7 }).map((_, i) => (
      <g key={i}>
        <rect x={i * 155 - 10} y={800} width={150} height={450} fill={i % 2 ? "#2e7d8c" : "#3a93a3"} {...o} />
        {[0, 1, 2, 3].map((r) => <rect key={r} x={i * 155 + 20} y={830 + r * 12} width={90} height={5} fill="#16505b" />)}
        <rect x={i * 155 + 95} y={1010} width={10} height={44} rx={4} fill="#dfe6ee" stroke={INK} strokeWidth={3} />
      </g>
    ))}
    <rect y={1250} width={W} height={670} fill="#c9c1b0" />
    {[1300, 1370, 1460, 1580, 1730].map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#00000030" strokeWidth={3} />)}
    {Array.from({ length: 12 }).map((_, i) => <line key={i} x1={540 + (i - 6) * 70} y1={1250} x2={540 + (i - 6) * 190} y2={1920} stroke="#00000022" strokeWidth={3} />)}
  </g>
);

/* ════════════════════════ 6 · ESCENAS ════════════════════════ */

/* ── Escena 0 · Despertar & desaparición de la cama ── */
const Scene0: React.FC<SP> = ({ L, f }) => {
  const uiK = 0.85 + 0.15 * prog(L, 6, 22, easeBack);
  const touchP = prog(L, 52, 75);
  const pokeP = prog(L, 128, 156);
  const armTouch: Arm = { out: 25, flex: -2 };
  const armPoke: Arm = { out: 100, flex: -60, reach: 0.2 };
  const armR = lerpArm(lerpArm(HERO_POSE.armR!, armTouch, touchP), armPoke, pokeP);
  const lookX = L < 50 ? 0.8 : L < 76 ? lerp(0.8, 0.2, prog(L, 50, 76)) : 0.8;
  const lookY = L < 50 ? -0.2 : L < 118 ? 0.7 : 0.1;
  const mouth = L < 52 ? "smirk" : L < 120 ? "open" : L < 170 ? "worry" : "grin";
  const suck = prog(L, 82, 114, easeIn);
  const fall = prog(L, 112, 120, Easing.in(Easing.quad));
  const bounce = L > 120 ? Math.sin((L - 120) * 0.5) * Math.exp(-(L - 120) / 12) * 10 : 0;
  const shake = L > 120 && L < 142 ? Math.sin(L * 2.7) * 12 * (1 - (L - 120) / 22) : 0;
  const tgt = slotWorld(HERO_UI, 0);
  const slots = emptySlots();
  if (L >= 112) slots[0] = { t: "bed", n: 1 };
  const hand = handW(HERO.x, HERO.y, HERO.s, -1, armR);
  const dust = prog(L, 120, 156);
  return (
    <g transform={`translate(${shake} ${shake * 0.6})`}>
      <Dorm />
      {suck < 1 && (
        <g transform={suckT(suck, 520, 1200, tgt[0], tgt[1])} opacity={suckOp(suck)}>
          <Bed />
        </g>
      )}
      <Flash x={520} y={1200} k={prog(L, 80, 112)} r={380} inward c="#c8fbff" />
      {L > 70 && L < 84 && (
        <g stroke="#fff" strokeWidth={4} strokeLinecap="round" opacity={1 - prog(L, 72, 84)}>
          <line x1={hand[0] + 20} y1={hand[1] - 10} x2={hand[0] + 50} y2={hand[1] - 34} />
          <line x1={hand[0] + 26} y1={hand[1] + 6} x2={hand[0] + 62} y2={hand[1] + 2} />
          <line x1={hand[0] + 14} y1={hand[1] - 22} x2={hand[0] + 30} y2={hand[1] - 56} />
        </g>
      )}
      <Character id="hero" x={HERO.x} y={HERO.y + 150 * fall + bounce} s={HERO.s} t={f}
        pose={{ ...HERO_POSE, armR, lookX, lookY, mouth, brow: L < 52 ? 0.15 : 0.8 }} />
      {dust > 0 && dust < 1 && [-1, 1].map((d) => (
        <ellipse key={d} cx={HERO.x + d * (60 + 200 * dust)} cy={1570 - 20 * dust} rx={50 + 60 * dust} ry={22 + 20 * dust} fill="#d9cdbb" opacity={0.7 * (1 - dust)} />
      ))}
      <InvUI cx={HERO_UI.cx} cy={HERO_UI.cy} s={HERO_UI.s} k={uiK} t={f} slots={slots} />
      <Flash x={tgt[0]} y={tgt[1]} k={prog(L, 112, 130)} r={90} />
    </g>
  );
};

/* ── Escena 1 · Billetera vacía y reglas ── */
const Wallet: React.FC<{ x: number; y: number; open: number }> = ({ x, y, open }) => (
  <g transform={`translate(${x} ${y})`}>
    <rect x={-70} y={-48} width={140} height={96} rx={8} fill="#3c2a22" {...o} />
    <rect x={-62} y={-40} width={58} height={80} rx={5} fill="#1d1411" />
    <rect x={4} y={-40} width={58} height={80} rx={5} fill="#1d1411" />
    <path d="M -62 -40 L -22 2 M -62 -20 L -34 -6 M -42 -40 L -22 2" stroke="#cbd5e1" strokeWidth={1.8} opacity={0.7} />
    <circle cx={34} cy={30} r={6} fill="#c9a24a" stroke={INK} strokeWidth={2} />
    <g transform={`translate(-70 0) scale(${1 - 2 * open} 1)`}>
      <rect x={0} y={-48} width={140} height={96} rx={8} fill="#7a5238" {...o} />
      <path d="M 8 -38 L 132 -38 M 8 38 L 132 38" stroke="#c9a47a" strokeWidth={2.5} strokeDasharray="6 5" />
      <rect x={40} y={-14} width={46} height={30} rx={5} fill="#5d3e29" stroke={INK} strokeWidth={3} />
      <path d="M 100 -30 L 118 -10 M 20 20 L 36 36" stroke="#4a2f1e" strokeWidth={4} />
    </g>
  </g>
);

const Scene1: React.FC<SP> = ({ L, fps, f }) => {
  const sp = mkSp(fps, L);
  const open = prog(L, 5, 24, easeBack);
  const uiK = prog(L, 8, 30, easeBack);
  const x = 420 + 10 * Math.sin(L / 40);
  const Y = 1090;
  const S = 1.45;
  const armL: Arm = { aim: [-58, -92] };
  const rest: Arm = { out: 12, flex: 14 };
  const armR = lerpArm(rest, { out: 85, flex: -35, open: true }, prog(L, 94, 114));
  const slots = emptySlots();
  if (L >= 90) slots[0] = { t: "book", n: 64 };
  const gridC = prog(L, 36, 46) * (1 - prog(L, 86, 92));
  const stackC = prog(L, 90, 100) * (1 - prog(L, 168, 176));
  const wallet = handW(x, Y, S, 1, armL);
  const mothP = prog(L, 14, 70, Easing.linear);
  const bg1 = ((f * 1.1) % 1500) - 200;
  const bg2 = 1300 - ((f * 0.8) % 1500);
  const pop = sp(4);
  return (
    <g>
      <Hall />
      <Character id="bgA" x={bg1} y={1180} s={0.85} t={f} look={BG_A} pose={{ ...walk(f, 0.8), mouth: "neutral" }} op={0.9} />
      <Character id="bgB" x={bg2} y={1190} s={0.85} t={f} look={BG_B} pose={{ ...walk(f + 20, 0.8), mouth: "smile" }} op={0.9} />
      <Character id="hero" x={x} y={Y} s={S} t={f}
        pose={{
          armL, armR, mouth: L < 90 ? "worry" : "smile", brow: L < 90 ? 0.9 : 0.1,
          lookX: L < 90 ? -0.2 : 0.8, lookY: L < 90 ? 0.7 : 0, head: L < 90 ? 6 : -3,
          legL: { out: 6 }, legR: { out: 6 },
        }} />
      <g transform={`rotate(${-6 + 3 * Math.sin(L / 18)} ${wallet[0]} ${wallet[1]})`}>
        <Wallet x={wallet[0]} y={wallet[1] - 36} open={open} />
      </g>
      {open > 0.4 && (
        <g transform={`translate(${wallet[0] + 20 + 160 * mothP} ${wallet[1] - 90 - 120 * mothP + 14 * Math.sin(L / 3)})`} opacity={1 - clamp((mothP - 0.8) * 5, 0, 1)}>
          <ellipse cx={-10} cy={0} rx={14} ry={Math.max(2, 8 * Math.abs(Math.sin(L / 1.5)))} fill="#d9d2c4" stroke={INK} strokeWidth={2.5} />
          <ellipse cx={10} cy={0} rx={14} ry={Math.max(2, 8 * Math.abs(Math.sin(L / 1.5)))} fill="#d9d2c4" stroke={INK} strokeWidth={2.5} />
          <ellipse cx={0} cy={0} rx={3} ry={9} fill={INK} />
        </g>
      )}
      <g transform={`scale(${0.2 + 0.8 * pop})`} style={{ transformOrigin: "800px 640px" }} opacity={pop > 0 ? 1 : 0}>
        <InvUI cx={800} cy={640} s={0.8} k={uiK} t={f} slots={slots} grid={gridC} stack={stackC} />
      </g>
    </g>
  );
};

/* ── Escena 2 · Cero carga biológica ── */
const BOOK_COLORS = ["#c0392b", "#2e86c1", "#27ae60", "#8e44ad", "#d68910", "#16a085", "#2c3e50", "#e67e22"];

const Scene2: React.FC<SP> = ({ L, f }) => {
  const sc = Math.max(0, L - 95) * 3.2;
  const heroX = L < 42 ? lerp(120, 470, prog(L, 0, 42, Easing.linear)) : 470;
  const heroWalking = L < 42 || L >= 95;
  const delX = lerp(1320, 930, prog(L, 0, 48, Easing.out(Easing.quad)));
  const delWalking = L < 48 || L >= 95;
  const UI = { cx: 800, cy: 500, s: 0.8 };
  const tgt = slotWorld(UI, 0);
  const touch = prog(L, 28, 40);
  const books = Array.from({ length: 16 }).map((_, i) => ({
    w: 150 + ((i * 37) % 50), h: 34 + ((i * 13) % 12), rot: (((i * 53) % 7) - 3) * 0.9, dx: ((i * 29) % 24) - 12, c: BOOK_COLORS[i % 8],
  }));
  let yy = 1400;
  const placed = books.map((b) => { yy -= b.h; return { ...b, y: yy }; });
  const slots = emptySlots();
  if (L >= 70) slots[0] = { t: "book", n: 64 };
  const armR: Arm = L < 28 ? { out: 12 + 10 * Math.sin(L * 0.3), flex: 14 } : L < 95
    ? lerpArm({ out: 12, flex: 14 }, { out: 62, flex: -40 }, touch)
    : { out: 12, flex: 14 };
  const hero: Pose = heroWalking ? { ...walk(f), armR: L < 95 ? armR : walk(f).armR, mouth: L >= 95 ? "whistle" : "smile" }
    : { armR, mouth: "open", brow: 0.5, lookX: 0.7, legL: { out: 6 }, legR: { out: 6 } };
  const del: Pose = {
    ...(delWalking ? walk(f * 0.7, 0.7) : { legL: { out: 8 }, legR: { out: 8 } }),
    lean: -9, mouth: "worry", brow: 0.9, lookX: -0.6,
    armL: { aim: [-70, -118] }, armR: { aim: [70, -118] },
  };
  const off = (r: number, period: number) => -((sc * r) % period);
  return (
    <g>
      <rect width={W} height={H} fill="url(#sky)" />
      <g transform={`translate(${off(0.25, 1200)} 0)`}>
        {[0, 1200].map((ox) => (
          <g key={ox} transform={`translate(${ox} 0)`}>
            <rect x={80} y={430} width={760} height={820} fill="#d9c8a8" {...o} />
            <rect x={380} y={250} width={160} height={200} fill="#c5b08a" {...o} />
            <circle cx={460} cy={330} r={46} fill="#fff" {...o} />
            <path d="M 460 330 L 460 300 M 460 330 L 480 340" stroke={INK} strokeWidth={4} />
            {Array.from({ length: 12 }).map((_, i) => (
              <rect key={i} x={130 + (i % 4) * 170} y={500 + Math.floor(i / 4) * 230} width={90} height={150} fill="#7fb4d6" stroke={INK} strokeWidth={4} />
            ))}
          </g>
        ))}
      </g>
      <g transform={`translate(${off(0.6, 800)} 0)`}>
        {[0, 800, 1600].map((ox) => (
          <g key={ox} transform={`translate(${ox} 0)`}>
            <rect x={140} y={1000} width={30} height={260} fill="#7a5238" {...o} />
            <circle cx={155} cy={940} r={120} fill="#5da35a" {...o} />
            <circle cx={90} cy={1000} r={80} fill="#4b8f49" stroke={INK} strokeWidth={4} />
          </g>
        ))}
      </g>
      <rect y={1250} width={W} height={670} fill="#b9b3a4" />
      <rect y={1250} width={W} height={24} fill="#8fbf6f" stroke={INK} strokeWidth={4} />
      {Array.from({ length: 8 }).map((_, i) => (
        <line key={i} x1={((i * 220 + off(1, 220)) % 1500)} y1={1300} x2={((i * 220 + off(1, 220)) % 1500) - 120} y2={1920} stroke="#00000022" strokeWidth={4} />
      ))}
      {/* pila de 64 libros */}
      <g>
        <ellipse cx={720} cy={1405} rx={130} ry={14} fill="rgba(0,0,0,0.3)" />
        {placed.map((b, i) => {
          const p = prog(L, 45 + (15 - i) * 1.6, 45 + (15 - i) * 1.6 + 20, easeIn);
          if (p >= 1) return null;
          const cx = 720 + b.dx;
          const cy = b.y + b.h / 2;
          return (
            <g key={i} transform={suckT(p, cx, cy, tgt[0], tgt[1])} opacity={suckOp(p)}>
              <Book x={cx - b.w / 2} y={b.y} w={b.w} h={b.h} c={b.c} rot={b.rot} />
            </g>
          );
        })}
        <Flash x={720} y={1000} k={prog(L, 44, 76)} r={300} inward c="#c8fbff" />
      </g>
      <Character id="del" x={delX} y={1070} s={1.2} t={f} look={DELIVERY} pose={del} />
      <Box x={delX - 100} y={905} w={200} h={130} />
      <Box x={delX - 82} y={820} w={160} h={85} c="#d39a62" />
      {[0, 1, 2].map((i) => {
        const p = ((f * 0.03 + i / 3) % 1);
        return <Drop key={i} x={delX - 70 + i * 55} y={640 + 120 * p} s={0.9 * (1 - p * 0.4)} />;
      })}
      <Character id="hero" x={heroX} y={1050} s={1.4} t={f} pose={hero} />
      {L >= 95 && [0, 1, 2, 3].map((i) => {
        const ph = (((L - 95) - i * 20) % 80 + 80) % 80 / 80;
        return <Note key={i} x={heroX + 70 + 20 * Math.sin(ph * 6 + i)} y={640 - 130 * ph} r={12 * Math.sin(ph * 5)} op={Math.sin(Math.PI * ph)} />;
      })}
      <InvUI cx={UI.cx} cy={UI.cy} s={UI.s} k={prog(L, 0, 20, easeBack)} t={f} slots={slots} title={L < 70 ? "INVENTARIO" : "PESO: 0 kg"} />
      <Flash x={tgt[0]} y={tgt[1]} k={prog(L, 66, 86)} r={80} />
    </g>
  );
};

/* ── Escena 3 · Ticket low-cost ── */
const Scene3: React.FC<SP> = ({ L, fps, f }) => {
  const sp = mkSp(fps, L);
  const big = 1 - prog(L, 70, 104);
  const scr = prog(L, 8, 16);
  const check = sp(26, 8, 140);
  const px = L < 70 ? lerp(800, 880, prog(L, 0, 70, Easing.linear)) : lerp(-350, 1450, prog(L, 70, 230, Easing.inOut(Easing.quad)));
  const pyy = L < 70 ? 430 : 560 + 22 * Math.sin(L / 14);
  const ps = L < 70 ? 0.3 : 1.25;
  const hx = 410;
  const hy = 1130;
  const armR: Arm = { aim: [58, -118] };
  const hand = handW(hx, hy, 1.45, -1, armR);
  const t = easeIO(1 - big);
  const phC: V = [lerp(540, hand[0], t), lerp(760, hand[1] - 40, t)];
  const phS = lerp(1.9, 0.5, t);
  const rise = sp(0, 14, 90);
  return (
    <g>
      <rect width={W} height={H} fill="url(#sunset)" />
      <circle cx={760} cy={880} r={150} fill="#fff1c1" opacity={0.9} />
      <circle cx={760} cy={880} r={230} fill="#ffd27a" opacity={0.25} />
      {[0, 1, 2].map((i) => (
        <Cloud key={i} x={((i * 520 + f * (0.5 + i * 0.3)) % 1700) - 300} y={760 + i * 110} s={1.4 - i * 0.2} c={["#ffb59a", "#ff9a8a", "#d97fa0"][i]} />
      ))}
      <g opacity={L > 70 ? 1 : 0.8}>
        {L >= 70 && <rect x={px - 700} y={pyy - 4} width={640} height={8} rx={4} fill="#fff" opacity={0.55} />}
        <Plane x={px} y={pyy} s={ps} rot={-3} />
      </g>
      {/* ventanal de terminal */}
      <rect x={-10} y={120} width={W + 20} height={1180} fill="none" stroke="#1a2030" strokeWidth={34} />
      {[360, 720].map((x) => <rect key={x} x={x - 13} y={120} width={26} height={1180} fill="#1a2030" />)}
      <rect x={0} y={700} width={W} height={26} fill="#1a2030" />
      <rect y={1290} width={W} height={630} fill="#272c3b" />
      <rect y={1290} width={W} height={50} fill="#ff9a6a" opacity={0.28} />
      {[1400, 1520, 1670].map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#ffffff14" strokeWidth={3} />)}
      <Character id="hero" x={hx} y={hy} s={1.45} t={f}
        pose={{ armR, armL: { out: 10, flex: 12 }, mouth: "smile", lookX: 0.2, lookY: 0.5, legL: { out: 6 }, legR: { out: 6 } }} />
      {/* móvil: inserto grande → mano */}
      <rect width={W} height={H} fill="#000" opacity={0.5 * big} />
      <g transform={`translate(${phC[0]} ${phC[1] + (1 - rise) * 900}) scale(${phS})`}>
        <rect x={-136} y={-250} width={272} height={500} rx={34} fill="#14161d" {...o} />
        <rect x={-120} y={-232} width={240} height={464} rx={22} fill="#0f1b2d" />
        <g opacity={scr}>
          <rect x={-120} y={-232} width={240} height={464} rx={22} fill="#eaf4ff" />
          <rect x={-120} y={-232} width={240} height={54} rx={22} fill="#2b6cff" />
          <circle cx={-96} cy={-205} r={7} fill="#7dffb0" />
          <text x={-82} y={-199} fontSize={16} fontWeight={800} fontFamily={FONT} fill="#fff">VUELO CONFIRMADO</text>
          <text x={-96} y={-130} fontSize={30} fontWeight={900} fontFamily={FONT} fill={INK}>MVD</text>
          <g transform="translate(0 -140) scale(0.22)"><Plane x={0} y={0} s={1} /></g>
          <text x={96} y={-130} textAnchor="end" fontSize={30} fontWeight={900} fontFamily={FONT} fill={INK}>SZX</text>
          <line x1={-100} y1={-100} x2={100} y2={-100} stroke="#b9c7dd" strokeWidth={2} strokeDasharray="6 5" />
          <text x={-100} y={-70} fontSize={15} fontWeight={700} fontFamily={FONT} fill="#4a5568">Tarifa low-cost</text>
          <text x={-100} y={-24} fontSize={15} fontWeight={700} fontFamily={FONT} fill="#4a5568">Equipaje de bodega</text>
          <rect x={-104} y={-4} width={208} height={104} rx={14} fill="#d8f8e1" stroke="#2d8f4b" strokeWidth={3} />
          <text x={0} y={62} textAnchor="middle" fontSize={64} fontWeight={900} fontFamily={FONT} fill="#1f8a45" transform={`scale(${0.6 + 0.4 * check})`} style={{ transformOrigin: "0px 50px" }}>$0</text>
          <path d="M 70 18 L 80 28 L 96 8" fill="none" stroke="#1f8a45" strokeWidth={5} strokeLinecap="round" opacity={check} />
          {Array.from({ length: 28 }).map((_, i) => (
            <rect key={i} x={-100 + i * 7.2} y={140} width={i % 3 === 0 ? 4 : 2.5} height={62} fill={INK} />
          ))}
        </g>
      </g>
    </g>
  );
};

/* ── Escena 4 · Galpón de Shenzhen ── */
const Tower: React.FC<{ x: number; y: number; cols: number; rows: number; bw: number; bh: number; L: number; start: number; target: V }> = ({
  x, y, cols, rows, bw, bh, L, start, target,
}) => {
  const items: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const p = prog(L, start + i * 2, start + i * 2 + 20, easeIn);
      if (p >= 1) continue;
      const bx = x + (c - cols / 2) * bw;
      const by = y - (r + 1) * bh;
      items.push(
        <g key={i} transform={suckT(p, bx + bw / 2, by + bh / 2, target[0], target[1])} opacity={suckOp(p)}>
          <Box x={bx} y={by} w={bw} h={bh} label={(i + r) % 2 === 0} />
        </g>
      );
    }
  }
  return (
    <g>
      <rect x={x - (cols * bw) / 2 - 8} y={y} width={cols * bw + 16} height={18} fill="#b58a55" {...o} strokeWidth={4} />
      {[0, 1, 2].map((i) => <rect key={i} x={x - (cols * bw) / 2 + i * ((cols * bw) / 3)} y={y + 18} width={22} height={14} fill="#9a7140" stroke={INK} strokeWidth={3} />)}
      {items}
    </g>
  );
};

const Scene4: React.FC<SP> = ({ L, f }) => {
  const UI = { cx: 540, cy: 430, s: 0.72 };
  const tgt: V = [UI.cx, UI.cy];
  const heroX = L < 40 ? lerp(60, 360, prog(L, 0, 40, Easing.linear))
    : L < 100 ? 360 : L < 145 ? lerp(360, 640, prog(L, 100, 145, Easing.linear)) : 640;
  const moving = L < 40 || (L >= 100 && L < 145);
  const filled = Math.floor(12 * prog(L, 66, 112) + 12 * prog(L, 156, 202) + 12 * prog(L, 246, 292));
  const slots = emptySlots().map((_, i): Slot => (i < filled ? { t: (["box", "console", "box"] as IconT[])[i % 3], n: 64 } : null));
  const reachL = (a: number, b: number): Arm => lerpArm({ out: 12, flex: 14 }, { out: 75, flex: 8 }, prog(L, a, b) * (1 - prog(L, b + 14, b + 30)));
  const armL = reachL(40, 58);
  const armL2 = reachL(135, 150);
  const armRt = lerpArm({ out: 12, flex: 14 }, { out: 75, flex: 8 }, prog(L, 226, 240) * (1 - prog(L, 254, 270)));
  const pose: Pose = {
    ...(moving ? walk(f) : { legL: { out: 6 }, legR: { out: 6 } }),
    armL: L < 100 ? (L < 40 ? walk(f).armL : armL) : L < 145 ? walk(f).armL : armL2,
    armR: L >= 226 ? armRt : moving ? walk(f).armR : { out: 12, flex: 14 },
    mouth: L > 290 ? "grin" : "smile", lookX: 0.4,
  };
  const calcText = L < 290 ? "9.6" : "2304";
  const full = prog(L, 290, 300);
  return (
    <g>
      <rect width={W} height={H} fill="#5c6874" />
      {Array.from({ length: 27 }).map((_, i) => <rect key={i} x={i * 40} y={160} width={22} height={1100} fill="#7b8896" opacity={0.55} />)}
      <rect width={W} height={160} fill="#2d333b" />
      {[0, 1, 2, 3].map((i) => <line key={i} x1={i * 360 - 40} y1={160} x2={i * 360 + 160} y2={460} stroke="#1b2027" strokeWidth={14} />)}
      {[180, 540, 900].map((x, i) => (
        <g key={i}>
          <line x1={x} y1={160} x2={x} y2={250} stroke={INK} strokeWidth={5} />
          <path d={`M ${x - 60} 330 L ${x - 24} 250 L ${x + 24} 250 L ${x + 60} 330 Z`} fill="#3b4350" {...o} />
          <polygon points={`${x - 50},330 ${x + 50},330 ${x + 170},900 ${x - 170},900`} fill="#fff6c9" opacity={0.09} />
        </g>
      ))}
      <rect x={260} y={185} width={560} height={90} fill="#f2a900" {...o} />
      <text x={540} y={249} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>SHENZHEN · BODEGA 07</text>
      <rect y={1250} width={W} height={670} fill="#8a8f96" />
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <polygon key={i} points={`${i * 120},1250 ${i * 120 + 60},1250 ${i * 120 + 20},1290 ${i * 120 - 40},1290`} fill={i % 2 ? "#f2a900" : "#222"} />
      ))}
      <Tower x={170} y={1420} cols={3} rows={5} bw={70} bh={58} L={L} start={60} target={tgt} />
      <Tower x={480} y={1290} cols={3} rows={4} bw={56} bh={46} L={L} start={150} target={tgt} />
      <Tower x={760} y={1290} cols={3} rows={4} bw={56} bh={46} L={L} start={240} target={tgt} />
      <Character id="mer" x={930} y={1180} s={1.25} t={f} look={MERCHANT}
        pose={{ armL: { aim: [-40, -100] }, armR: L > 290 ? { out: 70, flex: -60, open: true } : { aim: [-6, -92 + 4 * Math.sin(f / 3)] }, mouth: L > 290 ? "grin" : "smile", lookX: -0.7, legL: { out: 6 }, legR: { out: 6 } }} />
      <Calc x={930 - 22 * 1.25 * 1.2} y={1180 - 100 * 1.25} text={calcText} />
      <Character id="hero" x={heroX} y={1220} s={1.3} t={f} pose={pose} />
      <InvUI cx={UI.cx} cy={UI.cy} s={UI.s} k={prog(L, 0, 20, easeBack)} t={f} slots={slots} glowAll={full} title={L < 290 ? "INVENTARIO" : "INVENTARIO · LLENO"} />
      {[66, 156, 246].map((s0) => <Flash key={s0} x={UI.cx} y={UI.cy} k={prog(L, s0 + 22, s0 + 50)} r={120} />)}
    </g>
  );
};

/* ── Escena 5 · Tensión en aduana ── */
const Scene5: React.FC<SP> = ({ L, f }) => {
  const px = -150 + 690 * prog(L, 0, 420, Easing.linear);
  const sweep = Math.sin(L / 10);
  const alarm = 0.5 + 0.5 * Math.sin(L / 6);
  const archK = prog(L, 320, 420);
  const hero: Pose = {
    ...walk(f, 0.6),
    armL: { aim: [-30, -42] }, armR: { aim: [48, -228] },
    pockets: "L", mouth: "smirk", lookX: 0.5, brow: -0.1, head: -2,
  };
  const off = (ox: number) => clamp((px - ox) / 320, -1, 1);
  const officers: [number, Look, number][] = [[250, OFFICER, 0], [700, OFFICER2, 1]];
  const lowerNow = prog(L, 110, 130);
  return (
    <g>
      <rect width={W} height={H} fill="#a9bbb0" />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={i * 130} y1={0} x2={i * 130} y2={1250} stroke="#00000018" strokeWidth={3} />)}
      {[200, 330, 460, 590, 720, 850].map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#00000014" strokeWidth={3} />)}
      <rect width={W} height={170} fill="#1d2630" />
      {[200, 540, 880].map((x, i) => <rect key={i} x={x - 110} y={100} width={220} height={26} rx={6} fill="#e9f7ff" {...o} />)}
      <rect x={250} y={230} width={580} height={110} fill="#f2c200" {...o} />
      <text x={540} y={300} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={60} fill={INK}>ADUANA</text>
      <text x={540} y={328} textAnchor="middle" fontFamily={FONT} fontWeight={700} fontSize={20} fill={INK}>CUSTOMS · INSPECCIÓN</text>
      <g transform="translate(900 470)">
        <circle r={54} fill="#e94f4f" {...o} />
        <text textAnchor="middle" y={-4} fontFamily={FONT} fontWeight={900} fontSize={16} fill="#fff">REVISIÓN</text>
        <text textAnchor="middle" y={16} fontFamily={FONT} fontWeight={900} fontSize={16} fill="#fff">TOTAL</text>
      </g>
      <g transform="translate(160 470)">
        <circle r={54} fill="#3fae5a" {...o} />
        <text textAnchor="middle" y={-4} fontFamily={FONT} fontWeight={900} fontSize={14} fill="#fff">NADA QUE</text>
        <text textAnchor="middle" y={14} fontFamily={FONT} fontWeight={900} fontSize={14} fill="#fff">DECLARAR</text>
      </g>
      <g transform="translate(540 190)">
        <circle r={22} fill="#ff3b3b" {...o} strokeWidth={4} opacity={0.4 + 0.6 * alarm} />
        <polygon points={`0,0 ${-260 + 520 * (0.5 + 0.5 * sweep)},700 ${-160 + 520 * (0.5 + 0.5 * sweep)},700`} fill="#ff3b3b" opacity={0.08 * alarm} />
      </g>
      <rect y={1250} width={W} height={670} fill="#8e9a93" />
      {[1320, 1420, 1560, 1730].map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#00000022" strokeWidth={3} />)}
      {/* arco que se acerca */}
      <g opacity={archK} transform={`translate(540 ${1250}) scale(${0.7 + 0.3 * archK}) translate(-540 -1250)`}>
        <rect x={140} y={430} width={120} height={820} fill="#cfd6de" {...o} />
        <rect x={820} y={430} width={120} height={820} fill="#cfd6de" {...o} />
        <rect x={140} y={380} width={800} height={120} fill="#bfc8d2" {...o} />
        {[0, 1, 2].map((i) => <circle key={i} cx={440 + i * 100} cy={440} r={20} fill="#ffb000" stroke={INK} strokeWidth={4} />)}
      </g>
      {/* oficiales revisando maletas ajenas */}
      {officers.map(([ox, lk, idx]) => (
        <g key={idx}>
          <Character id={`off${idx}`} x={ox} y={1000} s={1.1} t={f} look={lk}
            pose={{
              lean: lerp(14, 0, lowerNow), head: lerp(10, -4, lowerNow),
              armL: { aim: [-56, 60] }, armR: { aim: [56, 60] },
              mouth: "neutral", brow: -0.7, lookX: lowerNow > 0.5 ? off(ox) : 0, lookY: lowerNow > 0.5 ? 0 : 0.8,
            }} />
        </g>
      ))}
      <g>
        <rect x={20} y={1090} width={1040} height={26} rx={6} fill="#c8d0d8" {...o} />
        <rect x={40} y={1116} width={1000} height={230} fill="#9aa5ae" {...o} />
        {Array.from({ length: 10 }).map((_, i) => <rect key={i} x={70 + i * 98} y={1146} width={60} height={14} rx={4} fill="#00000025" />)}
        <Suitcase x={130} y={1090} w={250} c="#c0392b" />
        <Suitcase x={580} y={1090} w={250} c="#2e86c1" />
        <path d="M 420 1090 q 50 -60 100 0 z" fill="#d68910" stroke={INK} strokeWidth={4} />
      </g>
      <Character id="hero" x={px} y={1230} s={1.45} t={f} pose={hero} />
      {(() => {
        const hp = handW(px, 1230, 1.45, -1, hero.armR!);
        return <Juice x={hp[0] + 6} y={hp[1] + 10} rot={8} />;
      })()}
      <Flash x={px} y={1230 - 120 * 1.45} k={prog(L, 120, 150)} r={110} />
      <rect width={W} height={H} fill="#000" opacity={0.18 * alarm * (1 - prog(L, 120, 150))} />
    </g>
  );
};

/* ── Escena 6 · Escáner verde & rayos X ── */
const Skeleton: React.FC<{ pose: Pose }> = ({ pose }) => {
  const aL = solveArm(1, pose.armL);
  const aR = solveArm(-1, pose.armR);
  const lL = solveLeg(1, pose.legL);
  const lR = solveLeg(-1, pose.legR);
  const st = { fill: "none", stroke: "#d8fffb", strokeWidth: 5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return (
    <g opacity={0.9}>
      <ellipse cx={0} cy={-285} rx={50} ry={58} {...st} />
      <path d="M -22 -258 Q 0 -240 22 -258" {...st} strokeWidth={4} />
      <line x1={0} y1={-225} x2={0} y2={0} {...st} strokeWidth={7} strokeDasharray="10 8" />
      {[-170, -140, -110, -80].map((y, i) => (
        <path key={i} d={`M 0 ${y} Q -40 ${y + 8} -48 ${y + 34} M 0 ${y} Q 40 ${y + 8} 48 ${y + 34}`} {...st} />
      ))}
      <path d="M -50 -2 Q 0 28 50 -2" {...st} />
      <polyline points={pts(aL.S, aL.E, aL.H)} {...st} />
      <polyline points={pts(aR.S, aR.E, aR.H)} {...st} />
      <polyline points={pts(lL.hip, lL.knee, lL.ankle)} {...st} />
      <polyline points={pts(lR.hip, lR.knee, lR.ankle)} {...st} />
    </g>
  );
};

const Scene6: React.FC<SP> = ({ L, f }) => {
  const X = 540, Y = 1130, S = 1.45;
  const pose: Pose = { armL: { out: 28, flex: 6 }, armR: { out: 28, flex: 6 }, legL: { out: 6 }, legR: { out: 6 }, mouth: "smile", lookX: 0 };
  const scan = prog(L, 30, 80, Easing.linear);
  const lampGreen = L >= 80;
  const xr = prog(L, 88, 96) * (1 - prog(L, 396, 408));
  const count = Math.round(2304 * prog(L, 100, 190));
  const winkPhase = L > 430 && L < 470;
  const slots = emptySlots().map((_, i): Slot => ({ t: (["box", "console", "bill"] as IconT[])[i % 3], n: 64 }));
  const UI = { cx: 540, cy: 330, s: 0.92 };
  return (
    <g>
      <rect width={W} height={H} fill="#c9d3d8" />
      <rect width={W} height={1250} fill="#9fb3b0" />
      {Array.from({ length: 9 }).map((_, i) => <line key={i} x1={i * 130} y1={0} x2={i * 130} y2={1250} stroke="#00000014" strokeWidth={3} />)}
      <rect y={1250} width={W} height={670} fill="#7f8d92" />
      {[1320, 1430, 1580, 1750].map((y, i) => <line key={i} x1={0} y1={y} x2={W} y2={y} stroke="#00000022" strokeWidth={3} />)}
      <rect x={120} y={430} width={130} height={850} fill="#d6dde4" {...o} />
      <rect x={830} y={430} width={130} height={850} fill="#d6dde4" {...o} />
      <rect x={110} y={360} width={860} height={130} rx={14} fill="#c3ccd6" {...o} />
      {[0, 1, 2].map((i) => (
        <circle key={i} cx={430 + i * 110} cy={425} r={24} fill={lampGreen ? "#3fe07a" : i === 1 && Math.floor(L / 8) % 2 ? "#ffb000" : "#6b5a2a"} stroke={INK} strokeWidth={4}
          style={{ filter: lampGreen ? "drop-shadow(0 0 16px #3fe07a)" : "none" }} />
      ))}
      <rect x={150} y={490} width={14} height={760} fill={lampGreen ? "#3fe07a" : "#6c7a85"} opacity={0.8} />
      <rect x={916} y={490} width={14} height={760} fill={lampGreen ? "#3fe07a" : "#6c7a85"} opacity={0.8} />
      {scan > 0 && scan < 1 && (
        <rect x={250} y={1250 - 800 * scan} width={580} height={36} fill="#3fe07a" opacity={0.55} style={{ filter: "drop-shadow(0 0 18px #3fe07a)" }} />
      )}
      {L >= 80 && L < 130 && (
        <g transform="translate(540 330)" opacity={1 - prog(L, 110, 130)}>
          <rect x={-120} y={-40} width={240} height={70} rx={35} fill="#3fe07a" {...o} />
          <text textAnchor="middle" y={14} fontFamily={FONT} fontWeight={900} fontSize={38} fill={INK}>LIBRE</text>
        </g>
      )}
      <Character id="hero" x={X} y={Y} s={S} t={f} op={1 - xr}
        pose={{ ...pose, wink: winkPhase, mouth: winkPhase ? "grin" : "smile", head: winkPhase ? -6 : 0, lookX: winkPhase ? 0 : 0.3 }} />
      {xr > 0 && (
        <g opacity={xr}>
          <rect width={W} height={H} fill="#031a22" opacity={0.86} />
          {Array.from({ length: 24 }).map((_, i) => <line key={i} x1={0} y1={i * 80} x2={W} y2={i * 80} stroke="#3ff0ff" strokeWidth={1.5} opacity={0.12} />)}
          <rect x={0} y={((L * 6) % 1920) - 40} width={W} height={50} fill="#3ff0ff" opacity={0.08} />
          <g filter="url(#xray)" opacity={0.85}>
            <Character id="heroX" x={X} y={Y} s={S} t={f} pose={pose} />
          </g>
          <g transform={`translate(${X} ${Y}) scale(${S})`}>
            <Skeleton pose={pose} />
            <ellipse cx={0} cy={-118} rx={58} ry={70} fill="url(#portal)" stroke="#5ef2ff" strokeWidth={4} />
            {Array.from({ length: 120 }).map((_, i) => {
              const a = i * 2.39996 + L * 0.03 * (1 + (i % 3) * 0.4);
              const r = Math.sqrt(i / 120) * 52;
              return <circle key={i} cx={Math.cos(a) * r} cy={-118 + Math.sin(a) * r * 1.2} r={2 + (i % 3)} fill={["#ffd166", "#9ff3ff", "#fff"][i % 3]} opacity={0.85} />;
            })}
            {(["box", "console", "bill", "book"] as IconT[]).map((t, i) => {
              const a = L * 0.06 + i * 1.57;
              return (
                <g key={t} transform={`translate(${Math.cos(a) * 40} ${-118 + Math.sin(a) * 52}) scale(0.9)`}>
                  <Icon t={t} />
                </g>
              );
            })}
          </g>
          <InvUI cx={UI.cx} cy={UI.cy} s={UI.s} k={prog(L, 94, 112, easeBack)} t={f} slots={slots} glowAll={1} title="DIMENSIÓN PRIVADA" />
          <g transform="translate(540 1640)" opacity={prog(L, 100, 120)}>
            <text textAnchor="middle" y={0} fontFamily={FONT} fontWeight={900} fontSize={96} fill="#9ff3ff" style={{ filter: "drop-shadow(0 0 14px #3ff0ff)" }}>{dots(count)}</text>
            <text textAnchor="middle" y={52} fontFamily={FONT} fontWeight={800} fontSize={34} fill="#d8fffb">ÍTEMS · 36/36 CASILLAS · 100%</text>
          </g>
          {([[60, 60], [1020, 60], [60, 1860], [1020, 1860]] as V[]).map(([cx, cy], i) => (
            <path key={i} d={`M ${cx - Math.sign(cx - 540) * 70} ${cy} L ${cx} ${cy} L ${cx} ${cy - Math.sign(cy - 960) * 70}`} fill="none" stroke="#5ef2ff" strokeWidth={6} />
          ))}
        </g>
      )}
    </g>
  );
};

/* ── Escena 7 · Reventa en el campus ── */
const SALES = [{ t: 20, b: 0 }, { t: 70, b: 1 }, { t: 120, b: 2 }, { t: 170, b: 0 }, { t: 220, b: 1 }];
const BUYERS = [
  { x: 190, y: 1480, s: 1.1, look: STUD_A },
  { x: 890, y: 1450, s: 1.1, look: STUD_B },
  { x: 420, y: 1720, s: 1.2, look: STUD_C },
];

const Scene7: React.FC<SP> = ({ L, f }) => {
  const PX = 540, PY = 1090, PS = 1.3;
  const chest: V = [0, -112];
  let active = -1;
  SALES.forEach((s, i) => { if (L >= s.t) active = i; });
  const sale = active >= 0 ? SALES[active] : null;
  const u = sale ? L - sale.t : 0;
  const buyer = sale ? BUYERS[sale.b] : BUYERS[0];
  const protSgn: 1 | -1 = buyer.x < PX && sale?.b !== 2 ? 1 : -1;
  const bhRest = (b: number): V => [BUYERS[b].x + (BUYERS[b].x < PX ? 90 : -90), BUYERS[b].y - 150];
  const towardB: V = [(buyer.x - PX) / PS, (buyer.y - 220 - PY) / PS];
  const e = prog(u, 6, 16) * (1 - prog(u, 26, 36));
  const aim = lerpV(chest, towardB, e);
  const protArm: Arm = sale ? { aim } : { out: 12, flex: 14 };
  const myHand = handW(PX, PY, PS, protSgn, protArm);
  const buyerHand = (b: number, arm: Arm): V => handW(BUYERS[b].x, BUYERS[b].y, BUYERS[b].s, BUYERS[b].x < PX ? -1 : 1, arm);
  const sold = SALES.filter((s) => L >= s.t + 30).length;
  const stock = 64 - sold;
  const chestW: V = [PX + chest[0] * PS, PY + chest[1] * PS];
  return (
    <g>
      <rect width={W} height={H} fill="url(#sky)" />
      <rect x={90} y={380} width={900} height={640} fill="#e4d8bc" {...o} />
      <polygon points="60,380 540,230 1020,380" fill="#cdbf9c" {...o} />
      {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={130 + i * 150} y={420} width={50} height={600} fill="#f3ead2" {...o} strokeWidth={4} />)}
      <rect x={440} y={760} width={200} height={260} fill="#6b4f38" {...o} />
      <text x={540} y={330} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={44} fill={INK}>UNIVERSIDAD</text>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <g key={i}>
          <rect x={-20 + i * 14} y={1020 + i * 120} width={W + 40 - i * 28} height={70} fill="#c9c2b2" {...o} strokeWidth={4} />
          <rect x={-20 + i * 14} y={1090 + i * 120} width={W + 40 - i * 28} height={50} fill="#a79f8c" stroke={INK} strokeWidth={4} />
        </g>
      ))}
      <rect y={1740} width={W} height={180} fill="#8f8873" />
      {BUYERS.map((b, i) => {
        const here = sale && sale.b === i;
        const hasBox = SALES.some((s) => s.b === i && L >= s.t + 28);
        const toward: V = [(PX - b.x) / b.s, (PY - 160 - b.y) / b.s];
        const eb = here ? prog(u, 4, 14) * (1 - prog(u, 34, 44)) : 0;
        const rest: V = [(b.x < PX ? 1 : -1) * 60, 30];
        const arm: Arm = { aim: lerpV(rest, toward, eb) };
        const sgn: 1 | -1 = b.x < PX ? -1 : 1;
        const bp = sp0(spring, L, i);
        return (
          <g key={i}>
            <Character id={`b${i}`} x={b.x} y={b.y + (1 - bp) * 300} s={b.s} t={f + i * 13} look={b.look}
              pose={{ ...(sgn === -1 ? { armR: arm } : { armL: arm }), mouth: here && u > 28 ? "grin" : "smile", lookX: b.x < PX ? 0.7 : -0.7, legL: { out: 6 }, legR: { out: 6 } }} />
            {hasBox && (() => { const h = buyerHand(i, arm); return <Box x={h[0] - 26} y={h[1] - 22} w={52} h={38} c="#e8e8f0" label={false} />; })()}
          </g>
        );
      })}
      <Character id="hero" x={PX} y={PY} s={PS} t={f} look={JACKET}
        pose={{ armL: protSgn === 1 ? protArm : { out: 12, flex: 14 }, armR: protSgn === -1 ? protArm : { out: 12, flex: 14 }, mouth: "smirk", lookX: sale ? clamp((buyer.x - PX) / 400, -1, 1) : 0, legL: { out: 6 }, legR: { out: 6 } }} />
      {sale && u >= 6 && u < 26 && (
        <g>
          {(() => {
            const t = prog(u, 10, 26, Easing.linear);
            const bh = buyerHand(sale.b, { aim: lerpV([(buyer.x < PX ? 1 : -1) * 60, 30], [(PX - buyer.x) / buyer.s, (PY - 160 - buyer.y) / buyer.s], 1) });
            const x = lerp(myHand[0], bh[0], t);
            const y = lerp(myHand[1], bh[1], t) - 120 * Math.sin(Math.PI * t);
            return <Box x={x - 26} y={y - 20} w={52} h={38} c="#e8e8f0" label={false} rot={t * 360} />;
          })()}
        </g>
      )}
      {sale && u >= 22 && u < 46 && (() => {
        const t = prog(u, 22, 46, Easing.linear);
        const from = bhRest(sale.b);
        return [0, 1, 2].map((i) => (
          <Bill key={i} x={lerp(from[0], chestW[0], t) + i * 12} y={lerp(from[1], chestW[1], t) - 90 * Math.sin(Math.PI * t) + i * 10} rot={-20 + i * 20 + t * 180} />
        ));
      })()}
      <g transform="translate(150 240)">
        <rect x={-110} y={-52} width={410} height={104} rx={18} fill="rgba(8,34,52,0.78)" stroke="#5ef2ff" strokeWidth={3} />
        <g transform="translate(-50 0) scale(1.5)"><Icon t="console" /></g>
        <text x={-10} y={-6} fontFamily={FONT} fontWeight={900} fontSize={30} fill="#fff">STOCK x{stock}</text>
        <g transform="translate(-4 26) scale(0.6)"><Icon t="bill" /></g>
        <text x={22} y={34} fontFamily={FONT} fontWeight={800} fontSize={22} fill="#baf8ff">VENTAS {sold}</text>
      </g>
    </g>
  );
};
/** entrada elástica sin necesitar fps en la escena (60 fps) */
const sp0 = (sprFn: typeof spring, L: number, i: number) =>
  sprFn({ frame: Math.max(0, L - i * 4), fps: 60, config: { damping: 11, stiffness: 100, mass: 0.7 } });

/* ── Escena 8 · Glow-up realista ── */
const Scene8: React.FC<SP> = ({ L, fps, f }) => {
  const sp = mkSp(fps, L);
  const reveal = prog(L, 20, 64);
  const lights = prog(L, 88, 106);
  const d = (delay: number) => sp(delay, 9, 120, 0.7);
  const hands: Pose = {
    seated: true, armL: { aim: [-48, -306] }, armR: { aim: [48, -306] },
    mouth: "grin", brow: -0.1, lookX: 0.2, lookY: -0.1, head: -4,
  };
  return (
    <g>
      <Dorm />
      <rect width={W} height={H} fill="#000" opacity={0.0} />
      <clipPath id="reveal"><rect x={0} y={0} width={W * reveal} height={H} /></clipPath>
      <g clipPath="url(#reveal)">
        <Dorm glow />
        {/* LEDs perimetrales */}
        <g style={{ filter: "drop-shadow(0 0 12px #ff4fd8)" }} opacity={0.35 + 0.65 * lights}>
          <rect x={20} y={40} width={W - 40} height={10} rx={5} fill="#ff4fd8" />
          <rect x={20} y={1260} width={W - 40} height={10} rx={5} fill="#3ff0ff" />
        </g>
        <Pop k={d(76)} ax={540} ay={330}>
          <g style={{ filter: "drop-shadow(0 0 18px #ff4fd8)" }}>
            <rect x={300} y={270} width={480} height={110} rx={22} fill="none" stroke="#ff7bf0" strokeWidth={8} />
            <text x={540} y={348} textAnchor="middle" fontFamily={FONT} fontWeight={900} fontSize={66} fill="#ffd1fa">LEVEL UP</text>
          </g>
        </Pop>
        <Pop k={d(82)} ax={900} ay={620}>
          <rect x={720} y={600} width={310} height={14} fill="#3a2f55" {...o} strokeWidth={4} />
          {["#ff7bf0", "#3ff0ff", "#ffd166"].map((c, i) => <rect key={i} x={740 + i * 70} y={540} width={44} height={60} rx={8} fill={c} stroke={INK} strokeWidth={4} />)}
          <circle cx={990} cy={560} r={26} fill="#3fae5a" stroke={INK} strokeWidth={4} />
        </Pop>
        <Pop k={d(62)} ax={540} ay={1100}>
          <rect x={160} y={1090} width={760} height={24} rx={8} fill="#2b2540" {...o} />
          <rect x={190} y={1114} width={22} height={190} fill="#3a335a" {...o} strokeWidth={4} />
          <rect x={870} y={1114} width={22} height={190} fill="#3a335a" {...o} strokeWidth={4} />
          <rect x={150} y={700} width={780} height={330} rx={14} fill="#10142a" {...o} />
          <rect x={164} y={714} width={752} height={302} rx={8} fill="url(#screen)" />
          <rect x={180} y={1050} width={320} height={34} rx={6} fill="#1b1f33" {...o} strokeWidth={4} />
          {Array.from({ length: 18 }).map((_, i) => <rect key={i} x={188 + i * 17} y={1058} width={12} height={18} rx={3} fill={["#ff4fd8", "#3ff0ff", "#ffd166"][i % 3]} />)}
          <polygon points="700,1086 880,1086 900,1040 720,1040" fill="#cfd6e4" {...o} strokeWidth={4} />
          <rect x={728} y={1000} width={150} height={44} fill="#e8edf7" stroke={INK} strokeWidth={4} transform="skewX(-8)" />
        </Pop>
        <Pop k={d(70)} ax={540} ay={1320}>
          <rect x={330} y={640} width={140} height={560} rx={50} fill="#241d3a" {...o} />
          <rect x={620} y={640} width={140} height={560} rx={50} fill="#241d3a" {...o} transform="translate(-30 0)" />
          <path d="M 370 700 L 420 700 L 420 1100 L 370 1100 Z" fill="#ff4fd8" opacity={0.7} />
        </Pop>
        <Pop k={d(56)} ax={880} ay={1420}>
          <rect x={700} y={1230} width={360} height={90} rx={26} fill="#f5e9ff" {...o} />
          <rect x={720} y={1320} width={320} height={80} rx={14} fill="#7b5cc4" {...o} />
          <rect x={720} y={1180} width={140} height={70} rx={28} fill="#fff" {...o} />
          <rect x={880} y={1190} width={150} height={60} rx={26} fill="#ffd1fa" {...o} />
        </Pop>
        <Pop k={d(96)} ax={160} ay={1330}>
          <rect x={60} y={1240} width={200} height={14} rx={6} fill="#caa46a" {...o} strokeWidth={4} />
          <rect x={150} y={1254} width={20} height={150} fill="#a98550" stroke={INK} strokeWidth={4} />
          <ellipse cx={160} cy={1226} rx={78} ry={18} fill="#fff" {...o} strokeWidth={4} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={102 + i * 34} y={1196} width={30} height={22} rx={9} fill="#f6f1e6" stroke={INK} strokeWidth={3} />
              <rect x={104 + i * 34} y={1192} width={26} height={11} rx={5} fill={["#ff7a59", "#ff4d6d", "#ffa94d", "#ff7a59"][i]} stroke={INK} strokeWidth={3} />
            </g>
          ))}
          <path d="M 212 1226 L 212 1170 Q 212 1140 236 1140 Q 260 1140 260 1170 L 260 1226 Z" fill="#c86b7a" opacity={0.85} stroke={INK} strokeWidth={4} />
        </Pop>
        <Pop k={d(110)} ax={160} ay={1000}>
          <rect x={150} y={760} width={10} height={480} fill="#ccc" stroke={INK} strokeWidth={3} />
          <path d="M 80 800 L 160 700 L 240 800 Z" fill="#ffd27a" {...o} />
        </Pop>
        <Character id="hero" x={540} y={1240} s={1.5} t={f} op={clamp(d(60), 0, 1)} pose={hands} />
        <rect width={W} height={H} fill="#ffb86b" opacity={0.18 * lights} style={{ mixBlendMode: "screen" }} />
        <rect width={W} height={H} fill="#12081e" opacity={0.45 * (1 - lights)} />
      </g>
      {reveal > 0 && reveal < 1 && (
        <rect x={W * reveal - 14} y={0} width={28} height={H} fill="#fff" opacity={0.85} style={{ filter: "drop-shadow(0 0 24px #fff)" }} />
      )}
    </g>
  );
};

/* ── Escena 9 · Primera clase y loop ── */
const Scene9: React.FC<SP> = ({ L, f }) => {
  const arrive = prog(L, 0, 20);
  const toHero = prog(L, 150, 176);
  const relaxed: Arm = { out: 35, flex: -95 };
  const armR = lerpArm(relaxed, HERO_POSE.armR!, toHero);
  const uiK = prog(L, 180, 198, easeBack);
  const handP = handW(HERO.x, HERO.y, HERO.s, -1, armR);
  return (
    <g>
      <rect width={W} height={H} fill="url(#cabin)" />
      <rect x={520} y={150} width={460} height={380} rx={150} fill="#e9dcc0" {...o} strokeWidth={8} />
      <clipPath id="win"><rect x={540} y={170} width={420} height={340} rx={130} /></clipPath>
      <g clipPath="url(#win)">
        <rect x={540} y={170} width={420} height={340} fill="url(#gold)" />
        {[0, 1, 2].map((i) => <Cloud key={i} x={((i * 300 + f * (0.7 + i * 0.4)) % 700) + 380} y={380 + i * 40} s={0.8 + i * 0.2} c="#ffe3a3" />)}
      </g>
      <rect x={0} y={620} width={W} height={20} fill="#c9b78f" opacity={0.5} />
      {[0, 1, 2, 3].map((i) => <rect key={i} x={40 + i * 270} y={760} width={8} height={500} fill="#00000014" />)}
      <rect y={1300} width={W} height={620} fill="#5b4a3a" />
      <rect y={1300} width={W} height={18} fill="#c9b78f" {...o} strokeWidth={4} />
      {/* asiento de primera clase */}
      <rect x={250} y={540} width={260} height={640} rx={110} fill="#b9855a" {...o} />
      <rect x={290} y={440} width={180} height={150} rx={60} fill="#c99569" {...o} />
      <rect x={90} y={1100} width={600} height={120} rx={44} fill="#c99569" {...o} />
      <rect x={90} y={1120} width={90} height={300} rx={30} fill="#a8744b" {...o} />
      <rect x={600} y={1120} width={90} height={300} rx={30} fill="#a8744b" {...o} />
      <rect x={160} y={1210} width={460} height={34} rx={10} fill="#8f5f3b" stroke={INK} strokeWidth={4} />
      <Character id="hero" x={HERO.x} y={HERO.y + (1 - arrive) * 60} s={HERO.s} t={f}
        pose={{ ...HERO_POSE, armR, mouth: L < 150 ? "smile" : "smirk", lookX: 0.8, lookY: L < 150 ? -0.3 : -0.2, brow: L < 150 ? 0 : 0.15 }} />
      {toHero < 0.6 && (
        <g transform={`translate(${handP[0] + 4} ${handP[1] + 12})`} opacity={1 - toHero * 1.6}>
          <path d="M -16 -34 L 16 -34 L 12 -4 Q 0 8 -12 -4 Z" fill="#ffe9a8" fillOpacity={0.7} stroke={INK} strokeWidth={3.5} />
          <line x1={0} y1={4} x2={0} y2={28} stroke={INK} strokeWidth={4} />
          <line x1={-14} y1={28} x2={14} y2={28} stroke={INK} strokeWidth={4} />
        </g>
      )}
      <InvUI cx={HERO_UI.cx} cy={HERO_UI.cy} s={HERO_UI.s} k={uiK} t={f} slots={emptySlots()} />
      <rect width={W} height={H} fill="#ffe3a3" opacity={0.5 * (1 - prog(L, 0, 22))} />
    </g>
  );
};

const SCENE_COMPONENTS: React.FC<SP>[] = [Scene0, Scene1, Scene2, Scene3, Scene4, Scene5, Scene6, Scene7, Scene8, Scene9];

/* ════════════════════════ 7 · DEFS GLOBALES + VFX ════════════════════════ */

const Defs: React.FC<{ seed: number }> = ({ seed }) => (
  <defs>
    {/* line-boil: el desplazamiento cambia de semilla a 15 fps */}
    <filter id="boil" x="-2%" y="-2%" width="104%" height="104%">
      <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves={2} seed={seed} result="n" />
      <feDisplacementMap in="SourceGraphic" in2="n" scale={3.2} xChannelSelector="R" yChannelSelector="G" />
    </filter>
    <filter id="xray">
      <feColorMatrix type="matrix" values="-0.03 -0.03 -0.03 0 0.1  -0.31 -0.31 -0.31 0 0.95  -0.33 -0.33 -0.33 0 1  0 0 0 1 0" />
    </filter>
    <linearGradient id="dormWall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#33405f" /><stop offset="1" stopColor="#222b45" /></linearGradient>
    <linearGradient id="dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#3d4a8a" /><stop offset="0.6" stopColor="#e58a8a" /><stop offset="1" stopColor="#ffc38a" /></linearGradient>
    <linearGradient id="night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b0b2a" /><stop offset="1" stopColor="#3b2a6b" /></linearGradient>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fc9ff" /><stop offset="1" stopColor="#eaf6ff" /></linearGradient>
    <linearGradient id="sunset" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2b1b4a" /><stop offset="0.5" stopColor="#ff7a59" /><stop offset="1" stopColor="#ffc371" /></linearGradient>
    <linearGradient id="cabin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#e8dcc2" /><stop offset="1" stopColor="#bda77d" /></linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffb85c" /><stop offset="1" stopColor="#ffe9b0" /></linearGradient>
    <linearGradient id="screen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff4fd8" /><stop offset="0.5" stopColor="#6a5cff" /><stop offset="1" stopColor="#3ff0ff" /></linearGradient>
    <radialGradient id="portal"><stop offset="0" stopColor="#baf8ff" stopOpacity={0.9} /><stop offset="1" stopColor="#1a6b8a" stopOpacity={0.4} /></radialGradient>
  </defs>
);

const VfxSprite: React.FC<{ file: string; x: number; y: number; size: number; k: number }> = ({ file, x, y, size, k }) => {
  const [ok, setOk] = React.useState(true);
  if (!ok || k <= 0 || k >= 1) return null;
  return (
    <Img
      src={staticFile(`${VFX_DIR}/${file}`)}
      onError={() => setOk(false)}
      style={{
        position: "absolute", left: x - size / 2, top: y - size / 2, width: size, height: size,
        opacity: 1 - k, transform: `scale(${0.6 + 0.9 * k})`, mixBlendMode: "screen", pointerEvents: "none", zIndex: 40,
      }}
    />
  );
};

/* ════════════════════════ 8 · COMPONENTE PRINCIPAL ════════════════════════ */

export const World2D: React.FC<World2DProps> = ({ currentScene, sceneLocalFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Line-boil tradicional a 15fps
  const stepFrame = Math.floor(frame / 4);
  const boilX = Math.sin(stepFrame * 13.37) * 1.2;
  const boilY = Math.cos(stepFrame * 17.51) * 1.2;
  const boilRot = ((stepFrame % 3) - 1) * 0.25;

  const s = clamp(Math.round(currentScene), 0, 9);
  const L = sceneLocalFrame;
  const dur = SCENE_END[s] - SCENE_START[s];
  // corte seco en el loop (escena 9 → escena 0), fundido en el resto
  const fade = (s === 0 ? 1 : prog(L, 0, 8)) * (s === 9 ? 1 : 1 - prog(L, dur - 8, dur));
  const Cur = SCENE_COMPONENTS[s];
  const offset = frame - sceneLocalFrame;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        width: 1080,
        height: 1920,
        backgroundColor: "#0B0E14",
        overflow: "hidden",
        transform: `translate(${boilX}px, ${boilY}px) rotate(${boilRot}deg)`,
      }}
    >
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0 }}>
        <Defs seed={stepFrame % 7} />
        <g filter="url(#boil)" opacity={fade}>
          <Cur L={L} fps={fps} f={frame} />
        </g>
      </svg>

      {(VFX_EVENTS[s] ?? []).map((e, i) => (
        <VfxSprite key={i} file={e.file} x={e.x} y={e.y} size={e.size} k={prog(L, e.f, e.f + 30, Easing.linear)} />
      ))}

      {SFX_LIST.filter((x) => x.scene === s).map((x, i) => (
        <Sequence key={i} from={offset + x.f} durationInFrames={Math.max(30, dur - x.f)} layout="none">
          <Audio src={staticFile(`${SFX_DIR}/${x.file}`)} />
        </Sequence>
      ))}

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow: "inset 0 0 160px rgba(0, 0, 0, 0.85)",
          pointerEvents: "none",
          zIndex: 50,
        }}
      />
    </div>
  );
};

export default World2D;
