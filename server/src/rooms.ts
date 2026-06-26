import { customAlphabet } from 'nanoid';
import { ALL_QUESTIONS, ANSWER_POOLS, type RawQuestion } from './gameData.js';
import type {
  Category,
  Player,
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
  categories: ['language', 'framework', 'company'],
};

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
  const pool = ANSWER_POOLS[raw.category].filter((a) => a !== raw.answer);
  const distractors = shuffle(pool).slice(0, 3);
  const options = shuffle([raw.answer, ...distractors]);
  return { ...raw, options };
}

/** Pick `count` questions limited to the selected categories. */
function pickQuestions(count: number, categories: Category[]): Question[] {
  const allowed = categories.length ? categories : DEFAULT_SETTINGS.categories;
  const pool = ALL_QUESTIONS.filter((q) => allowed.includes(q.category));
  return shuffle(pool)
    .slice(0, Math.min(count, pool.length))
    .map(buildQuestion);
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

export function addPlayer(room: Room, id: string, name: string): Player {
  const isHost = room.players.size === 0;
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
  };
  room.players.set(id, player);
  if (isHost) room.hostId = id;
  return player;
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
  const roundTime = clamp(partial.roundTime ?? room.settings.roundTime, 10, 60);
  const categories =
    partial.categories && partial.categories.length
      ? partial.categories
      : room.settings.categories;
  room.settings = { rounds, roundTime, categories };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(n)));
}

export function startGame(room: Room): void {
  room.questions = pickQuestions(room.settings.rounds, room.settings.categories);
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
    player.streak = 0;
    player.lastPoints = 0;
  }
  return true;
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
