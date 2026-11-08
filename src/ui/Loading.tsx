import { motion } from 'motion/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';

// The loading screen (engagement audit, 2026-11-08): never a blank page.
// Four colored game pieces hop in turn over a little shadow.
const COLORS = ['#f6c544', '#5cc3a0', '#6aa9e9', '#ef7d96'];
export default function Loading({ tall = true }: { tall?: boolean }) {
  const still = useSettings().settings.motion === 'still';
  return (
    <div className={`grid place-items-center ${tall ? 'min-h-[60dvh]' : 'py-10'}`} aria-busy="true" role="status" aria-label={t('load.ready')}>
      <div className="grid justify-items-center gap-4">
        <div className="flex gap-3 items-end h-16">
          {COLORS.map((c, i) => (
            <span key={c} className="relative grid justify-items-center">
              <motion.span className="w-9 h-9 rounded-full border-[3px] border-border block" style={{ background: c }}
                animate={still ? undefined : { y: [0, -26, 0, 0], scaleY: [1, 1.08, 0.8, 1], scaleX: [1, 0.94, 1.15, 1], rotate: [0, i % 2 ? 12 : -12, 0, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, times: [0, 0.4, 0.75, 1], ease: 'easeOut' }} />
              <span className="mt-1 w-7 h-1.5 rounded-[50%] bg-black/20" />
            </span>
          ))}
        </div>
        <span className="font-display text-2xl font-bold">{t('load.ready')}</span>
      </div>
    </div>
  );
}
