import { useState } from 'react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import type { GameTheme, ThemeItem } from '../theme/types';
import PowerUpPop from './PowerUpPop';
import { amountOf, rollPowerUp } from './powerUps';

// A question-break game's power-ups: the theme's items (Classic ones when
// the theme has none), a roll after each right answer, and the pop that
// shows what came. `on` is the teacher's Power-ups switch.
export function usePowerUps(manifest: GameManifest, theme: GameTheme, on: boolean) {
  const items = theme.items?.length ? theme.items : manifest.items?.classic ?? [];
  const [pop, setPop] = useState<{ id: number; item: ThemeItem; text: string } | null>(null);
  const amount = (it: ThemeItem) => amountOf(it, manifest.items?.abilities.find((a) => a.id === it.ability)?.amount?.default ?? 0);
  function grant(): ThemeItem | null {
    if (!on) return null;
    const it = rollPowerUp(items);
    if (it) setPop({ id: Date.now(), item: it, text: t(`pu.${manifest.id}.${it.ability}` as StringKey, { n: amount(it) }) });
    return it;
  }
  return { grant, amount, element: <PowerUpPop pop={pop} onDone={() => setPop(null)} /> };
}
