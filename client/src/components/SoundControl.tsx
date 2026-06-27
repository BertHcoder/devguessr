import { useState } from 'react';
import {
  getVolume,
  isMuted,
  isMusicEnabled,
  play,
  setMuted,
  setMusicEnabled,
  setVolume,
} from '../sound';

/**
 * Topbar control for sound: a music toggle, a mute toggle, and a volume slider.
 * All three are persisted to localStorage by the sound engine, so they survive
 * reloads.
 */
export default function SoundControl() {
  const [volume, setVol] = useState(getVolume);
  const [muted, setMute] = useState(isMuted);
  const [music, setMusic] = useState(isMusicEnabled);

  const changeVolume = (v: number) => {
    setVol(v);
    setVolume(v);
    // Dragging the slider up while muted naturally unmutes.
    if (muted && v > 0) {
      setMute(false);
      setMuted(false);
    }
  };

  const toggleMute = () => {
    const next = !muted;
    setMute(next);
    setMuted(next);
    if (!next) play('click'); // confirm sound is back on
  };

  const toggleMusic = () => {
    const next = !music;
    setMusic(next);
    setMusicEnabled(next);
  };

  const icon = muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊';
  const effectiveVolume = muted ? 0 : volume;

  return (
    <div className="sound-control" role="group" aria-label="Sound volume">
      <button
        type="button"
        className={`sound-btn ${music ? 'active' : ''}`}
        onClick={toggleMusic}
        title={music ? 'Turn music off' : 'Turn music on'}
        aria-label={music ? 'Turn music off' : 'Turn music on'}
        aria-pressed={music}
      >
        <span aria-hidden="true">🎵</span>
      </button>
      <button
        type="button"
        className={`sound-btn ${muted ? 'muted' : ''}`}
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        aria-label={muted ? 'Unmute sound' : 'Mute sound'}
        aria-pressed={muted}
      >
        <span aria-hidden="true">{icon}</span>
      </button>
      <input
        type="range"
        className="sound-slider"
        min={0}
        max={1}
        step={0.05}
        value={effectiveVolume}
        onChange={(e) => changeVolume(Number(e.target.value))}
        onPointerUp={() => effectiveVolume > 0 && play('click')}
        title="Volume"
        aria-label="Volume"
      />
    </div>
  );
}
