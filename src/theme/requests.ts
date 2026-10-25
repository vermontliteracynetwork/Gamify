import { data, newId } from '../data';
import type { GameTheme } from './types';

// Student design mode (development plan Stage 7): students in a class the
// teacher has opened for designing make a theme and send it to the teacher,
// who approves it before anyone plays in it. No student names are kept: an
// approved theme is credited to the class.
export interface ThemeRequest { id: string; classroomId: string; theme: GameTheme; at: string }
const KEY = 'theme-requests';

export const listThemeRequests = async () => (await data.getSetting<ThemeRequest[]>(KEY)) ?? [];
export async function sendThemeRequest(classroomId: string, theme: GameTheme) {
  const all = await listThemeRequests();
  await data.setSetting(KEY, [...all, { id: newId('req'), classroomId, theme, at: new Date().toISOString() }]);
}
export async function removeThemeRequest(id: string) {
  await data.setSetting(KEY, (await listThemeRequests()).filter((r) => r.id !== id));
}
