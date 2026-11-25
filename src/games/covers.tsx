import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { houseFor } from '../theme/house';
import type { GameTheme } from '../theme/types';
import { CatArt, MouseArt, PoofArt, RoomArt } from './territory/art';
import { ClassicPiece } from './match-three/pieces';
import { CrayonDieFace, CrayonPawn, INK, PARK_BG, PK, QUIET_MAT } from './castle-quest/park';
import { BUBBLE_COLORS } from './bubble-pop/manifest';
import { PATTERNS } from '../brand/PatternProposal';
import { Hamburger, Cat, Dog, Fish, Rocket, Sun, Crown, Heart, IceCream, Pizza, Sparkle, Star, Trophy, type Icon } from '@phosphor-icons/react';

// Cover art for each game, drawn in code (no bought art), so every game card
// and welcome screen has a picture a pre-reader recognizes. Class-made and
// library covers can replace these through the Theme Builder.

function Scatter({ icons, colors }: { icons: Icon[]; colors: string[] }) {
  const spots = [[8, 14, -12], [70, 8, 10], [40, 52, -6], [78, 58, 14], [14, 62, 8], [52, 6, -16]];
  return (
    <>
      {spots.map(([x, y, r], i) => {
        const I = icons[i % icons.length];
        return (
          <span key={i} className="absolute rounded-full border-heavy border-border flex items-center justify-center"
            style={{ left: `${x}%`, top: `${y}%`, width: '22%', aspectRatio: '1', transform: `rotate(${r}deg)`, background: colors[i % colors.length] }}>
            <I weight="fill" className="w-3/5 h-3/5" color="#241c3d" />
          </span>
        );
      })}
    </>
  );
}

export function GameCover({ gameId, className = '' }: { gameId: string; className?: string }) {
  const base = `relative overflow-hidden ${className}`;
  switch (gameId) {
    case 'game-show':
      // The approved studio (batch 7, 2026-11-24): pink curtains, lavender
      // spotlights on Grape, the bulb marquee, butter cards with a sparkle and
      // won cards in team pastels.
      return (
        <div className={base} style={{ background: '#6a45f0' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
            <path d="M40 0 L22 100 H58 Z M120 0 L102 100 H138 Z" fill="#ddd6ff" opacity="0.8" />
            <rect x="0" y="84" width="160" height="16" fill="#fabe37" stroke="#1d1a33" strokeWidth="1.4" />
            <path d="M0 0 H22 C18 30 22 60 16 92 H0 Z M160 0 H138 C142 30 138 60 144 92 H160 Z" fill="#f055a5" stroke="#1d1a33" strokeWidth="1.4" />
            <path d={`M0 0 H160 V7 ${Array.from({ length: 16 }, (_, i) => `Q${155 - i * 10} 13 ${150 - i * 10} 7`).join(' ')} Z`} fill="#f055a5" stroke="#1d1a33" strokeWidth="1.4" />
            <rect x="36" y="18" width="88" height="62" rx="6" fill="#6a45f0" stroke="#1d1a33" strokeWidth="1.6" />
            {Array.from({ length: 14 }, (_, i) => <circle key={i} cx={42 + i * 5.8} cy="21.5" r="1.2" fill={i % 2 ? '#fffaf0' : '#fabe37'} />)}
            {Array.from({ length: 14 }, (_, i) => <circle key={`b${i}`} cx={42 + i * 5.8} cy="76.5" r="1.2" fill={i % 2 ? '#fabe37' : '#fffaf0'} />)}
            {Array.from({ length: 6 }, (_, i) => {
              const x = 42 + (i % 3) * 26.5, y = 26 + Math.floor(i / 3) * 24.5;
              const won = ['', '#c9bcf8', '', '', '#f8b6d6', ''][i];
              return (
                <g key={i}>
                  <rect x={x} y={y} width="23" height="21" rx="2.5" fill={won || '#fff1b8'} stroke="#1d1a33" strokeWidth="1.1" />
                  {won ? <text x={x + 11.5} y={y + 14} textAnchor="middle" fontSize="8" fontWeight="900" fill="#1d1a33">+30</text>
                    : <path d={`M${x + 11.5} ${y + 4.5} Q${x + 12.5} ${y + 9.5} ${x + 17} ${y + 10.5} Q${x + 12.5} ${y + 11.5} ${x + 11.5} ${y + 16.5} Q${x + 10.5} ${y + 11.5} ${x + 6} ${y + 10.5} Q${x + 10.5} ${y + 9.5} ${x + 11.5} ${y + 4.5} Z`} fill="#fabe37" stroke="#1d1a33" strokeWidth="0.8" />}
                </g>
              );
            })}
          </svg>
        </div>
      );
    case 'match-three':
      // The approved in-play look (batch 7, 2026-11-24): the bold shapes on the
      // Lavender and Blue crystal checker, on the pastel cut-paper desk, three
      // hearts lit in a match with a MATCH! burst.
      return (
        <div className={base} style={{ backgroundColor: '#f6f0e4', ...PATTERNS.find((x) => x.id === 'cutpaper-pastel')!.make(false) }} aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[64%] aspect-[5/4] rounded-[8%] border-[0.25rem] border-[#1d1a33] bg-[#fffaf0] p-[2.5%] grid grid-cols-5 grid-rows-4 shadow-[0_0.25rem_0_#1d1a33]">
            {[[4, 3, 0, 1, 2], [5, 1, 1, 1, 3], [2, 0, 4, 5, 1], [3, 2, 5, 0, 4]].map((row, r) => row.map((k, c) => {
              const lit = r === 1 && c >= 1 && c <= 3;
              return (
                <span key={`${r}-${c}`} className="grid place-items-center" style={{ background: lit ? '#fff1b8' : (r + c) % 2 ? '#bfdff3' : '#ddd6ff' }}>
                  <ClassicPiece kind={k} className="w-[78%] h-[78%]" />
                </span>
              );
            }))}
          </div>
          <span className="absolute left-1/2 top-[14%] -translate-x-1/2 -rotate-6 px-[4%] py-[1%] rounded-full bg-[#fabe37] border-[0.2rem] border-[#1d1a33] font-display text-[clamp(0.7rem,4.5cqw,1.6rem)] leading-none whitespace-nowrap" style={{ fontFamily: 'Grow Year' }}>MATCH! +30</span>
        </div>
      );
    case 'four-in-a-row': {
      // The approved rack (batch 7, 2026-11-24): a bright blue rack with cream
      // holes on the cream squiggle stage, purple dot and gold star pieces, a
      // gold line through the four, the next piece hovering above.
      const grid = ['......', '......', '...g..', '..gp..', '.gpp..', 'gpgpp.'];
      return (
        <div className={base} style={{ background: '#f6f0e4 url(/classic/four-in-a-row/squiggles.svg) repeat center / 45% auto' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <rect x="24" y="96" width="5" height="4" fill="#2f7fc4" stroke="#1d1a33" strokeWidth="0.8" /><rect x="71" y="96" width="5" height="4" fill="#2f7fc4" stroke="#1d1a33" strokeWidth="0.8" />
            <rect x="18" y="22" width="64" height="75" rx="5" fill="#4ba3e8" stroke="#1d1a33" strokeWidth="1.6" />
            {grid.map((row, r) => row.split('').map((ch, c) => {
              const cx = 26 + c * 9.6, cy = 31 + r * 11;
              if (ch === 'p') return <g key={`${r}-${c}`}><circle cx={cx} cy={cy} r="4" fill="#6a45f0" stroke="#1d1a33" strokeWidth="0.9" /><circle cx={cx} cy={cy} r="1.2" fill="#fffaf0" /></g>;
              if (ch === 'g') return <g key={`${r}-${c}`}><circle cx={cx} cy={cy} r="4" fill="#fabe37" stroke="#1d1a33" strokeWidth="0.9" /><path d={`M${cx} ${cy - 2.2} l0.7 1.5 1.6 .2 -1.2 1.1 .3 1.6 -1.4 -.8 -1.4 .8 .3 -1.6 -1.2 -1.1 1.6 -.2 Z`} fill="#1d1a33" /></g>;
              return <circle key={`${r}-${c}`} cx={cx} cy={cy} r="4" fill="#fffaf0" stroke="#1d1a33" strokeWidth="0.9" />;
            }))}
            <path d="M26 86 L54.8 53" stroke="#1d1a33" strokeWidth="3.4" strokeLinecap="round" /><path d="M26 86 L54.8 53" stroke="#fabe37" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="64" cy="12" r="5" fill="#6a45f0" stroke="#1d1a33" strokeWidth="1" /><circle cx="64" cy="12" r="1.5" fill="#fffaf0" />
          </svg>
        </div>
      );
    }
    case 'cast-catch':
      // The Classic lake: wooden boat at the top left, Kenney fish and floor.
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #cfe9ff 0 22%, #6cc0e5 22% 60%, #3f8fc4 100%)' }} aria-hidden="true">
          <svg className="absolute" style={{ left: '-8%', top: '2%', width: '42%' }} viewBox="0 -60 320 180">
            <path d="M10 40 L300 40 Q290 90 240 112 L60 112 Q20 90 10 40 Z" fill="#a0683a" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
            <path d="M6 34 L304 34 L300 44 L10 44 Z" fill="#7a4a24" stroke="#000" strokeWidth="6" strokeLinejoin="round" />
            <line x1="250" y1="36" x2="330" y2="-50" stroke="#5b3a1e" strokeWidth="8" strokeLinecap="round" />
          </svg>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="none"><path d="M30 6 Q52 4 62 30" stroke="#000" strokeWidth="0.5" fill="none" /></svg>
          <span className="absolute w-[8%] aspect-square rounded-full border-bold border-border" style={{ left: '58%', top: '44%', background: '#e5635f' }} />
          {[['seaweed-green-a', 4, 22], ['rock-a', 22, 16], ['seaweed-pink-a', 74, 20], ['rock-b', 86, 14], ['seaweed-orange-a', 56, 18]].map(([n, x, w]) => (
            <img key={n as string} src={`/classic/cast-catch/${n}.svg`} alt="" className="absolute bottom-0 h-auto" style={{ left: `${x}%`, width: `${w}%` }} draggable="false" />
          ))}
          {[['fish-orange', 12, 58, 22, 1], ['fish-blue', 64, 62, 20, -1], ['fish-pink', 38, 74, 18, 1]].map(([n, x, y, w, d]) => (
            <img key={n as string} src={`/classic/cast-catch/${n}.svg`} alt="" className="absolute h-auto" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `scaleX(${d})` }} draggable="false" />
          ))}
        </div>
      );
    case 'memory-match':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #ddfcc6, #ddd6ff)' }} aria-hidden="true">
          <div className="absolute inset-[10%] grid grid-cols-4 gap-[4%]">
            {['?', '', 'cat', '', '', '2+2', '', '4'].map((v, i) => (
              <span key={i} className="rounded-lg border-bold border-border flex items-center justify-center font-display text-[clamp(8px,4cqw,22px)]" style={{ background: v ? (i % 2 ? '#fdfd94' : '#fbfcf8') : '#ddd6ff', transform: `rotate(${(i % 3) - 1}deg)` }}>{v}</span>
            ))}
          </div>
        </div>
      );
    case 'flashcards':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #fdfd94, #ed9d75)' }} aria-hidden="true">
          {[[18, 22, -8, '#fbfcf8', ''], [28, 18, 4, '#fbfcf8', ''], [36, 24, -2, '#fbfcf8', '2 + 3 = ?']].map(([x, y, r, bg, txt], i) => (
            <span key={i} className="absolute w-[50%] aspect-[8/5] rounded-xl border-heavy border-border flex items-center justify-center font-display text-[clamp(10px,7cqw,34px)]" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)`, background: bg as string }}>{txt}</span>
          ))}
        </div>
      );
    case 'match-up':
      return (
        <div className={base} style={{ containerType: 'inline-size', background: 'linear-gradient(160deg, #ddd6ff, #ddfcc6)' }} aria-hidden="true">
          <div className="absolute inset-[10%] grid grid-cols-2 gap-x-[18%] gap-y-[6%]">
            {['3 + 4', '7', 'cat', 'animal', 'red', 'color'].map((v, i) => (
              <span key={i} className="rounded-lg border-bold border-border flex items-center justify-center font-display text-[clamp(8px,5cqw,24px)]" style={{ background: i % 2 ? '#fdfd94' : '#fbfcf8' }}>{v}</span>
            ))}
          </div>
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="none"><path d="M42 14 L58 14 M42 31 L58 31 M42 48 L58 48" stroke="#000" strokeWidth="1.5" strokeDasharray="3 2" /></svg>
        </div>
      );
    case 'bowling':
      // The approved alley (batch 7, 2026-11-24): the cream confetti wall over
      // the Lemon rail, a Peach lane with white pins on Lavender, a flat ball.
      return (
        <div className={base} style={{ background: '#ddd6ff' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="0" width="160" height="30" fill="#f6f0e4" />
            {[[12, 8, '#1fb5a8'], [34, 18, '#f055a5'], [58, 7, '#ccd537'], [98, 10, '#6a45f0'], [122, 20, '#4ba3e8'], [146, 8, '#f055a5'], [80, 20, '#ff9b28']].map(([x, y, c], i) => (
              i % 2 ? <path key={i} d={`M${x as number - 3} ${y as number - 3} l6 6 M${x as number + 3} ${y as number - 3} l-6 6`} stroke={c as string} strokeWidth="2.6" strokeLinecap="round" />
                : <circle key={i} cx={x as number} cy={y as number} r="3" fill={c as string} />
            ))}
            <rect x="0" y="28" width="160" height="4" fill="#fabe37" stroke="#1d1a33" strokeWidth="1" />
            <path d="M66 32 H94 L128 100 H32 Z" fill="#c9bffb" stroke="#1d1a33" strokeWidth="1.2" />
            <path d="M69 32 H91 L120 100 H40 Z" fill="#ffd9b3" stroke="#1d1a33" strokeWidth="1.2" />
            {[-12, -6, 0, 6, 12].map((d) => <path key={d} d={`M${80 + d * 0.4} 32 L${80 + d * 1.6} 100`} stroke="#ff9b28" strokeWidth="0.5" opacity="0.7" />)}
            {[[80, 36], [76.5, 38.5], [83.5, 38.5], [73, 41], [80, 41], [87, 41]].map(([x, y], i) => (
              <g key={i}><path d={`M${x} ${y - 4.5} c2 0 2 2.5 1.2 4.2 c1.6 2.4 1.8 5 0 6.6 h-2.4 c-1.8 -1.6 -1.6 -4.2 0 -6.6 c-.8 -1.7 -.8 -4.2 1.2 -4.2 Z`} fill="#fffaf0" stroke="#1d1a33" strokeWidth="0.6" /><path d={`M${x - 1.1} ${y - 0.6} h2.2`} stroke="#f055a5" strokeWidth="0.7" /></g>
            ))}
            <path d="M80 82 Q84 64 80 48" stroke="#1d1a33" strokeWidth="1" strokeDasharray="0.1 2.6" strokeLinecap="round" fill="none" />
            <circle cx="80" cy="88" r="8" fill="#f055a5" stroke="#1d1a33" strokeWidth="1.3" />
            <circle cx="78.5" cy="85" r="1.1" fill="#1d1a33" /><circle cx="81.5" cy="84.6" r="1.1" fill="#1d1a33" /><circle cx="80.4" cy="87.6" r="1.1" fill="#1d1a33" />
          </svg>
        </div>
      );
    case 'road-hop':
      return (
        <div className={base} style={{ background: '#8fe3a0' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
            <rect x="0" y="18" width="100" height="26" fill="#4a4f6a" /><rect x="0" y="56" width="100" height="26" fill="#4a4f6a" />
            <path d="M0 31 H100 M0 69 H100" stroke="#fff" strokeOpacity="0.6" strokeWidth="1.5" strokeDasharray="6 5" />
            {[[8, 21, '#e5635f'], [62, 21, '#6aa9e9'], [30, 59, '#f6c544'], [80, 59, '#c58ce8']].map(([x, y, c], i) => (
              <g key={i} transform={`translate(${x} ${y})`}><rect x="0" y="4" width="18" height="8" rx="3" fill={c as string} stroke="#000" strokeWidth="1" /><circle cx="4" cy="13" r="2.4" fill="#241c3d" /><circle cx="14" cy="13" r="2.4" fill="#241c3d" /></g>
            ))}
            <g transform="translate(50 92) scale(1.1)"><ellipse cx="0" cy="0" rx="9" ry="6.5" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="-4.5" cy="-6.5" r="3.6" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="4.5" cy="-6.5" r="3.6" fill="#9bd35a" stroke="#000" strokeWidth="1" /><circle cx="-4.5" cy="-6.5" r="1.9" fill="#fff" /><circle cx="4.5" cy="-6.5" r="1.9" fill="#fff" /><circle cx="-4.2" cy="-6.8" r="1" fill="#241c3d" /><circle cx="4.8" cy="-6.8" r="1" fill="#241c3d" /></g>
            <path d="M50 80 L50 50" stroke="#fdfd94" strokeWidth="2.5" strokeDasharray="2 4" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'farm-grow':
      return (
        <div className={base} style={{ background: '#bfe6a0' }} aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-[28%] bg-[#bfe8ff] border-b-[3px] border-border" />
          <svg viewBox="0 0 100 62" className="absolute inset-0 w-full h-full">
            <circle cx="14" cy="9" r="6" fill="#ffd84d" stroke="#000" strokeWidth="1" />
            <path d="M70 18 L82 9 L94 18 V34 H70 Z" fill="#e5635f" stroke="#000" strokeWidth="1.2" strokeLinejoin="round" /><rect x="78" y="24" width="8" height="10" fill="#fbfcf8" stroke="#000" strokeWidth="1" />
            {[[8, 24], [30, 24], [52, 24], [8, 43], [30, 43], [52, 43]].map(([x, y], i) => <rect key={i} x={x} y={y} width="19" height="16" rx="2" fill="#b98a5e" stroke="#000" strokeWidth="1.2" />)}
            {[[17, 36, '#f6c544'], [39, 36, '#e5635f'], [61, 55, '#f39a6b'], [17, 55, '#ffd84d']].map(([x, y, c], i) => <g key={i}><path d={`M${x} ${y} V${(y as number) - 8}`} stroke="#2f7d32" strokeWidth="1.5" /><circle cx={x as number} cy={(y as number) - 9} r="3.4" fill={c as string} stroke="#000" strokeWidth="1" /></g>)}
            <path d="M41 52 Q37 48 36 51 M41 52 Q45 48 46 51" fill="#7cc66a" stroke="#000" strokeWidth="0.8" />
          </svg>
        </div>
      );
    case 'lunch-rush':
      return (
        <div className={base} style={{ background: '#fde2c4' }} aria-hidden="true">
          <div className="absolute inset-x-0 top-0 h-[16%] border-b-[3px] border-border" style={{ background: 'repeating-linear-gradient(90deg, #e5635f 0 10%, #fbfcf8 10% 20%)' }} />
          <div className="absolute inset-x-0 bottom-0 h-[30%] border-t-[3px] border-border" style={{ background: '#ed9d75' }} />
          {[[8, Pizza, '#f6c544'], [38, IceCream, '#f6a5c0'], [68, Hamburger, '#f39a6b']].map(([x, I, c], i) => {
            const S = I as Icon;
            return <span key={i} className="absolute w-[24%] aspect-square rounded-full border-heavy border-border flex items-center justify-center" style={{ left: `${x}%`, top: '28%', background: c as string }}><S weight="fill" className="w-3/5 h-3/5" color="#241c3d" /></span>;
          })}
          <Heart weight="fill" className="absolute right-[6%] bottom-[8%] w-[14%] h-auto" color="#e5635f" />
        </div>
      );
    case 'territory':
      // The living room (teacher, 2026-11-24): mice out of the mouse hole,
      // cats on the rug, one mouse caught in a puff of stars.
      return (
        <RoomArt className={base}>
          {([[30, 84, 0, 20], [48, 90, 3, 22], [16, 92, 5, 21]] as const).map(([x, y, k, h], i) => <CatArt key={i} look={k} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%`, height: `${h}%`, width: 'auto' }} />)}
          {([[72, 74, 0], [86, 84, 1], [62, 88, 2]] as const).map(([x, y, k], i) => <MouseArt key={i} look={k} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: `${x}%`, top: `${y}%`, height: '9%', width: 'auto' }} />)}
          <PoofArt className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: '60%', top: '70%', height: '18%', width: 'auto' }} />
        </RoomArt>
      );
    case 'bubble-pop':
      // The approved in-play look (batch 7, 2026-11-24): flat brand bubbles at
      // the top of the pale-blue playfield on the cream doodle stage, the
      // dotted aim line and the loaded bubble.
      return (
        <div className={base} style={{ background: '#f6f0e4 url(/classic/bubble-pop/doodle.svg) repeat center / 40% auto' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <rect x="24" y="4" width="52" height="92" rx="6" fill="#bfdff3" stroke="#1d1a33" strokeWidth="2" />
            {Array.from({ length: 4 }, (_, r) => Array.from({ length: r % 2 ? 6 : 7 }, (_, c) => {
              const k = (r * 3 + c * 5) % BUBBLE_COLORS.length;
              return <circle key={`${r}-${c}`} cx={29 + c * 7 + (r % 2 ? 3.5 : 0)} cy={10 + r * 6.2} r="3.3" fill={BUBBLE_COLORS[k]} stroke="#1d1a33" strokeWidth="0.8" />;
            }))}
            <path d="M25 46 H75" stroke="#f055a5" strokeWidth="1" strokeDasharray="2 1.6" />
            <path d="M50 86 L58 36" stroke="#1d1a33" strokeWidth="1.1" strokeDasharray="0.1 2.4" strokeLinecap="round" />
            <circle cx="50" cy="86" r="4.6" fill="#f055a5" stroke="#1d1a33" strokeWidth="1" />
            <path d="M47.6 84.2 q1.2-1.8 3-2" stroke="#fffaf0" strokeWidth="1" fill="none" strokeLinecap="round" />
          </svg>
        </div>
      );
    case 'castle-quest': {
      // The approved park (batch 7, 2026-11-24): the board on its quiet mat in
      // the paper-craft park, pastel squares with no dots or numbers, the ink
      // Lose a turn and paper Roll again squares, crayon pawns and the die.
      const P4 = [PK.lavender, PK.crystal, PK.blush, PK.butter];
      const path: [number, number][] = [...Array.from({ length: 7 }, (_, i) => [i, 0] as [number, number]), [6, 1], ...Array.from({ length: 7 }, (_, i) => [6 - i, 2] as [number, number]), [0, 3], ...Array.from({ length: 7 }, (_, i) => [i, 4] as [number, number])];
      return (
        <div className={base} style={{ background: `${PARK_BG} center / cover` }} aria-hidden="true">
          <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2 w-[78%] aspect-[16/10] rounded-[7%] border-[0.2rem] border-[#1d1a33] shadow-[0_0.2rem_0_#1d1a33]" style={QUIET_MAT}>
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 80 50">
              {path.map(([c, r], i) => {
                const x = 4 + c * 10.4, y = 3.5 + r * 9;
                const kind = i === 0 ? 'start' : i === path.length - 1 ? 'finish' : i === 9 ? 'lose' : i === 15 ? 'again' : '';
                const fill = kind === 'start' ? PK.mint : kind === 'finish' ? PK.lemon : kind === 'lose' ? INK : kind === 'again' ? PK.paper : P4[i % 4];
                return <rect key={i} x={x} y={y} width="8.6" height="7.4" rx="1.6" fill={fill} stroke={INK} strokeWidth="0.7" />;
              })}
              <path d="M7.4 5.6 l3 1.8 -3 1.8 Z" fill={INK} />
              <path d="M47 21.4 h3.4 l-1.7 2.4 1.7 2.4 h-3.4 l1.7 -2.4 Z" fill={PK.lemon} />
            </svg>
          </div>
          <span className="absolute left-[26%] top-[26%] w-[6%]"><CrayonPawn color={PK.pink} size="100%" /></span>
          <span className="absolute left-[48%] top-[44%] w-[6%]"><CrayonPawn color="#6a45f0" size="100%" /></span>
          <span className="absolute right-[7%] bottom-[8%] w-[13%] rotate-6"><CrayonDieFace value={3} size="100%" /></span>
        </div>
      );
    }
    case 'pinball':
      // Mirrors the game: pockets in a line across the top, bonus lights,
      // three pop bumpers, the numbered lanes, rails, flippers and the ball.
      return (
        <div className={base} style={{ background: 'linear-gradient(180deg, #3a528c, #22336e)' }} aria-hidden="true">
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
            {[['#ff9b54', 60], ['#fbc94a', 100], ['#f2735f', 30], ['#8fe3a0', 80]].map(([c, v], i) => (
              <g key={i}><rect x={12 + i * 19} y="2" width="19" height="10" fill={c as string} stroke="#000" strokeWidth="0.6" /><text x={21.5 + i * 19} y="9.6" textAnchor="middle" fontSize="5" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="0.6" paintOrder="stroke">{v}</text></g>
            ))}
            <rect x="16" y="13.5" width="68" height="3.6" rx="1.8" fill="#000" opacity="0.4" />
            {[0, 1, 2, 3, 4, 5].map((k) => <circle key={k} cx={21 + k * 9} cy="15.3" r="1.3" fill={k < 3 ? '#fdfd94' : '#1d2440'} stroke={k < 3 ? '#000' : '#fff'} strokeWidth="0.3" />)}
            {[[30, 24], [50, 30], [70, 24]].map(([x, y]) => (
              <g key={x}><circle cx={x} cy={y} r="4.4" fill="#fff" stroke="#000" strokeWidth="0.4" /><circle cx={x} cy={y} r="3.6" fill="#f2735f" stroke="#000" strokeWidth="0.4" /><circle cx={x} cy={y} r="1.5" fill="#fff" /></g>
            ))}
            {['#f6c544', '#9b7be0', '#ef5d7a', '#4fb6d8', '#f39ac0'].map((c, i) => (
              <g key={c}><rect x={16 + i * 13.6} y="37" width="13.6" height="6.4" fill={c} stroke="#000" strokeWidth="0.5" /><text x={22.8 + i * 13.6} y="42.3" textAnchor="middle" fontSize="4.6" fontWeight="900" fill="#fff" stroke="#000" strokeWidth="0.6" paintOrder="stroke">{i + 1}</text></g>
            ))}
            <path d="M14 46 L30 58 M86 46 L70 58" stroke="#c9d3ea" strokeWidth="1.2" strokeLinecap="round" />
            <path d="M33 56 L45 59 L45 60 L33 58 Z M67 56 L55 59 L55 60 L67 58 Z" fill="#fdfd94" stroke="#000" strokeWidth="0.5" />
            <circle cx="50" cy="56" r="2.6" fill="#e7ecf5" stroke="#000" strokeWidth="0.5" /><circle cx="49.2" cy="55.2" r="0.8" fill="#fff" />
          </svg>
        </div>
      );
    case 'big-screen':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #fdfd94, #ff9a8b)' }} aria-hidden="true"><Scatter icons={[Trophy, Star, Crown, Sparkle, Star, Trophy]} colors={['#fdfd94', '#ffd166', '#fbfcf8', '#ddd6ff', '#ffffff', '#fdfd94']} /></div>;
    case 'sign-in':
      return <div className={base} style={{ background: 'linear-gradient(160deg, #ddfcc6, #ddd6ff)' }} aria-hidden="true"><Scatter icons={[Cat, Dog, Fish, Sun, Rocket, Heart]} colors={['#fdfd94', '#ed9d75', '#ddd6ff', '#ffd166', '#cdd7fb', '#e5635f']} /></div>;
    case 'star-quiz':
    default:
      // The teacher's Classic sky for the Question Tracker (2026-10-31).
      return (
        <div className={base} style={{ background: '#2b3a7a url(/classic/star-quiz/background.webp) center / cover' }} aria-hidden="true">
          {[[8, 14, 22, -12, 1], [62, 8, 26, 10, 2], [80, 52, 16, 18, 3], [30, 50, 30, -6, 4], [52, 34, 14, 24, 5], [6, 66, 18, 8, 6]].map(([x, y, w, r, k], i) => (
            <img key={i} src={`/classic/star-quiz/item-${k}.webp`} alt="" className="absolute h-auto" style={{ left: `${x}%`, top: `${y}%`, width: `${w}%`, transform: `rotate(${r}deg)` }} draggable="false" />
          ))}
        </div>
      );
  }
}

// Covers for Gamify's designed themes (teacher, 2026-10-31): each shows the
// theme's own art in a small scene of its game.
// A theme's cover with its title lettering across the bottom when it has one
// (teacher, 2026-11-13: themes can design their own title).
export function ThemeCover({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const title = theme.pieces.title?.image;
  if (!title) return <ThemeCoverArt theme={theme} className={className} />;
  return (
    <div className={`relative ${className}`}>
      <ThemeCoverArt theme={theme} className="absolute inset-0 w-full h-full" />
      <img src={title} alt="" aria-hidden="true" className="absolute inset-x-[6%] bottom-[5%] w-[88%] h-[28%] object-contain drop-shadow-[0_3px_0_rgba(0,0,0,0.35)]" />
    </div>
  );
}

function ThemeCoverArt({ theme, className = '' }: { theme: GameTheme; className?: string }) {
  const base = `relative overflow-hidden ${className}`;
  const bg = theme.colors.background;
  if (theme.discs?.length) {
    // Four in a Row pieces: a board with the theme's pieces dropped in.
    const d = theme.discs;
    return (
      <div className={base} style={{ background: bg }} aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62">
          <rect x="18" y="6" width="64" height="44" rx="5" fill={theme.pieces.board?.color ?? '#4f8fd6'} stroke="#000" strokeWidth="1.2" />
          {Array.from({ length: 15 }, (_, i) => {
            const cx = 26 + (i % 5) * 12, cy = 15 + Math.floor(i / 5) * 13;
            const pick = [2, 6, 10, 14].includes(i) ? 0 : [5, 11, 12, 7].includes(i) ? 1 : -1;
            return pick < 0 ? <circle key={i} cx={cx} cy={cy} r="5" fill="#fff" stroke="#000" strokeWidth="1" /> : <image key={i} href={d[(pick * 3) % d.length].image} x={cx - 5.5} y={cy - 5.5} width="11" height="11" />;
          })}
        </svg>
      </div>
    );
  }
  if (theme.itemImages?.length && theme.pieces.background?.image) {
    // A room theme (Question Tracker Pet Room): the room with a few pets in it.
    return (
      <div className={base} style={{ background: `${bg} center / cover url("${theme.pieces.background.image}")` }} aria-hidden="true">
        {theme.itemImages.slice(0, 4).map((src, i) => (
          <img key={src} src={src} alt="" className="absolute w-[17%] object-contain" style={{ left: `${12 + i * 21}%`, bottom: `${8 + (i % 2) * 10}%`, imageRendering: theme.pixelArt ? 'pixelated' : undefined }} />
        ))}
      </div>
    );
  }
  const tiles = [0, 1, 2, 3, 4, 5].map((k) => theme.pieces[`tile-${k}`]).filter((p) => p?.image);
  if (tiles.length) {
    // Match Three pieces: a board of the theme's pieces with a match lit up.
    return (
      <div className={base} style={{ background: bg }} aria-hidden="true">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
          <g transform="rotate(-6 50 31)">
            <rect x="16" y="3" width="68" height="56" rx="5" fill={theme.pieces.board?.color ?? '#fff'} stroke="#000" strokeWidth="1.2" />
            {[[0, 2, 4, 3, 5], [3, 1, 1, 1, 0], [5, 4, 2, 0, 3], [2, 0, 5, 4, 1]].map((row, r) => row.map((k, c) => {
              const x = 19 + c * 12.8, y = 6 + r * 13, lit = r === 1 && c >= 1 && c <= 3;
              const p = tiles[k % tiles.length]!;
              return <g key={`${r}-${c}`}><rect x={x} y={y} width="11.8" height="11.8" rx="2.4" fill={lit ? '#fdfd94' : p.color ?? '#eee'} stroke={lit ? '#000' : 'none'} strokeWidth="0.8" /><image href={p.image} x={x} y={y} width="11.8" height="11.8" /></g>;
            }))}
          </g>
        </svg>
      </div>
    );
  }
  const cover = theme.pieces.cover?.image;
  return <div className={base} style={{ background: cover ? `${bg} center / contain no-repeat url("${cover}")` : bg }} aria-hidden="true" />;
}

// A game card's cover: a game with Gamify's designed themes shows them
// (teacher, 2026-10-31: "show them instead of the default"), and hovering
// for 3 seconds moves to the next one, cycling through, then Classic.
export function CyclingCover({ gameId, className = '' }: { gameId: string; className?: string }) {
  const looks = houseFor(gameId);
  const [i, setI] = useState(0);
  const timer = useRef<number | null>(null);
  const reduce = useReducedMotion();
  const box = useRef<HTMLDivElement>(null);
  const count = looks.length + 1; // the designed themes, then Classic
  // Hovering anywhere on the card (or focusing it) starts the cycle.
  useEffect(() => {
    if (!looks.length) return;
    const card = box.current?.closest('a, li, article, [data-card]') ?? box.current;
    if (!card) return;
    const start = () => { if (!timer.current) timer.current = window.setInterval(() => setI((n) => (n + 1) % count), 3000); };
    const stop = () => { if (timer.current) { window.clearInterval(timer.current); timer.current = null; } };
    card.addEventListener('mouseenter', start); card.addEventListener('mouseleave', stop);
    card.addEventListener('focusin', start); card.addEventListener('focusout', stop);
    return () => { stop(); card.removeEventListener('mouseenter', start); card.removeEventListener('mouseleave', stop); card.removeEventListener('focusin', start); card.removeEventListener('focusout', stop); };
  }, [looks.length, count]);
  if (!looks.length) return <GameCover gameId={gameId} className={className} />;
  return (
    <div ref={box} className={`relative overflow-hidden ${className}`}>
      <AnimatePresence initial={false}>
        <motion.div key={i} className="absolute inset-0" initial={reduce ? { opacity: 0 } : { opacity: 0, x: '12%' }} animate={{ opacity: 1, x: 0 }} exit={reduce ? { opacity: 0 } : { opacity: 0, x: '-12%' }} transition={{ duration: 0.45 }}>
          {i < looks.length ? <ThemeCover theme={looks[i]} className="w-full h-full" /> : <GameCover gameId={gameId} className="w-full h-full" />}
        </motion.div>
      </AnimatePresence>
      <span className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1" aria-hidden="true">
        {Array.from({ length: count }, (_, k) => <span key={k} className={`w-2 h-2 rounded-full border border-border ${k === i ? 'bg-accent' : 'bg-surface/80'}`} />)}
      </span>
    </div>
  );
}
