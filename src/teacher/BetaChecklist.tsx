import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CaretDown, CheckCircle, Circle, Flask, Minus } from '@phosphor-icons/react';
import { data } from '../data';
import { t } from '../i18n';
import { Panel } from '../ui/kit';
import Title from '../ui/Title';
import { BETA } from '../beta/spec';
import type { BetaSteps } from '../beta/tester';

// The beta tester checklist (owner, 2026-11-24): build a question set, play
// every listed game at least once, design a theme, send the after-game forms.
// It ticks itself from what the teacher has done.
const SMALL = 'beta-checklist-small';

export default function BetaChecklist({ s }: { s: BetaSteps }) {
  const [small, setSmall] = useState(false);
  useEffect(() => { void data.getSetting<boolean>(SMALL).then((v) => setSmall(!!v)); }, []);
  const toggle = () => { setSmall(!small); void data.setSetting(SMALL, !small); };
  const steps = [
    { key: 'set', done: s.sets > 0, to: '/teacher/sets', label: t('bcheck.set') },
    { key: 'games', done: s.played.length >= s.games.length, to: '/play', label: t('bcheck.games', { done: s.played.length, total: s.games.length }) },
    { key: 'theme', done: s.themes > 0, to: '/teacher/themes', label: t('bcheck.theme') },
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
            {s.games.map((g) => <li key={g.id} className={`px-2.5 py-1 rounded-pill border-std text-xs font-bold ${s.played.includes(g.id) ? 'bg-accent border-border' : 'bg-surface border-border-soft text-muted'}`}>{s.played.includes(g.id) ? '✓ ' : ''}{g.name}</li>)}
          </ul>
          <p className="text-sm font-semibold m-0">{t('bcheck.note', { months: BETA.months })} <Link to="/beta-kit">{t('bcheck.kit')}</Link> · <Link to="/it">{t('bcheck.it')}</Link></p>
        </>
      )}
    </Panel>
  );
}
