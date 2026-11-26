// Theme tags and the Theme Building Challenge's special days (owner,
// 2026-11-26): "when users submit a new theme in the theme builder, there will
// be a section where they have to select tags ... They'll always be like the
// same tag that can be searched and referenced." Tags are a fixed list (no
// free typing), so one word always means one tag: the gallery searches them
// and each special day pulls its entries by its own tag. Add new tags here;
// never rename an id once themes use it.

export interface ThemeTag { id: string; label: string }
export interface TagGroup { id: string; label: string; tags: ThemeTag[] }

const tag = (label: string): ThemeTag => ({ id: label.toLowerCase().replace(/&/g, 'and').replace(/'/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), label });
const group = (id: string, label: string, labels: string[]): TagGroup => ({ id, label, tags: labels.map(tag) });

// One special day each month, one theme, one winner, no runner-up (owner,
// 2026-11-26). Dates checked on the listofnationaldays.com pages she linked.
export interface SpecialDay { tag: string; name: string; date: string; theme: string; keywords: string[] }
export const SPECIAL_DAYS: SpecialDay[] = [
  { tag: 'cheesy-socks-day', name: 'Cheesy Socks Day', date: '2027-01-21', theme: 'Funny socks and sock patterns, like an ugly sweater but for socks', keywords: ['socks', 'fun-socks', 'sock-patterns'] },
  { tag: 'pizza-day', name: 'Pizza Day', date: '2027-02-09', theme: 'Lots of different pizzas and styles, pizzeria style', keywords: ['pizza', 'pizzeria'] },
  { tag: 'puppy-day', name: 'Puppy Day', date: '2027-03-23', theme: 'Cute puppies doing things, paw prints', keywords: ['puppy', 'dog', 'paw-prints'] },
  { tag: 'food-faces-day', name: 'Food Faces Day', date: '2027-04-06', theme: 'Faces on food, or faces made from food', keywords: ['food-faces', 'fruit-faces', 'mixed-media'] },
  { tag: 'world-turtle-day', name: 'World Turtle Day', date: '2027-05-23', theme: 'Turtles and tortoises doing things', keywords: ['turtle', 'tortoise'] },
  { tag: 'take-your-cat-to-work-day', name: 'Take Your Cat to Work Day', date: '2027-06-19', theme: 'Cats doing jobs: landscapers, teachers, doctors', keywords: ['cat', 'cats-with-jobs'] },
  { tag: 'ice-cream-sundae-day', name: 'Ice Cream Sundae Day', date: '2027-07-08', theme: 'Sundaes, scoops, toppings and cherries', keywords: ['ice-cream-sundae', 'ice-cream-cone', 'ice-cream'] },
  { tag: 'potato-day', name: 'Potato Day', date: '2027-08-19', theme: 'Potatoes with personality, or potato dishes like fries and waffle fries', keywords: ['potato', 'french-fries', 'waffle-fries'] },
  { tag: 'wildlife-day', name: 'Wildlife Day', date: '2027-09-04', theme: 'Any wild animals', keywords: ['wild-animals', 'wildlife', 'squirrels'] },
  { tag: 'flower-day', name: 'Flower Day', date: '2027-10-07', theme: 'Anything floral, including flowers with personality', keywords: ['flowers', 'floral'] },
  { tag: 'pickle-day', name: 'Pickle Day', date: '2027-11-14', theme: 'Anything pickles, including pickles with personality', keywords: ['pickles'] },
  { tag: 'gingerbread-house-day', name: 'Gingerbread House Day', date: '2027-12-12', theme: 'Gingerbread style, gingerbread people, patterns and frosting', keywords: ['gingerbread', 'frosting'] },
];

export const TAG_GROUPS: TagGroup[] = [
  { id: 'special', label: 'Special days', tags: SPECIAL_DAYS.map((d) => ({ id: d.tag, label: d.name })) },
  group('food', 'Food and treats', ['Fun socks', 'Pizza', 'Pizzeria', 'Food faces', 'Fruit faces', 'Ice cream', 'Ice cream sundae', 'Ice cream cone', 'Potato', 'French fries', 'Waffle fries', 'Pickles', 'Gingerbread', 'Frosting', 'Hot cocoa', 'Candy', 'Kawaii sweets', 'Chocolate', 'Brownies', 'Cake', 'Lemonade', 'Fruits', 'Veggies', 'Cookies']),
  group('animals', 'Animals', ['Puppy', 'Dog', 'Paw prints', 'Cat', 'Cats with jobs', 'Turtle', 'Tortoise', 'Wild animals', 'Wildlife', 'Squirrels', 'Penguins', 'Polar animals', 'Arctic animals', 'Capybaras', 'Axolotls', 'Farm animals', 'Fish', 'Zoo animals', 'Ocean animals', 'Sharks', 'Dinosaurs', 'Bugs', 'Butterflies', 'Bees', 'Frogs', 'Birds', 'Turkeys', 'Reindeer', 'Owls', 'Pet rocks']),
  group('cozy', 'Cozy and winter', ['Cozy', 'Winter', 'Snow', 'Snowflakes', 'Snowy pine trees', 'Blankets', 'Quilt', 'Cozy cabin', 'Hibernation', 'Mittens', 'New Year', 'New goals', 'Confetti', 'Fireworks', 'Socks', 'Sock patterns']),
  group('nature', 'Nature and seasons', ['Spring', 'Summer', 'Fall', 'Autumn', 'Flowers', 'Floral', 'Plants', 'Gardens', 'Rainbows', 'Rain', 'Umbrellas', 'Kites', 'Sunshine', 'Weather', 'Earth', 'Nature', 'Apples', 'Harvest', 'Leaves', 'Beach', 'Ocean', 'Camping', 'Hiking']),
  group('community', 'Kindness and community', ['Kindness', 'Friendship', 'Friendship bracelets', 'Community', 'Community helpers', 'Celebrating cultures', 'Heritage months', 'Back to school', 'School', 'Reading', 'Graduation', 'End of year', 'Teachers']),
  group('fantasy', 'Fantasy, science and fun', ['Fairy tales', 'Fairies', 'Princesses', 'Castles', 'Gnomes', 'Space', 'Robots', 'Recycled robots', 'Inventors', 'Mad scientist', 'Pirates', 'Circus', 'Silly', 'Spooky-cute', 'Ghosts', 'Gothic', 'Dark academia', 'Music', 'Guitar', 'Piano', 'Sports', 'Football', 'Soccer', 'Baseball', 'Basketball', 'Hockey', 'Lacrosse', 'Board games', 'Emojis', 'Y2K']),
  group('holidays', 'Holidays', ['Valentine\'s Day', 'Lunar New Year', 'Saint Patrick\'s Day', 'Groundhog Day', 'Earth Day', 'Halloween', 'Thanksgiving', 'Hanukkah', 'Kwanzaa', 'Winter lights', 'Wrapping paper', 'Birthday']),
  group('style', 'Art style', ['Physical art', 'Digital art', 'Mixed media', 'Paint', 'Clay', 'Recycled materials', 'Scrapbook', 'Junk journal', 'Nature art', 'Fabric and yarn', 'Crayons', 'Doodle', 'Sketch', 'Hand-drawn', 'Pixel art', 'Anime-inspired', 'Kawaii', 'Comic book', 'Stickers', 'Graffiti', 'Chalkboard', 'Notebook', 'Watercolor']),
];

// Every tag once (a label can sit in two groups, e.g. Flowers).
export const ALL_TAGS: ThemeTag[] = [...new Map(TAG_GROUPS.flatMap((g) => g.tags).map((x) => [x.id, x])).values()];
export const tagLabel = (id: string) => ALL_TAGS.find((x) => x.id === id)?.label ?? id;

export function searchTags(query: string): ThemeTag[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return ALL_TAGS.filter((x) => x.label.toLowerCase().includes(q) || x.id.includes(q.replace(/\s+/g, '-')));
}

// Entries close at 11:59 pm on the day; the winner is emailed and posted 7
// days after (owner, 2026-11-26). Times are US Eastern (Vermont): standard
// time (-05:00) Nov to mid-March, daylight time (-04:00) in between.
function eastern(date: string, time: string): Date {
  const [y, m, d] = date.split('-').map(Number);
  const firstSunday = (month: number) => 1 + ((7 - new Date(Date.UTC(y, month, 1)).getUTCDay()) % 7);
  const dstStart = firstSunday(2) + 7; // second Sunday of March
  const dstEnd = firstSunday(10); // first Sunday of November
  const dst = (m > 3 && m < 11) || (m === 3 && d >= dstStart) || (m === 11 && d < dstEnd);
  return new Date(`${date}T${time}${dst ? '-04:00' : '-05:00'}`);
}
export const ANNOUNCE_AFTER_DAYS = 7;
export function challengeClose(day: SpecialDay): Date { return eastern(day.date, '23:59:00'); }
export function winnerDate(day: SpecialDay): string {
  const d = new Date(`${day.date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + ANNOUNCE_AFTER_DAYS);
  return d.toISOString().slice(0, 10);
}

// The themes that count for a special day: entered in the challenge, tagged
// with the day or one of its keywords, and saved before entries closed.
export function challengeEntries<T extends { tags?: string[]; challenge?: boolean; gallery?: { status: string; at: string } }>(themes: T[], day: SpecialDay): T[] {
  const close = challengeClose(day).getTime();
  const match = new Set([day.tag, ...day.keywords]);
  return themes.filter((th) => th.challenge && th.gallery && th.gallery.status !== 'declined'
    && (th.tags ?? []).some((x) => match.has(x)) && new Date(th.gallery.at).getTime() <= close);
}
