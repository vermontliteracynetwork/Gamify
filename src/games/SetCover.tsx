import { BookOpen, Flask, Globe, MathOperations, Shapes, type Icon } from '@phosphor-icons/react';
import type { Subject } from '../data/setDetails';
import type { QuestionSet } from '../data/types';

// A question set's cover: the teacher's picture, or one drawn for its
// subject (brand colors and a subject icon pattern, no bought art).
export const ART: Record<Subject, { icon: Icon; bg: string; ink: string }> = {
  // Palette pastels with ink (New direction rule 1, 2026-11-25).
  Literacy: { icon: BookOpen, bg: '#fff1b8', ink: '#1d1a33' },
  Math: { icon: MathOperations, bg: '#ddd6ff', ink: '#1d1a33' },
  Science: { icon: Flask, bg: '#c8f0dc', ink: '#1d1a33' },
  'Social studies': { icon: Globe, bg: '#ffd9b3', ink: '#1d1a33' },
  Other: { icon: Shapes, bg: '#bfdff3', ink: '#1d1a33' },
};

export default function SetCover({ set, className = '' }: { set: QuestionSet; className?: string }) {
  if (set.cover) return <img src={set.cover} alt="" className={`object-cover w-full ${className}`} />;
  const a = ART[set.subject ?? 'Other'];
  const I = a.icon;
  return (
    <span className={`relative block overflow-hidden w-full ${className}`} style={{ background: a.bg }} aria-hidden="true">
      {[[6, 18, -12, 34], [34, -10, 8, 26], [62, 30, -6, 30], [84, -4, 14, 24], [20, 56, 10, 22], [74, 62, -10, 20]].map(([x, y, r, s], i) => (
        <I key={i} weight={i === 2 ? 'fill' : 'bold'} className="absolute" style={{ left: `${x}%`, top: `${y}%`, width: `${s}%`, height: 'auto', transform: `rotate(${r}deg)`, opacity: i === 2 ? 1 : 0.45 }} color={a.ink} />
      ))}
    </span>
  );
}
