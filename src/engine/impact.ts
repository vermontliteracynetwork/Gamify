import type { PlayerSettings } from '../settings/settings';

// A punch on big moments (engagement audit, 2026-11-08): the game stage bumps
// toward the player for a beat, with a short shake when Screen shake is on.
// Still motion skips it. Kept tiny and brief for sensory-sensitive kids.
export function impact(s: PlayerSettings, strong = false) {
  if (s.motion === 'still' || typeof document === 'undefined') return;
  const el = document.querySelector<HTMLElement>('.play-fill') ?? document.querySelector<HTMLElement>('main');
  if (!el) return;
  const name = s.screenShake && strong ? 'impact-shake' : 'impact-punch';
  el.classList.remove('impact-punch', 'impact-shake');
  void el.offsetWidth; // restart the animation
  el.classList.add(name);
  window.setTimeout(() => el.classList.remove(name), 450);
}
