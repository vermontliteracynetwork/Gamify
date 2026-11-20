import { CheckCircle } from '@phosphor-icons/react';
import { TeamBadge, TeamArt } from '../../engine/TeamBadge';
import { backdropStyle, pieceImage } from '../library';
import { THEME_FONTS, type GameTheme } from '../types';

// The question screens as a theme dresses them (teacher, 2026-11-20: "show
// question tracker with a fake question window for student view and then
// the share view", and "show a preview of what the actual text and buttons
// will look like"): a made-up question in the game's own question box, with
// the theme's title text, main color and button text.
const TILES = ['bg-quiz-yellow', 'bg-quiz-green', 'bg-quiz-blue', 'bg-quiz-orange'];
const Q = { prompt: 'Which animal lives in the ocean?', choices: ['A camel', 'A dolphin', 'A rabbit', 'An owl'], right: 1 };

function vars(theme: GameTheme) {
  return {
    ['--color-accent' as string]: theme.colors.accent,
    ['--color-accent-ink' as string]: theme.colors.accentText,
    ['--font-display' as string]: THEME_FONTS[theme.fonts.display] ?? THEME_FONTS['Grow Year'],
    containerType: 'inline-size' as const,
  };
}

function Answers({ big }: { big?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-[1.6cqw]">
      {Q.choices.map((c, i) => (
        <span key={c} className={`relative ${TILES[i]} rounded-[1.4cqw] border-border font-bold flex items-center leading-tight ${big ? 'border-[0.6cqw] min-h-[9cqw] text-[3cqw] pl-[9cqw]' : 'border-[0.45cqw] min-h-[7cqw] text-[2.4cqw] pl-[7cqw]'} pr-[1.5cqw] ${i === Q.right ? 'ring-[0.8cqw] ring-success' : 'opacity-45'}`} style={{ boxShadow: '0 0.6cqw 0 #000' }}>
          <span className={`absolute left-[1.4cqw] top-1/2 -translate-y-1/2 rounded-full bg-surface border-border flex items-center justify-center font-display ${big ? 'w-[6cqw] h-[6cqw] text-[2.8cqw] border-[0.5cqw]' : 'w-[4.6cqw] h-[4.6cqw] text-[2.2cqw] border-[0.35cqw]'}`}>{i + 1}</span>
          <span className="min-w-0">{c}</span>
          {i === Q.right && <CheckCircle weight="fill" className="ml-auto shrink-0 text-success w-[3.4cqw] h-[3.4cqw]" aria-hidden="true" />}
        </span>
      ))}
    </div>
  );
}

const okButton = (big?: boolean) => (
  <span className={`justify-self-center self-center rounded-pill border-border bg-accent text-accent-ink font-display font-bold ${big ? 'px-[7cqw] py-[1.2cqw] text-[3.4cqw] border-[0.6cqw]' : 'px-[6cqw] py-[1cqw] text-[2.8cqw] border-[0.45cqw]'}`} style={{ boxShadow: '0 0.6cqw 0 #000' }}>OK</span>
);

// A student's own device: the game behind, the question box over it.
export function StudentQuestionView({ theme }: { theme: GameTheme }) {
  const sky = theme.gameId === 'star-quiz' ? pieceImage(theme, 'background') : undefined;
  return (
    <div className="rounded-panel border-bold border-border overflow-hidden aspect-[4/3] grid grid-rows-[auto_1fr] p-[2.5cqw] gap-[1.5cqw]" role="img" aria-label="Preview: a question on a student's screen"
      style={{ ...vars(theme), ...(sky ? { background: `center / cover url("${sky}")` } : backdropStyle(theme, false)) }}>
      {/* Title text sits straight on the background. */}
      <p className="font-display font-bold text-[4cqw] leading-none text-center" style={{ color: theme.colors.backgroundText }}>Question 2 of 10</p>
      <div className="self-center bg-surface rounded-[2cqw] border-[0.7cqw] border-border p-[3cqw] grid gap-[2cqw]" style={{ boxShadow: '0 0 0 1.2cqw rgba(255,255,255,0.18), 0 2cqw 5cqw rgba(0,0,0,0.35)' }}>
        <p className="font-bold text-[3.4cqw] leading-snug">{Q.prompt}</p>
        <Answers />
        <p className="font-display font-bold text-[3cqw] text-center leading-none text-[#1f7a45]">Right!</p>
        {okButton()}
      </div>
    </div>
  );
}

// The shared big screen: whose turn, the question large, every answer big.
export function ShareQuestionView({ theme }: { theme: GameTheme }) {
  return (
    <div className="rounded-panel border-bold border-border overflow-hidden aspect-[4/3] bg-surface flex flex-col justify-center px-[4cqw] py-[3cqw] gap-[2.4cqw]" role="img" aria-label="Preview: a question on the shared screen" style={vars(theme)}>
      <div className="flex items-center gap-[1.6cqw]">
        <TeamArt.Provider value={Array.from({ length: 10 }, (_, k) => pieceImage(theme, `team-${k + 1}`) ?? (theme.gameId === 'bowling' ? pieceImage(theme, `ball-${k + 1}`) : undefined))}>
          <span className="w-[7cqw] h-[7cqw] grid place-items-center [&>*]:!w-full [&>*]:!h-full"><TeamBadge colorIndex={0} size={48} /></span>
        </TeamArt.Provider>
        <span className="font-display font-bold text-[4.2cqw] leading-none">Glowing Pickle</span>
      </div>
      <p className="font-bold text-[4.4cqw] leading-tight">{Q.prompt}</p>
      <Answers big />
      {okButton(true)}
    </div>
  );
}
