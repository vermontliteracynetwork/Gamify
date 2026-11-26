import { useEffect, useMemo, useState } from 'react';
import { ANSWER_SOUNDS, playClip } from './music';
import { CPU_THINK_MS, pace, POP_IN } from './pace';
import TapOk from './TapOk';
import { GearButton, SettingsPanel } from '../settings/SettingsPanel';
import { motion } from 'motion/react';
import { Check, SpeakerHigh, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import Gif from '../ui/Gif';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, speakQuestion } from './feedback';
import { setAnswerer } from './answerer';
import { shuffleChoices } from './questions';
import { TeamBadge } from './TeamBadge';
import { CPU_ACCURACY, type CpuLevel, type TurnPlayer } from './turns';
import DialogFocus from '../ui/DialogFocus';
import PopText from '../ui/PopText';
import { mirrorSend } from '../live/mirror';

import { answerScale, BADGE_COLORS, LETTERS, qfpx, qpx, qStep, TILE_COLORS } from './questionCard';

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
  const answerSound = (right: boolean) => { const set = sounds ?? ANSWER_SOUNDS; playClip(right ? set.right : set.wrong, settings); };
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
  const [settingsOpen, setSettingsOpen] = useState(false);
  // The turn card (teacher, 2026-10-31): the player's own icon, big, and a tap
  // to start, so every team knows it is their turn. The computer's card
  // moves on by itself.
  // A second or third try in the same turn goes straight to the question.
  // The computer's card waits for a tap too (teacher, 2026-11-24).
  const [ready, setReady] = useState((!!chance && chance.n > 1) || !turnCard);
  // The answer stays up until it is tapped (teacher, 2026-11-24: "require tap to close").
  const [done, setDone] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  const goOn = () => { if (done === null || sent) return; setSent(true); onResult(done); };

  // Little readers hear every question and its answers once it opens.
  useEffect(() => {
    if (!ready || !settings.autoRead) return;
    const id = window.setTimeout(() => speakQuestion(q, settings), 350);
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
    // It thinks for a while first, so the class can follow its turn.
    const a = window.setTimeout(() => { setCpu(right ? 'right' : 'miss'); setShown(true); answerSound(right); setDone(right); }, (settings.motion === 'still' ? 1000 : CPU_THINK_MS) * pace(settings));
    return () => { window.clearTimeout(a); };
  }, [q, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i: number) {
    if (picked !== null || cpu) return;
    const right = i === q.correctIndex;
    setPicked(i); setShown(true);
    answerSound(right);
    window.setTimeout(() => setDone(right), settings.motion === 'still' ? 300 : 700);
  }

  if (!ready && turnCard) return <TurnCard player={player} avatar={avatar} answerer={answerer} onStart={() => setReady(true)} />;

  const still = settings.motion === 'still';
  // Every tile keeps one size (teacher, 2026-11-24); long answers step their text down together.
  const ansK = answerScale(q.choices);

  return (
    // THE question card over the game (Universal views 10, approved
    // 2026-11-25): the same card as the solo question screen, read from the
    // back of the room, with the game still showing around it.
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-[rgba(29,26,51,0.28)]" role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={still ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}
        className="q-card max-w-full max-h-full overflow-y-auto bg-white border-heavy border-border flex flex-col"
        style={{ width: qpx('--q-w'), padding: qpx('--q-pad'), gap: qpx('--q-gap-y'), borderRadius: qpx('--q-radius'), boxShadow: '0 6px 0 var(--ink)' }}
      >
        <div className="flex flex-wrap items-center" style={{ gap: qpx('--q-gap') }}>
          {/* The player's own animal or team icon and the name as plain text, no pill (teacher, 2026-11-24). */}
          <span className="flex-1 min-w-[9rem] flex items-center gap-3">
            {avatar ? <img src={avatar} alt="" className="object-contain shrink-0 drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]" style={{ width: qpx('--q-btn'), height: qpx('--q-btn') }} /> : <TeamBadge colorIndex={player.colorIndex} size={40} />}
            <span className="grid min-w-0">
              <b className="font-heading leading-tight line-clamp-2" style={{ fontSize: qfpx('--q-name') }}>{t('share.whoseTurn', { name: player.name })}</b>
              {answerer ? <span className="font-bold text-sm">{t('share.answerer', { name: answerer })}</span> : player.members && <span className="font-bold text-sm text-muted truncate">{player.members.join(', ')}</span>}
            </span>
          </span>
          {chance && chance.total === Infinity && <span className="font-bold shrink-0">{t('share.chanceOpen', { n: chance.n })}</span>}
          {chance && chance.total > 1 && chance.total !== Infinity && (
            <span className="inline-flex items-center gap-1.5 font-bold shrink-0" aria-label={t('share.chance', { n: chance.n, total: chance.total })}>
              {Array.from({ length: chance.total }, (_, k) => <span key={k} aria-hidden="true" className={`w-4 h-4 rounded-full border-std border-border ${k < chance.n - 1 ? 'bg-danger/70' : k === chance.n - 1 ? 'bg-mint' : 'bg-surface'}`} />)}
              <span className="ml-1 hidden sm:inline">{t('share.chance', { n: chance.n, total: chance.total })}</span>
            </span>
          )}
          {/* Only Settings and Listen on a question (teacher, 2026-11-24); accessibility is in Settings. */}
          <GearButton small onClick={() => setSettingsOpen(true)} />
          <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
          <button type="button" onClick={() => speakQuestion(q, settings)}
            className="shrink-0 px-[1em] rounded-pill border-std border-border bg-blue-crystal font-bold inline-flex items-center gap-1.5 active:scale-95"
            style={{ minHeight: `max(2.75rem, ${qpx('--q-btn')})`, fontSize: `max(1rem, ${qfpx('--q-btn-fs')})`, boxShadow: '0 3px 0 var(--ink)' }}>
            <SpeakerHigh weight="bold" size="1.15em" />{t('q.listen')}
          </button>
        </div>

        {player.kind === 'teacher' && <p className="font-bold text-xl -my-1">{t('share.teacherTurn')}</p>}

        {/* A fixed block for the question, its text left aligned (Universal views 10). */}
        <div className={`shrink-0 flex ${q.imageUrl ? "flex-col justify-center items-start gap-2" : "items-center"} min-h-0 overflow-y-auto`} style={{ height: qpx('--q-block') }}>
          {q.imageUrl && <figure className="m-0 min-h-0 h-[55%] shrink-0 flex flex-col items-start"><Gif src={q.imageUrl} still={q.imageStill} alt={q.imageAlt ?? ''} className="min-h-0 flex-1 w-auto max-w-full object-contain rounded-input border-std border-border-soft" />{q.imageCredit && <figcaption className="text-[10px] font-semibold text-muted">{q.imageCredit}</figcaption>}</figure>}
          <h2 className="q-prompt font-body font-bold leading-snug text-left text-pretty" style={{ fontSize: qfpx(qStep(q.prompt.length + (q.imageUrl ? 40 : 0))) }}>{q.prompt}</h2>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(var(--q-cols), minmax(0, 1fr))', gap: qpx('--q-gap') }}>
          {q.choices.map((c, i) => {
            const isRight = shown && i === q.correctIndex;
            const isWrong = picked === i && i !== q.correctIndex;
            return (
              <motion.button key={i} type="button" onClick={() => choose(i)} disabled={picked !== null || !!cpu} data-magnet={magnet && i === q.correctIndex ? 'true' : undefined}
                initial={still ? false : { scale: 0.85, opacity: 0 }}
                animate={isWrong && !still ? { x: [0, -8, 8, -5, 5, 0], scale: 1, opacity: 1 } : isRight && picked === i && !still ? { scale: [1, 1.05, 1], opacity: 1 } : { scale: 1, opacity: 1 }}
                transition={isWrong || (isRight && picked === i) ? { duration: 0.4 } : { type: 'spring', stiffness: 420, damping: 22, delay: 0.1 + i * 0.05 }}
                whileHover={picked === null && !cpu && !still ? { y: -3, transition: { duration: 0.18 } } : undefined}
                whileTap={picked === null && !cpu && !still ? { scale: 0.96, y: 2 } : undefined}
                className={`relative min-w-0 border-heavy border-border flex items-center font-bold text-left leading-tight disabled:cursor-default
                ${isRight ? 'bg-mint' : TILE_COLORS[i]} ${shown && !isRight && !isWrong ? 'opacity-40' : ''} ${isRight ? 'ring-[5px] ring-success' : ''} ${isWrong ? 'ring-[5px] ring-danger' : ''} ${magnet && i === q.correctIndex && !shown ? 'ring-[5px] ring-accent' : ''}`}
                style={{ height: qpx('--q-tile'), gap: qpx('--q-gap'), padding: `0 ${qpx('--q-gap')}`, borderRadius: qpx('--q-tile-r'), fontSize: qfpx('--q-tile-fs', ansK), boxShadow: '0 5px 0 var(--ink)' }}>
                <span className={`shrink-0 rounded-full border-heavy border-border flex items-center justify-center font-display ${isRight ? 'bg-kelly' : BADGE_COLORS[i]}`}
                  style={{ width: qpx('--q-badge'), height: qpx('--q-badge'), fontSize: qfpx('--q-badge-fs') }}>
                  {isRight ? <Check weight="bold" size="0.8em" aria-label={t('q.rightMark')} /> : isWrong ? <X weight="bold" size="0.8em" aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
                {q.choiceImages?.[i] && <img src={q.choiceImages[i]!} alt={q.choiceAlts?.[i] ?? ''} className="shrink-0 object-cover rounded-input border-std border-border bg-surface" style={{ width: qpx('--q-badge'), height: qpx('--q-badge') }} />}
                <span className="sr-only"> </span>
                <span className="min-w-0 line-clamp-2">{c}</span>
                {isRight && picked === i && !still && <Burst />}
                {magnet && i === q.correctIndex && (
                  <motion.img src={magnet} alt={t('cq.magnetHere')} className="absolute -top-7 -right-4 w-16 h-16 object-contain pointer-events-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]"
                    initial={still ? false : { x: 240, y: -260, rotate: -60, opacity: 0, scale: 0.6 }} animate={{ x: 0, y: 0, rotate: [-60, 12, -6, 0], opacity: 1, scale: 1 }}
                    transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }} />
                )}
              </motion.button>
            );
          })}
        </div>

        <div className="min-h-[3.5rem] -mb-1 flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
        {cpu ? (
          <p className="font-display text-2xl font-bold text-center" role="status" aria-live="polite">
            {t(cpu === 'thinking' ? 'share.cpuThinking' : cpu === 'right' ? 'share.cpuRight' : 'share.cpuMiss', { name: player.name })}
          </p>
        ) : (
          <p className="font-display text-2xl font-bold text-center" role="status" aria-live="polite">
            {picked === null ? '' : <PopText key={`${picked}-${chance?.n ?? 0}`} text={picked === q.correctIndex ? t('share.tapRight') : chance && chance.n < chance.total ? t('share.tryAnother') : t('share.tapMiss')} gold={picked === q.correctIndex} />}
          </p>
        )}
        {done !== null && !sent && <TapOk onTap={goOn} label={t('tap.goOn')} />}
        </div>
      </motion.div>
    </div>
  );
}

// The turn card (teacher, 2026-11-01): it comes before the player's move and
// shows only their picture, no words and no box: the animal or team icon
// floats big in the middle with a soft glow, bobbing and wiggling. Tap it and
// it goes away. The computer's goes away on its own. On a class-list team,
// the student answering is named.
export function TurnCard({ player, avatar, answerer, onStart }: { player: TurnPlayer; avatar?: string; answerer?: string | null; onStart: () => void }) {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  // Every turn card, the computer's too, waits for a tap (teacher, 2026-11-24).
  const start = () => { playEffect('tap', settings); onStart(); };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('share.turnCard', { name: player.name })}>
      <DialogFocus />
      <motion.div className="grid justify-items-center gap-4"
        initial={still ? false : { scale: 0.3, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={POP_IN}>
      {/* The picture is a tap target too; the OK below is the named button. */}
      <div onClick={start} aria-hidden="true" className="relative grid justify-items-center gap-4 p-6 rounded-full cursor-pointer">
        {/* A glow that spins clockwise behind the icon, which bobs and
            gently grows and shrinks (teacher, 2026-11-06). */}
        {/* Always on, slow and soft, so it shows even with calm motion settings
            (teacher, 2026-11-06: "where is the glow animation"). */}
        <span aria-hidden="true" className="turn-rays absolute left-1/2 top-1/2 w-[min(30rem,70vh)] h-[min(30rem,70vh)] -ml-[min(15rem,35vh)] -mt-[min(15rem,35vh)] rounded-full pointer-events-none" />
        <span aria-hidden="true" className="turn-halo absolute left-1/2 top-1/2 w-[min(22rem,52vh)] h-[min(22rem,52vh)] -ml-[min(11rem,26vh)] -mt-[min(11rem,26vh)] rounded-full pointer-events-none" />
        <motion.span className="relative" animate={still ? undefined : { y: [0, -12, 0], rotate: [-3, 3, -3], scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 18px #fff1b8) drop-shadow(0 0 36px rgba(255,241,184,0.7))' }}>
          {avatar ? <img src={avatar} alt="" className="w-[min(18rem,42vh)] h-[min(18rem,42vh)] object-contain" /> : <TeamBadge colorIndex={player.colorIndex} size={220} />}
        </motion.span>
      </div>
        {answerer && <span className="relative font-display text-2xl sm:text-3xl text-center rounded-pill border-bold border-border bg-mint-soft px-5 py-1">{t('share.answerer', { name: answerer })}</span>}
      <TapOk onTap={start} label={t('share.turnStart')} className="relative" />
      </motion.div>
    </div>
  );
}

// Stars and sparks burst out of the right answer (engagement audit, 2026-11-08).
const BURST_COLORS = ['#fabe37', '#f055a5', '#22b04a', '#4ba3e8', '#fffaf0'];
function Burst() {
  const bits = useMemo(() => Array.from({ length: 14 }, (_, k) => {
    const a = (k / 14) * Math.PI * 2 + Math.random() * 0.4;
    const d = 90 + Math.random() * 110;
    return { x: Math.cos(a) * d, y: Math.sin(a) * d * 0.7, r: Math.random() * 540 - 270, s: 0.6 + Math.random() * 0.8, c: BURST_COLORS[k % BURST_COLORS.length], star: k % 2 === 0 };
  }), []);
  return (
    <span className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
      {bits.map((b, k) => (
        <motion.span key={k} className="absolute left-1/2 top-1/2" initial={{ x: 0, y: 0, scale: 0, rotate: 0, opacity: 1 }}
          animate={{ x: b.x, y: b.y, scale: [0, b.s * 1.3, b.s], rotate: b.r, opacity: [1, 1, 1, 0] }} transition={{ duration: 1.4, ease: "easeOut", delay: Math.random() * 0.08 }}>
          {b.star
            ? <svg width="36" height="36" viewBox="0 0 24 24" className="-translate-x-1/2 -translate-y-1/2"><path d="M12 1 L15 9 L23 9 L16.5 14 L19 22 L12 17 L5 22 L7.5 14 L1 9 L9 9 Z" fill={b.c} stroke="#241c3d" strokeWidth="1.5" strokeLinejoin="round" /></svg>
            : <span className="block w-3 h-3 rounded-full -translate-x-1/2 -translate-y-1/2 border-thin border-ink-night" style={{ background: b.c }} />}
        </motion.span>
      ))}
    </span>
  );
}
