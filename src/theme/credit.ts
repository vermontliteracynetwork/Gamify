import { getTeacher } from '../auth/session';
import { t } from '../i18n';
import type { GameTheme } from './types';

// Theme credit (teacher, 2026-10-26): a teacher's theme is entered under
// their username, plus (optional) the first name or nickname of the
// student who designed it. Never a full student name.
export function teacherUsername(): string {
  const s = getTeacher();
  return s?.username ?? s?.name ?? '';
}

export function creditLine(th: Pick<GameTheme, 'designedBy' | 'studentDesigner'>): string {
  if (!th.designedBy) return '';
  return th.studentDesigner ? t('themes.creditWithStudent', { name: th.designedBy, student: th.studentDesigner }) : th.designedBy;
}
