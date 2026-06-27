/**
 * Lightweight sound-effects engine for DevGuessr.
 *
 * Effects are synthesized on the fly with the Web Audio API, so there are no
 * audio assets to ship and everything works offline. Volume and mute state are
 * persisted to localStorage and read back on load.
 */

export type SoundName =
  | 'click'
  | 'correct'
  | 'wrong'
  | 'roundStart'
  | 'tick'
  | 'win'
  | 'lose';

const VOLUME_KEY = 'devguessr:sound:volume';
const MUTED_KEY = 'devguessr:sound:muted';

const DEFAULT_VOLUME = 0.6;

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function readVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_KEY);
    if (raw != null) {
      const n = Number(raw);
      if (Number.isFinite(n)) return clamp01(n);
    }
  } catch {
    /* localStorage may be unavailable (private mode, etc.) */
  }
  return DEFAULT_VOLUME;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

let volume = readVolume();
let muted = readMuted();
let ctx: AudioContext | null = null;

type AudioContextCtor = typeof AudioContext;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC: AudioContextCtor | undefined =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function getVolume(): number {
  return volume;
}

export function isMuted(): boolean {
  return muted;
}

export function setVolume(v: number): void {
  volume = clamp01(v);
  try {
    localStorage.setItem(VOLUME_KEY, String(volume));
  } catch {
    /* ignore persistence errors */
  }
}

export function setMuted(m: boolean): void {
  muted = m;
  try {
    localStorage.setItem(MUTED_KEY, m ? '1' : '0');
  } catch {
    /* ignore persistence errors */
  }
  // Warm up the audio context when sound is (re-)enabled.
  if (!m) getCtx();
}

/** A single tone in a sound effect. Times are seconds relative to playback start. */
interface Tone {
  freq: number;
  start: number;
  dur: number;
  type?: OscillatorType;
  /** Relative loudness within the effect (0..1). */
  gain?: number;
}

// Note frequencies used to compose the effects below.
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const A5 = 880.0;
const C6 = 1046.5;

const SOUNDS: Record<SoundName, Tone[]> = {
  // Soft blip when picking an option or toggling sound.
  click: [{ freq: 330, start: 0, dur: 0.09, type: 'triangle', gain: 0.7 }],
  // Bright ascending arpeggio for a correct answer.
  correct: [
    { freq: C5, start: 0, dur: 0.12, type: 'triangle' },
    { freq: E5, start: 0.1, dur: 0.12, type: 'triangle' },
    { freq: G5, start: 0.2, dur: 0.22, type: 'triangle' },
  ],
  // Low descending buzz for a wrong answer.
  wrong: [
    { freq: 196, start: 0, dur: 0.16, type: 'sawtooth', gain: 0.6 },
    { freq: 146, start: 0.12, dur: 0.22, type: 'sawtooth', gain: 0.6 },
  ],
  // Gentle two-note cue when a new round begins.
  roundStart: [
    { freq: 392, start: 0, dur: 0.12, type: 'sine' },
    { freq: 587, start: 0.1, dur: 0.16, type: 'sine' },
  ],
  // Short high tick for the final countdown seconds.
  tick: [{ freq: A5, start: 0, dur: 0.05, type: 'square', gain: 0.45 }],
  // Triumphant fanfare on the results screen for the winner.
  win: [
    { freq: C5, start: 0, dur: 0.14, type: 'triangle' },
    { freq: E5, start: 0.13, dur: 0.14, type: 'triangle' },
    { freq: G5, start: 0.26, dur: 0.14, type: 'triangle' },
    { freq: C6, start: 0.39, dur: 0.34, type: 'triangle' },
  ],
  // Gentle descending cue for non-winners.
  lose: [
    { freq: 392, start: 0, dur: 0.18, type: 'sine' },
    { freq: 294, start: 0.16, dur: 0.28, type: 'sine' },
  ],
};

/** Play a named sound effect. No-op when muted, silenced, or unsupported. */
export function play(name: SoundName): void {
  if (muted || volume <= 0) return;
  const audio = getCtx();
  if (!audio) return;
  const tones = SOUNDS[name];
  if (!tones) return;

  const now = audio.currentTime;
  for (const t of tones) {
    const osc = audio.createOscillator();
    const gain = audio.createGain();
    osc.type = t.type ?? 'sine';
    osc.frequency.setValueAtTime(t.freq, now + t.start);

    // Master scale keeps the synthesized tones gentle even at full volume.
    const peak = Math.max(0.0001, volume * (t.gain ?? 1) * 0.22);
    const t0 = now + t.start;
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + t.dur);

    osc.connect(gain).connect(audio.destination);
    osc.start(t0);
    osc.stop(t0 + t.dur + 0.03);
  }
}

// Prime the audio context on the first user interaction so later, server-driven
// sounds (round start, results) are allowed to play under browser autoplay rules.
if (typeof window !== 'undefined') {
  const prime = () => {
    getCtx();
    window.removeEventListener('pointerdown', prime);
    window.removeEventListener('keydown', prime);
  };
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('keydown', prime, { once: true });
}
