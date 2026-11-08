import { motion } from 'motion/react';
import { Fragment, useMemo } from 'react';
import { useSettings } from '../settings/SettingsContext';

// Animated text (engagement audit, 2026-11-08): each letter springs in with
// its own little tilt, so a message lands loud and alive. Words never break
// in the middle. Still motion shows the plain text.
export default function PopText({ text, className, gold = false, delay = 0 }: { text: string; className?: string; gold?: boolean; delay?: number }) {
  const still = useSettings().settings.motion === 'still';
  const tilts = useMemo(() => Array.from(text, (_, i) => ((i * 47) % 21) - 10), [text]);
  if (still || !text) return <span className={className}>{text}</span>;
  let k = 0;
  return (
    <span className={className} aria-label={text}>
      {text.split(' ').map((word, w) => (
        <Fragment key={w}>{w > 0 && ' '}<span aria-hidden="true" className="inline-block whitespace-nowrap">
          {Array.from(word).map((ch) => {
            const i = k++;
            return (
              <motion.span key={i} className={`inline-block ${gold ? 'pop-gold' : ''}`} initial={{ y: '-60%', scale: 0.2, opacity: 0, rotate: tilts[i] * 3 }}
                animate={{ y: '0%', scale: 1, opacity: 1, rotate: tilts[i] * 0.25 }} transition={{ type: 'spring', stiffness: 520, damping: 14, delay: delay + i * 0.025 }}>{ch}</motion.span>
            );
          })}
        </span></Fragment>
      ))}
    </span>
  );
}
