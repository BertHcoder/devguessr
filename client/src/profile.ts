import type { PlayerProfile } from './types';

export interface PlayerStats {
  gamesPlayed: number;
  bestScore: number;
  /** Times finished in 1st place. */
  wins: number;
  /** Times finished in the top 3. */
  podiums: number;
}

const PROFILE_KEY = 'devguessr:profile';
const STATS_KEY = 'devguessr:stats';
/** Legacy key from before profiles existed; used to seed the name on first load. */
const LEGACY_NAME_KEY = 'devguessr:name';

/** Curated avatar emojis with a developer/tech flavour. */
export const AVATAR_EMOJIS = [
  '🦀', '🐍', '☕', '⚛️', '🚀', '🐧', '🦫', '🐳',
  '🔥', '⚡', '🤖', '👾', '🧠', '💾', '🛠️', '🧩',
  '🌙', '🦊', '🐙', '🦄', '🌶️', '🍵', '🎯', '🧪',
];

/** Accent colours offered in the profile editor. */
export const COLOR_SWATCHES = [
  '#ff6a3d', '#f5a623', '#27cdb0', '#ff6f9d', '#45cf8a',
  '#5b8cff', '#c084fc', '#f2584e', '#2f9e8f', '#e8c14b',
];

const HEX_RE = /^#[0-9a-fA-F]{6}$/;

const EMPTY_PROFILE: PlayerProfile = {
  name: '',
  avatar: '',
  favTech: '',
  color: '',
  tagline: '',
};

/** Clamp every field to safe lengths/formats before it touches the network or storage. */
export function sanitizeProfile(p: Partial<PlayerProfile> | null | undefined): PlayerProfile {
  return {
    name: typeof p?.name === 'string' ? p.name.slice(0, 20) : '',
    // Keep at most a couple of code points so multi-codepoint emoji still work.
    avatar: typeof p?.avatar === 'string' ? [...p.avatar].slice(0, 3).join('') : '',
    favTech: typeof p?.favTech === 'string' ? p.favTech.slice(0, 20) : '',
    color: typeof p?.color === 'string' && HEX_RE.test(p.color) ? p.color : '',
    tagline: typeof p?.tagline === 'string' ? p.tagline.slice(0, 40) : '',
  };
}

export function readProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) {
      return sanitizeProfile(JSON.parse(raw) as Partial<PlayerProfile>);
    }
    // Migration: a returning player may only have the old standalone name key.
    const legacyName = localStorage.getItem(LEGACY_NAME_KEY);
    if (legacyName) {
      return { ...EMPTY_PROFILE, name: legacyName.slice(0, 20) };
    }
  } catch {
    /* localStorage may be unavailable (private mode, etc.) */
  }
  return { ...EMPTY_PROFILE };
}

export function saveProfile(profile: PlayerProfile): PlayerProfile {
  const clean = sanitizeProfile(profile);
  try {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(clean));
    // Keep the legacy key in sync so any older code path still finds a name.
    localStorage.setItem(LEGACY_NAME_KEY, clean.name);
  } catch {
    /* ignore persistence errors */
  }
  return clean;
}

const EMPTY_STATS: PlayerStats = { gamesPlayed: 0, bestScore: 0, wins: 0, podiums: 0 };

function asCount(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

export function readStats(): PlayerStats {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Partial<PlayerStats>;
      return {
        gamesPlayed: asCount(p.gamesPlayed),
        bestScore: asCount(p.bestScore),
        wins: asCount(p.wins),
        podiums: asCount(p.podiums),
      };
    }
  } catch {
    /* ignore */
  }
  return { ...EMPTY_STATS };
}

/** Record a finished game. `rank` is 1-based. Returns the updated stats. */
export function recordGameResult(score: number, rank: number): PlayerStats {
  const stats = readStats();
  const next: PlayerStats = {
    gamesPlayed: stats.gamesPlayed + 1,
    bestScore: Math.max(stats.bestScore, asCount(score)),
    wins: stats.wins + (rank === 1 ? 1 : 0),
    podiums: stats.podiums + (rank >= 1 && rank <= 3 ? 1 : 0),
  };
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

const PALETTE = [
  '#ff6a3d', '#f5a623', '#27cdb0', '#ff6f9d', '#45cf8a',
  '#ff9d3c', '#e8c14b', '#f2584e', '#2f9e8f', '#d98344',
];

/** Resolve an avatar background: an explicit hex override, else a stable hash of the name. */
export function avatarColor(name: string, override?: string): string {
  if (override && HEX_RE.test(override)) return override;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}
