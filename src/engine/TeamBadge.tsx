import { Crown, Fish, Flower, Heart, Leaf, Lightning, Moon, Rocket, Star, Sun, type Icon } from '@phosphor-icons/react';
import { TEAM_COLORS } from './turns';

// Every team has a color AND an icon, so young students find their team
// without reading and color is never the only cue.
export const TEAM_ICONS: Icon[] = [Star, Heart, Lightning, Moon, Sun, Leaf, Fish, Rocket, Crown, Flower];

export function TeamBadge({ colorIndex, size = 36 }: { colorIndex: number; size?: number }) {
  const Icon = TEAM_ICONS[colorIndex % TEAM_ICONS.length];
  return (
    <span
      className="inline-flex items-center justify-center rounded-full border-[2.5px] border-border shrink-0"
      style={{ width: size, height: size, background: TEAM_COLORS[colorIndex % TEAM_COLORS.length] }}
      aria-hidden="true"
    >
      <Icon weight="fill" size={size * 0.55} color="#241c3d" />
    </span>
  );
}
