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
    config: { damping: 12, mass: 0.8, stiffness: 120 },
  });

  const exitOpacity =
    disappearAt && frame > disappearAt - 15
      ? interpolate(frame, [disappearAt - 15, disappearAt], [1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })
      : 1;

  const colorMap: Record<BadgeVariant, { bg: string; border: string; text: string; icon: string }> = {
    warning: {
      bg: "rgba(255, 190, 11, 0.15)",
      border: THEME.colors.warning,
      text: THEME.colors.warning,
      icon: "⚠️",
    },
    negative: {
      bg: "rgba(255, 42, 84, 0.18)",
      border: THEME.colors.alert,
      text: THEME.colors.alert,
      icon: "✖",
    },
    positive: {
      bg: "rgba(16, 185, 129, 0.18)",
      border: THEME.colors.emerald,
      text: THEME.colors.emerald,
      icon: "✔",
    },
    info: {
      bg: "rgba(0, 245, 212, 0.15)",
      border: THEME.colors.cyan,
      text: THEME.colors.cyan,
      icon: "ℹ",
    },
  };

  const currentTheme = colorMap[variant];

  return (
    <div
      style={{
        position: "absolute",
        top: THEME.safe.badgeTop,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 50,
        transform: `translateY(${(1 - enterSpring) * -30}px) scale(${0.8 + enterSpring * 0.2})`,
        opacity: enterSpring * exitOpacity,
      }}
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 12,
          padding: "10px 24px",
          background: currentTheme.bg,
          border: `2px solid ${currentTheme.border}`,
          borderRadius: 30,
          backdropFilter: "blur(8px)",
          boxShadow: `0 0 25px ${currentTheme.border}44`,
        }}
      >
        <span style={{ fontSize: 22 }}>{currentTheme.icon}</span>
        <span
          style={{
            fontFamily: THEME.fonts.main,
            fontWeight: 800,
            fontSize: 22,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: currentTheme.text,
            textShadow: `0 0 12px ${currentTheme.border}66`,
          }}
        >
          {text}
        </span>
      </div>
    </div>
  );
};
