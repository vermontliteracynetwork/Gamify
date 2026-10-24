import { describe, expect, it } from 'vitest';
import { pageTitle } from './pageTitle';

describe('page titles', () => {
  it('names each page and game', () => {
    expect(pageTitle('/teacher/classes')).toBe('Classes | Gamify');
    expect(pageTitle('/teacher/classes/c1')).toBe('Class | Gamify');
    expect(pageTitle('/games/bubble-pop')).toBe('Bubble Pop | Gamify');
    expect(pageTitle('/nowhere')).toBe('Gamify');
  });
});
