export interface Player {
  id: string;
  name: string;
  serve: number; // 0-10
  set: number; // 0-10
  block: number; // 0-10
  receive: number; // 0-10
  attack: number; // 0-10
  defense: number; // 0-10
  teams: string[]; // team names
  photo?: string; // base64 or file path
  notes?: string;
  availability: 'available' | 'unavailable';
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  name: string;
  logo?: string; // base64 or file path
  playingDays: string[]; // ['sun', 'mon', 'tue', etc.]
  playingTime?: string; // "HH:MM" format
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchTemplate {
  id: string;
  name: string;
  numberOfTeams: number;
  playersPerTeam?: number;
  skillWeights: SkillWeights;
  defaultFilters: MatchFilters;
  createdAt: Date;
  updatedAt: Date;
}

export interface Match {
  id: string;
  name: string;
  numberOfTeams: number;
  playersPerTeam?: number;
  skillWeights: SkillWeights;
  filters: MatchFilters;
  teams: TeamMatch[];
  randomSeed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMatch {
  id: string;
  name: string;
  players: PlayerMatch[];
  totalScore: number;
  skillAverages: SkillAverages;
}

export interface PlayerMatch {
  playerId: string;
  playerName: string;
  totalScore: number;
  skills: PlayerSkills;
  isLocked: boolean;
  photo?: string;
}

export interface PlayerSkills {
  serve: number;
  set: number;
  block: number;
  receive: number;
  attack: number;
  defense: number;
}

export interface SkillWeights {
  serve: number;
  set: number;
  block: number;
  receive: number;
  attack: number;
  defense: number;
}

export interface SkillAverages {
  serve: number;
  set: number;
  block: number;
  receive: number;
  attack: number;
  defense: number;
}

export interface MatchFilters {
  teamFilter?: string;
  searchQuery?: string;
  availabilityFilter: 'all' | 'available' | 'unavailable';
}

export interface CSVPlayer {
  Name: string;
  Serve: string;
  Set: string;
  Block: string;
  Receive: string;
  Attack: string;
  Defense: string;
  Teams: string;
  Notes: string;
  Availability: string;
}

export interface TeamGenerationResult {
  teams: TeamMatch[];
  totalScoreDifference: number;
  skillBalanceScore: number;
  iterations: number;
  executionTime: number;
}

export interface SwapAction {
  playerId: string;
  fromTeamIndex: number;
  toTeamIndex: number;
  timestamp: Date;
}

export interface UndoRedoStack {
  actions: SwapAction[];
  maxActions: number;
}
