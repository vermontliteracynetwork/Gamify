import type { QuestionLogEntry } from '../data/types';

// Report math over the question log (product plan 4C): group rows, count
// right answers and first-try rights, and find the most common wrong answer.

export type GroupBy = 'student' | 'question' | 'set' | 'game' | 'day' | 'team';

export interface ReportRow {
  key: string;
  label: string;
  asked: number;
  right: number;
  firstTry: number;
  left: number;
  avgSeconds: number;
  topWrong?: string;
  // Last day played and total minutes spent (teacher, 2026-10-26).
  lastDay: string;
  minutes: number;
}

export interface ReportFilter { studentId?: string; gameId?: string; setId?: string; from?: string; to?: string; search?: string }

export function filterLog(log: QuestionLogEntry[], f: ReportFilter): QuestionLogEntry[] {
  const q = f.search?.trim().toLowerCase();
  return log.filter((e) =>
    (!f.studentId || e.studentId === f.studentId) &&
    (!f.gameId || e.gameId === f.gameId) &&
    (!f.setId || e.setId === f.setId) &&
    (!f.from || e.at.slice(0, 10) >= f.from) &&
    (!f.to || e.at.slice(0, 10) <= f.to) &&
    (!q || e.prompt.toLowerCase().includes(q) || (e.teamName ?? '').toLowerCase().includes(q)));
}

export function groupLog(log: QuestionLogEntry[], by: GroupBy, names: { student: (id?: string) => string; set: (id?: string) => string; game: (id: string) => string }): ReportRow[] {
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of log) {
    const key = by === 'student' ? e.studentId ?? '' : by === 'question' ? e.prompt : by === 'set' ? e.setId ?? '' : by === 'game' ? e.gameId : by === 'day' ? e.at.slice(0, 10) : e.teamName ?? '';
    groups.set(key, [...(groups.get(key) ?? []), e]);
  }
  return [...groups].map(([key, rows]) => {
    const answered = rows.filter((r) => r.outcome !== 'left');
    const wrongs = new Map<string, number>();
    for (const r of rows) for (const w of r.tries.filter((x) => x !== r.answer)) wrongs.set(w, (wrongs.get(w) ?? 0) + 1);
    const topWrong = [...wrongs].sort((a, b) => b[1] - a[1])[0]?.[0];
    const label = by === 'student' ? names.student(key || undefined) : by === 'set' ? names.set(key || undefined) : by === 'game' ? names.game(key) : key || '(none)';
    return {
      key, label,
      asked: rows.length,
      right: rows.filter((r) => r.outcome === 'right').length,
      firstTry: rows.filter((r) => r.outcome === 'right' && r.tries.length <= 1).length,
      left: rows.length - answered.length,
      avgSeconds: answered.length ? Math.round(answered.reduce((s, r) => s + r.ms, 0) / answered.length / 100) / 10 : 0,
      topWrong,
      lastDay: rows.reduce((d, r) => (r.at > d ? r.at : d), '').slice(0, 10),
      minutes: Math.round(rows.reduce((s, r) => s + r.ms, 0) / 6000) / 10,
    };
  });
}

export const percent = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

export function toCsv(rows: ReportRow[], groupLabel: string): string {
  const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = [groupLabel, 'Questions', 'Right', 'Right %', 'Right on first try', 'Left early', 'Average seconds', 'Most common wrong answer'];
  return [head, ...rows.map((r) => [r.label, r.asked, r.right, percent(r.right, r.asked), r.firstTry, r.left, r.avgSeconds, r.topWrong ?? ''])].map((l) => l.map(esc).join(',')).join('\n');
}

// Remembered a week later (Research page, how we will measure): of the
// questions a student got right and was asked again 7 or more days later,
// how many they got right again. Keyed by student (or team), set and prompt.
export function retention(log: QuestionLogEntry[]): { checked: number; kept: number } {
  const byKey = new Map<string, QuestionLogEntry[]>();
  for (const e of log) {
    if (e.outcome === 'left') continue;
    const k = `${e.studentId ?? e.teamName ?? ''}|${e.setId ?? ''}|${e.prompt}`;
    byKey.set(k, [...(byKey.get(k) ?? []), e]);
  }
  let checked = 0, kept = 0;
  for (const list of byKey.values()) {
    const sorted = list.sort((a, b) => a.at.localeCompare(b.at));
    const first = sorted.find((e) => e.outcome === 'right');
    if (!first) continue;
    const later = sorted.find((e) => new Date(e.at).getTime() - new Date(first.at).getTime() >= 7 * 86400000);
    if (!later) continue;
    checked += 1;
    if (later.outcome === 'right') kept += 1;
  }
  return { checked, kept };
}

// A class's week at a glance (teacher-side usage numbers, Stage 8): questions
// answered, the share right, students who played and the most played game,
// over the last 7 days. Teacher pages only, never on student pages.
export function weekUsage(log: QuestionLogEntry[], classroomId?: string, now = Date.now()): { answered: number; rightPct: number; students: number; topGame?: string } {
  const week = log.filter((e) => (!classroomId || e.classroomId === classroomId) && e.outcome !== 'left' && now - new Date(e.at).getTime() < 7 * 86400000);
  const games = new Map<string, number>();
  for (const e of week) games.set(e.gameId, (games.get(e.gameId) ?? 0) + 1);
  const topGame = [...games.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
  return { answered: week.length, rightPct: percent(week.filter((e) => e.outcome === 'right').length, week.length), students: new Set(week.map((e) => e.studentId).filter(Boolean)).size, topGame };
}

// ---------- Report views (approved /brand Teacher portal 7a, 7b, 7d; 2026-11-25) ----------
// Every number below comes from the question log; nothing is estimated.

const answeredOf = (log: QuestionLogEntry[]) => log.filter((e) => e.outcome !== 'left');
export const isFirstTry = (e: QuestionLogEntry) => e.outcome === 'right' && e.tries.length <= 1;
/** Right on first try, as a share of the answered questions (left early is left out). */
export function firstTryPct(log: QuestionLogEntry[]): number {
  const done = answeredOf(log);
  return percent(done.filter(isFirstTry).length, done.length);
}
export function rightPct(log: QuestionLogEntry[]): number {
  const done = answeredOf(log);
  return percent(done.filter((e) => e.outcome === 'right').length, done.length);
}
export const dayOf = (e: QuestionLogEntry) => e.at.slice(0, 10);
const shiftDay = (day: string, by: number) => { const d = new Date(`${day}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + by); return d.toISOString().slice(0, 10); };
const mondayOf = (day: string) => shiftDay(day, -((new Date(`${day}T12:00:00Z`).getUTCDay() + 6) % 7));
const dayMs = (day: string) => new Date(`${day}T12:00:00Z`).getTime();

// The most picked wrong answer over some answers, with how many answers picked it.
function topWrongIn(xs: QuestionLogEntry[]): { answer: string; prompt: string; count: number } | undefined {
  const wrongs = new Map<string, { prompt: string; count: number }>();
  for (const r of xs) for (const w of new Set(r.tries.filter((x) => x !== r.answer))) {
    const k = `${r.prompt}\u0000${w}`;
    wrongs.set(k, { prompt: r.prompt, count: (wrongs.get(k)?.count ?? 0) + 1 });
  }
  const top = [...wrongs].sort((a, b) => b[1].count - a[1].count)[0];
  return top && { answer: top[0].split('\u0000')[1], prompt: top[1].prompt, count: top[1].count };
}

export interface TimePoint { key: string; answered: number; right: number; first: number }
/** Right and right on first try over time: by week when play spans more than 14 days, else by day. */
export function accuracyOverTime(log: QuestionLogEntry[]): { by: 'week' | 'day'; points: TimePoint[] } {
  const done = answeredOf(log);
  const days = [...new Set(done.map(dayOf))].sort();
  const by = days.length && dayMs(days[days.length - 1]) - dayMs(days[0]) > 14 * 86400000 ? 'week' : 'day';
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of done) { const k = by === 'week' ? mondayOf(dayOf(e)) : dayOf(e); groups.set(k, [...(groups.get(k) ?? []), e]); }
  const points = [...groups].sort((a, b) => a[0].localeCompare(b[0])).map(([key, xs]) => ({ key, answered: xs.length, right: rightPct(xs), first: firstTryPct(xs) }));
  return { by, points };
}

export interface SkillRow { code: string; answered: number; first: number }
/** Right on first try for the questions in sets tagged with each Common Core standard, strongest first. */
export function bySkill(log: QuestionLogEntry[], standardsOf: (setId?: string) => string[] | undefined): SkillRow[] {
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of answeredOf(log)) for (const code of standardsOf(e.setId) ?? []) groups.set(code, [...(groups.get(code) ?? []), e]);
  return [...groups].map(([code, xs]) => ({ code, answered: xs.length, first: firstTryPct(xs) })).sort((a, b) => b.first - a.first || a.code.localeCompare(b.code));
}

export interface QuestionStat { prompt: string; answer: string; answered: number; first: number; right: number; topWrong?: string; topWrongCount: number; avgSeconds: number }
/** One row per question: first try, right by the last try, the most picked wrong answer and its count, average seconds. Sorted by need (lowest first try first). */
export function questionStats(log: QuestionLogEntry[]): QuestionStat[] {
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of answeredOf(log)) groups.set(e.prompt, [...(groups.get(e.prompt) ?? []), e]);
  return [...groups].map(([prompt, xs]) => {
    const top = topWrongIn(xs);
    return {
      prompt, answer: xs[0].answer, answered: xs.length, first: firstTryPct(xs), right: rightPct(xs),
      topWrong: top?.answer, topWrongCount: top?.count ?? 0,
      avgSeconds: Math.round(xs.reduce((s, r) => s + r.ms, 0) / xs.length / 100) / 10,
    };
  }).sort((a, b) => a.first - b.first || b.answered - a.answered || a.prompt.localeCompare(b.prompt));
}

export interface StudentStat { id: string; answered: number; right: number; firstCount: number; first: number; retryGain: number; slip?: { answer: string; prompt: string }; minutes: number }
/** One row per student, sorted by need (lowest first try first). retryGain: right only after a retry. slip: the most common wrong answer. */
export function studentStats(log: QuestionLogEntry[]): StudentStat[] {
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of log) if (e.studentId) groups.set(e.studentId, [...(groups.get(e.studentId) ?? []), e]);
  return [...groups].map(([id, all]) => {
    const xs = answeredOf(all);
    const firstCount = xs.filter(isFirstTry).length, right = xs.filter((e) => e.outcome === 'right').length;
    return { id, answered: xs.length, right, firstCount, first: percent(firstCount, xs.length), retryGain: right - firstCount, slip: topWrongIn(xs), minutes: Math.round(all.reduce((s, e) => s + e.ms, 0) / 6000) / 10 };
  }).sort((a, b) => a.first - b.first || a.answered - b.answered);
}

export interface Week { days: string[]; minutes: number[]; daysPlayed: Map<string, number> }
/** The 7 days ending on `end` (YYYY-MM-DD): minutes played each day, and on how many of them each student played. */
export function playWeek(log: QuestionLogEntry[], end: string): Week {
  const days = Array.from({ length: 7 }, (_, i) => shiftDay(end, i - 6));
  const inWeek = log.filter((e) => days.includes(dayOf(e)));
  const minutes = days.map((d) => Math.round(inWeek.filter((e) => dayOf(e) === d).reduce((s, e) => s + e.ms, 0) / 60000));
  const played = new Map<string, Set<string>>();
  for (const e of inWeek) if (e.studentId) played.set(e.studentId, new Set([...(played.get(e.studentId) ?? []), dayOf(e)]));
  return { days, minutes, daysPlayed: new Map([...played].map(([k, v]) => [k, v.size])) };
}

export interface ActivityRun { key: string; setId?: string; gameId: string; mode: QuestionLogEntry['mode']; day: string; log: QuestionLogEntry[]; players: number }
/** Activities as played: one set in one game, one way of playing, on one day. Newest first. */
export function activityRuns(log: QuestionLogEntry[]): ActivityRun[] {
  const groups = new Map<string, QuestionLogEntry[]>();
  for (const e of log) { const k = `${e.setId ?? ''}|${e.gameId}|${e.mode}|${dayOf(e)}`; groups.set(k, [...(groups.get(k) ?? []), e]); }
  return [...groups].map(([key, xs]) => ({ key, setId: xs[0].setId, gameId: xs[0].gameId, mode: xs[0].mode, day: dayOf(xs[0]), log: xs, players: new Set(xs.map((e) => e.studentId ?? e.teamName ?? '')).size }))
    .sort((a, b) => b.day.localeCompare(a.day) || b.log.length - a.log.length);
}

export interface SessionPoint { day: string; first: number; answered: number; aim: number }
/** Progress monitoring (curriculum-based measurement): each day a student played is a session; the aim line runs straight from their first session to the goal on the goal date. */
export function progressSessions(log: QuestionLogEntry[], goal: number, goalDay: string): SessionPoint[] {
  const done = answeredOf(log);
  const days = [...new Set(done.map(dayOf))].sort();
  if (!days.length) return [];
  const pts = days.map((day) => { const xs = done.filter((e) => dayOf(e) === day); return { day, first: firstTryPct(xs), answered: xs.length }; });
  const t0 = dayMs(days[0]), t1 = Math.max(t0 + 86400000, dayMs(goalDay)), start = pts[0].first;
  return pts.map((p) => ({ ...p, aim: Math.round(Math.min(Math.max(goal, start), start + ((goal - start) * Math.min(1, (dayMs(p.day) - t0) / (t1 - t0))))) }));
}
/** The decision rule in words: too early (one session), on track (latest at or above the aim line) or below it. */
export function progressStatus(points: SessionPoint[]): 'early' | 'on' | 'below' {
  if (points.length < 2) return 'early';
  const last = points[points.length - 1];
  return last.first >= last.aim ? 'on' : 'below';
}
