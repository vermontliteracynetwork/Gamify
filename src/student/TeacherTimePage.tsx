import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { Star } from '@phosphor-icons/react';
import { t } from '../i18n';
import Title from '../ui/Title';
import { useSession } from './session';

// When the teacher's clock runs out (2026-10-31): a view-only screen with
// nothing to tap, so every student looks up. The teacher opens the next
// activity with a new code.
export default function TeacherTimePage() {
  const session = useSession();
  const reduce = useReducedMotion();
  return (
    <main className="min-h-[calc(100dvh-4rem)] grid content-center justify-items-center gap-5 px-4 text-center">
      {/* Eyes up here (Brand Kit, approved 2026-11-24): a big yellow star bobbing on a
          soft Butter blob, nothing to tap. */}
      <span className="relative grid place-items-center w-56 h-56" aria-hidden="true">
        <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full"><path d="M50 4 C74 4 96 18 96 50 C96 82 74 96 50 96 C26 96 4 82 4 50 C4 18 26 4 50 4 Z" fill="var(--butter)" /></svg>
        <motion.span className="relative" animate={reduce ? undefined : { y: [0, -10, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
          <Star weight="fill" size={112} color="var(--lemon)" style={{ filter: 'drop-shadow(0 4px 0 var(--color-border))' }} />
        </motion.span>
      </span>
      <h1 className="title-bubble text-5xl sm:text-6xl"><Title text={t('clock.lookUp')} /></h1>
      <p className="font-bold text-xl">{session?.name ? t('clock.lookUpName', { name: session.name }) : t('clock.lookUpSub')}</p>
    </main>
  );
}
