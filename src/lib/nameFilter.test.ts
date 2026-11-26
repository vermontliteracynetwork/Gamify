import { describe, expect, it } from 'vitest';
import { isBlockedName } from './nameFilter';

describe('isBlockedName', () => {
  it('blocks rude words, look-alike spellings and stretched letters', () => {
    for (const n of ['fuck', 'FUUUCK', 'f u c k', 'sh1t', 'b!tch', 'big ass', 'Kill', 'xxshitxx']) expect(isBlockedName(n), n).toBe(true);
  });
  it('allows ordinary names and words that only contain a short blocked word', () => {
    for (const n of ['Ava', 'Cassie', 'Ashton', 'Grape', 'Raccoon', 'Skill', 'Cucumber', 'Peacock', 'Spice', 'Scrap', 'Hello Kitty', 'Shelly', 'Dickens', 'Matilda', 'Bob', 'Kirk', 'Popcorn', 'Assia', 'Hello']) expect(isBlockedName(n), n).toBe(false);
  });
});
