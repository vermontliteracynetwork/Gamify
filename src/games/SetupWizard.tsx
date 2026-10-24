import { useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import Title from '../ui/Title';

export interface SetupPage { id: string; title: string; content: ReactNode; ready?: boolean }

// Game settings split into short pages (questions, game options, teams,
// theme...) with a step bar, Back and Next, and Play on the last page.
export default function SetupWizard({ pages, onBack, onPlay }: { pages: SetupPage[]; onBack: () => void; onPlay: () => void }) {
  const [i, setI] = useState(0);
  const page = pages[i];
  const last = i === pages.length - 1;
  return (
    <div className="grid content-center" style={{ minHeight: 'calc(100dvh - 190px)' }}>
    <section className="bg-surface border-[2.5px] border-border rounded-panel max-w-3xl mx-auto flex flex-col overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 190px)' }}>
      <div className="px-5 pt-4 pb-3 border-b-[2px] border-border-soft grid gap-2">
        <ol className="flex gap-1.5 list-none p-0 m-0" aria-label={t('setup.steps')}>
          {pages.map((p, k) => (
            <li key={p.id} className="flex-1">
              <button type="button" onClick={() => setI(k)} disabled={k > i && pages.slice(i, k).some((x) => x.ready === false)}
                aria-current={k === i ? 'step' : undefined} aria-label={t('setup.stepOf', { n: k + 1, total: pages.length, title: p.title })}
                className={`w-full h-2.5 rounded-pill border border-border ${k <= i ? 'bg-accent' : 'bg-surface-2'}`} />
            </li>
          ))}
        </ol>
        <h2 className="font-display text-2xl font-bold"><Title text={t('setup.stepTitle', { n: i + 1, total: pages.length, title: page.title })} /></h2>
      </div>
      <div className="px-5 py-4 grid gap-4 content-start overflow-y-auto min-h-0 flex-1">{page.content}</div>
      <div className="px-5 py-3 border-t-[2px] border-border-soft flex justify-between gap-2">
        <button type="button" onClick={() => (i === 0 ? onBack() : setI(i - 1))}
          className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2">
          <ArrowLeft weight="bold" size={20} />{t('setup.back')}
        </button>
        <button type="button" disabled={page.ready === false} onClick={() => (last ? onPlay() : setI(i + 1))}
          className="min-h-12 px-6 rounded-pill border-[2.5px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2 disabled:opacity-50">
          {last ? <><Play weight="fill" size={22} />{t('start.play')}</> : <>{t('setup.next')}<ArrowRight weight="bold" size={20} /></>}
        </button>
      </div>
    </section>
    </div>
  );
}
