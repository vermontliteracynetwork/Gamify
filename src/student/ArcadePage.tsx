import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, LockSimple, SignOut } from '@phosphor-icons/react';
import { canPlayGame } from '../config';
import { data } from '../data';
import { useAsync, useTier } from '../data/hooks';
import type { Student } from '../data/types';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { PICTURES } from './pictures';
import PictureBadge from './PictureBadge';
import { useMadeThemes } from '../theme/made';
import { setSession, useArcade, useSession } from './session';
import Title from '../ui/Title';

// Student sign-in on a shared iPad: tap your name, then your two pictures.
// Then the student Arcade: games the class may play, filled with exactly
// the sets the teacher assigned. Locked games show a lock only (no prices).
export function ArcadeSignIn() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  const { value: students = [] } = useAsync(() => data.listStudents(classId), [classId]);
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [who, setWho] = useState<Student | null>(null);
  const [taps, setTaps] = useState<string[]>([]);
  const [wrong, setWrong] = useState(false);
  const classroom = classes.find((c) => c.id === classId);
  const { themes } = useMadeThemes();
  const look = themes.find((th) => th.id === classroom?.signInThemeId);

  function tap(id: string) {
    const next = [...taps, id];
    setTaps(next);
    if (next.length < 2 || !who) return;
    if (next[0] === who.picturePassword[0] && next[1] === who.picturePassword[1]) {
      setSession({ classroomId: classId, studentId: who.id, name: who.name });
      navigate('/arcade');
    } else { setWrong(true); window.setTimeout(() => { setTaps([]); setWrong(false); }, 700); }
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="title-bubble text-4xl sm:text-5xl text-center mb-6"><Title text={who ? t('arcade.hi', { name: who.name }) : classroom?.name ?? t('arcade.title')} /></h1>
      {!who && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {students.map((s) => {
            return (
              <button key={s.id} type="button" onClick={() => setWho(s)} className="min-h-20 rounded-panel border-[2.5px] border-border bg-surface flex items-center gap-3 p-3 text-left active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <PictureBadge id={s.picturePassword[0]} theme={look} size={48} />
                <span className="font-display text-xl font-bold">{s.name}</span>
              </button>
            );
          })}
          {students.length === 0 && <p className="font-bold col-span-full text-center">{t('arcade.noStudents')}</p>}
        </div>
      )}
      {who && (
        <div className="grid gap-5 justify-items-center">
          <p className="font-bold text-lg">{t('arcade.tapPictures')}</p>
          <motion.div className="flex gap-3" animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined} role="img" aria-label={t('arcade.tapped', { count: taps.length })}>
            {[0, 1].map((i) => taps[i]
              ? <PictureBadge key={i} id={taps[i]} theme={look} size={80} />
              : <span key={i} className="w-20 h-20 rounded-full border-[3px] border-border bg-surface" />)}
          </motion.div>
          <div className="grid grid-cols-4 gap-3">
            {PICTURES.map((p) => (
              <button key={p.id} type="button" onClick={() => tap(p.id)} aria-label={p.id} disabled={taps.length >= 2}
                className="rounded-full active:scale-90" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <PictureBadge id={p.id} theme={look} size={80} />
              </button>
            ))}
          </div>
          <button type="button" onClick={() => { setWho(null); setTaps([]); }} className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2"><ArrowLeft weight="bold" size={20} />{t('arcade.notMe')}</button>
        </div>
      )}
    </main>
  );
}

export function Arcade() {
  const session = useSession();
  const { pool, modes } = useArcade(session);
  const tier = useTier();
  const navigate = useNavigate();
  useEffect(() => { if (!session) navigate('/join', { replace: true }); }, [session, navigate]);
  if (!session) return null;
  // Games a student plays on their own device (Share games run on the teacher's screen).
  const games = GAMES.filter((g) => g.modes.some((m) => (m === 'solo' || m === 'versus') && modes.includes(m)));

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('arcade.mine', { name: session.name })} /></h1>
        <button type="button" onClick={() => setSession(null)} className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface font-bold inline-flex items-center gap-2"><SignOut weight="bold" size={20} />{t('arcade.signOut')}</button>
      </div>
      {pool.length === 0 && <p className="font-bold mb-4 bg-surface rounded-input border-[2px] border-border p-3">{t('arcade.noSets')}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {games.map((g) => {
          const open = canPlayGame(tier, g.id);
          const card = (
            <>
              <span className="relative block">
                <GameCover gameId={g.id} className={`aspect-[16/9] border-b-[2.5px] border-border ${open ? '' : 'grayscale opacity-60'}`} />
                {!open && <span className="absolute inset-0 flex items-center justify-center"><span className="w-16 h-16 rounded-full bg-surface border-[3px] border-border flex items-center justify-center"><LockSimple weight="fill" size={32} /></span></span>}
              </span>
              <span className="p-4 grid gap-2">
                <span className="font-display text-2xl font-bold text-text">{g.name}</span>
                <span className="flex flex-wrap gap-2">{g.modes.filter((m) => modes.includes(m)).map((m) => <ModeBadge key={m} mode={m} />)}</span>
              </span>
            </>
          );
          return open
            ? <Link key={g.id} to={`/games/${g.id}`} className="rounded-panel bg-surface border-[2.5px] border-border no-underline overflow-hidden active:scale-[0.98]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>{card}</Link>
            : <div key={g.id} aria-label={t('arcade.locked', { name: g.name })} className="rounded-panel bg-surface border-[2.5px] border-border overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker)' }}>{card}</div>;
        })}
      </div>
    </main>
  );
}
