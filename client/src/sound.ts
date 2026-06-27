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
const MUSIC_KEY = 'devguessr:sound:music';

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

function readMusicEnabled(): boolean {
  try {
    return localStorage.getItem(MUSIC_KEY) === '1';
  } catch {
    return false;
  }
}

let volume = readVolume();
let muted = readMuted();
let musicEnabled = readMusicEnabled();
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
  refreshMusic();
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
  refreshMusic();
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
    // Resume background music if it was left on in a previous session.
    refreshMusic();
    window.removeEventListener('pointerdown', prime);
    window.removeEventListener('keydown', prime);
  };
  window.addEventListener('pointerdown', prime, { once: true });
  window.addEventListener('keydown', prime, { once: true });
}

/* -------------------------------------------------------------------------- */
/*  Background music — a gentle, looping lo-fi backing track synthesized on    */
/*  the fly. No audio files to ship; it sits quietly under the sound effects.  */
/* -------------------------------------------------------------------------- */

const TEMPO = 72; // beats per minute — relaxed
const BEAT = 60 / TEMPO;
const BAR = BEAT * 4;
/** Master loudness of the music relative to the SFX volume. */
const MUSIC_LEVEL = 0.16;

/** Eight-bar loop: an A section (Am7–Fmaj7–Cmaj7–G7) answered by a contrasting
 *  B section (Dm7–Am7–Em7–G7) so the harmony keeps moving instead of looping
 *  every four bars. Each entry carries a pad chord, a bass root, and an
 *  arpeggio. */
const PROGRESSION: { pad: number[]; bass: number; arp: number[] }[] = [
  { pad: [220.0, 261.63, 329.63], bass: 110.0, arp: [440.0, 523.25, 659.25, 587.33] }, // Am7
  { pad: [174.61, 220.0, 261.63], bass: 87.31, arp: [349.23, 440.0, 523.25, 440.0] }, // Fmaj7
  { pad: [261.63, 329.63, 392.0], bass: 130.81, arp: [523.25, 659.25, 783.99, 659.25] }, // Cmaj7
  { pad: [196.0, 246.94, 293.66], bass: 98.0, arp: [392.0, 493.88, 587.33, 493.88] }, // G7
  { pad: [220.0, 293.66, 349.23], bass: 146.83, arp: [440.0, 587.33, 698.46, 587.33] }, // Dm7
  { pad: [220.0, 261.63, 329.63], bass: 110.0, arp: [523.25, 659.25, 880.0, 659.25] }, // Am7 (higher voicing)
  { pad: [246.94, 329.63, 392.0], bass: 82.41, arp: [493.88, 659.25, 783.99, 659.25] }, // Em7
  { pad: [196.0, 246.94, 293.66], bass: 98.0, arp: [392.0, 493.88, 587.33, 698.46] }, // G7 (leading back to Am)
];

/** Off-beat arpeggio rhythms (in beats) the scheduler rotates through so no two
 *  consecutive bars share the same groove. */
const ARP_RHYTHMS: number[][] = [
  [0, 1.5, 2.5, 3.5],
  [0, 1, 2, 3.5],
  [0.5, 1.5, 2.5, 3],
  [0, 1, 2.5, 3.5],
];

/** Sparse top-line melody, one phrase per bar. Each accent is `{ beat, note }`
 *  where `note` indexes into the bar's arpeggio. Empty bars leave breathing
 *  room so the track stays laid-back, and the phrase offset drifts each time
 *  through the loop so the melody never repeats identically. */
const LEAD_PHRASES: { beat: number; note: number }[][] = [
  [{ beat: 3, note: 3 }],
  [],
  [{ beat: 1.5, note: 2 }, { beat: 3, note: 3 }],
  [],
  [{ beat: 2, note: 1 }],
  [{ beat: 0.5, note: 2 }, { beat: 2.5, note: 3 }],
  [],
  [{ beat: 1, note: 3 }, { beat: 3, note: 1 }],
];

let musicGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setTimeout> | null = null;
let musicBar = 0;
let nextBarTime = 0;

function musicTarget(): number {
  return muted ? 0 : volume * MUSIC_LEVEL;
}

/** A long, soft pad voice (sine) that swells in and fades out across the bar. */
function playPad(audio: AudioContext, out: AudioNode, freq: number, start: number, dur: number): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const peak = 0.18;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.6);
  gain.gain.setValueAtTime(peak, start + dur - 0.5);
  gain.gain.linearRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** A short, soft plucked/bass note (triangle) with a quick decay. */
function playVoice(
  audio: AudioContext,
  out: AudioNode,
  freq: number,
  start: number,
  dur: number,
  peak: number,
): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.025);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** A soft, bell-like lead note (sine) with a slow swell and a long tail. */
function playLead(audio: AudioContext, out: AudioNode, freq: number, start: number, dur: number): void {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  const peak = 0.12;
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(peak, start + 0.08);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(gain).connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
}

/** Schedule one bar of music: a sustained pad, a moving bass, a rotating
 *  arpeggio, and an occasional lead melody — varied per bar so the loop stays
 *  fresh. */
function scheduleBar(audio: AudioContext, out: AudioNode, start: number, bar: number): void {
  const chord = PROGRESSION[bar % PROGRESSION.length];

  // Pad: the sustained chord underpinning the whole bar.
  for (const f of chord.pad) playPad(audio, out, f, start, BAR);

  // Bass: root on beat 1, then the root or its octave on beat 3 for gentle
  // forward motion that alternates bar to bar.
  playVoice(audio, out, chord.bass, start, BEAT * 1.8, 0.3);
  const beat3Bass = bar % 2 === 0 ? chord.bass : chord.bass * 2;
  playVoice(audio, out, beat3Bass, start + BEAT * 2, BEAT * 1.8, 0.3);

  // Arpeggio: rotate the off-beat rhythm and flip direction on odd bars so no
  // two consecutive bars play the same figure.
  const rhythm = ARP_RHYTHMS[bar % ARP_RHYTHMS.length];
  const notes = bar % 2 === 1 ? [...chord.arp].reverse() : chord.arp;
  notes.forEach((f, i) => {
    playVoice(audio, out, f, start + rhythm[i] * BEAT, BEAT * 0.9, 0.15);
  });

  // Lead: a sparse top-line melody whose phrase drifts each loop, leaving plenty
  // of space so the track stays relaxed.
  const loop = Math.floor(bar / PROGRESSION.length);
  const phrase = LEAD_PHRASES[(bar + loop) % LEAD_PHRASES.length];
  for (const { beat, note } of phrase) {
    playLead(audio, out, chord.arp[note], start + beat * BEAT, BEAT * 1.6);
  }
}

/** Look-ahead scheduler: queues bars a little before they are due. */
function scheduleLoop(): void {
  if (!ctx || !musicGain) return;
  while (nextBarTime < ctx.currentTime + 0.4) {
    scheduleBar(ctx, musicGain, nextBarTime, musicBar);
    nextBarTime += BAR;
    musicBar += 1;
  }
  musicTimer = setTimeout(scheduleLoop, 60);
}

function ensureMusicRunning(): void {
  const audio = getCtx();
  if (!audio) return;
  if (!musicGain) {
    musicGain = audio.createGain();
    musicGain.gain.value = 0.0001;
    musicGain.connect(audio.destination);
  }
  if (musicTimer != null) return; // already running
  musicBar = 0;
  nextBarTime = audio.currentTime + 0.15;
  scheduleLoop();
}

function stopMusic(): void {
  if (musicTimer != null) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  if (musicGain && ctx) {
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(Math.max(0.0001, musicGain.gain.value), t);
    musicGain.gain.linearRampToValueAtTime(0.0001, t + 0.3);
  }
}

/** Start or stop the music to match the current enabled / mute / volume state. */
function refreshMusic(): void {
  const shouldPlay = musicEnabled && !muted && volume > 0;
  if (!shouldPlay) {
    stopMusic();
    return;
  }
  ensureMusicRunning();
  if (musicGain && ctx) {
    const t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setTargetAtTime(musicTarget(), t, 0.1);
  }
}

export function isMusicEnabled(): boolean {
  return musicEnabled;
}

export function setMusicEnabled(enabled: boolean): void {
  musicEnabled = enabled;
  try {
    localStorage.setItem(MUSIC_KEY, enabled ? '1' : '0');
  } catch {
    /* ignore persistence errors */
  }
  refreshMusic();
}

