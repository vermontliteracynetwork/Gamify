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
    const csv = toCsv([{ key: 'x', label: 'Smith, Jo', asked: 2, right: 1, firstTry: 1, left: 0, avgSeconds: 3, topWrong: 'say "hi"' }], 'Student');
    expect(csv.split('\n')[1]).toBe('"Smith, Jo",2,1,50,1,0,3,"say ""hi"""');
    expect(percent(1, 3)).toBe(33);
  });
});
