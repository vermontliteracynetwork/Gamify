import { SpeakerHigh } from '@phosphor-icons/react';
import { t } from '../../../i18n';
import { backdropStyle, pieceFill } from '../../library';
import type { GameTheme } from '../../types';

// Flashcards as play draws it (teacher, 2026-11-16): the progress bar, the
// card's question side on top of the pile, and the answer side under it, so
// both card designs show.
export default function FlashcardsPreview({ theme }: { theme: GameTheme }) {
  return (
    <div className="relative rounded-panel border-[2.5px] border-border overflow-hidden aspect-[4/3] px-[8%] py-[5%] grid grid-rows-[auto_minmax(0,1fr)_auto] gap-[4%]" style={{ ...backdropStyle(theme, false), ['--stage-bg-text' as string]: theme.colors.backgroundText }} role="img" aria-label={`Preview of ${theme.name || 'this theme'}`}>
      <div className="flex items-center gap-2">
        <div className="flex-1 h-3 rounded-pill border-[2px] border-border bg-surface overflow-hidden"><span className="block h-full w-[30%]" style={{ background: '#9fe7a0' }} /></div>
        <span className="font-display text-base stage-text tabular-nums">3/10</span>
      </div>
      <div className="relative min-h-0">
        {/* The answer side, under the pile. */}
        <div className="absolute top-[5%] left-[5%] right-0 bottom-0 rotate-[3deg] rounded-panel border-[3px] border-border" style={{ boxShadow: 'var(--shadow-sticker)', ...pieceFill(theme, 'card-back', '#fdfd94') }} />
        <div className="absolute top-0 left-0 right-[5%] bottom-[7%] rounded-panel border-[3px] border-border p-3 grid gap-1.5 content-center justify-items-center text-center" style={{ boxShadow: 'var(--shadow-sticker-lg)', ...pieceFill(theme, 'card-front', '#fbfcf8') }}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted">{t('mm.question')}</span>
          <span className="font-bold text-xl leading-tight text-balance">Which word means very big?</span>
          <span className="text-[11px] font-bold text-muted">{t('fc.tapToFlip')}</span>
        </div>
      </div>
      <div className="flex justify-center">
        <span className="h-8 px-3 rounded-pill border-[2px] border-border bg-surface font-bold text-xs inline-flex items-center gap-1.5"><SpeakerHigh weight="bold" size={14} />{t('fc.listen')}</span>
      </div>
    </div>
  );
}
