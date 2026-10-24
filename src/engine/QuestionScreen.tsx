import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'motion/react';
import { Calculator, Check, GridNine, HighlighterCircle, PencilSimpleLine, SpeakerHigh, SpeakerSlash, Toolbox, X } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../data/types';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { buzz, playEffect, speak, stopSpeaking } from './feedback';
import { shuffleChoices } from './questions';
import { CalculatorTool, Scratchpad, TimesTable } from './tools';
import { GearButton, SettingsPanel } from '../settings/SettingsPanel';
import FloatingCard from '../ui/FloatingCard';

const LETTERS = ['A', 'B', 'C', 'D'];
// Answer tiles get a shape as well as a color, so color is never the only cue.
const TILE_COLORS = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];

export interface AnswerResult { tapped: string; tries: string[]; right: boolean; ms: number }

// The one question screen every game uses (question engine section 3):
// read first, shuffled answers, one try, a short right moment, and after a
// miss a new question arrives without showing the answer.
export default function QuestionScreen({ question, progress, player, onAnswer, onClose }: {
  question: MultipleChoiceQuestion;
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
    setLocked(settings.readFirstSeconds > 0);
    const timer = window.setTimeout(() => setLocked(false), settings.readFirstSeconds * 1000);
    return () => { window.clearTimeout(timer); stopSpeaking(); };
  }, [q, settings.readFirstSeconds]);

  function listen() {
    if (speaking) { stopSpeaking(); setSpeaking(false); return; }
    const text = `${q.prompt}. ${q.choices.map((c, i) => `${LETTERS[i]}: ${c}`).join('. ')}`;
    speak(text, settings);
    setSpeaking(true);
    window.setTimeout(() => setSpeaking(false), Math.min(15000, text.length * 90));
  }

  function choose(i: number) {
    if (locked || picked !== null || wrongTries.includes(i)) return;
    const right = i === q.correctIndex;
    playEffect(right ? 'right' : 'miss', settings);
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
    window.setTimeout(() => onAnswer({ tapped: q.choices[i], tries, right, ms }), right ? 900 : 1400);
  }

  const words = q.prompt.split(/(\s+)/);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={q.prompt}>
      <motion.div
        key={q.id}
        initial={reduce ? false : { scale: 0.92, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 380, damping: 28 }}
        className="w-full max-w-2xl max-h-full overflow-y-auto bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-4"
        style={{ boxShadow: 'var(--shadow-sticker-lg)' }}
      >
        <div className="flex items-center gap-2 flex-wrap">
          {progress && progress.total > 1 && (
            <span className="px-3 min-h-9 inline-flex items-center rounded-pill bg-surface-2 border-[2px] border-border font-bold text-sm">
              {t('q.progress', progress)}
            </span>
          )}
          {player && <span className="font-display font-bold text-lg">{t('q.turn', { name: player })}</span>}
          <span className="flex-1" />
          {settings.tools.listen && <button type="button" onClick={listen} className="min-h-11 px-3 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-1.5">
            {speaking ? <SpeakerSlash weight="bold" size={20} /> : <SpeakerHigh weight="bold" size={20} />}
            {speaking ? t('q.stop') : t('q.listen')}
          </button>}
          {toolList.length > 0 && <button type="button" onClick={() => setMenuOpen((m) => !m)} aria-label={t('q.tools')} aria-expanded={menuOpen}
            className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center">
            <Toolbox weight="bold" size={20} />
          </button>}
          <GearButton small onClick={() => setSettingsOpen(true)} />
          <button type="button" onClick={() => setConfirmLeave(true)} aria-label={t('q.close')}
            className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center">
            <X weight="bold" size={20} />
          </button>
        </div>

        {confirmLeave && (
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-input bg-surface-2 border-[2px] border-border">
            <span className="font-bold flex-1">{t('q.leaveAsk')}</span>
            <button type="button" className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface font-bold" onClick={onClose}>{t('q.leaveYes')}</button>
            <button type="button" className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-accent font-bold" onClick={() => setConfirmLeave(false)}>{t('q.leaveNo')}</button>
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
                    className={`min-h-11 px-3 rounded-pill border-[2px] font-bold inline-flex items-center gap-1.5 ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
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

        <h2 className="font-display text-2xl sm:text-3xl font-bold leading-snug text-balance">
          {highlighting
            ? words.map((w, i) => /\s+/.test(w) ? w : (
                <button key={i} type="button" onClick={() => setMarked((m) => { const n = new Set(m); if (n.has(i)) n.delete(i); else n.add(i); return n; })}
                  className={`rounded px-0.5 ${marked.has(i) ? 'bg-accent' : ''}`}>{w}</button>
              ))
            : words.map((w, i) => <span key={i} className={marked.has(i) ? 'bg-accent rounded px-0.5' : ''}>{w}</span>)}
        </h2>
        {q.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="max-h-56 w-auto mx-auto rounded-input border-[2px] border-border-soft" />}

        {locked && (
          <div className="grid gap-1" aria-live="polite">
            <span className="font-bold text-sm">{t('q.readFirst')}</span>
            <div className="h-2.5 rounded-pill bg-surface-2 overflow-hidden border border-border-soft">
              <motion.div className="h-full bg-accent" initial={{ width: '100%' }} animate={{ width: '0%' }}
                transition={{ duration: settings.readFirstSeconds, ease: 'linear' }} />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                className={`relative min-h-20 px-4 py-3 rounded-input border-[2.5px] border-border text-left font-bold text-lg flex items-center gap-3
                            ${TILE_COLORS[i]} ${locked ? 'opacity-55' : ''} ${picked !== null && !isPicked ? 'opacity-45' : ''}
                            ${right ? 'ring-4 ring-success' : ''} ${wrong ? 'ring-4 ring-danger' : ''} ${triedWrong ? 'opacity-35 line-through' : ''}`}
                style={{ boxShadow: 'var(--shadow-sticker)' }}
              >
                <span className="w-10 h-10 shrink-0 rounded-full bg-surface border-[2px] border-border flex items-center justify-center font-display text-xl">
                  {right ? <Check weight="bold" size={22} aria-label={t('q.rightMark')} /> : wrong || triedWrong ? <X weight="bold" size={22} aria-label={t('q.notThisMark')} /> : LETTERS[i]}
                </span>
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
      </motion.div>
    </div>
  );
}
