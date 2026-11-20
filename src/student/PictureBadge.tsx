import type { GameTheme } from '../theme/types';
import { EXTRA_COLORS, isExtraPicture, picture, pictureArt, PICTURES } from './pictures';

// One sign-in picture: the class's drawn version if its sign-in design has
// one, else the built-in icon on its color.
export default function PictureBadge({ id, theme, size }: { id: string; theme?: GameTheme; size: number }) {
  const art = pictureArt(theme, id);
  if (!art && isExtraPicture(id)) {
    // An extra picture not drawn yet shows its number.
    const bg = theme?.pieces[`pic-${id}`]?.color ?? EXTRA_COLORS[(Number(id) - PICTURES.length - 1) % EXTRA_COLORS.length];
    return <span className="rounded-full border-std border-border flex items-center justify-center shrink-0 font-display font-bold" style={{ width: size, height: size, background: bg, fontSize: size * 0.4 }}>{id}</span>;
  }
  const P = picture(id);
  const I = P.icon;
  return art
    ? <img src={art} alt="" className="rounded-full border-std border-border object-cover shrink-0" style={{ width: size, height: size }} />
    : <span className="rounded-full border-std border-border flex items-center justify-center shrink-0" style={{ width: size, height: size, background: theme?.pieces[`pic-${id}`]?.color ?? P.color }}><I weight="fill" size={size * 0.55} /></span>;
}
