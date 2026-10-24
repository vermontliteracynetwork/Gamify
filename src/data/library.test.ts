import { describe, expect, it } from 'vitest';
import { questionIssue } from '../engine/questions';
import { LIBRARY } from './library';

describe('starter library', () => {
  it("has at least 15 sets across ages", () => expect(LIBRARY.length).toBeGreaterThanOrEqual(15));
  it('every question is ready to play', () => {
    for (const set of LIBRARY) for (const q of set.questions) expect([set.id, q.prompt, questionIssue(q)]).toEqual([set.id, q.prompt, null]);
  });
  it('ids are unique', () => {
    const ids = LIBRARY.flatMap((s) => [s.id, ...s.questions.map((q) => q.id)]);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it('uses no em dashes (copy rule)', () => expect(JSON.stringify(LIBRARY)).not.toMatch(/—/));
});
