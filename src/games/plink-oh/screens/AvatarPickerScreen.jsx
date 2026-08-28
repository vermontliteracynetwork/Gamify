import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check } from '@phosphor-icons/react';
import { Panel, Button } from '../components/ui';
import { AVATARS } from '../data';

// Per-player avatar selection -- new capability (Setup previously only had
// a name field + a small color swatch row). Matches the Canva "Player 1"
// picker mockup: a title-bubble player name, a Back / Next Player pair of
// actions, and a grid of avatar circles with the current pick highlighted
// and labeled underneath. Avatar art is a color placeholder for now (see
// data.js) -- swap AVATARS[i].image once real files land.
export default function AvatarPickerScreen({ team, isLastTeam, onSelectAvatar, onBack, onNext }) {
  return (
    <Panel>
      <div className="flex items-center justify-between gap-3 mb-6">
        <button
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-pill flex items-center justify-center bg-surface-2 border-[2.5px] border-border
                     active:scale-90 motion-safe:transition-transform"
          style={{ boxShadow: 'var(--shadow-sticker)' }}
        >
          <ArrowLeft weight="bold" size={17} />
        </button>
        <h2 className="title-bubble text-2xl text-center flex-1">{team.name}</h2>
        <Button variant="secondary" onClick={onNext} className="whitespace-nowrap">
          {isLastTeam ? 'Done' : 'Next Player'}
          <ArrowRight weight="bold" size={15} />
        </Button>
      </div>

      <div className="grid grid-cols-5 gap-3 sm:gap-4">
        {AVATARS.map((avatar, i) => {
          const selected = team.avatarId === avatar.id;
          return (
            <button
              key={avatar.id}
              onClick={() => onSelectAvatar(avatar.id)}
              className="flex flex-col items-center gap-1.5"
            >
              <motion.span
                whileTap={{ scale: 0.92 }}
                animate={selected ? { scale: 1.08 } : { scale: 1 }}
                className="w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center border-[2.5px] border-border font-display font-bold"
                style={{
                  background: selected ? avatar.color : 'var(--surface-2)',
                  boxShadow: selected ? '0 3px 0 var(--border)' : 'none',
                }}
              >
                {selected ? <Check weight="bold" size={22} /> : <span className="text-muted text-sm">{i + 1}</span>}
              </motion.span>
              <span className="text-xs font-bold text-text max-w-[64px] truncate">
                {selected ? team.name : i + 1}
              </span>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
