import type { ReactNode } from 'react';
import { Info, Lightbulb } from '@phosphor-icons/react';
import type { QuestionLogEntry, QuestionSet } from '../data/types';
import { percent } from './reports';

// Shared parts of the approved teacher portal pages (/brand?tab=teacher,
// views 3a, 3b and 7c, applied 2026-11-25): one flat card with a small bold
// heading and an info tip, soft color chips, a first-try meter colored by
// band, and the plain takeaway line under a chart. Built on the site tokens
// in src/index.css; only real numbers go in.

// Green at 80% and up, lemon from 50%, pink under 50% (the reports' bands),
// so the color agrees with the words "Mastered", "Practicing", "Not yet".
export const bandColor = (p: number) => (p >= 80 ? 'var(--kelly)' : p >= 50 ? 'var(--lemon)' : 'var(--pink-punch)');

// Soft fills that cycle across students, classes and groups.
export const SOFT = ['var(--color-gamify)', 'var(--blue-crystal)', 'var(--blush)', 'var(--butter)', 'var(--mint)', 'var(--peach)', 'var(--aqua)', 'var(--lavender)'];
export const EDGE = ['var(--grape)', 'var(--sky)', 'var(--pink-punch)', 'var(--kelly)', 'var(--lemon)'];

export function Tip({ text }: { text: string }) {
  return <span data-tip={text} aria-label={text} role="img" tabIndex={0} className="inline-grid place-items-center text-muted rounded-full"><Info weight="bold" size={15} /></span>;
}

export function PortalCard({ title, tip, right, children, className = '', labelledBy }: { title?: ReactNode; tip?: string; right?: ReactNode; children: ReactNode; className?: string; labelledBy?: string }) {
  return (
    <section aria-labelledby={labelledBy} className={`min-w-0 flex flex-col bg-surface border-std border-border rounded-[1.125rem] p-4 shadow-[0_3px_0_var(--color-border)] ${className}`}>
      {title && (
        <header className="flex flex-wrap items-center gap-2 mb-2.5">
          <h2 id={labelledBy} className="font-heading font-bold text-base m-0">{title}</h2>
          {tip && <Tip text={tip} />}
          <span className="flex-1" />
          {right}
        </header>
      )}
      {children}
    </section>
  );
}

export function Chip({ children, bg = 'var(--cream)', className = '' }: { children: ReactNode; bg?: string; className?: string }) {
  return <span className={`min-h-7 px-2.5 rounded-pill text-[0.8125rem] font-semibold inline-flex items-center gap-1.5 whitespace-nowrap ${className}`} style={{ background: bg }}>{children}</span>;
}

// A thin first-try meter with its number beside it.
export function FirstTryBar({ pct, width = '5rem', label }: { pct: number; width?: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-bold tabular-nums whitespace-nowrap">
      <span role="img" aria-label={label} className="inline-block h-2.5 rounded-pill overflow-hidden bg-[var(--cream)] shadow-[inset_0_0_0_1px_rgba(29,26,51,0.12)]" style={{ width }}>
        <span className="block h-full rounded-pill" style={{ width: `${pct}%`, background: bandColor(pct) }} />
      </span>
      {pct}%
    </span>
  );
}

// The plain-language takeaway (Lightbulb on butter), with an optional action.
export function Takeaway({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="mt-auto flex flex-wrap items-center gap-3 rounded-input px-3 py-2 bg-butter">
      <Lightbulb weight="bold" size={18} className="shrink-0" aria-hidden="true" />
      <p className="m-0 flex-1 min-w-40 text-sm font-bold leading-snug">{text}</p>
      {action}
    </div>
  );
}

// First-try numbers over a slice of the log (left-early answers do not count).
export function firstTry(entries: QuestionLogEntry[]): { answered: number; pct: number } {
  const done = entries.filter((e) => e.outcome !== 'left');
  return { answered: done.length, pct: percent(done.filter((e) => e.outcome === 'right' && e.tries.length <= 1).length, done.length) };
}

export const lastDay = (entries: QuestionLogEntry[]) => entries.reduce((d, e) => (e.at > d ? e.at : d), '').slice(0, 10);

export function fmtDay(d: string, today = new Date().toISOString().slice(0, 10)): string {
  if (!d) return '';
  if (d === today) return 'Today';
  return new Date(`${d}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

// Skills by Common Core standard, from the standards on each set played
// (portal 7c): Mastered is 80% or more on first try over at least 10
// questions, Practicing 50 to 79% (or 80% on fewer than 10), Not yet under
// 50%. A standard needs 5 answers before it is rated at all.
export type SkillBand = 'mastered' | 'practicing' | 'notYet';
export function skillsOf(entries: QuestionLogEntry[], sets: QuestionSet[]): { standard: string; pct: number; answered: number; band: SkillBand }[] {
  const stds = new Map(sets.map((s) => [s.id, s.standards ?? []]));
  const by = new Map<string, QuestionLogEntry[]>();
  for (const e of entries) for (const st of stds.get(e.setId ?? '') ?? []) by.set(st, [...(by.get(st) ?? []), e]);
  return [...by].map(([standard, es]) => {
    const { answered, pct } = firstTry(es);
    const band: SkillBand = pct >= 80 && answered >= 10 ? 'mastered' : pct >= 50 ? 'practicing' : 'notYet';
    return { standard, pct, answered, band };
  }).filter((s) => s.answered >= 5).sort((a, b) => a.standard.localeCompare(b.standard));
}

// Weekly first-try percent (weeks start on Monday), oldest first.
export function weekly(entries: QuestionLogEntry[]): { week: string; label: string; pct: number; answered: number }[] {
  const by = new Map<string, QuestionLogEntry[]>();
  for (const e of entries) {
    const d = new Date(e.at);
    const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
    const k = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
    by.set(k, [...(by.get(k) ?? []), e]);
  }
  return [...by].sort((a, b) => a[0].localeCompare(b[0])).map(([week, es]) => ({
    week, label: new Date(`${week}T12:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), ...firstTry(es),
  })).filter((w) => w.answered > 0);
}
