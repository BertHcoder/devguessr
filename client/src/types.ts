export type Category = 'language' | 'framework' | 'company' | 'bug';
export type QuestionType = 'code' | 'logo';
export type RoomStatus = 'lobby' | 'playing' | 'reveal' | 'over';

export interface RoomSettings {
  rounds: number;
  roundTime: number;
  categories: Category[];
  progressiveReveal: boolean;
  powerUps: boolean;
}

/** Optional, player-customizable profile sent when joining and editable in the lobby. */
export interface PlayerProfile {
  name: string;
  /** Emoji avatar, or '' to fall back to the name initial. */
  avatar: string;
  /** Free-text favourite technology shown as a badge. */
  favTech: string;
  /** Hex accent colour (e.g. '#ff6a3d'), or '' to use the auto colour. */
  color: string;
  /** Short status line. */
  tagline: string;
}

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
  shield?: boolean;
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

export interface RoundStartPayload {
  question: PublicQuestion;
  index: number;
  total: number;
  endsAt: number;
}

export interface RoundResultPayload {
  correctIndex: number;
  answer: string;
  fact: string | null;
  results: Record<string, { choice: number | null; correct: boolean; points: number }>;
  leaderboard: PublicPlayer[];
}

export interface GameOverPayload {
  leaderboard: PublicPlayer[];
}
