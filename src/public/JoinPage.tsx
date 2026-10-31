import { lobbyPickFor } from '../data/gameCodes';
import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRight, DiceFive, SpeakerHigh, UserCircle } from '@phosphor-icons/react';
import { speak } from '../engine/feedback';
import { useSettings } from '../settings/SettingsContext';
import { data, newId } from '../data';
import { findGameCode, playCloudCode, type GameCode } from '../data/gameCodes';
import { rollName } from '../engine/nameDice';
import { setSession } from '../student/session';
import StudentPicker from '../student/StudentPicker';
import type { Classroom, Student } from '../data/types';
import { setLive } from '../live/session';
import { t } from '../i18n';
import Title from '../ui/Title';
import { IconButton } from '../ui/kit';

// The one join page (product plan): students type a code (letters only).
// A class code goes to class sign-in. A game code (a link, QR code or hosted
// game) asks students to tap their avatar and type their PIN (teacher,
// 2026-10-26), so answers land under their name in reports; a student not on
// the list plays with a silly name from the name dice. Codes in a link
// (/join/CODE) are filled in for them.
export default function JoinPage() {
  const { code: fromLink = '' } = useParams();
  const [code, setCode] = useState(fromLink.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5));
  const [wrong, setWrong] = useState(false);
  const [game, setGame] = useState<GameCode | null>(null);
  const [name, setName] = useState(() => rollName());
  // The teacher's student lists that have students, for avatar + PIN sign-in.
  const [rosters, setRosters] = useState<Classroom[]>([]);
  const [roster, setRoster] = useState<string | null>(null);
  const [guest, setGuest] = useState(false);
  // Limits on code guessing: after 5 wrong codes, wait 30 seconds.
  const misses = useRef(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  useEffect(() => { if (waitUntil <= Date.now()) return; const id = window.setInterval(() => setNow(Date.now()), 500); return () => window.clearInterval(id); }, [waitUntil]);
  const waiting = waitUntil > now ? Math.ceil((waitUntil - now) / 1000) : 0;
  const navigate = useNavigate();
  const { settings } = useSettings();

  // A code is checked as soon as it has 5 letters; Go shows only for a code
  // that works (teacher, 2026-10-31). Each check counts toward the 5 tries.
  const [ready, setReady] = useState<{ code: string; go: () => Promise<void> } | null>(null);
  async function check(c: string) {
    if (waitUntil > Date.now()) return;
    const upper = c.trim().toUpperCase();
    const g = await findGameCode(upper);
    if (g) { setReady({ code: upper, go: () => openGame(g) }); return; }
    misses.current += 1;
    if (misses.current >= 5) { misses.current = 0; setWaitUntil(Date.now() + 30000); setNow(Date.now()); }
    setWrong(true); window.setTimeout(() => setWrong(false), 900);
  }
  useEffect(() => { setReady(null); if (code.length === 5) void check(code); }, [code]); // eslint-disable-line react-hooks/exhaustive-deps

  async function openGame(g: GameCode) {
    if (g.mirror) { navigate(`/mirror/${g.code}`); return; }
    const classes = await data.listClassrooms();
    const withStudents = (await Promise.all(classes.map(async (c) => ((await data.listStudents(c.id)).length ? c : null)))).filter((c): c is Classroom => !!c);
    // On a student's own device: the teacher's list from the cloud code.
    const lists = withStudents.length ? withStudents : g.rosterClass ? [{ id: g.rosterClass, name: '', ownerId: '', createdAt: '' }] : [];
    setRosters(lists);
    setRoster(lists.length === 1 ? lists[0].id : null);
    setGame(g);
  }
  // A code in a link goes straight in once it checks out.
  const fromLinkUsed = useRef(false);
  useEffect(() => { if (ready && fromLink.length === 5 && !fromLinkUsed.current && ready.code === fromLink.toUpperCase()) { fromLinkUsed.current = true; void ready.go(); } }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  function play(student?: Student) {
    if (!game) return;
    const studentId = student?.id ?? newId('guest');
    const who = student?.name ?? name;
    // The teacher's clock and score goal travel with the student (2026-10-31).
    const limits = { ...(game.endAt ? { endAt: game.endAt } : game.minutes ? { endAt: Date.now() + game.minutes * 60000 } : {}), ...(game.goal ? { goal: game.goal } : {}) };
    // A class lobby sends each student to their own game or choice board.
    if (game.lobby) {
      const pick = lobbyPickFor(game.lobby, studentId);
      if (pick === 'board' && game.lobby.board) {
        setSession({ classroomId: student?.classroomId ?? '', studentId, name: who, board: game.lobby.board, ...limits });
        navigate('/choose'); return;
      }
      if (pick && pick !== 'board') {
        setSession({ classroomId: student?.classroomId ?? '', studentId, name: who, gameId: pick.gameId, ...limits });
        navigate(`/games/${pick.gameId}?set=${pick.setId}`); return;
      }
    }
    setSession({ classroomId: student?.classroomId ?? '', studentId, name: who, gameId: game.design ? 'design' : game.gameId, ...limits });
    playCloudCode(game.cloud ? game.code : '');
    if (game.design) { navigate('/arcade/design'); return; }
    if (game.live) { setLive({ code: game.code, pid: studentId, name: who }); navigate(`/live/${game.code}`); return; }
    if (game.versus) { navigate(`/games/${game.gameId}?set=${game.setId}&versus=${game.code}`); return; }
    navigate(`/games/${game.gameId}?set=${game.setId}`);
  }

  if (game && rosters.length > 0 && !guest) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-10 pb-16 grid gap-5">
        <h1 className="title-bubble text-4xl sm:text-5xl text-center"><Title text={t('arcade.who')} /></h1>
        {roster ? <StudentPicker classroomId={roster} onSignIn={(s) => play(s)} /> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {rosters.map((c) => <button key={c.id} type="button" onClick={() => setRoster(c.id)} className="min-h-16 rounded-panel border-[2.5px] border-border bg-surface font-display text-2xl font-bold active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>{c.name}</button>)}
          </div>
        )}
        <button type="button" onClick={() => setGuest(true)} className="justify-self-center min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2"><UserCircle weight="bold" size={20} />{t('join.notOnList')}</button>
      </main>
    );
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
        <button type="button" onClick={() => play()} className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          {t('join.play')}<ArrowRight weight="bold" size={26} />
        </button>
      </main>
    );
  }

  return (
    <main className="relative max-w-lg mx-auto px-4 pt-14 pb-16 grid gap-5 justify-items-center text-center">
      {/* Listen sits at the top right, under Log in (teacher, 2026-10-31). */}
      <div className="fixed right-4 sm:right-6 top-[4.75rem] z-30">
        <IconButton label={t('q.listen')} onClick={() => speak(t('join.sub'), settings)} className="!w-12 !h-12 bg-surface" style={{ boxShadow: 'var(--shadow-sticker)' }}><SpeakerHigh weight="bold" size={24} /></IconButton>
      </div>
      <h1 className="title-bubble text-5xl"><Title text={t('join.title')} /></h1>
      <p className="font-bold text-lg">{t('join.sub')}</p>
      <div className="flex items-center justify-center gap-2 w-full">
        <motion.input animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined} value={code} maxLength={5} autoCapitalize="characters" autoComplete="off" spellCheck={false}
          onChange={(e) => setCode(e.target.value.replace(/[^a-z]/gi, '').toUpperCase())} onKeyDown={(e) => { if (e.key === 'Enter' && ready) void ready.go(); }}
          aria-label={t('join.code')} placeholder="BKDFT"
          className="w-full max-w-xs text-center font-display text-5xl tracking-[0.3em] min-h-20 rounded-panel border-[3px] border-border bg-surface uppercase" />
        {code.length > 0 && <IconButton label={t('join.hearCode')} onClick={() => speak(code.split('').join(', '), settings)}><SpeakerHigh weight="bold" size={20} /></IconButton>}
      </div>
      <p className="min-h-6 font-bold" role="status" aria-live="polite">{waiting ? t('join.tooMany', { seconds: waiting }) : wrong ? t('join.wrong') : ''}</p>
      <AnimatePresence>
        {ready && ready.code === code && (
          <motion.button type="button" onClick={() => void ready.go()} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }} transition={{ type: 'spring', stiffness: 380, damping: 18 }}
            className="min-h-16 px-10 rounded-pill border-[2.5px] border-border bg-accent font-display text-2xl inline-flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            {t('join.go')}<ArrowRight weight="bold" size={26} />
          </motion.button>
        )}
      </AnimatePresence>
    </main>
  );
}
