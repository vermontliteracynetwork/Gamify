import { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LockSimple, SignOut, PaintBrush } from '@phosphor-icons/react';
import { canPlayGame } from '../config';
import { useTier } from '../data/hooks';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import StudentPicker from './StudentPicker';
import { setSession, useArcade, useSession } from './session';
import Title from '../ui/Title';

// Student sign-in on a shared iPad: tap your avatar, then type your PIN.
// Then the student Arcade: games the class may play, filled with exactly
// the sets the teacher assigned. Locked games show a lock only (no prices).
export function ArcadeSignIn() {
  const { classId = '' } = useParams();
  const navigate = useNavigate();
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <h1 className="title-bubble text-4xl sm:text-5xl text-center mb-6"><Title text={t('arcade.who')} /></h1>
      <StudentPicker classroomId={classId} onSignIn={(s) => { setSession({ classroomId: classId, studentId: s.id, name: s.name }); navigate('/arcade'); }} />
    </main>
  );
}

export function Arcade() {
  const session = useSession();
  const { pool, modes, canDesign } = useArcade(session);
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
        {canDesign && (
          <Link to="/arcade/design" className="rounded-panel bg-surface border-[2.5px] border-border no-underline overflow-hidden active:scale-[0.98]" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
            <span className="aspect-[16/9] border-b-[2.5px] border-border flex items-center justify-center" style={{ background: 'repeating-linear-gradient(45deg, #fdfd94 0 18px, #ddfcc6 18px 36px)' }}><PaintBrush weight="fill" size={64} color="#241c3d" aria-hidden="true" /></span>
            <span className="p-4 grid gap-1"><span className="font-display text-2xl font-bold text-text">{t('design.title')}</span><span className="font-bold text-sm text-muted">{t('design.card')}</span></span>
          </Link>
        )}
      </div>
    </main>
  );
}
