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
// ideas: sub-concepts suggested on the challenge page; keywords: the tags that
// go with the day (shown as "tags we use").
export interface SpecialDay { tag: string; name: string; date: string; theme: string; keywords: string[]; ideas: string[] }
export const SPECIAL_DAYS: SpecialDay[] = [
  { tag: 'cheesy-socks-day', name: 'Cheesy Socks Day', date: '2027-01-21', theme: 'Funny socks and sock patterns, like an ugly sweater but for socks', keywords: ['socks', 'fun-socks', 'sock-patterns'],
    ideas: ['Argyle, stripes and polka dots', 'Mismatched pairs', 'Fuzzy socks and knee socks', 'Toe socks', 'Ugly-sweater patterns on socks', 'Sock puppets', 'A laundry line of socks'] },
  { tag: 'pizza-day', name: 'Pizza Day', date: '2027-02-09', theme: 'Lots of different pizzas and styles, pizzeria style', keywords: ['pizza', 'pizzeria'],
    ideas: ['Pepperoni, cheese and veggie toppings', 'Pizza slices and whole pies', 'Pizza boxes', 'A pizzeria sign and counter', 'Pizza chefs tossing dough', 'Deep dish and thin crust', 'Pizza fractions'] },
  { tag: 'puppy-day', name: 'Puppy Day', date: '2027-03-23', theme: 'Cute puppies doing things, paw prints', keywords: ['puppy', 'dog', 'paw-prints'],
    ideas: ['Puppies playing fetch', 'Chew toys and dog bowls', 'Paw prints', 'A dog park', 'Puppy school', 'Bath time', 'Dog houses'] },
  { tag: 'food-faces-day', name: 'Food Faces Day', date: '2027-04-06', theme: 'Faces on food, or faces made from food', keywords: ['food-faces', 'fruit-faces', 'mixed-media'],
    ideas: ['Fruit faces', 'Veggie faces', 'Toast and pancake faces', 'Lunch-box faces', 'A face made out of food', 'Foods with feelings', 'A photo of real food with a drawn face'] },
  { tag: 'world-turtle-day', name: 'World Turtle Day', date: '2027-05-23', theme: 'Turtles and tortoises doing things', keywords: ['turtle', 'tortoise'],
    ideas: ['Sea turtles and coral reefs', 'Box turtles and ponds', 'Tortoises in the desert', 'Shell patterns', 'Slow and steady races', 'Hatchlings on the beach'] },
  { tag: 'take-your-cat-to-work-day', name: 'Take Your Cat to Work Day', date: '2027-06-19', theme: 'Cats doing jobs: landscapers, teachers, doctors', keywords: ['cat', 'cats-with-jobs'],
    ideas: ['Cat teachers', 'Cat doctors and nurses', 'Cat landscapers', 'Cat chefs', 'Cat firefighters', 'Cat astronauts', 'Tools and uniforms'] },
  { tag: 'ice-cream-sundae-day', name: 'Ice Cream Sundae Day', date: '2027-07-08', theme: 'Sundaes, scoops, toppings and cherries', keywords: ['ice-cream-sundae', 'ice-cream-cone', 'ice-cream'],
    ideas: ['Scoops and sprinkles', 'Hot fudge and whipped cream', 'Cherries on top', 'Banana splits', 'A sundae bar', 'Ice cream cones', 'An ice cream truck'] },
  { tag: 'potato-day', name: 'Potato Day', date: '2027-08-19', theme: 'Potatoes with personality, or potato dishes like fries and waffle fries', keywords: ['potato', 'french-fries', 'waffle-fries'],
    ideas: ['Potatoes with faces', 'French fries', 'Waffle fries', 'Mashed and baked potatoes', 'Tater tots', 'A potato sack race', 'A potato farm'] },
  { tag: 'wildlife-day', name: 'Wildlife Day', date: '2027-09-04', theme: 'Any wild animals', keywords: ['wild-animals', 'wildlife', 'squirrels'],
    ideas: ['Forest animals: foxes, deer, owls, squirrels', 'Safari: lions, giraffes, elephants', 'Ocean wildlife: whales, dolphins, sea turtles', 'Arctic: polar bears, penguins, arctic foxes', 'Jungle: monkeys, tigers, parrots', 'Animal tracks', 'Habitats and endangered animals'] },
  { tag: 'flower-day', name: 'Flower Day', date: '2027-10-07', theme: 'Anything floral, including flowers with personality', keywords: ['flowers', 'floral'],
    ideas: ['Sunflowers, tulips and daisies', 'Wildflowers', 'Flowers with faces', 'Bouquets', 'Pressed flowers', 'Gardens', 'Bees and butterflies'] },
  { tag: 'pickle-day', name: 'Pickle Day', date: '2027-11-14', theme: 'Anything pickles, including pickles with personality', keywords: ['pickles'],
    ideas: ['Pickles with faces', 'Pickle jars', 'Cucumbers in a garden', 'Dill and deli', 'A pickle party'] },
  { tag: 'gingerbread-house-day', name: 'Gingerbread House Day', date: '2027-12-12', theme: 'Gingerbread style, gingerbread people, patterns and frosting', keywords: ['gingerbread', 'frosting'],
    ideas: ['Gingerbread people', 'Gingerbread houses', 'Frosting patterns', 'Gumdrops and peppermints', 'Cookie cutters', 'A gingerbread town'] },
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
// Entries and the public vote close 48 hours before the special day, so the
// owner can review (owner, 2026-11-26): 11:59 pm Eastern, two days before.
// The winner is announced on the special day itself (to confirm with her).
export const CLOSE_DAYS_BEFORE = 2;
const shift = (iso: string, days: number) => { const d = new Date(`${iso}T12:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };
export function closeDate(day: SpecialDay): string { return shift(day.date, -CLOSE_DAYS_BEFORE); }
export function challengeClose(day: SpecialDay): Date { return eastern(closeDate(day), '23:59:00'); }
export function winnerDate(day: SpecialDay): string { return day.date; }
export function isOpen(day: SpecialDay, now = new Date()): boolean { return now.getTime() <= challengeClose(day).getTime(); }
export function nextOpenDay(now = new Date()): SpecialDay { return SPECIAL_DAYS.find((d) => isOpen(d, now)) ?? SPECIAL_DAYS[SPECIAL_DAYS.length - 1]; }
// Today's date in Eastern time, for one vote per device per day.
export function easternToday(now = new Date()): string { return now.toLocaleDateString('en-CA', { timeZone: 'America/New_York' }); }

// The themes entered for a special day: the challenge switch on, this day
// picked in the month menu (owner, 2026-11-26: "a drop-down menu to select
// the 1 month that they're submitting it to"), and shared before the close.
export function challengeEntries<T extends { challenge?: boolean; challengeDay?: string; gallery?: { status: string; at: string } }>(themes: T[], day: SpecialDay): T[] {
  const close = challengeClose(day).getTime();
  return themes.filter((th) => th.challenge && th.challengeDay === day.tag && th.gallery && th.gallery.status !== 'declined'
    && new Date(th.gallery.at).getTime() <= close);
}
