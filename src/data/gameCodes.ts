import { newJoinCode } from '../auth/session';
import { data } from './index';
import { LIBRARY } from './library';
import { supabase } from './supabase';
import { withTimeout } from '../lib/withTimeout';
import type { QuestionSet } from './types';
import type { Tier } from '../config';

// Game codes (development plan Part 3B, path 2): the teacher picks a set and
// a game, Gamify makes a letters-only code and a link with it built in.
// Saved on this device until cloud accounts (Stage 5) share them.
// `due` (YYYY-MM-DD) makes it homework: the code works through that day.
// `plan`: homework made during the Plus trial keeps Plus until its due date.
export interface GameCode { code: string; gameId: string; setId: string; createdAt: string; live?: boolean; versus?: boolean; mirror?: boolean; design?: boolean; rosterClass?: string; cloud?: boolean; due?: string; lobby?: ClassLobby; minutes?: number; endAt?: number; goal?: number; plan?: Tier }
// The teacher's clock (2026-10-31): `minutes` each student plays, or
// `endAt` (ms) when every game ends together; `goal` ends a game at a score.
// `due`: a choice board sent as homework (owner, 2026-11-27) lasts until its due date.
export interface PlayLimits { minutes?: number; endAt?: number; goal?: number; due?: string }

// Pro class lobby (teacher, 2026-10-31): one fresh code for a class; each
// student (or group) gets their own game and set, or picks from a choice
// board. `plan` maps a student id to what they play; anyone not in it gets
// `all` (the whole-class pick).
export interface LobbyPick { gameId: string; setId: string }
export interface ClassLobby { classId: string; all?: LobbyPick; plan: Record<string, LobbyPick>; board?: { gameIds: string[]; setId: string } }
const KEY = 'game-codes';
// Game codes stop working after two weeks (development plan Stage 5:
// codes expire), so an old code on a board can't be reused by strangers.
export const GAME_CODE_DAYS = 14;
const fresh = (c: GameCode, now = Date.now()) => (c.due ? now <= Date.parse(`${c.due}T23:59:59`) : now - Date.parse(c.createdAt) < GAME_CODE_DAYS * 86400000);

// Codes made in this tab are found again even when the cloud save failed,
// so the live lobby always opens (owner, 2026-11-25).
const MADE = 'gamify:made-codes';
function rememberMade(c: GameCode) {
  try { const all = JSON.parse(sessionStorage.getItem(MADE) ?? '[]') as GameCode[]; sessionStorage.setItem(MADE, JSON.stringify([...all.filter((x) => x.code !== c.code), c].slice(-20))); } catch { /* private window */ }
}
function madeHere(code: string): GameCode | undefined {
  try { return (JSON.parse(sessionStorage.getItem(MADE) ?? '[]') as GameCode[]).find((c) => c.code === code.toUpperCase() && fresh(c)); } catch { return undefined; }
}

export async function listGameCodes(): Promise<GameCode[]> {
  return ((await data.getSetting<GameCode[]>(KEY)) ?? []).filter((c) => fresh(c));
}

// `design`: a code that opens the student theme studio (no Arcade to find it
// in since 2026-10-31; students get in only with a code).
export async function makeGameCode(gameId: string, setId: string, kind: 'play' | 'live' | 'versus' | 'mirror' | 'design' = 'play', due?: string, limits: PlayLimits = {}): Promise<GameCode> {
  // A cloud that does not answer never stops the lobby from opening (owner, 2026-11-25).
  const all = await withTimeout(listGameCodes()).catch((e) => { console.warn('game codes not loaded', e); return [] as GameCode[]; });
  const live = kind === 'live', versus = kind === 'versus', mirror = kind === 'mirror', design = kind === 'design';
  // A two-device game gets a fresh code every time; others reuse theirs.
  const same = versus || mirror || limits.minutes || limits.endAt || limits.goal ? undefined : all.find((c) => c.gameId === gameId && c.setId === setId && !!c.live === live && !c.versus && !!c.design === design && c.due === due);
  if (same) return same;
  // A class list or cloud hiccup never stops a game from opening (teacher, 2026-11-06).
  const classCodes = (await withTimeout(data.listClassrooms()).catch(() => [])).map((c) => c.joinCode ?? '');
  // Homework made during the Plus trial keeps Plus until it is due.
  const trialPlan = due ? await trialPlanNow() : undefined;
  const code: GameCode = { code: newJoinCode([...classCodes, ...all.map((c) => c.code)]), gameId, setId, createdAt: new Date().toISOString(), ...(live && { live: true }), ...(versus && { versus: true }), ...(mirror && { mirror: true }), ...(design && { design: true }), ...(due && { due }), ...(trialPlan && { plan: trialPlan }), ...limits };
  rememberMade(code);
  await withTimeout(data.setSetting(KEY, [...all, code])).catch((e) => console.warn('game code not saved', e));
  await withTimeout(shareToCloud(code, kind), 8000).catch((e) => console.warn('game code not shared', e));
  return code;
}

// The trial's plan, when the plan she plays on is above her saved plan.
async function trialPlanNow(): Promise<Tier | undefined> {
  const [tier, real] = await Promise.all([data.getSetting<Tier>('tier'), data.getSetting<Tier>('real-tier')]).catch(() => [undefined, undefined]);
  return tier && tier !== (real ?? 'free') ? tier : undefined;
}

// A Pro class lobby gets a fresh code every time it opens.
export async function makeLobbyCode(lobby: ClassLobby, limits: PlayLimits = {}): Promise<GameCode> {
  const all = await listGameCodes();
  const classCodes = (await data.listClassrooms()).map((c) => c.joinCode ?? '');
  const first = lobby.all ?? Object.values(lobby.plan)[0] ?? { gameId: lobby.board?.gameIds[0] ?? '', setId: lobby.board?.setId ?? '' };
  const code: GameCode = { code: newJoinCode([...classCodes, ...all.map((c) => c.code)]), gameId: first.gameId, setId: first.setId, createdAt: new Date().toISOString(), rosterClass: lobby.classId, lobby, ...limits };
  await data.setSetting(KEY, [...all, code]);
  return code;
}

// What one student plays from a class lobby: their own pick, the class
// pick, or the choice board.
export function lobbyPickFor(lobby: ClassLobby, studentId: string): LobbyPick | 'board' | null {
  return lobby.plan[studentId] ?? lobby.all ?? (lobby.board?.gameIds.length ? 'board' : null);
}

// With cloud accounts on, the code, a copy of its set and the teacher's
// student list reach students' own devices (0008_game_codes.sql).
async function shareToCloud(code: GameCode, kind: 'play' | 'live' | 'versus' | 'mirror' | 'design') {
  if (!supabase || !(await supabase.auth.getSession()).data.session) return;
  const set = code.setId ? (await data.getQuestionSet(code.setId)) ?? LIBRARY.find((s) => s.id === code.setId) : undefined;
  const classes = (await data.listClassrooms()).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  await supabase.from('game_codes').upsert({
    code: code.code, game_id: code.gameId, set_id: code.setId, kind,
    set_snapshot: set ?? {}, roster_class: classes[0]?.id ?? null,
    // Homework due dates need 0009_homework_due.sql.
    ...(code.due && { due: code.due }),
  });
}

// Sets that arrived with a cloud game code, kept for this tab so the game
// can load them (students do not have the teacher's sets).
const REMOTE = 'gamify:remote-sets';
export function remoteSet(id: string): QuestionSet | undefined {
  try { return (JSON.parse(sessionStorage.getItem(REMOTE) ?? '{}') as Record<string, QuestionSet>)[id]; } catch { return undefined; }
}
export function rememberSet(set: QuestionSet) {
  try { const all = JSON.parse(sessionStorage.getItem(REMOTE) ?? '{}') as Record<string, QuestionSet>; sessionStorage.setItem(REMOTE, JSON.stringify({ ...all, [set.id]: set })); } catch { /* this tab only */ }
}

// The game code a student's answers are sent under (cloud codes only).
const PLAYING = 'gamify:cloud-code';
export const cloudCodePlaying = () => { try { return sessionStorage.getItem(PLAYING) ?? ''; } catch { return ''; } };
export function playCloudCode(code: string) { try { if (code) sessionStorage.setItem(PLAYING, code); else sessionStorage.removeItem(PLAYING); } catch { /* this tab only */ } }

export async function findGameCode(code: string): Promise<GameCode | undefined> {
  const made = madeHere(code);
  if (made) return made;
  const mine = (await withTimeout(listGameCodes()).catch(() => [] as GameCode[])).find((c) => c.code === code.toUpperCase());
  if (mine || !supabase) return mine;
  const { data: rows } = await supabase.rpc('game_by_code', { c: code });
  const r = (rows as { code: string; game_id: string; set_id: string; kind: string; set_snapshot: QuestionSet; roster_class: string | null; created_at: string }[] | null)?.[0];
  if (!r) return undefined;
  if (r.set_snapshot?.id) rememberSet(r.set_snapshot);
  return {
    code: r.code, gameId: r.game_id, setId: r.set_id, createdAt: r.created_at, cloud: true, rosterClass: r.roster_class ?? undefined,
    ...(r.kind === 'live' && { live: true }), ...(r.kind === 'versus' && { versus: true }), ...(r.kind === 'mirror' && { mirror: true }),
  };
}

// A class join code typed on another device.
export async function findClassCode(code: string): Promise<{ id: string; name: string } | undefined> {
  if (!supabase) return undefined;
  const { data: rows } = await supabase.rpc('class_by_code', { c: code });
  return (rows as { id: string; name: string }[] | null)?.[0];
}

export const gameLink = (c: GameCode) => `${window.location.origin}/join/${c.code}`;

// Share a join link to a class stream in the classroom service many schools
// use (development plan Stage 5): its public share address, no account link.
export const classroomShare = (url: string, title: string) => `https://classroom.google.com/share?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;
