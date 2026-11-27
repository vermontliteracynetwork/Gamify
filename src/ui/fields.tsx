import { Check } from '@phosphor-icons/react';
import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import { Info, Minus, Plus } from '@phosphor-icons/react';

// Shared form controls, iPad-sized: switches, choice rows, sliders,
// steppers and picture cards.

// `art` and `hint` add a small picture on the left and a line under the label.
export function Toggle({ label, value, onChange, art, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; art?: ReactNode; hint?: string }) {
  return (
    // The hint is hover text on a small (i) (teacher, 2026-11-18).
    <button type="button" role="switch" aria-checked={value} onClick={() => onChange(!value)} aria-description={hint}
      className="flex items-center justify-between gap-3 min-h-12 px-4 py-1.5 rounded-input border-std border-border-soft bg-surface text-left font-bold">
      {art}
      <span className="flex-1 min-w-0 inline-flex items-center gap-1.5">{label}{hint && <span data-tip={hint} aria-hidden="true" className="text-muted cursor-help shrink-0"><Info weight="bold" size={16} /></span>}</span>
      <span className={`relative w-14 h-8 rounded-pill border-std border-border shrink-0 ${value ? 'bg-success' : 'bg-surface-2'}`} aria-hidden="true">
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-surface border-std border-border motion-safe:transition-all ${value ? 'left-6' : 'left-0.5'}`} />
      </span>
    </button>
  );
}


// A row of choices with a highlight that slides to the pick with a little
// bounce (teacher, 2026-11-06: "make it amusing. slight animations").
// `art` puts a small picture above a choice's label (like a grid preview).
// The one choice control (design system, 2026-11-18): a row of choices, with
// an optional small picture (`art`) and hover text (`tip`) for each.
export function ChoiceRow<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string; art?: ReactNode; tip?: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  const still = useSettings().settings.motion === 'still';
  // Pictured choices (like card grid sizes) are separate white cards that
  // get a black border on hover (teacher, 2026-11-06).
  if (options.some((o) => o.art)) return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-3">
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} data-tip={o.tip} aria-description={o.tip}
              className={`min-w-24 px-4 py-3 rounded-input border-bold bg-surface grid justify-items-center gap-2 font-bold motion-safe:transition-transform motion-safe:hover:-translate-y-0.5 ${on ? 'border-border ring-4 ring-border ring-offset-4 ring-offset-paper' : 'border-border-soft hover:border-border'}`}
              style={{ boxShadow: on ? '0 4px 0 var(--ink)' : undefined }}>
              {o.art}<span>{o.label}</span>
              {/* Touch screens have no hover, so the tip shows on the card (Claudia, 2026-11-18). */}
              {o.tip && <span className="hidden [@media(hover:none)]:block text-xs font-semibold text-muted max-w-48">{o.tip}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      {options.some((o) => o.tip) && <p className="hidden [@media(hover:none)]:block -mt-1 text-xs font-semibold text-muted">{options.find((o) => o.value === value)?.tip}</p>}
      <div role="radiogroup" aria-label={label} className={`inline-flex flex-wrap justify-self-start gap-1 p-1 ${options.some((o) => o.art) ? 'rounded-panel' : 'rounded-[1.6rem]'} border-std border-border bg-surface-2`}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <button key={o.value} type="button" role="radio" aria-checked={on} onClick={() => onChange(o.value)} data-tip={o.tip} aria-description={o.tip}
              className={`relative min-h-11 px-4 ${o.art ? 'rounded-input' : 'rounded-pill'} font-bold motion-safe:active:scale-95 motion-safe:transition-transform ${o.art ? 'py-2 grid justify-items-center gap-1' : ''}`}>
              {on && <motion.span layoutId={still ? undefined : `pick-${id}`} transition={{ type: 'spring', stiffness: 520, damping: 30 }}
                className={`absolute inset-0 ${o.art ? 'rounded-input' : 'rounded-pill'} bg-mint border-std border-border`} style={{ boxShadow: '0 2px 0 var(--ink)' }} aria-hidden="true" />}
              {o.art && <span className="relative">{o.art}</span>}
              {/* The picked pill is Mint with an ink check (Universal views 2b, 5). */}
              <span className="relative inline-flex items-center gap-1.5">{on && !o.art && <Check weight="bold" size={16} aria-hidden="true" />}{o.label}</span>
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
    <div className={`grid gap-1.5 ${disabled ? 'opacity-40' : ''}`}>
      {/* The hint is hover text on a small (i), not a line under the label
          (teacher, 2026-11-18); the track fills up to the thumb. */}
      <label htmlFor={id} className="flex items-center justify-between gap-2 font-bold">
        <span className="inline-flex items-center gap-1.5">{label}{hint && <span data-tip={hint} aria-hidden="true" className="text-muted cursor-help"><Info weight="bold" size={16} /></span>}</span>
        <span className="min-w-12 text-center px-2 py-0.5 rounded-pill bg-surface-2 border-std border-border tabular-nums">{show(value)}</span>
      </label>
      <input id={id} type="range" min={min} max={max} step={1} value={value} disabled={disabled} aria-description={hint}
        onChange={(e) => onChange(Number(e.target.value))} aria-valuetext={show(value)} className="gamify-slider w-full"
        style={{ '--fill': `${max > min ? ((value - min) / (max - min)) * 100 : 0}%` } as React.CSSProperties} />
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
        className="w-12 h-12 rounded-full border-bold border-border bg-white flex items-center justify-center disabled:opacity-40"><Minus weight="bold" size={22} /></button>
      <span className="font-display text-3xl font-bold w-12 text-center tabular-nums" aria-live="polite">{value}</span>
      <button type="button" aria-label={moreLabel} disabled={value >= max} onClick={() => onChange(value + 1)}
        className="w-12 h-12 rounded-full border-bold border-border bg-white flex items-center justify-center disabled:opacity-40"><Plus weight="bold" size={22} /></button>
    </div>
  );
}

// Big picture choices (board type, game style...): an image or icon area,
// a name and one line saying what it does.
export function PictureChoice<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: { value: T; title: string; hint: string; art: ReactNode }[]; onChange: (v: T) => void;
}) {
  return (
    // The pictures are the main view (teacher, 2026-11-06): big art, a big title.
    <div role="radiogroup" aria-label={label} className="grid sm:grid-cols-2 gap-4">
      {options.map((o) => {
        const on = value === o.value;
        return (
          <button key={o.value} type="button" role="radio" aria-checked={on} aria-label={o.title} onClick={() => onChange(o.value)}
            className={`group relative rounded-panel border-bold border-border overflow-hidden text-left grid bg-white motion-safe:transition-transform motion-safe:hover:-translate-y-1 ${on ? 'ring-4 ring-border ring-offset-4 ring-offset-paper' : 'opacity-90 hover:opacity-100'}`}
            style={{ boxShadow: on ? '0 6px 0 var(--ink)' : '0 3px 0 rgba(0,0,0,0.85)' }}>
            <span className="block h-[clamp(5rem,30vh,18rem)] border-b-[2.5px] border-border overflow-hidden motion-safe:group-hover:[&>*]:scale-[1.03] [&>*]:transition-transform [&>*]:duration-300" aria-hidden="true">{o.art}</span>
            {/* Picture cards (owner rule, 2026-11-26): the title reads large and
                the subtext shows only once the card is picked (screen readers
                always hear it). */}
            <span className="px-4 py-2.5 grid gap-1">
              <span className="font-display text-xl sm:text-2xl font-bold leading-tight">{o.title}</span>
              <span className={on ? 'font-semibold text-sm text-muted leading-snug motion-safe:animate-[pop_0.25s_ease-out]' : 'sr-only'}>{o.hint}</span>
            </span>
            {on && <span className="absolute top-2 right-2 w-8 h-8 rounded-full bg-kelly border-std border-border flex items-center justify-center motion-safe:animate-[pop_0.3s_ease-out]" aria-hidden="true"><Check weight="bold" size={18} /></span>}
          </button>
        );
      })}
    </div>
  );
}
