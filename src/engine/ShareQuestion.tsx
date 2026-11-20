import { useEffect, useMemo, useState } from 'react';
import { pace, POP_IN } from './pace';
import { motion } from 'motion/react';
import { SpeakerHigh } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { playEffect, speakQuestion } from './feedback';
import { setAnswerer } from './answerer';
import { shuffleChoices } from './questions';
import { TeamBadge } from './TeamBadge';
import { GearButton, SettingsPanel } from '../settings/SettingsPanel';
import { CPU_ACCURACY, type CpuLevel, type TurnPlayer } from './turns';
import DialogFocus from '../ui/DialogFocus';
import { AnswerGrid, AnswerTile, answerFeedback, OkButton, QuestionPrompt, ResultLine, type TileState } from './QuestionParts';
import { mirrorSend } from '../live/mirror';


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
  // One answer sound for every game (2026-11-20); `sounds` is no longer used.
  void sounds;
  const answerSound = (right: boolean) => answerFeedback(right, settings);
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
  const [settingsOpen, setSettingsOpen] = useState(false);
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
    const a = window.setTimeout(() => { setCpu(right ? 'right' : 'miss'); setShown(true); answerSound(right); }, 1800 * pace(settings));
    const b = window.setTimeout(() => onResult(right), 3600 * pace(settings));
    return () => { window.clearTimeout(a); window.clearTimeout(b); };
  }, [q, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function choose(i: number) {
    if (picked !== null || cpu) return;
    const right = i === q.correctIndex;
    setPicked(i); setShown(true);
    answerSound(right);
    // A miss waits for a tap before the question closes (teacher, 2026-11-19).
    if (right) window.setTimeout(() => onResult(right), settings.motion === 'still' ? 900 : 1300);
  }

  if (!ready && turnCard) return <TurnCard player={player} avatar={avatar} answerer={answerer} onStart={() => setReady(true)} />;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface" role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.55, ease: 'easeOut' }}
        // The question big and centered, the four answers filling the rest of
        // the screen like big game buttons (2026-11-19).
        className="w-full h-full overflow-y-auto bg-surface px-[clamp(1rem,4vw,3.5rem)] py-[clamp(0.75rem,3vh,2rem)] flex flex-col justify-center gap-[clamp(0.5rem,2.5vh,1.75rem)]"
      >
        <div className="w-full max-w-[90rem] mx-auto flex items-center gap-3 flex-wrap">
          {/* The player's own animal or picture when the game has one (teacher, 2026-11-01). */}
          {avatar ? <img src={avatar} alt="" className="w-14 h-14 object-contain shrink-0 drop-shadow-[0_3px_0_rgba(0,0,0,0.2)]" /> : <TeamBadge colorIndex={player.colorIndex} size={48} />}
          <span className="grid">
            <span className="font-display text-fit-turn font-bold">{t('share.whoseTurn', { name: player.name })}</span>
            {answerer ? <span className="font-bold">{t('share.answerer', { name: answerer })}</span> : player.members && <span className="font-bold text-muted">{player.members.join(', ')}</span>}
          </span>
          <span className="flex-1" />
          {chance && chance.total === Infinity && <span className="font-bold">{t('share.chanceOpen', { n: chance.n })}</span>}
          {chance && chance.total > 1 && chance.total !== Infinity && (
            <span className="inline-flex items-center gap-1.5 font-bold" aria-label={t('share.chance', { n: chance.n, total: chance.total })}>
              {Array.from({ length: chance.total }, (_, k) => <span key={k} aria-hidden="true" className={`w-4 h-4 rounded-full border-std border-border ${k < chance.n - 1 ? 'bg-danger/70' : k === chance.n - 1 ? 'bg-accent' : 'bg-surface'}`} />)}
              <span className="ml-1">{t('share.chance', { n: chance.n, total: chance.total })}</span>
            </span>
          )}
          <button type="button" onClick={() => speakQuestion(q, settings)}
            className="min-h-11 px-3 rounded-pill border-std border-border bg-surface-2 font-bold inline-flex items-center gap-1.5">
            <SpeakerHigh weight="bold" size={20} />{t('q.listen')}
          </button>
          {/* Settings (with the Accessibility tab) stay in reach during a question (teacher, 2026-11-20). */}
          <GearButton small onClick={() => setSettingsOpen(true)} />
        </div>
        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />

        {player.kind === 'teacher' && <p className="font-bold text-xl">{t('share.teacherTurn')}</p>}

        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[min(16rem,22dvh)] w-auto mx-auto rounded-input border-std border-border-soft" />}
        {/* The same prompt, tiles, words and OK as every question screen (QuestionParts, 2026-11-20). */}
        <div className="w-full max-w-[90rem] mx-auto"><QuestionPrompt>{q.prompt}</QuestionPrompt></div>

        <div className="w-full max-w-[90rem] mx-auto"><AnswerGrid>
          {q.choices.map((c, i) => {
            const isRight = shown && i === q.correctIndex;
            const isWrong = picked === i && i !== q.correctIndex;
            const state: TileState = isRight ? 'right' : isWrong ? 'wrong' : shown ? 'faded' : 'open';
            return (
              <AnswerTile key={i} index={i} text={c} image={q.choiceImages?.[i]} imageAlt={q.choiceAlts?.[i] ?? undefined} state={state} disabled={picked !== null || !!cpu} magnet={!!magnet && i === q.correctIndex}
                onClick={() => choose(i)}
                extra={<>
                  {isRight && picked === i && settings.motion !== 'still' && <Burst />}
                  {magnet && i === q.correctIndex && (
                    <motion.img src={magnet} alt={t('cq.magnetHere')} className="absolute -top-7 -right-4 w-16 h-16 object-contain pointer-events-none drop-shadow-[0_3px_0_rgba(0,0,0,0.25)]"
                      initial={settings.motion === 'still' ? false : { x: 240, y: -260, rotate: -60, opacity: 0, scale: 0.6 }} animate={{ x: 0, y: 0, rotate: [-60, 12, -6, 0], opacity: 1, scale: 1 }}
                      transition={{ duration: 0.9, delay: 0.5, ease: 'easeOut' }} />
                  )}
                </>} />
            );
          })}
        </AnswerGrid></div>

        {cpu
          ? <ResultLine popKey={cpu} right={cpu === 'right'} text={cpu === 'thinking' ? t('share.cpuThinking') : cpu === 'right' ? t('share.cpuRight') : t('share.cpuMiss')} />
          : <ResultLine popKey={`${picked}-${chance?.n ?? 0}`} right={picked === q.correctIndex} text={picked === null ? '' : picked === q.correctIndex ? t('share.tapRight') : chance && chance.n < chance.total ? t('share.tryAnother') : t('share.tapMiss')} />}
        {!cpu && picked !== null && picked !== q.correctIndex && <OkButton onClick={() => onResult(false)} />}
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
  useEffect(() => {
    if (player.kind !== 'cpu') return;
    const id = window.setTimeout(onStart, (still ? 400 : 1200) * pace(settings));
    return () => window.clearTimeout(id);
  }, [player.id]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('share.turnCard', { name: player.name })}>
      <DialogFocus />
      <motion.button type="button" onClick={() => { playEffect('tap', settings); onStart(); }} disabled={player.kind === 'cpu'}
        initial={still ? false : { scale: 0.3, opacity: 0, rotate: -10 }} animate={{ scale: 1, opacity: 1, rotate: 0 }} transition={POP_IN}
        className="relative grid justify-items-center gap-4 p-6 rounded-full" aria-label={t('share.turnStart')}>
        {/* A glow that spins clockwise behind the icon, which bobs and
            gently grows and shrinks (teacher, 2026-11-06). */}
        {/* Always on, slow and soft, so it shows even with calm motion settings
            (teacher, 2026-11-06: "where is the glow animation"). */}
        <span aria-hidden="true" className="turn-rays absolute left-1/2 top-1/2 w-[min(30rem,70vh)] h-[min(30rem,70vh)] -ml-[min(15rem,35vh)] -mt-[min(15rem,35vh)] rounded-full pointer-events-none" />
        <span aria-hidden="true" className="turn-halo absolute left-1/2 top-1/2 w-[min(22rem,52vh)] h-[min(22rem,52vh)] -ml-[min(11rem,26vh)] -mt-[min(11rem,26vh)] rounded-full pointer-events-none" />
        <motion.span className="relative" animate={still ? undefined : { y: [0, -12, 0], rotate: [-3, 3, -3], scale: [1, 1.06, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 0 18px #fdfd94) drop-shadow(0 0 36px rgba(253,253,148,0.7))' }}>
          {avatar ? <img src={avatar} alt="" className="w-[min(18rem,42vh)] h-[min(18rem,42vh)] object-contain" /> : <TeamBadge colorIndex={player.colorIndex} size={220} />}
        </motion.span>
        {answerer && <span className="font-display text-2xl sm:text-3xl text-center rounded-pill border-bold border-border bg-mint-soft px-5 py-1">{t('share.answerer', { name: answerer })}</span>}
      </motion.button>
    </div>
  );
}

// Stars and sparks burst out of the right answer (engagement audit, 2026-11-08).
const BURST_COLORS = ['#f9cc14', '#ef7d96', '#5cc3a0', '#6aa9e9', '#fffdf6'];
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
