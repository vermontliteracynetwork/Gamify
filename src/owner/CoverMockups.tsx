import { GameCover } from '../games/covers';
import { GAMES } from '../games/registry';
import ThemePreview from '../theme/builder/ThemePreview';
import { themesFor } from '../theme/library';

// Mockups for the teacher's approval (2026-11-20, task 44: "game covers as
// templates"): each game's cover drawn from a theme's own pieces, so any
// theme, Classic or class-made, gets a matching cover. Owner only; nothing
// here is live until she approves.
export function TemplateCover({ gameId, themeIndex = 0 }: { gameId: string; themeIndex?: number }) {
  const themes = themesFor(gameId);
  const theme = themes[Math.min(themeIndex, themes.length - 1)];
  const name = GAMES.find((g) => g.id === gameId)?.name ?? gameId;
  return (
    <div className="relative rounded-panel overflow-hidden border-bold border-border" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <div className="pointer-events-none [&>*]:!rounded-none [&>*]:!border-0"><ThemePreview theme={theme} view="game" /></div>
      <span className="absolute left-3 bottom-3 px-3 py-1 rounded-pill bg-surface border-std border-border font-display text-lg" style={{ boxShadow: '0 3px 0 #000' }}>{name}</span>
      <span className="absolute right-3 top-3 px-2 py-0.5 rounded-pill bg-text text-white text-xs font-bold">{theme.name}</span>
    </div>
  );
}

export default function CoverMockups() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid gap-6">
      <h1 className="font-display text-4xl">Cover templates: mockups</h1>
      <p className="font-bold max-w-3xl">Left: today's cover. Middle: the cover made from Classic's pieces. Right: the same template with another theme's pieces (when the game has one). Nothing changes in the app until you approve.</p>
      <div className="grid gap-6">
        {GAMES.map((g) => (
          <section key={g.id} className="grid gap-2">
            <h2 className="font-display text-2xl">{g.name}</h2>
            <div className="grid grid-cols-3 gap-4 items-start">
              <div className="rounded-panel overflow-hidden border-bold border-border aspect-[4/3]"><GameCover gameId={g.id} className="w-full h-full" /></div>
              <TemplateCover gameId={g.id} />
              <TemplateCover gameId={g.id} themeIndex={1} />
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
