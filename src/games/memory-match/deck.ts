import type { MultipleChoiceQuestion } from '../../data/types';
import { isPlayable } from '../../engine/questions';

// Memory Match cards: each question becomes a pair, the question card and
// its right-answer card. Finding a pair is answering the question.
export interface MemoryCard { key: string; pair: string; side: 'q' | 'a'; text: string; image?: string; alt?: string }

export function buildDeck(questions: MultipleChoiceQuestion[], pairs: number, rand: () => number = Math.random): MemoryCard[] {
  const usable = questions.filter(isPlayable);
  const seen = new Set<string>();
  // Two questions with the same answer would make two matching answer cards.
  const unique = usable.filter((q) => { const a = q.choices[q.correctIndex].trim().toLowerCase(); if (seen.has(a)) return false; seen.add(a); return true; });
  const picked = shuffle(unique, rand).slice(0, pairs);
  const cards = picked.flatMap((q) => [
    { key: `${q.id}:q`, pair: q.id, side: 'q' as const, text: q.prompt, image: q.imageUrl, alt: q.imageAlt },
    { key: `${q.id}:a`, pair: q.id, side: 'a' as const, text: q.choices[q.correctIndex] },
  ]);
  return shuffle(cards, rand);
}

function shuffle<T>(a: T[], rand: () => number): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; }
  return b;
}
