import React from "react";
import { Audio, Sequence, staticFile } from "remotion";

interface SoundtrackProps {
  sceneOffsets: number[]; // Fotogramas globales de inicio de s1..s8
}

export const Soundtrack: React.FC<SoundtrackProps> = ({ sceneOffsets }) => {
  return (
    <>
      {/* 1. Música de fondo con ducking constante bajo la locución */}
      <Audio
        src={staticFile("audio/music.wav")}
        volume={0.25}
      />

      {/* 2. Locuciones TTS sincronizadas s1 a s8 */}
      {sceneOffsets.map((offset, idx) => (
        <Sequence
          key={`vo-s${idx + 1}`}
          from={offset}
          layout="none"
        >
          <Audio
            src={staticFile(`audio/vo/s${idx + 1}.wav`)}
            volume={1.0}
          />
        </Sequence>
      ))}

      {/* 3. Efectos de sonido puntuales (SFX) */}
      {/* Escena 1 */}
      <Sequence from={0} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-subdrop-radar.wav")} volume={0.65} />
      </Sequence>
      <Sequence from={180} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-news-whoosh.wav")} volume={0.5} />
      </Sequence>

      {/* Escena 2 */}
      <Sequence from={sceneOffsets[1] + 30} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-foghorn-distant.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={sceneOffsets[1] + 420} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-laser-blockade.wav")} volume={0.6} />
      </Sequence>

      {/* Escena 3 */}
      <Sequence from={sceneOffsets[2] + 420} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-industrial-blackout.wav")} volume={0.75} />
      </Sequence>
      <Sequence from={sceneOffsets[2] + 850} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-pos-error-beep.wav")} volume={0.55} />
      </Sequence>

      {/* Escena 4 */}
      <Sequence from={sceneOffsets[3] + 20} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-tactical-timer-tick.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[3] + 950} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-gauge-green-drop.wav")} volume={0.6} />
      </Sequence>

      {/* Escena 5 */}
      <Sequence from={sceneOffsets[4] + 30} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-leaflet-unfold.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[4] + 650} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-seismic-rumble.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={sceneOffsets[4] + 1200} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-shield-activation.wav")} volume={0.65} />
      </Sequence>

      {/* Escena 6 */}
      <Sequence from={sceneOffsets[5] + 20} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-inventory-open.wav")} volume={0.6} />
      </Sequence>
      <Sequence from={sceneOffsets[5] + 240} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-water-bottle-drop.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={sceneOffsets[5] + 650} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-can-clang.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[5] + 1050} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-radio-tuning-short.wav")} volume={0.55} />
      </Sequence>

      {/* Escena 7 */}
      <Sequence from={sceneOffsets[6] + 20} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-pill-blister-pop.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[6] + 380} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-paper-cash-flutter.wav")} volume={0.45} />
      </Sequence>
      <Sequence from={sceneOffsets[6] + 650} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-ziplock-slide.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[6] + 920} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-backpack-zipper-shut.wav")} volume={0.65} />
      </Sequence>

      {/* Escena 8 */}
      <Sequence from={sceneOffsets[7] + 20} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-chime-peaceful.wav")} volume={0.5} />
      </Sequence>
      <Sequence from={sceneOffsets[7] + 250} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-touch-tap-share.wav")} volume={0.55} />
      </Sequence>
      <Sequence from={sceneOffsets[7] + 750} layout="none">
        <Audio src={staticFile("audio/sfx/sfx-reverse-swoosh-loop.wav")} volume={0.7} />
      </Sequence>
    </>
  );
};
