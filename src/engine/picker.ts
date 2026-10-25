import type { MultipleChoiceQuestion, QuestionLogEntry, QuestionSet } from '../data/types';
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

// The review pile (research brief, gap 2: spacing across days): questions a
// student missed on an earlier day and hasn't answered right since. Keyed by
// set and prompt, the way the question log records them.
export const reviewKey = (setId: string | undefined, prompt: string) => `${setId ?? ''}|${prompt}`;
export function reviewKeys(log: QuestionLogEntry[], today = new Date().toISOString().slice(0, 10)): Set<string> {
  const latest = new Map<string, QuestionLogEntry>();
  for (const e of [...log].sort((a, b) => a.at.localeCompare(b.at))) {
    if (e.outcome === 'left') continue;
    latest.set(reviewKey(e.setId, e.prompt), e);
  }
  const keys = new Set<string>();
  for (const [k, e] of latest) if (e.outcome !== 'right' && e.at.slice(0, 10) < today) keys.add(k);
  return keys;
}

// Assigned sets are used evenly (teacher design, development plan Part 3B):
// sets take turns, and each set deals its questions in a random order with
// no repeats until it runs out, then reshuffles. Starred sets still win.
// Questions in the review pile come back first, one in every three draws,
// each once per game.
export function makeDeck(pool: PoolSet[], rand: () => number = Math.random, review: Set<string> = new Set()) {
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
  const reviewPile = from.flatMap((p) => p.questions.filter((q) => review.has(reviewKey(p.set.id, q.prompt))).map((question) => ({ question, setId: p.set.id })));
  let draws = 0;
  return {
    next(avoidId?: string): Drawn {
      if (from.length === 0) return { question: fallbackQuestion(rand) };
      draws += 1;
      if (draws % 3 === 1 && reviewPile.length) {
        const i = reviewPile.findIndex((r) => r.question.id !== avoidId);
        if (i >= 0) return reviewPile.splice(i, 1)[0];
      }
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
