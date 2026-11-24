import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Diamond, FlagPennant, Heart, Shovel } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { cleared, count, cpuDig, dig, emptyBoard, neighbors, place, shuffleRocks, type Board } from './rules';

// Gem Sweep (Game Lab, classic arcade): a dig site with hidden grumpy rocks.
// A right answer earns digs; a dug square shows how many rocks hide next to
// it. Dig around the rocks (flag them!), find buried gems, and clear the
// board for a gem trophy. Hitting a rock costs a heart with a dusty puff.

const IMG = '/lab/gem-sweep/';
const LIVES = 3;
const DIGS_RIGHT = 3, DIGS_MISS = 1;
// Gem Sweep's own digit colors, each at least 4.5:1 on the dug sand.
const NUM = ['', '#0d5866', '#5130a8', '#a3243f', '#7a3d0c', '#241c3d', '#1e6b34', '#6b2a5e', '#3d3d3d'];
const GEMS = ['diamond_blue', 'heart_pink', 'emerald_green', 'moon_purple', 'diamond_yellow'];

function Rock({ grumpy = true, size = '100%' }: { grumpy?: boolean; size?: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }} aria-hidden="true">
      <path d="M14 70 Q10 44 30 30 Q46 16 66 24 Q88 32 88 58 Q90 80 66 84 L32 86 Q14 84 14 70z" fill="#9d95b5" stroke="#000" strokeWidth="5" strokeLinejoin="round" />
      <path d="M26 44 Q36 30 52 30" stroke="#c9c3dd" strokeWidth="6" fill="none" strokeLinecap="round" />
      <circle cx="70" cy="70" r="5" fill="#7b7396" />
      {grumpy && <>
        <circle cx="40" cy="56" r="6" fill="#fff" stroke="#000" strokeWidth="3" /><circle cx="62" cy="56" r="6" fill="#fff" stroke="#000" strokeWidth="3" />
        <circle cx="41" cy="58" r="2.6" /><circle cx="61" cy="58" r="2.6" />
        <path d="M30 44l16 6M72 44l-16 6" stroke="#000" strokeWidth="5" strokeLinecap="round" />
        <path d="M42 74q9-6 18 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>}
    </svg>
  );
}
function Flag() {
  return (
    <svg viewBox="0 0 100 100" className="w-[70%] h-[70%]" aria-hidden="true">
      <ellipse cx="44" cy="86" rx="22" ry="6" fill="rgba(0,0,0,0.25)" />
      <rect x="38" y="16" width="8" height="70" rx="3" fill="#241c3d" stroke="#000" strokeWidth="3" />
      <path d="M46 18 Q66 22 84 34 Q66 42 46 50z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
    </svg>
  );
}
const Gem = ({ i = 0 }: { i?: number }) => <img src={`${IMG}${GEMS[i % GEMS.length]}.webp`} alt="" aria-hidden="true" draggable={false} className="w-full h-full object-contain" />;

function Art({ kind }: { kind: string }) {
  const ring = (f: string) => <circle cx="50" cy="50" r="44" fill={f} stroke="#000" strokeWidth="5" />;
  const pic = (src: string) => <foreignObject x="18" y="18" width="64" height="64"><img src={IMG + src} alt="" className="w-full h-full object-contain" /></foreignObject>;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'detector' && <>{ring('#241c3d')}<circle cx="50" cy="50" r="30" fill="none" stroke="#8fe3a0" strokeWidth="3" /><circle cx="50" cy="50" r="16" fill="none" stroke="#8fe3a0" strokeWidth="3" /><path d="M50 50L76 34" stroke="#fdfd94" strokeWidth="5" strokeLinecap="round" /><circle cx="66" cy="62" r="6" fill="#ef7d96" stroke="#000" strokeWidth="2" /></>}
      {kind === 'safe' && <>{ring('#8fe3a0')}<path d="M58 18l18 18-26 26-8-2-2-8z" fill="#c9c3dd" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M42 58L22 78" stroke="#a0603a" strokeWidth="8" strokeLinecap="round" /><path d="M30 26l6 6M24 40h8" stroke="#fdfd94" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'scoop' && <>{ring('#fdfd94')}<path d="M20 52h60l-8 24H28z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M76 52l10-28" stroke="#000" strokeWidth="6" strokeLinecap="round" /><circle cx="36" cy="46" r="6" fill="#d4906d" stroke="#000" strokeWidth="2" /><circle cx="50" cy="42" r="7" fill="#d4906d" stroke="#000" strokeWidth="2" /><circle cx="63" cy="46" r="6" fill="#d4906d" stroke="#000" strokeWidth="2" /></>}
      {kind === 'xray' && <>{ring('#7fd6e3')}<rect x="16" y="38" width="30" height="22" rx="10" fill="#e9eefe" stroke="#000" strokeWidth="4" /><rect x="54" y="38" width="30" height="22" rx="10" fill="#e9eefe" stroke="#000" strokeWidth="4" /><path d="M46 46h8" stroke="#000" strokeWidth="4" /><path d="M24 44l8 8M62 44l8 8" stroke="#fff" strokeWidth="3" /></>}
      {kind === 'extra' && <>{ring('#b4c4fb')}<path d="M30 26v30M50 22v30M70 26v30" stroke="#a0603a" strokeWidth="7" strokeLinecap="round" /><path d="M22 56h16l-2 16H24zM42 52h16l-2 16H44zM62 56h16l-2 16H64z" fill="#c9c3dd" stroke="#000" strokeWidth="3" /></>}
      {kind === 'heart' && <>{ring('#ffd2c2')}{pic('heart.webp')}</>}
      {kind === 'lucky' && <>{ring('#fff6b0')}{pic('gem.webp')}</>}
      {kind === 'party' && <>{ring('#c58ce8')}<g transform="translate(12 30) scale(0.42) rotate(-10 50 50)"><Rock /></g><g transform="translate(46 24) scale(0.42) rotate(12 50 50)"><Rock /></g><path d="M20 22l4 8M80 20l-4 8M50 12v8" stroke="#fdfd94" strokeWidth="4" strokeLinecap="round" /><path d="M40 78q10 8 20 0" stroke="#000" strokeWidth="3" fill="none" /></>}
      {kind === 'sneeze' && <>{ring('#f5a08c')}<circle cx="38" cy="50" r="14" fill="#efdcb6" stroke="#000" strokeWidth="3" /><circle cx="58" cy="44" r="16" fill="#efdcb6" stroke="#000" strokeWidth="3" /><circle cx="62" cy="62" r="12" fill="#efdcb6" stroke="#000" strokeWidth="3" /><text x="50" y="86" textAnchor="middle" fontSize="14" fontWeight="900">ACHOO</text></>}
    </svg>
  );
}

const POWERS: LabPower[] = [
  { id: 'detector', name: 'Rock Radar', desc: 'A radar finds a hidden rock and flags it for you.', enter: 'spin', art: <Art kind="detector" /> },
  { id: 'safe', name: 'Safe Shovel', desc: 'Your next dig can never hit a rock.', enter: 'drop', art: <Art kind="safe" /> },
  { id: 'scoop', name: 'Super Scoop', desc: 'Your next dig opens a big safe patch.', enter: 'zoom', art: <Art kind="scoop" /> },
  { id: 'xray', name: 'X-Ray Goggles', desc: 'Peek at every hidden rock for a moment.', enter: 'zoom', art: <Art kind="xray" /> },
  { id: 'extra', name: 'Extra Digs', desc: 'Three more digs this turn.', enter: 'drop', art: <Art kind="extra" /> },
  { id: 'heart', name: 'Heart Snack', desc: 'One more heart.', enter: 'spin', art: <Art kind="heart" /> },
  { id: 'lucky', name: 'Lucky Gem', desc: 'Three bonus points right now.', enter: 'spin', art: <Art kind="lucky" /> },
  { id: 'party', name: 'Rock Party', desc: 'Whoops! The hidden rocks dance to new spots.', silly: true, art: <Art kind="party" /> },
  { id: 'sneeze', name: 'Sneezy Dust', desc: 'Achoo! Dust hides the numbers for a moment.', silly: true, art: <Art kind="sneeze" /> },
];

type Mode = 'wait' | 'dig' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [board, setBoardState] = useState<Board>(() => emptyBoard());
  const boardRef = useRef(board);
  const setBoard = (b: Board) => { boardRef.current = b; setBoardState(b); };
  const [gen, setGen] = useState(0);
  const [mode, setModeState] = useState<Mode>('wait');
  const modeRef = useRef<Mode>('wait');
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const [digs, setDigs] = useState(0);
  const digsRef = useRef(0);
  const [flagMode, setFlagMode] = useState(false);
  const [order, setOrder] = useState<Record<number, number>>({});
  const [puffAt, setPuffAt] = useState<{ i: number; id: number } | null>(null);
  const [xray, setXray] = useState(false);
  const [dust, setDust] = useState(false);
  const [party, setParty] = useState(false);
  const [radar, setRadar] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [hint, setHintState] = useState<number | null>(null);
  const hintRef = useRef<number | null>(null);
  const setHint = (h: number | null) => { hintRef.current = h; setHintState(h); };
  const [focus, setFocus] = useState(Math.floor(4 * 9 + 4));
  const gridRef = useRef<HTMLDivElement>(null);
  const lives = useRef<Record<string, number>>({});
  const trophies = useRef<Record<string, number>>({});
  const [, force] = useState(0);
  const one = useRef<{ safe: boolean; scoop: boolean }>({ safe: false, scoop: false });
  const me = ctx.player;
  const myLives = lives.current[me.id] ?? LIVES;

  function status() {
    const x = c.current;
    const l = lives.current[x.player.id] ?? LIVES, t = trophies.current[x.player.id] ?? 0;
    x.setStatus(<span className="inline-flex items-center gap-2 justify-center">{Array.from({ length: Math.max(l, LIVES) }, (_, i) => <Heart key={i} weight="fill" size={22} color={i < l ? '#ef7d96' : '#d9d4e6'} />)}<span className="ml-2 inline-flex items-center gap-1"><span className="w-6 h-6 inline-flex"><Gem /></span>{t}</span></span>);
  }

  // Every turn: a question earns digs (and maybe a power-up).
  useEffect(() => {
    let live = true;
    const x = c.current;
    setMode('wait'); setFlagMode(false); one.current = { safe: false, scoop: false };
    x.setHeld(x.player.id, []);
    status();
    void x.ask().then(async (ok) => {
      if (!live) return;
      const n = ok || x.solo ? DIGS_RIGHT : DIGS_MISS;
      digsRef.current = n; setDigs(n);
      if (ok) {
        // A right answer scores and lights up one safe square to dig.
        x.sfx.right(); x.points(2); x.say('Right! +2');
        giveHint();
        const p = await c.current.power(0.45, (pw) => boardRef.current.made || !['detector', 'xray', 'party'].includes(pw.id));
        if (!live) return;
        if (p) apply(p);
      } else { x.sfx.wrong(); x.say('One dig', 'oops'); }
      setMode('dig');
    });
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  function giveHint() {
    const b = boardRef.current;
    if (!b.made) { setHint(null); return; }
    const safe = b.rock.map((r, i) => (!r && !b.open[i] && !b.flag[i] ? i : -1)).filter((i) => i >= 0);
    const edge = safe.filter((i) => neighbors(b, i).some((j) => b.open[j] && !b.rock[j]));
    const pool = edge.length ? edge : safe;
    setHint(pool.length ? pool[Math.floor(Math.random() * pool.length)] : null);
  }

  function held() {
    const x = c.current;
    x.setHeld(x.player.id, POWERS.filter((p) => (p.id === 'safe' && one.current.safe) || (p.id === 'scoop' && one.current.scoop)));
  }

  function apply(p: LabPower) {
    const x = c.current, b = boardRef.current;
    switch (p.id) {
      case 'detector': {
        const hidden = b.rock.map((r, i) => (r && !b.open[i] && !b.flag[i] ? i : -1)).filter((i) => i >= 0);
        setRadar((n) => n + 1); x.sfx.slideUp();
        if (hidden.length) {
          const pick = hidden[Math.floor(Math.random() * hidden.length)];
          window.setTimeout(() => { const flag = [...boardRef.current.flag]; flag[pick] = true; setBoard({ ...boardRef.current, flag }); c.current.sfx.bell(); }, 1100);
        }
        break;
      }
      case 'safe': one.current.safe = true; x.sfx.chest(); break;
      case 'scoop': one.current.scoop = true; x.sfx.build(); break;
      case 'xray': setXray(true); x.sfx.zap(); window.setTimeout(() => setXray(false), 2400); break;
      case 'extra': digsRef.current += 3; setDigs(digsRef.current); x.sfx.coin(); break;
      case 'heart': lives.current[x.player.id] = (lives.current[x.player.id] ?? LIVES) + 1; x.sfx.chest(); status(); break;
      case 'lucky': x.points(3); x.sfx.coin(); x.burst(0.5, 0.4); break;
      case 'party': setParty(true); x.sfx.boing(); [0, 2, 4, 2, 0, 4].forEach((s, i) => window.setTimeout(() => c.current.sfx.note(s), i * 140)); window.setTimeout(() => { setBoard(shuffleRocks(boardRef.current)); setParty(false); }, 1500); break;
      case 'sneeze': setDust(true); x.sfx.wind(); window.setTimeout(() => setDust(false), 3000); break;
    }
    x.say(`${p.name}!`, p.silly ? 'oops' : 'good');
    held();
  }

  function spendDig() {
    digsRef.current -= 1; setDigs(digsRef.current);
    if (digsRef.current <= 0) endTurn();
  }
  function endTurn(delay = 1100) {
    setMode('busy');
    window.setTimeout(() => { c.current.setHeld(c.current.player.id, []); c.current.next(); }, delay);
  }

  function tap(i: number) {
    const x = c.current;
    if (modeRef.current !== 'dig') return;
    let b = boardRef.current;
    if (b.open[i]) return;
    if (hintRef.current === i && !flagMode) setHint(null);
    if (flagMode && !x.cpu) {
      const flag = [...b.flag]; flag[i] = !flag[i];
      setBoard({ ...b, flag }); x.sfx.tap();
      return;
    }
    if (b.flag[i]) return;
    if (!b.made) b = place(b, i);
    // Super Scoop: a safe 3 x 3 patch (rocks inside get flagged).
    let targets = [i];
    if (one.current.scoop) { one.current.scoop = false; targets = [i, ...neighbors(b, i)]; held(); x.sfx.kick(); }
    const ord: Record<number, number> = {};
    let opened = 0, gems = 0, hitRock = false;
    for (const t of targets) {
      if (b.open[t]) continue;
      if (b.rock[t] && (targets.length > 1 || one.current.safe)) {
        const flag = [...b.flag]; flag[t] = true; b = { ...b, flag };
        if (targets.length === 1) { one.current.safe = false; held(); x.say('Safe Shovel saved you!'); x.sfx.bell(); }
        continue;
      }
      if (b.flag[t]) continue;
      const r = dig(b, t);
      b = r.board;
      if (r.rock) { hitRock = true; ord[t] = 0; continue; }
      r.opened.forEach((cell) => { ord[cell] = Math.min(40, Object.keys(ord).length); });
      opened += r.opened.length;
      gems += r.opened.filter((cell) => b.gem[cell]).length;
    }
    if (targets.length === 1 && one.current.safe && !hitRock && opened) { one.current.safe = false; held(); }
    setOrder(ord);
    setBoard(b);
    if (hitRock) {
      setPuffAt({ i, id: Date.now() });
      x.sfx.crash(); window.setTimeout(() => c.current.sfx.oops(), 150);
      x.say('Grumpy rock! Puff!', 'oops');
      const l = (lives.current[x.player.id] ?? LIVES) - 1;
      if (l <= 0) {
        lives.current[x.player.id] = LIVES;
        window.setTimeout(() => { c.current.say('Out of hearts! Hearts refill', 'oops'); }, 1300);
      } else lives.current[x.player.id] = l;
      status(); force((n) => n + 1);
      if (cleared(b)) { boardDone(); return; }
      endTurn(1800);
      return;
    }
    if (opened) {
      x.sfx.kick();
      window.setTimeout(() => c.current.sfx.pop(), 80);
      if (opened > 4) window.setTimeout(() => c.current.sfx.slideUp(), 160);
      x.points(Math.min(5, opened));
      if (gems) { x.points(3 * gems); x.sfx.coin(); x.say(gems > 1 ? `${gems} gems!` : 'A gem! +3'); x.burst(0.45, 0.45); }
    }
    if (cleared(b)) { boardDone(); return; }
    spendDig();
  }

  function boardDone() {
    const x = c.current;
    setMode('busy');
    trophies.current[x.player.id] = (trophies.current[x.player.id] ?? 0) + 1;
    x.points(10); x.sfx.cheer(); x.say('Board cleared! Gem trophy!', 'big'); x.burst(0.45, 0.4, 'big');
    status();
    window.setTimeout(() => { setBoard(emptyBoard()); setGen((g) => g + 1); setOrder({}); }, 2000);
    window.setTimeout(() => { c.current.setHeld(c.current.player.id, []); c.current.next(); }, 2600);
  }

  // The computer digs on its own, one square at a time (a hint square first).
  // If a dig is refused, the tick moves on so the computer never stalls.
  const [cpuTick, setCpuTick] = useState(0);
  useEffect(() => {
    if (!ctx.cpu || mode !== 'dig') return;
    let inner = 0;
    const id = window.setTimeout(() => {
      const b = boardRef.current;
      const h = hintRef.current;
      const pick = h !== null && !b.open[h] ? h : b.made ? cpuDig(b, c.current.cpuRight()) : Math.floor((b.rows / 2) * b.cols + b.cols / 2);
      setHover(pick);
      inner = window.setTimeout(() => {
        const before = digsRef.current;
        if (pick === undefined || pick < 0) { spendDig(); return; }
        tap(pick);
        if (digsRef.current === before && modeRef.current === 'dig') setCpuTick((n) => n + 1);
      }, 500);
    }, 1200);
    return () => { window.clearTimeout(id); window.clearTimeout(inner); };
  }, [mode, digs, ctx.cpu, cpuTick]); // eslint-disable-line react-hooks/exhaustive-deps

  const canTap = mode === 'dig' && !ctx.cpu;
  // Keyboard: one tab stop on the board, arrows move, Enter or Space digs, F flags.
  function keys(e: RKeyboardEvent) {
    const b = boardRef.current;
    let f = focus;
    if (e.key === 'ArrowRight') f = Math.min(b.cols * b.rows - 1, f + 1);
    else if (e.key === 'ArrowLeft') f = Math.max(0, f - 1);
    else if (e.key === 'ArrowDown') f = Math.min(b.cols * b.rows - 1, f + b.cols);
    else if (e.key === 'ArrowUp') f = Math.max(0, f - b.cols);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (canTap) tap(f); return; }
    else if (e.key === 'f' || e.key === 'F') { if (canTap) { setFlagMode((v) => !v); ctx.sfx.tap(); } return; }
    else return;
    e.preventDefault();
    setFocus(f);
    (gridRef.current?.children[f] as HTMLElement | undefined)?.focus();
  }
  return (
    <div className="absolute inset-0 flex flex-col gap-2">
      {/* Digs, flag mode, hearts and trophies. */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-3 min-h-[3.5rem]">
        <div className="score-card px-3 py-1.5 flex items-center gap-1.5 min-h-12" aria-label={`${digs} digs left`}>
          <TeamBadge colorIndex={me.colorIndex} size={34} />
          <AnimatePresence>
            {Array.from({ length: Math.max(0, digs) }, (_, k) => (
              <motion.span key={`${ctx.taken}-${k}`} initial={ctx.still ? false : { scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} exit={{ scale: 0, y: -20, opacity: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 14, delay: k * 0.08 }}>
                <Shovel weight="fill" size={28} color="#a0603a" />
              </motion.span>
            ))}
          </AnimatePresence>
          {digs <= 0 && <span className="font-bold text-muted px-1">{mode === 'wait' ? '...' : ''}</span>}
        </div>
        <button type="button" onClick={() => { setFlagMode((f) => !f); ctx.sfx.tap(); }} disabled={!canTap} aria-pressed={flagMode}
          className={`min-h-12 px-4 rounded-full border-heavy border-border font-bold text-lg inline-flex items-center gap-2 motion-safe:hover:scale-105 motion-safe:transition-transform disabled:opacity-50 ${flagMode ? 'bg-[#ef7d96]' : 'bg-surface'}`} style={{ boxShadow: '0 4px 0 #000' }}>
          <FlagPennant weight="fill" size={24} />{flagMode ? 'Flag mode on' : 'Flag mode'}
        </button>
        <div className="score-card px-3 py-1.5 flex items-center gap-1 min-h-12 lg:hidden" aria-label={`${myLives} hearts`}>
          {Array.from({ length: Math.max(myLives, LIVES) }, (_, i) => <Heart key={i} weight="fill" size={24} color={i < myLives ? '#ef7d96' : '#d9d4e6'} />)}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid place-items-center" style={{ containerType: 'size' }}>
        <motion.div key={gen} className="lab-fit relative" style={{ '--ar': (board.cols + 0.8) / (board.rows + 0.8) } as CSSProperties}
          initial={ctx.still ? false : { y: '-100%', rotate: -4 }} animate={{ y: 0, rotate: 0 }} transition={{ type: 'spring', stiffness: 120, damping: 15 }}>
          {/* The dig site: a wooden frame around the meadow turf. */}
          <div className="absolute inset-0 rounded-[1.4rem] border-heavy border-border" style={{ background: 'linear-gradient(#e0a27a, #c47e55)', boxShadow: '0 10px 0 #000, 0 26px 44px rgba(36,28,61,0.35), inset 0 3px 0 rgba(255,255,255,0.35)' }} />
          <div className="absolute rounded-[0.9rem] border-bold border-border overflow-hidden grid"
            style={{ inset: `${(0.4 / (board.rows + 0.8)) * 100}% ${(0.4 / (board.cols + 0.8)) * 100}%`, gridTemplateColumns: `repeat(${board.cols}, 1fr)`, gridTemplateRows: `repeat(${board.rows}, 1fr)` }} role="grid" aria-label="Dig site. Arrow keys move, Enter digs, F flags" ref={gridRef} onKeyDown={keys}>
            {board.rock.map((_, i) => (
              <Cell key={`${gen}-${i}`} i={i} b={board} ctx={ctx} order={order[i]} canTap={canTap && !board.open[i]} flagMode={flagMode} hint={hint === i} focused={focus === i} onFocus={() => setFocus(i)}
                xray={xray || party} dancing={party} dust={dust} puff={puffAt?.i === i ? puffAt.id : 0} hover={hover === i && ctx.cpu} onTap={() => tap(i)} />
            ))}
          </div>
          {/* Rock Radar sweep. */}
          <AnimatePresence>
            {radar > 0 && !ctx.still && (
              <motion.div key={radar} className="absolute inset-0 pointer-events-none rounded-[1.4rem] overflow-hidden" initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ delay: 1.2, duration: 0.4 }}>
                <motion.div className="absolute left-1/2 top-1/2 w-[160%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ background: 'conic-gradient(from 0deg, rgba(143,227,160,0.55), transparent 25%)' }} initial={{ rotate: 0 }} animate={{ rotate: 720 }} transition={{ duration: 1.2, ease: 'easeInOut' }} />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Sneezy Dust cloud. */}
          <AnimatePresence>
            {dust && (
              <motion.div className="absolute inset-[6%] pointer-events-none" initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 0.92, scale: 1 }} exit={{ opacity: 0, scale: 1.3 }} transition={{ duration: 0.5 }}>
                {[[20, 30, 34], [50, 25, 40], [78, 35, 32], [32, 65, 38], [66, 68, 42], [50, 50, 36]].map(([x, y, r], k) => (
                  <motion.span key={k} className="absolute rounded-full border-bold border-border" style={{ left: `${x - r / 2}%`, top: `${y - r / 2}%`, width: `${r}%`, height: `${r}%`, background: '#efdcb6' }}
                    animate={ctx.still ? undefined : { x: [0, 6, -4, 0], y: [0, -4, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity, delay: k * 0.1 }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}

function Cell({ i, b, ctx, order, canTap, flagMode, xray, dancing, dust, puff, hover, hint, focused, onFocus, onTap }: {
  i: number; b: Board; ctx: LabCtx; order?: number; canTap: boolean; flagMode: boolean; xray: boolean; dancing: boolean; dust: boolean; puff: number; hover: boolean; hint: boolean; focused: boolean; onFocus: () => void; onTap: () => void;
}) {
  const x = i % b.cols, y = Math.floor(i / b.cols);
  const dark = (x + y) % 2 === 0;
  const open = b.open[i];
  const n = open && !b.rock[i] ? count(b, i) : 0;
  const delay = ctx.still ? 0 : (order ?? 0) * 0.03;
  return (
    <button type="button" role="gridcell" onClick={() => { if (canTap) onTap(); }} aria-disabled={!canTap} tabIndex={focused ? 0 : -1} onFocus={onFocus}
      aria-label={open ? (b.rock[i] ? 'Grumpy rock' : n ? `${n} rocks next to it` : 'Empty dug square') : b.flag[i] ? 'Flagged square' : hint ? 'Safe square to dig' : 'Grass square'}
      className={`relative grid place-items-center outline-none focus-visible:z-10 focus-visible:ring-4 focus-visible:ring-[#241c3d] focus-visible:ring-inset ${canTap ? '' : 'cursor-default'}`} style={{ background: dark ? '#f6e7c8' : '#efdcb6', containerType: 'size' }}>
      {/* Dug: a number, a gem or a rock. */}
      {open && (
        <motion.span className="absolute inset-0 grid place-items-center" initial={ctx.still ? false : { scale: 0.2, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 420, damping: 16, delay: delay + 0.08 }}>
          {b.rock[i] ? (
            <motion.span className="w-[82%] h-[82%] inline-flex" animate={ctx.still ? undefined : { rotate: [0, -12, 12, -8, 8, 0] }} transition={{ duration: 0.6 }}><Rock /></motion.span>
          ) : b.gem[i] ? (
            <motion.span className="w-[70%] h-[70%] inline-flex" animate={ctx.still ? undefined : { y: [0, -4, 0], rotate: [0, 6, -6, 0] }} transition={{ duration: 1.8, repeat: Infinity }}><Gem i={i} /></motion.span>
          ) : n ? (
            <span className="font-display leading-none" style={{ fontSize: '62cqh', color: NUM[n], opacity: dust ? 0 : 1, textShadow: '0 2px 0 rgba(255,255,255,0.7)' }}>{n}</span>
          ) : null}
        </motion.span>
      )}
      {/* Grass turf on top; it pops off when dug. */}
      <AnimatePresence>
        {!open && (
          <motion.span key="turf" className={`absolute inset-[3%] rounded-[18%] border-std border-border grid place-items-center ${canTap ? 'cursor-pointer' : ''}`}
            style={{ background: dark ? 'linear-gradient(#9ff0b0, #74d38c)' : 'linear-gradient(#8fe3a0, #66c47f)', boxShadow: 'inset 0 -4px 0 rgba(0,0,0,0.18), inset 0 3px 0 rgba(255,255,255,0.45)' }}
            whileHover={canTap && !ctx.still ? { scale: 1.07 } : undefined} animate={hover && !ctx.still ? { scale: [1, 1.1, 1] } : { scale: 1 }}
            exit={ctx.still ? { opacity: 0 } : { y: '-60%', rotate: x % 2 ? 40 : -40, scale: 0.4, opacity: 0, transition: { duration: 0.45, delay, ease: 'easeOut' } }}>
            <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full opacity-60" aria-hidden="true"><path d={`M${8 + (i % 3) * 4} 30l3-8 3 8M${22 + (i % 2) * 5} 28l2-6 3 6`} stroke="#3f9a59" strokeWidth="2.4" fill="none" strokeLinecap="round" /></svg>
            {b.flag[i] && <motion.span className="absolute inset-0 grid place-items-center" initial={ctx.still ? false : { y: -30, scale: 1.4, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}><Flag /></motion.span>}
            {xray && b.rock[i] && !b.flag[i] && (
              <motion.span className="absolute inset-[12%] inline-flex" initial={{ opacity: 0 }} animate={dancing && !ctx.still ? { opacity: 0.9, y: [0, -8, 0], rotate: [0, -10, 10, 0] } : { opacity: 0.75 }} transition={dancing ? { duration: 1, repeat: Infinity } : undefined}><Rock /></motion.span>
            )}
            {canTap && flagMode && !b.flag[i] && <span className="absolute inset-[30%] opacity-30"><Flag /></span>}
            {hint && !b.flag[i] && (
              <motion.span className="absolute inset-[8%] rounded-[18%] border-[3px] border-[#fdfd94] grid place-items-center" style={{ boxShadow: '0 0 0.6rem 0.2rem rgba(253,253,148,0.9)' }} aria-hidden="true"
                initial={ctx.still ? false : { scale: 1.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }}>
                <Shovel weight="fill" size="45%" color="#241c3d" />
              </motion.span>
            )}
          </motion.span>
        )}
      </AnimatePresence>
      {/* A dusty puff when a rock is hit. */}
      {puff > 0 && !ctx.still && (
        <span key={puff} className="absolute inset-0 pointer-events-none z-10" aria-hidden="true">
          {Array.from({ length: 7 }, (_, k) => {
            const a = (k / 7) * Math.PI * 2;
            return <motion.span key={k} className="absolute left-1/2 top-1/2 w-[70%] h-[70%] -ml-[35%] -mt-[35%] rounded-full border-std border-border" style={{ background: '#efdcb6' }}
              initial={{ x: 0, y: 0, scale: 0.3, opacity: 1 }} animate={{ x: `${Math.cos(a) * 120}%`, y: `${Math.sin(a) * 120}%`, scale: 1.3, opacity: 0 }} transition={{ duration: 0.9, ease: 'easeOut' }} />;
          })}
        </span>
      )}
    </button>
  );
}

function Cover() {
  const cols = 9, rows = 6;
  const open = new Set([10, 11, 12, 19, 20, 21, 28, 29, 30, 13, 22, 31, 37, 38, 39]);
  const nums: Record<number, number> = { 10: 1, 12: 2, 19: 1, 21: 1, 13: 1, 31: 3, 37: 1, 39: 2 };
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="14" y="4" width="72" height="54" rx="4" fill="#c47e55" stroke="#000" strokeWidth="1" />
      {Array.from({ length: cols * rows }, (_, i) => {
        const x = 17 + (i % cols) * 7.3, y = 7 + Math.floor(i / cols) * 8.2, o = open.has(i);
        return (
          <g key={i}>
            <rect x={x} y={y} width="7.3" height="8.2" fill={(i + Math.floor(i / cols)) % 2 ? '#efdcb6' : '#f6e7c8'} />
            {!o && <rect x={x + 0.4} y={y + 0.4} width="6.5" height="7.4" rx="1.4" fill={(i + Math.floor(i / cols)) % 2 ? '#66c47f' : '#8fe3a0'} stroke="#000" strokeWidth="0.35" />}
            {o && nums[i] && <text x={x + 3.65} y={y + 6} textAnchor="middle" fontSize="5.4" fontWeight="900" fill={NUM[nums[i]]}>{nums[i]}</text>}
          </g>
        );
      })}
      <g transform="translate(39 30) scale(0.075)"><Rock /></g>
      <g transform="translate(46.5 38.5) scale(0.07)"><path d="M46 18 Q66 22 84 34 Q66 42 46 50z" fill="#ef7d96" stroke="#000" strokeWidth="6" /><rect x="38" y="16" width="8" height="70" fill="#241c3d" /></g>
      <polygon points="60,15 63,18 60,22 57,18" fill="#7fd6e3" stroke="#000" strokeWidth="0.4" />
    </svg>
  );
}

const def: LabDef = {
  id: 'gem-sweep',
  name: 'Gem Sweep',
  description: 'Dig the meadow, but watch out for grumpy rocks! Numbers tell how many rocks hide next door.',
  ways: ['solo', 'teams'],
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right for three digs and a safe hint' },
    { icon: <Shovel weight="fill" />, text: 'Dig a square. Numbers count the rocks next to it' },
    { icon: <FlagPennant weight="fill" />, text: 'Flag the rocks, dig the rest' },
    { icon: <Diamond weight="fill" />, text: 'Clear the board for a gem trophy' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 8 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the dig site' },
    { id: 'frame', label: 'Frame', hint: 'The wooden frame around the board' },
    { id: 'turf', label: 'Grass square', hint: 'A square not dug yet' },
    { id: 'dirt', label: 'Dug square', hint: 'A square after digging' },
    { id: 'rock', label: 'Grumpy rock', hint: 'What hides under some squares' },
    { id: 'flag', label: 'Flag', hint: 'Marks a rock' },
    { id: 'gem', label: 'Gem', hint: 'A bonus buried in the board' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
