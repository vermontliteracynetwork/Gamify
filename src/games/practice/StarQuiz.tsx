import { useMemo, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { Question, Star, Trophy } from '@phosphor-icons/react';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import { playEffect } from '../../engine/feedback';
import ResultsModal from '../../engine/ResultsModal';
import { usePlayClock } from '../../engine/playClock';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { Slider } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import WayToPlay from '../WayToPlay';
import { useSignedIn } from '../../auth/session';
import { makeGameCode } from '../../data/gameCodes';
import type { PlayMode } from '../../data/types';
import { useNavigate } from 'react-router-dom';
import SetupWizard from '../SetupWizard';
import { starQuizManifest } from './manifest';
import { useSavedSetup } from '../useSavedSetup';
import { useGamePool } from '../../student/session';
import { pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import ThemeScreen from '../ThemeScreen';
import Title from '../../ui/Title';
import Sky from './Sky';
import { liveStarColor } from '../../live/LiveStudent';
import { getLive } from '../../live/session';



type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';

// The engine's test game (development plan Stage 2) and the first simple
// Quiz: every right answer adds a star. Uses only the shared engine.
export default function StarQuiz() {
  const { settings } = useSettings();
  const { theme, themes, playable, choose } = useGameTheme('star-quiz');
  const { teacher } = useSignedIn();
  const navigate = useNavigate();
  const [way, setWay] = useState<PlayMode>('solo');
  async function openLive() { navigate(`/teacher/live/${(await makeGameCode('star-quiz', setId, 'live')).code}`); }
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('star-quiz', { setId: LIBRARY[0].id, rounds: 10 });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const pool = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(pool);
  const { ask, cancel, element, missed, stats } = useAsk({ gameId: 'star-quiz', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId, framed: true });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [stars, setStars] = useState(0);
  const [round, setRound] = useState(0);
  const [total, setTotal] = useState(10);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [leftEarly, setLeftEarly] = useState(false);
  // In a class race, a student's own stars wear their color.
  const myColor = getLive() ? liveStarColor() : undefined;

  const timeUp = useRef(false);
  const clock = usePlayClock({ playing: phase === 'play', score: stars, onTimeUp: () => { timeUp.current = true; cancel(); } });
  async function play(v: { rounds: number }) {
    timeUp.current = false;
    setTotal(v.rounds); setStars(0); setRound(0); setLeftEarly(false); setPhase('play');
    for (let r = 0; r < v.rounds; r++) {
      setRound(r + 1);
      const done = await ask();
      if (timeUp.current) break;
      if (!done) { setLeftEarly(true); break; }
      setStars((s) => s + 1);
    }
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && settings.motion !== 'still') {
      void confetti({ particleCount: settings.celebrations === 'big' ? 140 : 50, spread: 80, origin: { y: 0.6 }, disableForReducedMotion: true });
    }
    setPhase('end');
  }

  return (
    <ThemedPage theme={theme} menu={phase !== 'play' && phase !== 'end'}>
    <main className={`${phase === 'play' || phase === 'end' ? 'max-w-none' : 'max-w-3xl'} mx-auto px-4 sm:px-6 pt-6 pb-6`}>
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {clock.element}
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="star-quiz" />

      {phase === 'welcome' && (
        <GameWelcome game={starQuizManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <Question weight="bold" size={22} />, text: t('practice.how1') },
          { icon: <Star weight="fill" size={22} />, text: t('practice.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('practice.how3') },
        ]} />
      )}

      {phase === 'theme' && (
        <ThemeScreen gameName={starQuizManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />
      )}

      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={way === 'live' ? () => void openLive() : () => void play({ rounds: setup.rounds })} playLabel={way === 'live' ? t('way.openLobby') : undefined} pages={[
          // Pick the way to play first (teacher, 2026-10-31): Live opens a class lobby.
          ...(!teacher ? [] : [{ id: 'way', title: t('way.title'), content: <WayToPlay modes={['live', 'solo']} value={way} onChange={setWay} /> }]),
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <Slider label={t('practice.rounds')} hint={t('practice.roundsHint')} min={starQuizManifest.rounds!.min} max={starQuizManifest.rounds!.max} value={setup.rounds} onChange={(v) => change({ rounds: v })} />
          ) },
        ]} />
      )}

      {(phase === 'play' || phase === 'end') && (
        <section className="grid gap-2">
          <h1 className="sr-only"><Title text={t('practice.title')} /></h1>
          <Sky theme={theme} filled={stars} total={total} still={settings.motion === 'still'} label={t('practice.stars', { count: stars })} colors={myColor ? Array.from({ length: total }, () => myColor) : undefined} />
          <p className="sr-only" aria-live="polite">{phase === 'play' ? t('practice.progress', { round, total }) : ''}</p>
        </section>
      )}

      {phase === 'end' && (
        <ResultsModal title={t('practice.done', { count: stars })} missed={missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')}>
          {leftEarly && <p className="font-bold">{t('practice.leftEarly')}</p>}
          <p className="font-bold">{t('practice.score', { right: stats.right, asked: stats.asked })}</p>
        </ResultsModal>
      )}
      {element}
    </main>
    </ThemedPage>
  );
}
