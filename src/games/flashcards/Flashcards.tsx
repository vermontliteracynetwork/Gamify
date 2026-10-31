import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { ArrowCounterClockwise, CheckCircle, HandTap, SpeakerHigh, Stack } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { playEffect, speak } from '../../engine/feedback';
import { isPlayable } from '../../engine/questions';
import ResultsModal from '../../engine/ResultsModal';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import { Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { flashcardsManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';


type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
interface Card { q: MultipleChoiceQuestion; setId: string }

// Flashcards (launch roster): a calm study mode. Flip the card to see the
// answer, then tap I knew it or Practice again; missed cards go back into
// the pile until every card is known.
export default function Flashcards() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('flashcards');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('flashcards', { setId: LIBRARY[0].id, cards: 10 });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pile, setPile] = useState<Card[]>([]);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(0);
  const [total, setTotal] = useState(0);
  const [again, setAgain] = useState<MultipleChoiceQuestion[]>([]);
  const card = pile[0];

  function begin() {
    const all = game.pool.flatMap((p) => p.set.questions.filter(isPlayable).map((q) => ({ q, setId: p.set.id })));
    for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
    const deck = all.slice(0, setup.cards);
    setPile(deck); setTotal(deck.length); setKnown(0); setAgain([]); setFlipped(false); setPhase('play');
  }
  function log(c: Card, right: boolean) {
    void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), classroomId: game.classroomId, studentId: game.studentId, gameId: 'flashcards', mode: 'solo', setId: c.setId, prompt: c.q.prompt, answer: c.q.choices[c.q.correctIndex], tries: right ? [c.q.choices[c.q.correctIndex]] : [], ms: 0, outcome: right ? 'right' : 'skipped' });
  }
  function rate(knewIt: boolean) {
    if (!card) return;
    log(card, knewIt);
    setFlipped(false);
    if (knewIt) {
      playEffect('right', settings);
      const rest = pile.slice(1);
      setKnown((k) => k + 1);
      setPile(rest);
      if (rest.length === 0) {
        setPhase('end');
        playEffect('win', settings);
        if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 60, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
      }
    } else {
      playEffect('tap', settings);
      setAgain((a) => (a.some((x) => x.id === card.q.id) ? a : [...a, card.q]));
      // Back into the pile a few cards later.
      const rest = pile.slice(1);
      const at = Math.min(rest.length, 3);
      setPile([...rest.slice(0, at), card, ...rest.slice(at)]);
    }
  }
  const answer = card ? card.q.choices[card.q.correctIndex] : '';

  return (
    <ThemedPage theme={theme}>
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-6 pb-6">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="flashcards" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={flashcardsManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <HandTap weight="fill" size={22} />, text: t('fc.how1') },
          { icon: <CheckCircle weight="fill" size={22} />, text: t('fc.how2') },
          { icon: <Stack weight="fill" size={22} />, text: t('fc.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={flashcardsManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: <Slider label={t('fc.cards')} min={5} max={30} value={setup.cards} onChange={(v) => change({ cards: v })} /> },
        ]} />
      )}
      {phase === 'play' && card && (
        <section className="grid gap-4 justify-items-center">
          <div className="w-full flex items-center gap-2">
            <div className="flex-1 h-4 rounded-pill border-[2.5px] border-border bg-surface overflow-hidden" role="progressbar" aria-label={t('fc.progress', { known, total })} aria-valuenow={known} aria-valuemin={0} aria-valuemax={total}>
              <motion.span className="block h-full" style={{ background: '#9fe7a0' }} animate={{ width: `${(known / total) * 100}%` }} />
            </div>
            <span className="font-display text-xl stage-text tabular-nums">{known}/{total}</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.button key={`${card.q.id}-${flipped}`} type="button" onClick={() => { setFlipped(!flipped); playEffect('whoosh', settings); }}
              initial={still ? false : { rotateY: 90, opacity: 0.4 }} animate={{ rotateY: 0, opacity: 1 }} exit={still ? undefined : { rotateY: -90, opacity: 0.4 }} transition={{ duration: 0.22 }}
              aria-label={flipped ? t('fc.answerIs', { answer }) : t('fc.questionIs', { q: card.q.prompt })}
              className="w-full rounded-panel border-[3px] border-border p-6 grid gap-3 content-center justify-items-center text-center"
              style={{ minHeight: 'min(48dvh, 420px)', boxShadow: 'var(--shadow-sticker-lg)', ...pieceFill(theme, flipped ? 'card-back' : 'card-front', flipped ? '#fdfd94' : '#fbfcf8') }}>
              <span className="text-xs font-bold uppercase tracking-wider text-muted">{flipped ? t('mm.answer') : t('mm.question')}</span>
              {!flipped && card.q.imageUrl && <img src={card.q.imageUrl} alt={card.q.imageAlt ?? ''} className="max-h-40 object-contain" />}
              {flipped && <span className="font-semibold text-balance max-w-xl">{card.q.prompt}</span>}
              <span className={`font-bold text-balance ${flipped ? 'text-4xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>{flipped ? answer : card.q.prompt}</span>
              {!flipped && <span className="text-sm font-bold text-muted">{t('fc.tapToFlip')}</span>}
            </motion.button>
          </AnimatePresence>
          <div className="flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => speak(flipped ? answer : card.q.prompt, settings)} className="min-h-14 px-5 rounded-pill border-[2.5px] border-border bg-surface font-bold inline-flex items-center gap-2"><SpeakerHigh weight="bold" size={22} />{t('fc.listen')}</button>
            {flipped && (
              <>
                <button type="button" onClick={() => rate(false)} className="min-h-14 px-6 rounded-pill border-[2.5px] border-border bg-secondary font-display text-xl inline-flex items-center gap-2"><ArrowCounterClockwise weight="bold" size={22} />{t('fc.again')}</button>
                <button type="button" onClick={() => rate(true)} className="min-h-14 px-6 rounded-pill border-[2.5px] border-border bg-[#9fe7a0] font-display text-xl inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}><CheckCircle weight="fill" size={22} />{t('fc.knew')}</button>
              </>
            )}
          </div>
        </section>
      )}
      {phase === 'end' && (
        <ResultsModal title={t('fc.done', { count: total })} missed={again} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          <p className="font-bold">{again.length ? t('fc.practiced', { count: again.length }) : t('fc.allFirst')}</p>
        </ResultsModal>
      )}
    </main>
    </ThemedPage>
  );
}
