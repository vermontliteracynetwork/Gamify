import type { ReactNode } from 'react';
import { ArrowRight } from '@phosphor-icons/react';
import Title from '../ui/Title';

// Scrapbook strength A, the page parts (owner 2026-11-26, from the /brand
// Scrapbook A mockups: "blog index=a blog post=a schools =a ... themes=a").
// A is the clean strength: white cards with the 3px ink outline and the 5px
// ink shadow on the cream ground, Grow Year titles left, a round pastel badge
// per card. No tape, no tilt, and no stickers outside the Home hero (owner,
// 2026-11-26: "remove random stickers from everywhere but the hero"). Public
// pages only, never teacher pages or games ("no scrapbook on any other live
// views or in games at all"). The cream ground itself comes from the shared
// public shell.

// A card: white, 3px ink outline, 5px ink drop (the mockup CARD).
export const sbCard = 'bg-white border-[3px] border-border rounded-panel shadow-[0_5px_0_var(--ink)]';
// The same card when it is a link: it lifts on hover.
export const sbCardLink = `${sbCard} hover-lift no-underline text-text`;

// Never break a word across two lines (owner 2026-11-24): each word stays
// whole, the logo G and hyphenated words included.
export function Words({ text }: { text: string }) {
  return <>{text.split(' ').map((w, i) => <span key={i}>{i ? ' ' : ''}<span className="whitespace-nowrap"><Title text={w} /></span></span>)}</>;
}

// The same for plain text (card titles): hyphenated words stay on one line.
export function Keep({ text }: { text: string }) {
  return <>{text.split(' ').map((w, i) => <span key={i}>{i ? ' ' : ''}{w.includes('-') ? <span className="whitespace-nowrap">{w}</span> : w}</span>)}</>;
}

// The page title and the full-width line under it (owner 2026-11-24/25:
// title left, no kicker, subtext the full page width).
export function SbHead({ title, sub, children }: { title: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="grid gap-4 justify-items-start text-left">
      <h1 className="title-bubble m-0 text-[2.6rem] sm:text-[3.6rem] lg:text-[4.375rem] leading-[0.98]"><Words text={title} /></h1>
      {sub && <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{sub}</p>}
      {children}
    </header>
  );
}

// A section title in Grow Year (the mockup H2).
export function SbH2({ children, id }: { children: string; id?: string }) {
  return <h2 id={id} className="title-bubble m-0 text-[1.875rem] sm:text-[2.625rem] leading-none"><Words text={children} /></h2>;
}

// A card heading in the heading font (the mockup H3).
export function SbH3({ children, as: Tag = 'h3' }: { children: ReactNode; as?: 'h2' | 'h3' }) {
  return <Tag className="m-0 font-heading font-bold text-xl sm:text-[1.4375rem] leading-tight">{children}</Tag>;
}

// The round pastel badge with an icon (the mockup Dot).
export function SbDot({ children, bg, size = 'md' }: { children: ReactNode; bg: string; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'sm' ? 'w-[2.625rem] h-[2.625rem]' : size === 'lg' ? 'w-[3.75rem] h-[3.75rem]' : 'w-12 h-12';
  return <span aria-hidden="true" className={`${s} ${bg} shrink-0 rounded-full grid place-items-center border-bold border-border`}>{children}</span>;
}

// "Read it ->": a bold underlined line with an arrow (the mockup Link_).
export function SbMore({ children }: { children: ReactNode }) {
  return <span className="font-bold text-base sm:text-[1.0625rem] inline-flex items-center gap-1.5 underline underline-offset-4">{children}<ArrowRight weight="bold" size={16} aria-hidden="true" /></span>;
}

// A filter or topic pill (the mockup chips): Butter when on.
export const sbPill = (on: boolean) => `hover-pop min-h-11 px-4 rounded-pill border-bold border-border font-bold text-base inline-flex items-center gap-2 ${on ? 'bg-butter' : 'bg-white'}`;

// The page column: same width and margins on every page (owner 2026-11-25).
export function SbMain({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <main className={`max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 grid gap-12 sm:gap-[3.75rem] ${className}`}>{children}</main>;
}
// One section: its title and cards, 24px apart.
export function SbSection({ children, label, className = '' }: { children: ReactNode; label?: string; className?: string }) {
  return <section aria-labelledby={label} className={`grid gap-6 ${className}`}>{children}</section>;
}
// Pastel badge colors in order (the mockup cycles them per card).
export const SB_PASTELS = ['bg-butter', 'bg-blush', 'bg-mint', 'bg-blue-crystal', 'bg-lavender', 'bg-peach', 'bg-aqua', 'bg-[#e8f0b4]'];
