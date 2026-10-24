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
    };
  });
}

export const percent = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

export function toCsv(rows: ReportRow[], groupLabel: string): string {
  const esc = (v: string | number) => { const s = String(v); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
  const head = [groupLabel, 'Questions', 'Right', 'Right %', 'Right on first try', 'Left early', 'Average seconds', 'Most common wrong answer'];
  return [head, ...rows.map((r) => [r.label, r.asked, r.right, percent(r.right, r.asked), r.firstTry, r.left, r.avgSeconds, r.topWrong ?? ''])].map((l) => l.map(esc).join(',')).join('\n');
}
