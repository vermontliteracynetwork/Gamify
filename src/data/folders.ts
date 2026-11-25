import { inGrade, GRADES, type Grade, type Subject } from './setDetails';
import type { QuestionSet } from './types';

// Question set folders (teacher, 2026-11-24: "folders and editing question
// sets"; approved teacher portal 6a). A set's folder is a name saved on the
// set itself. Folder names the teacher made before moving a set in are kept in
// the teacher's settings under FOLDERS_KEY, so an empty folder stays put.
export const FOLDERS_KEY = 'setFolders';

export const cleanFolder = (name: string) => name.trim().replace(/\s+/g, ' ').slice(0, 40);

// Every folder, A to Z: the saved names plus any a set is in (case does
// not make a second folder).
export function folderNames(sets: Pick<QuestionSet, 'folder'>[], saved: string[] = []): string[] {
  const names = new Map<string, string>();
  for (const n of [...saved, ...sets.map((s) => s.folder ?? '')]) { const c = cleanFolder(n); if (c && !names.has(c.toLowerCase())) names.set(c.toLowerCase(), c); }
  return [...names.values()].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
}

export const hasFolder = (names: string[], name: string, except?: string) =>
  names.some((n) => n.toLowerCase() === cleanFolder(name).toLowerCase() && n !== except);

// The filter facets for the teacher's own sets (subject, grade, standard).
// Standards group by their family (L.1.2a and L.1.2c are L.1.2; 2.OA.B.2 is
// 2.OA) so the chips stay few.
export function standardGroup(code: string): string {
  const parts = code.trim().split('.');
  if (/^(\d|K\.)/.test(code)) return parts.slice(0, 2).join('.');
  return parts.slice(0, 3).join('.').replace(/(\.\d+)[a-z]+$/, '$1');
}

export interface Facets { subject?: Subject; grade?: Grade; standard?: string; search?: string }

export function facetOptions(sets: QuestionSet[]): { subjects: Subject[]; grades: Grade[]; standards: string[] } {
  const subjects = [...new Set(sets.map((s) => s.subject).filter((s): s is Subject => !!s))].sort();
  const grades = GRADES.filter((g) => sets.some((s) => inGrade(s, g)));
  const counts = new Map<string, number>();
  for (const s of sets) for (const g of new Set((s.standards ?? []).map(standardGroup))) counts.set(g, (counts.get(g) ?? 0) + 1);
  const standards = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 10).map(([g]) => g);
  return { subjects, grades, standards };
}

export function matchesFacets(set: QuestionSet, f: Facets): boolean {
  const q = f.search?.trim().toLowerCase();
  return (!q || set.name.toLowerCase().includes(q) || (set.tags ?? []).some((t) => t.toLowerCase().includes(q)))
    && (!f.subject || set.subject === f.subject)
    && (!f.grade || inGrade(set, f.grade))
    && (!f.standard || (set.standards ?? []).some((s) => standardGroup(s) === f.standard));
}

export const inFolder = (set: Pick<QuestionSet, 'folder'>, name: string) => cleanFolder(set.folder ?? '').toLowerCase() === cleanFolder(name).toLowerCase();
