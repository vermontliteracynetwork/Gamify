// The take-turns engine shared by Share and Versus (product plan section 2).
// A turn player can be a team, a student, the computer or the teacher.

export type TurnKind = 'team' | 'student' | 'cpu' | 'teacher';
export type CpuLevel = 'easy' | 'medium' | 'hard';

export interface TurnPlayer {
  id: string;
  name: string;
  kind: TurnKind;
  colorIndex: number;
  score: number;
  // Students on this team, when teams come from the class list.
  members?: string[];
}

export interface TurnState {
  players: TurnPlayer[];
  turn: number; // index into players
  round: number; // 1-based, a round = everyone has had a turn
  history: TurnState[]; // for teacher undo
}

// Team colors each come with an icon (TEAM_ICONS in TeamBadge) so color is
// never the only way to tell teams apart.
export const TEAM_COLORS = ['#f6c544', '#5cc3a0', '#6aa9e9', '#f39a6b', '#c58ce8', '#ef7d96', '#9bd35a', '#f0d36b', '#7fd6e3', '#d8a46b'];

export function startTurns(players: TurnPlayer[]): TurnState {
  return { players, turn: 0, round: 1, history: [] };
}

export function current(s: TurnState): TurnPlayer {
  return s.players[s.turn];
}

function snapshot(s: TurnState): TurnState {
  return { ...s, players: s.players.map((p) => ({ ...p })), history: [] };
}

export function addPoints(s: TurnState, playerId: string, points: number): TurnState {
  return { ...s, history: [...s.history, snapshot(s)], players: s.players.map((p) => (p.id === playerId ? { ...p, score: Math.max(0, p.score + points) } : p)) };
}

export function setScores(s: TurnState, scores: Record<string, number>): TurnState {
  return { ...s, history: [...s.history, snapshot(s)], players: s.players.map((p) => (p.id in scores ? { ...p, score: Math.max(0, scores[p.id]) } : p)) };
}

export function nextTurn(s: TurnState): TurnState {
  const turn = (s.turn + 1) % s.players.length;
  return { ...s, history: [...s.history, snapshot(s)], turn, round: turn === 0 ? s.round + 1 : s.round };
}

export function undo(s: TurnState): TurnState {
  const prev = s.history[s.history.length - 1];
  return prev ? { ...prev, history: s.history.slice(0, -1) } : s;
}

export function leaders(s: TurnState): TurnPlayer[] {
  const top = Math.max(...s.players.map((p) => p.score));
  return s.players.filter((p) => p.score === top);
}

// The computer's chance of "getting it right" on its own turn. It never
// answers students' questions; this only decides its game moves.
export const CPU_ACCURACY: Record<CpuLevel, number> = { easy: 0.5, medium: 0.7, hard: 0.9 };
