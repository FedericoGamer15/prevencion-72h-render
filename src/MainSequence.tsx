import React from "react";
import { useCurrentFrame } from "remotion";
import { World2D } from "./components/World2D";
import { AnimatedCaptions } from "./components/AnimatedCaptions";
import { Soundtrack } from "./audio/Soundtrack";

// 9 escenas sincronizadas a 60 fps (Total 3600 frames = 60.00 segundos)
export const SCENE_DURATIONS = [
  250, // s0: El Choque Conceptual (El Ojo y PV=nRT)
  225, // s1: El Despertar Isekai (Espejo y Chispa)
  424, // s2: La Ineficiencia del Cántico (Ignis Magna)
  494, // s3: El Diagnóstico del Ingeniero (Blueprint)
  612, // s4: Termodinámica y Compresión Adiabática (Plasma Azul)
  592, // s5: Del Hechizo al Cañón de Riel (Railgun)
  332, // s6: Detonación Termobárica
  348, // s7: Leyes del Cosmos (Mandala Periódico)
  323, // s8: Loop & Call to Action (Chasquido)
];

export const SCENE_OFFSETS = SCENE_DURATIONS.reduce(
  (acc, dur, i) => {
    acc.push(acc[i] + dur);
    return acc;
  },
  [0]
);

const SCENE_HIGHLIGHTS: Record<string, string[]> = {
  s0: ["ingeniero", "destruiría", "semana", "mágico"],
  s1: ["noble", "exiliado", "poco", "maná"],
  s2: ["fuego", "lenta", "dispersa", "versos"],
  s3: ["misterio", "ingeniero", "combustión", "noventa"],
  s4: ["termodinámica", "oxígeno", "microscópica", "plasma"],
  s5: ["electromagnetismo", "moneda", "cañón", "riel", "hipersónico"],
  s6: ["electrólisis", "ignición", "termobárica", "maná"],
  s7: ["fe", "ciencia", "leyes", "cosmos"],
  s8: ["conocimiento", "código", "trucos", "principio", "físico"],
};

export const MainSequence: React.FC = () => {
  const frame = useCurrentFrame();

  // Determinar la escena activa
  let activeScene = 0;
  for (let i = 0; i < SCENE_DURATIONS.length; i++) {
    if (frame >= SCENE_OFFSETS[i] && frame < SCENE_OFFSETS[i + 1]) {
      activeScene = i;
      break;
    }
  }

  const activeLocalFrame = frame - SCENE_OFFSETS[activeScene];
  const activeSceneKey = `s${activeScene}`;

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: "#0B0E14",
      }}
    >
      {/* 1. Capa Visual Vectorial 2D (Sakuga Full Fluid & Multiplane) */}
      <World2D currentScene={activeScene} sceneLocalFrame={activeLocalFrame} />

      {/* 2. Subtítulos Dinámicos (Captions palabra por palabra con Kinetic Highlight) */}
      <AnimatedCaptions
        sceneKey={activeSceneKey}
        sceneStartFrame={SCENE_OFFSETS[activeScene]}
        highlights={SCENE_HIGHLIGHTS[activeSceneKey] || []}
      />

      {/* 3. Audio Maestro (Música con Ducking + Locución Fish Audio Sincronizada) */}
      <Soundtrack sceneOffsets={SCENE_OFFSETS.slice(0, 9)} />
    </div>
  );
};
