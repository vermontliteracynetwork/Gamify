// Headings (teacher rule, 2026-10-24): Title Case, with small words like
// "the" and "of" left lowercase unless they come first or last, and every
// capital G drawn as the G from the Gamify logo. Screen readers get the
// plain words. Spanish headings keep sentence case, as Spanish does.

import { language } from '../i18n';

const SMALL = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'into', 'nor', 'of', 'on', 'or', 'per', 'so', 'the', 'to', 'up', 'via', 'vs', 'with', 'yet']);

export function titleCase(text: string): string {
  const words = text.split(/(\s+)/);
  const real = words.map((w, i) => (/\S/.test(w) ? i : -1)).filter((i) => i >= 0);
  const first = real[0], last = real[real.length - 1];
  return words.map((w, i) => {
    if (!/\S/.test(w)) return w;
    const bare = w.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '').toLowerCase();
    // After a colon a new phrase starts, so its first word is capitalized too.
    const afterColon = i > 1 && /:$/.test(words[i - 2] ?? '');
    if (SMALL.has(bare) && i !== first && i !== last && !afterColon) return w;
    return w.replace(/\p{L}/u, (c) => c.toUpperCase());
  }).join('');
}

export default function Title({ text }: { text: string }) {
  const cased = language() === 'en' ? titleCase(text) : text;
  if (!cased.includes('G')) return <>{cased}</>;
  return (
    <>
      <span className="sr-only">{cased}</span>
      <span aria-hidden="true">
        {cased.split(/(\s+)/).map((word, w) => word.includes('G')
          // A word with a logo G stays on one line.
          ? <span key={w} className="whitespace-nowrap">{word.split('G').map((part, i) => <span key={i}>{i > 0 && <span className="logo-g" />}{part}</span>)}</span>
          : word)}
      </span>
    </>
  );
}
