import { useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowSquareOut, Flask, MagnifyingGlass, Scales, ShieldCheck, Sparkle } from '@phosphor-icons/react';
import { t } from '../i18n';
import { Tabs } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { CAUTIONS, FINDINGS, MEASURE, WONT_CLAIM } from './research';

type Tab = 'works' | 'fair' | 'measure' | 'sources';

// The public Research tab: what studies found, what critics found and how
// Gamify answers it, what we won't claim, and how Gamify will measure itself.
export default function ResearchPage() {
  const [params, setParams] = useSearchParams();
  const reduce = useReducedMotion();
  const tab = (['works', 'fair', 'measure', 'sources'].includes(params.get('tab') ?? '') ? params.get('tab') : 'works') as Tab;
  const card = 'hover-lift bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3 content-start';
  const enter = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : Math.min(i, 8) * 0.05 } });
  const allSources = [...FINDINGS.flatMap((f) => f.sources), ...CAUTIONS.flatMap((c) => c.sources)].filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i);

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <div>
          <h1 className="title-bubble text-5xl flex items-center gap-3"><Flask weight="fill" size={44} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('research.title')} /></h1>
          <p className="text-lg font-bold mt-2 max-w-3xl">{t('research.sub')}</p>
        </div>
        <Tabs label={t('research.tabs')} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={[
          { id: 'works', label: t('research.tab.works') },
          { id: 'fair', label: t('research.tab.fair') },
          { id: 'measure', label: t('research.tab.measure') },
          { id: 'sources', label: t('research.tab.sources') },
        ]} />

        {tab === 'works' && (
          <section aria-label={t('research.tab.works')} className="grid gap-4">
            <p className="font-bold bg-surface-2 border-[2px] border-border rounded-input p-3">{t('research.honest')}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {FINDINGS.map((f, i) => (
                <motion.article key={f.id} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <h2 className="font-display text-2xl leading-tight"><Title text={f.title} /></h2>
                  <p className="font-semibold">{f.found}</p>
                  <p className="text-sm font-semibold rounded-input bg-surface-2 p-2"><span className="font-bold">{t('research.fair')} </span>{f.fair}</p>
                  <p className="text-sm font-semibold flex gap-2"><Sparkle weight="fill" size={18} className="shrink-0 mt-0.5" aria-hidden="true" /><span><span className="font-bold">{t('research.inGamify')} </span>{f.inGamify}</span></p>
                  <ul className="grid gap-1 list-none p-0 m-0">
                    {f.sources.map((s) => (
                      <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex gap-1 items-start">{s.cite}<ArrowSquareOut size={14} className="shrink-0 mt-0.5" aria-label={t('research.newTab')} /></a></li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>
          </section>
        )}

        {tab === 'fair' && (
          <section aria-label={t('research.tab.fair')} className="grid gap-4">
            <p className="font-bold text-lg max-w-3xl">{t('research.fairIntro')}</p>
            <div className="grid md:grid-cols-2 gap-4">
              {CAUTIONS.map((c, i) => (
                <motion.article key={c.risk} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <h2 className="font-display text-2xl flex items-center gap-2"><Scales weight="bold" size={26} aria-hidden="true" className="wiggle-on-hover shrink-0" /><Title text={c.risk} /></h2>
                  <p className="font-semibold"><span className="font-bold">{t('research.criticsFound')} </span>{c.found}</p>
                  <p className="font-semibold flex gap-2"><ShieldCheck weight="fill" size={20} className="shrink-0 mt-0.5" aria-hidden="true" /><span><span className="font-bold">{t('research.ourAnswer')} </span>{c.answer}</span></p>
                  {c.sources.map((s) => <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold">{s.cite}</a>)}
                </motion.article>
              ))}
            </div>
            <motion.article {...enter(5)} className={`${card} bg-accent`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <h2 className="font-display text-2xl"><Title text={t('research.wontTitle')} /></h2>
              <ul className="grid gap-2 pl-6 m-0 list-disc font-semibold">{WONT_CLAIM.map((w) => <li key={w}>{w}</li>)}</ul>
            </motion.article>
          </section>
        )}

        {tab === 'measure' && (
          <section aria-label={t('research.tab.measure')} className="grid gap-4">
            <p className="font-bold text-lg max-w-3xl">{t('research.measureIntro')}</p>
            <ol className="grid md:grid-cols-4 gap-4 list-none p-0 m-0">
              {MEASURE.map((m, i) => (
                <motion.li key={m.step} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <span className="w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center font-display text-2xl wiggle-on-hover">{i + 1}</span>
                  <h2 className="font-display text-2xl"><Title text={m.step} /></h2>
                  <p className="font-semibold">{m.text}</p>
                </motion.li>
              ))}
            </ol>
          </section>
        )}

        {tab === 'sources' && (
          <section aria-label={t('research.tab.sources')} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-2xl flex items-center gap-2"><MagnifyingGlass weight="bold" size={26} aria-hidden="true" /><Title text={t('research.tab.sources')} /></h2>
            <p className="font-semibold text-sm">{t('research.sourcesNote')}</p>
            <ul className="grid gap-2 pl-5 m-0 list-disc">
              {allSources.map((s) => <li key={s.url} className="font-semibold"><a href={s.url} target="_blank" rel="noreferrer">{s.cite}</a></li>)}
            </ul>
          </section>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
