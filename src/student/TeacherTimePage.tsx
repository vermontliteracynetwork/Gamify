import { motion, useReducedMotion } from 'motion/react';
import { ChalkboardTeacher } from '@phosphor-icons/react';
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
      <motion.span className="w-32 h-32 rounded-full bg-surface border-[3px] border-border flex items-center justify-center" style={{ boxShadow: 'var(--shadow-sticker)' }}
        animate={reduce ? undefined : { y: [0, -8, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}>
        <ChalkboardTeacher weight="fill" size={72} aria-hidden="true" />
      </motion.span>
      <h1 className="title-bubble text-5xl"><Title text={t('clock.lookUp')} /></h1>
      <p className="font-bold text-xl">{session?.name ? t('clock.lookUpName', { name: session.name }) : t('clock.lookUpSub')}</p>
    </main>
  );
}
