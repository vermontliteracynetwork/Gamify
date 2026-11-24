// Computer players get fun names that change from game to game (teacher,
// 2026-11-24: "Goofy Lamp is thinking..."). Kid-friendly two-word names:
// no real people, no brands, no characters.
export const CPU_NAMES = [
  'Goofy Lamp', 'Silly Fox', 'Happy Rainbow', 'Jolly Teapot', 'Wobbly Robot', 'Sleepy Cloud',
  'Bouncy Bean', 'Giggly Moon', 'Fuzzy Sock', 'Dizzy Donut', 'Sunny Kite', 'Wiggly Worm',
  'Chatty Parrot', 'Sneaky Snail', 'Cozy Mitten', 'Zooming Comet', 'Bubbly Fish', 'Cheery Acorn',
  'Snappy Turtle', 'Twirly Leaf', 'Speedy Pebble', 'Clumsy Penguin', 'Puffy Muffin', 'Lucky Button',
  'Prickly Cactus', 'Tiny Dragon', 'Sparkly Shell', 'Noodle Owl', 'Breezy Balloon', 'Toasty Waffle',
];

let at = Math.floor(Math.random() * CPU_NAMES.length);

// The next name in the rotation, so two games in a row never share one.
export function nextCpuName(): string {
  at = (at + 1) % CPU_NAMES.length;
  return CPU_NAMES[at];
}
