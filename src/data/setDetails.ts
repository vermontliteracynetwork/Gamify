import type { QuestionSet } from './types';

// Question set details every set needs before it can be played or assigned
// (teacher rule, 2026-10-24): subject, grades, tags and Common Core
// standards (or "no Common Core standard" for subjects it doesn't cover).
// They drive the set filters in every game and the teacher library.

export const SUBJECTS = ['Reading', 'Writing', 'Language', 'Math', 'Science', 'Social studies', 'Other'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const GRADES = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'College'] as const;
export type Grade = (typeof GRADES)[number];
export const gradeIndex = (g: Grade) => GRADES.indexOf(g);
export const gradeLabel = ([from, to]: [Grade, Grade]) => (from === to ? from : `${from}-${to}`);

export interface SetDetails {
  subject?: Subject;
  grades?: [Grade, Grade];
  tags?: string[];
  standards?: string[];
  // True when no Common Core standard applies (science, social studies...).
  noStandard?: boolean;
  // A teacher's cover picture; without one, a cover is drawn for the subject.
  cover?: string;
}

export function missingDetails(set: QuestionSet): string[] {
  const missing: string[] = [];
  if (!set.name.trim()) missing.push('name');
  if (!set.subject) missing.push('subject');
  if (!set.grades) missing.push('grades');
  if (!set.tags?.length) missing.push('tags');
  if (!set.standards?.length && !set.noStandard) missing.push('standards');
  return missing;
}

export const inGrade = (set: QuestionSet, g: Grade) =>
  !!set.grades && gradeIndex(set.grades[0]) <= gradeIndex(g) && gradeIndex(g) <= gradeIndex(set.grades[1]);

export interface SetFilter { search?: string; subject?: Subject; grade?: Grade; standard?: string; tags?: string[] }

export function matchesFilter(set: QuestionSet, f: SetFilter): boolean {
  const q = f.search?.trim().toLowerCase();
  const std = f.standard?.trim().toLowerCase();
  return (!q || set.name.toLowerCase().includes(q) || (set.tags ?? []).some((tag) => tag.toLowerCase().includes(q)))
    && (!f.subject || set.subject === f.subject)
    && (!f.grade || inGrade(set, f.grade))
    && (!std || (set.standards ?? []).some((s) => s.toLowerCase().includes(std)))
    && (f.tags ?? []).every((tag) => (set.tags ?? []).includes(tag));
}

// Common Core domains (codes and names only), used to build a standard code
// like RF.1.3 or 2.OA.2. Common Core State Standards (c) 2010 National
// Governors Association Center for Best Practices and Council of Chief State
// School Officers; logged in docs/asset-ledger.md.
export const ELA_DOMAINS: Record<string, string> = {
  RL: 'Reading: Literature', RI: 'Reading: Informational Text', RF: 'Reading: Foundational Skills',
  W: 'Writing', SL: 'Speaking and Listening', L: 'Language',
};
export const MATH_DOMAINS: Record<string, string> = {
  CC: 'Counting and Cardinality', OA: 'Operations and Algebraic Thinking', NBT: 'Number and Operations in Base Ten',
  NF: 'Number and Operations: Fractions', MD: 'Measurement and Data', G: 'Geometry', RP: 'Ratios and Proportional Relationships',
  NS: 'The Number System', EE: 'Expressions and Equations', F: 'Functions', SP: 'Statistics and Probability',
};
export const HS_MATH: Record<string, string> = { N: 'Number and Quantity', A: 'Algebra', F: 'Functions', G: 'Geometry', S: 'Statistics and Probability' };

export function mathDomainsFor(grade: Grade): string[] {
  const i = gradeIndex(grade);
  if (grade === 'K') return ['CC', 'OA', 'NBT', 'MD', 'G'];
  if (i <= 2) return ['OA', 'NBT', 'MD', 'G'];
  if (i <= 5) return ['OA', 'NBT', 'NF', 'MD', 'G'];
  if (i <= 7) return ['RP', 'NS', 'EE', 'G', 'SP'];
  if (i === 8) return ['NS', 'EE', 'F', 'G', 'SP'];
  return [];
}
export function elaDomainsFor(grade: Grade): string[] {
  return gradeIndex(grade) <= 5 ? ['RL', 'RI', 'RF', 'W', 'SL', 'L'] : ['RL', 'RI', 'W', 'SL', 'L'];
}
// ELA grades 9-12 are written in bands (RL.9-10.4).
export const elaGradeCode = (g: Grade) => (['9', '10'].includes(g) ? '9-10' : ['11', '12'].includes(g) ? '11-12' : g);

const STANDARD = /^((RL|RI|RF|W|SL|L|RH|RST|WHST)\.(K|[1-8]|9-10|11-12|6-8)\.\d{1,2}[a-z]?|(K|[1-8])\.(CC|OA|NBT|NF|MD|G|RP|NS|EE|F|SP)(\.[A-D])?\.\d{1,2}[a-z]?|HS[NAFGS]-[A-Z]{2,4}\.[A-D]?\.?\d{1,2}|[NAFGS]-[A-Z]{2,4}\.[A-D]?\.?\d{1,2}[a-z]?)$/;
export const isStandardCode = (code: string) => STANDARD.test(code.trim());
