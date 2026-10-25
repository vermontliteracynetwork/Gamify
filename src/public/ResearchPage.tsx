import { Link, useSearchParams } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowSquareOut, CheckCircle, Flask, MagnifyingGlass, Printer, RocketLaunch } from '@phosphor-icons/react';
import { t } from '../i18n';
import { buttonClasses, Tabs } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { BETA_DOING, CAUTIONS, FINDINGS, WONT_CLAIM } from './research';

type Tab = 'works' | 'beta' | 'sources';

// The public Research tab (teacher requests, 2026-10-25): what the research
// says Gamify gets right, written big and positive with the honest notes
// kept small; how Gamify is designed around the known pitfalls; Gamify's
// beginning stages with a way to join the beta; and every source.
export default function ResearchPage() {
  const [params, setParams] = useSearchParams();
  const reduce = useReducedMotion();
  const tab = (['works', 'beta', 'sources'].includes(params.get('tab') ?? '') ? params.get('tab') : 'works') as Tab;
  const card = 'hover-lift bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-3 content-start';
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
          { id: 'beta', label: t('research.tab.beta') },
          { id: 'sources', label: t('research.tab.sources') },
        ]} />

        {tab === 'works' && (
          <section aria-label={t('research.tab.works')} className="grid gap-5">
            <div className="grid md:grid-cols-2 gap-5">
              {FINDINGS.map((f, i) => (
                <motion.article key={f.id} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                  <h2 className="font-display text-3xl leading-tight"><Title text={f.title} /></h2>
                  <p className="text-lg font-semibold leading-relaxed">{f.found}</p>
                  <p className="text-lg font-bold rounded-input bg-accent border-[2px] border-border p-3"><span className="font-display">{t('research.inGamify')} </span>{f.inGamify}</p>
                  <p className="text-sm font-semibold text-muted"><span className="font-bold">{t('research.goodToKnow')} </span>{f.fair}</p>
                  <ul className="grid gap-1 list-none p-0 m-0">
                    {f.sources.map((s) => (
                      <li key={s.url}><a href={s.url} target="_blank" rel="noreferrer" className="text-xs font-bold inline-flex gap-1 items-start">{s.cite}<ArrowSquareOut size={14} className="shrink-0 mt-0.5" aria-label={t('research.newTab')} /></a></li>
                    ))}
                  </ul>
                </motion.article>
              ))}
            </div>

            <h2 className="font-display text-4xl mt-4"><Title text={t('research.designedTitle')} /></h2>
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
            <p className="font-bold bg-surface-2 border-[2px] border-border rounded-input p-3">{t('research.honest')}</p>
            <details className="bg-surface border-[2px] border-border rounded-input p-4">
              <summary className="font-display text-xl cursor-pointer">{t('research.wontTitle')}</summary>
              <ul className="grid gap-2 pl-6 mt-3 mb-0 list-disc font-semibold">{WONT_CLAIM.map((w) => <li key={w}>{w}</li>)}</ul>
            </details>
          </section>
        )}

        {tab === 'beta' && <BetaTab card={card} enter={enter} />}

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

// Gamify's beginning stages and the pilot; joining happens on the beta test page.
function BetaTab({ card, enter }: { card: string; enter: (i: number) => object }) {
  return (
    <section aria-label={t('research.tab.beta')} className="grid gap-5">
      <div className="bg-accent border-[2.5px] border-border rounded-panel p-6 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <h2 className="font-display text-4xl flex items-center gap-3"><RocketLaunch weight="fill" size={40} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('beta.title')} /></h2>
        <p className="text-lg font-bold max-w-3xl">{t('beta.intro')}</p>
        <Link to="/beta" className={buttonClasses('primary', 'justify-self-start min-h-14 px-8 text-lg hover-pop !bg-text !text-white')}>{t('beta.join')}</Link>
      </div>
      <ol className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
        {BETA_DOING.map((m, i) => (
          <motion.li key={m.step} {...enter(i)} className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <span className="w-12 h-12 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center font-display text-2xl wiggle-on-hover">{i + 1}</span>
            <h3 className="font-display text-2xl"><Title text={m.step} /></h3>
            <p className="font-semibold">{m.text}</p>
          </motion.li>
        ))}
      </ol>
      <Link to="/beta-kit" className={buttonClasses('secondary', 'justify-self-start hover-pop')}><Printer weight="bold" size={18} />{t('beta.kit')}</Link>
    </section>
  );
}
