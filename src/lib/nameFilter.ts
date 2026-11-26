// Blocked words for names students type (owner, 2026-11-26: "add a blocked
// words list"). Written for Gamify, not copied from any list. Used where a
// student types their own name (Free games have no student list or teacher
// approval). A blocked name is refused with a friendly "try another name".
//
// SUBSTRING words are blocked anywhere in the name, even hidden inside other
// letters ("xxfuckxx"). WHOLE words are short or common enough to sit inside
// ordinary names, so they are blocked only as a whole word ("ass", not "Cassie").
const SUBSTRING = [
  'fuck', 'fuk', 'shit', 'bitch', 'btch', 'cunt', 'pussy', 'penis', 'vagina', 'boob', 'tits',
  'asshole', 'arsehole', 'bastard', 'slut', 'whore', 'porn', 'sexy', 'dildo', 'wank', 'jizz', 'horny', 'nude', 'naked',
  'nigg', 'fag', 'retard', 'tranny', 'chink', 'kike', 'wetback', 'gook', 'dyke', 'beaner',
  'nazi', 'hitler', 'kkk', 'rapist', 'molest', 'pedo', 'murder', 'suicide', 'terrorist',
  'damn', 'goddam', 'piss', 'poop', 'butthole', 'cocaine', 'drunk', 'stupid', 'idiot', 'loser', 'ugly', 'fatty',
];
// Short or common enough to sit inside ordinary words: "Grape", "Raccoon",
// "Skill", "Cucumber", "Peacock", "Ashton", "Spice", "Scrap", "Method".
const WHOLE = ['ass', 'arse', 'sex', 'hell', 'hoe', 'ho', 'tit', 'fat', 'gay', 'die', 'dead', 'hate', 'butt', 'pee', 'poo', 'gun', 'drug', 'drugs', 'beer',
  'rape', 'coon', 'spic', 'kill', 'cum', 'cock', 'dick', 'crap', 'meth', 'weed', 'heroin', 'fck', 'sht', 'dumb'];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '!': 'i', '3': 'e', '4': 'a', '@': 'a', '5': 's', '$': 's', '7': 't', '8': 'b', '9': 'g', '|': 'l' };

// Lowercase, undo look-alike numbers and symbols, and drop accents.
function plain(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[0-9!@$|]/g, (c) => LEET[c] ?? c);
}
// Each letter may repeat, so stretched spellings match ("fuuuck"), but a
// double letter in the word still needs two ("boob" is not "Bob").
const pattern = (w: string) => w.split('').map((c) => `${c}+`).join('');
const ANYWHERE = new RegExp(SUBSTRING.map(pattern).join('|'));
const ALONE = new RegExp(`^(?:${WHOLE.map(pattern).join('|')})$`);

export function isBlockedName(name: string): boolean {
  const s = plain(name);
  if (ANYWHERE.test(s.replace(/[^a-z]/g, ''))) return true;
  return s.split(/[^a-z]+/).filter(Boolean).some((w) => ALONE.test(w));
}
