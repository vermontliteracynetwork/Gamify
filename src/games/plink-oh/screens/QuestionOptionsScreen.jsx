import React from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import { Panel, Button, Toggle } from '../components/ui';

export default function QuestionOptionsScreen({ options, onChange, onBack }) {
  const set = (patch) => onChange({ ...options, ...patch });

  return (
    <Panel>
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={onBack}
          aria-label="Back to options"
          className="w-9 h-9 rounded-pill flex items-center justify-center bg-bg-elevated border border-border-soft
                     hover:bg-surface-hover active:scale-90 transition-transform shrink-0"
        >
          <ArrowLeft weight="bold" size={16} />
        </button>
        <h2 className="font-display text-2xl font-bold">Question options</h2>
      </div>

      <div className="py-2.5">
        <div className="font-bold text-sm text-text mb-2">Questions per turn</div>
        <input
          type="number" min={1} max={5} value={options.questionsPerTurn}
          onChange={(e) => set({ questionsPerTurn: Math.max(1, Math.min(5, Number(e.target.value))) })}
          className="w-20 px-3 py-2 rounded-input bg-bg-elevated border border-border-soft text-text font-bold text-sm
                     focus:outline-none focus:border-accent transition-colors"
        />
      </div>

      <Toggle label="Manual deck" sub="Click a card deck to reveal a question, instead of the team name" value={options.manualDeck} onChange={(v) => set({ manualDeck: v })} />
      <Toggle label="Timer" sub="Seconds per question" value={options.timerEnabled} onChange={(v) => set({ timerEnabled: v })} />
      {options.timerEnabled && (
        <input
          type="number" min={5} max={120} value={options.timerSeconds}
          onChange={(e) => set({ timerSeconds: Math.max(5, Math.min(120, Number(e.target.value))) })}
          className="w-20 px-3 py-2 mb-2 rounded-input bg-bg-elevated border border-border-soft text-text font-bold text-sm
                     focus:outline-none focus:border-accent transition-colors"
        />
      )}
      <Toggle label="Random order" sub="Questions appear in random order" value={options.randomOrder} onChange={(v) => set({ randomOrder: v })} />

      <div className="mt-5 flex justify-center">
        <Button variant="primary" onClick={onBack}>Done</Button>
      </div>
    </Panel>
  );
}
