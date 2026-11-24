import { describe, expect, it } from 'vitest';
import { borrowOf, codeChoices, makeCode, rollBox, sameCode, virusOf } from './rules';

describe('code crackers', () => {
  it('makes codes of three different symbols', () => {
    for (let i = 0; i < 50; i++) expect(new Set(makeCode()).size).toBe(3);
  });
  it('offers the real code among different decoys', () => {
    for (let i = 0; i < 100; i++) {
      const real = makeCode();
      const list = codeChoices(real);
      expect(list).toHaveLength(4);
      expect(list.filter((c) => sameCode(c, real))).toHaveLength(1);
      for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) expect(sameCode(list[a], list[b])).toBe(false);
    }
    expect(codeChoices(makeCode(), 2)).toHaveLength(2);
  });
  it('never hacks when no one has crystals or hacks are off, no virus at zero', () => {
    for (let i = 0; i < 300; i++) expect(['hack', 'virus']).not.toContain(rollBox({ others: false, mine: 0, hack: true }).kind);
    for (let i = 0; i < 300; i++) expect(rollBox({ others: true, mine: 10 }).kind).not.toBe('hack');
  });
  it('borrows and nibbles fairly', () => {
    expect(borrowOf(100)).toBe(25);
    expect(borrowOf(3)).toBe(3);
    expect(virusOf(200)).toBe(20);
    expect(virusOf(2)).toBe(2);
  });
});
