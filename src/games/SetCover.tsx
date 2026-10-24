import { BookOpen, ChatText, Flask, Globe, MathOperations, PencilLine, Shapes, type Icon } from '@phosphor-icons/react';
import type { Subject } from '../data/setDetails';
import type { QuestionSet } from '../data/types';

// A question set's cover: the teacher's picture, or one drawn for its
// subject (brand colors and a subject icon pattern, no bought art).
const ART: Record<Subject, { icon: Icon; bg: string; ink: string }> = {
  Reading: { icon: BookOpen, bg: '#fdfd94', ink: '#314677' },
  Writing: { icon: PencilLine, bg: '#ed9d75', ink: '#000000' },
  Language: { icon: ChatText, bg: '#ddfcc6', ink: '#314677' },
  Math: { icon: MathOperations, bg: '#b4c4fb', ink: '#000000' },
  Science: { icon: Flask, bg: '#ddfcc6', ink: '#000000' },
  'Social studies': { icon: Globe, bg: '#e5635f', ink: '#000000' },
  Other: { icon: Shapes, bg: '#cdd7fb', ink: '#314677' },
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
