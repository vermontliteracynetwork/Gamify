import React, { useMemo, useRef, useState } from 'react';
import PlinkoBoard from './PlinkoBoard';
import { playSound } from './sound';
import {
  TEAM_COLORS, MIN_TEAMS, MAX_TEAMS, MIN_ROUNDS, MAX_ROUNDS,
  generateBuckets, shuffle, POWER_UPS, SAMPLE_QUESTIONS,
} from './data';

const POWER_UPS_BY_ID = Object.fromEntries(POWER_UPS.map((p) => [p.id, p]));

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

function makeDefaultTeams(count) {
  return Array.from({ length: count }).map((_, i) => ({
    id: `team-${i}`,
    name: `Team ${i + 1}`,
    color: TEAM_COLORS[i % TEAM_COLORS.length].hex,
  }));
}

const PANEL = { background: '#16204A', border: '1px solid #2C3E80', borderRadius: 14, padding: 20, color: '#F2F4FA' };
const BTN = { padding: '10px 20px', borderRadius: 10, border: 'none', fontWeight: 700, cursor: 'pointer' };
const BTN_PRIMARY = { ...BTN, background: '#F4C542', color: '#16204A' };
const BTN_GHOST = { ...BTN, background: '#2C3E80', color: '#F2F4FA' };
const BTN_DANGER = { ...BTN, background: '#E0555F', color: '#fff' };

function Toggle({ label, sub, value, onChange }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <div>
        <div style={{ fontWeight: 600 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: '#9FB3E0' }}>{sub}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        style={{
          ...BTN, padding: '6px 16px',
          background: value ? '#5FBF7B' : '#3A4A80',
          color: '#fff',
        }}
      >
        {value ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}

export default function PlinkOhGame() {
  const [stage, setStage] = useState('setup'); // setup | options | question-options | playing | winner
  const [teamCount, setTeamCount] = useState(3);
  const [roundCount, setRoundCount] = useState(5);
  const [teams, setTeams] = useState(makeDefaultTeams(3));
  const [options, setOptions] = useState(DEFAULT_OPTIONS);
  const containerRef = useRef(null);

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

  function buildDeck() {
    return options.randomOrder ? shuffle(SAMPLE_QUESTIONS) : SAMPLE_QUESTIONS;
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
      deck = options.randomOrder ? shuffle(SAMPLE_QUESTIONS) : SAMPLE_QUESTIONS;
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
  }, [game && game.phase, game && game.timeLeft, options.timerEnabled]);

  const winners = useMemo(() => {
    if (!game) return [];
    const max = Math.max(...teams.map((t) => game.scores[t.id]));
    return teams.filter((t) => game.scores[t.id] === max);
  }, [game, teams]);

  return (
    <div ref={containerRef} style={{ minHeight: '100vh', background: '#0E1638', padding: '24px 16px', fontFamily: 'Nunito, "Segoe UI", sans-serif' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <h1 style={{ color: '#F4C542', fontSize: 32, textAlign: 'center', marginBottom: 4 }}>Plink-oh!</h1>
        <p style={{ color: '#9FB3E0', textAlign: 'center', marginTop: 0, marginBottom: 20, fontSize: 13 }}>
          Prototype game module -- rules reconstructed from the Baamboozle "Plink-oh!" walkthrough.
        </p>

        {stage === 'setup' && (
          <SetupScreen
            teamCount={teamCount} roundCount={roundCount} teams={teams}
            onTeamCount={syncTeamCount} onRoundCount={setRoundCount} onTeams={setTeams}
            onOptions={() => setStage('options')}
            onStart={startGame}
          />
        )}

        {stage === 'options' && (
          <OptionsScreen
            options={options} onChange={setOptions}
            onQuestionOptions={() => setStage('question-options')}
            onBack={() => setStage('setup')}
            onFullscreen={() => {
              if (!document.fullscreenElement) containerRef.current?.requestFullscreen?.();
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
          />
        )}

        {stage === 'winner' && game && (
          <WinnerScreen
            teams={teams} scores={game.scores} winners={winners} history={game.history}
            onRestart={startGame}
            onMenu={() => { setGame(null); setStage('setup'); }}
          />
        )}
      </div>
    </div>
  );
}

function SetupScreen({ teamCount, roundCount, teams, onTeamCount, onRoundCount, onTeams, onOptions, onStart }) {
  return (
    <div style={PANEL}>
      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Teams: {teamCount}</label>
      <input type="range" min={MIN_TEAMS} max={MAX_TEAMS} value={teamCount}
        onChange={(e) => onTeamCount(Number(e.target.value))} style={{ width: '100%', marginBottom: 16 }} />

      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Rounds: {roundCount}</label>
      <input type="range" min={MIN_ROUNDS} max={MAX_ROUNDS} value={roundCount}
        onChange={(e) => onRoundCount(Number(e.target.value))} style={{ width: '100%', marginBottom: 20 }} />

      <div style={{ marginBottom: 20 }}>
        {teams.map((team, i) => (
          <div key={team.id} style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 8 }}>
            <input
              value={team.name}
              onChange={(e) => {
                const next = [...teams]; next[i] = { ...team, name: e.target.value }; onTeams(next);
              }}
              style={{ flex: 1, padding: 8, borderRadius: 8, border: '1px solid #2C3E80', background: '#0E1638', color: '#fff' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { const next = [...teams]; next[i] = { ...team, color: c.hex }; onTeams(next); }}
                  style={{
                    width: 22, height: 22, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                    border: team.color === c.hex ? '2px solid #fff' : '2px solid transparent',
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button style={BTN_GHOST} onClick={onOptions}>Options</button>
        <button style={BTN_PRIMARY} onClick={onStart}>Start</button>
      </div>
    </div>
  );
}

function OptionsScreen({ options, onChange, onQuestionOptions, onBack, onFullscreen }) {
  const set = (patch) => onChange({ ...options, ...patch });
  return (
    <div style={PANEL}>
      <div onClick={onQuestionOptions} style={{ cursor: 'pointer', padding: '4px 0', borderBottom: '1px solid #2C3E80', marginBottom: 4 }}>
        <Toggle label="Q. Options ›" sub="Click to open question settings" value={options.questionsEnabled}
          onChange={(v) => set({ questionsEnabled: v })} />
      </div>
      <Toggle label="Power-ups" value={options.powerUpsEnabled} onChange={(v) => set({ powerUpsEnabled: v })} />
      <Toggle label="Spikes" sub="Extra hazard pegs, higher-variance bounces" value={options.spikesEnabled} onChange={(v) => set({ spikesEnabled: v })} />
      <Toggle label="Full Screen" value={false} onChange={onFullscreen} />
      <Toggle label="Music" sub="Background track (not yet implemented)" value={options.musicEnabled} onChange={(v) => set({ musicEnabled: v })} />
      <div style={{ padding: '8px 0' }}>
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Sounds</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['off', 'low', 'med', 'high'].map((lvl) => (
            <button key={lvl} onClick={() => set({ soundsLevel: lvl })}
              style={{ ...BTN, padding: '6px 14px', background: options.soundsLevel === lvl ? '#F4C542' : '#2C3E80', color: options.soundsLevel === lvl ? '#16204A' : '#fff' }}>
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button style={BTN_PRIMARY} onClick={onBack}>Okay</button>
      </div>
    </div>
  );
}

function QuestionOptionsScreen({ options, onChange, onBack }) {
  const set = (patch) => onChange({ ...options, ...patch });
  return (
    <div style={PANEL}>
      <h3 style={{ marginTop: 0 }}>Question Options</h3>
      <div style={{ padding: '8px 0' }}>
        <div style={{ fontWeight: 600 }}>Questions per turn</div>
        <input type="number" min={1} max={5} value={options.questionsPerTurn}
          onChange={(e) => set({ questionsPerTurn: Math.max(1, Math.min(5, Number(e.target.value))) })}
          style={{ width: 60, padding: 6, borderRadius: 6, border: '1px solid #2C3E80', background: '#0E1638', color: '#fff' }} />
      </div>
      <Toggle label="Manual Deck" sub="Click a card deck to reveal a question, instead of the team name" value={options.manualDeck} onChange={(v) => set({ manualDeck: v })} />
      <Toggle label="Timer" sub="Seconds per question" value={options.timerEnabled} onChange={(v) => set({ timerEnabled: v })} />
      {options.timerEnabled && (
        <input type="number" min={5} max={120} value={options.timerSeconds}
          onChange={(e) => set({ timerSeconds: Math.max(5, Math.min(120, Number(e.target.value))) })}
          style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid #2C3E80', background: '#0E1638', color: '#fff', marginBottom: 8 }} />
      )}
      <Toggle label="Random Order" sub="Questions appear in random order" value={options.randomOrder} onChange={(v) => set({ randomOrder: v })} />
      <div style={{ marginTop: 16, textAlign: 'center' }}>
        <button style={BTN_PRIMARY} onClick={onBack}>Okay</button>
      </div>
    </div>
  );
}

function PlayScreen({ teams, game, options, roundCount, activeTeam, onReveal, onAnswer, onChoosePowerUp, onLanded }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, color: '#F2F4FA' }}>
        <div style={{ fontWeight: 700 }}>Round {game.roundIndex}/{roundCount}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          {teams.map((t) => (
            <div key={t.id} style={{
              padding: '4px 10px', borderRadius: 8,
              background: t.id === activeTeam.id ? '#2C3E80' : 'transparent',
              border: t.id === activeTeam.id ? '1px solid #F4C542' : '1px solid transparent',
            }}>
              <span style={{ color: t.color, fontWeight: 700 }}>{t.name}</span>{' '}
              <span>{game.scores[t.id]}</span>
              {game.powerUps[t.id]?.length > 0 && <span style={{ marginLeft: 4 }}>{'★'.repeat(game.powerUps[t.id].length)}</span>}
            </div>
          ))}
        </div>
      </div>

      {options.questionsEnabled && game.phase === 'reveal' && (
        <div style={{ ...PANEL, textAlign: 'center', cursor: 'pointer' }} onClick={onReveal}>
          <div style={{ width: 90, height: 90, borderRadius: '50%', background: activeTeam.color, margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#16204A' }}>
            {activeTeam.name}
          </div>
          <p>{options.manualDeck ? 'Click the deck to reveal a question' : `Click ${activeTeam.name}'s name to reveal their question`}</p>
        </div>
      )}

      {options.questionsEnabled && game.phase === 'question' && game.currentQuestion && (
        <div style={{ ...PANEL, textAlign: 'center' }}>
          <p style={{ whiteSpace: 'pre-line', fontSize: 18 }}>{game.currentQuestion.prompt}</p>
          <p style={{ color: '#F4C542', fontWeight: 700 }}>{game.currentQuestion.answer}</p>
          {options.timerEnabled && <p style={{ color: '#9FB3E0' }}>{game.timeLeft}s</p>}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 12 }}>
            <button style={BTN_DANGER} onClick={() => onAnswer(false)}>✗ Oops</button>
            <button style={{ ...BTN, background: '#5FBF7B', color: '#fff' }} onClick={() => onAnswer(true)}>✓ Okay</button>
          </div>
        </div>
      )}

      {game.phase === 'power-up' && (
        <div style={{ ...PANEL, textAlign: 'center' }}>
          <p>Use a power-up on this turn, or skip. Unused power-ups don't carry over.</p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {game.powerUps[activeTeam.id].map((id) => {
              const pu = POWER_UPS_BY_ID[id];
              return (
                <button key={id} style={BTN_GHOST} onClick={() => onChoosePowerUp(id)} title={pu.description}>
                  {pu.icon} {pu.name}
                </button>
              );
            })}
            <button style={BTN_DANGER} onClick={() => onChoosePowerUp(null)}>✗ Skip</button>
          </div>
        </div>
      )}

      {game.phase === 'drop' && (
        <div style={{ ...PANEL, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!options.questionsEnabled && <p>{activeTeam.name}: pick a drop zone</p>}
          <PlinkoBoard
            dropZoneCount={Math.min(6, game.buckets.length + 1)}
            buckets={game.buckets}
            spikesEnabled={options.spikesEnabled}
            activePowerUp={game.activePowerUp}
            teamColor={activeTeam.color}
            onLanded={onLanded}
          />
        </div>
      )}
    </div>
  );
}

function WinnerScreen({ teams, scores, winners, history, onRestart, onMenu }) {
  const [showReview, setShowReview] = useState(false);
  return (
    <div style={{ ...PANEL, textAlign: 'center' }}>
      <h2 style={{ color: '#F4C542' }}>Winner{winners.length > 1 ? 's' : ''}!</h2>
      {winners.map((w) => (
        <div key={w.id} style={{ fontSize: 22, fontWeight: 700, color: w.color }}>{w.name} -- {scores[w.id]} pts</div>
      ))}

      <div style={{ margin: '16px 0', textAlign: 'left' }}>
        {teams.slice().sort((a, b) => scores[b.id] - scores[a.id]).map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #2C3E80' }}>
            <span style={{ color: t.color }}>{t.name}</span><span>{scores[t.id]}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button style={BTN_PRIMARY} onClick={onRestart}>Restart</button>
        <button style={BTN_GHOST} onClick={() => setShowReview((s) => !s)}>Review</button>
        <button style={BTN_GHOST} onClick={onMenu}>Menu</button>
      </div>

      {showReview && (
        <div style={{ marginTop: 16, textAlign: 'left', maxHeight: 320, overflowY: 'auto' }}>
          {history.map((h, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid #2C3E80', fontSize: 13 }}>
              <div><strong>{h.team}</strong> -- Round {h.round} -- {h.correct ? `+${h.points}` : 'missed'}</div>
              {h.question && <div style={{ color: '#9FB3E0', whiteSpace: 'pre-line' }}>{h.question.prompt} <em>({h.question.answer})</em></div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
