import { useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowSquareOut, CheckCircle, Flask, MagnifyingGlass } from '@phosphor-icons/react';
import { t } from '../i18n';
import { Tabs } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { CAUTIONS, FINDINGS, WONT_CLAIM } from './research';

// No beta test tab (teacher, 2026-11-20); the beta has its own /beta page.
type Tab = 'works' | 'sources';

// The public Research tab (teacher requests, 2026-10-25): what the research
// says Gamify gets right, written big and positive with the honest notes
// kept small; how Gamify is designed around the known pitfalls; Gamify's
// beginning stages with a way to join the beta; and every source.
export default function ResearchPage() {
  const [params, setParams] = useSearchParams();
  const reduce = useReducedMotion();
  const tab = (['works', 'sources'].includes(params.get('tab') ?? '') ? params.get('tab') : 'works') as Tab;
  const card = 'hover-lift bg-surface border-bold border-border rounded-panel p-6 grid gap-3 content-start';
  const enter = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : Math.min(i, 8) * 0.05 } });
  const allSources = [...FINDINGS.flatMap((f) => f.sources), ...CAUTIONS.flatMap((c) => c.sources)].filter((s, i, a) => a.findIndex((x) => x.url === s.url) === i);

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-5">
        <div>
          <h1 className="title-bubble text-5xl flex items-center gap-3"><Flask weight="fill" size={44} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('research.title')} /></h1>
          <p className="text-xl font-bold mt-2 max-w-3xl">{t('research.sub')}</p>
        </div>
        <Tabs label={t('research.tabs')} value={tab} onChange={(v) => setParams({ tab: v }, { replace: true })} options={[
          { id: 'works', label: t('research.tab.works') },
          { id: 'sources', label: t('research.tab.sources') },
        ]} />

        {tab === 'works' && (
          <section aria-label={t('research.tab.works')} className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-5">
              {FINDINGS.map((f, i) => (
                <motion.article key={f.id} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <h2 className="font-display text-3xl leading-tight"><Title text={f.title} /></h2>
                  <p className="text-lg font-semibold leading-relaxed">{f.found}</p>
                  <p className="text-lg font-bold rounded-input bg-accent border-std border-border p-3"><span className="font-display">{t('research.inGamify')} </span>{f.inGamify}</p>
                  <p className="text-sm font-semibold text-muted"><span className="font-bold">{t('research.goodToKnow')} </span>{f.fair}</p>
                  <ul className="grid gap-1 list-none p-0 m-0">
                    {f.sources.map((s) => (
                      <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex gap-1 items-start">{s.cite}<ArrowSquareOut size={14} className="shrink-0 mt-0.5" aria-label={t('research.newTab')} /></a></li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>

            <h2 className="title-bubble text-4xl mt-4"><Title text={t('research.designedTitle')} /></h2>
            <p className="text-lg font-bold max-w-3xl -mt-2">{t('research.designedIntro')}</p>
            <div className="grid md:grid-cols-2 gap-5">
              {CAUTIONS.map((c, i) => (
                <motion.article key={c.title} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <h3 className="font-display text-3xl leading-tight flex items-start gap-2"><CheckCircle weight="fill" size={32} color="#1f7a45" className="shrink-0 mt-0.5 wiggle-on-hover" aria-hidden="true" /><Title text={c.title} /></h3>
                  <p className="text-lg font-semibold leading-relaxed">{c.answer}</p>
                  <p className="text-sm font-semibold text-muted"><span className="font-bold">{t('research.whyItMatters')} </span>{c.found} <a href={c.sources[0].url} target="_blank" rel="noreferrer" className="font-bold">{c.sources[0].cite}</a></p>
                </motion.article>
              ))}
            </div>
            <p className="font-bold bg-surface-2 border-std border-border rounded-input p-3">{t('research.honest')}</p>
            <details className="bg-surface border-std border-border rounded-input p-4">
              <summary className="font-display text-xl cursor-pointer">{t('research.wontTitle')}</summary>
              <ul className="grid gap-2 pl-6 mt-3 mb-0 list-disc font-semibold">{WONT_CLAIM.map((w) => <li key={w}>{w}</li>)}</ul>
            </details>
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

