import { useEffect, useState } from 'react';
import { LockSimple, Minus, Play, Plus } from '@phosphor-icons/react';
import { data } from '../data';
import type { RoundSetting } from '../games/types';
import { t } from '../i18n';

export interface RoundValues { rounds: number; perBreak: number }

// Every game opens on this start card: up to two number pickers, remembered
// per game on this device, locked when a teacher assignment sets them.
export default function StartCard({ gameId, title, description, rounds, perBreak, locked, onPlay }: {
  gameId: string; title: string; description: string;
  rounds?: RoundSetting; perBreak?: RoundSetting; locked?: RoundValues;
  onPlay: (v: RoundValues) => void;
}) {
  const [values, setValues] = useState<RoundValues>(locked ?? { rounds: rounds?.default ?? 1, perBreak: perBreak?.default ?? 1 });
  useEffect(() => {
    if (locked) return;
    data.getSetting<RoundValues>(`rounds:${gameId}`).then((v) => { if (v) setValues(v); });
  }, [gameId, locked]);

  function change(key: keyof RoundValues, spec: RoundSetting, delta: number) {
    const next = { ...values, [key]: Math.min(spec.max, Math.max(spec.min, values[key] + delta)) };
    setValues(next);
    void data.setSetting(`rounds:${gameId}`, next);
  }

  return (
    <section className="bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-5 justify-items-center text-center max-w-lg mx-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <div>
        <h1 className="title-bubble text-4xl">{title}</h1>
        <p className="font-bold mt-1">{description}</p>
      </div>
      {([['rounds', rounds], ['perBreak', perBreak]] as const).map(([key, spec]) => spec && (
        <div key={key} className="grid gap-2 justify-items-center">
          <span className="font-bold">{key === 'rounds' ? spec.label || t('start.rounds') : spec.label || t('start.perBreak')}</span>
          <div className="flex items-center gap-3">
            <button type="button" disabled={!!locked || values[key] <= spec.min} onClick={() => change(key, spec, -1)}
              aria-label={t('start.less', { label: spec.label })}
              className="w-14 h-14 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40">
              <Minus weight="bold" size={24} />
            </button>
            <span className="font-display text-4xl font-bold w-16 tabular-nums" aria-live="polite">{values[key]}</span>
            <button type="button" disabled={!!locked || values[key] >= spec.max} onClick={() => change(key, spec, 1)}
              aria-label={t('start.more', { label: spec.label })}
              className="w-14 h-14 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40">
              <Plus weight="bold" size={24} />
            </button>
          </div>
        </div>
      ))}
      {locked && <p className="inline-flex items-center gap-1.5 font-bold text-sm"><LockSimple weight="bold" size={18} />{t('start.locked')}</p>}
      <button type="button" onClick={() => onPlay(values)}
        className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl font-bold inline-flex items-center gap-2 active:scale-95"
        style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <Play weight="fill" size={28} />{t('start.play')}
      </button>
    </section>
  );
}
