import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, DiceFive } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { findGameCode, type GameCode } from '../data/gameCodes';
import { rollName } from '../engine/nameDice';
import { setSession } from '../student/session';
import { t } from '../i18n';
import Title from '../ui/Title';

// The one join page (product plan): students type a code (letters only).
// A class code goes to class sign-in; a game code asks for a silly name
// from the name dice and opens that game with the teacher's set. Codes in
// a link (/join/CODE) are filled in for them.
export default function JoinPage() {
  const { code: fromLink = '' } = useParams();
  const [code, setCode] = useState(fromLink.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5));
  const [wrong, setWrong] = useState(false);
  const [game, setGame] = useState<GameCode | null>(null);
  const [name, setName] = useState(() => rollName());
  // Limits on code guessing: after 5 wrong codes, wait 30 seconds.
  const misses = useRef(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (waitUntil <= Date.now()) return; const id = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(id); }, [waitUntil]);
  const waiting = waitUntil > now ? Math.ceil((waitUntil - now) / 1000) : 0;
  const navigate = useNavigate();

  async function join(c = code) {
    if (waitUntil > Date.now()) return;
    const upper = c.trim().toUpperCase();
    const cls = (await data.listClassrooms()).find((x) => x.joinCode === upper);
    if (cls) { navigate(`/arcade/${cls.id}`); return; }
    const g = await findGameCode(upper);
    if (g) { setGame(g); return; }
    misses.current += 1;
    if (misses.current >= 5) { misses.current = 0; setWaitUntil(Date.now() + 30000); setNow(Date.now()); }
    setWrong(true); window.setTimeout(() => setWrong(false), 900);
  }
  useEffect(() => { if (fromLink.length === 5) void join(fromLink); }, [fromLink]); // eslint-disable-line react-hooks/exhaustive-deps

  function play() {
    if (!game) return;
    setSession({ classroomId: '', studentId: newId('guest'), name });
    navigate(`/games/${game.gameId}?set=${game.setId}`);
  }

  if (game) {
    return (
      <main className="max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
        <h1 className="title-bubble text-5xl"><Title text={t('join.nameTitle')} /></h1>
        <p className="font-bold text-lg">{t('join.nameSub')}</p>
        <motion.p key={name} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="font-display text-4xl" aria-live="polite">{name}</motion.p>
        <button type="button" onClick={() => setName(rollName(Math.random, [name]))} className="min-h-14 px-6 rounded-pill border-[2.5px] border-border bg-surface-2 font-bold text-lg inline-flex items-center gap-2">
          <DiceFive weight="fill" size={26} />{t('join.roll')}
        </button>
        <button type="button" onClick={play} className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          {t('join.play')}<ArrowRight weight="bold" size={26} />
        </button>
      </main>
    );
  }

  return (
    <main className="max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      <h1 className="title-bubble text-5xl"><Title text={t('join.title')} /></h1>
      <p className="font-bold text-lg">{t('join.sub')}</p>
      <motion.input animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined} value={code} maxLength={5} autoCapitalize="characters" autoComplete="off" spellCheck={false}
        onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, '').toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter' && code.length === 5) void join(); }}
        aria-label={t('join.code')} placeholder="BKDFT"
        className="w-full max-w-xs text-center font-display text-5xl tracking-[0.3em] min-h-20 rounded-panel border-[3px] border-border bg-surface uppercase" />
      <p className="min-h-6 font-bold" role="status" aria-live="polite">{waiting ? t('join.tooMany', { seconds: waiting }) : wrong ? t('join.wrong') : ''}</p>
      <button type="button" disabled={code.length !== 5 || waiting > 0} onClick={() => void join()}
        className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl inline-flex items-center gap-2 disabled:opacity-50" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        {t('join.go')}<ArrowRight weight="bold" size={26} />
      </button>
    </main>
  );
}
