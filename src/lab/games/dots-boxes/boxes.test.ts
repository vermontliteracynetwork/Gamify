import { describe, expect, it } from 'vitest';
import { allLines, boxesOf, closes, count, cpuLine, loose, paintable, quake, safe, sizeFor, threeSided } from './boxes';

const S = sizeFor(2); // 3 by 4

describe('box builder', () => {
  it('sizes the board by teams and counts its lines', () => {
    expect(S).toEqual({ R: 3, C: 4 });
    expect(allLines(S).length).toBe(4 * 4 + 3 * 5);
    expect(sizeFor(4)).toEqual({ R: 4, C: 5 });
  });
  it('knows which boxes a line borders', () => {
    expect(boxesOf('h-0-0', S)).toEqual(['0-0']);
    expect(boxesOf('h-1-2', S)).toEqual(['0-2', '1-2']);
    expect(boxesOf('v-2-4', S)).toEqual(['2-3']);
  });
  it('closing the fourth side closes the box', () => {
    const lines = { 'h-0-0': 'a', 'h-1-0': 'b', 'v-0-0': 'a' };
    expect(closes(lines, 'v-0-1', S)).toEqual(['0-0']);
    expect(threeSided(lines, {}, S)).toEqual(['0-0']);
    expect(threeSided(lines, { '0-0': 'a' }, S)).toEqual([]);
  });
  it('the computer takes a box, else plays safe', () => {
    const lines = { 'h-0-0': 'a', 'h-1-0': 'b', 'v-0-0': 'a' };
    expect(cpuLine(lines, S)).toBe('v-0-1');
    const safe = cpuLine({ 'h-0-0': 'a' }, S)!;
    expect(boxesOf(safe, S).every((b) => b !== '0-0')).toBe(true);
  });
  it('an earthquake moves loose lines without closing boxes', () => {
    const lines = { 'h-0-0': 'a', 'h-1-0': 'b', 'v-0-0': 'a', 'v-0-1': 'b', 'h-3-3': 'a', 'v-2-4': 'b' };
    const claimed = { '0-0': 'b' };
    expect(loose(lines, claimed, S).sort()).toEqual(['h-3-3', 'v-2-4']);
    const q = quake(lines, claimed, S, 3);
    expect(Object.keys(q.lines).length).toBe(6);
    expect(q.lines['h-0-0']).toBe('a');
    for (const [, to] of q.moved) for (const b of boxesOf(to, S)) expect(count(q.lines, b)).toBeLessThan(3);
  });
  it('paints boxes with two or more sides and knows safe lines', () => {
    const lines = { 'h-0-0': 'a', 'v-0-0': 'b' };
    expect(paintable(lines, {}, S)).toEqual(['0-0']);
    expect(safe(lines, 'h-1-0', S)).toBe(false);
    expect(safe(lines, 'h-3-3', S)).toBe(true);
  });
});
