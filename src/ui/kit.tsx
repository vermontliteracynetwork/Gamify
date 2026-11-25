import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Title from './Title';

// Shared pieces in the platform's sticker style. Touch targets are at least
// 44px tall (iPad first).

// The button colors (New direction rule 9, teacher approved 2026-11-25):
// 'primary' (alias 'go') is the yellow #FDFD94 go button with ink text, only
// for go actions (Start, Next, Play, Join, Continue into a game, Play again);
// 'main' is Grape with white text, every other main action (Save, Create,
// Add, Import, Print, Download, Assign, Use, Send); 'secondary' is white,
// for Back and everything else. White text only on Grape (5.6:1, WCAG AA).
export type Variant = 'primary' | 'go' | 'main' | 'secondary' | 'ghost' | 'danger';
const GO = 'bg-accent hover:bg-accent-hover text-accent-ink border-border shadow-[0_3px_0_var(--ink)]';
const VARIANTS: Record<Variant, string> = {
  primary: GO,
  go: GO,
  main: 'bg-grape hover:bg-grape-deep text-white border-border shadow-[0_3px_0_var(--grape-deep)]',
  secondary: 'bg-white hover:bg-surface-hover text-text border-border shadow-[0_3px_0_var(--ink)]',
  ghost: 'bg-transparent hover:bg-surface-2 text-text border-transparent',
  danger: 'bg-white hover:bg-danger text-text border-border',
};

// Three button sizes (design system, 2026-11-18): sm 36px for compact bars,
// md 44px (the touch minimum) for most buttons, lg 56px for a screen's one
// big action. Also used on links that look like buttons (never a button
// inside a link).
export type ButtonSize = 'sm' | 'md' | 'lg';
const SIZES: Record<ButtonSize, string> = { sm: 'min-h-9 px-3 text-sm tap', md: 'min-h-11 px-4 text-sm', lg: 'min-h-14 px-6 text-lg' };
export function buttonClasses(variant: Variant = 'secondary', className = '', size: ButtonSize = 'md'): string {
  return `inline-flex items-center justify-center gap-2 ${SIZES[size]} rounded-pill border-std font-bold no-underline
          active:scale-95 motion-safe:transition disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none ${VARIANTS[variant]} ${className}`;
}

export function Button({ variant = 'secondary', size = 'md', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: ButtonSize }) {
  return <button type="button" {...props} className={buttonClasses(variant, className, size)} />;
}

// A round button that shows only its icon; its words show on hover or
// keyboard focus and are read aloud (teacher, 2026-10-31: "if a button can
// have an icon, put an icon and do hover text").
export function IconButton({ label, children, variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} data-tip={label} {...props}
      className={`shrink-0 w-11 h-11 rounded-full border-std flex items-center justify-center active:scale-95 motion-safe:transition disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}>
      {children}
    </button>
  );
}

// The one look for text boxes and dropdowns (design system, 2026-11-18):
// md for teacher forms, sm for compact filter bars.
export type FieldSize = 'sm' | 'md';
export function fieldClasses(size: FieldSize = 'md', className = ''): string {
  return `${size === 'sm' ? 'min-h-9 px-2.5 text-sm tap' : 'min-h-11 px-3'} rounded-input border-std border-border bg-surface font-bold ${className}`;
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-surface border-bold border-border rounded-panel p-5 ${className}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="title-bubble text-2xl sm:text-3xl tracking-tight"><Title text={title} /></h1>
        {subtitle && <p className="text-text font-bold mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// The one tab bar (design system, 2026-11-18). size sm for compact bars
// (question set tabs), md for page tabs; fill stretches the tabs across the
// bar; panelIds links each tab to its panel (`tab-<id>` / `panel-<id>`).
export function Tabs<T extends string>({ value, options, onChange, label, size = 'md', fill = false, panelIds = false, className = 'mb-5' }: {
  value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string; size?: 'sm' | 'md'; fill?: boolean; panelIds?: boolean; className?: string;
}) {
  return (
    <div role="tablist" aria-label={label} className={`${fill ? 'flex' : 'inline-flex flex-wrap max-w-full'} ${size === 'sm' ? 'gap-0.5 p-0.5' : 'gap-1 p-1'} rounded-[1.75rem] bg-surface border-std border-border ${className}`}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          id={panelIds ? `tab-${o.id}` : undefined}
          aria-controls={panelIds && value === o.id ? `panel-${o.id}` : undefined}
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`${size === 'sm' ? `min-h-9 tap ${fill ? 'px-2 text-sm' : 'px-3 text-sm'}` : 'min-h-11 px-4 text-sm'} rounded-pill font-bold whitespace-nowrap ${fill ? 'flex-auto' : ''} motion-safe:transition-colors ${value === o.id ? 'bg-butter text-text' : 'text-text hover:bg-surface-2'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
