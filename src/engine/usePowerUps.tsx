import { useState } from 'react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import type { GameTheme, ThemeItem } from '../theme/types';
import PowerUpPop from './PowerUpPop';
import { roleOf } from './HeldPowerUps';
import { amountOf, rollPowerUp, withFeatured } from './powerUps';

// A question-break game's power-ups: the theme's items (Classic ones when
// the theme has none), a roll after each right answer, and the pop that
// shows what came. `on` is the teacher's Power-ups switch.
// `off`: the power-ups the teacher switched off one by one (2026-11-01).
export function usePowerUps(manifest: GameManifest, theme: GameTheme, on: boolean, off: string[] = []) {
  const items = (theme.items?.length ? theme.items : manifest.items?.classic ?? []).filter((it) => !off.includes(it.id));
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const amount = (it: ThemeItem) => amountOf(it, manifest.items?.abilities.find((a) => a.id === it.ability)?.amount?.default ?? 0);
  // `later`: the item waits for the player's next turn (held power-ups,
  // teacher 2026-10-31), so the pop says when it will be ready.
  // `allow`: skip items that make no sense right now, like one that takes
  // points when nobody it would hit has any (teacher, 2026-11-01).
  function grant(later = false, allow?: (it: ThemeItem) => boolean): ThemeItem | null {
    if (!on) return null;
    const it = rollPowerUp(withFeatured(allow ? items.filter(allow) : items, manifest.id));
    if (it) setPop({ id: Date.now(), item: it, text: later ? t('pu.later', { role: roleOf(manifest, it) }) : t(`pu.${manifest.id}.${it.ability}` as StringKey, { n: amount(it) }) });
    return it;
  }
  return { grant, amount, element: <PowerUpPop pop={pop} onDone={() => setPop(null)} /> };
}
