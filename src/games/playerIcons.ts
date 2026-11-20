// Every game has 10 player icons (teacher, 2026-11-20), in its theme and in
// every design kit. Team games call them team icons, solo games player icons;
// the pieces are the same (team-1 to team-10).
export const playerIconPieces = (word: 'Team' | 'Player' = 'Player') => Array.from({ length: 10 }, (_, i) => ({
  id: `team-${i + 1}`, label: `${word} ${i + 1} icon`, width: 256, height: 256, hint: `The round badge for ${word.toLowerCase()} ${i + 1}`,
}));
