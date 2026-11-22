import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import Title from '../ui/Title';
import Loading from '../ui/Loading';
import LabGame from './LabGame';
import { FAMILIES, LAB_GAMES, loadLabGame } from './registry';
import type { LabDef } from './types';

// The Game Lab list (preview only, teacher 2026-11-22): every new game,
// grouped by family. Not linked from the main site.
export function LabIndex() {
  return (
    <div className="brand-menu min-h-[calc(100dvh-4rem)]">
      <main className="max-w-[84rem] mx-auto px-4 sm:px-8 pt-6 pb-12 grid gap-6">
        <header className="grid gap-1">
          <h1 className="title-bubble text-4xl" style={{ color: 'var(--text)' }}><Title text="Game Lab" /></h1>
          <p className="font-semibold text-muted">New games in Classic, on the preview only. Tap one to play.</p>
        </header>
        {FAMILIES.map((f) => {
          const list = LAB_GAMES.filter((g) => g.family === f);
          if (!list.length) return null;
          return (
            <section key={f} className="grid gap-3" aria-label={f}>
              <h2 className="font-heading text-xl">{f}</h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(14rem,1fr))] gap-3 list-none m-0 p-0">
                {list.map((g, i) => (
                  <motion.li key={g.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                    <Link to={`/games/lab/${g.id}`} className="block h-full no-underline text-text bg-surface border-bold border-border rounded-panel p-4 grid gap-1 motion-safe:hover:scale-[1.03] motion-safe:transition-transform" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                      <span className="font-display text-2xl leading-tight">{g.name}</span>
                      <span className="text-sm font-semibold text-muted leading-snug">{g.blurb}</span>
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export function LabPlay() {
  const { id = '' } = useParams();
  const [def, setDef] = useState<LabDef | null | 'missing'>(null);
  useEffect(() => {
    setDef(null);
    const p = loadLabGame(id);
    if (!p) { setDef('missing'); return; }
    let live = true;
    void p.then((d) => { if (live) setDef(d); });
    return () => { live = false; };
  }, [id]);
  if (def === 'missing') return <main className="p-10 text-center font-bold">That game is not in the Game Lab. <Link to="/lab">See all games</Link></main>;
  if (!def) return <Loading />;
  return <LabGame key={def.id} def={def} />;
}
