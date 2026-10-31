import { volume, type PlayerSettings } from '../settings/settings';
import type { SoundPack } from '../theme/types';

// Sound effects (recorded for Classic, generated in code for theme packs),
// haptics and the read-aloud voice. Every call respects the player's settings.

type Effect = 'right' | 'miss' | 'tap' | 'win' | 'whoosh';
const TONES: Record<Effect, { freqs: number[]; type: OscillatorType; step: number; length: number }> = {
  right: { freqs: [660, 880, 1175], type: 'sine', step: 0.08, length: 0.18 },
  miss: { freqs: [330, 262], type: 'triangle', step: 0.12, length: 0.2 }, // soft, never harsh
  tap: { freqs: [520], type: 'sine', step: 0, length: 0.06 },
  win: { freqs: [523, 659, 784, 1047], type: 'sine', step: 0.11, length: 0.28 },
  whoosh: { freqs: [400, 300], type: 'sine', step: 0.05, length: 0.12 },
};

// A theme's sound pack reshapes the same effects (set by the themed page).
const PACKS: Record<SoundPack, { type?: OscillatorType; freq: number; length: number; gain: number; slide?: number }> = {
  classic: { freq: 1, length: 1, gain: 1 },
  soft: { type: 'triangle', freq: 0.8, length: 1.3, gain: 0.6 },
  chimes: { type: 'sine', freq: 2, length: 2.4, gain: 0.6 },
  bloops: { type: 'sine', freq: 0.9, length: 1.1, gain: 1, slide: 0.55 },
  zaps: { type: 'triangle', freq: 1.1, length: 0.9, gain: 0.8, slide: 1.8 },
};
let pack: SoundPack = 'classic';
export function setSoundPack(next: SoundPack | undefined) { pack = next ?? 'classic'; }

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx ??= new AC();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

// The Classic pack plays recorded sounds (teacher, 2026-10-31): Casual
// SoundFX by Tim Beek (CC BY 4.0) and Kenney Interface Sounds (CC0), trimmed
// short and quiet in public/sounds. Until a file has loaded (or if it can't),
// the made-in-code tone plays instead.
const buffers = new Map<Effect, AudioBuffer | 'loading' | 'failed'>();
function sample(ac: AudioContext, name: Effect): AudioBuffer | null {
  const b = buffers.get(name);
  if (b && b !== 'loading' && b !== 'failed') return b;
  if (!b) {
    buffers.set(name, 'loading');
    void fetch(`/sounds/${name}.mp3`).then((r) => (r.ok ? r.arrayBuffer() : Promise.reject())).then((a) => ac.decodeAudioData(a))
      .then((buf) => { buffers.set(name, buf); }).catch(() => { buffers.set(name, 'failed'); });
  }
  return null;
}
export function preloadSounds() { const ac = audio(); if (ac) (Object.keys(TONES) as Effect[]).forEach((n) => sample(ac, n)); }

export function playEffect(name: Effect, s: PlayerSettings, with_: SoundPack = pack): void {
  const p = PACKS[with_];
  const gain = volume(s, 'effects') * 0.25 * p.gain;
  if (gain <= 0) return;
  const ac = audio();
  if (!ac) return;
  if (with_ === 'classic') {
    const buf = sample(ac, name);
    if (buf) {
      const src = ac.createBufferSource();
      const g = ac.createGain();
      g.gain.value = Math.min(1, gain * 3.2);
      src.buffer = buf;
      src.connect(g).connect(ac.destination);
      src.start();
      return;
    }
  }
  const tone = TONES[name];
  tone.freqs.forEach((freq, i) => {
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = p.type ?? tone.type;
    const start = ac.currentTime + i * tone.step;
    const length = tone.length * p.length;
    osc.frequency.setValueAtTime(freq * p.freq, start);
    if (p.slide) osc.frequency.exponentialRampToValueAtTime(freq * p.freq * p.slide, start + length);
    g.gain.setValueAtTime(gain, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + length);
    osc.connect(g).connect(ac.destination);
    osc.start(start);
    osc.stop(start + length + 0.02);
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

// The natural voice (api/tts.ts) when the site has one; the device's own
// voice when it doesn't, when offline, or if the audio fails.
let natural: 'unknown' | 'on' | 'off' = typeof window !== 'undefined' && /^(localhost|127\.)/.test(window.location.hostname) ? 'off' : 'unknown';
let playing: HTMLAudioElement | null = null;

export function speak(text: string, s: PlayerSettings): void {
  stopSpeaking();
  const v = volume(s, 'voice');
  if (v <= 0 || !text.trim()) return;
  if (natural !== 'off' && typeof Audio !== 'undefined') {
    const a = new Audio(`/api/tts?t=${encodeURIComponent(text.trim().slice(0, 400))}`);
    a.volume = v;
    a.playbackRate = s.voiceRate === 'slow' ? 0.85 : s.voiceRate === 'fast' ? 1.15 : 1;
    playing = a;
    a.play().then(() => { natural = 'on'; }, (e: unknown) => {
      if (playing !== a) return;
      playing = null;
      // A blocked autoplay is not a missing voice; anything else is.
      if (natural === 'unknown' && !(e instanceof DOMException && e.name === 'NotAllowedError')) natural = 'off';
      deviceSpeak(text, s, v);
    });
    a.onerror = () => { if (playing === a) { playing = null; natural = 'off'; deviceSpeak(text, s, v); } };
    return;
  }
  deviceSpeak(text, s, v);
}

function deviceSpeak(text: string, s: PlayerSettings, v: number): void {
  if (typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.voice = pickVoice() ?? null;
  u.volume = v;
  u.rate = s.voiceRate === 'slow' ? 0.8 : s.voiceRate === 'fast' ? 1.15 : 0.95;
  speechSynthesis.speak(u);
}

export function stopSpeaking(): void {
  if (playing) { playing.pause(); playing = null; }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
}
