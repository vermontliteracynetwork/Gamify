import React from 'react';
import { motion } from 'motion/react';
import { Check, GearSix, Play } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';
import { TEAM_COLORS, MIN_TEAMS, MAX_TEAMS, MIN_ROUNDS, MAX_ROUNDS } from '../data';

function SliderField({ label, value, min, max, onChange }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-display font-bold text-sm text-text">{label}</label>
        <span className="font-display text-xl font-bold text-accent">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-pill bg-border-soft accent-[#f7c948] cursor-pointer"
      />
    </div>
  );
}

export default function SetupScreen({ teamCount, roundCount, teams, onTeamCount, onRoundCount, onTeams, onOptions, onStart }) {
  return (
    <Panel>
      <h2 className="font-display text-2xl font-bold mb-5">Set up your game</h2>

      <SliderField label="Teams" value={teamCount} min={MIN_TEAMS} max={MAX_TEAMS} onChange={onTeamCount} />
      <SliderField label="Rounds" value={roundCount} min={MIN_ROUNDS} max={MAX_ROUNDS} onChange={onRoundCount} />

      <div className="flex flex-col gap-2.5 mb-6">
        {teams.map((team, i) => (
          <motion.div
            key={team.id}
            layout
            className="flex items-center gap-3"
          >
            <input
              value={team.name}
              onChange={(e) => {
                const next = [...teams]; next[i] = { ...team, name: e.target.value }; onTeams(next);
              }}
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-input bg-bg-elevated border border-border-soft text-text
                         font-bold text-sm focus:outline-none focus:border-accent transition-colors"
            />
            <div className="flex gap-1.5 shrink-0">
              {TEAM_COLORS.map((c) => (
                <button
                  key={c.id}
                  aria-label={`Set ${team.name} color to ${c.id}`}
                  onClick={() => { const next = [...teams]; next[i] = { ...team, color: c.hex }; onTeams(next); }}
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform active:scale-90 hover:scale-110"
                  style={{ background: c.hex, boxShadow: team.color === c.hex ? '0 0 0 2px var(--color-bg-elevated), 0 0 0 4px currentColor' : 'none', color: c.hex }}
                >
                  {team.color === c.hex && <Check weight="bold" size={13} color="#201333" />}
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex gap-3 justify-center">
        <Button variant="ghost" onClick={onOptions}>
          <GearSix weight="bold" size={16} />
          Options
        </Button>
        <Button variant="primary" onClick={onStart}>
          <Play weight="fill" size={16} />
          Start
        </Button>
      </div>
    </Panel>
  );
}
