import type { GameTheme } from '../theme/types';
import { isUploadedAvatar } from './pictures';
import PictureBadge from './PictureBadge';

// A student's avatar: an uploaded picture (Plus and Pro) or a built-in
// picture, drawn in the class's sign-in design when it has one.
export default function Avatar({ avatar, theme, size }: { avatar: string; theme?: GameTheme; size: number }) {
  return isUploadedAvatar(avatar)
    ? <img src={avatar} alt="" className="rounded-full border-[2px] border-border object-cover shrink-0" style={{ width: size, height: size }} />
    : <PictureBadge id={avatar} theme={theme} size={size} />;
}
