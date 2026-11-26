import { describe, expect, it } from 'vitest';
import { GROUNDS, PIECES } from './FeaturesPage';

// Try It offers palette colors only (Classic Art Director, 2026-11-26).
const PALETTE = ['#c8f0dc', '#bfdff3', '#ffd3e6', '#fff1b8', '#ddd6ff', '#ffd9b8', '#1d1a33', '#f6f0e4', '#fffaf0',
  '#22b04a', '#4ba3e8', '#f055a5', '#fabe37', '#ff9b28', '#6a45f0', '#1fb5a8', '#ccd537'];
describe('Try It swatches', () => {
  it('every swatch is a palette color', () => {
    for (const [, hex] of [...GROUNDS, ...PIECES]) expect(PALETTE).toContain(hex.toLowerCase());
  });
});
