import { useId, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { X } from '@phosphor-icons/react';
import { useSettings } from '../settings/SettingsContext';
import DialogFocus from './DialogFocus';
import Title from './Title';
import { IconButton } from './kit';

// The one pop-up box for menus and teacher pages (design system, 2026-11-18):
// a dimmed screen, an off-white sticker box that pops in, a title in the
// heading font, an optional line under it and a round close button. Keyboard
// care comes with it (focus moves in, Tab stays inside, Escape closes).
// Game screens keep their own themed overlays (power-up pops, results).
const WIDTH = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' } as const;

export default function Dialog({ title, sub, onClose, closeLabel, size = 'md', center = false, zIndex = 50, children }: {
  title: string; sub?: string; onClose?: () => void; closeLabel?: string; size?: keyof typeof WIDTH; center?: boolean; zIndex?: number; children: ReactNode;
}) {
  const { settings } = useSettings();
  const id = useId();
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 bg-black/40" style={{ zIndex }} role="dialog" aria-modal="true" aria-labelledby={id}>
      <DialogFocus onClose={onClose} />
      <motion.div initial={settings.motion === 'still' ? false : { scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className={`w-full ${WIDTH[size]} bg-surface border-bold border-border rounded-panel p-5 grid gap-4 overflow-y-auto text-[var(--text)] ${center ? 'justify-items-center text-center' : ''}`}
        style={{ boxShadow: 'var(--shadow-sticker-lg)', maxHeight: 'calc(100dvh - 2rem)' }}>
        <div className={`flex items-start gap-2 ${center ? 'w-full' : ''}`}>
          <div className="flex-1 min-w-0 grid gap-0.5">
            <h2 id={id} className="font-display text-2xl leading-tight"><Title text={title} /></h2>
            {sub && <p className="font-semibold text-sm text-muted">{sub}</p>}
          </div>
          {onClose && closeLabel && (
            <IconButton label={closeLabel} onClick={onClose}><X weight="bold" size={18} /></IconButton>
          )}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
