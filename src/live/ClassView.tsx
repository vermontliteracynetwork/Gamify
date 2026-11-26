import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, Clock, Eye, EyeSlash, Info, Lightbulb, LockSimple, LockSimpleOpen, Pause, Play, Stop, Warning, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion, QuestionSet } from '../data/types';
import { t } from '../i18n';
import { LimitNote } from '../billing/Upgrade';
import { Button, fieldClasses } from '../ui/kit';
import Meter from '../ui/Meter';
import Title from '../ui/Title';
import { firstPicks, type AnswerLog, type LivePlayer, type LiveState } from './protocol';

// The teacher's Live class view (approved /brand teacher portal 5 and 5b,
// teacher 2026-11-24/25: "live view of the whole class on one question",
// "apply the new mockups that are in the brand page to the main site").
// A full private view over the big screen: tiles sorted by need with a dot
// for every answer, pause, freeze, message and end in reach (Hattie: timely,
// private feedback), and the whole class on one question, a bar per answer
// with who picked it (formative assessment, Black and Wiliam). Only the live
// data the teacher's device receives; nothing here reaches the big screen or
// a student, and Hide names covers the room if the screen is mirrored.

export const STUCK_MS = 60_000;
const AWAY_MS = 15_000;
const DOTS = 8;
const AVATAR = ['bg-gamify', 'bg-quiz-blue', 'bg-blush', 'bg-butter', 'bg-mint-soft', 'bg-secondary'];
const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
type Need = 'stuck' | 'guess' | 'away' | 'locked' | 'ok';
const ORDER: Record<Need, number> = { stuck: 0, guess: 1, away: 2, locked: 3, ok: 4 };
const TILE: Record<Need, string> = { stuck: 'bg-secondary border-border', guess: 'bg-blush border-border', away: 'bg-surface-2 border-transparent', locked: 'bg-butter border-transparent', ok: 'bg-surface border-border-soft' };

export interface ClassViewProps {
  state: LiveState; gameName: string; setName: string; sets: QuestionSet[]; log: AnswerLog; seenAt: Record<string, number>; now: number;
  canMonitor: boolean; customMessage?: boolean; paid: boolean; message: string; setMessage: (m: string) => void; templates: readonly string[];
  lock: (pid: string, on: boolean) => void; onPause: () => void; onEnd: () => void; onClose: () => void;
  setSelect: (p: LivePlayer) => ReactNode; timeLeft: string | null; screenNow: string; goal: number; classRight: number;
  reveal: string | null; setReveal: (q: string | null) => void;
}

export default function ClassView(p: ClassViewProps) {
  const { state, log, now } = p;
  const [tab, setTab] = useState<'class' | 'question'>('class');
  const [hide, setHide] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const [qSel, setQSel] = useState<string | null>(null);
  const inRoom = state.players.filter((x) => x.status === 'in');
  const allLocked = state.locks.all !== undefined;
  const nameOf = (pl: LivePlayer) => (hide ? t('live.cv.student', { n: inRoom.indexOf(pl) + 1 }) : pl.name);
  // H hides the names (when not typing), Escape goes back to the big screen.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.target as HTMLElement)?.closest?.('input, select, textarea, [role="dialog"][aria-modal="true"]')) return;
      if (e.key === 'h' || e.key === 'H') setHide((h) => !h);
      if (e.key === 'Escape') p.onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [p.onClose]); // eslint-disable-line react-hooks/exhaustive-deps

  const need = (pl: LivePlayer): Need => {
    if (pl.askedAt !== null && now - pl.askedAt > STUCK_MS) return 'stuck';
    if (pl.answered >= 4 && pl.right / pl.answered < 0.5) return 'guess';
    if (p.seenAt[pl.pid] && now - p.seenAt[pl.pid] > AWAY_MS) return 'away';
    if (state.locks[pl.pid] !== undefined || allLocked) return 'locked';
    return 'ok';
  };
  const sorted = [...inRoom].sort((a, b) => ORDER[need(a)] - ORDER[need(b)]);
  const chosen = inRoom.find((x) => x.pid === pick) ?? sorted.find((x) => need(x) !== 'ok');

  // Every question this class has met, in set order, for the one-question view.
  const questions = useMemo(() => {
    const byId = new Map<string, MultipleChoiceQuestion>();
    for (const s of p.sets) for (const q of s.questions) if (!byId.has(q.id)) byId.set(q.id, q);
    const seen = new Set<string>([...Object.values(log.on), ...Object.values(log.picks).flatMap((l) => l.map((a) => a.q))]);
    return [...byId.values()].filter((q) => seen.has(q.id));
  }, [p.sets, log]);
  const lastAnswered = Object.values(log.picks).flat().sort((a, b) => b.at - a.at)[0]?.q;
  const onCounts = Object.values(log.on).reduce<Record<string, number>>((m, q) => ({ ...m, [q]: (m[q] ?? 0) + 1 }), {});
  const busiest = Object.entries(onCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const qId = (qSel && questions.some((q) => q.id === qSel) ? qSel : undefined) ?? busiest ?? lastAnswered ?? questions[0]?.id;
  const qIdx = questions.findIndex((q) => q.id === qId);
  const question = questions[qIdx];
  // The hardest question so far: the most wrong first answers.
  const hardest = useMemo(() => {
    let best: { q: MultipleChoiceQuestion; wrong: number; pick: string; count: number } | null = null;
    for (const q of questions) {
      const picks = Object.values(firstPicks(log, q.id));
      const wrong = picks.filter((x) => !x.right);
      if (picks.length < 2 || !wrong.length) continue;
      const tally = wrong.reduce<Record<string, number>>((m, x) => ({ ...m, [x.pick]: (m[x.pick] ?? 0) + 1 }), {});
      const [top, count] = Object.entries(tally).sort((a, b) => b[1] - a[1])[0];
      if (!best || wrong.length > best.wrong) best = { q, wrong: wrong.length, pick: top, count };
    }
    return best;
  }, [questions, log]);

  const tabBtn = (id: 'class' | 'question') => (
    <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
      className={`min-h-9 px-4 rounded-pill font-bold text-sm ${tab === id ? 'bg-surface border-std border-border shadow-[0_0.15rem_0_var(--color-border)]' : 'hover:bg-surface/60'}`}>{t(`live.cv.tab.${id}`)}</button>
  );
  const card = 'bg-surface border-bold border-border rounded-panel p-3.5 grid gap-2 content-start min-w-0';
  const chip = (text: string, bg: string, key: string) => <li key={key} className={`min-h-7 px-2.5 rounded-pill inline-flex items-center font-semibold text-sm ${bg}`}>{text}</li>;

  return (
    <div className="brand-menu absolute inset-0 z-[45] bg-bg text-text overflow-hidden" role="dialog" aria-label={t('live.cv.title')}>
      <div className="h-full max-w-[90rem] mx-auto px-4 sm:px-6 py-3 flex flex-col gap-2.5">
        <header className="flex flex-wrap items-center gap-x-4 gap-y-2 shrink-0">
          <div className="grid gap-0.5 min-w-0 flex-1">
            <span className="text-xs font-bold text-muted">{t('live.cv.crumb', { set: p.setName, game: p.gameName })}</span>
            <h2 className="title-bubble text-2xl m-0 leading-none"><Title text={t('live.cv.title')} /></h2>
          </div>
          <div role="tablist" aria-label={t('live.cv.tabs')} className="flex gap-1 p-1 rounded-pill bg-surface-2 border-std border-border-soft">{tabBtn('class')}{tabBtn('question')}</div>
          <Button size="sm" aria-pressed={hide} onClick={() => setHide(!hide)}>{hide ? <Eye weight="bold" size={16} /> : <EyeSlash weight="bold" size={16} />}{t('live.cv.hideNames')}</Button>
          <Button size="sm" variant="secondary" onClick={p.onClose}><X weight="bold" size={16} />{t('live.cv.back')}</Button>
        </header>
        <p className="m-0 shrink-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded-input px-3.5 py-2 bg-gamify text-sm">
          <EyeSlash weight="bold" size={18} aria-hidden="true" /><b>{t('live.cv.private')}</b><span className="font-semibold">{t('live.cv.privateText')}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="main" onClick={p.onPause}>{state.phase === 'paused' ? <Play weight="fill" size={18} /> : <Pause weight="fill" size={18} />}{state.phase === 'paused' ? t('live.resume') : t('live.pauseAll')}</Button>
          {p.canMonitor && <>
            {/* Typing your own Lock message is Pro; Plus picks a ready-made one (owner, 2026-11-26). */}
            {p.customMessage
              ? <input value={p.message} onChange={(e) => p.setMessage(e.target.value)} maxLength={80} placeholder={t('live.messagePlaceholder')} aria-label={t('live.message')} className={fieldClasses('md', 'flex-1 min-w-[14rem] max-w-[22rem]')} />
              : <span className="font-bold text-sm" role="status">{p.message || t('live.messagePick')}</span>}
            {p.templates.map((k) => <button key={k} type="button" aria-pressed={p.message === k} onClick={() => p.setMessage(p.message === k ? '' : k)} className={`min-h-9 px-3 rounded-pill border-std font-bold text-sm hover:border-border ${p.message === k ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>{k}</button>)}
            <Button onClick={() => p.lock('all', !allLocked)}>{allLocked ? <LockSimpleOpen weight="bold" size={18} /> : <LockSimple weight="fill" size={18} />}{allLocked ? t('live.unlockAll') : t('live.lockAll')}</Button>
          </>}
          <span className="flex-1" />
          {p.timeLeft && <span className="min-h-11 px-4 rounded-pill inline-flex items-center gap-2 bg-surface font-display text-xl tabular-nums" aria-label={t('live.timeLeft', { time: p.timeLeft })}><Clock weight="bold" size={18} aria-hidden="true" />{p.timeLeft}</span>}
          <Button onClick={p.onEnd}><Stop weight="fill" size={18} />{t('live.end')}</Button>
        </div>

        {!p.canMonitor ? <LimitNote>{t('live.monitorPlan')}</LimitNote> : tab === 'class' ? (
          <div className="flex-1 min-h-0 grid gap-3 md:grid-cols-[minmax(0,1fr)_17rem] max-md:overflow-y-auto">
            <section className={`${card} md:min-h-0 md:overflow-y-auto`}>
              <header className="flex items-center gap-2">
                <h3 className="font-heading font-bold text-base m-0">{t('live.cv.playing', { count: inRoom.filter((x) => need(x) !== 'away').length, total: inRoom.length })}</h3>
                <span title={t('live.cv.sortTip')} aria-label={t('live.cv.sortTip')} className="text-muted inline-grid"><Info weight="bold" size={15} /></span>
                <span className="flex-1" /><span className="text-xs font-bold text-muted">{t('live.cv.sort')}</span>
              </header>
              {inRoom.length === 0 ? <p className="m-0 font-semibold text-muted">{t('live.empty')}</p> : (
                <ul aria-label={t('live.players')} className="list-none m-0 p-0 grid gap-2 grid-cols-[repeat(auto-fill,minmax(11.5rem,1fr))]">
                  {sorted.map((pl) => {
                    const n = need(pl);
                    const i = inRoom.indexOf(pl);
                    const hist = log.picks[pl.pid]?.slice(-DOTS);
                    const dots = hist?.length ? hist.map((a) => (a.right ? 'right' : 'miss')) : Array.from({ length: Math.min(pl.answered, DOTS) }, (_, k) => (k < Math.min(pl.right, DOTS) ? 'right' : 'miss'));
                    const line = n === 'stuck' ? t('live.cv.state.stuck', { s: Math.round((now - (pl.askedAt ?? now)) / 1000) })
                      : n === 'guess' ? t('live.cv.state.guess', { right: pl.right, answered: pl.answered })
                      : n === 'away' ? t('live.cv.state.away') : n === 'locked' ? t('live.cv.state.locked')
                      : pl.answered ? t('live.cv.state.ok', { right: pl.right, answered: pl.answered }) : t('live.cv.state.new');
                    return (
                      <li key={pl.pid}>
                        <button type="button" onClick={() => setPick(pl.pid)} aria-pressed={chosen?.pid === pl.pid}
                          className={`w-full text-left rounded-input px-2.5 py-2 grid gap-1.5 border-std hover-pop ${TILE[n]} ${chosen?.pid === pl.pid ? 'ring-4 ring-grape/40' : ''}`}>
                          <span className="flex items-center gap-2 min-w-0">
                            <span className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold shrink-0 ${AVATAR[i % AVATAR.length]}`} aria-hidden="true">{hide ? i + 1 : pl.name[0]}</span>
                            <b className="text-sm flex-1 min-w-0 break-words">{nameOf(pl)}</b>
                            {n === 'stuck' || n === 'guess' ? <Warning weight="bold" size={16} aria-hidden="true" /> : n === 'locked' ? <LockSimple weight="fill" size={16} aria-hidden="true" /> : null}
                          </span>
                          <span className="flex items-center gap-1" aria-hidden="true">
                            {Array.from({ length: DOTS }, (_, k) => <span key={k} className="h-2 flex-1 rounded-full" style={{ background: dots[k] === 'right' ? 'var(--kelly)' : dots[k] === 'miss' ? 'var(--color-danger)' : 'rgba(29,26,51,0.12)' }} />)}
                          </span>
                          <span className={`text-xs font-bold ${n === 'ok' ? 'text-muted' : ''}`}>{line}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
            <div className="grid gap-3 content-start md:min-h-0 md:overflow-y-auto">
              <section className={card}>
                <h3 className="font-heading font-bold text-base m-0">{t('live.cv.onScreen')}</h3>
                <div className="rounded-input p-3 grid justify-items-center text-center gap-1.5 bg-quiz-blue">
                  <span className="title-bubble text-lg leading-tight"><Title text={p.screenNow} /></span>
                  {state.mode === 'together' && !p.reveal && <><Meter part={Math.min(1, p.classRight / p.goal)} width="min(100%, 12rem)" height={18} label={t('live.goalText', { right: p.classRight, goal: p.goal })} /><b className="text-sm">{t('live.goalText', { right: Math.min(p.classRight, p.goal), goal: p.goal })}</b></>}
                </div>
              </section>
              <section className={card}>
                <h3 className="font-heading font-bold text-base m-0">{t('live.cv.hardest')}</h3>
                {hardest ? <>
                  <p className="m-0 text-sm font-bold leading-snug">{hardest.q.prompt}</p>
                  <p className="m-0 text-xs font-semibold text-muted">{t('live.cv.hardestPick', { count: hardest.count, pick: hardest.pick })}</p>
                  <Button size="sm" variant="main" className="justify-self-start" onClick={() => { setQSel(hardest.q.id); setTab('question'); }}><Lightbulb weight="bold" size={16} />{t('live.cv.seeQuestion')}</Button>
                </> : <p className="m-0 text-sm font-semibold text-muted">{t('live.cv.noAnswers')}</p>}
              </section>
              <section className={card} aria-live="polite">
                {chosen ? <>
                  <h3 className="font-heading font-bold text-base m-0 break-words">{nameOf(chosen)}</h3>
                  <Button size="sm" className="justify-self-start" data-tip={t('live.cv.lockHint')} aria-pressed={state.locks[chosen.pid] !== undefined || allLocked}
                    aria-label={t(state.locks[chosen.pid] !== undefined || allLocked ? 'live.unlockOne' : 'live.lockOne', { name: chosen.name })}
                    onClick={() => p.lock(chosen.pid, state.locks[chosen.pid] === undefined)}>
                    {state.locks[chosen.pid] !== undefined ? <LockSimpleOpen weight="bold" size={16} /> : <LockSimple weight="fill" size={16} />}{t(state.locks[chosen.pid] !== undefined ? 'live.cv.unlockOneShort' : 'live.cv.lockOneShort')}
                  </Button>
                  {p.paid && p.setSelect(chosen)}
                </> : <p className="m-0 text-sm font-semibold text-muted">{t('live.cv.pickStudent')}</p>}
              </section>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 grid gap-3 md:grid-cols-[minmax(0,1fr)_17rem] max-md:overflow-y-auto">
            {!question ? <section className={card}><p className="m-0 font-semibold text-muted">{t('live.cv.noQuestions')}</p></section> : (() => {
              const picks = firstPicks(log, question.id);
              const mine = inRoom.filter((pl) => picks[pl.pid]);
              const waiting = inRoom.filter((pl) => !picks[pl.pid]);
              const total = Math.max(1, inRoom.length);
              const right = question.choices[question.correctIndex];
              const wrongTally = mine.filter((pl) => picks[pl.pid].pick !== right).reduce<Record<string, number>>((m, pl) => ({ ...m, [picks[pl.pid].pick]: (m[picks[pl.pid].pick] ?? 0) + 1 }), {});
              const topWrong = Object.entries(wrongTally).sort((a, b) => b[1] - a[1])[0];
              const qNext = questions[(qIdx + 1) % questions.length];
              return <>
                <section className={`${card} md:min-h-0 md:overflow-y-auto`} aria-label={question.prompt}>
                  <header className="flex flex-wrap items-center gap-2">
                    <Button size="sm" disabled={qIdx <= 0} aria-label={t('live.cv.prevQ')} data-tip={t('live.cv.prevQ')} onClick={() => setQSel(questions[qIdx - 1].id)}><ArrowLeft weight="bold" size={16} /></Button>
                    <span className="text-xs font-bold text-muted">{t('live.cv.question', { n: qIdx + 1, total: questions.length })}</span>
                    <Button size="sm" disabled={qIdx >= questions.length - 1} aria-label={t('live.cv.nextQArrow')} data-tip={t('live.cv.nextQArrow')} onClick={() => setQSel(questions[qIdx + 1].id)}><ArrowRight weight="bold" size={16} /></Button>
                    <span className="flex-1" />
                    <b className="text-sm text-muted">{t('live.cv.answered', { count: mine.length, total: inRoom.length })}</b>
                  </header>
                  <h3 className="font-heading font-bold text-xl m-0 leading-snug text-left">{question.prompt}</h3>
                  <ul className="list-none m-0 p-0 grid gap-2.5">
                    {question.choices.map((c, k) => {
                      const who = mine.filter((pl) => picks[pl.pid].pick === c);
                      const ok = k === question.correctIndex;
                      return (
                        <li key={k} className="grid gap-1.5" aria-label={`${LETTERS[k]} ${c}: ${t('live.cv.picked', { count: who.length, answer: LETTERS[k] })}${ok ? `, ${t('live.cv.right')}` : ''}`}>
                          <div className="grid grid-cols-[minmax(6rem,14rem)_minmax(0,1fr)_2.5rem] items-center gap-3">
                            <b className="flex items-start gap-1.5 min-w-0 break-words">{ok ? <CheckCircle weight="fill" size={18} className="shrink-0 text-success mt-0.5" aria-hidden="true" /> : <span className="w-[18px] shrink-0" />}<span className="shrink-0">{LETTERS[k]}</span><span className="min-w-0">{c}</span></b>
                            <span className="h-5 rounded-pill overflow-hidden border-std border-border bg-surface-2"><span className={`block h-full motion-safe:transition-[width] duration-500 ${ok ? 'bg-success' : 'bg-blush'}`} style={{ width: `${(who.length / total) * 100}%` }} /></span>
                            <b className="text-right tabular-nums">{who.length}</b>
                          </div>
                          {who.length > 0 && <ul className="list-none m-0 p-0 flex flex-wrap gap-1 pl-[calc(18px+0.375rem)] sm:pl-[calc(min(14rem,max(6rem,25%))+0.75rem)]">{who.map((pl) => chip(nameOf(pl), ok ? 'bg-mint-soft' : 'bg-blush', pl.pid))}</ul>}
                        </li>
                      );
                    })}
                  </ul>
                  {topWrong && <p className="m-0 text-sm font-bold flex gap-2"><Lightbulb weight="bold" size={18} className="shrink-0" aria-hidden="true" />{t('live.cv.mistake', { pick: topWrong[0], count: topWrong[1] })}</p>}
                </section>
                <div className="grid gap-3 content-start md:min-h-0 md:overflow-y-auto">
                  <section className={card}>
                    <h3 className="font-heading font-bold text-base m-0">{t('live.cv.waiting')}</h3>
                    {waiting.length ? <ul className="list-none m-0 p-0 flex flex-wrap gap-1.5">{waiting.map((pl) => chip(nameOf(pl), 'bg-butter', pl.pid))}</ul> : <p className="m-0 text-sm font-semibold text-muted">{t('live.cv.allAnswered')}</p>}
                  </section>
                  <section className={card}>
                    <h3 className="font-heading font-bold text-base m-0">{t('live.cv.actions')}</h3>
                    <Button variant="primary" disabled={questions.length < 2} onClick={() => setQSel(qNext.id)}>{t('live.cv.nextQ')}<ArrowRight weight="bold" size={16} /></Button>
                    <Button aria-pressed={p.reveal === question.id} onClick={() => p.setReveal(p.reveal === question.id ? null : question.id)}>{t(p.reveal === question.id ? 'live.cv.hideAnswer' : 'live.cv.showAnswer')}</Button>
                    <Button onClick={p.onPause}>{t(state.phase === 'paused' ? 'live.cv.resumeClass' : 'live.cv.pauseClass')}</Button>
                  </section>
                </div>
              </>;
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

// The answer on the big screen (teacher's choice from One question): the
// question and its right answer only, never names or counts.
export function RevealCard({ question, onClose }: { question: MultipleChoiceQuestion; onClose: () => void }) {
  return (
    <div className="brand-menu absolute inset-0 z-[25] grid place-items-center p-4 bg-black/35">
      <div className="w-[min(40rem,92vw)] bg-surface border-heavy border-border rounded-panel p-6 grid gap-4 text-text relative" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} role="status" aria-label={t('live.cv.answerTitle')}>
        <button type="button" onClick={onClose} aria-label={t('live.cv.hideAnswer')} data-tip={t('live.cv.hideAnswer')} className="absolute top-3 right-3 w-11 h-11 rounded-full border-std border-border bg-surface grid place-items-center"><X weight="bold" size={20} /></button>
        <h2 className="title-bubble text-3xl text-center m-0"><Title text={t('live.cv.answerTitle')} /></h2>
        <p className="m-0 font-heading font-bold text-2xl leading-snug text-left pr-10">{question.prompt}</p>
        <p className="m-0 rounded-input bg-mint-soft border-std border-border px-4 py-3 font-bold text-2xl flex items-center gap-3"><CheckCircle weight="fill" size={30} className="text-success shrink-0" aria-hidden="true" />{question.choices[question.correctIndex]}</p>
      </div>
    </div>
  );
}
