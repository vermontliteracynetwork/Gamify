import { Carrot, Hamburger, Heart, IceCream, Pizza, type Icon } from '@phosphor-icons/react';
import { pieceColor, pieceImage } from '../../theme/library';
import type { GameTheme } from '../../theme/types';
import { PATIENCE, type Food } from './lunch';

// Lunch Rush's guests, orders and foods, drawn the same in the game and in
// the Theme Builder's preview (teacher, 2026-11-16).

// Each food has its own icon and color, so a pre-reader matches by picture.
export const FOOD_ART: Record<Food, { icon: Icon; color: string }> = {
  pizza: { icon: Pizza, color: '#f6c544' },
  burger: { icon: Hamburger, color: '#f39a6b' },
  icecream: { icon: IceCream, color: '#f6a5c0' },
  carrot: { icon: Carrot, color: '#9bd35a' },
};
export const SKIN = ['#f5d0b5', '#e0ac85', '#c68a5e', '#8d5a3b', '#f1c27d', '#5c3a24'];
export const SHIRT = ['#6aa9e9', '#c58ce8', '#5cc3a0', '#ef7d96', '#f0d36b', '#7fd6e3'];

// The guest's order: the food picture, and hearts for how long they'll wait.
export function OrderBubble({ theme, food, patience, served }: { theme: GameTheme; food: Food; patience: number; served: boolean }) {
  return (
    <div className="w-[70%] bg-surface border-[2.5px] border-border rounded-panel p-[4%] grid justify-items-center gap-1" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="w-[62%] aspect-square rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ ...foodBg(theme, food), opacity: served ? 0.4 : 1 }}>
        <FoodFace theme={theme} food={food} />
      </span>
      <span className="flex gap-[3%] w-full justify-center" aria-hidden="true">
        {Array.from({ length: PATIENCE }, (_, i) => <Heart key={i} weight={i < patience ? 'fill' : 'bold'} className="w-[16%] h-auto" color={i < patience ? (patience <= 2 ? '#e5635f' : '#ef7d96') : '#b8b2c8'} />)}
      </span>
    </div>
  );
}

// A friendly guest drawn in code: six skin tones and shirt colors.
export function GuestArt({ look, happy, worried }: { look: number; happy: boolean; worried: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="w-[78%] h-auto block" aria-hidden="true">
      <path d="M6,40 Q6,27 20,27 Q34,27 34,40 Z" fill={SHIRT[look % SHIRT.length]} stroke="#000" strokeWidth="1.2" />
      <circle cx="20" cy="17" r="10" fill={SKIN[look % SKIN.length]} stroke="#000" strokeWidth="1.2" />
      <circle cx="16.5" cy="16" r="1.3" fill="#241c3d" /><circle cx="23.5" cy="16" r="1.3" fill="#241c3d" />
      {happy ? <path d="M15,20 Q20,25.5 25,20 Z" fill="#241c3d" /> : worried ? <path d="M16.5,22 Q20,20 23.5,22" fill="none" stroke="#241c3d" strokeWidth="1.2" strokeLinecap="round" /> : <path d="M16,20.5 Q20,23.5 24,20.5" fill="none" stroke="#241c3d" strokeWidth="1.2" strokeLinecap="round" />}
      <circle cx="14" cy="19.5" r="1.4" fill="#f6a5c0" opacity="0.7" /><circle cx="26" cy="19.5" r="1.4" fill="#f6a5c0" opacity="0.7" />
    </svg>
  );
}

// A food's look: the theme's picture on its color, or the Classic icon.
export const foodBg = (theme: GameTheme, f: Food) => ({ background: pieceColor(theme, `food-${f}`, FOOD_ART[f].color) });
export function FoodFace({ theme, food, size }: { theme: GameTheme; food: Food; size?: number }) {
  const img = pieceImage(theme, `food-${food}`);
  if (img) return <img src={img} alt="" className={size ? 'object-contain' : 'w-[85%] h-[85%] object-contain'} style={size ? { width: size + 6, height: size + 6 } : undefined} />;
  const F = FOOD_ART[food].icon;
  return size ? <F weight="fill" size={size} color="#241c3d" /> : <F weight="fill" className="w-3/5 h-3/5" color="#241c3d" />;
}
