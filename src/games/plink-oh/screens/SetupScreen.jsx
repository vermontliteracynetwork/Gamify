import React from 'react';
import { motion } from 'motion/react';
import { Check, GearSix, Play, FileArrowUp } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';
import { TEAM_COLORS, AVATARS, MIN_TEAMS, MAX_TEAMS, MIN_ROUNDS, MAX_ROUNDS } from '../data';

function SliderField({ label, value, min, max, onChange }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline justify-between mb-2">
        <label className="font-display font-bold text-sm text-text">{label}</label>
        <span className="font-display text-xl font-bold text-accent-ink bg-accent px-2.5 py-0.5 rounded-pill border-2 border-border">{value}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-pill bg-surface-2 accent-[color:var(--accent)] cursor-pointer"
      />
    </div>
  );
}

export default function SetupScreen({
  teamCount, roundCount, teams, onTeamCount, onRoundCount, onTeams, onOptions, onStart, onEditAvatar,
  customSets, selectedSetId, onSelectSet, onImportQuestions,
}) {
  return (
    <Panel>
      <h2 className="title-bubble text-2xl mb-5">Set up your game</h2>

      <SliderField label="Teams" value={teamCount} min={MIN_TEAMS} max={MAX_TEAMS} onChange={onTeamCount} />
      <SliderField label="Rounds" value={roundCount} min={MIN_ROUNDS} max={MAX_ROUNDS} onChange={onRoundCount} />

      <div className="flex flex-col gap-2.5 mb-6">
        {teams.map((team, i) => {
          const avatar = AVATARS.find((a) => a.id === team.avatarId) || AVATARS[0];
          return (
            <motion.div key={team.id} layout className="flex items-center gap-3">
              <button
                onClick={() => onEditAvatar(i)}
                aria-label={`Choose ${team.name}'s avatar`}
                className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 border-[2.5px] border-border active:scale-90 motion-safe:transition-transform"
                style={{ background: avatar.color, boxShadow: '0 2px 0 var(--border)' }}
              />
              <input
                value={team.name}
                onChange={(e) => {
                  const next = [...teams]; next[i] = { ...team, name: e.target.value }; onTeams(next);
                }}
                className="flex-1 min-w-0 px-3.5 py-2.5 rounded-input bg-surface-2 border-[2px] border-border text-text
                           font-bold text-sm focus:outline-none focus:border-accent-ink transition-colors"
              />
              <div className="flex gap-1.5 shrink-0">
                {TEAM_COLORS.map((c) => (
                  <button
                    key={c.id}
                    aria-label={`Set ${team.name} color to ${c.id}`}
                    onClick={() => { const next = [...teams]; next[i] = { ...team, color: c.hex }; onTeams(next); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center border-2 border-border active:scale-90 hover:scale-110 motion-safe:transition-transform"
                    style={{ background: c.hex }}
                  >
                    {team.color === c.hex && <Check weight="bold" size={11} color="#241c3d" />}
                  </button>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <label className="font-display font-bold text-sm text-text">Question set</label>
          <button onClick={onImportQuestions} className="flex items-center gap-1 text-xs font-bold text-accent-ink bg-accent px-2.5 py-1 rounded-pill border-2 border-border">
            <FileArrowUp weight="bold" size={13} /> Import
          </button>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onSelectSet('demo')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-bold border-2 border-border ${selectedSetId === 'demo' ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-text'}`}
          >
            Demo bank
          </button>
          {customSets.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelectSet(s.id)}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-bold border-2 border-border ${selectedSetId === s.id ? 'bg-accent text-accent-ink' : 'bg-surface-2 text-text'}`}
            >
              {s.name}
            </button>
          ))}
        </div>
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
