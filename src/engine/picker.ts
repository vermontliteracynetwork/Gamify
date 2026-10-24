import type { MultipleChoiceQuestion, QuestionSet } from '../data/types';
import { fallbackQuestion } from './fallback';
import { isPlayable } from './questions';

// How games draw questions (question engine section 1, borrowed from the
// Dashboard's questionPick.ts). The pool is the sets assigned to the student
// right now. While any of them is starred, every question comes from the
// starred sets. A set is picked at random, then a question from it, avoiding
// the question just asked. No playable sets: a generated fallback question.

export interface PoolSet {
  set: QuestionSet;
  starred: boolean;
}

export interface Drawn {
  question: MultipleChoiceQuestion;
  setId?: string;
}

export function drawQuestion(pool: PoolSet[], avoidId?: string, rand: () => number = Math.random): Drawn {
  const sets = pool
    .map((p) => ({ ...p, questions: p.set.questions.filter(isPlayable) }))
    .filter((p) => p.questions.length > 0);
  if (sets.length === 0) return { question: fallbackQuestion(rand) };

  const starred = sets.filter((s) => s.starred);
  const from = starred.length > 0 ? starred : sets;
  // Try a few times to avoid repeating the last question.
  for (let tries = 0; tries < 6; tries++) {
    const pick = from[Math.floor(rand() * from.length)];
    const options = pick.questions.length > 1 && avoidId ? pick.questions.filter((q) => q.id !== avoidId) : pick.questions;
    const question = options[Math.floor(rand() * options.length)];
    if (question.id !== avoidId || tries === 5) return { question, setId: pick.set.id };
  }
  throw new Error('unreachable');
}
