import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, CaretLeft, CaretRight, Check, LockSimple, MagnifyingGlass } from '@phosphor-icons/react';
import { t } from '../i18n';
import { creditLine } from '../theme/credit';
import ThemePreview from '../theme/builder/ThemePreview';
import type { GameTheme } from '../theme/types';
import Title from '../ui/Title';
import { useSettings } from '../settings/SettingsContext';
import { playEffect } from '../engine/feedback';

// Its own screen in every game's start-up, even when Classic is the only
// theme (teacher, 2026-11-19): a carousel wheel with one big theme in the
// middle and up to two smaller ones on each side. Arrows (and the arrow keys)
// spin it with a whoosh; a search box in the top right finds a theme by name.
// Locked themes show a lock only (no prices or buy words).
export default function ThemeScreen({ gameName, current, themes, playable, onChoose, onBack, onNext }: {
  gameName: string; current: GameTheme; themes: GameTheme[]; playable: (th: GameTheme) => boolean;
  onChoose: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [find, setFind] = useState('');
  const shown = useMemo(() => {
    const q = find.trim().toLowerCase();
    return q ? themes.filter((th) => th.name.toLowerCase().includes(q)) : themes;
  }, [themes, find]);
  const [at, setAt] = useState(() => Math.max(0, themes.findIndex((th) => th.id === current.id)));
  const center = Math.min(at, Math.max(0, shown.length - 1));
  const main = shown[center];

  function go(k: number) {
    if (!shown.length) return;
    const n = (k + shown.length) % shown.length;
    if (n === center) return;
    setAt(n);
    playEffect('whoosh', settings);
    if (playable(shown[n])) onChoose(shown[n].id);
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.key === 'ArrowLeft') go(center - 1);
      if (e.key === 'ArrowRight') go(center + 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  // A new search starts at its first match.
  useEffect(() => { setAt(0); }, [find]);

  const arrow = 'w-14 h-14 shrink-0 rounded-full border-bold border-border bg-surface flex items-center justify-center motion-safe:hover:scale-110 motion-safe:active:scale-95 motion-safe:transition-transform disabled:opacity-30';
  return (
    <div className="grid">
      <section className="menu-panel max-w-7xl w-full mx-auto flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 6.5rem)' }}>
        <div className="px-5 pt-1 pb-2 min-h-11 flex items-center gap-4 pr-44">
          <h2 className="font-display text-xl font-bold flex-1"><Title text={t('themeScreen.title')} /></h2>
          <label className="relative w-[min(18rem,40vw)]">
            <MagnifyingGlass weight="bold" size={18} className="absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder={t('themeScreen.search')} aria-label={t('themeScreen.search')}
              className="w-full min-h-10 pl-9 pr-3 rounded-pill border-std border-border bg-surface font-bold text-sm" />
          </label>
        </div>
        <div className="relative flex-1 min-h-0 flex items-center gap-3 px-3">
          <button type="button" className={arrow} onClick={() => go(center - 1)} disabled={shown.length < 2} aria-label={t('themeScreen.prev')}><CaretLeft weight="bold" size={26} /></button>
          <div role="radiogroup" aria-label={t('theme.pick')} className="relative flex-1 h-full min-w-0 [perspective:1400px]">
            {shown.length === 0 && <p className="absolute inset-0 grid place-items-center font-bold">{t('themeScreen.none')}</p>}
            {shown.map((th, i) => {
              let d = i - center;
              // The wheel wraps around when there are enough themes to fill both sides.
              if (shown.length > 3) { if (d > shown.length / 2) d -= shown.length; if (d < -shown.length / 2) d += shown.length; }
              if (Math.abs(d) > 2) return null;
              const open = playable(th);
              const on = current.id === th.id;
              const isMain = d === 0;
              return (
                <motion.button key={th.id} type="button" role="radio" aria-checked={on} aria-label={open ? th.name : t('theme.locked', { name: th.name })}
                  onClick={() => (isMain ? open && onChoose(th.id) : go(i))}
                  initial={false}
                  animate={{ x: `${-50 + d * 68 - Math.sign(d) * (Math.abs(d) - 1) * 18}%`, y: "-50%", scale: 1 - Math.abs(d) * 0.18, rotateY: d * -22, opacity: Math.abs(d) === 2 ? 0.55 : 1, zIndex: 10 - Math.abs(d) }}
                  transition={still ? { duration: 0 } : { type: 'spring', stiffness: 170, damping: 22 }}
                  className={`absolute left-1/2 top-1/2 w-[min(46%,52vh)] rounded-panel border-bold border-border p-2 grid gap-1.5 text-left bg-surface ${on && isMain ? 'ring-4 ring-accent' : ''}`}
                  style={{ boxShadow: isMain ? '0 6px 0 #000, 0 24px 40px rgba(36,28,61,0.25)' : '0 3px 0 rgba(0,0,0,0.85)' }}>
                  <span className={open ? '' : 'grayscale opacity-70'}><ThemePreview theme={th} gameName={gameName} /></span>
                  <span className="flex items-center gap-2 font-display text-lg font-bold px-1">
                    {!open && <LockSimple weight="fill" size={18} aria-hidden="true" />}
                    <span className="flex-1 break-words">{th.name}</span>
                    {on && <span className="w-7 h-7 rounded-full bg-accent border-std border-border flex items-center justify-center"><Check weight="bold" size={16} /></span>}
                  </span>
                  {th.designedBy && <span className="text-sm font-bold text-muted px-1">{t('themeScreen.by', { name: creditLine(th) })}</span>}
                </motion.button>
              );
            })}
          </div>
          <button type="button" className={arrow} onClick={() => go(center + 1)} disabled={shown.length < 2} aria-label={t('themeScreen.next')}><CaretRight weight="bold" size={26} /></button>
        </div>
        {main && <p className="sr-only" aria-live="polite">{main.name}</p>}
        <div className="px-5 py-3 flex justify-between gap-2">
          <button type="button" onClick={onBack} className="min-h-11 px-5 rounded-pill border-std border-border bg-surface-2 font-bold text-base inline-flex items-center gap-1.5"><ArrowLeft weight="bold" size={17} />{t('setup.back')}</button>
          <button type="button" onClick={onNext} className="min-h-11 px-6 rounded-pill border-std border-border bg-accent font-display text-lg font-bold inline-flex items-center gap-1.5 motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ boxShadow: '0 3px 0 #000' }}>{t('setup.next')}<ArrowRight weight="bold" size={17} /></button>
        </div>
      </section>
    </div>
  );
}
