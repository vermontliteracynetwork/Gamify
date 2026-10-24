import type { MultipleChoiceQuestion } from '../data/types';

// When a student has no playable sets, games still never stall: a simple
// generated math question (question engine, section 1).
export function fallbackQuestion(rand: () => number = Math.random): MultipleChoiceQuestion {
  const n = (max: number) => Math.floor(rand() * (max + 1));
  const kind = Math.floor(rand() * 3);
  let prompt: string;
  let answer: number;
  if (kind === 0) { const a = n(10), b = n(10); prompt = `${a} + ${b} = ?`; answer = a + b; }
  else if (kind === 1) { const a = n(10) + 5, b = n(5); prompt = `${a} - ${b} = ?`; answer = a - b; }
  else { const a = n(5) + 1, b = n(5) + 1; prompt = `${a} x ${b} = ?`; answer = a * b; }

  const options = new Set<number>([answer]);
  let delta = 1;
  while (options.size < 4) {
    if (answer - delta >= 0) options.add(answer - delta);
    if (options.size < 4) options.add(answer + delta);
    delta++;
  }
  const choices = [...options].sort((x, y) => x - y).map(String);
  return { id: `fallback:${prompt}`, kind: 'mc', prompt, choices, correctIndex: choices.indexOf(String(answer)) };
}
