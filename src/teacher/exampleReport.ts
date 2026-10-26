import type { Classroom, QuestionLogEntry, Student } from '../data/types';
import { LIBRARY } from '../data/library';

// The example report (teacher, 2026-10-26): 20 made-up students who played
// the example addition set, so every teacher on every plan, free included,
// can see what Reports shows before their own class has played. Built in
// memory each time and never saved, so it never mixes with real data.
export const EXAMPLE_CLASS: Classroom = { id: 'example-class', name: 'Example class (20 students)', ownerId: 'example', createdAt: '2026-10-26' };

const NAMES = ['Ava', 'Ben', 'Carmen', 'Dev', 'Elle', 'Finn', 'Grace', 'Hugo', 'Isla', 'Jamal', 'Kai', 'Lena', 'Milo', 'Nora', 'Omar', 'Priya', 'Quinn', 'Rosa', 'Sam', 'Theo'];
// How often each student gets a fact right, from just starting to nearly
// every time, so the report shows a real spread.
const SKILL = [0.98, 0.95, 0.93, 0.9, 0.88, 0.86, 0.84, 0.82, 0.8, 0.78, 0.75, 0.72, 0.7, 0.66, 0.62, 0.58, 0.55, 0.5, 0.45, 0.4];
const GAMES = ['game-show', 'peg-drop', 'road-hop', 'lunch-rush', 'bubble-pop'];

export const EXAMPLE_STUDENTS: Student[] = NAMES.map((name, i) => ({ id: `example-${i + 1}`, classroomId: EXAMPLE_CLASS.id, name, picturePassword: ['star', 'moon'] }));

// A small seeded random, so the example looks the same every visit.
function seeded(seed: number) {
  return () => { seed = (seed + 0x6d2b79f5) | 0; let x = Math.imul(seed ^ (seed >>> 15), 1 | seed); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}

// Each student played the set twice: nine days ago and today, a little
// better the second time, so "remembered a week later" has numbers too.
export function exampleLog(now = Date.now()): QuestionLogEntry[] {
  const set = LIBRARY.find((s) => s.id === 'lib-example-addition')!;
  const rand = seeded(26);
  const out: QuestionLogEntry[] = [];
  EXAMPLE_STUDENTS.forEach((st, si) => {
    [9, 0].forEach((daysAgo, round) => {
      const skill = Math.min(0.99, SKILL[si] + round * 0.05);
      const gameId = GAMES[(si + round) % GAMES.length];
      set.questions.forEach((q, qi) => {
        if (q.kind !== 'mc') return;
        const answer = q.choices[q.correctIndex];
        const wrong = q.choices.filter((_, i) => i !== q.correctIndex);
        const right = rand() < skill;
        const second = !right && rand() < 0.6;
        const tries = right ? [answer] : second ? [wrong[rand() < 0.6 ? 0 : 1], answer] : [wrong[rand() < 0.6 ? 0 : 1], wrong[2]];
        const ms = Math.round(2500 + (1 - skill) * 6000 + rand() * 3000);
        const at = new Date(now - daysAgo * 86400000 - (20 - qi) * 30000 - si * 1000).toISOString();
        out.push({ id: `example-${si}-${round}-${qi}`, at, classroomId: EXAMPLE_CLASS.id, studentId: st.id, gameId, mode: 'solo', setId: set.id, prompt: q.prompt, answer, tries, ms, outcome: right || second ? 'right' : 'skipped' });
      });
    });
  });
  return out;
}
