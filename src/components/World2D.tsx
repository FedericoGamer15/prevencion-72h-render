import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme";

interface World2DProps {
  currentScene: number; // 0 a 7
  sceneLocalFrame: number;
}

export const World2D: React.FC<World2DProps> = ({ currentScene, sceneLocalFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Micro-movimiento continuo global (respiración del lienzo)
  const idleGlobalY = Math.sin(frame * 0.04) * 4;
  const idleGlobalScale = 1 + Math.sin(frame * 0.03) * 0.008;

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: 1080,
        height: 1920,
        backgroundColor: THEME.colors.bg,
        overflow: "hidden",
        pointerEvents: "none",
        transform: `translateY(${idleGlobalY}px) scale(${idleGlobalScale})`,
        transformOrigin: "center center",
      }}
    >
      {/* ========================================================================= */}
      {/* CAPA 1: FONDO ATMOSFÉRICO CINEMATOGRÁFICO Y RETÍCULA VECTORIAL */}
      {/* ========================================================================= */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 45%, #162447 0%, ${THEME.colors.bg} 80%)`,
        }}
      />

      {/* Retícula de coordenadas militares HUD */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          opacity: 0.18,
        }}
      >
        <defs>
          <pattern id="gridPattern2D" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke={THEME.colors.cyan} strokeWidth="1" strokeDasharray="2 4" />
            <circle cx="80" cy="80" r="1.5" fill={THEME.colors.cyan} />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#gridPattern2D)" />
      </svg>

      {/* Marcas angulares de visor táctico (HUD Brackets) */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          opacity: 0.35,
        }}
      >
        {/* Esquinas superiores */}
        <path d="M 60 220 L 60 180 L 100 180" fill="none" stroke={THEME.colors.cyan} strokeWidth="3" />
        <path d="M 1020 220 L 1020 180 L 980 180" fill="none" stroke={THEME.colors.cyan} strokeWidth="3" />
        {/* Esquinas inferiores */}
        <path d="M 60 1700 L 60 1740 L 100 1740" fill="none" stroke={THEME.colors.cyan} strokeWidth="3" />
        <path d="M 1020 1700 L 1020 1740 L 980 1740" fill="none" stroke={THEME.colors.cyan} strokeWidth="3" />
      </svg>

      {/* ========================================================================= */}
      {/* ESCENA 1: EL GANCHO | RADAR GEOPOLÍTICO Y FOCO BÉLICO (0 a 14.5s) */}
      {/* ========================================================================= */}
      {currentScene === 0 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Radar militar central con física de entrada */}
          {(() => {
            const radarSpring = spring({
              frame: sceneLocalFrame,
              fps,
              config: { damping: 14, stiffness: 100 },
            });
            const sweepAngle = (sceneLocalFrame * 4.5) % 360;

            return (
              <div
                style={{
                  position: "absolute",
                  top: 760,
                  left: 540,
                  transform: `translate(-50%, -50%) scale(${0.7 + 0.3 * radarSpring})`,
                  opacity: Math.min(1, radarSpring * 1.5),
                }}
              >
                {/* SVG de Radar con anillos concéntricos graduados */}
                <svg width="800" height="800" viewBox="-400 -400 800 800">
                  {/* Círculos concéntricos de rango */}
                  {[120, 220, 320, 380].map((r, idx) => (
                    <circle
                      key={idx}
                      cx="0"
                      cy="0"
                      r={r}
                      fill="none"
                      stroke={THEME.colors.alert}
                      strokeWidth={idx === 3 ? "2.5" : "1"}
                      strokeDasharray={idx % 2 === 0 ? "8 6" : "none"}
                      opacity={0.35 + 0.15 * Math.sin(frame * 0.08 + idx)}
                    />
                  ))}

                  {/* Ejes cartesianos cruzados */}
                  <line x1="-390" y1="0" x2="390" y2="0" stroke={THEME.colors.alert} strokeWidth="1" opacity="0.4" strokeDasharray="4 4" />
                  <line x1="0" y1="-390" x2="0" y2="390" stroke={THEME.colors.alert} strokeWidth="1" opacity="0.4" strokeDasharray="4 4" />

                  {/* Marcas angulares a 45 grados */}
                  <line x1="-260" y1="-260" x2="260" y2="260" stroke={THEME.colors.alert} strokeWidth="1" opacity="0.2" />
                  <line x1="-260" y1="260" x2="260" y2="-260" stroke={THEME.colors.alert} strokeWidth="1" opacity="0.2" />

                  {/* Haz de radar cónico giratorio */}
                  <defs>
                    <radialGradient id="radarBeam" cx="0%" cy="0%" r="100%">
                      <stop offset="0%" stopColor={THEME.colors.alert} stopOpacity="0.5" />
                      <stop offset="100%" stopColor={THEME.colors.alert} stopOpacity="0.0" />
                    </radialGradient>
                  </defs>
                  <path
                    d={`M 0 0 L ${Math.cos(((sweepAngle - 45) * Math.PI) / 180) * 380} ${
                      Math.sin(((sweepAngle - 45) * Math.PI) / 180) * 380
                    } A 380 380 0 0 1 ${Math.cos((sweepAngle * Math.PI) / 180) * 380} ${
                      Math.sin((sweepAngle * Math.PI) / 180) * 380
                    } Z`}
                    fill="url(#radarBeam)"
                  />

                  {/* Foco de impacto: Irán / Golfo */}
                  <g transform="translate(130, -90)">
                    {/* Ondas sísmicas de alerta expansivas */}
                    {[1, 2, 3].map((pulseRing) => {
                      const ringProgress = ((sceneLocalFrame * 0.05 + pulseRing * 0.33) % 1);
                      return (
                        <circle
                          key={pulseRing}
                          cx="0"
                          cy="0"
                          r={ringProgress * 90}
                          fill="none"
                          stroke={THEME.colors.alert}
                          strokeWidth="2"
                          opacity={1 - ringProgress}
                        />
                      );
                    })}
                    {/* Punto focal */}
                    <circle cx="0" cy="0" r="10" fill={THEME.colors.alert} />
                    <circle cx="0" cy="0" r="24" fill="none" stroke={THEME.colors.alert} strokeWidth="3" />
                  </g>
                </svg>

                {/* Coordenadas HUD dinámicas flotantes */}
                <div
                  style={{
                    position: "absolute",
                    top: 260,
                    left: 480,
                    fontFamily: THEME.fonts.mono,
                    fontSize: 20,
                    color: THEME.colors.alert,
                    letterSpacing: 2,
                    fontWeight: 800,
                    textShadow: `0 0 12px ${THEME.colors.alert}`,
                  }}
                >
                  TARGET: IRAN [32.4279° N]
                  <div style={{ fontSize: 14, color: THEME.colors.warning, marginTop: 4 }}>
                    STATUS: ESCALATION DETECTED
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Tipografía Cinética Gigante de Fondo (No caja de PowerPoint) */}
          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 60,
              right: 60,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: THEME.fonts.main,
                fontSize: 68,
                fontWeight: 900,
                color: THEME.colors.white,
                lineHeight: 1.05,
                letterSpacing: -1,
                textTransform: "uppercase",
                opacity: interpolate(sceneLocalFrame, [20, 60], [0, 1], { extrapolateRight: "clamp" }),
                transform: `translateY(${Math.max(0, 50 - sceneLocalFrame * 2)}px)`,
              }}
            >
              ALERTA GLOBAL
            </div>
            <div
              style={{
                fontFamily: THEME.fonts.mono,
                fontSize: 26,
                fontWeight: 700,
                color: THEME.colors.cyan,
                letterSpacing: 4,
                textTransform: "uppercase",
                opacity: interpolate(sceneLocalFrame, [40, 80], [0, 1], { extrapolateRight: "clamp" }),
              }}
            >
              NO ES EL FIN DEL MUNDO • ES RESILIENCIA
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 2: CADENAS DE SUMINISTRO | ESTRECHO DE ORMUZ (14.5 a 39.0s) */}
      {/* ========================================================================= */}
      {currentScene === 1 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Cartografía Vectorial Estilizada con buque en movimiento */}
          <svg
            style={{
              position: "absolute",
              top: 360,
              left: 40,
              width: 1000,
              height: 780,
            }}
            viewBox="0 0 1000 780"
          >
            <defs>
              {/* Gradiente para masa continental de Irán */}
              <linearGradient id="iranLand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#223354" />
                <stop offset="100%" stopColor="#152238" />
              </linearGradient>
              <linearGradient id="arabianLand" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#152238" />
                <stop offset="100%" stopColor="#223354" />
              </linearGradient>
            </defs>

            {/* Costa Norte (Irán) */}
            <path
              d="M 0 0 L 1000 0 L 1000 240 Q 720 320 520 200 Q 320 120 0 190 Z"
              fill="url(#iranLand)"
              stroke={THEME.colors.cyan}
              strokeWidth="3"
            />
            <text x="680" y="110" fill={THEME.colors.cyan} fontSize="34" fontWeight="900" fontFamily={THEME.fonts.mono} letterSpacing="4">
              IRÁN
            </text>

            {/* Costa Sur (Omán / EAU) */}
            <path
              d="M 0 780 L 1000 780 L 1000 520 Q 700 420 520 540 Q 340 640 0 570 Z"
              fill="url(#arabianLand)"
              stroke={THEME.colors.cyan}
              strokeWidth="3"
            />
            <text x="220" y="700" fill={THEME.colors.cyan} fontSize="34" fontWeight="900" fontFamily={THEME.fonts.mono} letterSpacing="4">
              OMÁN / EAU
            </text>

            {/* Canal de agua con corrientes oceánicas fluidas */}
            {[0, 1, 2].map((flowIdx) => (
              <path
                key={flowIdx}
                d={`M 60 ${340 + flowIdx * 45} Q 320 ${350 + flowIdx * 40} 520 ${355 + flowIdx * 45} Q 740 ${
                  360 + flowIdx * 40
                } 940 ${340 + flowIdx * 45}`}
                fill="none"
                stroke={THEME.colors.cyan}
                strokeWidth="2.5"
                strokeDasharray="18 24"
                strokeDashoffset={-sceneLocalFrame * (3 + flowIdx * 1.5)}
                opacity={0.35}
              />
            ))}

            {/* Barrera láser de bloqueo en el cuello de botella */}
            <g transform="translate(520, 0)">
              <line
                x1="0"
                y1="200"
                x2="0"
                y2="540"
                stroke={THEME.colors.alert}
                strokeWidth="6"
                strokeDasharray="12 8"
                opacity={0.5 + 0.5 * Math.sin(frame * 0.25)}
              />
              <circle cx="0" cy="370" r="16" fill={THEME.colors.alert} />
              <circle cx="0" cy="370" r="32" fill="none" stroke={THEME.colors.alert} strokeWidth="3" opacity="0.6" />
            </g>

            {/* Buque Petrolero Vectorial en navegación */}
            {(() => {
              const shipX = interpolate(sceneLocalFrame, [0, 800], [120, 470], { extrapolateRight: "clamp" });
              const shipY = 370 + Math.sin(sceneLocalFrame * 0.08) * 6;
              const isBlocked = shipX >= 460;

              return (
                <g transform={`translate(${shipX}, ${shipY})`}>
                  {/* Estela de agua trasera */}
                  <path d="M -70 -15 L -120 -30 M -70 15 L -120 30" stroke={THEME.colors.cyan} strokeWidth="2.5" opacity="0.5" />
                  {/* Casco del petrolero */}
                  <path
                    d="M 60 0 L 35 -24 L -65 -24 Q -75 -24 -75 -10 L -75 10 Q -75 24 -65 24 L 35 24 Z"
                    fill={isBlocked ? THEME.colors.alert : THEME.colors.white}
                    stroke="#000"
                    strokeWidth="3"
                  />
                  {/* Tanques de carga sobre cubierta */}
                  {[-45, -15, 15].map((tankX, tIdx) => (
                    <circle key={tIdx} cx={tankX} cy="0" r="12" fill={THEME.colors.warning} />
                  ))}
                  {/* Torre de control */}
                  <rect x="-65" y="-12" width="14" height="24" rx="3" fill="#1C2541" />
                </g>
              );
            })()}
          </svg>

          {/* Gráfico de flujo de suministro colapsando */}
          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 80,
              right: 80,
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontFamily: THEME.fonts.mono, fontSize: 24, color: THEME.colors.warning, fontWeight: 800 }}>
                FLUJO DE PETRÓLEO // 20% GLOBAL
              </span>
              <span
                style={{
                  fontFamily: THEME.fonts.mono,
                  fontSize: 42,
                  color: THEME.colors.alert,
                  fontWeight: 900,
                }}
              >
                -{Math.min(85, Math.floor(sceneLocalFrame * 0.15))}%
              </span>
            </div>

            {/* Barra de progreso de suministro que se vacía */}
            <div
              style={{
                width: "100%",
                height: 16,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${Math.max(15, 100 - sceneLocalFrame * 0.12)}%`,
                  height: "100%",
                  background: `linear-gradient(90deg, ${THEME.colors.warning} 0%, ${THEME.colors.alert} 100%)`,
                }}
              />
            </div>
            <div style={{ fontFamily: THEME.fonts.main, fontSize: 28, color: THEME.colors.white, fontWeight: 700, textAlign: "center", marginTop: 8 }}>
              EFECTO DOMINÓ: FERTILIZANTES • ALIMENTOS • SUPERMERCADOS
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 3: GUERRA HÍBRIDA Y CIBERATAQUES | APAGÓN DE INFRAESTRUCTURA (39 a 65s) */}
      {/* ========================================================================= */}
      {currentScene === 2 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Silueta de Metrópolis e Infraestructura Crítica que sufre Blackout */}
          <svg
            style={{
              position: "absolute",
              top: 380,
              left: 40,
              width: 1000,
              height: 750,
            }}
            viewBox="0 0 1000 750"
          >
            {/* Edificios metropolitanos geométricos */}
            {[
              { x: 60, w: 90, h: 280 },
              { x: 170, w: 120, h: 420 },
              { x: 310, w: 85, h: 320 },
              { x: 415, w: 150, h: 480 },
              { x: 585, w: 110, h: 380 },
              { x: 715, w: 130, h: 440 },
              { x: 865, w: 80, h: 260 },
            ].map((bld, idx) => {
              const isBlackout = sceneLocalFrame > 200 + idx * 30;
              return (
                <g key={idx} transform={`translate(${bld.x}, ${700 - bld.h})`}>
                  <rect
                    width={bld.w}
                    height={bld.h}
                    fill={isBlackout ? "#0c1527" : "#1b2845"}
                    stroke={isBlackout ? THEME.colors.alert : THEME.colors.cyan}
                    strokeWidth="2"
                    opacity={isBlackout ? 0.4 : 0.85}
                  />
                  {/* Ventanas luminosas que se apagan */}
                  {!isBlackout && (
                    <g opacity="0.7">
                      {[1, 2, 3, 4, 5].map((row) => (
                        <circle key={row} cx={bld.w / 2} cy={row * 45} r="4" fill={THEME.colors.warning} />
                      ))}
                    </g>
                  )}
                </g>
              );
            })}

            {/* Torre de Telecomunicaciones central */}
            <g transform="translate(490, 120)">
              <line x1="0" y1="0" x2="-35" y2="100" stroke={THEME.colors.alert} strokeWidth="3" />
              <line x1="0" y1="0" x2="35" y2="100" stroke={THEME.colors.alert} strokeWidth="3" />
              <line x1="-25" y1="60" x2="25" y2="60" stroke={THEME.colors.alert} strokeWidth="3" />
              <circle cx="0" cy="0" r="8" fill={THEME.colors.alert} />

              {/* Ondas electromagnéticas fallando / glitch */}
              {[30, 60, 90].map((wR, wIdx) => (
                <circle
                  key={wIdx}
                  cx="0"
                  cy="0"
                  r={wR}
                  fill="none"
                  stroke={THEME.colors.alert}
                  strokeWidth="2.5"
                  strokeDasharray="8 6"
                  opacity={sceneLocalFrame > 150 ? 0.3 * Math.sin(frame * 0.4) : 0.7}
                />
              ))}
            </g>

            {/* Rayos de Ciberataque Vectorial */}
            {sceneLocalFrame > 80 && sceneLocalFrame < 400 && (
              <path
                d="M 120 80 L 260 220 L 490 120 L 640 280 L 800 160"
                fill="none"
                stroke={THEME.colors.alert}
                strokeWidth="5"
                strokeDasharray="14 10"
                opacity={0.8 + 0.2 * Math.sin(frame * 0.6)}
              />
            )}
          </svg>

          {/* Indicadores de Infraestructura Colapsando */}
          <div
            style={{
              position: "absolute",
              top: 1160,
              left: 60,
              right: 60,
              display: "flex",
              justifyContent: "space-around",
            }}
          >
            {[
              { name: "RED ELÉCTRICA", status: sceneLocalFrame > 150 ? "OFFLINE" : "STABLE", color: sceneLocalFrame > 150 ? THEME.colors.alert : THEME.colors.emerald },
              { name: "SISTEMA BANCARIO", status: sceneLocalFrame > 220 ? "CORRUPTED" : "ONLINE", color: sceneLocalFrame > 220 ? THEME.colors.alert : THEME.colors.cyan },
              { name: "TELEFONÍA MÓVIL", status: sceneLocalFrame > 300 ? "NO SIGNAL" : "ACTIVE", color: sceneLocalFrame > 300 ? THEME.colors.alert : THEME.colors.warning },
            ].map((srv, sIdx) => (
              <div key={sIdx} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: THEME.fonts.mono, fontSize: 16, color: THEME.colors.slate, letterSpacing: 2 }}>
                  {srv.name}
                </div>
                <div
                  style={{
                    fontFamily: THEME.fonts.mono,
                    fontSize: 28,
                    fontWeight: 900,
                    color: srv.color,
                    marginTop: 6,
                    textShadow: `0 0 10px ${srv.color}`,
                  }}
                >
                  {srv.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 4: LA REGLA DE LAS 72 HORAS | CRONÓMETRO DE SUPERVIVENCIA (65 a 90s) */}
      {/* ========================================================================= */}
      {currentScene === 3 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Cronómetro Gigante Circular con dial rotatorio */}
          <div
            style={{
              position: "absolute",
              top: 720,
              left: 540,
              transform: "translate(-50%, -50%)",
            }}
          >
            <svg width="700" height="700" viewBox="-350 -350 700 700">
              {/* Dial externo con 72 muescas */}
              {Array.from({ length: 72 }).map((_, tickIdx) => {
                const tickAngle = (tickIdx * 360) / 72;
                const isMajor = tickIdx % 12 === 0;
                return (
                  <line
                    key={tickIdx}
                    x1={Math.cos((tickAngle * Math.PI) / 180) * (isMajor ? 270 : 285)}
                    y1={Math.sin((tickAngle * Math.PI) / 180) * (isMajor ? 270 : 285)}
                    x2={Math.cos((tickAngle * Math.PI) / 180) * 300}
                    y2={Math.sin((tickAngle * Math.PI) / 180) * 300}
                    stroke={isMajor ? THEME.colors.cyan : THEME.colors.slate}
                    strokeWidth={isMajor ? "4" : "1.5"}
                  />
                );
              })}

              {/* Anillo de cuenta regresiva que se vacía */}
              {(() => {
                const timeProgress = Math.min(1, sceneLocalFrame / 1200);
                const strokeDash = 2 * Math.PI * 250;
                return (
                  <circle
                    cx="0"
                    cy="0"
                    r="250"
                    fill="none"
                    stroke={THEME.colors.warning}
                    strokeWidth="12"
                    strokeDasharray={strokeDash}
                    strokeDashoffset={strokeDash * timeProgress}
                    transform="rotate(-90)"
                  />
                );
              })()}

              {/* Manecilla giratoria del cronógrafo */}
              <line
                x1="0"
                y1="0"
                x2={Math.cos(((sceneLocalFrame * 3 - 90) * Math.PI) / 180) * 230}
                y2={Math.sin(((sceneLocalFrame * 3 - 90) * Math.PI) / 180) * 230}
                stroke={THEME.colors.alert}
                strokeWidth="4"
              />
              <circle cx="0" cy="0" r="14" fill={THEME.colors.alert} />
            </svg>

            {/* Número Colosal Central: 72 HORAS */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontFamily: THEME.fonts.main,
                  fontSize: 120,
                  fontWeight: 900,
                  color: THEME.colors.white,
                  lineHeight: 0.9,
                  letterSpacing: -2,
                }}
              >
                72H
              </div>
              <div
                style={{
                  fontFamily: THEME.fonts.mono,
                  fontSize: 22,
                  fontWeight: 800,
                  color: THEME.colors.emerald,
                  letterSpacing: 4,
                  marginTop: 10,
                }}
              >
                AUTOSUFICIENCIA FAMILIAR
              </div>
            </div>
          </div>

          {/* Subtítulo Dinámico de Oxígeno para el Estado */}
          <div
            style={{
              position: "absolute",
              top: 1200,
              left: 60,
              right: 60,
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: THEME.fonts.main,
                fontSize: 34,
                fontWeight: 800,
                color: THEME.colors.cyan,
                lineHeight: 1.3,
              }}
            >
              "TU FAMILIA AUTÓNOMA PERMITE SALVAR HOSPITALES Y EMERGENCIAS SIN COLAPSAR EL ESTADO"
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 5: MODELO NÓRDICO Y CAUSAS GLOBALES | SISMOS Y DEFENSA TOTAL (90 a 120s) */}
      {/* ========================================================================= */}
      {currentScene === 4 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Siluetas de Escandinavia vs. Falla Tectónica Sísmica */}
          <svg
            style={{
              position: "absolute",
              top: 380,
              left: 40,
              width: 1000,
              height: 750,
            }}
            viewBox="0 0 1000 750"
          >
            {/* Escudos de Defensa Total (Suecia / Finlandia / Noruega) */}
            {[
              { name: "SUECIA", x: 200, y: 220, color: THEME.colors.cyan },
              { name: "FINLANDIA", x: 500, y: 160, color: THEME.colors.emerald },
              { name: "NORUEGA", x: 800, y: 220, color: THEME.colors.warning },
            ].map((shield, shIdx) => (
              <g key={shIdx} transform={`translate(${shield.x}, ${shield.y})`}>
                <path
                  d="M 0 -60 L 45 -40 L 45 20 Q 45 65 0 90 Q -45 65 -45 20 L -45 -40 Z"
                  fill="rgba(0, 245, 212, 0.12)"
                  stroke={shield.color}
                  strokeWidth="3.5"
                />
                <circle cx="0" cy="5" r="16" fill="none" stroke={shield.color} strokeWidth="3" />
                <text x="0" y="130" fill={THEME.colors.white} fontSize="22" fontWeight="800" fontFamily={THEME.fonts.mono} textAnchor="middle">
                  {shield.name}
                </text>
              </g>
            ))}

            {/* Sismógrafo en tiempo real para México, Japón y Chile */}
            <g transform="translate(100, 520)">
              {/* Eje de tiempo sismográfico */}
              <line x1="0" y1="0" x2="800" y2="0" stroke={THEME.colors.slate} strokeWidth="2" strokeDasharray="4 4" />
              {/* Onda sísmica sinusoidal viva */}
              <path
                d={Array.from({ length: 80 }).reduce<string>((acc, _, pIdx) => {
                  const px = pIdx * 10;
                  const amp = pIdx > 30 && pIdx < 60 ? Math.sin((pIdx + sceneLocalFrame * 0.2) * 1.5) * 60 : Math.sin(pIdx * 0.5) * 8;
                  return `${acc} ${pIdx === 0 ? "M" : "L"} ${px} ${amp}`;
                }, "")}
                fill="none"
                stroke={THEME.colors.alert}
                strokeWidth="3"
              />
              <text x="400" y="90" fill={THEME.colors.alert} fontSize="24" fontWeight="800" fontFamily={THEME.fonts.mono} textAnchor="middle">
                LATAM Y ASIA: SISMOS • HURACANES • INUNDACIONES
              </text>
            </g>
          </svg>

          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 60,
              right: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: THEME.fonts.main, fontSize: 32, fontWeight: 800, color: THEME.colors.white }}>
              NO ES PARANOIA BÉLICA: ES PROTECCIÓN CIVIL UNIVERSAL
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 6: KIT BÁSICO - PARTE 1 | AGUA, COMIDA, LUZ (120 a 145s) */}
      {/* ========================================================================= */}
      {currentScene === 5 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Tríada de Vectores del Kit: Bidón de Agua + Ración + Linterna/Radio */}
          <svg
            style={{
              position: "absolute",
              top: 340,
              left: 40,
              width: 1000,
              height: 800,
            }}
            viewBox="0 0 1000 800"
          >
            {/* 1. Bidón Táctico de Agua (Izquierda) */}
            {(() => {
              const waterSpring = spring({ frame: sceneLocalFrame, fps, config: { damping: 12 } });
              const fillLevel = interpolate(sceneLocalFrame, [20, 180], [10, 85], { extrapolateRight: "clamp" });
              return (
                <g transform={`translate(180, 280) scale(${waterSpring})`}>
                  {/* Cuerpo del bidón */}
                  <rect x="-70" y="-100" width="140" height="200" rx="20" fill="none" stroke={THEME.colors.cyan} strokeWidth="4" />
                  <rect x="-30" y="-125" width="60" height="25" rx="6" fill={THEME.colors.cyan} />
                  {/* Agua interior con oleaje animado */}
                  <rect
                    x="-62"
                    y={90 - fillLevel * 1.8}
                    width="124"
                    height={fillLevel * 1.8}
                    rx="10"
                    fill="rgba(0, 245, 212, 0.4)"
                  />
                  <text x="0" y="140" fill={THEME.colors.cyan} fontSize="24" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    9 LITROS (3 DÍAS)
                  </text>
                </g>
              );
            })()}

            {/* 2. Ración Compacta / Lata Sellada (Centro) */}
            {(() => {
              const foodSpring = spring({ frame: sceneLocalFrame - 60, fps, config: { damping: 12 } });
              return (
                <g transform={`translate(500, 280) scale(${Math.max(0, foodSpring)})`}>
                  {/* Silueta de lata de supervivencia */}
                  <ellipse cx="0" cy="-60" rx="75" ry="35" fill="none" stroke={THEME.colors.warning} strokeWidth="4" />
                  <ellipse cx="0" cy="70" rx="75" ry="35" fill="none" stroke={THEME.colors.warning} strokeWidth="4" />
                  <line x1="-75" y1="-60" x2="-75" y2="70" stroke={THEME.colors.warning} strokeWidth="4" />
                  <line x1="75" y1="-60" x2="75" y2="70" stroke={THEME.colors.warning} strokeWidth="4" />
                  {/* Anilla de abre-fácil */}
                  <circle cx="0" cy="-60" r="14" fill="none" stroke={THEME.colors.warning} strokeWidth="3" />
                  <text x="0" y="140" fill={THEME.colors.warning} fontSize="24" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    NO PERECEDEROS
                  </text>
                </g>
              );
            })()}

            {/* 3. Linterna Táctica y Radio Manivela (Derecha) */}
            {(() => {
              const radioSpring = spring({ frame: sceneLocalFrame - 120, fps, config: { damping: 12 } });
              return (
                <g transform={`translate(820, 280) scale(${Math.max(0, radioSpring)})`}>
                  {/* Linterna táctica con haz volumétrico */}
                  <rect x="-40" y="-90" width="80" height="110" rx="10" fill="none" stroke={THEME.colors.orange} strokeWidth="4" />
                  {/* Cono de luz volumétrico */}
                  <path d="M -40 -90 L -120 -230 L 120 -230 L 40 -90 Z" fill="rgba(249, 115, 22, 0.25)" />
                  {/* Radio analógica con antena */}
                  <line x1="25" y1="20" x2="65" y2="-50" stroke={THEME.colors.orange} strokeWidth="3" />
                  <circle cx="65" cy="-50" r="4" fill={THEME.colors.orange} />
                  <rect x="-55" y="20" width="110" height="70" rx="8" fill="none" stroke={THEME.colors.orange} strokeWidth="3.5" />
                  <circle cx="-15" cy="55" r="18" fill="none" stroke={THEME.colors.orange} strokeWidth="2.5" />
                  <text x="0" y="140" fill={THEME.colors.orange} fontSize="24" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    LUZ + RADIO AM/FM
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Gran Tipografía Cinética Descriptiva */}
          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 60,
              right: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: THEME.fonts.main, fontSize: 36, fontWeight: 900, color: THEME.colors.white }}>
              AUTONOMÍA VITAL BÁSICA
            </div>
            <div style={{ fontFamily: THEME.fonts.mono, fontSize: 22, color: THEME.colors.cyan, marginTop: 8 }}>
              2 A 3 LITROS DE AGUA POR DÍA • CALORÍAS LISTAS • COMUNICACIÓN ANÁLOGA
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 7: KIT BÁSICO - PARTE 2 | SALUD, EFECTIVO, DOCUMENTOS (145 a 165s) */}
      {/* ========================================================================= */}
      {currentScene === 6 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Ilustración Vectorial: Maletín Médico + Cartera de Respaldo Físico */}
          <svg
            style={{
              position: "absolute",
              top: 360,
              left: 40,
              width: 1000,
              height: 780,
            }}
            viewBox="0 0 1000 780"
          >
            {/* Maletín Botiquín de Primeros Auxilios (Izquierda) */}
            {(() => {
              const medSpring = spring({ frame: sceneLocalFrame, fps, config: { damping: 14 } });
              return (
                <g transform={`translate(280, 320) scale(${medSpring})`}>
                  <rect x="-130" y="-100" width="260" height="200" rx="24" fill="none" stroke={THEME.colors.purple} strokeWidth="5" />
                  <rect x="-50" y="-140" width="100" height="40" rx="8" fill="none" stroke={THEME.colors.purple} strokeWidth="4" />
                  {/* Cruz Médica de Socorro */}
                  <path
                    d="M -20 -40 L 20 -40 L 20 -15 L 45 -15 L 45 25 L 20 25 L 20 50 L -20 50 L -20 25 L -45 25 L -45 -15 L -20 -15 Z"
                    fill={THEME.colors.purple}
                  />
                  <text x="0" y="150" fill={THEME.colors.purple} fontSize="26" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    BOTIQUÍN + MEDICACIÓN
                  </text>
                </g>
              );
            })()}

            {/* Efectivo Físico y Documentos Herméticos (Derecha) */}
            {(() => {
              const cashSpring = spring({ frame: sceneLocalFrame - 50, fps, config: { damping: 14 } });
              return (
                <g transform={`translate(720, 320) scale(${Math.max(0, cashSpring)})`}>
                  {/* Bolsa hermética estanca */}
                  <rect x="-130" y="-110" width="260" height="220" rx="14" fill="rgba(16, 185, 129, 0.12)" stroke={THEME.colors.emerald} strokeWidth="4" />
                  <line x1="-120" y1="-85" x2="120" y2="-85" stroke={THEME.colors.emerald} strokeWidth="4" strokeDasharray="6 4" />
                  {/* Billetes en efectivo */}
                  <rect x="-85" y="-45" width="170" height="90" rx="6" fill="none" stroke={THEME.colors.emerald} strokeWidth="3" />
                  <circle cx="0" cy="0" r="22" fill="none" stroke={THEME.colors.emerald} strokeWidth="2.5" />
                  <text x="0" y="7" fill={THEME.colors.emerald} fontSize="22" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    $
                  </text>
                  <text x="0" y="150" fill={THEME.colors.emerald} fontSize="26" fontWeight="900" fontFamily={THEME.fonts.mono} textAnchor="middle">
                    EFECTIVO + COPIAS ID
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Gran Tipografía Cinética */}
          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 60,
              right: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: THEME.fonts.main, fontSize: 34, fontWeight: 900, color: THEME.colors.white }}>
              SIN CAJEROS NI INTERNET EL EFECTIVO MANDA
            </div>
            <div style={{ fontFamily: THEME.fonts.mono, fontSize: 22, color: THEME.colors.emerald, marginTop: 8 }}>
              TRATAMIENTOS MÉDICOS CRÓNICOS • COPIAS DE IDENTIDAD RESGUARDADAS
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 8: CIERRE Y LOOP PERFECTO | PREPARACIÓN SIN PÁNICO (165 a 180s) */}
      {/* ========================================================================= */}
      {currentScene === 7 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Silueta de Ciudadano Resiliente y Red Comunitaria Conectada */}
          <svg
            style={{
              position: "absolute",
              top: 380,
              left: 40,
              width: 1000,
              height: 750,
            }}
            viewBox="0 0 1000 750"
          >
            {/* Nodos de red comunitaria interconectándose */}
            {[
              { cx: 200, cy: 300 },
              { cx: 350, cy: 180 },
              { cx: 650, cy: 180 },
              { cx: 800, cy: 300 },
              { cx: 500, cy: 450 },
            ].map((node, nIdx) => (
              <g key={nIdx}>
                <line x1="500" y1="280" x2={node.cx} y2={node.cy} stroke={THEME.colors.emerald} strokeWidth="2.5" strokeDasharray="6 6" />
                <circle cx={node.cx} cy={node.cy} r="12" fill={THEME.colors.emerald} />
              </g>
            ))}

            {/* Escudo de Protección Civil Central */}
            <g transform="translate(500, 280)">
              <circle cx="0" cy="0" r="75" fill="none" stroke={THEME.colors.emerald} strokeWidth="5" />
              <polygon points="0,-45 40,30 -40,30" fill={THEME.colors.cyan} />
            </g>

            {/* Conexión con el radar para Seamless Loop */}
            {sceneLocalFrame > 600 && (
              <circle
                cx="500"
                cy="280"
                r={interpolate(sceneLocalFrame, [600, 900], [75, 420], { extrapolateRight: "clamp" })}
                fill="none"
                stroke={THEME.colors.alert}
                strokeWidth="4"
                strokeDasharray="8 8"
                opacity={interpolate(sceneLocalFrame, [600, 900], [0, 1])}
              />
            )}
          </svg>

          {/* Llamado a la Acción y Cierre */}
          <div
            style={{
              position: "absolute",
              top: 1180,
              left: 60,
              right: 60,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: THEME.fonts.main, fontSize: 44, fontWeight: 900, color: THEME.colors.white }}>
              PREPARARSE ES RESPONSABILIDAD CIVIL
            </div>
            <div
              style={{
                fontFamily: THEME.fonts.mono,
                fontSize: 24,
                color: THEME.colors.emerald,
                fontWeight: 800,
                letterSpacing: 3,
                marginTop: 10,
              }}
            >
              COMPARTE ESTA GUÍA • PROTEGE A TU FAMILIA
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
