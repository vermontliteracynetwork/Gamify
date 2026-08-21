import React from 'react';
import { ArrowLeft, CaretRight } from '@phosphor-icons/react';
import { Panel, Button, Toggle } from '../components/ui';

const SOUND_LEVELS = ['off', 'low', 'med', 'high'];

export default function OptionsScreen({ options, onChange, onQuestionOptions, onBack, onFullscreen }) {
  const set = (patch) => onChange({ ...options, ...patch });

  return (
    <Panel>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          aria-label="Back to setup"
          className="w-9 h-9 rounded-pill flex items-center justify-center bg-bg-elevated border border-border-soft
                     hover:bg-surface-hover active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft weight="bold" size={16} />
        </button>
        <h2 className="font-display text-2xl font-bold">Options</h2>
      </div>

      <button
        onClick={onQuestionOptions}
        className="w-full flex items-center justify-between gap-4 py-2.5 border-b border-border-soft mb-1 text-left"
      >
        <div>
          <div className="font-bold text-sm text-text flex items-center gap-1">
            Question options <CaretRight weight="bold" size={13} className="text-muted" />
          </div>
          <div className="text-xs text-muted mt-0.5">Deck style, timer, order</div>
        </div>
        <div className={`px-3 py-1 rounded-pill text-xs font-bold ${options.questionsEnabled ? 'bg-success/20 text-success' : 'bg-border text-muted'}`}>
          {options.questionsEnabled ? 'ON' : 'OFF'}
        </div>
      </button>

      <Toggle label="Power-ups" value={options.powerUpsEnabled} onChange={(v) => set({ powerUpsEnabled: v })} />
      <Toggle label="Spikes" sub="Extra hazard pegs, higher-variance bounces" value={options.spikesEnabled} onChange={(v) => set({ spikesEnabled: v })} />
      <Toggle label="Full screen" value={false} onChange={onFullscreen} />
      <Toggle label="Music" sub="Background track (coming soon)" value={options.musicEnabled} onChange={(v) => set({ musicEnabled: v })} />

      <div className="py-2.5">
        <div className="font-bold text-sm text-text mb-2">Sounds</div>
        <div className="flex gap-2">
          {SOUND_LEVELS.map((lvl) => (
            <button
              key={lvl}
              onClick={() => set({ soundsLevel: lvl })}
              className={`px-3.5 py-1.5 rounded-pill text-xs font-bold transition-colors active:scale-95
                          ${options.soundsLevel === lvl ? 'bg-accent text-accent-ink' : 'bg-bg-elevated text-muted border border-border-soft'}`}
            >
              {lvl.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <Button variant="primary" onClick={onBack}>Done</Button>
      </div>
    </Panel>
  );
}
