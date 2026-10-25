import { describe, expect, it } from 'vitest';
import { suggestTags, tagCounts } from './tags';

describe('tags', () => {
  const sets = [{ tags: ['fractions', 'review'] }, { tags: ['fractions', 'vocab'] }, { tags: ['review', 'fractions'] }];
  it('ranks tags by how many sets use them', () => expect(tagCounts(sets)).toEqual(['fractions', 'review', 'vocab']));
  it('suggests matches, starts-with first, without chosen ones', () => {
    expect(suggestTags(['review', 'preview', 'vocab'], 'rev')).toEqual(['review', 'preview']);
    expect(suggestTags(['review', 'vocab'], '', ['review'])).toEqual(['vocab']);
    expect(suggestTags(['review'], '#Re')).toEqual(['review']);
  });
});
