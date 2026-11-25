import type { ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';

// A dropdown that looks like a filter pill ("Game: All games ▾"), from the
// /brand Themes gallery and Blog mockups. A real <select> underneath, so the
// keyboard, screen readers and touch pickers all work as usual; the label
// stays visible inside the pill.
export default function PillSelect({ label, value, onChange, children, active }: { label: string; value: string; onChange: (v: string) => void; children: ReactNode; active?: boolean }) {
  return (
    <label className={`hover-pop relative inline-flex items-center gap-1.5 min-h-11 pl-4 pr-9 rounded-pill border-std border-border font-bold text-sm cursor-pointer ${active ? 'bg-butter' : 'bg-surface'}`}>
      <span>{label}:</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="appearance-none bg-transparent border-0 font-bold text-sm cursor-pointer pr-1 rounded-pill">
        {children}
      </select>
      <CaretDown weight="bold" size={14} aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
    </label>
  );
}
