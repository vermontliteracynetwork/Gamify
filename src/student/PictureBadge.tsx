import type { GameTheme } from '../theme/types';
import { picture, pictureArt } from './pictures';

// One sign-in picture: the class's drawn version if its sign-in design has
// one, else the built-in icon on its color.
export default function PictureBadge({ id, theme, size }: { id: string; theme?: GameTheme; size: number }) {
  const art = pictureArt(theme, id);
  const P = picture(id);
  const I = P.icon;
  return art
    ? <img src={art} alt="" className="rounded-full border-[2px] border-border object-cover shrink-0" style={{ width: size, height: size }} />
    : <span className="rounded-full border-[2px] border-border flex items-center justify-center shrink-0" style={{ width: size, height: size, background: theme?.pieces[`pic-${id}`]?.color ?? P.color }}><I weight="fill" size={size * 0.55} /></span>;
}
