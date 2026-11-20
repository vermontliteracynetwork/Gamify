import { useEffect, useMemo, useRef, useState } from 'react';
import { POP_IN } from './pace';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { Calculator, GridNine, HighlighterCircle, PencilSimpleLine, SpeakerHigh, SpeakerSlash, Toolbox, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { speakQuestion, stopSpeaking } from './feedback';
import { AnswerGrid, AnswerTile, answerFeedback, LETTERS, OkButton, QuestionPrompt, ResultLine, type TileState } from './QuestionParts';
import { shuffleChoices } from './questions';
import { CalculatorTool, Scratchpad, TimesTable } from './tools';
import { FullScreenButton, GearButton, SettingsPanel } from '../settings/SettingsPanel';
import FloatingCard from '../ui/FloatingCard';
import DialogFocus from '../ui/DialogFocus';



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
    answerFeedback(right, settings);
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
        <div className={framed ? '' : 'w-full max-w-[90rem] mx-auto'}><QuestionPrompt>
          {highlighting
            ? words.map((w, i) => /\s+/.test(w) ? w : (
                <button key={i} type="button" onClick={() => setMarked((m) => { const n = new Set(m); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  className={`rounded px-0.5 ${marked.has(i) ? 'bg-accent' : ''}`}>{w}</button>
              ))
            : words.map((w, i) => <span key={i} className={marked.has(i) ? 'bg-accent rounded px-0.5' : ''}>{w}</span>)}
        </QuestionPrompt></div>

        {/* No "Read the question" bar (teacher, 2026-11-19): the answers just open after the wait. */}
        {locked && <span className="sr-only" aria-live="polite">{t('q.readFirst')}</span>}

        {/* The same tiles in every game (QuestionParts, teacher 2026-11-20). */}
        <div className={framed ? '' : 'w-full max-w-[90rem] mx-auto'}><AnswerGrid>
          {q.choices.map((c, i) => {
            const isPicked = picked === i;
            const state: TileState = isPicked ? (i === q.correctIndex ? 'right' : 'wrong') : wrongTries.includes(i) ? 'tried' : picked !== null ? 'faded' : 'open';
            return <AnswerTile key={`${q.id}-${i}`} index={i} text={c} image={q.choiceImages?.[i]} imageAlt={q.choiceAlts?.[i] ?? undefined} state={state} disabled={locked || picked !== null} onClick={() => choose(i)} />;
          })}
        </AnswerGrid></div>

        <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
        <ResultLine popKey={`${picked}-${wrongTries.length}`} right={picked === q.correctIndex}
          text={picked === null
            ? wrongTries.length ? `${t('q.tryAgain')} ${t('q.triesLeft', { count: settings.triesPerQuestion - wrongTries.length })}` : ''
            : picked === q.correctIndex ? t('q.right') : t('q.miss')} />
        {missed && <OkButton onClick={() => { const m = missed; setMissed(null); onAnswer(m); }} />}
      </motion.div>
    </div>
  );
}
