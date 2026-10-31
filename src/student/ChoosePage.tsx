import { Link, Navigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { GameCover } from '../games/covers';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import Title from '../ui/Title';
import { useSession } from './session';

// A choice board from the teacher's class lobby (Pro, teacher 2026-10-31):
// the student picks one of the games the teacher chose. Big covers, the
// game's name, nothing else to wander into.
export default function ChoosePage() {
  const session = useSession();
  const reduce = useReducedMotion();
  if (!session?.board) return <Navigate to="/join" replace />;
  const { gameIds, setId } = session.board;
  const games = GAMES.filter((g) => gameIds.includes(g.id));
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-12 grid gap-6">
      <h1 className="title-bubble text-4xl sm:text-5xl text-center"><Title text={t('choose.title', { name: session.name })} /></h1>
      <ul className="grid grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
        {games.map((g, i) => (
          <motion.li key={g.id} initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : i * 0.07 }}
            whileHover={reduce ? undefined : { y: -6, rotate: i % 2 ? 1 : -1 }} whileTap={{ scale: 0.97 }}>
            <Link to={`/games/${g.id}?set=${setId}`} className="block rounded-panel border-[2.5px] border-border bg-surface overflow-hidden no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <GameCover gameId={g.id} className="aspect-[16/10] border-b-[2.5px] border-border" />
              <span className="block p-3 font-display text-2xl text-center">{g.name}</span>
            </Link>
          </motion.li>
        ))}
      </ul>
    </main>
  );
}
