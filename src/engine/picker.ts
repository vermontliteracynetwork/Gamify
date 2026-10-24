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

// Assigned sets are used evenly (teacher design, development plan Part 3B):
// sets take turns, and each set deals its questions in a random order with
// no repeats until it runs out, then reshuffles. Starred sets still win.
export function makeDeck(pool: PoolSet[], rand: () => number = Math.random) {
  const sets = pool
    .map((p) => ({ ...p, questions: p.set.questions.filter(isPlayable) }))
    .filter((p) => p.questions.length > 0);
  const starred = sets.filter((s) => s.starred);
  const from = starred.length > 0 ? starred : sets;
  const piles = new Map<string, MultipleChoiceQuestion[]>();
  let turn = Math.floor(rand() * Math.max(1, from.length));
  const shuffled = (qs: MultipleChoiceQuestion[]) => {
    const a = [...qs];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  return {
    next(avoidId?: string): Drawn {
      if (from.length === 0) return { question: fallbackQuestion(rand) };
      const pick = from[turn++ % from.length];
      let pile = piles.get(pick.set.id);
      if (!pile || pile.length === 0) {
        pile = shuffled(pick.questions);
        if (pile.length > 1 && pile[pile.length - 1].id === avoidId) pile.unshift(pile.pop()!);
        piles.set(pick.set.id, pile);
      }
      return { question: pile.pop()!, setId: pick.set.id };
    },
  };
}
