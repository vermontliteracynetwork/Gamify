import { playClip, POWER_SOUNDS, ANSWER_SOUNDS } from '../engine/music';
import { isSpeaking, playEffect } from '../engine/feedback';
import { volume, type PlayerSettings } from '../settings/settings';

// Lab sound effects: the recorded Classic sounds where they fit (dice, jump,
// magnet, wind, chest, bells), and short sounds made in code for the rest.
// Every one follows the Effects volume and varies a touch each time, so a
// hundred pops never sound canned.

let ctx: AudioContext | null = null;
function ac(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface Tone { f: number; to?: number; type?: OscillatorType; len: number; at?: number; gain?: number }
function tones(s: PlayerSettings, list: Tone[], level = 1) {
  const a = ac();
  const g0 = volume(s, 'effects') * 0.22 * level * (isSpeaking() ? 0.3 : 1);
  if (!a || g0 <= 0) return;
  const wob = 0.96 + Math.random() * 0.08;
  for (const t of list) {
    const o = a.createOscillator(), g = a.createGain();
    const start = a.currentTime + (t.at ?? 0);
    o.type = t.type ?? 'sine';
    o.frequency.setValueAtTime(t.f * wob, start);
    if (t.to) o.frequency.exponentialRampToValueAtTime(Math.max(20, t.to * wob), start + t.len);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(g0 * (t.gain ?? 1), start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + t.len);
    o.connect(g).connect(a.destination);
    o.start(start); o.stop(start + t.len + 0.02);
  }
}
function noise(s: PlayerSettings, len: number, from: number, to: number, level = 1) {
  const a = ac();
  const g0 = volume(s, 'effects') * 0.18 * level * (isSpeaking() ? 0.3 : 1);
  if (!a || g0 <= 0) return;
  const buf = a.createBuffer(1, Math.floor(a.sampleRate * len), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = 'bandpass';
  f.frequency.setValueAtTime(from, a.currentTime); f.frequency.exponentialRampToValueAtTime(to, a.currentTime + len);
  g.gain.setValueAtTime(g0, a.currentTime);
  src.connect(f).connect(g).connect(a.destination);
  src.start();
}

export function makeSfx(s: PlayerSettings) {
  return {
    right: () => playClip(ANSWER_SOUNDS.right, s),
    wrong: () => playClip(ANSWER_SOUNDS.wrong, s),
    tap: () => playEffect('tap', s),
    win: () => playEffect('win', s),
    whoosh: () => playEffect('whoosh', s),
    dice: () => playClip('/sounds/board/dice.mp3', s),
    jump: () => playClip('/sounds/board/jump.mp3', s, 0.6),
    magnet: () => playClip(POWER_SOUNDS.magnet, s),
    wind: () => playClip(POWER_SOUNDS.tornado, s),
    chest: () => playClip(POWER_SOUNDS.chest, s),
    bell: () => playClip('/sounds/pinball/score-bell.mp3', s, 0.6),
    bump: () => playClip('/sounds/pinball/collision.mp3', s, 0.6),
    splash: () => playClip('/sounds/cast-catch/splash.mp3', s, 0.6),
    pop: () => tones(s, [{ f: 900, to: 260, len: 0.09, type: 'square', gain: 0.5 }, { f: 1500, to: 600, len: 0.05, at: 0.01, gain: 0.4 }]),
    boing: () => tones(s, [{ f: 180, to: 520, len: 0.28, type: 'triangle' }, { f: 520, to: 240, len: 0.2, at: 0.16, type: 'triangle' }]),
    coin: () => tones(s, [{ f: 988, len: 0.08, type: 'square', gain: 0.45 }, { f: 1319, len: 0.22, at: 0.07, type: 'square', gain: 0.45 }]),
    zap: () => tones(s, [{ f: 1600, to: 120, len: 0.25, type: 'sawtooth', gain: 0.35 }]),
    power: () => tones(s, [523, 659, 784, 1047, 1319].map((f, i) => ({ f, len: 0.16, at: i * 0.06, type: 'triangle' as const }))),
    oops: () => tones(s, [{ f: 420, to: 160, len: 0.45, type: 'triangle' }, { f: 300, to: 110, len: 0.4, at: 0.12, type: 'sine', gain: 0.6 }]),
    whistle: () => tones(s, [{ f: 2100, len: 0.18, gain: 0.5 }, { f: 2300, len: 0.32, at: 0.2, gain: 0.5 }]),
    kick: () => { tones(s, [{ f: 140, to: 50, len: 0.18, gain: 1.2 }]); noise(s, 0.08, 2000, 400, 0.8); },
    thud: () => tones(s, [{ f: 110, to: 45, len: 0.22, gain: 1.2 }]),
    swish: () => noise(s, 0.35, 600, 3000, 0.9),
    crash: () => { noise(s, 0.5, 1200, 200, 1.2); tones(s, [{ f: 90, to: 40, len: 0.3, gain: 0.8 }]); },
    cheer: () => { noise(s, 1.1, 900, 1400, 0.7); tones(s, [784, 988, 1175].map((f, i) => ({ f, len: 0.25, at: 0.1 + i * 0.1, type: 'triangle' as const, gain: 0.5 }))); },
    tick: () => tones(s, [{ f: 1800, len: 0.03, type: 'square', gain: 0.3 }]),
    slideUp: () => tones(s, [{ f: 300, to: 1200, len: 0.3, type: 'triangle' }]),
    slideDown: () => tones(s, [{ f: 1000, to: 200, len: 0.4, type: 'triangle' }]),
    // A musical step: 0 is low, climbing a major scale.
    note: (step: number) => { const scale = [0, 2, 4, 5, 7, 9, 11]; const n = scale[((step % 7) + 7) % 7] + 12 * Math.floor(step / 7); tones(s, [{ f: 523 * 2 ** (n / 12), len: 0.22, type: 'triangle' }]); },
    blip: (step = 0) => tones(s, [{ f: 440 * 2 ** (step / 12), len: 0.07, type: 'square', gain: 0.4 }]),
    chomp: () => tones(s, [{ f: 300, to: 160, len: 0.08, type: 'square', gain: 0.5 }, { f: 300, to: 160, len: 0.08, at: 0.1, type: 'square', gain: 0.5 }]),
    build: () => tones(s, [{ f: 200, len: 0.06, type: 'square', gain: 0.5 }, { f: 260, len: 0.06, at: 0.07, type: 'square', gain: 0.5 }, { f: 330, len: 0.1, at: 0.14, type: 'square', gain: 0.5 }]),
    freeze: () => tones(s, [2093, 2637, 3136, 2637].map((f, i) => ({ f, len: 0.2, at: i * 0.05, gain: 0.35 }))),
  };
}
export type Sfx = ReturnType<typeof makeSfx>;
