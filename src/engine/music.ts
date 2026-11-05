import { useEffect } from 'react';
import type { PlayerSettings } from '../settings/settings';
import { volume } from '../settings/settings';
import { isSpeaking } from './feedback';

// Game music and named sound clips (teacher, 2026-11-01: Game Show plays a
// brass intro, then its music fades in; correct, wrong, brass fail and page
// turn sounds). Clips follow the Effects volume, music the Music volume, and
// Quiet room or calm mode (music at 0) keeps the music off.

const clips = new Map<string, HTMLAudioElement>();
// The right and wrong answer sounds (teacher's uploads, 2026-11-01), used by
// every game that asks questions.
export const ANSWER_SOUNDS = { right: '/sounds/answers/correct.mp3', wrong: '/sounds/answers/wrong.mp3' };

// Power-up sounds (teacher's uploads, 2026-11-01): a zap for magnets, wind
// for the tornado, an 8-bit chest opening for treasure chests.
export const POWER_SOUNDS = { magnet: '/sounds/board/magnet.mp3', tornado: '/sounds/board/wind.mp3', chest: '/sounds/board/chest.mp3' };

export function playClip(src: string, s: PlayerSettings, level = 0.8) {
  const v = volume(s, 'effects') * level * (isSpeaking() ? 0.35 : 1);
  if (v <= 0 || typeof Audio === 'undefined') return;
  let base = clips.get(src);
  if (!base) { base = new Audio(src); base.preload = 'auto'; clips.set(src, base); }
  const a = base.cloneNode(true) as HTMLAudioElement;
  a.volume = Math.min(1, v);
  void a.play().catch(() => undefined);
}

let current: { el: HTMLAudioElement; src: string; timer: number } | null = null;
function fadeTo(el: HTMLAudioElement, target: number, ms: number, done?: () => void) {
  const from = el.volume, t0 = performance.now();
  const step = () => {
    const f = Math.min(1, (performance.now() - t0) / ms);
    el.volume = Math.max(0, Math.min(1, from + (target - from) * f));
    if (f < 1) requestAnimationFrame(step); else done?.();
  };
  requestAnimationFrame(step);
}

export function stopMusic(ms = 800) {
  const c = current;
  current = null;
  if (!c) return;
  window.clearTimeout(c.timer);
  fadeTo(c.el, 0, ms, () => { c.el.pause(); });
}

// Music that loops and fades in, after an optional intro clip.
export function startMusic(src: string, s: PlayerSettings, opts: { intro?: string; delay?: number } = {}) {
  stopMusic(300);
  if (opts.intro) playClip(opts.intro, s, 0.9);
  const target = volume(s, 'music');
  if (target <= 0 || typeof Audio === 'undefined') return;
  const el = new Audio(src);
  el.loop = true;
  el.volume = 0;
  const me = { el, src, timer: 0 };
  current = me;
  me.timer = window.setTimeout(() => {
    if (current !== me) return;
    void el.play().then(() => fadeTo(el, target, 2500)).catch(() => undefined);
  }, opts.delay ?? 0);
}

// Plays a game's music while `on`, and stops it when the game ends or leaves.
export function useGameMusic(on: boolean, src: string, s: PlayerSettings, intro?: string) {
  useEffect(() => {
    if (!on) return;
    startMusic(src, s, { intro, delay: intro ? 2200 : 0 });
    return () => stopMusic();
  }, [on, src]); // eslint-disable-line react-hooks/exhaustive-deps
  // The Music volume follows the settings while it plays.
  useEffect(() => { if (current) current.el.volume = volume(s, 'music'); }, [s.music, s.allSoundOff]); // eslint-disable-line react-hooks/exhaustive-deps
}
