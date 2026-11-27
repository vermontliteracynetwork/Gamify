import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CaretDown, CheckCircle, Circle, Flask, Minus, Palette } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import { Panel } from '../ui/kit';
import Title from '../ui/Title';
import { BETA } from '../beta/spec';
import { loadManual, saveManual, type BetaSteps } from '../beta/tester';

// The beta tester checklist (owner, 2026-11-24): build a question set, play
// every listed game at least once, design a theme, send the after-game forms.
// It ticks itself from what the teacher has done.
const SMALL = 'beta-checklist-small';

export default function BetaChecklist({ s }: { s: BetaSteps }) {
  const [small, setSmall] = useState(false);
  useEffect(() => { void data.getSetting<boolean>(SMALL).then((v) => setSmall(!!v)); }, []);
  const toggle = () => { setSmall(!small); void data.setSetting(SMALL, !small); };
  const steps = [
    { key: 'set', done: s.sets >= BETA.questionSets, to: '/teacher/sets', label: t('bcheck.set', { done: Math.min(s.sets, BETA.questionSets), goal: BETA.questionSets }) },
    { key: 'games', done: s.played.length >= s.games.length, to: '/play', label: t('bcheck.games', { done: s.played.length, total: s.games.length }) },
    { key: 'theme', done: s.themeGames >= BETA.themeGames, to: '/teacher/themes', label: t('bcheck.theme', { done: Math.min(s.themeGames, BETA.themeGames), goal: BETA.themeGames }) },
    { key: 'forms', done: s.forms >= s.games.length, to: '/play', label: t('bcheck.forms', { done: Math.min(s.forms, s.games.length), total: s.games.length }) },
  ];
  const count = steps.filter((x) => x.done).length;
  return (
    <Panel className="mb-4 grid gap-2 !p-3 bg-secondary">
      <div className="flex items-center gap-2">
        <Flask weight="fill" size={22} aria-hidden="true" />
        <div className="flex-1 flex flex-wrap items-baseline gap-x-3">
          <h2 className="font-display text-xl"><Title text={t('bcheck.title')} /></h2>
          <p className="font-bold text-sm">{t('start.progress', { done: count, total: steps.length })}</p>
        </div>
        <button type="button" aria-label={small ? t('start.expand') : t('start.minimize')} aria-expanded={!small} onClick={toggle} className="w-9 h-9 rounded-full border-std border-border bg-surface flex items-center justify-center">{small ? <CaretDown weight="bold" size={18} /> : <Minus weight="bold" size={18} />}</button>
      </div>
      {!small && (
        <>
          <ol className="grid grid-cols-2 lg:grid-cols-4 gap-2 list-none p-0 m-0">
            {steps.map((x) => (
              <li key={x.key}>
                <Link to={x.to} className={`min-h-12 h-full rounded-input border-std border-border px-3 py-2 flex items-center gap-2 font-bold text-sm no-underline text-text ${x.done ? 'bg-surface-2' : 'bg-surface'}`}>
                  {x.done ? <CheckCircle weight="fill" size={22} className="shrink-0" aria-hidden="true" /> : <Circle weight="bold" size={22} className="shrink-0" aria-hidden="true" />}
                  <span className={x.done ? 'line-through' : ''}>{x.label}</span>
                </Link>
              </li>
            ))}
          </ol>
          <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0" aria-label={t('bcheck.gamesLabel')}>
            {s.games.map((g) => <li key={g.id} className={`px-2.5 py-1 rounded-pill border-std text-xs font-bold ${s.played.includes(g.id) ? 'bg-butter border-border' : 'bg-surface border-border-soft text-muted'}`}>{s.played.includes(g.id) ? '✓ ' : ''}{g.name}</li>)}
          </ul>
          <p className="text-sm font-semibold m-0">{t('bcheck.note', { months: BETA.months })} <Link to="/beta-kit">{t('bcheck.kit')}</Link> · <Link to="/it">{t('bcheck.it')}</Link></p>
        </>
      )}
    </Panel>
  );
}

// The beta tester checklist (owner, 2026-11-24, and 2026-11-27: "a tab in the
// teacher portal for those who have signed up for the beta test ... a list
// form checklist where it'll auto check off each step once they've completed
// it"): grouped steps, the ones Gamify can see tick themselves, the rest are a
// tap and remembered. Also lives on its own page, /teacher/beta.
export function BetaTab({ s }: { s: BetaSteps }) {
  const [manual, setManual] = useState<string[]>([]);
  useEffect(() => { void loadManual().then(setManual); }, []);
  const tap = (key: string) => { const next = manual.includes(key) ? manual.filter((k) => k !== key) : [...manual, key]; setManual(next); void saveManual(next); };
  type Step = { key: string; label: string; to?: string; done?: boolean };
  const groups: { id: string; title: string; steps: Step[] }[] = [
    { id: 'start', title: t('bcheck.g.start'), steps: [
      { key: 'slips', label: t('bcheck.slips'), to: '/challenge/permission' },
      { key: 'photos', label: t('bcheck.photos') },
      { key: 'lesson', label: t('bcheck.lesson'), to: '/beta-kit' },
    ] },
    { id: 'make', title: t('bcheck.g.make'), steps: [
      { key: 'set', done: s.sets >= BETA.questionSets, to: '/teacher/sets', label: t('bcheck.set', { done: Math.min(s.sets, BETA.questionSets), goal: BETA.questionSets }) },
      { key: 'theme', done: s.themeGames >= BETA.themeGames, to: '/teacher/themes', label: t('bcheck.theme', { done: Math.min(s.themeGames, BETA.themeGames), goal: BETA.themeGames }) },
      { key: 'physical', label: t('bcheck.physical'), to: '/teacher/themes' },
      { key: 'challenge', label: t('bcheck.challenge'), to: '/challenge' },
    ] },
    { id: 'play', title: t('bcheck.g.play'), steps: [
      { key: 'host', done: s.weeks >= BETA.hostGames, to: '/teacher/activity', label: t('bcheck.host', { done: Math.min(s.weeks, BETA.hostGames), goal: BETA.hostGames }) },
      { key: 'games', done: s.played.length >= s.games.length, to: '/play', label: t('bcheck.games', { done: s.played.length, total: s.games.length }) },
      { key: 'forms', done: s.forms >= s.games.length, to: '/play', label: t('bcheck.forms', { done: Math.min(s.forms, s.games.length), total: s.games.length }) },
      { key: 'ratings', label: t('bcheck.ratings') },
    ] },
    { id: 'tell', title: t('bcheck.g.tell'), steps: [
      { key: 'surveys', label: t('bcheck.surveys') },
      { key: 'blocked', label: t('bcheck.blocked') },
    ] },
  ];
  const isDone = (x: Step) => x.done ?? manual.includes(x.key);
  const all = groups.flatMap((g) => g.steps);
  const count = all.filter(isDone).length;
  const pct = Math.round((count / all.length) * 100);
  const row = 'min-h-12 w-full rounded-input border-std border-border px-3 py-2 flex items-center gap-2.5 font-bold text-sm no-underline text-text text-left';
  const mark = (done: boolean) => done ? <CheckCircle weight="fill" size={24} className="shrink-0 text-kelly" aria-hidden="true" /> : <Circle weight="bold" size={24} className="shrink-0" aria-hidden="true" />;
  return (
    <div className="grid gap-5">
      <Panel className="grid gap-3 !bg-butter">
        <div className="flex items-center gap-3">
          <Flask weight="fill" size={30} aria-hidden="true" />
          <h2 className="font-heading font-bold text-2xl flex-1">{t('bcheck.fullTitle')}</h2>
          <p className="font-display text-3xl m-0 tabular-nums">{count}/{all.length}</p>
        </div>
        <span role="img" aria-label={t('start.progress', { done: count, total: all.length })} className="block h-4 rounded-full bg-surface border-std border-border overflow-hidden"><span className="block h-full bg-kelly motion-safe:transition-all" style={{ width: `${pct}%` }} /></span>
      </Panel>
      {/* The beta's art ask (owner, 2026-11-27): as many physical art mediums as
          possible, and the Theme Building Challenge, with recognition on the site. */}
      <Link to="/challenge" className="rounded-panel border-bold border-border bg-grape text-white p-5 grid sm:grid-cols-[auto_1fr] gap-4 items-center no-underline hover-lift" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <span className="w-14 h-14 rounded-full bg-lemon text-text border-std border-border grid place-items-center" aria-hidden="true"><Palette weight="fill" size={28} /></span>
        <span className="grid gap-1.5">
          <b className="font-heading text-xl">{t('bcheck.art.title')}</b>
          <span className="flex flex-wrap gap-1.5">{(['paint', 'collage', 'clay', 'scrapbook', 'journal', 'found', 'nature'] as const).map((m) => <span key={m} className="rounded-pill bg-paper text-text border-std border-border px-2.5 min-h-8 inline-flex items-center text-sm font-bold">{t(`bcheck.art.${m}`)}</span>)}</span>
          <span className="font-semibold text-sm">{t('bcheck.art.text')}</span>
        </span>
      </Link>
      <div className="grid md:grid-cols-2 gap-4 items-start">
        {groups.map((g) => {
          const n = g.steps.filter(isDone).length;
          return (
            <Panel key={g.id} className="grid gap-2">
              <div className="flex items-center gap-2"><h3 className="font-heading font-bold text-lg flex-1">{g.title}</h3><span className="text-sm font-bold">{n}/{g.steps.length}</span></div>
              <ol className="grid gap-2 list-none p-0 m-0">
                {g.steps.map((x) => {
                  const done = isDone(x);
                  const auto = x.done !== undefined;
                  return (
                    <li key={x.key} className="flex items-center gap-2">
                      {auto ? (
                        <Link to={x.to ?? '#'} className={`${row} ${done ? 'bg-surface-2' : 'bg-surface'}`}>{mark(done)}<span className={`flex-1 ${done ? 'line-through' : ''}`}>{x.label}</span><span className="text-xs text-muted">{t('bcheck.auto')}</span></Link>
                      ) : (
                        <button type="button" role="checkbox" aria-checked={done} onClick={() => tap(x.key)} className={`${row} ${done ? 'bg-surface-2' : 'bg-surface'}`}>{mark(done)}<span className={`flex-1 ${done ? 'line-through' : ''}`}>{x.label}</span><span className="text-xs text-muted">{t('bcheck.tap')}</span></button>
                      )}
                      {!auto && x.to && <Link to={x.to} aria-label={t('bcheck.open', { step: x.label })} className="w-11 h-11 shrink-0 rounded-full border-std border-border bg-surface grid place-items-center"><ArrowRight weight="bold" size={18} aria-hidden="true" /></Link>}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          );
        })}
      </div>
      <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0" aria-label={t('bcheck.gamesLabel')}>
        {s.games.map((g) => <li key={g.id} className={`px-2.5 py-1 rounded-pill border-std text-xs font-bold ${s.played.includes(g.id) ? 'bg-butter border-border' : 'bg-surface border-border-soft text-muted'}`}>{s.played.includes(g.id) ? '✓ ' : ''}{g.name}</li>)}
      </ul>
      <p className="text-sm font-semibold m-0">{t('bcheck.note', { months: BETA.months })} <Link to="/beta-kit">{t('bcheck.kit')}</Link> · <Link to="/it">{t('bcheck.it')}</Link></p>
    </div>
  );
}
