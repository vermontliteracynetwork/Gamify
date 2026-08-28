import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { playSound } from './sound';
import {
  TEAM_COLORS, AVATARS, generateBuckets, shuffle, POWER_UPS, SAMPLE_QUESTIONS,
} from './data';
import { loadCustomQuestionSets } from '../../lib/questionSets';
import { StepHeader } from './components/ui';
import SetupScreen from './screens/SetupScreen';
import AvatarPickerScreen from './screens/AvatarPickerScreen';
import ImportQuestionsScreen from './screens/ImportQuestionsScreen';
import OptionsScreen from './screens/OptionsScreen';
import QuestionOptionsScreen from './screens/QuestionOptionsScreen';
import PlayScreen from './screens/PlayScreen';
import WinnerScreen from './screens/WinnerScreen';

const DEFAULT_OPTIONS = {
  questionsEnabled: true,
  questionsPerTurn: 1,
  manualDeck: true,
  timerEnabled: false,
  timerSeconds: 20,
  randomOrder: true,
  powerUpsEnabled: true,
  spikesEnabled: true,
  musicEnabled: false,
  soundsLevel: 'med', // off | low | med | high
};

const SETUP_STEPS = ['Setup', 'Options', 'Play'];

function makeDefaultTeams(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `team-${i}`,
    name: `Team ${i + 1}`,
    color: TEAM_COLORS[i % TEAM_COLORS.length].hex,
    avatarId: AVATARS[i % AVATARS.length].id,
  }));
}

export default function PlinkOhGame() {
  const [stage, setStage] = useState('setup'); // setup | avatar-picker | import-questions | options | question-options | playing | winner
  const [teamCount, setTeamCount] = useState(3);
  const [roundCount, setRoundCount] = useState(5);
  const [teams, setTeams] = useState(makeDefaultTeams(3));
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const [avatarPickerIndex, setAvatarPickerIndex] = useState(0);
  const [customSets, setCustomSets] = useState(() => loadCustomQuestionSets());
  const [selectedSetId, setSelectedSetId] = useState('demo'); // 'demo' | a custom set's id

  const [game, setGame] = useState(null);
  /* game = {
    roundIndex, activeTeamIndex, questionsAnsweredThisTurn,
    deck, deckPointer, buckets, scores, powerUps, history,
    phase, currentQuestion, activePowerUp, timeLeft,
  } */

  function syncTeamCount(n) {
    setTeamCount(n);
    setTeams((prev) => {
      if (n > prev.length) {
        const extra = makeDefaultTeams(n).slice(prev.length);
        return [...prev, ...extra];
      }
      return prev.slice(0, n);
    });
  }

  function activeQuestionBank() {
    if (selectedSetId === 'demo') return SAMPLE_QUESTIONS;
    return customSets.find((s) => s.id === selectedSetId)?.questions || SAMPLE_QUESTIONS;
  }

  function buildDeck() {
    const bank = activeQuestionBank();
    return options.randomOrder ? shuffle(bank) : bank;
  }

  function newRoundBuckets() {
    const count = 4 + Math.floor(Math.random() * 4); // 4-7 buckets
    return generateBuckets({ count, powerUpsEnabled: options.powerUpsEnabled });
  }

  function startGame() {
    const scores = {}; const powerUps = {};
    teams.forEach((t) => { scores[t.id] = 0; powerUps[t.id] = []; });
    setGame({
      roundIndex: 1,
      activeTeamIndex: 0,
      questionsAnsweredThisTurn: 0,
      deck: buildDeck(),
      deckPointer: 0,
      buckets: newRoundBuckets(),
      scores,
      powerUps,
      history: [],
      phase: options.questionsEnabled ? 'reveal' : 'drop',
      currentQuestion: null,
      activePowerUp: null,
      timeLeft: options.timerSeconds,
    });
    setStage('playing');
  }

  function activeTeam(g) { return teams[g.activeTeamIndex]; }

  function nextQuestion(g) {
    let pointer = g.deckPointer;
    let deck = g.deck;
    if (pointer >= deck.length) {
      const bank = activeQuestionBank();
      deck = options.randomOrder ? shuffle(bank) : bank;
      pointer = 0;
    }
    const q = deck[pointer];
    return { deck, deckPointer: pointer + 1, question: q };
  }

  function revealQuestion() {
    setGame((g) => {
      const { deck, deckPointer, question } = nextQuestion(g);
      return { ...g, deck, deckPointer, currentQuestion: question, phase: 'question', timeLeft: options.timerSeconds };
    });
  }

  function recordHistory(g, extra) {
    return [...g.history, {
      round: g.roundIndex,
      team: activeTeam(g).name,
      question: g.currentQuestion,
      ...extra,
    }];
  }

  function answerQuestion(correct) {
    playSound(correct ? 'correct' : 'incorrect', options.soundsLevel);
    setGame((g) => {
      if (!correct) {
        const history = recordHistory(g, { correct: false, points: 0 });
        return advanceAfterTurnStep({ ...g, history });
      }
      const team = activeTeam(g);
      const unusedPowerUps = g.powerUps[team.id];
      if (options.powerUpsEnabled && unusedPowerUps.length > 0) {
        return { ...g, phase: 'power-up' };
      }
      return { ...g, phase: 'drop', activePowerUp: null };
    });
  }

  function choosePowerUp(powerUpId) {
    setGame((g) => {
      const team = activeTeam(g);
      const powerUps = { ...g.powerUps };
      if (powerUpId) {
        powerUps[team.id] = powerUps[team.id].filter((id) => id !== powerUpId);
      } else {
        // Declining forfeits every unused power-up for this turn -- they
        // don't carry over, per "use them now or they will be lost."
        powerUps[team.id] = [];
      }
      const activePowerUp = powerUpId ? POWER_UPS.find((p) => p.id === powerUpId) : null;
      return { ...g, powerUps, activePowerUp, phase: 'drop' };
    });
  }

  function handleLanded(bucketIndex) {
    playSound('drop', options.soundsLevel);
    setGame((g) => {
      const team = activeTeam(g);
      const bucket = g.buckets[bucketIndex];
      const scores = { ...g.scores, [team.id]: g.scores[team.id] + bucket.value };
      const powerUps = { ...g.powerUps };
      if (bucket.stars > 0 && options.powerUpsEnabled) {
        const earned = POWER_UPS[Math.floor(Math.random() * POWER_UPS.length)];
        powerUps[team.id] = [...powerUps[team.id], earned.id];
      }
      const history = recordHistory(g, { correct: true, points: bucket.value });
      return advanceAfterTurnStep({ ...g, scores, powerUps, history, activePowerUp: null });
    });
  }

  function advanceAfterTurnStep(g) {
    const answeredThisTurn = g.questionsAnsweredThisTurn + 1;
    const perTurn = options.questionsEnabled ? options.questionsPerTurn : 1;
    if (answeredThisTurn < perTurn) {
      return { ...g, questionsAnsweredThisTurn: answeredThisTurn, phase: options.questionsEnabled ? 'reveal' : 'drop' };
    }
    // turn complete -- advance to next team, and round if we wrapped
    let nextTeamIndex = g.activeTeamIndex + 1;
    let nextRound = g.roundIndex;
    let buckets = g.buckets;
    if (nextTeamIndex >= teams.length) {
      nextTeamIndex = 0;
      nextRound += 1;
      buckets = newRoundBuckets();
    }
    if (nextRound > roundCount) {
      playSound('win', options.soundsLevel);
      return { ...g, phase: 'done' };
    }
    return {
      ...g,
      activeTeamIndex: nextTeamIndex,
      roundIndex: nextRound,
      questionsAnsweredThisTurn: 0,
      buckets,
      phase: options.questionsEnabled ? 'reveal' : 'drop',
      currentQuestion: null,
    };
  }

  React.useEffect(() => {
    if (game && game.phase === 'done') setStage('winner');
  }, [game]);

  React.useEffect(() => {
    if (!game || game.phase !== 'question' || !options.timerEnabled) return;
    if (game.timeLeft <= 0) {
      answerQuestion(false);
      return;
    }
    const t = setTimeout(() => setGame((g) => (g ? { ...g, timeLeft: g.timeLeft - 1 } : g)), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [game && game.phase, game && game.timeLeft, options.timerEnabled]);

  const winners = useMemo(() => {
    if (!game) return [];
    const max = Math.max(...teams.map((t) => game.scores[t.id]));
    return teams.filter((t) => game.scores[t.id] === max);
  }, [game, teams]);

  const stepIndex = { setup: 0, 'avatar-picker': 0, 'import-questions': 0, options: 1, 'question-options': 1, playing: 2, winner: 2 }[stage];

  return (
    <main className="max-w-2xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <h1 className="title-bubble text-3xl text-center mb-1">Ohhh...Plink</h1>
      <p className="text-text font-bold text-center text-xs mb-6 max-w-[46ch] mx-auto">
        Answer a question, drop a ball, chase the high-value bucket.
      </p>

      <StepHeader steps={SETUP_STEPS} activeIndex={stepIndex} />

      <AnimatePresence mode="wait">
        <motion.div
          key={stage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {stage === 'setup' && (
            <SetupScreen
              teamCount={teamCount} roundCount={roundCount} teams={teams}
              onTeamCount={syncTeamCount} onRoundCount={setRoundCount} onTeams={setTeams}
              onOptions={() => setStage('options')}
              onStart={startGame}
              onEditAvatar={(i) => { setAvatarPickerIndex(i); setStage('avatar-picker'); }}
              customSets={customSets} selectedSetId={selectedSetId} onSelectSet={setSelectedSetId}
              onImportQuestions={() => setStage('import-questions')}
            />
          )}

          {stage === 'import-questions' && (
            <ImportQuestionsScreen
              onBack={() => setStage('setup')}
              onSetsChanged={() => setCustomSets(loadCustomQuestionSets())}
            />
          )}

          {stage === 'avatar-picker' && (
            <AvatarPickerScreen
              team={teams[avatarPickerIndex]}
              isLastTeam={avatarPickerIndex >= teams.length - 1}
              onSelectAvatar={(avatarId) => {
                const next = [...teams]; next[avatarPickerIndex] = { ...next[avatarPickerIndex], avatarId };
                setTeams(next);
              }}
              onBack={() => setStage('setup')}
              onNext={() => {
                if (avatarPickerIndex < teams.length - 1) setAvatarPickerIndex(avatarPickerIndex + 1);
                else setStage('setup');
              }}
            />
          )}

          {stage === 'options' && (
            <OptionsScreen
              options={options} onChange={setOptions}
              onQuestionOptions={() => setStage('question-options')}
              onBack={() => setStage('setup')}
              onFullscreen={() => {
                if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
                else document.exitFullscreen?.();
              }}
            />
          )}

          {stage === 'question-options' && (
            <QuestionOptionsScreen options={options} onChange={setOptions} onBack={() => setStage('options')} />
          )}

          {stage === 'playing' && game && (
            <PlayScreen
              teams={teams} game={game} options={options} roundCount={roundCount} activeTeam={activeTeam(game)}
              onReveal={revealQuestion}
              onAnswer={answerQuestion}
              onChoosePowerUp={choosePowerUp}
              onLanded={handleLanded}
              onMenu={() => { setGame(null); setStage('setup'); }}
              onToggleSound={() => setOptions((o) => ({ ...o, soundsLevel: o.soundsLevel === 'off' ? 'med' : 'off' }))}
            />
          )}

          {stage === 'winner' && game && (
            <WinnerScreen
              teams={teams} scores={game.scores} winners={winners} history={game.history}
              onRestart={startGame}
              onMenu={() => { setGame(null); setStage('setup'); }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </main>
  );
}
