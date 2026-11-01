import type { ReactNode } from 'react';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import ItemArt from '../theme/ItemArt';
import type { GameTheme } from '../theme/types';
import { Toggle } from '../ui/fields';

// One switch per power-up, the same list in every game (teacher,
// 2026-11-01, modeled on Game Show's): the teacher turns each one on or off.
// `on` is the game's old all-or-nothing switch; `off` lists the ones turned
// off. Returned as a fragment so the setup pages can flow the list across
// pages instead of scrolling.
export function powerUpSwitches({ manifest, theme, on, off, change }: {
  manifest: GameManifest; theme: GameTheme; on: boolean; off: string[];
  change: (patch: { powerUps?: boolean; powerOff?: string[] }) => void;
}): ReactNode {
  const items = theme.items?.length ? theme.items : manifest.items?.classic ?? [];
  if (!items.length) return null;
  const isOn = (id: string) => on && !off.includes(id);
  function set(id: string, v: boolean) {
    if (v) change(on ? { powerOff: off.filter((x) => x !== id) } : { powerUps: true, powerOff: items.filter((i) => i.id !== id).map((i) => i.id) });
    else { const next = [...new Set([...off, id])]; change({ powerOff: next, ...(next.length >= items.length ? { powerUps: false } : {}) }); }
  }
  const hint = (ability: string) => manifest.items?.abilities.find((a) => a.id === ability)?.hint ?? '';
  return (
    <>
      <div className="grid gap-0.5">
        <span className="font-bold">{t('tb.powers')}</span>
        <span className="text-sm font-semibold text-muted">{t('pu.switchHint')}</span>
      </div>
      {items.map((it) => (
        <Toggle key={it.id} label={it.name} hint={hint(it.ability)} art={<ItemArt item={it} size={44} still />} value={isOn(it.id)} onChange={(v) => set(it.id, v)} />
      ))}
    </>
  );
}
