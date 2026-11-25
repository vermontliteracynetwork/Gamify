import type { ReactNode } from 'react';
import { CaretDown } from '@phosphor-icons/react';

// The one accordion (approved /brand Info page template, owner 2026-11-25):
// a single Paper card, the questions split by soft lines, a chevron that turns
// when a row opens. Used by the FAQ, Pricing Good to Know, Schools and
// Homeschool, so every folded answer looks and works the same (Jakob's law;
// consistency lowers the cost of learning a page). Native details/summary, so
// it opens with Enter or Space and needs no script.
export interface AccordionItem { id: string; title: ReactNode; body: ReactNode; tag?: ReactNode }

export default function Accordion({ items, className = '' }: { items: AccordionItem[]; className?: string }) {
  return (
    <div className={`bg-surface border-std border-border rounded-panel divide-y-[1.5px] divide-border-soft ${className}`}>
      {items.map((it) => (
        <details key={it.id} className="group px-5 py-4">
          <summary className="cursor-pointer flex items-start gap-3 list-none [&::-webkit-details-marker]:hidden font-bold text-lg">
            <span className="flex-1">{it.title}</span>
            {it.tag}
            <CaretDown weight="bold" size={20} className="shrink-0 mt-1 motion-safe:transition-transform group-open:rotate-180" aria-hidden="true" />
          </summary>
          <div className="font-semibold leading-relaxed mt-2 mb-0 text-text/90 [&>p]:m-0">{it.body}</div>
        </details>
      ))}
    </div>
  );
}
