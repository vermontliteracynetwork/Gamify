import { NavLink } from 'react-router-dom';
import { PaintBrush, Stack } from '@phosphor-icons/react';
import { t } from '../i18n';

// The teacher pages: question sets and the Theme Builder (more in Stage 4).
export default function TeacherNav() {
  const link = ({ isActive }: { isActive: boolean }) =>
    `min-h-11 px-4 rounded-pill font-bold text-sm inline-flex items-center gap-1.5 no-underline ${isActive ? 'bg-accent text-accent-ink' : 'text-text hover:bg-surface-2'}`;
  return (
    <nav aria-label={t('teacherNav.label')} className="inline-flex flex-wrap gap-1 p-1 rounded-pill bg-surface border-[2px] border-border mb-6">
      <NavLink to="/teacher/sets" className={link}><Stack weight="bold" size={16} />{t('teacherNav.sets')}</NavLink>
      <NavLink to="/teacher/themes" className={link}><PaintBrush weight="bold" size={16} />{t('teacherNav.themes')}</NavLink>
    </nav>
  );
}
