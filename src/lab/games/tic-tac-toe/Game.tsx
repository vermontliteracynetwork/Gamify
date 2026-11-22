import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, GridNine, Trophy } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { cpuPick, full, winLine, type Cell } from './board';

// Tic Tac Toe (Game Lab, inspired by classroom quiz-board games): a right
// answer lets a team drop its own piece. Three in a row wins the board
// (3 points) and a fresh board drops in. Power-ups make two turns never alike.

const POWERS: LabPower[] = [
  { id: 'double', name: 'Double Drop', desc: 'Drop two pieces this turn.', enter: 'drop', art: <Art kind="double" /> },
  { id: 'pop', name: 'Bubble Pop', desc: 'Pop one of the other team\'s pieces off the board.', enter: 'zoom', art: <Art kind="pop" /> },
  { id: 'paint', name: 'Paint Splat', desc: 'Splat one of their pieces into yours.', enter: 'spin', art: <Art kind="paint" /> },
  { id: 'snow', name: 'Snowball', desc: 'The other team is frozen and skips their next turn.', enter: 'drop', art: <Art kind="snow" /> },
  { id: 'gold', name: 'Gold Star', desc: 'Two bonus points right now.', enter: 'spin', art: <Art kind="gold" /> },
  { id: 'spin', name: 'Spin Cycle', desc: 'Whoops! The board spins and every piece lands somewhere new.', silly: true, art: <Art kind="spin" /> },
];

type Mode = 'wait' | 'place' | 'pop' | 'paint' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const boardRef = useRef(board); boardRef.current = board;
  const [mode, setMode] = useState<Mode>('wait');
  const [left, setLeft] = useState(0);
  const [line, setLine] = useState<number[] | null>(null);
  const [gen, setGen] = useState(0); // a new board
  const [spin, setSpin] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const frozen = useRef<Set<string>>(new Set());
  const me = ctx.player;
  const other = ctx.turns.players.find((p) => p.id !== me.id) ?? me;
  const color = (id: string) => ctx.turns.players.find((p) => p.id === id)?.colorIndex ?? 0;

  // Every turn: a question first, then a move if it was right.
  useEffect(() => {
    let live = true;
    const x = c.current;
    if (frozen.current.has(x.player.id)) {
      frozen.current.delete(x.player.id);
      x.sfx.freeze(); x.say('Frozen! Skip a turn', 'oops');
      window.setTimeout(() => { if (live) c.current.next(); }, 1600);
      return () => { live = false; };
    }
    setMode('wait');
    void x.ask().then(async (ok) => {
      if (!live) return;
      if (!ok) { x.sfx.wrong(); window.setTimeout(() => live && c.current.next(), 500); return; }
      const p = await c.current.power(0.4, (pw) => {
        const b = boardRef.current, them = b.some((v) => v && v !== c.current.player.id);
        return (pw.id !== 'pop' && pw.id !== 'paint') || them;
      });
      if (!live) return;
      startMove(p);
    });
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function startMove(p: LabPower | null) {
    const x = c.current;
    if (p?.id === 'gold') { x.points(2); x.sfx.coin(); x.burst(0.5, 0.4); }
    if (p?.id === 'snow') frozen.current.add(other.id);
    if (p?.id === 'spin') {
      x.sfx.whoosh(); setSpin((n) => n + 1);
      const pieces = boardRef.current.filter(Boolean);
      const spots = [...Array(9).keys()].sort(() => Math.random() - 0.5);
      const next: Cell[] = Array(9).fill(null);
      pieces.forEach((v, i) => { next[spots[i]] = v; });
      window.setTimeout(() => { setBoard(next); if (!checkWin(next)) begin(1); }, 900);
      return;
    }
    if (p?.id === 'pop') { setMode('pop'); return; }
    if (p?.id === 'paint') { setMode('paint'); return; }
    begin(p?.id === 'double' ? 2 : 1);
  }
  function begin(n: number) { setLeft(n); setMode('place'); }

  // The computer plays its own moves, after a little think.
  useEffect(() => {
    if (!ctx.cpu || mode === 'wait' || mode === 'busy') return;
    const id = window.setTimeout(() => {
      const b = boardRef.current, x = c.current;
      if (mode === 'place') tap(cpuPick(b, x.player.id, other.id, x.cpuRight()));
      else { const theirs = b.map((v, i) => (v && v !== x.player.id ? i : -1)).filter((i) => i >= 0); tap(theirs[Math.floor(Math.random() * theirs.length)]); }
    }, 1300);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function checkWin(b: Cell[]): boolean {
    const x = c.current;
    const w = winLine(b);
    if (w) {
      setLine(w); setMode('busy');
      x.points(3, b[w[0]]!); x.sfx.cheer(); x.say('Three in a row!', 'big'); x.burst(0.4, 0.45, 'big');
      window.setTimeout(() => { setLine(null); setBoard(Array(9).fill(null)); setGen((g) => g + 1); c.current.next(); }, 2200);
      return true;
    }
    if (full(b)) {
      setMode('busy'); x.sfx.boing(); x.say('Tie board!', 'oops');
      window.setTimeout(() => { setBoard(Array(9).fill(null)); setGen((g) => g + 1); c.current.next(); }, 1600);
      return true;
    }
    return false;
  }

  function tap(i: number) {
    const x = c.current, b = boardRef.current;
    if (mode === 'place' && !b[i]) {
      const next = [...b]; next[i] = x.player.id;
      setBoard(next); x.sfx.thud(); x.points(1);
      if (checkWin(next)) return;
      const n = left - 1; setLeft(n);
      if (n <= 0) { setMode('busy'); window.setTimeout(() => c.current.next(), 900); }
      return;
    }
    if ((mode === 'pop' || mode === 'paint') && b[i] && b[i] !== x.player.id) {
      const next = [...b]; next[i] = mode === 'paint' ? x.player.id : null;
      setBoard(next);
      if (mode === 'pop') { x.sfx.pop(); x.say('Pop!'); } else { x.sfx.splash(); x.say('Splat!'); }
      if (checkWin(next)) return;
      begin(1);
    }
  }

  const canTap = !ctx.cpu && (mode === 'place' || mode === 'pop' || mode === 'paint');
  return (
    <div className="absolute inset-0 grid place-items-center">
      <motion.div key={gen} className="relative lab-fit" initial={ctx.still ? false : { y: '-110%', rotate: -6 }} animate={{ y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 14 }}>
        <motion.div className="absolute inset-[3%] rounded-[8%] border-heavy border-border bg-surface" style={{ boxShadow: '0 10px 0 #000, 0 30px 50px rgba(36,28,61,0.35)' }}
          animate={ctx.still ? undefined : { rotate: spin * 360 }} transition={{ duration: 0.9, ease: 'easeInOut' }}>
          {/* Hand-drawn grid lines, a little wobbly. */}
          <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            {['M100,18 Q104,150 99,282', 'M200,16 Q196,150 201,284', 'M18,100 Q150,96 282,101', 'M16,200 Q150,204 284,199'].map((d) => <path key={d} d={d} stroke="#241c3d" strokeWidth="9" strokeLinecap="round" fill="none" />)}
          </svg>
          <div className="absolute inset-[4%] grid grid-cols-3 grid-rows-3" role="grid" aria-label="Tic Tac Toe board">
            {board.map((v, i) => {
              const target = (mode === 'pop' || mode === 'paint') && v && v !== ctx.player.id;
              const open = mode === 'place' && !v;
              return (
                <button key={i} type="button" role="gridcell" disabled={!canTap || !(open || target)} onClick={() => tap(i)}
                  onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}
                  aria-label={v ? `${ctx.turns.players.find((p) => p.id === v)?.name ?? ''} piece` : `Empty square ${i + 1}`}
                  className="relative grid place-items-center disabled:cursor-default">
                  {open && canTap && hover === i && <span className="absolute opacity-40"><TeamBadge colorIndex={me.colorIndex} size={110} /></span>}
                  {open && canTap && <motion.span className="absolute inset-[22%] rounded-full border-4 border-dashed border-border-soft" animate={ctx.still ? undefined : { scale: [1, 1.08, 1] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }} />}
                  <AnimatePresence>
                    {v && (
                      <motion.span key={`${v}-${gen}`} className="relative" initial={ctx.still ? false : { y: -260, scaleY: 1.3, opacity: 0 }}
                        animate={line?.includes(i) ? { y: 0, opacity: 1, scale: [1, 1.25, 1], rotate: [0, -10, 10, 0] } : { y: 0, scaleY: 1, opacity: 1 }}
                        exit={ctx.still ? { opacity: 0 } : { scale: 0, rotate: 180, opacity: 0 }}
                        transition={line?.includes(i) ? { duration: 0.7, repeat: Infinity } : { type: 'spring', stiffness: 380, damping: 15 }}>
                        <span className={target ? 'block motion-safe:animate-pulse' : 'block'}><TeamBadge colorIndex={color(v)} size={Math.round(110)} /></span>
                      </motion.span>
                    )}
                  </AnimatePresence>
                </button>
              );
            })}
          </div>
          {line && (
            <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
              <motion.line x1={50 + (line[0] % 3) * 100} y1={50 + Math.floor(line[0] / 3) * 100} x2={50 + (line[2] % 3) * 100} y2={50 + Math.floor(line[2] / 3) * 100}
                stroke="#fdfd94" strokeWidth="16" strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5 }} style={{ filter: 'drop-shadow(0 0 6px #000)' }} />
            </svg>
          )}
        </motion.div>
        {mode !== 'wait' && mode !== 'busy' && (
          <motion.p className="absolute -top-1 inset-x-0 text-center font-display text-2xl text-white" style={{ WebkitTextStroke: '0.1em #000', paintOrder: 'stroke fill' }} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} aria-live="polite">
            {mode === 'pop' ? 'Tap their piece to pop it' : mode === 'paint' ? 'Tap their piece to splat it' : left > 1 ? 'Drop two pieces' : ''}
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'double' && <>{ring('#b4c4fb')}<circle cx="38" cy="44" r="16" fill="#f6c544" stroke="#000" strokeWidth="4" /><circle cx="62" cy="58" r="16" fill="#5cc3a0" stroke="#000" strokeWidth="4" /></>}
      {kind === 'pop' && <>{ring('#7fd6e3')}<circle cx="50" cy="50" r="22" fill="#fff" fillOpacity="0.7" stroke="#000" strokeWidth="4" /><path d="M50 14v10M50 76v10M14 50h10M76 50h10M24 24l7 7M69 69l7 7M24 76l7-7M69 31l7-7" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'paint' && <>{ring('#fdfd94')}<path d="M50 20c8 10 22 8 24 20s-10 10-6 22-14 18-22 10-20 2-20-12 12-12 8-22 8-26 16-18z" fill="#ef7d96" stroke="#000" strokeWidth="4" /></>}
      {kind === 'snow' && <>{ring('#e9eefe')}<circle cx="50" cy="52" r="24" fill="#fff" stroke="#000" strokeWidth="4" /><path d="M40 46l4 4M58 44l-3 5M44 62q6 4 12 0" stroke="#000" strokeWidth="4" strokeLinecap="round" fill="none" /></>}
      {kind === 'gold' && <>{ring('#fff6b0')}<path d="M50 18l9 20 22 2-17 15 5 22-19-12-19 12 5-22-17-15 22-2z" fill="#f6c544" stroke="#000" strokeWidth="4" strokeLinejoin="round" /></>}
      {kind === 'spin' && <>{ring('#f5a08c')}<path d="M28 50a22 22 0 0 1 38-15M72 50a22 22 0 0 1-38 15" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" /><path d="M62 24l6 12-13 1zM38 76l-6-12 13-1z" fill="#000" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="31" y="4" width="38" height="54" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="1.2" />
      <path d="M44 9v44M56 9v44M35 21h30M35 39h30" stroke="#241c3d" strokeWidth="1.6" strokeLinecap="round" />
      {[[38.5, 13.5, '#f6c544'], [50, 30, '#f6c544'], [61.5, 47.5, '#f6c544'], [61.5, 13.5, '#5cc3a0'], [38.5, 47.5, '#5cc3a0']].map(([x, y, f], i) => <circle key={i} cx={x as number} cy={y as number} r="4.6" fill={f as string} stroke="#000" strokeWidth="0.9" />)}
      <line x1="38.5" y1="13.5" x2="61.5" y2="47.5" stroke="#fdfd94" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

const def: LabDef = {
  id: 'tic-tac-toe',
  name: 'Tic Tac Toe',
  description: 'Answer right to drop your piece. Three in a row wins the board.',
  ways: ['teams'],
  minTeams: 2,
  maxTeams: 2,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer the question' },
    { icon: <GridNine weight="fill" />, text: 'Right? Drop your piece' },
    { icon: <Trophy weight="fill" />, text: 'Three in a row wins the board' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'board', label: 'Board', hint: 'The square board with its grid' },
    { id: 'background', label: 'Background', hint: 'Behind the board' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
