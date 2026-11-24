import { useState } from 'react';
import { data, newId } from '../data';
import { getGame } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { fieldClasses } from '../ui/kit';
import { addFormSent } from './tester';

// The after-game beta form for teachers (owner, 2026-11-24: "a 1-3 minute tap
// form with short answer inputs"). Taps first, two short answers, then send.
// It reaches the owner's Feedback and Beta test pages as a beta report.
const WORKED = ['yes', 'some', 'no'] as const;
const PROBLEMS = ['froze', 'slow', 'blocked', 'cutoff', 'sound', 'confusing', 'none'] as const;
const SCALE = ['good', 'ok', 'bad'] as const;

export default function BetaGameForm({ gameId, onDone }: { gameId: string; onDone: () => void }) {
  const [worked, setWorked] = useState<string | null>(null);
  const [problems, setProblems] = useState<string[]>([]);
  const [liked, setLiked] = useState<string | null>(null);
  const [setup, setSetup] = useState<string | null>(null);
  const [broke, setBroke] = useState('');
  const [change, setChange] = useState('');
  const [sent, setSent] = useState(false);
  const name = getGame(gameId)?.name ?? gameId;
  const chip = (on: boolean) => `min-h-10 px-3 rounded-pill border-std border-border font-bold text-sm ${on ? 'bg-accent' : 'bg-surface'}`;
  const row = (label: StringKey, opts: readonly string[], value: string | null, set: (v: string) => void, prefix: string) => (
    <fieldset className="grid gap-1.5 border-0 p-0 m-0">
      <legend className="font-bold text-sm mb-1">{t(label)}</legend>
      <div className="flex flex-wrap gap-1.5">{opts.map((o) => <button key={o} type="button" aria-pressed={value === o} onClick={() => set(o)} className={chip(value === o)}>{t(`${prefix}.${o}` as StringKey)}</button>)}</div>
    </fieldset>
  );
  async function send() {
    const pick = (prefix: string, v: string | null) => (v ? t(`${prefix}.${v}` as StringKey) : 'not answered');
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: 'beta', role: 'teacher', where: `/play/${gameId}`, device: navigator.userAgent,
      details: `Beta game form: ${name}. Worked: ${pick('bform.worked', worked)}. Problems: ${problems.length ? problems.map((p) => t(`bform.problem.${p}` as StringKey)).join(', ') : 'none picked'}. Students liked it: ${pick('bform.scale', liked)}. Setup: ${pick('bform.scale', setup)}. What broke or was blocked: ${broke.trim() || '-'}. Change: ${change.trim() || '-'}`.slice(0, 1000),
    });
    await addFormSent(gameId);
    setSent(true);
    window.setTimeout(onDone, 1400);
  }
  if (sent) return <p className="font-bold text-center" role="status">{t('bform.thanks')}</p>;
  return (
    <form className="grid gap-3 rounded-input border-std border-border-soft p-3 text-left" onSubmit={(e) => { e.preventDefault(); void send(); }}>
      <p className="font-display text-xl m-0">{t('bform.title', { game: name })}</p>
      {row('bform.worked', WORKED, worked, setWorked, 'bform.worked')}
      <fieldset className="grid gap-1.5 border-0 p-0 m-0">
        <legend className="font-bold text-sm mb-1">{t('bform.problems')}</legend>
        <div className="flex flex-wrap gap-1.5">{PROBLEMS.map((p) => {
          const on = problems.includes(p);
          return <button key={p} type="button" aria-pressed={on} className={chip(on)}
            onClick={() => setProblems(p === 'none' ? (on ? [] : ['none']) : on ? problems.filter((x) => x !== p) : [...problems.filter((x) => x !== 'none'), p])}>{t(`bform.problem.${p}` as StringKey)}</button>;
        })}</div>
      </fieldset>
      {row('bform.liked', SCALE, liked, setLiked, 'bform.scale')}
      {row('bform.setup', SCALE, setup, setSetup, 'bform.scale')}
      <label className="grid gap-1 font-bold text-sm">{t('bform.broke')}<input value={broke} onChange={(e) => setBroke(e.target.value)} maxLength={200} className={fieldClasses('sm', 'w-full')} /></label>
      <label className="grid gap-1 font-bold text-sm">{t('bform.change')}<input value={change} onChange={(e) => setChange(e.target.value)} maxLength={200} className={fieldClasses('sm', 'w-full')} /></label>
      <button type="submit" disabled={!worked} className="justify-self-center min-h-12 px-6 rounded-input border-bold border-border bg-accent font-display text-lg disabled:opacity-40">{t('bform.send')}</button>
    </form>
  );
}
