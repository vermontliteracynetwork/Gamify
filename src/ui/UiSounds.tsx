import { useEffect } from 'react';
import { playEffect } from '../engine/feedback';
import { useSettings } from '../settings/SettingsContext';

// The universal UI sounds (teacher, 2026-11-23): a soft click on every tap of
// a button, link, tab or switch, and a blip when something can't be tapped
// yet (a turned-off button, like closing a menu that needs Confirm first).
const TAPPABLE = 'button, a[href], [role="button"], [role="switch"], [role="tab"], [role="radio"], [role="checkbox"], [role="menuitem"], summary, select, input[type="checkbox"], input[type="radio"]';

export default function UiSounds() {
  const { settings } = useSettings();
  useEffect(() => {
    const onDown = (e: PointerEvent) => {
      let el = (e.target as Element | null)?.closest?.(TAPPABLE) ?? null;
      // Turned-off buttons ignore the pointer (pointer-events: none), so look
      // for one under the finger by its box.
      if (!el) el = [...document.querySelectorAll('button:disabled, [aria-disabled="true"]')].find((x) => { const r = x.getBoundingClientRect(); return r.width > 0 && e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom; }) ?? null;
      if (!el) return;
      const off = (el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true';
      playEffect(off ? 'blip' : 'tap', settings);
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [settings]);
  return null;
}

// For code paths that refuse an action without a disabled button.
export function playBlocked(settings: Parameters<typeof playEffect>[1]) { playEffect('blip', settings); }
