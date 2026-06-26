export type Category = 'language' | 'framework' | 'company' | 'bug';
export type QuestionType = 'code' | 'logo';
export type RoomStatus = 'lobby' | 'playing' | 'reveal' | 'over';

export interface RoomSettings {
  rounds: number;
  roundTime: number;
  categories: Category[];
  progressiveReveal: boolean;
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
