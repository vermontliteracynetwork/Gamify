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
