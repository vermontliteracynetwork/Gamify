import { Check } from '@phosphor-icons/react';
import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import { Minus, Plus } from '@phosphor-icons/react';

// Shared form controls, iPad-sized: switches, choice rows, sliders,
// steppers and picture cards.

// `art` and `hint` add a small picture on the left and a line under the label.
export function Toggle({ label, value, onChange, art, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; art?: ReactNode; hint?: string }) {
  return (
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)}
      className="flex items-center justify-between gap-3 min-h-12 px-4 py-1.5 rounded-input border-[2px] border-border-soft bg-surface text-left font-bold">
      {art}
      <span className="flex-1 min-w-0 grid">{label}{hint && <span className="text-sm font-semibold text-muted">{hint}</span>}</span>
      <span className={`relative w-14 h-8 rounded-pill border-[2px] border-border shrink-0 ${value ? 'bg-success' : 'bg-surface-2'}`} aria-hidden="true">
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-surface border-[2px] border-border motion-safe:transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </span>
    </button>
  );
}

// Choices shown like a question's answer tiles (teacher, 2026-11-01): big
// colored tiles in a grid, the picked one ringed and checked. Each can have
// hover text (`tip`); on touch screens the tip shows on the tile instead.
const TILE_BG = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];
export function ChoiceTiles<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; tip?: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-3">
        {options.map((o, i) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} aria-description={o.tip} data-tip={o.tip} onClick={() => onChange(o.value)}
              className={`min-h-16 px-4 py-2 rounded-input border-[2.5px] border-border flex items-center gap-3 text-left font-bold text-xl ${TILE_BG[i % TILE_BG.length]} ${on ? 'ring-4 ring-border' : 'opacity-85'}`}
              style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <span className={`w-10 h-10 shrink-0 rounded-full border-[2px] border-border flex items-center justify-center ${on ? 'bg-success' : 'bg-surface'}`} aria-hidden="true">{on && <Check weight="bold" size={20} />}</span>
              <span className="grid">
                {o.label}
                {o.tip && <span className="hidden [@media(hover:none)]:block text-sm font-semibold">{o.tip}</span>}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A row of choices with a highlight that slides to the pick with a little
// bounce (teacher, 2026-11-06: "make it amusing. slight animations").
// `art` puts a small picture above a choice's label (like a grid preview).
export function ChoiceRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; art?: ReactNode }[]; onChange: (v: T) => void }) {
  const id = useId();
  const still = useSettings().settings.motion === 'still';
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className={`inline-flex flex-wrap justify-self-start gap-1 p-1 ${options.some((o) => o.art) ? 'rounded-panel' : 'rounded-[1.6rem]'} border-[2px] border-border bg-surface-2`}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)}
              className={`relative min-h-11 px-4 ${o.art ? 'rounded-input' : 'rounded-pill'} font-bold motion-safe:active:scale-95 motion-safe:transition-transform ${o.art ? 'py-2 grid justify-items-center gap-1' : ''}`}>
              {on && <motion.span layoutId={still ? undefined : `pick-${id}`} transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                className={`absolute inset-0 ${o.art ? 'rounded-input' : 'rounded-pill'} bg-accent border-[2px] border-border`} style={{ boxShadow: '0 2px 0 #000' }} aria-hidden="true" />}
              {o.art && <span className="relative">{o.art}</span>}
              <span className="relative">{o.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// A big slider for anything with a range, its value shown beside it.
// `hint`: one plain line under the label, like "Default 3" (teacher, 2026-10-31).
export function Slider({ label, hint, min, max, value, disabled, show = String, onChange }: {
  label: string; hint?: string; min: number; max: number; value: number; disabled?: boolean; show?: (v: number) => string; onChange: (v: number) => void;
}) {
  const id = `slider-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className={`grid gap-1.5 ${disabled ? 'opacity-50' : ''}`}>
      <label htmlFor={id} className="flex items-center justify-between font-bold">
        <span>{label}</span>
        <span className="min-w-12 text-center px-2 py-0.5 rounded-pill bg-surface-2 border-[2px] border-border tabular-nums">{show(value)}</span>
      </label>
      {hint && <p className="-mt-1 text-sm font-semibold text-muted">{hint}</p>}
      <input id={id} type="range" min={min} max={max} step={1} value={value} disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={show(value)} className="gamify-slider w-full" />
    </div>
  );
}

export function Stepper({ label, value, min, max, onChange, lessLabel, moreLabel }: {
  label: string; value: number; min: number; max: number; onChange: (v: number) => void; lessLabel: string; moreLabel: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="font-bold flex-1">{label}</span>
      <button type="button" aria-label={lessLabel} disabled={value <= min} onClick={() => onChange(value - 1)}
        className="w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Minus weight="bold" size={22} /></button>
      <span className="font-display text-3xl font-bold w-12 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={moreLabel} disabled={value >= max} onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center disabled:opacity-40"><Plus weight="bold" size={22} /></button>
    </div>
  );
}

// Big picture choices (board type, game style...): an image or icon area,
// a name and one line saying what it does.
export function PictureChoice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; title: string; hint: string; art: ReactNode }[]; onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="grid sm:grid-cols-2 gap-3">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} aria-label={o.title} onClick={() => onChange(o.value)}
          className={`rounded-panel border-[2.5px] overflow-hidden text-left grid ${value === o.value ? 'border-border ring-4 ring-accent' : 'border-border-soft'} bg-surface`}>
          <span className="block h-28 sm:h-32" aria-hidden="true">{o.art}</span>
          <span className="p-3 grid gap-0.5">
            <span className="font-display text-xl font-bold">{o.title}</span>
            <span className="font-bold text-sm">{o.hint}</span>
          </span>
        </button>
      ))}
    </div>
  );
}
