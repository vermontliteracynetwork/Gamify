// Silly name dice (product plan 4B): friendly two-word names from safe word
// lists, so no typing and nothing inappropriate is possible.
export const NAME_ADJECTIVES = [
  'Rainbow', 'Speedy', 'Sparkly', 'Cosmic', 'Jolly', 'Brave', 'Fuzzy', 'Giggly', 'Mighty', 'Sunny',
  'Bouncy', 'Clever', 'Happy', 'Lucky', 'Zippy', 'Snowy', 'Shiny', 'Gentle', 'Wiggly', 'Golden',
  'Super', 'Turbo', 'Magic', 'Fluffy', 'Starry', 'Breezy', 'Peppy', 'Cozy', 'Daring', 'Glowing',
];
export const NAME_NOUNS = [
  'Unicorn', 'Pickle', 'Penguin', 'Comet', 'Taco', 'Otter', 'Rocket', 'Panda', 'Waffle', 'Dragon',
  'Koala', 'Pancake', 'Robot', 'Turtle', 'Cupcake', 'Llama', 'Narwhal', 'Meteor', 'Cactus', 'Muffin',
  'Dolphin', 'Wizard', 'Pretzel', 'Hedgehog', 'Pumpkin', 'Falcon', 'Noodle', 'Owl', 'Volcano', 'Bubble',
];

export function rollName(rand: () => number = Math.random, taken: string[] = []): string {
  for (let i = 0; i < 50; i++) {
    const name = `${NAME_ADJECTIVES[Math.floor(rand() * NAME_ADJECTIVES.length)]} ${NAME_NOUNS[Math.floor(rand() * NAME_NOUNS.length)]}`;
    if (!taken.includes(name)) return name;
  }
  return `${NAME_ADJECTIVES[0]} ${NAME_NOUNS[taken.length % NAME_NOUNS.length]} ${taken.length + 1}`;
}
