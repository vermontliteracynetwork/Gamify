import { volume, type PlayerSettings } from '../settings/settings';

// Sound effects (generated in code, so nothing to license), haptics and the
// read-aloud voice. Every call respects the player's settings.

type Effect = 'right' | 'miss' | 'tap' | 'win' | 'whoosh';
const TONES: Record<Effect, { freqs: number[]; type: OscillatorType; step: number; length: number }> = {
  right: { freqs: [660, 880, 1175], type: 'sine', step: 0.08, length: 0.18 },
  miss: { freqs: [330, 262], type: 'triangle', step: 0.12, length: 0.2 }, // soft, never harsh
  tap: { freqs: [520], type: 'sine', step: 0, length: 0.06 },
  win: { freqs: [523, 659, 784, 1047], type: 'sine', step: 0.11, length: 0.28 },
  whoosh: { freqs: [400, 300], type: 'sine', step: 0.05, length: 0.12 },
};

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

export function playEffect(name: Effect, s: PlayerSettings): void {
  const gain = volume(s, 'effects') * 0.25;
  if (gain <= 0) return;
  const ac = audio();
  if (!ac) return;
  const tone = TONES[name];
  tone.freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = tone.type;
    osc.frequency.value = freq;
    const start = ac.currentTime + i * tone.step;
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + tone.length);
    osc.connect(g).connect(ac.destination);
    osc.start(start);
    osc.stop(start + tone.length + 0.02);
  });
}

// iPads can't vibrate; Android can. Never the only signal.
export const canVibrate = (): boolean => typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';

export function buzz(pattern: number | number[], s: PlayerSettings): void {
  if (s.haptics && canVibrate()) navigator.vibrate(pattern);
}

// Device voice for now; a human neural voice comes later behind a cost switch.
const NOVELTY = /bells|boing|bubbles|cellos|zarvox|whisper|trinoids|bahh|albert|jester|organ|superstar|wobble|bad news|good news/i;
function pickVoice(): SpeechSynthesisVoice | undefined {
  const voices = speechSynthesis.getVoices().filter((v) => v.lang.startsWith('en') && !NOVELTY.test(v.name));
  return voices.find((v) => /premium|enhanced|natural|neural/i.test(v.name)) ?? voices.find((v) => v.lang === 'en-US') ?? voices[0];
}

export function speak(text: string, s: PlayerSettings): void {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const v = volume(s, 'voice');
  if (v <= 0 || !text.trim()) return;
  const u = new SpeechSynthesisUtterance(text);
  u.voice = pickVoice() ?? null;
  u.volume = v;
  u.rate = s.voiceRate === 'slow' ? 0.8 : s.voiceRate === 'fast' ? 1.15 : 0.95;
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
