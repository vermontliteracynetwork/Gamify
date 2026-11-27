import type { ThemeItem } from '../theme/types';

// Power-ups in question-break games (teacher, 2026-10-26: questions interrupt
// play and "effect things but not the actual game play"): a right answer
// sometimes brings one of the theme's power-ups. The chance is the same for
// every game.
export const POWER_UP_CHANCE = 0.35;

// Fair power-ups (owner, 2026-11-27: "always evenly distributed between
// players and of the actual power ups themselves (never have a power up show
// three times in a row), never stacked against another player"). There is no
// "how often" per item any more: the system sets the defaults and teachers
// switch power-ups on or off in the game menus.
// - Players: nobody gets a second power-up until everyone playing has had as
//   many, and a player who is behind gets the next one for sure, so counts
//   never differ by more than one.
// - Items: dealt from a shuffled bag, so each one comes up as often as the
//   others, and never the same one twice in a row (unless it is the only one).
export interface Dealer { deal: (items: ThemeItem[], who?: string, everyone?: string[], chance?: number) => ThemeItem | null }
export function makeDealer(rand: () => number = Math.random, chance = POWER_UP_CHANCE): Dealer {
  const got = new Map<string, number>();
  const lastFor = new Map<string, string>();
  let bag: string[] = [];
  let last = '';
  const shuffle = (ids: string[]) => { const a = [...ids]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function pick(items: ThemeItem[], who: string): ThemeItem {
    const ids = new Set(items.map((it) => it.id));
    if (!bag.some((id) => ids.has(id))) bag = shuffle([...ids]);
    const inBag = bag.filter((id) => ids.has(id));
    // A fresh bag may start with the one just dealt; take another if there is one.
    const id = inBag.find((x) => x !== last && x !== lastFor.get(who)) ?? inBag.find((x) => x !== last) ?? (ids.size > 1 ? [...ids].find((x) => x !== last)! : inBag[0]);
    const at = bag.indexOf(id);
    if (at >= 0) bag.splice(at, 1);
    last = id; lastFor.set(who, id);
    return items.find((it) => it.id === id)!;
  }
  return {
    deal(items, who = 'solo', everyone = [who], odds = chance) {
      if (!items.length) return null;
      const counts = [...new Set([...everyone, who])].map((p) => got.get(p) ?? 0);
      const mine = got.get(who) ?? 0;
      if (mine > Math.min(...counts)) return null; // someone else is due first
      if (mine >= Math.max(...counts) && rand() >= odds) return null;
      got.set(who, mine + 1);
      return pick(items, who);
    },
  };
}

// One roll with no memory (kept for simple callers and tests).
export function rollPowerUp(items: ThemeItem[], rand: () => number = Math.random, chance = POWER_UP_CHANCE): ThemeItem | null {
  if (!items.length || rand() >= chance) return null;
  return items[Math.floor(rand() * items.length)] ?? null;
}

// An item's number, or the ability's default when the theme left it blank.
export const amountOf = (it: ThemeItem, fallback: number) => it.amount ?? fallback;


// No stealing, anywhere (teacher, 2026-11-24, from the competitor research:
// "i dont want any power ups with stealing"): no power-up takes points, cards,
// pieces or places from another player or team. These abilities are gone from
// every game, and a saved theme that still names one never deals it: Swap and
// Steal (Game Show), Sneaky Swipe (Pinball, Bowling), Pop Out (Four in a Row:
// pulls out another player's piece) and the Board Game Wheel (sends another
// player back).
// Nothing stacked against another player either (owner, 2026-11-27): Castle
// Quest's Tornado moved every other player, so it is gone, and with it the
// Shield that only guarded against it.
export const NO_STEAL_ABILITIES = new Set(['swap', 'steal', 'swipe', 'pop', 'wheel', 'tornado', 'shield']);
export const allowedItem = (it: { ability?: string }) => !NO_STEAL_ABILITIES.has(it.ability ?? '');
