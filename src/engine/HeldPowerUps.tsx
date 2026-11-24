import { useEffect, useRef, useState } from 'react';
import { pace, POP_IN } from './pace';
import { AnimatePresence, motion } from 'motion/react';
import TapOk from './TapOk';
import ItemArt from '../theme/ItemArt';
import { PowerUpCard } from './PowerUpPop';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import type { ThemeItem } from '../theme/types';

// Power-ups you hold (teacher, 2026-10-31): one earned on a right answer
// waits for that player's NEXT turn, then shows under the scoreboard (a
// vertical list when there is more than one). Tap one to use it. Whatever is
// not used is gone when the turn ends.
export function useHeldPowerUps() {
  const pending = useRef<Record<string, ThemeItem[]>>({});
  const [held, setHeld] = useState<{ who: string; items: ThemeItem[] }>({ who: '', items: [] });
  return {
    held: held.items,
    // Earned now, ready on this player's next turn.
    earn(who: string, item: ThemeItem) { pending.current = { ...pending.current, [who]: [...(pending.current[who] ?? []), item] }; },
    beginTurn(who: string) { const items = pending.current[who] ?? []; const { [who]: _, ...rest } = pending.current; pending.current = rest; setHeld({ who, items }); },
    endTurn() { setHeld({ who: '', items: [] }); },
    use(index: number): ThemeItem | null { const it = held.items[index] ?? null; setHeld((h) => ({ ...h, items: h.items.filter((_, i) => i !== index) })); return it; },
    reset() { pending.current = {}; setHeld({ who: '', items: [] }); },
  };
}

// Each item's role: what it does in Classic, which a theme can dress up
// but never changes (e.g. "2x points: Earn double points").
export function roleOf(manifest: GameManifest, it: ThemeItem) {
  const a = manifest.items?.abilities.find((x) => x.id === it.ability);
  return a ? `${a.label}: ${a.hint}` : '';
}

// Held power-ups wait in a tray until the player taps one (teacher,
// 2026-11-24: "power ups should wait for tap"). Each is a square card with its
// picture and its name always showing (no hover-only label). A tap opens a
// card that says what it does, with Use it / Not now. The computer still uses
// its own by itself (`auto`), but each one is announced on a card that waits
// for a tap from the class.
export function PowerUpTray({ manifest, items, onUse, disabled = false, auto = false, who }: { manifest: GameManifest; items: ThemeItem[]; onUse: (index: number) => void; disabled?: boolean; auto?: boolean; who?: string }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [ask, setAsk] = useState<{ id: number; index: number; item: ThemeItem; cpu: boolean } | null>(null);
  // The computer picks its next one after a short pause.
  useEffect(() => {
    if (!auto || disabled || ask || !items.length) return;
    const id = window.setTimeout(() => setAsk({ id: Date.now(), index: 0, item: items[0], cpu: true }), (still ? 300 : 1200) * pace(settings));
    return () => window.clearTimeout(id);
  }, [auto, disabled, ask, items]); // eslint-disable-line react-hooks/exhaustive-deps
  const use = () => { if (!ask) return; const i = items.indexOf(ask.item); setAsk(null); if (i >= 0) onUse(i); };
  const tray = items.length > 0 && (
    <div className="flex flex-wrap justify-center gap-2" role="group" aria-label={t('pu.tray')}>
      {items.map((it, i) => {
        const off = disabled || auto;
        return (
          <motion.button key={`${it.id}-${i}`} type="button" disabled={off} onClick={() => setAsk({ id: Date.now(), index: i, item: it, cpu: false })}
            // THE power-up card (Brand Kit, 2026-11-24): a bigger square so nothing is cut
            // off, the art in its own top area, the name in its own two-line area;
            // always the top layer of the game screen.
            className="relative z-[25] w-[6.5rem] aspect-square rounded-[16px] border-[2.5px] border-border bg-[var(--paper)] grid grid-rows-[1fr_auto] justify-items-center gap-1 px-1.5 py-2 disabled:opacity-60 disabled:cursor-default"
            style={{ boxShadow: off ? '0 3px 0 var(--color-border)' : '0 0 0 3px var(--butter), 0 3px 0 var(--color-border)' }}
            initial={still ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={still ? { duration: 0.01 } : POP_IN}
            whileHover={off || still ? undefined : { scale: 1.06 }} whileTap={off || still ? undefined : { scale: 0.94 }}>
            <span className="grid place-items-center min-h-0"><ItemArt item={it} size={42} still={still || off} /></span>
            <span className="grid place-items-center text-[13px] font-bold leading-[1.1] text-center min-h-[2.3em]">{it.name}</span>
          </motion.button>
        );
      })}
    </div>
  );
  return (
    <>
      {tray}
      <AnimatePresence>
        {ask && (ask.cpu
          ? <PowerUpCard key={ask.id} id={ask.id} item={ask.item} title={who ? t('pu.cpuUses', { name: who, item: ask.item.name }) : t('pu.on', { name: ask.item.name })} text={roleOf(manifest, ask.item)} onClose={use} />
          : <PowerUpCard key={ask.id} id={ask.id} item={ask.item} title={ask.item.name} text={roleOf(manifest, ask.item)} onClose={() => setAsk(null)}
              actions={<><TapOk onTap={use} label={t('pu.useIt')} /><button type="button" onClick={() => setAsk(null)} className="min-h-[3.5rem] px-5 rounded-pill border-bold border-border bg-surface-2 font-bold text-lg">{t('pu.notNow')}</button></>} />)}
      </AnimatePresence>
    </>
  );
}
