import { describe, expect, it } from 'vitest';
import type { QuestionLogEntry } from '../data/types';
import { filterLog, groupLog, percent, toCsv } from './reports';

const row = (p: Partial<QuestionLogEntry>): QuestionLogEntry => ({
  id: Math.random().toString(), at: '2026-10-24T10:00:00Z', gameId: 'star-quiz', mode: 'solo', prompt: 'Q1', answer: 'a', tries: ['a'], ms: 2000, outcome: 'right', ...p,
});
const names = { student: (id?: string) => id ?? 'Unknown', set: (id?: string) => id ?? 'None', game: (id: string) => id };

describe('reports', () => {
  const log = [
    row({ studentId: 'ava' }),
    row({ studentId: 'ava', tries: ['b', 'a'] }),
    row({ studentId: 'ben', prompt: 'Q2', tries: ['c'], outcome: 'skipped', answer: 'a' }),
    row({ studentId: 'ben', prompt: 'Q2', tries: ['c'], outcome: 'skipped', answer: 'a', at: '2026-10-25T10:00:00Z' }),
    row({ studentId: 'ben', outcome: 'left', tries: [], ms: 0 }),
  ];
  it('groups by student with right, first-try and left counts', () => {
    const ava = groupLog(log, 'student', names).find((r) => r.key === 'ava')!;
    expect([ava.asked, ava.right, ava.firstTry, ava.left]).toEqual([2, 2, 1, 0]);
    const ben = groupLog(log, 'student', names).find((r) => r.key === 'ben')!;
    expect([ben.asked, ben.right, ben.left, ben.avgSeconds]).toEqual([3, 0, 1, 2]);
  });
  it('finds the most common wrong answer for a question', () => {
    expect(groupLog(log, 'question', names).find((r) => r.key === 'Q2')!.topWrong).toBe('c');
  });
  it('filters by date and search', () => {
    expect(filterLog(log, { from: '2026-10-25' })).toHaveLength(1);
    expect(filterLog(log, { search: 'q2' })).toHaveLength(2);
  });
  it('makes a CSV with quoted cells', () => {
    const csv = toCsv([{ key: 'x', label: 'Smith, Jo', asked: 2, right: 1, firstTry: 1, left: 0, avgSeconds: 3, topWrong: 'say "hi"', lastDay: '2026-10-26', minutes: 1 }], 'Student');
    expect(csv.split('\n')[1]).toBe('"Smith, Jo",2,1,50,1,0,3,"say ""hi"""');
    expect(percent(1, 3)).toBe(33);
  });
});

describe('remembered a week later', () => {
  const e = (prompt: string, at: string, outcome: 'right' | 'skipped', studentId = 'st1') =>
    ({ id: prompt + at + studentId, at, studentId, setId: 's', gameId: 'peg-drop', mode: 'solo' as const, prompt, answer: 'x', tries: [], ms: 0, outcome });
  it('counts questions asked again 7+ days after a right answer', async () => {
    const { retention } = await import('./reports');
    expect(retention([
      e('A', '2026-10-01T10:00:00Z', 'right'), e('A', '2026-10-09T10:00:00Z', 'right'),
      e('B', '2026-10-01T10:00:00Z', 'right'), e('B', '2026-10-10T10:00:00Z', 'skipped'),
      e('C', '2026-10-01T10:00:00Z', 'right'), e('C', '2026-10-03T10:00:00Z', 'skipped'), // too soon
      e('D', '2026-10-01T10:00:00Z', 'skipped'), e('D', '2026-10-12T10:00:00Z', 'right'), // never right first
    ])).toEqual({ checked: 2, kept: 1 });
  });
});

describe('weekUsage', () => {
  it('counts the last 7 days for one class', async () => {
    const { weekUsage } = await import('./reports');
    const now = Date.parse('2026-10-25T12:00:00Z');
    const e = (at: string, extra: object) => ({ id: at, at, gameId: 'game-show', mode: 'solo' as const, prompt: 'p', answer: 'a', tries: [], ms: 1, outcome: 'right' as const, classroomId: 'c1', studentId: 's1', ...extra });
    const log = [e('2026-10-24T10:00:00Z', {}), e('2026-10-23T10:00:00Z', { outcome: 'skipped', studentId: 's2', gameId: 'bubble-pop' }), e('2026-10-23T11:00:00Z', { gameId: 'game-show' }),
      e('2026-10-10T10:00:00Z', {}), e('2026-10-24T10:00:00Z', { classroomId: 'c2' }), e('2026-10-24T10:00:00Z', { outcome: 'left' as const })];
    expect(weekUsage(log, 'c1', now)).toEqual({ answered: 3, rightPct: 67, students: 2, topGame: 'game-show' });
    expect(weekUsage([], 'c1', now)).toEqual({ answered: 0, rightPct: 0, students: 0, topGame: undefined });
  });
});

describe('report views', () => {
  it('builds accuracy over time, skills, question and student stats from the log only', async () => {
    const r = await import('./reports');
    const log = [
      row({ studentId: 'ava', setId: 's1', at: '2026-10-01T10:00:00Z' }),
      row({ studentId: 'ben', setId: 's1', at: '2026-10-01T10:00:00Z', tries: ['b', 'a'] }),
      row({ studentId: 'ben', setId: 's1', prompt: 'Q2', at: '2026-10-20T10:00:00Z', tries: ['c', 'c'], outcome: 'skipped' }),
      row({ studentId: 'ava', setId: 's1', prompt: 'Q2', at: '2026-10-20T10:00:00Z' }),
    ];
    const time = r.accuracyOverTime(log);
    expect(time.by).toBe('week');
    expect(time.points.map((p) => [p.right, p.first])).toEqual([[100, 50], [50, 50]]);
    expect(r.bySkill(log, (id) => (id === 's1' ? ['L.1.2'] : undefined))).toEqual([{ code: 'L.1.2', answered: 4, first: 50 }]);
    const q2 = r.questionStats(log).find((q) => q.prompt === 'Q2')!;
    expect([q2.prompt, q2.first, q2.topWrong, q2.topWrongCount]).toEqual(['Q2', 50, 'c', 1]);
    const ben = r.studentStats(log)[0];
    expect([ben.id, ben.first, ben.retryGain]).toEqual(['ben', 0, 1]);
    expect(r.activityRuns(log).map((a) => [a.day, a.players])).toEqual([['2026-10-20', 2], ['2026-10-01', 2]]);
    const week = r.playWeek(log, '2026-10-20');
    expect(week.days).toHaveLength(7);
    expect(week.daysPlayed.get('ava')).toBe(1);
  });
  it('draws the aim line from the first session to the goal and says on track or below', async () => {
    const r = await import('./reports');
    const day = (d: string, right: boolean) => row({ studentId: 'ava', at: `${d}T10:00:00Z`, outcome: right ? 'right' : 'skipped', tries: right ? ['a'] : ['b'] });
    const pts = r.progressSessions([day('2026-11-01', false), day('2026-11-11', true), day('2026-11-21', false)], 80, '2026-11-21');
    expect(pts.map((p) => p.aim)).toEqual([0, 40, 80]);
    expect(r.progressStatus(pts)).toBe('below');
    expect(r.progressStatus(pts.slice(0, 2))).toBe('on');
    expect(r.progressStatus(pts.slice(0, 1))).toBe('early');
  });
});
