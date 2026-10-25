import type { MultipleChoiceQuestion } from '../data/types';

export const MAX_CHOICES = 4;
export const MIN_CHOICES = 2;

export function blankQuestion(id: string): MultipleChoiceQuestion {
  return { id, kind: 'mc', prompt: '', choices: ['', ''], correctIndex: 0 };
}

// What's wrong with a question, in teacher words, or null when it's ready.
export function questionIssue(q: MultipleChoiceQuestion): string | null {
  const filled = q.choices.map((c) => c.trim());
  if (!q.prompt.trim()) return 'Type the question.';
  if (filled.filter(Boolean).length < MIN_CHOICES) return 'Add at least 2 answers.';
  if (filled.some((c) => !c)) return 'Fill in or remove the empty answer.';
  if (q.correctIndex < 0 || q.correctIndex >= filled.length) return 'Mark the right answer.';
  // Exact match only: capital letters can be the point of a question.
  if (new Set(filled).size !== filled.length) return 'Two answers are the same.';
  if (q.imageUrl && !q.imageAlt?.trim()) return 'Describe the picture for students who can\'t see it.';
  return null;
}

export function isPlayable(q: MultipleChoiceQuestion): boolean {
  return questionIssue(q) === null;
}

// Fisher-Yates shuffle that keeps track of the right answer.
export function shuffleChoices(q: MultipleChoiceQuestion, rand: () => number = Math.random): MultipleChoiceQuestion {
  const order = q.choices.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return {
    ...q, choices: order.map((i) => q.choices[i]), correctIndex: order.indexOf(q.correctIndex),
    // Answer pictures and descriptions move with their answers.
    ...(q.choiceImages && { choiceImages: order.map((i) => q.choiceImages![i] ?? null) }),
    ...(q.choiceAlts && { choiceAlts: order.map((i) => q.choiceAlts![i] ?? null) }),
  };
}
