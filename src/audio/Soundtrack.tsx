import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

interface SoundtrackProps {
  sceneOffsets: number[]; // Fotogramas globales de inicio de s0..s8
}

export const Soundtrack: React.FC<SoundtrackProps> = ({ sceneOffsets }) => {
  return (
    <>
      {/* 1. Música de fondo cinemática con ducking bajo la locución */}
      <Audio
        src={staticFile("audio/music.wav")}
        volume={0.18}
      />

      {/* 2. Locuciones TTS sincronizadas s0 a s8 */}
      {sceneOffsets.map((offset, idx) => (
        <Sequence
          key={`vo-s${idx}`}
          from={offset}
          layout="none"
        >
          <Audio
            src={staticFile(`audio/vo/s${idx}.wav`)}
            volume={1.0}
          />
        </Sequence>
      ))}
    </>
  );
};
