import { describe, expect, it } from 'vitest';
import texts from './ccss-text.json';
import { lookupStandard } from './standardText';

describe('Common Core text', () => {
  const T = texts as Record<string, string>;
  it('finds a standard by its usual code', () => expect(lookupStandard(T, 'K.CC.1')).toBe('Count to 100 by ones and by tens.'));
  it('reads codes with a cluster letter or the long prefix', () => {
    expect(lookupStandard(T, '1.OA.C.6')).toBe(lookupStandard(T, '1.OA.6'));
    expect(lookupStandard(T, 'CCSS.MATH.CONTENT.K.CC.A.1')).toBe('Count to 100 by ones and by tens.');
    expect(lookupStandard(T, 'HSA-SSE.A.1')).toBe(lookupStandard(T, 'A-SSE.1'));
  });
  it('sub-items have their own text, or fall back to the parent', () => {
    expect(lookupStandard(T, 'RF.K.3a')).toBeTruthy();
    expect(lookupStandard(T, 'RF.K.3z')).toBe(lookupStandard(T, 'RF.K.3'));
  });
  it('unknown codes have no text, and no text has an em dash', () => {
    expect(lookupStandard(T, 'ZZ.9.9')).toBeUndefined();
    expect(Object.values(T).some((s) => s.includes('—'))).toBe(false);
  });
});
