import React from "react";
import { useCurrentFrame } from "remotion";
import { World2D } from "./components/World2D";
import { TechnicalBadge } from "./components/TechnicalBadge";
import { AnimatedCaptions } from "./components/AnimatedCaptions";
import { Soundtrack } from "./audio/Soundtrack";

export const SCENE_DURATIONS = [870, 1470, 1560, 1500, 1800, 1500, 1200, 900];

export const SCENE_OFFSETS = SCENE_DURATIONS.reduce(
  (acc, dur, i) => {
    acc.push(acc[i] + dur);
    return acc;
  },
  [0]
);

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

  return (
    <div
      style={{
        position: "relative",
        width: 1080,
        height: 1920,
        overflow: "hidden",
        backgroundColor: "#0B132B",
      }}
    >
      {/* 1. Capa Visual Vectorial 2D */}
      <World2D currentScene={activeScene} sceneLocalFrame={activeLocalFrame} />

      {/* 2. Insignias Técnicas Superiores (Badges) */}
      {/* Escena 1 */}
      {activeScene === 0 && (
        <>
          <TechnicalBadge text="ALERTA VS. REALIDAD" variant="warning" appearAt={20} disappearAt={220} />
          <TechnicalBadge text="PROTOCOLOS GUBERNAMENTALES" variant="info" appearAt={220} disappearAt={520} />
          <TechnicalBadge text="RESILIENCIA SISTÉMICA" variant="positive" appearAt={540} disappearAt={840} />
        </>
      )}

      {/* Escena 2 */}
      {activeScene === 1 && (
        <>
          <TechnicalBadge text="ESTRECHO DE ORMUZ" variant="warning" appearAt={30} disappearAt={440} />
          <TechnicalBadge text="20% PETRÓLEO MUNDIAL" variant="info" appearAt={450} disappearAt={940} />
          <TechnicalBadge text="COMPRAS DE PÁNICO (48H)" variant="negative" appearAt={960} disappearAt={1420} />
        </>
      )}

      {/* Escena 3 */}
      {activeScene === 2 && (
        <>
          <TechnicalBadge text="GUERRA HÍBRIDA" variant="negative" appearAt={30} disappearAt={400} />
          <TechnicalBadge text="APAGÓN ELÉCTRICO Y DE DATOS" variant="negative" appearAt={420} disappearAt={900} />
          <TechnicalBadge text="COLAPSO DE BANCA Y AGUA" variant="warning" appearAt={920} disappearAt={1500} />
        </>
      )}

      {/* Escena 4 */}
      {activeScene === 3 && (
        <>
          <TechnicalBadge text="LA REGLA DE LAS 72 HORAS" variant="info" appearAt={20} disappearAt={380} />
          <TechnicalBadge text="VENTANA DE REORGANIZACIÓN" variant="info" appearAt={400} disappearAt={920} />
          <TechnicalBadge text="DESATURACIÓN DE EMERGENCIAS" variant="positive" appearAt={940} disappearAt={1440} />
        </>
      )}

      {/* Escena 5 */}
      {activeScene === 4 && (
        <>
          <TechnicalBadge text="DEFENSA TOTAL NÓRDICA" variant="info" appearAt={30} disappearAt={420} />
          <TechnicalBadge text="ESTÁNDAR UNIÓN EUROPEA" variant="info" appearAt={440} disappearAt={640} />
          <TechnicalBadge text="SISMOS Y CLIMA (MX • JP • CL)" variant="warning" appearAt={660} disappearAt={1250} />
          <TechnicalBadge text="RESILIENCIA UNIVERSAL" variant="positive" appearAt={1280} disappearAt={1740} />
        </>
      )}

      {/* Escena 6 */}
      {activeScene === 5 && (
        <>
          <TechnicalBadge text="INVENTARIO DE SUPERVIVENCIA" variant="info" appearAt={20} disappearAt={220} />
          <TechnicalBadge text="1. AGUA: 2-3L / DÍA (9L TOTAL)" variant="positive" appearAt={240} disappearAt={620} />
          <TechnicalBadge text="2. COMIDA SIN COCCIÓN" variant="positive" appearAt={640} disappearAt={1020} />
          <TechnicalBadge text="3. LINTERNA + RADIO AM/FM" variant="positive" appearAt={1040} disappearAt={1460} />
        </>
      )}

      {/* Escena 7 */}
      {activeScene === 6 && (
        <>
          <TechnicalBadge text="4. BOTIQUÍN Y MEDICACIÓN" variant="positive" appearAt={20} disappearAt={360} />
          <TechnicalBadge text="5. EFECTIVO EN BILLETES PEQUEÑOS" variant="positive" appearAt={380} disappearAt={720} />
          <TechnicalBadge text="DOCUMENTACIÓN HERMÉTICA" variant="positive" appearAt={740} disappearAt={1160} />
        </>
      )}

      {/* Escena 8 */}
      {activeScene === 7 && (
        <>
          <TechnicalBadge text="PREPARACIÓN = RESPONSABILIDAD" variant="positive" appearAt={20} disappearAt={400} />
          <TechnicalBadge text="AUTONOMÍA CIUDADANA" variant="positive" appearAt={420} disappearAt={820} />
        </>
      )}

      {/* 3. Subtítulos Dinámicos Palabra por Palabra */}
      <AnimatedCaptions
        sceneKey={(`s${activeScene + 1}`) as any}
        sceneStartFrame={SCENE_OFFSETS[activeScene]}
        highlights={[
          "GUERRA", "GOBIERNOS", "MOCHILA DE EMERGENCIA", "FIN DEL MUNDO", "CIENTÍFICA",
          "ESTRECHO DE ORMUZ", "QUINTA PARTE", "PETRÓLEO", "FERTILIZANTES", "PÁNICO", "CUARENTA Y OCHO HORAS",
          "CABLES SUBTERRÁNEOS", "CIBERATAQUES", "SUBESTACIONES", "ELECTRICIDAD", "AGUA POTABLE", "SETENTA Y DOS HORAS",
          "TRES DÍAS", "TIEMPO LOGÍSTICO", "PROTECCIÓN CIVIL", "AUTOSUFICIENTE", "HOSPITALES",
          "SUECIA", "FINLANDIA", "NORUEGA", "DEFENSA TOTAL", "MÉXICO", "JAPÓN", "CHILE", "RESILIENCIA",
          "AGUA POTABLE", "DOS A TRES LITROS", "NUEVE LITROS", "COMIDA NO PERECEDERA", "LINTERNA", "RADIO",
          "BOTIQUÍN", "MEDICACIÓN", "EFECTIVO", "BILLETES PEQUEÑOS", "DOCUMENTOS",
          "MIEDO", "CIUDADANÍA", "DESPENSA", "CRISIS GLOBAL"
        ]}
      />

      {/* 4. Banda Sonora y Locución */}
      <Soundtrack sceneOffsets={SCENE_OFFSETS} />
    </div>
  );
};
