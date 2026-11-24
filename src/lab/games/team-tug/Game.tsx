import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, Flag, HandGrabbing } from '@phosphor-icons/react';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { gust, pull, pullSize, winner, type Side } from './tug';

// Team Tug (Game Lab, a group tug of war): two teams on either side of a
// rope over a mud puddle. A right answer earns a pull; tap Pull! and your
// team heaves the rope toward you. Pull the flag over your line to win the
// tug, and the other team slides into the mud. Splat!

const POWERS: LabPower[] = [
  { id: 'grip', name: 'Super Grip', desc: 'Sticky gloves: their next pull only moves half as far.', enter: 'zoom', art: <Art kind="grip" /> },
  { id: 'banana', name: 'Banana Peel', desc: 'They step on a peel and slip toward you.', enter: 'spin', art: <Art kind="banana" /> },
  { id: 'extra', name: 'Extra Puller', desc: 'A friend runs in to help your team pull this tug.', enter: 'drop', art: <Art kind="extra" /> },
  { id: 'double', name: 'Double Pull', desc: 'Pull two times this turn.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'muscles', name: 'Mega Muscles', desc: 'Flex! Two bonus points.', enter: 'zoom', art: <Art kind="muscles" /> },
  { id: 'tickle', name: 'Rope Tickle', desc: 'Hee hee! The rope wiggles and lands somewhere new.', silly: true, art: <Art kind="tickle" /> },
  { id: 'wind', name: 'Wind Gust', desc: 'Whoosh! The wind blows the flag back toward the middle.', silly: true, art: <Art kind="wind" /> },
];

const LINE = 90; // how far the flag moves from the middle to a line (svg units)
type Mode = 'wait' | 'pull' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [pos, setPos] = useState(0);
  const posRef = useRef(0); posRef.current = pos;
  const [mode, setMode] = useState<Mode>('wait');
  const [heave, setHeave] = useState<{ side: Side; id: number } | null>(null);
  const [extra, setExtra] = useState<Record<Side, number>>({ left: 0, right: 0 });
  const extraRef = useRef(extra); extraRef.current = extra;
  const [grip, setGrip] = useState<Record<Side, boolean>>({ left: false, right: false });
  const gripRef = useRef(grip); gripRef.current = grip;
  const [fall, setFall] = useState<Side | null>(null);
  const [wins, setWins] = useState<Record<Side, number>>({ left: 0, right: 0 });
  const [fx, setFx] = useState<{ kind: string; side: Side; id: number } | null>(null);
  const [pulls, setPulls] = useState(1);
  const pullsRef = useRef(1); pullsRef.current = pulls;
  const box = useRef<HTMLDivElement>(null);
  const tall = useTall(box);
  const players = ctx.turns.players;
  // Solo: you against a friendly computer team the game plays itself.
  const FRIEND = { id: 'tug-friends', name: 'Computer team', colorIndex: players[0]?.colorIndex === 1 ? 2 : 1, kind: 'cpu' as const, score: 0 };
  const L = players[0], R = ctx.solo ? FRIEND : players[1] ?? players[0];
  const sideOf = (id: string): Side => (id === L.id ? 'left' : 'right');
  const me = sideOf(ctx.player.id);
  const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
  const pulling = useRef(false);
  const extraLeft = useRef<Record<Side, number>>({ left: 0, right: 0 });

  function flash(kind: string, side: Side, ms = 2600) {
    const fid = Date.now() + Math.random();
    setFx({ kind, side, id: fid });
    window.setTimeout(() => setFx((f) => (f?.id === fid ? null : f)), ms);
  }
  function heaveOf(side: Side) {
    const id = Date.now();
    setHeave({ side, id });
    window.setTimeout(() => setHeave((h) => (h?.id === id ? null : h)), 1100);
  }

  // End the turn; on the very last one, name the team the flag is nearer to.
  function endTurn(delay: number, title?: string) {
    window.setTimeout(() => {
      const x = c.current;
      const last = x.taken + 1 >= x.rounds * x.turns.players.length;
      if (!last) { x.next(); return; }
      const p = posRef.current;
      x.finish(title ?? (Math.abs(p) < 0.05 ? 'The flag ends in the middle!' : `The flag ends nearer ${p < 0 ? L.name : R.name}!`));
    }, delay);
  }

  // Every turn: a question; right earns a pull (and maybe a power-up).
  useEffect(() => {
    let live = true;
    const x = c.current;
    setMode('wait'); setPulls(1); pullsRef.current = 1; pulling.current = false;
    void x.ask().then(async (ok) => {
      if (!live) return;
      if (!ok) { x.sfx.wrong(); flash('slip', sideOf(x.player.id), 1200); window.setTimeout(() => { if (live) void friendTurn(); }, 900); return; }
      const p = await c.current.power(0.45, (pw) => (pw.id !== 'wind' || Math.abs(posRef.current) > 0.25));
      if (!live) return;
      if (p) { const done = await fire(p); if (done || !live) return; }
      setMode('pull');
    });
    return () => { live = false; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  // Solo: the friendly computer team takes its pull after yours.
  async function friendTurn() {
    if (!c.current.solo) { endTurn(0); return; }
    await wait(700);
    if (Math.random() < 0.55) {
      heaveOf('right'); c.current.sfx.kick();
      const size = pullSize({ extra: extraRef.current.right, gripped: gripRef.current.right ? false : gripRef.current.left }) * 0.8;
      if (gripRef.current.left) setGrip((g) => ({ ...g, left: false }));
      if (move(pull(posRef.current, 'right', size))) return;
    } else c.current.say('They slipped!');
    endTurn(1100);
  }

  // Returns true when the power-up already ended the turn (a win).
  async function fire(p: LabPower): Promise<boolean> {
    const x = c.current, side = sideOf(x.player.id), other: Side = side === 'left' ? 'right' : 'left';
    flash(p.id, side);
    if (p.id === 'grip') { setGrip((g) => ({ ...g, [side]: true })); x.setHeld(x.player.id, [p]); x.sfx.magnet(); }
    if (p.id === 'extra') {
      setExtra((e) => ({ ...e, [side]: Math.min(2, e[side] + 1) }));
      extraLeft.current[side] = 2;
      x.sfx.jump(); await wait(900);
    }
    if (p.id === 'double') { setPulls(2); pullsRef.current = 2; x.sfx.whoosh(); x.say('Pull two times!'); }
    if (p.id === 'muscles') { x.points(2); x.sfx.thud(); x.burst(side === 'left' ? 0.25 : 0.65, 0.5); }
    if (p.id === 'banana') {
      x.sfx.boing(); await wait(700); x.sfx.slideDown();
      heaveOf(other);
      return move(pull(posRef.current, side, 0.18), 'Whoops!');
    }
    // Silly ones never pay out: the tickle only wiggles, the gust blows the leader back.
    if (p.id === 'tickle') { x.sfx.boing(); await wait(1100); x.say('Hee hee!'); }
    if (p.id === 'wind') { x.sfx.wind(); await wait(900); move(gust(posRef.current), 'Whoosh!'); }
    return false;
  }

  // Move the flag; true when that won the tug.
  function move(to: number, msg?: string): boolean {
    setPos(to); posRef.current = to;
    const w = winner(to);
    if (w) { win(w); return true; }
    if (msg) c.current.say(msg);
    return false;
  }

  function win(w: Side) {
    const x = c.current, loser: Side = w === 'left' ? 'right' : 'left';
    setMode('busy');
    const wp = w === 'left' ? L : R;
    if (!(x.solo && w === 'right')) x.points(3, wp.id);
    setWins((n) => ({ ...n, [w]: n[w] + 1 }));
    x.sfx.cheer(); x.say('Tug won!', 'big'); x.burst(w === 'left' ? 0.25 : 0.65, 0.4, 'big');
    // The other team plops into the mud, splashes everyone, and gets a high five.
    window.setTimeout(() => { setFall(loser); c.current.sfx.splash(); window.setTimeout(() => c.current.sfx.splash(), 300); }, 700);
    window.setTimeout(() => { c.current.say('High five!'); c.current.sfx.bell(); }, 1900);
    window.setTimeout(() => {
      setFall(null); setPos(0); posRef.current = 0;
      setExtra({ left: 0, right: 0 }); extraLeft.current = { left: 0, right: 0 }; setGrip({ left: false, right: false });
      players.forEach((p) => c.current.setHeld(p.id, []));
      c.current.sfx.slideUp();
      endTurn(700, `${wp.name} won the last tug!`);
    }, 3300);
  }

  async function doPull() {
    const x = c.current;
    if (mode !== 'pull' || pulling.current) return;
    pulling.current = true;
    setMode('busy');
    const side = sideOf(x.player.id), other: Side = side === 'left' ? 'right' : 'left';
    for (let k = 0; k < pullsRef.current; k++) {
      const gripped = gripRef.current[other];
      if (gripped) { setGrip((g) => ({ ...g, [other]: false })); if (!(x.solo && other === 'right')) x.setHeld(other === 'left' ? L.id : R.id, []); }
      heaveOf(side);
      x.sfx.kick(); window.setTimeout(() => c.current.sfx.swish(), 120);
      const size = pullSize({ extra: extraRef.current[side], gripped });
      x.points(1);
      if (extraLeft.current[side] > 0) { extraLeft.current[side] -= 1; if (!extraLeft.current[side]) setExtra((e) => ({ ...e, [side]: 0 })); }
      if (gripped) x.say('Sticky grip!');
      else if (size > 0.4) x.say('Mega pull!');
      if (move(pull(posRef.current, side, size))) return;
      await wait(1000);
    }
    window.setTimeout(() => void friendTurn(), 500);
  }

  // The computer pulls on its own; Space or Enter pulls too.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pull') return;
    const id = window.setTimeout(() => void doPull(), 1400 + Math.random() * 800);
    return () => window.clearTimeout(id);
  }, [ctx.cpu, mode, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const on = (e: KeyboardEvent) => { if (!c.current.cpu && (e.key === ' ' || e.key === 'Enter') && mode === 'pull') { e.preventDefault(); void doPull(); } };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const still = ctx.still;
  const colL = TEAM_COLORS[L.colorIndex % TEAM_COLORS.length], colR = TEAM_COLORS[R.colorIndex % TEAM_COLORS.length];
  const wiggle = fx?.kind === 'tickle' && !still;

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <motion.div className="relative lab-fit rounded-[calc(var(--u)*4)] border-heavy border-border overflow-hidden" style={{ '--ar': tall ? 1.15 : 1.78, '--u': tall ? '0.6cqw' : '1cqh', containerType: 'size', boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*6) rgba(36,28,61,0.35)' } as CSSProperties}>
        <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMax slice" className={`absolute inset-x-0 top-0 w-full ${tall ? 'h-[64%]' : 'h-full'}`} role="img" aria-label={`Tug of war. The flag is ${Math.abs(pos) < 0.1 ? 'in the middle' : pos < 0 ? `closer to ${L.name}` : `closer to ${R.name}`}`}>
          <defs>
            <linearGradient id="tt-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8fb3ff" /><stop offset="1" stopColor="#dfe8ff" /></linearGradient>
            <radialGradient id="tt-mud" cx="0.5" cy="0.4"><stop offset="0" stopColor="#a8744a" /><stop offset="1" stopColor="#7a4b2a" /></radialGradient>
          </defs>
          <rect x="-100" y="-320" width="600" height="470" fill="url(#tt-sky)" />
          <g>
            <circle cx="300" cy="66" r="15" fill="#fdd65a" stroke="#000" strokeWidth="2" />
            <motion.g animate={still ? undefined : { x: fx?.kind === 'wind' ? [0, 260] : [0, 40, 0] }} transition={fx?.kind === 'wind' ? { duration: 1.2 } : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}>
              <Cloud x={50} y={36} /><Cloud x={210} y={22} s={0.8} /><Cloud x={-80} y={-60} s={1.2} /><Cloud x={260} y={-110} />
            </motion.g>
          </g>
          {/* Bunting in both team colors. */}
          <path d="M0 10Q200 40 400 10" stroke="#241c3d" strokeWidth="1.4" fill="none" />
          {Array.from({ length: 15 }, (_, i) => { const t = (i + 0.5) / 15, x = t * 400, y = 10 + 30 * 4 * t * (1 - t) * 0.5 + 0.5; return <path key={i} d={`M${x - 8} ${y}l8 14 8-14z`} fill={i % 2 ? colR : colL} stroke="#000" strokeWidth="1.2" strokeLinejoin="round" />; })}
          <path d="M-100 128q90-34 180-10t160-6 260 4v120H-100z" fill="#7ccf8e" stroke="#000" strokeWidth="2" />
          <rect x="-100" y="140" width="600" height="100" fill="#8fe3a0" />
          <path d="M-100 140H500" stroke="#000" strokeWidth="2" />
          {Array.from({ length: 8 }, (_, i) => <path key={i} d={`M${i * 60 - 20} 140l-30 85h30l30-85z`} fill="#7fd690" />)}
          {/* The two lines and the mud. */}
          {[200 - LINE, 200 + LINE].map((x) => <path key={x} d={`M${x - 3} 140h6l4 85h-14z`} fill="#fbfcf8" stroke="#000" strokeWidth="1" />)}
          <ellipse cx="200" cy="182" rx="50" ry="15" fill="url(#tt-mud)" stroke="#000" strokeWidth="2" />
          {!still && [0, 1, 2].map((i) => <motion.circle key={i} cx={180 + i * 18} cy={182 + (i % 2) * 4} r="2.4" fill="#c8956a" stroke="#000" strokeWidth="0.8" animate={{ scale: [0, 1, 0], opacity: [0, 1, 0] }} transition={{ duration: 3, repeat: Infinity, delay: i * 1 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />)}

          {/* Rope, flag and both teams slide together. */}
          <motion.g initial={false} animate={{ x: pos * LINE }} transition={{ type: 'spring', stiffness: 70, damping: 11, mass: 1.3 }}>
            <motion.path d={wiggle ? 'M-100 150 Q-40 140 20 150 T140 150 T260 150 T380 150 T500 150' : 'M-100 150 Q-40 150 20 150 T140 150 T260 150 T380 150 T500 150'} stroke="#c8956a" strokeWidth="5" fill="none" strokeLinecap="round"
              animate={wiggle ? { d: ['M-100 150 Q-40 140 20 150 T140 150 T260 150 T380 150 T500 150', 'M-100 150 Q-40 160 20 150 T140 150 T260 150 T380 150 T500 150', 'M-100 150 Q-40 140 20 150 T140 150 T260 150 T380 150 T500 150'] } : undefined} transition={{ duration: 0.3, repeat: 3 }} />
            <path d="M-100 150H500" stroke="#8a5a3b" strokeWidth="1.2" strokeDasharray="3 5" opacity={wiggle ? 0 : 1} />
            <motion.g style={{ transformOrigin: '200px 150px' }} animate={still ? undefined : { rotate: [-6, 6, -6] }} transition={{ duration: 2.6, repeat: Infinity }}>
              <path d="M194 148h12v26l-6-6-6 6z" fill="#ef7d96" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" />
              <path d="M194 156h12" stroke="#fdfd94" strokeWidth="3" />
              <circle cx="200" cy="150" r="3.2" fill="#fdfd94" stroke="#000" strokeWidth="1.4" />
            </motion.g>
          </motion.g>
          {/* The teams slide less than the rope, so nobody leaves the field. */}
          <motion.g initial={false} animate={{ x: pos * LINE * 0.35 }} transition={{ type: 'spring', stiffness: 70, damping: 11, mass: 1.3 }}>
            <Team side="left" color={colL} extra={extra.left} heave={heave?.side === 'left' ? heave.id : 0} fall={fall === 'left'} grip={grip.left} still={still} slip={fx?.kind === 'slip' && fx.side === 'left' ? fx.id : 0} flex={fx?.kind === 'muscles' && fx.side === 'left' ? fx.id : 0} />
            <Team side="right" color={colR} extra={extra.right} heave={heave?.side === 'right' ? heave.id : 0} fall={fall === 'right'} grip={grip.right} still={still} slip={fx?.kind === 'slip' && fx.side === 'right' ? fx.id : 0} flex={fx?.kind === 'muscles' && fx.side === 'right' ? fx.id : 0} />
          </motion.g>

          {/* Mud splash when a team lands in it. */}
          <AnimatePresence>
            {fall && !still && Array.from({ length: 12 }, (_, i) => {
              const a = (i / 12) * Math.PI - Math.PI;
              return <motion.circle key={`m${i}`} cx="200" cy="178" r={3 + (i % 3)} fill={i % 2 ? '#7a4b2a' : '#a8744a'} stroke="#000" strokeWidth="0.8"
                initial={{ x: 0, y: 0, opacity: 1 }} animate={{ x: Math.cos(a) * (50 + (i % 4) * 14), y: [0, Math.sin(a) * 50 - 10, 20], opacity: [1, 1, 0] }} transition={{ duration: 1.1, delay: 0.75, ease: 'easeOut' }} exit={{ opacity: 0 }} />;
            })}
          </AnimatePresence>
          {/* Power-up moments. */}
          <AnimatePresence>
            {fx?.kind === 'wind' && !still && Array.from({ length: 6 }, (_, i) => (
              <motion.path key={`w${i}`} d={`M0 ${60 + i * 22}q30-8 60 0t60 0`} stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" initial={{ x: -120, opacity: 0 }} animate={{ x: 460, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.1, delay: i * 0.08 }} exit={{ opacity: 0 }} />
            ))}
            {fx?.kind === 'banana' && !still && (
              <motion.g key={`b${fx.id}`} initial={{ x: 200, y: -60, rotate: 0 }} animate={{ x: fx.side === 'left' ? 320 : 80, y: 180, rotate: 720 }} transition={{ duration: 0.7, ease: 'easeIn' }} exit={{ opacity: 0 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }}>
                <path d="M-10 0q10 10 20 0q-4 8-10 8t-10-8z" fill="#fdd65a" stroke="#000" strokeWidth="1.5" /><path d="M-10 0l-6-5M10 0l6-5M0 0v-6" stroke="#000" strokeWidth="1.5" />
              </motion.g>
            )}
          </AnimatePresence>
        </svg>

        {/* On tall screens the badges and Pull! sit on a grass deck under the field. */}
        {tall && <div className="absolute inset-x-0 bottom-0 h-[36%] border-t-[3px] border-border" style={{ background: 'linear-gradient(180deg, #7fd690, #5cae86)' }} aria-hidden="true" />}
        {/* Each team's side: badge, tugs won, and the way to pull. */}
        {([['left', L], ['right', R]] as const).map(([side, p]) => {
          const on = ctx.player.id === p.id;
          return (
            <motion.div key={side} className={`absolute ${tall ? 'top-[70%]' : 'top-[calc(var(--u)*15)]'} ${side === 'left' ? (tall ? 'left-[calc(var(--u)*6)]' : 'left-[calc(var(--u)*3)]') : (tall ? 'right-[calc(var(--u)*6)]' : 'right-[calc(var(--u)*3)]')} grid justify-items-center gap-[calc(var(--u)*1)]`}
              animate={on && !still ? { scale: [1, 1.08, 1] } : { scale: 1 }} transition={{ duration: 2.4, repeat: on ? Infinity : 0 }}>
              <span className="rounded-full p-[calc(var(--u)*0.8)]" style={{ boxShadow: on ? '0 0 0 calc(var(--u)*0.8) #fdfd94, 0 0 calc(var(--u)*4) #fdfd94' : undefined }}><TeamBadge colorIndex={p.colorIndex} size={tall ? 64 : 44} /></span>
              <span className="flex gap-[calc(var(--u)*0.6)]" aria-label={`${p.name}: ${wins[side]} tugs won`}>
                {Array.from({ length: Math.max(3, wins[side]) }, (_, i) => (
                  <motion.svg key={i} viewBox="0 0 40 40" className="w-[calc(var(--u)*6.5)] h-[calc(var(--u)*6.5)]" initial={false} animate={{ scale: i < wins[side] ? [1.6, 1] : 1 }} aria-hidden="true">
                    <path d="M20 4l4.6 10 10.8 1-8.2 7.2 2.6 10.6L20 27l-9.8 5.8 2.6-10.6L4.6 15l10.8-1z" fill={i < wins[side] ? '#f6c544' : '#fbfcf8'} stroke="#000" strokeWidth="2.5" strokeLinejoin="round" />
                  </motion.svg>
                ))}
              </span>
            </motion.div>
          );
        })}

        {/* Pull! */}
        <AnimatePresence>
          {mode === 'pull' && (
            <motion.button key="pull" type="button" onClick={() => void doPull()} disabled={ctx.cpu} aria-label="Pull the rope"
              className={`absolute left-1/2 ${tall ? 'top-[74%]' : 'top-[calc(var(--u)*16)]'} min-w-[calc(var(--u)*30)] min-h-[calc(var(--u)*14)] px-[calc(var(--u)*4)] rounded-full border-heavy border-border bg-accent font-display text-[calc(var(--u)*7)] inline-flex items-center justify-center gap-[calc(var(--u)*2)] disabled:cursor-default`}
              style={{ boxShadow: '0 calc(var(--u)*0.9) 0 #000', x: '-50%' }}
              initial={still ? { opacity: 0 } : { scale: 0, y: 40 }} animate={{ scale: still ? 1 : [1, 1.07, 1], y: 0, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
              transition={{ scale: { duration: 1.8, repeat: Infinity }, y: { type: 'spring', stiffness: 300, damping: 14 } }}
              whileHover={still ? undefined : { scale: 1.1 }} whileTap={{ scale: 0.92 }}>
              {me === 'left' && <span aria-hidden="true">&larr;</span>}<HandGrabbing weight="fill" className="w-[calc(var(--u)*7)] h-[calc(var(--u)*7)]" style={{ transform: me === 'left' ? 'scaleX(-1)' : undefined }} />Pull!{pulls > 1 ? ' x2' : ''}{me === 'right' && <span aria-hidden="true">&rarr;</span>}
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

const TEAM_X = [56, 82, 108];
// One team: three pullers (more with Extra Puller) leaning back on the rope.
function Team({ side, color, extra, heave, fall, grip, still, slip, flex }: { side: Side; color: string; extra: number; heave: number; fall: boolean; grip: boolean; still: boolean; slip: number; flex: number }) {
  const s = side === 'left' ? 1 : -1; // pullers on the left lean left
  const xs = [...TEAM_X, ...Array.from({ length: extra }, (_, i) => 32 - i * 16)];
  return (
    <motion.g initial={false} animate={fall ? { x: s * 70 } : { x: 0 }} transition={{ type: 'spring', stiffness: 60, damping: 12 }}>
      {xs.map((x0, i) => {
        const x = side === 'left' ? x0 : 400 - x0;
        return (
          <Puller key={i} x={x} s={s} color={color} heave={heave} fall={fall} grip={grip} still={still} slip={slip} flex={flex} i={i} arrive={i >= TEAM_X.length} />
        );
      })}
    </motion.g>
  );
}

function Puller({ x, s, color, heave, fall, grip, still, slip, flex, i, arrive }: { x: number; s: number; color: string; heave: number; fall: boolean; grip: boolean; still: boolean; slip: number; flex: number; i: number; arrive: boolean }) {
  const lean = -s * 14;
  const hand = x + s * 14;
  const effort = heave > 0;
  return (
    <motion.g initial={arrive && !still ? { x: -s * 160, opacity: 0 } : false} animate={{ x: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 90, damping: 14 }}>
      <motion.g style={{ transformOrigin: `${x}px 192px` }} initial={false}
        animate={fall && !still ? { rotate: [lean, s * 50, s * 80], y: [0, -6, 8] } : still ? { rotate: lean } : effort ? { rotate: [lean, lean - s * (heave % 2 ? 16 : 15), lean - s * 10, lean], x: [0, -s * 4, 0] } : slip ? { rotate: [lean, -lean, lean], x: [0, s * 6, 0] } : flex ? { rotate: lean, scale: [1, 1.25, 1, 1.2, 1], y: [0, -8, 0, -6, 0] } : { rotate: [lean, lean - s * 2, lean], scale: 1, y: 0, x: 0 }}
        transition={fall ? { duration: 0.9, delay: 0.2 + i * 0.08 } : effort ? { duration: 0.9, delay: i * 0.05 } : slip ? { duration: 0.6 } : flex ? { duration: 1.2, delay: i * 0.08 } : { duration: 2 + i * 0.3, repeat: Infinity }}>
        <ellipse cx={x} cy="193" rx="10" ry="3" fill="#000" opacity="0.18" />
        <path d={`M${x - 5} 178l-3 14M${x + 5} 178l3 14`} stroke="#241c3d" strokeWidth="4" strokeLinecap="round" />
        <ellipse cx={x} cy="166" rx="11" ry="15" fill={color} stroke="#000" strokeWidth="2" />
        <path d={`M${x + s * 3} 160L${hand} 150M${x - s * 2} 166L${hand - s * 4} 151`} stroke="#000" strokeWidth="3.6" strokeLinecap="round" />
        <path d={`M${x + s * 3} 160L${hand} 150M${x - s * 2} 166L${hand - s * 4} 151`} stroke={color} strokeWidth="2" strokeLinecap="round" />
        <circle cx={x} cy="140" r="10.5" fill="#fbe3c8" stroke="#000" strokeWidth="2" />
        <path d={`M${x - 10} 136h20`} stroke={color} strokeWidth="3.4" />
        <circle cx={x + s * 2.5 - 2.5} cy="141" r="1.5" /><circle cx={x + s * 2.5 + 2.5} cy="141" r="1.5" />
        {effort || fall ? <ellipse cx={x + s * 2} cy="146" rx="2.2" ry="2.6" fill="#241c3d" /> : <path d={`M${x - 2} 145q${2 + s} 2.5 ${4} 0`} stroke="#000" strokeWidth="1.4" fill="none" />}
        {(effort || flex > 0) && !still && <motion.path d={`M${x - s * 9} 132q-2 4 0 6q2-2 0-6z`} fill="#7fd6e3" stroke="#000" strokeWidth="0.8" initial={{ y: 0, opacity: 1 }} animate={{ y: 14, opacity: 0 }} transition={{ duration: 0.9 }} />}
        {grip && <motion.circle cx={hand} cy="150" r="4" fill="#fdfd94" stroke="#000" strokeWidth="1.4" animate={still ? undefined : { scale: [1, 1.4, 1] }} transition={{ duration: 0.8, repeat: Infinity }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />}
      </motion.g>
      {/* Dust puffs when they dig in. */}
      {effort && !still && [0, 1].map((k) => (
        <motion.circle key={`d${heave}-${k}`} cx={x + (k ? 6 : -6)} cy="192" r="4" fill="#e9dcc0" stroke="#000" strokeWidth="0.8" initial={{ scale: 0.3, opacity: 1, x: 0, y: 0 }} animate={{ scale: 1.6, opacity: 0, x: (k ? 1 : -1) * 10 + s * 8, y: -8 }} transition={{ duration: 0.8 }} style={{ transformBox: 'fill-box', transformOrigin: 'center' }} />
      ))}
    </motion.g>
  );
}

function Cloud({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <path d={`M${x} ${y}a${10 * s} ${10 * s} 0 0 1 ${18 * s} ${-6 * s}a${12 * s} ${12 * s} 0 0 1 ${22 * s} ${2 * s}a${8 * s} ${8 * s} 0 0 1 ${4 * s} ${14 * s}h${-44 * s}a${6 * s} ${6 * s} 0 0 1 0 ${-10 * s}z`} fill="#fff" stroke="#000" strokeWidth="1.6" />;
}

function useTall(ref: RefObject<HTMLDivElement | null>) {
  const [tall, setTall] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTall(e.contentRect.height / Math.max(1, e.contentRect.width) > 0.8));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return tall;
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'grip' && <>{ring('#fdfd94')}<path d="M30 70V44a6 6 0 0 1 12 0v-6a6 6 0 0 1 12 0v4a6 6 0 0 1 12 0v4a6 6 0 0 1 12 0v18q0 12-14 14H44q-14-2-14-14z" fill="#ef7d96" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M22 30l6 4M50 18v8M76 26l-5 6" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'banana' && <>{ring('#fff6b0')}<path d="M24 40q26 34 52 0q-8 28-26 28T24 40z" fill="#fdd65a" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M24 40l-6-8M76 40l6-8M50 66v10" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'extra' && <>{ring('#c8f0dc')}<ellipse cx="46" cy="62" rx="14" ry="18" fill="#6aa9e9" stroke="#000" strokeWidth="4" /><circle cx="46" cy="34" r="12" fill="#fbe3c8" stroke="#000" strokeWidth="4" /><path d="M68 40v20M58 50h20" stroke="#000" strokeWidth="6" strokeLinecap="round" /></>}
      {kind === 'double' && <>{ring('#b4c4fb')}<path d="M18 50h64" stroke="#c8956a" strokeWidth="8" strokeLinecap="round" /><path d="M28 36l-12 14 12 14M44 36l-12 14 12 14" stroke="#000" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" /><text x="66" y="40" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="sans-serif">x2</text></>}
      {kind === 'muscles' && <>{ring('#f5a08c')}<path d="M24 66q-4-20 10-30l8-12q8-2 10 6l-6 10q16-4 24 8 8 16-6 22-18 6-40-4z" fill="#fbe3c8" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M48 50q8-4 14 2" stroke="#000" strokeWidth="3" fill="none" /></>}
      {kind === 'tickle' && <>{ring('#e9eefe')}<path d="M16 54q10-14 20 0t20 0 20 0 10-4" stroke="#c8956a" strokeWidth="8" fill="none" strokeLinecap="round" /><path d="M60 24q12 4 10 18q-8-2-10-18z" fill="#fdfd94" stroke="#000" strokeWidth="3.5" /><path d="M30 30l4 6M40 26l2 6" stroke="#000" strokeWidth="3.5" strokeLinecap="round" /></>}
      {kind === 'wind' && <>{ring('#c9ecff')}<path d="M18 40h40a8 8 0 1 0-8-8M18 54h54a9 9 0 1 1-9 9M18 68h30" stroke="#241c3d" strokeWidth="6" fill="none" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 400 248" preserveAspectRatio="xMidYMid slice">
      <rect width="400" height="248" fill="#bcd0ff" />
      <circle cx="340" cy="44" r="18" fill="#fdd65a" stroke="#000" strokeWidth="2" />
      <path d="M0 140q90-34 180-10t220-6v124H0z" fill="#7ccf8e" stroke="#000" strokeWidth="2" />
      <rect y="150" width="400" height="98" fill="#8fe3a0" />
      <path d="M0 150H400" stroke="#000" strokeWidth="2" />
      <ellipse cx="200" cy="196" rx="54" ry="16" fill="#8a5a3b" stroke="#000" strokeWidth="2" />
      <g transform="translate(-30 12)">
        <path d="M60 150H360" stroke="#c8956a" strokeWidth="5" strokeLinecap="round" />
        <path d="M230 150v22" stroke="#000" strokeWidth="2" /><path d="M230 156l-14 8 14 8z" fill="#ef7d96" stroke="#000" strokeWidth="1.6" /><path d="M230 156l14 8-14 8z" fill="#fdfd94" stroke="#000" strokeWidth="1.6" />
        {[74, 102, 130].map((x) => <g key={x} transform={`rotate(-16 ${x} 192)`}><ellipse cx={x} cy="166" rx="11" ry="15" fill="#f6c544" stroke="#000" strokeWidth="2" /><circle cx={x} cy="140" r="10.5" fill="#fbe3c8" stroke="#000" strokeWidth="2" /><path d={`M${x} 160L${x + 14} 150`} stroke="#000" strokeWidth="3.4" strokeLinecap="round" /></g>)}
        {[300, 328, 356].map((x) => <g key={x} transform={`rotate(16 ${x} 192)`}><ellipse cx={x} cy="166" rx="11" ry="15" fill="#5cc3a0" stroke="#000" strokeWidth="2" /><circle cx={x} cy="140" r="10.5" fill="#fbe3c8" stroke="#000" strokeWidth="2" /><path d={`M${x} 160L${x - 14} 150`} stroke="#000" strokeWidth="3.4" strokeLinecap="round" /></g>)}
      </g>
    </svg>
  );
}

const def: LabDef = {
  id: 'team-tug',
  name: 'Team Tug',
  description: 'A tug of war over a mud puddle. Every right answer is a big pull. Pull the flag to your side to win!',
  ways: ['teams', 'solo'],
  minTeams: 2,
  maxTeams: 2,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to earn a pull' },
    { icon: <HandGrabbing weight="fill" />, text: 'Tap Pull! to heave the rope' },
    { icon: <Flag weight="fill" />, text: 'Pull the flag to your line to win' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 10 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #dbe6ff 0%, #b4c4fb 55%, #93a5ee 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the field' },
    { id: 'field', label: 'Field', hint: 'The sky, hills and grass' },
    { id: 'mud', label: 'Mud puddle', hint: 'The puddle in the middle' },
    { id: 'rope', label: 'Rope and flag', hint: 'The rope and the flag in its middle' },
    { id: 'puller', label: 'Puller', hint: 'One team member, drawn in the team color' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
