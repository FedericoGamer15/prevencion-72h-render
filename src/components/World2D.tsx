import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { THEME } from "../theme";

interface World2DProps {
  currentScene: number; // 0 a 7
  sceneLocalFrame: number;
}

export const World2D: React.FC<World2DProps> = ({ currentScene, sceneLocalFrame }) => {
  const frame = useCurrentFrame();

  // Renderizado condicional según el bloque narrativo activo
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
      }}
    >
      {/* Fondo con gradiente dinámico */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 40%, rgba(28, 37, 65, 0.8) 0%, ${THEME.colors.bg} 85%)`,
        }}
      />

      {/* Retícula de fondo tecnológica sutil */}
      <svg
        style={{
          position: "absolute",
          inset: 0,
          width: 1080,
          height: 1920,
          opacity: 0.15,
        }}
      >
        <defs>
          <pattern id="gridPattern" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke={THEME.colors.cyan} strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1080" height="1920" fill="url(#gridPattern)" />
      </svg>

      {/* ========================================================================= */}
      {/* ESCENA 1: EL GANCHO | RADAR Y TITULARES (0 a 14.5s) */}
      {/* ========================================================================= */}
      {currentScene === 0 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Radar militar concéntrico */}
          <div
            style={{
              position: "absolute",
              top: 750,
              left: 540,
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Anillos concéntricos */}
            {[180, 320, 460, 600].map((r, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  top: -r,
                  left: -r,
                  width: r * 2,
                  height: r * 2,
                  borderRadius: "50%",
                  border: `2px dashed ${THEME.colors.alert}`,
                  opacity: 0.35 + 0.15 * Math.sin(frame * 0.05 + i),
                }}
              />
            ))}

            {/* Haz de radar giratorio */}
            <div
              style={{
                position: "absolute",
                top: -300,
                left: -300,
                width: 600,
                height: 600,
                borderRadius: "50%",
                background: `conic-gradient(from ${(frame * 3) % 360}deg, rgba(255, 42, 84, 0.4) 0deg, transparent 90deg)`,
              }}
            />

            {/* Punto de impacto: Irán / Golfo */}
            <div
              style={{
                position: "absolute",
                top: -20,
                left: 40,
                width: 40,
                height: 40,
                borderRadius: "50%",
                backgroundColor: THEME.colors.alert,
                boxShadow: `0 0 30px ${THEME.colors.alert}`,
                animation: "pulse 1s infinite",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -15,
                left: 95,
                fontFamily: THEME.fonts.mono,
                fontWeight: 900,
                fontSize: 24,
                color: THEME.colors.alert,
                letterSpacing: 2,
                textShadow: `0 0 10px ${THEME.colors.alert}`,
              }}
            >
              FOCO GEOPOLÍTICO [IRÁN]
            </div>
          </div>

          {/* Tarjetas de noticias flotantes que caen */}
          <div
            style={{
              position: "absolute",
              top: 1050,
              left: 100,
              right: 100,
              display: "flex",
              flexDirection: "column",
              gap: 16,
              transform: `translateY(${Math.max(0, 150 - sceneLocalFrame * 3)}px)`,
              opacity: interpolate(sceneLocalFrame, [20, 80], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <div
              style={{
                background: "rgba(28, 37, 65, 0.9)",
                borderLeft: `6px solid ${THEME.colors.alert}`,
                padding: "16px 24px",
                borderRadius: "0 12px 12px 0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
              }}
            >
              <div style={{ color: THEME.colors.alert, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
                URGENTE • MEDIO ORIENTE
              </div>
              <div style={{ color: THEME.colors.white, fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                Riesgo de escalada y tensión en el transporte marítimo
              </div>
            </div>

            <div
              style={{
                background: "rgba(28, 37, 65, 0.9)",
                borderLeft: `6px solid ${THEME.colors.cyan}`,
                padding: "16px 24px",
                borderRadius: "0 12px 12px 0",
                boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                transform: `translateX(${Math.sin(frame * 0.04) * 8}px)`,
              }}
            >
              <div style={{ color: THEME.colors.cyan, fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>
                PROTECCIÓN CIVIL • DIRECTRICES
              </div>
              <div style={{ color: THEME.colors.white, fontSize: 22, fontWeight: 800, marginTop: 4 }}>
                Recomiendan kit básico de autosuficiencia doméstica
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 2: CADENAS DE SUMINISTRO | ESTRECHO DE ORMUZ (14.5 a 39.0s) */}
      {/* ========================================================================= */}
      {currentScene === 1 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Estrecho de Ormuz estilizado */}
          <svg
            style={{
              position: "absolute",
              top: 400,
              left: 90,
              width: 900,
              height: 550,
            }}
            viewBox="0 0 900 550"
          >
            {/* Masa continental Norte (Irán) */}
            <path
              d="M 0 0 L 900 0 L 900 180 Q 600 240 450 160 Q 300 100 0 150 Z"
              fill={THEME.colors.slate}
              stroke={THEME.colors.cyan}
              strokeWidth="3"
            />
            <text x="600" y="80" fill={THEME.colors.cyan} fontSize="28" fontWeight="800" fontFamily={THEME.fonts.main}>
              IRÁN
            </text>

            {/* Masa continental Sur (Península Arábiga) */}
            <path
              d="M 0 550 L 900 550 L 900 380 Q 600 300 450 360 Q 300 420 0 390 Z"
              fill={THEME.colors.slate}
              stroke={THEME.colors.cyan}
              strokeWidth="3"
            />
            <text x="180" y="490" fill={THEME.colors.cyan} fontSize="28" fontWeight="800" fontFamily={THEME.fonts.main}>
              OMÁN / EAU
            </text>

            {/* Canal de agua con flujo */}
            <path
              d="M 50 260 Q 300 270 450 260 Q 600 250 850 270"
              fill="none"
              stroke={THEME.colors.warning}
              strokeWidth="6"
              strokeDasharray="20 15"
              strokeDashoffset={-sceneLocalFrame * 4}
            />

            {/* Barrera roja de bloqueo */}
            <line
              x1="450"
              y1="160"
              x2="450"
              y2="360"
              stroke={THEME.colors.alert}
              strokeWidth="8"
              strokeDasharray="10 8"
              opacity={0.6 + 0.4 * Math.sin(frame * 0.2)}
            />
            <circle cx="450" cy="260" r="14" fill={THEME.colors.alert} />

            {/* Barcos petroleros */}
            {[-120, 0, 120].map((offset, idx) => (
              <g
                key={idx}
                transform={`translate(${300 + offset + Math.min(0, sceneLocalFrame * 0.5)}, ${255 + idx * 8})`}
              >
                <rect x="-35" y="-12" width="70" height="24" rx="6" fill={THEME.colors.white} />
                <rect x="15" y="-8" width="12" height="16" fill={THEME.colors.alert} />
                <circle cx="-15" cy="0" r="4" fill={THEME.colors.warning} />
              </g>
            ))}
          </svg>

          {/* Rótulo de impacto económico */}
          <div
            style={{
              position: "absolute",
              top: 1000,
              left: 100,
              right: 100,
              background: "rgba(28, 37, 65, 0.95)",
              border: `2px solid ${THEME.colors.warning}`,
              borderRadius: 20,
              padding: "24px",
              textAlign: "center",
              boxShadow: `0 0 30px ${THEME.colors.warning}33`,
            }}
          >
            <div style={{ color: THEME.colors.warning, fontSize: 48, fontWeight: 900, fontFamily: THEME.fonts.main }}>
              20% DEL PETRÓLEO MUNDIAL
            </div>
            <div style={{ color: THEME.colors.white, fontSize: 24, fontWeight: 600, marginTop: 8 }}>
              Paso estrangulado: combustible + fertilizantes agrícolas
            </div>
            <div
              style={{
                marginTop: 16,
                padding: "8px 16px",
                background: "rgba(255, 42, 84, 0.2)",
                borderRadius: 10,
                color: THEME.colors.alert,
                fontSize: 20,
                fontWeight: 800,
                display: "inline-block",
              }}
            >
              RETRASO MARÍTIMO = COMPRAS DE PÁNICO EN 48H
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 3: GUERRA HÍBRIDA | CIBERATAQUES Y APAGÓN (39.0 a 65.0s) */}
      {/* ========================================================================= */}
      {currentScene === 2 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Gráfico de ciudad isométrica con apagón */}
          <div
            style={{
              position: "absolute",
              top: 480,
              left: 140,
              right: 140,
              height: 480,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
            }}
          >
            {[180, 260, 380, 310, 220, 340].map((h, i) => {
              const isDark = sceneLocalFrame > 60 + i * 20;
              return (
                <div
                  key={i}
                  style={{
                    width: 100,
                    height: h,
                    background: isDark ? "#121824" : THEME.colors.slate,
                    border: `2px solid ${isDark ? "#2A364F" : THEME.colors.cyan}`,
                    borderRadius: "8px 8px 0 0",
                    position: "relative",
                    transition: "all 0.3s ease",
                    boxShadow: isDark ? "none" : `0 0 20px ${THEME.colors.cyan}33`,
                  }}
                >
                  {/* Ventanas */}
                  <div
                    style={{
                      position: "absolute",
                      inset: "15px",
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    {[1, 2, 3, 4, 5, 6].map((w) => (
                      <div
                        key={w}
                        style={{
                          height: 14,
                          background: isDark ? "transparent" : THEME.colors.warning,
                          borderRadius: 2,
                          opacity: isDark ? 0 : 0.8,
                        }}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tarjetas de fallo de infraestructura */}
          <div
            style={{
              position: "absolute",
              top: 1020,
              left: 100,
              right: 100,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div
              style={{
                background: "rgba(255, 42, 84, 0.15)",
                border: `2px solid ${THEME.colors.alert}`,
                borderRadius: 16,
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40 }}>⚡</div>
              <div style={{ color: THEME.colors.alert, fontWeight: 900, fontSize: 24, marginTop: 8 }}>
                RED ELÉCTRICA
              </div>
              <div style={{ color: THEME.colors.white, fontSize: 18, marginTop: 4 }}>
                Subestaciones fuera de servicio
              </div>
            </div>

            <div
              style={{
                background: "rgba(255, 42, 84, 0.15)",
                border: `2px solid ${THEME.colors.alert}`,
                borderRadius: 16,
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 40 }}>💳</div>
              <div style={{ color: THEME.colors.alert, fontWeight: 900, fontSize: 24, marginTop: 8 }}>
                CAJEROS Y POS
              </div>
              <div style={{ color: THEME.colors.white, fontSize: 18, marginTop: 4 }}>
                Sistemas bancarios sin red
              </div>
            </div>

            <div
              style={{
                gridColumn: "span 2",
                background: "rgba(255, 190, 11, 0.15)",
                border: `2px solid ${THEME.colors.warning}`,
                borderRadius: 16,
                padding: "18px",
                textAlign: "center",
              }}
            >
              <div style={{ color: THEME.colors.warning, fontWeight: 800, fontSize: 22 }}>
                💧 AGUA POTABLE PARALIZADA (SIN BOMBAS ELÉCTRICAS)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 4: LA REGLA DE LAS 72 HORAS | CRONÓMETRO Y SALVA VIDAS (65.0 a 90.0s) */}
      {/* ========================================================================= */}
      {currentScene === 3 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Cronómetro 72:00:00 gigante */}
          <div
            style={{
              position: "absolute",
              top: 500,
              left: 540,
              transform: "translate(-50%, -50%)",
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 380,
                height: 380,
                borderRadius: "50%",
                border: `8px solid ${THEME.colors.cyan}`,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                background: "rgba(0, 245, 212, 0.05)",
                boxShadow: `0 0 40px ${THEME.colors.cyan}44`,
              }}
            >
              <div style={{ color: THEME.colors.cyan, fontSize: 24, fontWeight: 800, letterSpacing: 3 }}>
                VENTANA CRÍTICA
              </div>
              <div
                style={{
                  color: THEME.colors.white,
                  fontSize: 72,
                  fontWeight: 900,
                  fontFamily: THEME.fonts.mono,
                  marginTop: 6,
                }}
              >
                72:00
              </div>
              <div style={{ color: THEME.colors.warning, fontSize: 20, fontWeight: 700, marginTop: 4 }}>
                TRES DÍAS DE AUTONOMÍA
              </div>
            </div>
          </div>

          {/* Gráfico comparativo de alivio estatal */}
          <div
            style={{
              position: "absolute",
              top: 860,
              left: 100,
              right: 100,
              background: "rgba(28, 37, 65, 0.9)",
              border: `2px solid ${THEME.colors.emerald}`,
              borderRadius: 24,
              padding: "28px",
              boxShadow: `0 0 35px ${THEME.colors.emerald}33`,
            }}
          >
            <div style={{ color: THEME.colors.emerald, fontSize: 28, fontWeight: 900, textAlign: "center" }}>
              ¿POR QUÉ TU HOGAR DEBE SER AUTÓNOMO?
            </div>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: THEME.colors.white, fontSize: 18, fontWeight: 700 }}>
                  <span>Saturación del Sistema de Emergencias</span>
                  <span style={{ color: THEME.colors.alert }}>Colapso al 100%</span>
                </div>
                <div style={{ height: 16, background: "#1C2541", borderRadius: 8, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "100%", background: THEME.colors.alert }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", color: THEME.colors.white, fontSize: 18, fontWeight: 700 }}>
                  <span>Con Familias Preparadas (72 Horas)</span>
                  <span style={{ color: THEME.colors.emerald }}>35% Carga Controlada</span>
                </div>
                <div style={{ height: 16, background: "#1C2541", borderRadius: 8, marginTop: 6, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: "35%", background: THEME.colors.emerald }} />
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 20,
                textAlign: "center",
                color: THEME.colors.cyan,
                fontSize: 20,
                fontWeight: 700,
              }}
            >
              Liberas hospitales, bomberos y rescates para quienes más lo necesitan.
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 5: MODELO NÓRDICO Y CAUSAS GLOBALES (90.0 a 120.0s) */}
      {/* ========================================================================= */}
      {currentScene === 4 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Países Nórdicos vs Cinturón del Pacífico */}
          <div
            style={{
              position: "absolute",
              top: 480,
              left: 100,
              right: 100,
              display: "flex",
              flexDirection: "column",
              gap: 24,
            }}
          >
            {/* Tarjeta Nórdica */}
            <div
              style={{
                background: "rgba(72, 202, 228, 0.15)",
                border: `2px solid ${THEME.colors.nordic}`,
                borderRadius: 20,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 50 }}>🛡️</div>
              <div>
                <div style={{ color: THEME.colors.nordic, fontSize: 26, fontWeight: 900 }}>
                  MODELO DE "DEFENSA TOTAL"
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                  Suecia • Finlandia • Noruega
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginTop: 2 }}>
                  Manual obligatorio entregado a cada hogar por el gobierno
                </div>
              </div>
            </div>

            {/* Tarjeta Desastres Naturales */}
            <div
              style={{
                background: "rgba(255, 190, 11, 0.15)",
                border: `2px solid ${THEME.colors.warning}`,
                borderRadius: 20,
                padding: "24px",
                display: "flex",
                alignItems: "center",
                gap: 20,
              }}
            >
              <div style={{ fontSize: 50 }}>🌋</div>
              <div>
                <div style={{ color: THEME.colors.warning, fontSize: 26, fontWeight: 900 }}>
                  SISMOS Y DESASTRES CLIMÁTICOS
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, fontWeight: 600, marginTop: 4 }}>
                  México • Japón • Chile
                </div>
                <div style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginTop: 2 }}>
                  Cinturón de Fuego: terremotos, tsunamis y huracanes masivos
                </div>
              </div>
            </div>

            {/* Sello de Resiliencia Universal */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.2)",
                border: `2px solid ${THEME.colors.emerald}`,
                borderRadius: 20,
                padding: "20px",
                textAlign: "center",
              }}
            >
              <div style={{ color: THEME.colors.emerald, fontSize: 24, fontWeight: 900 }}>
                REGLA UNIVERSAL DE PROTECCIÓN CIVIL
              </div>
              <div style={{ color: THEME.colors.white, fontSize: 19, marginTop: 6 }}>
                La preparación no predice la guerra; protege tu vida ante cualquier colapso de red.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 6: KIT DE 72H - PARTE 1 | AGUA, COMIDA, LUZ (120.0 a 145.0s) */}
      {/* ========================================================================= */}
      {currentScene === 5 && (
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              top: 480,
              left: 100,
              right: 100,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Elemento 1: Agua potable */}
            <div
              style={{
                background: "rgba(0, 245, 212, 0.15)",
                border: `2px solid ${THEME.colors.cyan}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - sceneLocalFrame * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>💧</div>
              <div>
                <div style={{ color: THEME.colors.cyan, fontSize: 26, fontWeight: 900 }}>
                  1. AGUA POTABLE: 2 A 3 LITROS / DÍA
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Mínimo 9 litros por persona para 72 horas (beber e higiene esencial)
                </div>
              </div>
            </div>

            {/* Elemento 2: Comida lista */}
            <div
              style={{
                background: "rgba(254, 228, 64, 0.15)",
                border: `2px solid ${THEME.colors.warning}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - Math.max(0, sceneLocalFrame - 60) * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>🥫</div>
              <div>
                <div style={{ color: THEME.colors.warning, fontSize: 26, fontWeight: 900 }}>
                  2. COMIDA NO PERECEDERA
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Latas abre-fácil, frutos secos, barritas. Cero cocción ni refrigeración.
                </div>
              </div>
            </div>

            {/* Elemento 3: Linterna y Radio */}
            <div
              style={{
                background: "rgba(249, 115, 22, 0.15)",
                border: `2px solid ${THEME.colors.orange}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - Math.max(0, sceneLocalFrame - 120) * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>📻</div>
              <div>
                <div style={{ color: THEME.colors.orange, fontSize: 26, fontWeight: 900 }}>
                  3. LUZ Y COMUNICACIÓN OFICIAL
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Linterna LED con pilas extra + radio analógica portátil (AM/FM).
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 7: KIT DE 72H - PARTE 2 | SALUD, EFECTIVO, DOCS (145.0 a 165.0s) */}
      {/* ========================================================================= */}
      {currentScene === 6 && (
        <div style={{ position: "absolute", inset: 0 }}>
          <div
            style={{
              position: "absolute",
              top: 480,
              left: 100,
              right: 100,
              display: "flex",
              flexDirection: "column",
              gap: 22,
            }}
          >
            {/* Elemento 4: Botiquín y medicación */}
            <div
              style={{
                background: "rgba(139, 92, 246, 0.15)",
                border: `2px solid ${THEME.colors.purple}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - sceneLocalFrame * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>🩹</div>
              <div>
                <div style={{ color: THEME.colors.purple, fontSize: 26, fontWeight: 900 }}>
                  4. BOTIQUÍN Y TRATAMIENTOS PERSONALES
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Medicación crónica de tu familia (nadie podrá recetártela en crisis)
                </div>
              </div>
            </div>

            {/* Elemento 5: Efectivo y documentos */}
            <div
              style={{
                background: "rgba(16, 185, 129, 0.15)",
                border: `2px solid ${THEME.colors.emerald}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - Math.max(0, sceneLocalFrame - 60) * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>💵</div>
              <div>
                <div style={{ color: THEME.colors.emerald, fontSize: 26, fontWeight: 900 }}>
                  5. EFECTIVO EN BILLETES PEQUEÑOS
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Cajeros fuera de línea. Billetes de baja denominación ($20, $50).
                </div>
              </div>
            </div>

            {/* Bolsas herméticas */}
            <div
              style={{
                background: "rgba(0, 245, 212, 0.15)",
                border: `2px solid ${THEME.colors.cyan}`,
                borderRadius: 18,
                padding: "20px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                transform: `translateX(${Math.max(0, 80 - Math.max(0, sceneLocalFrame - 120) * 4)}px)`,
              }}
            >
              <div style={{ fontSize: 50 }}>📁</div>
              <div>
                <div style={{ color: THEME.colors.cyan, fontSize: 26, fontWeight: 900 }}>
                  DOCUMENTACIÓN SELLADA HERMÉTICAMENTE
                </div>
                <div style={{ color: THEME.colors.white, fontSize: 20, marginTop: 4 }}>
                  Bolsa impermeable zip-lock con copias de DNI, pólizas y títulos.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ESCENA 8: CIERRE Y LOOP PERFECTO (165.0 a 180.0s) */}
      {/* ========================================================================= */}
      {currentScene === 7 && (
        <div style={{ position: "absolute", inset: 0 }}>
          {/* Cierre emotivo y empoderador */}
          <div
            style={{
              position: "absolute",
              top: 520,
              left: 540,
              transform: `translate(-50%, -50%) scale(${1 + (sceneLocalFrame > 600 ? (sceneLocalFrame - 600) * 0.05 : 0)})`,
              textAlign: "center",
              width: 900,
            }}
          >
            <div style={{ fontSize: 80 }}>🏡</div>
            <div
              style={{
                color: THEME.colors.emerald,
                fontSize: 48,
                fontWeight: 900,
                marginTop: 20,
                lineHeight: 1.2,
              }}
            >
              PREPARARSE NO ES MIEDO:
              <br />
              ES RESPONSABILIDAD CIUDADANA
            </div>
            <div
              style={{
                color: THEME.colors.white,
                fontSize: 26,
                fontWeight: 600,
                marginTop: 18,
                lineHeight: 1.4,
              }}
            >
              Revisa tu despensa hoy y comparte esta guía con quienes más quieres.
            </div>

            {/* Botones de acción */}
            <div
              style={{
                marginTop: 36,
                display: "flex",
                justifyContent: "center",
                gap: 24,
              }}
            >
              <div
                style={{
                  background: THEME.colors.emerald,
                  color: THEME.colors.bg,
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "16px 32px",
                  borderRadius: 40,
                  boxShadow: `0 0 25px ${THEME.colors.emerald}66`,
                }}
              >
                💾 GUARDAR GUÍA
              </div>
              <div
                style={{
                  background: "transparent",
                  color: THEME.colors.cyan,
                  border: `2px solid ${THEME.colors.cyan}`,
                  fontWeight: 900,
                  fontSize: 24,
                  padding: "16px 32px",
                  borderRadius: 40,
                }}
              >
                ↗️ COMPARTIR
              </div>
            </div>

            {/* Radar seamless loop que se agranda en los últimos 2 segundos */}
            {sceneLocalFrame > 650 && (
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: `translate(-50%, -50%) scale(${interpolate(sceneLocalFrame, [650, 900], [0.1, 8])})`,
                  width: 300,
                  height: 300,
                  borderRadius: "50%",
                  border: `4px dashed ${THEME.colors.alert}`,
                  opacity: interpolate(sceneLocalFrame, [650, 750], [0, 1]),
                  boxShadow: `0 0 60px ${THEME.colors.alert}`,
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
