// Every on-screen word lives here so Spanish (and more) can be added later
// as another file with the same keys. No em dashes in student/teacher text.
export const en = {
  'nav.home': 'Gamify home',
  'nav.allGames': 'All games',
  'home.title': 'Pick a game',
  'home.subtitle': 'Play on your own, or join a game your teacher is running.',
  'home.comingSoon': 'New games are on the way',
  'home.play': 'Play',
} as const;

export type StringKey = keyof typeof en;
