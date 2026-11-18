import type { CSSProperties } from 'react';
import { pieceFill } from '../../theme/library';
import type { GameTheme } from '../../theme/types';

// Match Up's tiles, drawn the same in the game and the Theme Builder preview
// (teacher, 2026-11-16: "ALWAYS show preview as the actual game template").
export const tileClass = (on: boolean, isDone: boolean) => `w-full min-h-14 rounded-input border-bold px-3 py-2 text-left font-bold leading-tight flex items-center ${isDone ? 'border-[#1f7a45] opacity-70' : on ? 'border-border ring-4 ring-accent' : 'border-border'}`;
export const answerClass = 'justify-center text-center font-bold text-lg sm:text-2xl';
export function tileStyle(theme: GameTheme, side: 'l' | 'r', isDone: boolean): CSSProperties {
  return { boxShadow: 'var(--shadow-sticker)', ...(side === 'l' ? pieceFill(theme, 'question-tile', '#fbfcf8') : pieceFill(theme, 'answer-tile', '#fdfd94')), ...(isDone ? { background: '#ddfcc6' } : {}) };
}
