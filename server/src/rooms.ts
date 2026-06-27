import { customAlphabet } from 'nanoid';
import { ALL_QUESTIONS, ANSWER_POOLS, type RawQuestion } from './gameData.js';
import type {
  Category,
  Player,
  PlayerProfile,
  PublicPlayer,
  PublicQuestion,
  PublicRoom,
  Question,
  Room,
  RoomSettings,
} from './types.js';

const makeCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 4);

const rooms = new Map<string, Room>();

export const DEFAULT_SETTINGS: RoomSettings = {
  rounds: 8,
  roundTime: 20,
  categories: ['language', 'framework', 'company', 'bug'],
  progressiveReveal: true,
  powerUps: false,
};

const VALID_CATEGORIES: Category[] = ['language', 'framework', 'company', 'bug'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Build a playable question with 4 shuffled options (1 correct + 3 distractors). */
function buildQuestion(raw: RawQuestion): Question {
  if (raw.category === 'bug') return buildBugQuestion(raw);
  const pool = ANSWER_POOLS[raw.category].filter((a) => a !== raw.answer);
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([raw.answer, ...distractors]);
  return { ...raw, options };
}

/** Build a "spot the bug" question whose options are line numbers drawn from
 *  the snippet itself (the buggy line plus up to three other line numbers). */
function buildBugQuestion(raw: RawQuestion): Question {
  const lineCount = (raw.code ?? '').replace(/\n+$/, '').split('\n').length;
  const bugLine = raw.bugLine ?? 1;
  const others: number[] = [];
  for (let n = 1; n <= lineCount; n++) if (n !== bugLine) others.push(n);
  const distractors = shuffle(others).slice(0, 3).map((n) => `Line ${n}`);
  const answer = `Line ${bugLine}`;
  const options = shuffle([answer, ...distractors]);
  return { ...raw, answer, options };
}

/**
 * Pick `count` questions limited to the selected categories.
 *
 * To keep consecutive games feeling fresh, questions served in recent games
 * (tracked via `recentIds`) are de-prioritized: unseen questions are drawn
 * first, and only once they run out do recently-used ones come back. Within a
 * single game the result is always unique (we slice from a shuffled pool).
 */
function pickQuestions(
  count: number,
  categories: Category[],
  recentIds: Set<string> = new Set(),
): Question[] {
  const allowed = categories.length ? categories : DEFAULT_SETTINGS.categories;
  const pool = ALL_QUESTIONS.filter((q) => allowed.includes(q.category));
  const fresh = shuffle(pool.filter((q) => !recentIds.has(q.id)));
  const seen = shuffle(pool.filter((q) => recentIds.has(q.id)));
  // Prefer questions that haven't appeared recently, then fall back to the rest.
  return [...fresh, ...seen].slice(0, Math.min(count, pool.length)).map(buildQuestion);
}

export function createRoom(): Room {
  let code = makeCode();
  while (rooms.has(code)) code = makeCode();

  const room: Room = {
    code,
    status: 'lobby',
    settings: { ...DEFAULT_SETTINGS },
    players: new Map(),
    hostId: '',
    questions: [],
    recentQuestionIds: [],
    roundIndex: -1,
    endsAt: 0,
    timer: null,
    revealTimer: null,
  };
  rooms.set(code, room);
  return room;
}

export function getRoom(code: string): Room | undefined {
  return rooms.get(code?.toUpperCase());
}

export function deleteRoom(code: string): void {
  const room = rooms.get(code);
  if (!room) return;
  if (room.timer) clearTimeout(room.timer);
  if (room.revealTimer) clearTimeout(room.revealTimer);
  rooms.delete(code);
}

const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/;

/** Validate and clamp a profile so it is always safe to broadcast. */
function sanitizeProfile(
  p?: Partial<PlayerProfile> | null,
): Pick<Player, 'avatar' | 'favTech' | 'color' | 'tagline'> {
  return {
    // Keep at most a few code points so multi-codepoint emoji survive.
    avatar: typeof p?.avatar === 'string' ? [...p.avatar].slice(0, 3).join('') : '',
    favTech: typeof p?.favTech === 'string' ? p.favTech.trim().slice(0, 20) : '',
    // Only accept a strict hex colour; anything else falls back to the auto colour.
    color: typeof p?.color === 'string' && HEX_COLOR_RE.test(p.color) ? p.color : '',
    tagline: typeof p?.tagline === 'string' ? p.tagline.trim().slice(0, 40) : '',
  };
}

export function addPlayer(room: Room, id: string, name: string, profile?: Partial<PlayerProfile>): Player {
  const isHost = room.players.size === 0;
  const prof = sanitizeProfile(profile);
  const player: Player = {
    id,
    name: name.trim().slice(0, 20) || 'Player',
    score: 0,
    streak: 0,
    answered: false,
    choice: null,
    lastPoints: 0,
    connected: true,
    isHost,
    avatar: prof.avatar,
    favTech: prof.favTech,
    color: prof.color,
    tagline: prof.tagline,
    shield: false,
    usedPowerups: [],
  };
  room.players.set(id, player);
  if (isHost) room.hostId = id;
  return player;
}

/** Update a connected player's profile in place. Returns false if the player is unknown. */
export function updatePlayerProfile(
  room: Room,
  id: string,
  profile: Partial<PlayerProfile>,
): boolean {
  const player = room.players.get(id);
  if (!player) return false;
  const prof = sanitizeProfile(profile);
  if (typeof profile.name === 'string') {
    player.name = profile.name.trim().slice(0, 20) || player.name;
  }
  player.avatar = prof.avatar;
  player.favTech = prof.favTech;
  player.color = prof.color;
  player.tagline = prof.tagline;
  return true;
}

export function removePlayer(room: Room, id: string): void {
  room.players.delete(id);
  // Reassign host if needed.
  if (room.hostId === id) {
    const next = [...room.players.values()].find((p) => p.connected);
    if (next) {
      next.isHost = true;
      room.hostId = next.id;
    } else {
      room.hostId = '';
    }
  }
}

export function applySettings(room: Room, partial: Partial<RoomSettings>): void {
  const rounds = clamp(partial.rounds ?? room.settings.rounds, 3, 20);
  const roundTime = clamp(partial.roundTime ?? room.settings.roundTime, 5, 60);
  const requested = (partial.categories ?? []).filter((c) => VALID_CATEGORIES.includes(c));
  const categories = requested.length ? requested : room.settings.categories;
  const progressiveReveal =
    partial.progressiveReveal ?? room.settings.progressiveReveal;
  const powerUps = partial.powerUps ?? room.settings.powerUps;
  room.settings = { rounds, roundTime, categories, progressiveReveal, powerUps };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function startGame(room: Room): void {
  room.questions = pickQuestions(
    room.settings.rounds,
    room.settings.categories,
    new Set(room.recentQuestionIds),
  );
  // Remember what we just served so the next game avoids these first. Keep a
  // bounded history so the pool eventually cycles back instead of starving.
  const servedIds = room.questions.map((q) => q.id);
  room.recentQuestionIds = [...servedIds, ...room.recentQuestionIds].slice(0, 40);
  room.roundIndex = -1;
  for (const p of room.players.values()) {
    p.score = 0;
    p.streak = 0;
    p.lastPoints = 0;
  }
  room.status = 'playing';
}

/** Advance to the next round, resetting per-round player state. Returns false if game over. */
export function beginRound(room: Room): boolean {
  room.roundIndex += 1;
  if (room.roundIndex >= room.questions.length) {
    room.status = 'over';
    return false;
  }
  for (const p of room.players.values()) {
    p.answered = false;
    p.choice = null;
    p.lastPoints = 0;
    p.shield = false;
    p.usedPowerups = [];
  }
  room.status = 'playing';
  room.endsAt = Date.now() + room.settings.roundTime * 1000;
  return true;
}

export function currentQuestion(room: Room): Question | null {
  return room.questions[room.roundIndex] ?? null;
}

/**
 * Record a player's answer and compute their points.
 * Points reward both correctness and speed, with a small streak bonus.
 */
export function submitAnswer(room: Room, playerId: string, choice: number): boolean {
  const player = room.players.get(playerId);
  const q = currentQuestion(room);
  if (!player || !q || room.status !== 'playing' || player.answered) return false;
  if (choice < 0 || choice >= q.options.length) return false;

  player.answered = true;
  player.choice = choice;

  const correct = q.options[choice] === q.answer;
  if (correct) {
    const total = room.settings.roundTime * 1000;
    const remaining = Math.max(0, room.endsAt - Date.now());
    const speedRatio = total > 0 ? remaining / total : 0;
    const base = 500 + Math.round(500 * speedRatio); // 500–1000 for correct
    player.streak += 1;
    const streakBonus = Math.min(250, (player.streak - 1) * 50);
    player.lastPoints = base + streakBonus;
    player.score += player.lastPoints;
  } else {
    // A one-shot shield (a power-up) protects the streak from a single miss.
    if (player.shield) {
      player.shield = false;
    } else {
      player.streak = 0;
    }
    player.lastPoints = 0;
  }
  return true;
}

/* -------------------------------------------------------------------------- */
/*  Power-ups (optional economy: spend earned points for an edge).             */
/* -------------------------------------------------------------------------- */

export type PowerupType = 'fifty' | 'shield' | 'smoke';

export const POWERUP_COSTS: Record<PowerupType, number> = {
  fifty: 150,
  shield: 200,
  smoke: 250,
};

export interface PowerupResult {
  ok: boolean;
  error?: string;
  type?: PowerupType;
  /** For `fifty`: option indices the player should remove from their board. */
  hiddenIndices?: number[];
}

/**
 * Spend points on a power-up. Server-authoritative: validates affordability and
 * one-use-per-round, deducts the cost, and applies the effect. `smoke` only
 * deducts/marks here — broadcasting the blur to opponents is the caller's job.
 */
export function usePowerup(room: Room, playerId: string, type: PowerupType): PowerupResult {
  const player = room.players.get(playerId);
  const q = currentQuestion(room);
  if (!room.settings.powerUps) return { ok: false, error: 'Power-ups are off.' };
  if (!player || !q || room.status !== 'playing') return { ok: false, error: 'Not available right now.' };
  if (type !== 'fifty' && type !== 'shield' && type !== 'smoke') return { ok: false, error: 'Unknown power-up.' };
  if (player.usedPowerups.includes(type)) return { ok: false, error: 'Already used this round.' };
  if ((type === 'fifty' || type === 'shield') && player.answered) {
    return { ok: false, error: 'You already answered.' };
  }
  const cost = POWERUP_COSTS[type];
  if (player.score < cost) return { ok: false, error: 'Not enough points.' };

  player.score -= cost;
  player.usedPowerups.push(type);

  if (type === 'fifty') {
    const correctIndex = q.options.indexOf(q.answer);
    const wrong = q.options.map((_, i) => i).filter((i) => i !== correctIndex);
    return { ok: true, type, hiddenIndices: shuffle(wrong).slice(0, 2) };
  }
  if (type === 'shield') {
    player.shield = true;
  }
  return { ok: true, type };
}

export function allAnswered(room: Room): boolean {
  const active = [...room.players.values()].filter((p) => p.connected);
  return active.length > 0 && active.every((p) => p.answered);
}

/* -------------------------------------------------------------------------- */
/*  Serialization helpers (never leak the answer mid-round).                   */
/* -------------------------------------------------------------------------- */

export function toPublicPlayer(p: Player): PublicPlayer {
  return {
    id: p.id,
    name: p.name,
    score: p.score,
    streak: p.streak,
    answered: p.answered,
    lastPoints: p.lastPoints,
    connected: p.connected,
    isHost: p.isHost,
    avatar: p.avatar,
    favTech: p.favTech,
    color: p.color,
    tagline: p.tagline,
    shield: p.shield,
  };
}

export function toPublicRoom(room: Room): PublicRoom {
  return {
    code: room.code,
    status: room.status,
    settings: room.settings,
    players: [...room.players.values()]
      .map(toPublicPlayer)
      .sort((a, b) => b.score - a.score),
    hostId: room.hostId,
    roundIndex: room.roundIndex,
    totalRounds: room.questions.length || room.settings.rounds,
  };
}

export function toPublicQuestion(q: Question): PublicQuestion {
  return {
    id: q.id,
    category: q.category,
    type: q.type,
    prompt: q.prompt,
    options: q.options,
    code: q.code,
    highlight: q.highlight,
    slug: q.slug,
    color: q.color,
  };
}

export function leaderboard(room: Room): PublicPlayer[] {
  return [...room.players.values()]
    .map(toPublicPlayer)
    .sort((a, b) => b.score - a.score);
}
