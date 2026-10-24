import { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, LockSimple, X } from '@phosphor-icons/react';
import { t } from '../i18n';
import ThemePreview from '../theme/builder/ThemePreview';
import type { GameTheme } from '../theme/types';

// Its own screen in every game's start-up: big previews of each theme the
// game can wear. Locked themes show a lock only (no prices or buy words).
export default function ThemeScreen({ gameName, current, themes, playable, onChoose, onBack, onNext }: {
  gameName: string; current: GameTheme; themes: GameTheme[]; playable: (th: GameTheme) => boolean;
  onChoose: (id: string) => void; onBack: () => void; onNext: () => void;
}) {
  const [preview, setPreview] = useState<GameTheme | null>(null);
  return (
    <div className="grid content-center" style={{ minHeight: 'calc(100dvh - 190px)' }}>
      <section className="bg-surface border-[2.5px] border-border rounded-panel max-w-4xl w-full mx-auto flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 190px)' }}>
        <h2 className="font-display text-2xl font-bold px-5 pt-4 pb-3 border-b-[2px] border-border-soft">{t('themeScreen.title')}</h2>
        <div role="radiogroup" aria-label={t('theme.pick')} className="px-5 py-4 grid grid-cols-2 md:grid-cols-3 gap-4 overflow-y-auto min-h-0 flex-1 content-start">
          {themes.map((th) => {
            const open = playable(th);
            const on = current.id === th.id;
            return (
              <button key={th.id} type="button" role="radio" aria-checked={on} aria-label={open ? th.name : t('theme.locked', { name: th.name })}
                onClick={() => (open ? onChoose(th.id) : setPreview(th))}
                className={`rounded-panel border-[2.5px] p-2 grid gap-2 text-left bg-surface ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}>
                <span className={open ? '' : 'grayscale opacity-70'}><ThemePreview theme={th} gameName={gameName} /></span>
                <span className="flex items-center gap-2 font-display text-lg font-bold px-1">
                  {!open && <LockSimple weight="fill" size={18} aria-hidden="true" />}
                  <span className="flex-1 truncate">{th.name}</span>
                  {on && <span className="w-7 h-7 rounded-full bg-accent border-[2px] border-border flex items-center justify-center"><Check weight="bold" size={16} /></span>}
                </span>
                {th.designedBy && <span className="text-xs font-bold text-muted px-1">{t('themeScreen.by', { name: th.designedBy })}</span>}
              </button>
            );
          })}
        </div>
        <div className="px-5 py-3 border-t-[2px] border-border-soft flex justify-between gap-2">
          <button type="button" onClick={onBack} className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2"><ArrowLeft weight="bold" size={20} />{t('setup.back')}</button>
          <button type="button" onClick={onNext} className="min-h-12 px-6 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2">{t('setup.next')}<ArrowRight weight="bold" size={20} /></button>
        </div>
      </section>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('theme.preview', { name: preview.name })}>
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
