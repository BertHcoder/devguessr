export type Category = 'language' | 'framework' | 'company';

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
}

export type RoomStatus = 'lobby' | 'playing' | 'reveal' | 'over';

export interface RoomSettings {
  rounds: number;
  roundTime: number; // seconds
  categories: Category[];
}

export interface Room {
  code: string;
  status: RoomStatus;
  settings: RoomSettings;
  players: Map<string, Player>;
  hostId: string;
  questions: Question[];
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
