import { TIERS, type Tier } from '../config';

// Growth tips (owner dashboard, Stage 7B): plain suggestions from the
// numbers. On one device the numbers are this teacher's; with cloud accounts
// the same rules run over every teacher.
export interface GrowthInput {
  tier: Tier;
  classes: number;
  sets: number;
  answersThisWeek: number;
  answersLastWeek: number;
  surveyAverage: number | null; // how it is going, out of 5
}
export interface Tip { id: string; text: string }

export function growthTips(n: GrowthInput): Tip[] {
  const tips: Tip[] = [];
  const lim = TIERS[n.tier];
  if (n.tier === 'free' && n.classes >= lim.classrooms) tips.push({ id: 'class-limit', text: 'A Free teacher is using their student list. A friendly note about Plus (3 classes to group students) fits here.' });
  if (n.tier === 'free' && n.sets >= lim.savedQuestionSets) tips.push({ id: 'set-limit', text: 'A Free teacher has saved all 3 sets. Plus saves as many as they like.' });
  if (n.tier === 'free' && n.answersThisWeek >= 200) tips.push({ id: 'busy-free', text: 'A busy Free classroom (200+ answers this week): a good beta tester or case study.' });
  if (n.answersLastWeek >= 50 && n.answersThisWeek < n.answersLastWeek / 3) tips.push({ id: 'slowing', text: 'Play dropped by more than two thirds this week. A check-in email could catch a problem early.' });
  if (n.surveyAverage !== null && n.surveyAverage <= 2.5) tips.push({ id: 'unhappy', text: 'Survey answers average 2.5 out of 5 or lower. Read the comments and reply personally.' });
  if (n.surveyAverage !== null && n.surveyAverage >= 4.5) tips.push({ id: 'fan', text: 'Survey answers average 4.5 or higher. Ask for a quote for the website or a referral.' });
  if (n.classes === 0 && n.sets === 0) tips.push({ id: 'not-started', text: 'Signed up but no class or set yet. The Get started steps and a short how-to video help here.' });
  return tips;
}
