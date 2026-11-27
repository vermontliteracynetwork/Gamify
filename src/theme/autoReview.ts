import type { GameTheme } from './types';

// The automatic first look at a shared theme (owner, 2026-11-26: "theme
// reviewer should have standard for auto strikes, the rest should be pushed
// to me for review if flagged. also we will have rules for good to push
// automatically"; 2026-11-27: auto strike is rare, for extreme cases, and
// usually it holds for review). Three lanes, from
// docs/community-theme-guidelines.md:
// - approve: nothing flagged, the theme has a real name and its own art;
// - hold: anything a person should look at (brands and characters, photos
//   that may show children, politics, costumes, very little art) goes to the
//   owner's Gallery review;
// - strike: only clear slurs or sexual words in the name, tags or notes.
// Words are matched whole, lower case. The lists are short on purpose: a
// false strike is worse than a false hold.
export type Lane = 'approve' | 'hold' | 'strike';
export interface AutoReview { lane: Lane; why: string }

const STRIKE = ['porn', 'sex', 'nazi', 'kkk', 'slut', 'whore', 'nigger', 'faggot', 'retard', 'rape'];
const HOLD_WORDS = [
  // Brands, characters and other games (the guidelines' removal list).
  'disney', 'pixar', 'marvel', 'avengers', 'spiderman', 'batman', 'superman', 'pokemon', 'pikachu', 'mario', 'nintendo', 'minecraft', 'roblox', 'fortnite', 'barbie', 'elsa', 'frozen', 'bluey', 'paw patrol', 'peppa', 'sonic', 'hello kitty', 'sanrio', 'lego', 'star wars', 'harry potter', 'kahoot', 'blooket', 'baamboozle', 'gimkit', 'wordwall',
  // Politics, weapons, scary, drugs and gambling: a person decides.
  'trump', 'biden', 'harris', 'democrat', 'republican', 'maga', 'election', 'gun', 'guns', 'rifle', 'blood', 'gore', 'zombie', 'kill', 'beer', 'wine', 'vape', 'weed', 'casino', 'poker',
  // Costumes and caricatures to look at (owner, 2026-11-26).
  'pilgrim', 'indian', 'tribal', 'sombrero', 'geisha',
];
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').split(/\s+/).filter(Boolean);

export function autoReview(th: GameTheme): AutoReview {
  const text = [th.name, ...(th.tags ?? [])].join(' ');
  const w = words(text);
  const joined = ` ${w.join(' ')} `;
  if (STRIKE.some((x) => w.includes(x))) return { lane: 'strike', why: 'A word in the name or tags breaks the community rules.' };
  const flagged = HOLD_WORDS.find((x) => joined.includes(` ${x} `));
  if (flagged) return { lane: 'hold', why: `Check for "${flagged}" (brands, politics, costumes or scary content need a person).` };
  if (!th.name.trim() || th.name.trim().length < 3) return { lane: 'hold', why: 'The theme needs a real name.' };
  const pieces = Object.values(th.pieces ?? {});
  const photos = pieces.filter((p) => p.image?.startsWith('data:image/jpeg')).length;
  if (photos > 0) return { lane: 'hold', why: 'Has photos: check that no child, name or school shows.' };
  const art = pieces.filter((p) => p.image || p.color).length;
  if (art < 2) return { lane: 'hold', why: 'Very few pieces changed from Classic.' };
  return { lane: 'approve', why: 'Passed the automatic check.' };
}
