import { describe, expect, it } from 'vitest';
import type { QuestionLogEntry } from '../data/types';
import { filterLog, groupLog, percent, questionPlayStats, setPlayStats, toCsv } from './reports';

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

describe('how a set played', () => {
  const log = [
    row({ setId: 's1', prompt: 'Q1' }),
    row({ setId: 's1', prompt: 'Q1', tries: ['b', 'a'] }),
    row({ setId: 's1', prompt: 'Q2', tries: ['c', 'c'], outcome: 'skipped' }),
    row({ setId: 's1', prompt: 'Q2', outcome: 'left', tries: [] }),
    row({ setId: 's2', prompt: 'Q9' }),
    row({ prompt: 'no set' }),
  ];
  it('gives each set its first-try share of answered questions', () => {
    const s = setPlayStats(log);
    expect([s.get('s1')!.answered, s.get('s1')!.firstTry, s.get('s1')!.pct]).toEqual([3, 1, 33]);
    expect(s.get('s2')!.pct).toBe(100);
    expect(s.has('s3')).toBe(false);
  });
  it('gives each question its share and most picked wrong answer, counted once per try list', () => {
    const q = questionPlayStats(log, 's1');
    expect(q.get('Q1')).toMatchObject({ answered: 2, firstTry: 1, pct: 50, topWrong: 'b', topWrongCount: 1 });
    expect(q.get('Q2')).toMatchObject({ answered: 1, pct: 0, topWrong: 'c', topWrongCount: 1 });
    expect(q.has('Q9')).toBe(false);
  });
});
