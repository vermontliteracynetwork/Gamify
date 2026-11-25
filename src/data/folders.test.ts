import { describe, expect, it } from 'vitest';
import { facetOptions, folderNames, hasFolder, matchesFacets, standardGroup } from './folders';
import type { QuestionSet } from './types';

const set = (p: Partial<QuestionSet>): QuestionSet => ({ id: 'x', name: 'Set', questions: [], ownerId: 'me', visibility: 'private', createdAt: '', updatedAt: '', ...p });

describe('set folders', () => {
  it('lists saved and used folder names once, A to Z, ignoring blanks', () => {
    expect(folderNames([set({ folder: 'math facts' }), set({}), set({ folder: ' Grammar  unit ' })], ['Science', 'Math facts', ''])).toEqual(['Grammar unit', 'Math facts', 'Science']);
    expect(hasFolder(['Grammar unit'], ' grammar unit')).toBe(true);
    expect(hasFolder(['Grammar unit'], 'Grammar unit', 'Grammar unit')).toBe(false);
  });
  it('groups standards into families', () => {
    expect(['L.1.2a', 'L.1.2c', '2.OA.B.2', 'K.CC.1', 'RF.1.3', 'RL.9-10.4'].map(standardGroup)).toEqual(['L.1.2', 'L.1.2', '2.OA', 'K.CC', 'RF.1.3', 'RL.9-10.4']);
  });
  it('offers only the facets the sets have, and filters by them', () => {
    const a = set({ name: 'Commas', subject: 'Literacy', grades: ['1', '2'], standards: ['L.1.2a', 'L.1.2c'], tags: ['punctuation'] });
    const b = set({ name: 'Adding', subject: 'Math', grades: ['2', '2'], standards: ['2.OA.B.2'] });
    expect(facetOptions([a, b])).toEqual({ subjects: ['Literacy', 'Math'], grades: ['1', '2'], standards: ['2.OA', 'L.1.2'] });
    expect(matchesFacets(a, { standard: 'L.1.2' })).toBe(true);
    expect(matchesFacets(b, { grade: '1' })).toBe(false);
    expect(matchesFacets(a, { search: 'punct' })).toBe(true);
  });
});
