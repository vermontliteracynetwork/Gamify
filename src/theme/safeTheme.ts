import type { GameTheme } from './types';

// A theme can come from another teacher (the gallery, a student design), so
// nothing in it is trusted (teacher, 2026-11-20: "escape and sanitize
// anything a user submits"). Pictures must be real image data or Gamify's
// own files; colors must be plain hex colors. Anything else is dropped, so
// a theme can never slip code into a page or a style.
const IMAGE = /^(data:image\/(png|jpe?g|gif|webp|avif);base64,[A-Za-z0-9+/=\s]+|\/[A-Za-z0-9/_.-]+\.(png|jpe?g|gif|webp|avif|svg))$/;
const COLOR = /^#[0-9a-fA-F]{3,8}$/;

export const safeImage = (v: unknown): string | undefined => (typeof v === 'string' && IMAGE.test(v) ? v : undefined);
export const safeColor = (v: unknown): string | undefined => (typeof v === 'string' && COLOR.test(v) ? v : undefined);

export function sanitizeTheme(theme: GameTheme): GameTheme {
  const pieces: GameTheme['pieces'] = {};
  for (const [id, p] of Object.entries(theme.pieces ?? {})) {
    if (!p || typeof p !== 'object') continue;
    pieces[id] = { ...p, image: safeImage(p.image), color: p.color === undefined ? undefined : safeColor(p.color) };
    if (pieces[id].image === undefined) delete pieces[id].image;
    if (pieces[id].color === undefined) delete pieces[id].color;
  }
  const colors = { ...theme.colors };
  for (const k of Object.keys(colors) as (keyof GameTheme['colors'])[]) if (colors[k] !== undefined && !safeColor(colors[k])) delete colors[k];
  return {
    ...theme,
    pieces,
    colors,
    ...(theme.itemImages && { itemImages: theme.itemImages.map((x) => safeImage(x)).filter((x): x is string => !!x) }),
  };
}
