export type Category = 'language' | 'framework' | 'company' | 'bug';

export type QuestionType = 'code' | 'logo';

/** Full question as stored on the server (includes the answer). */
export interface Question {
  id: string;
  category: Category;
  type: QuestionType;
  /** Short instruction shown to the player, e.g. "Which language is this?" */
  prompt: string;
  /** The correct answer (one of `options`). Never sent to clients during a round. */
  answer: string;
  /** All answer choices (including the correct one). */
  options: string[];
  /** For `code` questions: the snippet to display. */
  code?: string;
  /** For `bug` questions: the 1-based line number that contains the bug (never sent to clients). */
  bugLine?: number;
  /** Prism language id used for syntax highlighting (does not reveal the answer for similar languages). */
  highlight?: string;
  /** For `logo` questions: a simple-icons slug rendered as a colored silhouette. */
  slug?: string;
  /** Optional accent color for logo questions. */
  color?: string;
  /** A fun fact revealed after the round. */
  fact?: string;
}

/** Question shape sent to clients during a round (answer stripped out). */
export interface PublicQuestion {
  id: string;
  category: Category;
  type: QuestionType;
  prompt: string;
  options: string[];
  code?: string;
  highlight?: string;
  slug?: string;
  color?: string;
}

/** Optional, player-customizable profile sent when joining and editable in the lobby. */
export interface PlayerProfile {
  name: string;
  avatar: string;
  favTech: string;
  color: string;
  tagline: string;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  /** Whether the player has answered the current round. */
  answered: boolean;
  /** The choice index for the current round, or null. */
  choice: number | null;
  /** Points earned in the most recent round. */
  lastPoints: number;
  connected: boolean;
  isHost: boolean;
  /** Emoji avatar, or '' to fall back to the name initial. */
  avatar: string;
  /** Free-text favourite technology. */
  favTech: string;
  /** Validated hex accent colour, or '' for the auto colour. */
  color: string;
  /** Short status line. */
  tagline: string;
}

export type RoomStatus = 'lobby' | 'playing' | 'reveal' | 'over';

export interface RoomSettings {
  rounds: number;
  roundTime: number; // seconds
  categories: Category[];
  /** When true, code/logos start obscured and sharpen as the round timer runs. */
  progressiveReveal: boolean;
}

export interface Room {
  code: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Map<string, Player>;
  hostId: string;
  questions: Question[];
  /** IDs of questions served in recent games, newest first, so the next game can avoid repeats. */
  recentQuestionIds: string[];
  roundIndex: number;
  /** Timestamp (ms) when the current round ends. */
  endsAt: number;
  timer: NodeJS.Timeout | null;
  revealTimer: NodeJS.Timeout | null;
}

/** Public, serializable view of a player. */
export interface PublicPlayer {
  id: string;
  name: string;
  score: number;
  streak: number;
  answered: boolean;
  lastPoints: number;
  connected: boolean;
  isHost: boolean;
  avatar?: string;
  favTech?: string;
  color?: string;
  tagline?: string;
}

export interface PublicRoom {
  code: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: PublicPlayer[];
  hostId: string;
  roundIndex: number;
  totalRounds: number;
}
