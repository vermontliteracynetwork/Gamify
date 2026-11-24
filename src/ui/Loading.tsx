import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import Meter from './Meter';

// THE loading screen (Brand Kit More screens, approved 2026-11-24): the simple
// Classic die hops and turns to a new face, "Getting ready" in Grow Year and
// the meter filling. Never a blank page.
const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]], 2: [[29, 29], [71, 71]], 3: [[27, 27], [50, 50], [73, 73]],
  4: [[29, 29], [71, 29], [29, 71], [71, 71]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]],
  6: [[30, 25], [70, 25], [30, 50], [70, 50], [30, 75], [70, 75]],
};
export function DieFace({ value, size }: { value: number; size: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      <rect x="8" y="8" width="84" height="84" rx="22" fill="#fffaf0" stroke="var(--color-border)" strokeWidth="4" />
      {PIPS[value].map(([x, y], k) => <circle key={k} cx={x} cy={y} r={value === 1 ? 11 : 8} fill="var(--color-border)" />)}
    </svg>
  );
}

export default function Loading({ tall = true }: { tall?: boolean }) {
  const still = useSettings().settings.motion === 'still';
  const [face, setFace] = useState(1);
  const [part, setPart] = useState(0.15);
  useEffect(() => {
    const id = window.setInterval(() => { setFace((f) => (f % 6) + 1); setPart((p) => (p >= 0.95 ? 0.15 : p + 0.2)); }, 700);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className={`grid place-items-center ${tall ? 'min-h-[60dvh]' : 'py-10'}`} aria-busy="true" role="status" aria-label={t('load.ready')}>
      <div className="grid justify-items-center gap-5">
        <motion.span animate={still ? undefined : { rotate: [0, -10, 8, 0], y: [0, -14, 0, 0] }} transition={{ duration: 0.7, repeat: Infinity, ease: 'easeInOut' }}>
          <DieFace value={face} size={110} />
        </motion.span>
        <span className="title-bubble text-4xl">{t('load.ready')}</span>
        <span className="w-[min(20rem,80vw)] flex"><Meter segments={1} done={0} part={part} label={t('load.ready')} /></span>
      </div>
    </div>
  );
}
