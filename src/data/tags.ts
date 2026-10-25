import type { QuestionSet } from './types';

// Every tag in use, most used first, so tags teachers add become suggestions
// for everyone (teacher, 2026-10-25). Today that is this teacher's sets and
// the ready-made library; with cloud accounts it grows to every teacher's
// shared sets.
export function tagCounts(sets: Pick<QuestionSet, 'tags'>[]): string[] {
  const n = new Map<string, number>();
  for (const s of sets) for (const tag of new Set(s.tags ?? [])) n.set(tag, (n.get(tag) ?? 0) + 1);
  return [...n.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
}

// Tags that start with (first) or contain what was typed, minus ones already chosen.
export function suggestTags(all: string[], typed: string, chosen: string[] = [], limit = 8): string[] {
  const q = typed.trim().toLowerCase().replace(/^#/, '');
  const open = all.filter((tag) => !chosen.includes(tag));
  if (!q) return open.slice(0, limit);
  return [...open.filter((tag) => tag.startsWith(q)), ...open.filter((tag) => !tag.startsWith(q) && tag.includes(q))].slice(0, limit);
}
