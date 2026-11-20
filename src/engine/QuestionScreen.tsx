import { useEffect, useMemo, useRef, useState } from 'react';
import { POP_IN } from './pace';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { Calculator, Check, GridNine, HighlighterCircle, PencilSimpleLine, SpeakerHigh, SpeakerSlash, Toolbox, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { buzz, speakQuestion, stopSpeaking } from './feedback';
import { ANSWER_SOUNDS, playClip } from './music';
import { shuffleChoices } from './questions';
import { CalculatorTool, Scratchpad, TimesTable } from './tools';
import { FullScreenButton, GearButton, SettingsPanel } from '../settings/SettingsPanel';
import FloatingCard from '../ui/FloatingCard';
import DialogFocus from '../ui/DialogFocus';

const LETTERS = ['A', 'B', 'C', 'D'];
// Answer tiles get a shape as well as a color, so color is never the only cue.
const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

export interface AnswerResult { tapped: string; tries: string[]; right: boolean; ms: number }

// The one question screen every game uses (question engine section 3):
// read first, shuffled answers, one try, a short right moment, and after a
// miss a new question arrives without showing the answer.
// `framed` (Question Tracker, teacher 2026-10-31): a smaller card set into
// the game's scene, with no dark cover, so the background is the frame.
export default function QuestionScreen({ question, progress, player, onAnswer, onClose, framed = false }: {
  question: MultipleChoiceQuestion;
  framed?: boolean;
  progress?: { n: number; total: number };
  player?: string;
  onAnswer: (r: AnswerResult) => void;
  onClose: () => void;
}) {
  const { settings } = useSettings();
  const reduce = useReducedMotion() || settings.motion === 'still';
  const q = useMemo(() => (settings.shuffleAnswers ? shuffleChoices(question) : question), [question, settings.shuffleAnswers]);
  const shownAt = useRef(Date.now());
  const [locked, setLocked] = useState(settings.readFirstSeconds > 0);
  const [picked, setPicked] = useState<number | null>(null);
  const [wrongTries, setWrongTries] = useState<number[]>([]);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [missed, setMissed] = useState<AnswerResult | null>(null);
  // Tools open as movable cards (several at once); the highlighter is a mode.
  type CardTool = 'calculator' | 'scratchpad' | 'timesTable';
  const [menuOpen, setMenuOpen] = useState(false);
  const [cards, setCards] = useState<CardTool[]>([]);
  const [highlighting, setHighlighting] = useState(false);
  const toolList = (['calculator', 'scratchpad', 'highlighter', 'timesTable'] as const).filter((x) => settings.tools[x]);
  const toggleCard = (c: CardTool) => setCards((cs) => (cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]));
  const [marked, setMarked] = useState<Set<number>>(new Set());
  const [speaking, setSpeaking] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    shownAt.current = Date.now();
    setPicked(null);
    setWrongTries([]);
    setMarked(new Set());
    setMissed(null);
    setLocked(settings.readFirstSeconds > 0);
    const timer = window.setTimeout(() => setLocked(false), settings.readFirstSeconds * 1000);
    // Little readers hear every question and its answers on their own.
    const say = settings.autoRead ? window.setTimeout(() => speakQuestion(q, settings), 350) : 0;
    return () => { window.clearTimeout(timer); window.clearTimeout(say); stopSpeaking(); };
  }, [q, settings.readFirstSeconds]); // eslint-disable-line react-hooks/exhaustive-deps

  function listen() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = `${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`;
    speakQuestion(q, settings);
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), Math.min(15000, text.length * 90));
  }

  function choose(i: number) {
    if (locked || picked !== null || wrongTries.includes(i)) return;
    const right = i === q.correctIndex;
    playClip(right ? ANSWER_SOUNDS.right : ANSWER_SOUNDS.wrong, settings);
    buzz(right ? 30 : [20, 60, 20], settings);
    const tries = [...wrongTries.map((k) => q.choices[k]), q.choices[i]];
    // Extra tries (a teacher accommodation): a miss with tries left greys
    // out that answer and lets the student pick again.
    if (!right && wrongTries.length + 1 < settings.triesPerQuestion) {
      setWrongTries((w) => [...w, i]);
      return;
    }
    setPicked(i);
    const ms = Date.now() - shownAt.current;
    // A miss waits for a tap before the question closes (teacher, 2026-11-19).
    if (right) window.setTimeout(() => onAnswer({ tapped: q.choices[i], tries, right, ms }), 900);
    else setMissed({ tapped: q.choices[i], tries, right, ms });
  }

  const words = q.prompt.split(/(\s+)/);
  // Short words read big; long ones get the regular screen-fit size.
  const bigPrompt = q.prompt.length <= 48 && !q.imageUrl;
  const bigAnswers = q.choices.every((c) => c.length <= 22);

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${framed ? 'p-4' : 'bg-surface'}`} role="dialog" aria-modal="true" aria-label={q.prompt}>
      <DialogFocus />
      <motion.div
        key={q.id}
        initial={reduce ? false : { scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={POP_IN}
        // Full screen (2026-11-19): the question big and centered, the four
        // answers filling the rest of the screen like big game buttons.
        className={`w-full max-h-full overflow-y-auto bg-surface border-border rounded-panel ${framed ? 'grid max-w-[min(60rem,94vw)] border-heavy p-[clamp(1rem,3vh,2rem)] gap-[clamp(0.6rem,2vh,1.25rem)]' : 'h-full !rounded-none flex flex-col justify-center px-[clamp(1rem,4vw,3.5rem)] py-[clamp(0.75rem,3vh,2rem)] gap-[clamp(0.5rem,2.5vh,1.75rem)]'}`}
        style={{ boxShadow: framed ? '0 0 0 6px rgba(255,255,255,0.18), 0 10px 30px rgba(0,0,0,0.35)' : 'none' }}
      >
        <div className={`flex items-center gap-2 flex-wrap ${framed ? '' : 'w-full max-w-[90rem] mx-auto'}`}>
          {progress && progress.total > 1 && (
            <span className="px-3 min-h-9 inline-flex items-center rounded-pill bg-surface-2 border-std border-border font-bold text-sm">
              {t('q.progress', progress)}
            </span>
          )}
          {player && <span className={`font-display font-bold ${framed ? 'text-lg' : 'text-fit-turn'}`}>{t('q.turn', { name: player })}</span>}
          <span className="flex-1" />
          {settings.tools.listen && <button type="button" onClick={listen} className="min-h-11 px-3 rounded-pill border-std border-border bg-surface-2 font-bold inline-flex items-center gap-1.5">
            {speaking ? <SpeakerSlash weight="bold" size={20} /> : <SpeakerHigh weight="bold" size={20} />}
            {speaking ? t('q.stop') : t('q.listen')}
          </button>}
          {toolList.length > 0 && <button type="button" onClick={() => setMenuOpen((m) => !m)} aria-label={t('q.tools')} aria-expanded={menuOpen}
            className="w-11 h-11 rounded-full border-std border-border bg-surface-2 flex items-center justify-center">
            <Toolbox weight="bold" size={20} />
          </button>}
          {/* Full screen stays in reach while a question is up (teacher, 2026-10-31). */}
          <FullScreenButton small />
          <GearButton small onClick={() => setSettingsOpen(true)} />
          <button type="button" onClick={() => setConfirmLeave(true)} aria-label={t('q.close')}
            className="w-11 h-11 rounded-full border-std border-border bg-surface-2 flex items-center justify-center">
            <X weight="bold" size={20} />
          </button>
        </div>

        {confirmLeave && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-input bg-surface-2 border-std border-border">
            <span className="font-bold flex-1">{t('q.leaveAsk')}</span>
            <button type="button" className="min-h-11 px-4 rounded-pill border-std border-border bg-surface font-bold" onClick={onClose}>{t('q.leaveYes')}</button>
            <button type="button" className="min-h-11 px-4 rounded-pill border-std border-border bg-accent font-bold" onClick={() => setConfirmLeave(false)}>{t('q.leaveNo')}</button>
          </div>
        )}

        {menuOpen && (
          <div role="group" aria-label={t('q.tools')} className="flex flex-wrap gap-2">
            {([['calculator', Calculator], ['scratchpad', PencilSimpleLine], ['timesTable', GridNine], ['highlighter', HighlighterCircle]] as const)
              .filter(([id]) => settings.tools[id]).map(([id, Icon]) => {
                const on = id === 'highlighter' ? highlighting : cards.includes(id);
                return (
                  <button key={id} type="button" aria-pressed={on}
                    onClick={() => (id === 'highlighter' ? setHighlighting((h) => !h) : toggleCard(id))}
                    className={`min-h-11 px-3 rounded-pill border-std font-bold inline-flex items-center gap-1.5 ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                    <Icon weight="bold" size={18} />{t(`q.${id}`)}
                  </button>
                );
              })}
          </div>
        )}
        {cards.map((c, i) => (
          <FloatingCard key={c} title={t(`q.${c}`)} closeLabel={t('q.closeTool', { tool: t(`q.${c}`) })} onClose={() => toggleCard(c)}
            start={{ x: Math.max(8, window.innerWidth - 380 - i * 28), y: 90 + i * 40 }}>
            {c === 'calculator' && <CalculatorTool />}
            {c === 'scratchpad' && <div className="w-[min(520px,85vw)]"><Scratchpad /></div>}
            {c === 'timesTable' && <TimesTable />}
          </FloatingCard>
        ))}

        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-[min(14rem,22dvh)] w-auto mx-auto rounded-input border-std border-border-soft" />}
        <h2 className={`font-body font-bold leading-snug text-balance ${framed ? `text-left ${bigPrompt ? 'text-fit-question-big leading-tight' : 'text-fit-question'}` : `w-full max-w-[90rem] mx-auto text-left ${bigPrompt ? 'text-fit-question-big leading-tight' : 'text-fit-question'}`}`}>
          {highlighting
            ? words.map((w, i) => /\s+/.test(w) ? w : (
                <button key={i} type="button" onClick={() => setMarked((m) => { const n = new Set(m); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  className={`rounded px-0.5 ${marked.has(i) ? 'bg-accent' : ''}`}>{w}</button>
              ))
            : words.map((w, i) => <span key={i} className={marked.has(i) ? 'bg-accent rounded px-0.5' : ''}>{w}</span>)}
        </h2>

        {/* No "Read the question" bar (teacher, 2026-11-19): the answers just open after the wait. */}
        {locked && <span className="sr-only" aria-live="polite">{t('q.readFirst')}</span>}

        <div className={framed ? 'grid grid-cols-1 sm:grid-cols-2 gap-3' : 'w-full max-w-[90rem] mx-auto flex-1 min-h-0 max-h-[min(42vh,26rem)] portrait:max-h-[50vh] grid grid-cols-1 sm:grid-cols-2 auto-rows-fr gap-[clamp(0.5rem,2vh,1.25rem)]'}>
          {q.choices.map((c, i) => {
            const triedWrong = wrongTries.includes(i);
            const isPicked = picked === i;
            const right = isPicked && i === q.correctIndex;
            const wrong = isPicked && i !== q.correctIndex;
            return (
              <motion.button
                key={`${q.id}-${i}`}
                type="button"
                onClick={() => choose(i)}
                aria-disabled={locked || picked !== null || triedWrong}
                animate={reduce ? undefined : wrong ? { x: [0, -6, 6, -4, 4, 0] } : right ? { scale: [1, 1.05, 1] } : undefined}
                transition={{ duration: 0.4 }}
                className={`relative ${framed ? `min-h-[clamp(3.5rem,12vh,7rem)] pl-[clamp(4rem,10.5vh,6.75rem)] pr-4 py-2 leading-tight ${bigAnswers ? 'text-fit-answer-big justify-center text-center' : 'text-fit-answer text-left'}` : `min-h-[clamp(3rem,9vh,6.5rem)] h-full pl-[clamp(4rem,10.5vh,6.75rem)] pr-[clamp(1rem,3vw,3rem)] py-[clamp(0.4rem,1.6vh,1rem)] leading-tight ${bigAnswers ? 'text-fit-answer-big justify-center text-center' : 'text-fit-answer text-left'}`} rounded-input border-bold border-border font-bold flex items-center gap-3
                            ${TILE_COLORS[i]} ${locked ? 'opacity-50 saturate-50 pointer-events-none' : 'opacity-100'} motion-safe:transition-[opacity,transform] motion-safe:duration-300 ${picked !== null && !isPicked ? 'opacity-45' : ''}
                            ${right ? 'ring-4 ring-success' : ''} ${wrong ? 'ring-4 ring-danger' : ''} ${triedWrong ? 'opacity-35 line-through' : ''}`}
                style={{ boxShadow: 'var(--shadow-sticker)' }}
              >
                <span className={`shrink-0 rounded-full bg-surface border-std border-border flex items-center justify-center font-display ${framed ? 'absolute left-[clamp(0.9rem,2vw,1.75rem)] top-1/2 -translate-y-1/2 w-[clamp(2.5rem,7vh,4rem)] h-[clamp(2.5rem,7vh,4rem)] text-[clamp(1.1rem,3.4vh,1.9rem)]' : 'absolute left-[clamp(0.9rem,2vw,1.75rem)] top-1/2 -translate-y-1/2 w-[clamp(2.5rem,7vh,4rem)] h-[clamp(2.5rem,7vh,4rem)] text-[clamp(1.1rem,3.4vh,1.9rem)]'}`}>
                  {right ? <Check weight="bold" size={22} aria-label={t('q.rightMark')} /> : wrong || triedWrong ? <X weight="bold" size={22} aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
                {q.choiceImages?.[i] && <img src={q.choiceImages[i]!} alt={q.choiceAlts?.[i] ?? ''} className="w-12 h-12 shrink-0 object-cover rounded-input border-std border-border bg-surface" />}
                <span className="sr-only"> </span>
                <span className="min-w-0 break-words">{c}</span>
              </motion.button>
            );
          })}
        </div>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <p className="min-h-7 font-display text-xl font-bold text-center" role="status" aria-live="polite">
          {picked === null
            ? wrongTries.length ? `${t('q.tryAgain')} ${t('q.triesLeft', { count: settings.triesPerQuestion - wrongTries.length })}` : ''
            : picked === q.correctIndex ? t('q.right') : t('q.miss')}
        </p>
        {missed && (
          <button type="button" autoFocus onClick={() => { const m = missed; setMissed(null); onAnswer(m); }}
            className="justify-self-center self-center min-h-14 px-12 rounded-pill border-bold border-border bg-accent font-display text-2xl font-bold motion-safe:hover:scale-105 motion-safe:transition-transform"
            style={{ boxShadow: '0 4px 0 #000' }}>{t('q.continue')}</button>
        )}
      </motion.div>
    </div>
  );
}
