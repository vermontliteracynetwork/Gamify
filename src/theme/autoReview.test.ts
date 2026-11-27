import { describe, expect, it } from 'vitest';
import { autoReview } from './autoReview';
import { classicTheme } from './classic';

const theme = (name: string, tags: string[] = [], pieces = { a: { color: '#fff' }, b: { color: '#000' } }) => ({ ...classicTheme('game-show'), name, tags, pieces });
describe('autoReview', () => {
  it('approves a clean theme with its own art', () => expect(autoReview(theme('Quirky Capybaras', ['capybaras'])).lane).toBe('approve'));
  it('holds brands and characters for a person', () => expect(autoReview(theme('Mario Party')).lane).toBe('hold'));
  it('holds a theme with almost no art', () => expect(autoReview(theme('Ocean Day', [], { a: { color: '#fff' } } as never)).lane).toBe('hold'));
  it('strikes only clear rule-breaking words', () => expect(autoReview(theme('nazi stuff')).lane).toBe('strike'));
  it('does not strike on a word inside another word', () => expect(autoReview(theme('Sussex Seashells')).lane).not.toBe('strike'));
});
