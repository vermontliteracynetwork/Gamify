import { openLink, type LiveState } from '../live/protocol';

// Pretend students for testing a live game alone (owner, 2026-11-27: "simulate
// X number of students (all computer) for live games so i have the ability to
// test that on my own"). Each bot joins the code like a real student, keeps
// saying hello, and once the game starts answers every few seconds at the
// chosen accuracy. Developer menu only; nothing is saved.
const NAMES = ['Ava', 'Ben', 'Cleo', 'Dev', 'Eli', 'Fern', 'Gus', 'Hana', 'Ira', 'Jade', 'Kai', 'Lux', 'Mo', 'Nia', 'Oli', 'Pip', 'Quin', 'Rae', 'Sol', 'Tia', 'Uma', 'Vic', 'Wren', 'Xan', 'Yara', 'Zed', 'Ari', 'Bo', 'Cy', 'Dot'];

export interface BotRun { stop(): void }
export function startBots(code: string, count: number, accuracy = 0.75, onState?: (s: LiveState) => void): BotRun {
  const link = openLink(code.trim().toUpperCase());
  const bots = Array.from({ length: count }, (_, i) => ({ pid: `bot-${Date.now().toString(36)}-${i}`, name: `${NAMES[i % NAMES.length]} (bot)`, answered: 0, right: 0, round: -1 }));
  let state: LiveState | null = null;
  const off = link.listen((m) => { if (m.t === 'state') { state = m.state; onState?.(m.state); } });
  bots.forEach((b, i) => window.setTimeout(() => { link.send({ t: 'join', pid: b.pid, name: b.name }); link.send({ t: 'hello', pid: b.pid }); }, i * 120));
  const beat = window.setInterval(() => bots.forEach((b) => link.send({ t: 'hello', pid: b.pid })), 4000);
  const play = window.setInterval(() => {
    const s = state as LiveState | null;
    if (!s || s.phase !== 'play') return;
    for (const b of bots) {
      if (b.round !== s.round) { b.round = s.round; b.answered = 0; b.right = 0; }
      if (Math.random() < 0.45) continue; // not everyone answers at once
      const right = Math.random() < accuracy;
      b.answered += 1; b.right += right ? 1 : 0;
      link.send({ t: 'progress', pid: b.pid, round: s.round, answered: b.answered, right: b.right, askedAt: null, last: { q: `bot-q-${b.answered}`, pick: right ? 'A' : 'B', right } });
    }
  }, 2500);
  return {
    stop() {
      window.clearInterval(beat); window.clearInterval(play); off();
      bots.forEach((b) => link.send({ t: 'leave', pid: b.pid }));
      window.setTimeout(() => link.close(), 300);
    },
  };
}
