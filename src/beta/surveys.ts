import { data } from '../data';

// Built-in beta surveys (development plan Stage 7): a short teacher survey at
// week 1, month 1 and month 3 of using Gamify, and anonymous class check-ins
// with picture answers. Saved on this device for now; they move to the cloud
// with accounts (Stage 5) so the owner dashboard sees every teacher's.

export const SURVEYS = [
  { id: 'week-1', afterDays: 7 },
  { id: 'month-1', afterDays: 30 },
  { id: 'month-3', afterDays: 90 },
] as const;
export type SurveyId = (typeof SURVEYS)[number]['id'];

export interface SurveyAnswer { id: SurveyId; at: string; going: number; recommend: number; better: string }
// gameId: a review given at the end of one game (teacher, 2026-10-26).
export interface CheckIn { at: string; classroomId: string; gameId?: string; feel: [number, number, number]; level: [number, number, number] }

const FIRST_USE = 'beta-first-use';
const ANSWERS = 'beta-surveys';
const SNOOZE = 'beta-snooze';
const CHECKINS = 'beta-checkins';
const DAY = 86400000;

// The survey due now: the latest one whose day has come and isn't answered.
// "Not now" snoozes for 3 days. Only one shows at a time.
export function dueSurvey(firstUse: string, now: Date, answered: string[], snoozedUntil?: string): SurveyId | null {
  if (snoozedUntil && now.toISOString() < snoozedUntil) return null;
  const days = (now.getTime() - new Date(firstUse).getTime()) / DAY;
  const due = SURVEYS.filter((s) => days >= s.afterDays && !answered.includes(s.id));
  return due.length ? due[due.length - 1].id : null;
}

export async function surveyDue(now = new Date()): Promise<SurveyId | null> {
  let first = await data.getSetting<string>(FIRST_USE);
  if (!first) { first = now.toISOString(); await data.setSetting(FIRST_USE, first); }
  const answers = (await data.getSetting<SurveyAnswer[]>(ANSWERS)) ?? [];
  return dueSurvey(first, now, answers.map((a) => a.id), await data.getSetting<string>(SNOOZE));
}
export async function saveSurvey(answer: SurveyAnswer) {
  const answers = (await data.getSetting<SurveyAnswer[]>(ANSWERS)) ?? [];
  await data.setSetting(ANSWERS, [...answers.filter((a) => a.id !== answer.id), answer]);
}
export const snoozeSurvey = (now = new Date()) => data.setSetting(SNOOZE, new Date(now.getTime() + 3 * DAY).toISOString());
export const listSurveys = async () => (await data.getSetting<SurveyAnswer[]>(ANSWERS)) ?? [];

export async function saveCheckIn(c: CheckIn) {
  if (c.feel.every((n) => n === 0)) return;
  await data.setSetting(CHECKINS, [...((await data.getSetting<CheckIn[]>(CHECKINS)) ?? []), c]);
}
export const listCheckIns = async () => (await data.getSetting<CheckIn[]>(CHECKINS)) ?? [];

// Recommend score: % who'd tell a colleague (9-10) minus % who wouldn't (0-6).
export function recommendScore(scores: number[]): number | null {
  if (!scores.length) return null;
  const yes = scores.filter((s) => s >= 9).length, no = scores.filter((s) => s <= 6).length;
  return Math.round(((yes - no) / scores.length) * 100);
}
