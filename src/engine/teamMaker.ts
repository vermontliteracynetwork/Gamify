// Making teams from a class list (development plan Stage 3): random, or
// balanced by how often each student gets questions right (a snake draft,
// so every team gets a mix), or hand-picked by the teacher.

export function randomTeams(ids: string[], teams: number, rand: () => number = Math.random): string[][] {
  const a = [...ids];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  const out: string[][] = Array.from({ length: teams }, () => []);
  a.forEach((id, i) => out[i % teams].push(id));
  return out;
}

// `skill` is each student's share of right answers (0-1); students with no
// answers yet count as the class middle.
export function balancedTeams(ids: string[], teams: number, skill: Record<string, number | undefined>, rand: () => number = Math.random): string[][] {
  const known = ids.map((id) => skill[id]).filter((v): v is number => v !== undefined).sort((a, b) => a - b);
  const middle = known.length ? known[Math.floor(known.length / 2)] : 0.5;
  const ranked = ids.map((id) => ({ id, s: skill[id] ?? middle, tie: rand() })).sort((a, b) => b.s - a.s || a.tie - b.tie);
  const out: string[][] = Array.from({ length: teams }, () => []);
  ranked.forEach((r, i) => {
    const round = Math.floor(i / teams), pos = i % teams;
    out[round % 2 === 0 ? pos : teams - 1 - pos].push(r.id);
  });
  return out;
}
