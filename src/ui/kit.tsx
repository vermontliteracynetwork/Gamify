import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Title from './Title';

// Shared pieces in the platform's sticker style. Touch targets are at least
// 44px tall (iPad first).

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-accent hover:bg-accent-hover text-accent-ink border-border',
  secondary: 'bg-surface-2 hover:bg-secondary text-text border-border',
  ghost: 'bg-transparent hover:bg-surface-2 text-text border-transparent',
  danger: 'bg-surface hover:bg-danger text-text border-border',
};

// Also used on links that look like buttons (never a button inside a link).
export function buttonClasses(variant: Variant = 'secondary', className = ''): string {
  return `inline-flex items-center justify-center gap-2 min-h-11 px-4 rounded-pill border-[2px] font-bold text-sm no-underline
          active:scale-95 motion-safe:transition disabled:opacity-50 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`;
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" {...props} className={buttonClasses(variant, className)} />;
}

// A round button that shows only its icon; its words show on hover or
// keyboard focus and are read aloud (teacher, 2026-10-31: "if a button can
// have an icon, put an icon and do hover text").
export function IconButton({ label, children, variant = 'secondary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; variant?: Variant; children: ReactNode }) {
  return (
    <button type="button" aria-label={label} data-tip={label} {...props}
      className={`shrink-0 w-11 h-11 rounded-full border-[2px] flex items-center justify-center active:scale-95 motion-safe:transition disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${className}`}>
      {children}
    </button>
  );
}

export function Panel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section className={`bg-surface border-[2.5px] border-border rounded-panel p-5 ${className}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
      <div className="min-w-0">
        <h1 className="title-bubble text-3xl sm:text-4xl tracking-tight"><Title text={title} /></h1>
        {subtitle && <p className="text-text font-bold mt-1">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Tabs<T extends string>({ value, options, onChange, label }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap max-w-full gap-1 p-1 rounded-[1.75rem] bg-surface border-[2px] border-border mb-5">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          role="tab"
          aria-selected={value === o.id}
          onClick={() => onChange(o.id)}
          className={`min-h-11 px-4 rounded-pill font-bold text-sm ${value === o.id ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-2'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
