import { useEffect, useMemo, useState } from 'react';
import { playClip } from './music';
import { pace, POP_IN } from './pace';
import { AccessButton } from '../settings/SettingsPanel';
import { motion } from 'motion/react';
import { Check, HandTap, SpeakerHigh, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, speak } from './feedback';
import { setAnswerer } from './answerer';
import { shuffleChoices } from './questions';
import { TeamBadge } from './TeamBadge';
import { CPU_ACCURACY, type CpuLevel, type TurnPlayer } from './turns';
import DialogFocus from '../ui/DialogFocus';
import { mirrorSend } from '../live/mirror';

const LETTERS = ['A', 'B', 'C', 'D'];
const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

// How many turns each team has had, to rotate who answers.
const ANSWERED = new Map<string, number>();

// The Share-mode question: big enough to read from the back of the room.
// The team taps its answer (multiple choice, like the Independent Work
// Dashboard; teacher, 2026-10-24) and it checks itself: one tap a turn, and
// a miss shows the right answer. On the computer's turn it "answers" by its
// level; it never answers for students.
export default function ShareQuestion({ question, player, cpuLevel, onResult, chance, magnet, avatar, sounds, turnCard = true }: {
  question: MultipleChoiceQuestion; player: TurnPlayer; cpuLevel: CpuLevel; onResult: (right: boolean) => void;
  // Which try this is, when a game gives more than one (Game Show: 3).
  chance?: { n: number; total: number };
  // A magnet power-up (Board Game, teacher 2026-10-31): a magnet flies in and sticks to the right answer.
  magnet?: string;
  // The player's own piece picture for the turn card (Board Game heroes).
  avatar?: string;
  // A game's own right and wrong answer sounds (Game Show, teacher 2026-11-01).
  sounds?: { right: string; wrong: string };
  // False when the game already showed the turn card before the move (Game Show).
  turnCard?: boolean;
}) {
  const answerSound = (right: boolean) => (sounds ? playClip(right ? sounds.right : sounds.wrong, settings) : playEffect(right ? 'right' : 'miss', settings));
  const { settings } = useSettings();
  const q = useMemo(() => shuffleChoices(question), [question]);
  // Rotating answerer (market research, 2026-10-31): on a team made from the
  // class list, a different student answers each turn, so one loud voice
  // cannot take over. Retries in the same turn keep the same student.
  const answerer = useMemo(() => {
    const m = player.members;
    if (!m || m.length < 2) { setAnswerer(player.name, null); return null; }
    const k = ANSWERED.get(player.id) ?? 0;
    const who = !chance || chance.n <= 1 ? m[k % m.length] : m[Math.max(0, k - 1) % m.length];
    if (!chance || chance.n <= 1) ANSWERED.set(player.id, k + 1);
    setAnswerer(player.name, who);
    return who;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [shown, setShown] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [cpu, setCpu] = useState<'thinking' | 'right' | 'miss' | null>(player.kind === 'cpu' ? 'thinking' : null);
  // The turn card (teacher, 2026-10-31): the player's own icon, big, and a tap
  // to start, so every team knows it is their turn. The computer's card
  // moves on by itself.
  // A second or third try in the same turn goes straight to the question.
  const [ready, setReady] = useState((!!chance && chance.n > 1) || !turnCard);
  useEffect(() => {
    if (player.kind !== 'cpu') return;
    const id = window.setTimeout(() => setReady(true), (settings.motion === 'still' ? 400 : 1200) * pace(settings));
    return () => window.clearTimeout(id);
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Little readers hear every question and its answers once it opens.
  useEffect(() => {
    if (!ready || !settings.autoRead) return;
    const id = window.setTimeout(() => speak(`${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`, settings), 350);
    return () => window.clearTimeout(id);
  }, [q, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Share Mirror: the student's own copy shows this question.
  useEffect(() => {
    mirrorSend({ t: 'q', prompt: q.prompt, choices: q.choices, player: player.name, imageUrl: q.imageUrl, imageAlt: q.imageAlt });
    return () => mirrorSend({ t: 'clear' });
  }, [q]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (shown) mirrorSend({ t: 'result', picked, correct: q.correctIndex, right: picked === q.correctIndex || cpu === 'right' }); }, [shown]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (player.kind !== 'cpu' || !ready) return;
    const right = Math.random() < CPU_ACCURACY[cpuLevel];
    const a = window.setTimeout(() => { setCpu(right ? 'right' : 'miss'); setShown(true); answerSound(right); }, 1800 * pace(settings));
    const b = window.setTimeout(() => onResult(right), 3600 * pace(settings));
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [q, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i: number) {
    if (picked !== null || cpu) return;
    const right = i === q.correctIndex;
    setPicked(i); setShown(true);
    answerSound(right);
    window.setTimeout(() => onResult(right), settings.motion === 'still' ? 900 : right ? 1300 : 2200);
  }

  if (!ready && turnCard) return <TurnCard player={player} avatar={avatar} answerer={answerer} onStart={() => setReady(true)} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}
        className="w-full max-w-5xl max-h-full overflow-y-auto bg-surface border-[3px] border-border rounded-panel p-6 grid gap-5"
        style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <TeamBadge colorIndex={player.colorIndex} size={48} />
          <span className="grid">
            <span className="font-display text-3xl font-bold">{t('share.whoseTurn', { name: player.name })}</span>
            {answerer ? <span className="font-bold">{t('share.answerer', { name: answerer })}</span> : player.members && <span className="font-bold text-muted">{player.members.join(', ')}</span>}
          </span>
          <span className="flex-1" />
          {chance && chance.total === Infinity && <span className="font-bold">{t('share.chanceOpen', { n: chance.n })}</span>}
          {chance && chance.total > 1 && chance.total !== Infinity && (
            <span className="inline-flex items-center gap-1.5 font-bold" aria-label={t('share.chance', { n: chance.n, total: chance.total })}>
              {Array.from({ length: chance.total }, (_, k) => <span key={k} aria-hidden="true" className={`w-4 h-4 rounded-full border-[2px] border-border ${k < chance.n - 1 ? 'bg-danger/70' : k === chance.n - 1 ? 'bg-accent' : 'bg-surface'}`} />)}
              <span className="ml-1">{t('share.chance', { n: chance.n, total: chance.total })}</span>
            </span>
          )}
          <button type="button" onClick={() => speak(`${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`, settings)}
            className="min-h-12 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2">
            <SpeakerHigh weight="bold" size={22} />{t('q.listen')}
          </button>
          <AccessButton small />
        </div>

        {player.kind === 'teacher' && <p className="font-bold text-xl">{t('share.teacherTurn')}</p>}

        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[min(16rem,22dvh)] w-auto mx-auto rounded-input border-[2px] border-border-soft" />}
        <h2 className="font-body text-4xl sm:text-5xl font-bold leading-tight text-balance">{q.prompt}</h2>

        <div className="grid sm:grid-cols-2 gap-3">
          {q.choices.map((c, i) => {
            const isRight = shown && i === q.correctIndex;
            const isWrong = picked === i && i !== q.correctIndex;
            return (
              <motion.button key={i} type="button" onClick={() => choose(i)} disabled={picked !== null || !!cpu} data-magnet={magnet && i === q.correctIndex ? 'true' : undefined}
                animate={isWrong && settings.motion !== 'still' ? { x: [0, -8, 8, -5, 5, 0] } : isRight && picked === i && settings.motion !== 'still' ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`min-h-20 px-4 py-3 rounded-input border-[3px] border-border flex items-center gap-3 font-bold text-2xl sm:text-3xl text-left active:scale-[0.98] disabled:cursor-default
                ${TILE_COLORS[i]} relative ${shown && !isRight && !isWrong ? 'opacity-40' : ''} ${isRight ? 'ring-[5px] ring-success' : ''} ${isWrong ? 'ring-[5px] ring-danger' : ''} ${magnet && i === q.correctIndex && !shown ? 'ring-[5px] ring-accent' : ''}`}
                style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <span className="w-12 h-12 shrink-0 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center font-display text-2xl">
                  {isRight ? <Check weight="bold" size={26} aria-label={t('q.rightMark')} /> : isWrong ? <X weight="bold" size={26} aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
                {q.choiceImages?.[i] && <img src={q.choiceImages[i]!} alt={q.choiceAlts?.[i] ?? ''} className="w-14 h-14 shrink-0 object-cover rounded-input border-[2px] border-border bg-surface" />}
                <span className="sr-only"> </span>
                <span className="min-w-0 break-words">{c}</span>
                {magnet && i === q.correctIndex && (
                  <motion.img src={magnet} alt={t('cq.magnetHere')} className="absolute -top-7 -right-4 w-16 h-16 object-contain pointer-events-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]"
                    initial={settings.motion === 'still' ? false : { x: 240, y: -260, rotate: -60, opacity: 0, scale: 0.6 }} animate={{ x: 0, y: 0, rotate: [-60, 12, -6, 0], opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }} />
                )}
              </motion.button>
            );
          })}
        </div>

        {cpu ? (
          <p className="font-display text-3xl font-bold text-center" role="status" aria-live="polite">
            {cpu === 'thinking' ? t('share.cpuThinking') : cpu === 'right' ? t('share.cpuRight') : t('share.cpuMiss')}
          </p>
        ) : (
          <p className="min-h-10 font-display text-3xl font-bold text-center" role="status" aria-live="polite">
            {picked === null ? '' : picked === q.correctIndex ? t('share.tapRight') : chance && chance.n < chance.total ? t('share.tryAnother') : t('share.tapMiss')}
          </p>
        )}
      </motion.div>
    </div>
  );
}

// The turn card (teacher, 2026-11-01): it comes before the player's move and
// shows only their icon, big and glowing, with a tapping hand; no words like
// "it's your turn". Tap it and it goes away. The computer's turn card goes
// away on its own. On a class-list team, the student answering is named.
export function TurnCard({ player, avatar, answerer, onStart }: { player: TurnPlayer; avatar?: string; answerer?: string | null; onStart: () => void }) {
  const { settings } = useSettings();
  useEffect(() => {
    if (player.kind !== 'cpu') return;
    const id = window.setTimeout(onStart, (settings.motion === 'still' ? 400 : 1200) * pace(settings));
    return () => window.clearTimeout(id);
  }, [player.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('share.turnCard', { name: player.name })}>
      <DialogFocus />
      <motion.button type="button" onClick={() => { playEffect('tap', settings); onStart(); }} disabled={player.kind === 'cpu'}
        initial={settings.motion === 'still' ? false : { scale: 0.4, opacity: 0, rotate: -8 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={POP_IN}
        className="relative grid justify-items-center gap-4 bg-surface border-[3px] border-border rounded-panel px-12 py-10 max-w-[92vw]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }} aria-label={t('share.turnStart')}>
        <motion.span animate={settings.motion === 'still' ? undefined : { y: [0, -10, 0] }} transition={{ duration: 1.2, repeat: Infinity }}
          className="rounded-full ring-8 ring-accent" style={{ boxShadow: '0 0 40px 10px #fdfd94' }}>
          {avatar ? <img src={avatar} alt="" className="w-[min(14rem,34vh)] h-[min(14rem,34vh)] rounded-full border-[3px] border-border object-contain bg-surface-2" /> : <TeamBadge colorIndex={player.colorIndex} size={210} />}
        </motion.span>
        {answerer && <span className="font-display text-2xl sm:text-3xl text-center rounded-pill border-[2.5px] border-border bg-[#c8f0dc] px-5 py-1">{t('share.answerer', { name: answerer })}</span>}
        {player.kind !== 'cpu' && <HandTap weight="fill" size={56} aria-hidden="true" className={`absolute -bottom-5 -right-5 drop-shadow-[0_2px_0_#000] text-accent ${settings.motion === 'still' ? '' : 'motion-safe:animate-bounce'}`} />}
      </motion.button>
    </div>
  );
}
