import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { THEME } from "../theme";
import voData from "../data/vo.json";

interface CaptionsProps {
  sceneKey: "s0" | "s1" | "s2" | "s3" | "s4" | "s5" | "s6" | "s7" | "s8" | string;
  sceneStartFrame: number;
  highlights?: string[];
}

export const AnimatedCaptions: React.FC<CaptionsProps> = ({
  sceneKey,
  sceneStartFrame,
  highlights = [],
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneVO = (voData as any)[sceneKey];
  if (!sceneVO || !sceneVO.words || sceneVO.words.length === 0) {
    return null;
  }

  // Tiempo local en segundos desde el inicio de la escena
  const localTime = Math.max(0, (frame - sceneStartFrame) / fps);

  // Encontrar el índice de la palabra actual
  let activeWordIndex = -1;
  for (let i = 0; i < sceneVO.words.length; i++) {
    const w = sceneVO.words[i];
    if (localTime >= w.start && localTime <= w.end + 0.1) {
      activeWordIndex = i;
      break;
    }
    if (localTime < w.start && activeWordIndex === -1 && i > 0) {
      activeWordIndex = i - 1;
      break;
    }
  }

  if (activeWordIndex === -1 && localTime >= sceneVO.words[sceneVO.words.length - 1].end) {
    activeWordIndex = sceneVO.words.length - 1;
  }

  // Agrupar palabras en frases cortas de 3 a 5 palabras para formato vertical Shorts/TikTok
  const chunkSize = 4;
  const chunkIndex = Math.floor(Math.max(0, activeWordIndex) / chunkSize);
  const startIdx = chunkIndex * chunkSize;
  const endIdx = Math.min(sceneVO.words.length, startIdx + chunkSize);
  const visibleWords = sceneVO.words.slice(startIdx, endIdx);

  const cleanWord = (str: string) => str.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ]/g, "").toUpperCase();
  const isHighlighted = (wordText: string) => {
    const cleaned = cleanWord(wordText);
    return highlights.some((h) => cleanWord(h) === cleaned || cleaned.includes(cleanWord(h)));
  };

  return (
    <div
      style={{
        position: "absolute",
        top: THEME.safe.subtitleY,
        left: THEME.safe.left,
        right: THEME.safe.right,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none",
        zIndex: 60,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          gap: "8px 14px",
          maxWidth: 900,
          background: "rgba(11, 19, 43, 0.75)",
          padding: "12px 24px",
          borderRadius: 16,
          backdropFilter: "blur(6px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {visibleWords.map((w: any, idx: number) => {
          const absoluteIndex = startIdx + idx;
          const isActive = absoluteIndex === activeWordIndex;
          const highlighted = isHighlighted(w.text);

          let color = THEME.colors.white;
          if (highlighted) {
            color = THEME.colors.warning;
          }
          if (isActive) {
            color = THEME.colors.cyan;
          }

          return (
            <span
              key={absoluteIndex}
              style={{
                fontFamily: THEME.fonts.main,
                fontWeight: 900,
                fontSize: 44,
                lineHeight: 1.2,
                color,
                textTransform: "uppercase",
                textShadow: isActive
                  ? `0 0 16px ${THEME.colors.cyan}, 0 2px 4px #000`
                  : "0 2px 6px rgba(0,0,0,0.9)",
                transform: isActive ? "scale(1.12)" : "scale(1)",
                transition: "transform 0.08s ease, color 0.08s ease",
                display: "inline-block",
              }}
            >
              {w.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};
