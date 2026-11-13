import { useState } from 'react';
import { motion } from 'motion/react';
import { t } from '../i18n';
import { playNote, playPop } from '../engine/feedback';
import { TeamBadge } from '../engine/TeamBadge';
import { useSettings } from '../settings/SettingsContext';

// A toy for the waiting room (teacher, 2026-11-13): bouncy pieces to tap
// while the class gathers. Each tap squishes the piece, sends it hopping and
// plays the next note of a little tune. Nothing to win, nothing to lose.
const PIECES = Array.from({ length: 7 }, (_, i) => ({ i, x: 6 + i * 13.5, delay: (i * 0.37) % 1.4, dur: 1.4 + (i % 3) * 0.35 }));

export default function LobbyToy() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const [hops, setHops] = useState<Record<number, number>>({});
  const [note, setNote] = useState(0);
  function tap(i: number) {
    setHops((h) => ({ ...h, [i]: (h[i] ?? 0) + 1 }));
    playNote(note, settings); playPop(settings);
    setNote((n) => n + 1);
  }
  return (
    <div className="relative w-full h-36 rounded-panel border-[2.5px] border-border overflow-hidden" style={{ background: 'linear-gradient(180deg, #e6e9ff 0%, #c9d2ff 100%)', boxShadow: 'var(--shadow-sticker)' }}
      role="group" aria-label={t('live.toy')}>
      <span className="absolute inset-x-0 bottom-0 h-5 bg-[#9fb0f0] border-t-[2.5px] border-border" aria-hidden="true" />
      {PIECES.map((p) => (
        <motion.button key={p.i} type="button" onClick={() => tap(p.i)} aria-label={t('live.toyPiece', { n: p.i + 1 })}
          className="absolute bottom-5 -translate-x-1/2 rounded-full"
          style={{ left: `${p.x + 4}%`, animation: still ? undefined : `toy-bounce ${p.dur}s cubic-bezier(.3,0,.7,1) ${p.delay}s infinite` }}>
          <motion.span key={hops[p.i] ?? 0} className="block" initial={false} whileHover={still ? undefined : { scale: 1.12 }}
            animate={hops[p.i] && !still ? { y: [0, -70, 0, -18, 0], scaleY: [0.7, 1.15, 0.85, 1.05, 1], rotate: [0, 200, 360, 360, 360] } : { y: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}>
            <TeamBadge colorIndex={p.i} size={40} />
          </motion.span>
        </motion.button>
      ))}
    </div>
  );
}
