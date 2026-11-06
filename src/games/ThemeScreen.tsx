import { useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LockSimple, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import { creditLine } from '../theme/credit';
import ThemePreview from '../theme/builder/ThemePreview';
import type { GameTheme } from '../theme/types';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';

// Its own screen in every game's start-up: big previews of each theme the
// game can wear. Locked themes show a lock only (no prices or buy words).
export default function ThemeScreen({ gameName, current, themes, playable, onChoose, onBack, onNext }: {
  gameName: string; current: GameTheme; themes: GameTheme[]; playable: (th: GameTheme) => boolean;
  onChoose: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  const [preview, setPreview] = useState<GameTheme | null>(null);
  // Every theme card fits on screen, as big as the space allows (teacher,
  // 2026-11-06: "you cant even see it all").
  const body = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ cols: 1, w: 320 });
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const GAP = 20, LABEL = 56, PAD = 16;
    const measure = () => {
      const W = el.clientWidth - 40, H = el.clientHeight - 32;
      let best = { cols: 1, w: 0 };
      for (let cols = 1; cols <= themes.length; cols++) {
        const rows = Math.ceil(themes.length / cols);
        const byW = (W - GAP * (cols - 1)) / cols;
        const byH = ((H - GAP * (rows - 1)) / rows - LABEL - PAD) * (4 / 3) + PAD;
        const w = Math.min(byW, byH, 560);
        if (w > best.w) best = { cols, w };
      }
      setFit({ cols: best.cols, w: Math.max(160, Math.floor(best.w)) });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [themes.length]);
  return (
    <div className="grid">
      <section className="menu-panel max-w-6xl w-full mx-auto flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 7.5rem)' }}>
        <h2 className="font-display text-xl font-bold px-5 pt-1 pb-2 min-h-11 flex items-center pr-40"><Title text={t('themeScreen.title')} /></h2>
        <div role="radiogroup" aria-label={t('theme.pick')} ref={body} className="px-5 py-4 grid gap-5 overflow-hidden min-h-0 flex-1 content-center justify-center" style={{ gridTemplateColumns: `repeat(${fit.cols}, ${fit.w}px)` }}>
          {themes.map((th) => {
            const open = playable(th);
            const on = current.id === th.id;
            return (
              <button key={th.id} type="button" role="radio" aria-checked={on} aria-label={open ? th.name : t('theme.locked', { name: th.name })}
                onClick={() => (open ? onChoose(th.id) : setPreview(th))}
                className={`tile-wiggle group relative rounded-panel border-[2.5px] border-border p-2 grid gap-1.5 text-left bg-surface ${on ? 'ring-4 ring-accent' : ''}`} style={{ boxShadow: on ? '0 6px 0 #000' : '0 3px 0 rgba(0,0,0,0.85)' }}>
                <span className={open ? '' : 'grayscale opacity-70'}><ThemePreview theme={th} gameName={gameName} /></span>
                <span className="flex items-center gap-2 font-display text-base font-bold px-1">
                  {!open && <LockSimple weight="fill" size={18} aria-hidden="true" />}
                  <span className="flex-1 truncate">{th.name}</span>
                  {on && <span className="w-7 h-7 rounded-full bg-accent border-[2px] border-border flex items-center justify-center"><Check weight="bold" size={16} /></span>}
                </span>
                {th.designedBy && <span className="text-xs font-bold text-muted px-1">{t('themeScreen.by', { name: creditLine(th) })}</span>}
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 flex justify-between gap-2">
          <button type="button" onClick={onBack} className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-1.5"><ArrowLeft weight="bold" size={16} />{t('setup.back')}</button>
          <button type="button" onClick={onNext} className="min-h-11 px-6 rounded-pill border-[2.5px] border-border bg-accent font-display text-lg font-bold inline-flex items-center gap-1.5 motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ boxShadow: '0 3px 0 #000' }}>{t('setup.next')}<ArrowRight weight="bold" size={16} /></button>
        </div>
      </section>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('theme.preview', { name: preview.name })}>
          <DialogFocus onClose={() => setPreview(null)} />
          <div className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-3 w-full max-w-md" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <div className="flex items-center justify-between">
              <span className="font-display text-2xl font-bold flex items-center gap-2"><LockSimple weight="fill" size={22} aria-hidden="true" />{preview.name}</span>
              <button type="button" onClick={() => setPreview(null)} aria-label={t('theme.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
            </div>
            <ThemePreview theme={preview} gameName={gameName} />
          </div>
        </div>
      )}
    </div>
  );
}
