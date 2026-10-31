import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Timer } from '@phosphor-icons/react';
import { t } from '../i18n';
import { useSettings } from '../settings/SettingsContext';
import { getSession } from '../student/session';
import { playEffect } from './feedback';

// The teacher's play clock (2026-10-31). An activity can set how long
// students play (or a time every game ends by) and a score that ends the
// game. Every student game calls usePlayClock: a calm 3-minute and 1-minute
// heads-up, then the game ends the normal way (its own results with the
// points so far), and a little later the student moves to the "Look at
// your teacher" screen. Everyone with the same end time finishes together.
export function usePlayClock({ playing, score, onTimeUp }: { playing: boolean; score: number; onTimeUp: () => void }): { element: ReactNode; ended: boolean } {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [note, setNote] = useState<'' | 'three' | 'one'>('');
  const [ended, setEnded] = useState(false);
  const done = useRef(onTimeUp);
  done.current = onTimeUp;
  const session = getSession();
  const endAt = session?.endAt;
  const goal = session?.goal;

  useEffect(() => {
    if (!playing || !endAt || ended) return;
    const timers: number[] = [];
    const at = (ms: number, fn: () => void) => { const wait = endAt - ms - Date.now(); if (wait > 0) timers.push(window.setTimeout(fn, wait)); else if (ms === 0) fn(); };
    const heads = (k: 'three' | 'one') => () => { setNote(k); playEffect('tap', settings); timers.push(window.setTimeout(() => setNote(''), 6000)); };
    at(180000, heads('three'));
    at(60000, heads('one'));
    at(0, () => { setEnded(true); done.current(); });
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [playing, endAt, ended]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (playing && goal && score >= goal && !ended) { setEnded(true); done.current(); }
  }, [playing, goal, score, ended]);

  // After the results have had their moment, students go to the teacher screen.
  useEffect(() => {
    if (!ended) return;
    const id = window.setTimeout(() => navigate('/look-up'), 20000);
    return () => window.clearTimeout(id);
  }, [ended, navigate]);

  const element = (
    <AnimatePresence>
      {note && (
        <motion.div role="status" initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 px-5 min-h-14 rounded-pill bg-accent border-[2.5px] border-border font-display text-xl"
          style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Timer weight="fill" size={26} aria-hidden="true" />{t(note === 'three' ? 'clock.three' : 'clock.one')}
        </motion.div>
      )}
    </AnimatePresence>
  );
  return { element, ended };
}
