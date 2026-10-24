import { describe, expect, it } from 'vitest';
import type { MultipleChoiceQuestion, QuestionSet } from '../data/types';
import { fallbackQuestion } from './fallback';
import { drawQuestion } from './picker';
import { questionIssue, shuffleChoices } from './questions';

const q = (id: string, extra: Partial<MultipleChoiceQuestion> = {}): MultipleChoiceQuestion => ({ id, kind: 'mc', prompt: `Q ${id}`, choices: ['a', 'b', 'c'], correctIndex: 1, ...extra });
const set = (id: string, questions: MultipleChoiceQuestion[]): QuestionSet => ({ id, name: id, questions, ownerId: 't', visibility: 'private', createdAt: '', updatedAt: '' });

// Deterministic "random" that walks through the given values.
const seq = (...values: number[]) => { let i = 0; return () => values[i++ % values.length]; };

describe('questionIssue', () => {
  it('accepts a complete question', () => expect(questionIssue(q('1'))).toBeNull());
  it('needs a prompt', () => expect(questionIssue(q('1', { prompt: ' ' }))).toBe('Type the question.'));
  it('needs 2 answers', () => expect(questionIssue(q('1', { choices: ['a', ''] }))).toBe('Add at least 2 answers.'));
  it('rejects duplicate answers', () => expect(questionIssue(q('1', { choices: ['a', 'a'] }))).toBe('Two answers are the same.'));
  it('needs picture descriptions', () => expect(questionIssue(q('1', { imageUrl: 'x.png' }))).toMatch(/Describe the picture/));
});

describe('shuffleChoices', () => {
  it('keeps the right answer right', () => {
    for (let s = 0; s < 20; s++) {
      const shuffled = shuffleChoices(q('1'), seq(s / 20, (s * 7 % 20) / 20));
      expect(shuffled.choices[shuffled.correctIndex]).toBe('b');
      expect([...shuffled.choices].sort()).toEqual(['a', 'b', 'c']);
    }
  });
});

describe('drawQuestion', () => {
  const a = set('A', [q('a1'), q('a2')]);
  const b = set('B', [q('b1')]);

  it('only draws from starred sets while any are starred', () => {
    for (let s = 0; s < 10; s++) {
      expect(drawQuestion([{ set: a, starred: false }, { set: b, starred: true }], undefined, seq(s / 10)).setId).toBe('B');
    }
  });

  it('avoids the question just asked', () => {
    for (let s = 0; s < 10; s++) {
      expect(drawQuestion([{ set: a, starred: false }], 'a1', seq(0, s / 10)).question.id).toBe('a2');
    }
  });

  it('skips unplayable questions and falls back when nothing is playable', () => {
    const broken = set('C', [q('c1', { prompt: '' })]);
    const drawn = drawQuestion([{ set: broken, starred: true }]);
    expect(drawn.setId).toBeUndefined();
    expect(drawn.question.id).toMatch(/^fallback:/);
  });
});

describe('fallbackQuestion', () => {
  it('always has 4 different choices including the answer', () => {
    for (let s = 0; s < 50; s++) {
      const f = fallbackQuestion(seq(s / 50, ((s * 13) % 50) / 50, ((s * 29) % 50) / 50));
      expect(new Set(f.choices).size).toBe(4);
      expect(questionIssue(f)).toBeNull();
    }
  });
});
