import { describe, expect, it } from 'vitest';
import { t } from './index';

describe('t', () => {
  it('returns English text', () => expect(t('home.title')).toBe('Pick a game'));
  it('keeps unknown placeholders', () => expect(t('home.title', { x: 1 })).toBe('Pick a game'));
  it('uses the singular form for 1', () => expect(t('sets.questions', { count: 1 })).toBe('1 question'));
  it('fills placeholders', () => expect(t('sets.questions', { count: 4 })).toBe('4 questions'));
});
