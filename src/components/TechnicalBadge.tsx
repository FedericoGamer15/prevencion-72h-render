import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme";

export type BadgeVariant = "positive" | "negative" | "info" | "warning";

interface BadgeProps {
  text: string;
  variant: BadgeVariant;
  appearAt: number;
  disappearAt?: number;
}

export const TechnicalBadge: React.FC<BadgeProps> = ({
  text,
  variant,
  appearAt,
  disappearAt = 999999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (frame < appearAt || frame > disappearAt) {
    return null;
  }

  const enterSpring = spring({
    frame: frame - appearAt,
    fps,
    config: { damping: 14, mass: 0.7, stiffness: 140 },
  });

  const exitOpacity =
    disappearAt && frame > disappearAt - 12
      ? interpolate(frame, [disappearAt - 12, disappearAt], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const colorMap: Record<BadgeVariant, { color: string; label: string }> = {
    warning: {
      color: THEME.colors.warning,
      label: "INTEL // ALERTA",
    },
    negative: {
      color: THEME.colors.alert,
      label: "CRÍTICO // VULNERABILIDAD",
    },
    positive: {
      color: THEME.colors.emerald,
      label: "PROTOCOLO // PREVENCIÓN",
    },
    info: {
      color: THEME.colors.cyan,
      label: "ANÁLISIS // GEOESTRATÉGICO",
    },
  };

  const currentTheme = colorMap[variant] || colorMap.info;
  const pulse = Math.sin(frame * 0.15);

  return (
    <div
      style={{
        position: "absolute",
        top: 150,
        left: 80,
        right: 80,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        opacity: Math.min(1, enterSpring * 1.5) * exitOpacity,
        transform: `translateY(${(1 - enterSpring) * -15}px)`,
        pointerEvents: "none",
        zIndex: 50,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Baliza luminosa pulsante */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            backgroundColor: currentTheme.color,
            boxShadow: `0 0 ${10 + pulse * 4}px ${currentTheme.color}`,
          }}
        />
        <span
          style={{
            fontFamily: THEME.fonts.mono,
            fontSize: 14,
            fontWeight: 800,
            letterSpacing: 3,
            color: currentTheme.color,
            textTransform: "uppercase",
          }}
        >
          {currentTheme.label}
        </span>
      </div>

      <div
        style={{
          marginTop: 4,
          fontFamily: THEME.fonts.main,
          fontSize: 24,
          fontWeight: 900,
          letterSpacing: 1.5,
          color: THEME.colors.white,
          textTransform: "uppercase",
          textShadow: "0 2px 10px rgba(0,0,0,0.8)",
        }}
      >
        {text}
      </div>

      {/* Línea técnica divisoria que se dibuja */}
      <div
        style={{
          marginTop: 8,
          width: `${enterSpring * 100}%`,
          maxWidth: 320,
          height: 2,
          background: `linear-gradient(90deg, ${currentTheme.color} 0%, transparent 100%)`,
        }}
      />
    </div>
  );
};
