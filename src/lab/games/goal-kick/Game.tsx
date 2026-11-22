import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CheckCircle, HandTap, SoccerBall, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { pace } from '../../../engine/pace';
import { TeamBadge } from '../../../engine/TeamBadge';
import { TEAM_COLORS } from '../../../engine/turns';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { col, cpuKick, goalieDive, kickOutcome, row, windPush, zonePoints, ZONES, type GoalieLevel, type Outcome, type Zone } from './rules';

// Goal Kick (Game Lab, inspired by classroom quiz-board soccer games): a
// right answer earns a penalty kick. Tap one of six spots in the goal; the
// goalie dives, the ball curves, and the net ripples on a goal. Top corners
// score 3 but can ping off the post. Each team's flag climbs its pole.

const ART = '/lab/goal-kick';
const POWERS: LabPower[] = [
  { id: 'banana', name: 'Banana Kick', desc: 'The ball bends like a banana. The goalie dives the wrong way.', enter: 'spin', art: <Art kind="banana" /> },
  { id: 'sleepy', name: 'Sleepy Goalie', desc: 'The goalie yawns and naps. No dive this kick.', enter: 'drop', art: <Art kind="sleepy" /> },
  { id: 'double', name: 'Double Ball', desc: 'Kick two balls at once at two spots.', enter: 'zoom', art: <Art kind="double" /> },
  { id: 'rainbow', name: 'Rainbow Kick', desc: 'A rainbow trail! This goal scores double.', enter: 'zoom', art: <Art kind="rainbow" /> },
  { id: 'tiny', name: 'Tiny Goalie', desc: 'A potion shrinks the goalie down tiny.', enter: 'wiggle', art: <Art kind="tiny" /> },
  { id: 'butter', name: 'Butterfingers', desc: 'Slippery ball! It squirts off to a surprise spot.', silly: true, art: <Art kind="butter" /> },
  { id: 'windy', name: 'Windy Day', desc: 'Whoosh! A gust blows your kick one spot sideways.', silly: true, art: <Art kind="windy" /> },
];

// The goal (viewBox 160 x 100).
const GOAL = { l: 38, r: 122, t: 20, b: 58 };
const SPOT = { x: 80, y: 88 };
const zoneCenter = (z: Zone) => ({ x: GOAL.l + (col(z) + 0.5) * ((GOAL.r - GOAL.l) / 3), y: GOAL.t + (row(z) + 0.5) * ((GOAL.b - GOAL.t) / 2) });
const SKINS = ['#f1c7a0', '#d9a37a', '#a8724e', '#7a4f33', '#f6d6b8'];
type Phase = 'wait' | 'pick' | 'kick' | 'busy';
interface Mods { banana: boolean; sleepy: boolean; double: boolean; rainbow: boolean; tiny: boolean; butter: boolean; windy: boolean }
const NO_MODS: Mods = { banana: false, sleepy: false, double: false, rainbow: false, tiny: false, butter: false, windy: false };
interface Shot { key: number; pts: { x: number; y: number; s: number }[]; dur: number; rainbow: boolean }

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const P = pace(ctx.settings) / 1.6;
  const wait = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms * P));
  const [phase, setPhase] = useState<Phase>('wait');
  const [mods, setModsState] = useState<Mods>(NO_MODS);
  const modsRef = useRef<Mods>(NO_MODS);
  const setMods = (m: Partial<Mods>) => { modsRef.current = { ...modsRef.current, ...m }; setModsState(modsRef.current); };
  const [picked, setPicked] = useState<Zone[]>([]);
  const [dive, setDive] = useState<Zone | null>(null);
  const [shots, setShots] = useState<Shot[]>([]);
  const [ripple, setRipple] = useState<{ key: number; x: number; y: number } | null>(null);
  const [runUp, setRunUp] = useState(0);
  const [cheer, setCheer] = useState(0);
  const [gust, setGust] = useState(0);
  const [pop, setPop] = useState<{ key: number; text: string; x: number; y: number } | null>(null);
  const input = useRef<((z: Zone) => void) | null>(null);
  const live = useRef(0);
  const keyN = useRef(1);
  const color = TEAM_COLORS[ctx.player.colorIndex % TEAM_COLORS.length];
  const still = ctx.still;

  useEffect(() => {
    const id = ++live.current;
    void turn(id);
    return () => { live.current++; input.current = null; };
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps
  const alive = (id: number) => live.current === id;
  const choose = () => new Promise<Zone>((r) => { input.current = r; });

  async function turn(id: number) {
    setMods(NO_MODS); setPicked([]); setDive(null); setShots([]); setPhase('wait');
    const ok = await c.current.ask();
    if (!alive(id)) return;
    if (!ok) { c.current.sfx.wrong(); c.current.say('Oops!', 'oops'); await wait(1300); if (alive(id)) c.current.next(); return; }
    const p = await c.current.power(0.45);
    if (!alive(id)) return;
    await usePower(p);
    if (!alive(id)) return;
    // Pick a spot (two with Double Ball).
    const need = modsRef.current.double ? 2 : 1;
    const picks: Zone[] = [];
    setPhase('pick');
    while (picks.length < need) {
      let z: Zone;
      if (c.current.cpu) { await wait(1300); z = cpuKick(c.current.cpuLevel); if (picks.includes(z)) z = ZONES.find((q) => !picks.includes(q))!; }
      else z = await choose();
      if (!alive(id)) return;
      if (picks.includes(z)) continue;
      picks.push(z); setPicked([...picks]);
      c.current.sfx.tap();
    }
    setPhase('kick');
    await kick(id, picks);
  }

  async function usePower(p: LabPower | null) {
    const x = c.current;
    if (!p) return;
    switch (p.id) {
      case 'banana': setMods({ banana: true }); x.sfx.slideUp(); break;
      case 'sleepy': setMods({ sleepy: true }); x.sfx.slideDown(); break;
      case 'double': setMods({ double: true }); x.sfx.pop(); window.setTimeout(() => c.current.sfx.pop(), 180); break;
      case 'rainbow': setMods({ rainbow: true }); x.sfx.power(); break;
      case 'tiny': setMods({ tiny: true }); x.sfx.slideDown(); break;
      case 'butter': setMods({ butter: true }); x.sfx.boing(); break;
      case 'windy': setMods({ windy: true }); x.sfx.wind(); break;
    }
    await wait(1000);
  }

  function flightPts(from: { x: number; y: number }, to: { x: number; y: number }, bend: number, after: Outcome | 'none', side: number) {
    const pts: { x: number; y: number; s: number }[] = [];
    const N = 14;
    const cx = (from.x + to.x) / 2 + bend, cy = (from.y + to.y) / 2 - 8;
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = (1 - t) ** 2, b = 2 * (1 - t) * t, d = t * t;
      pts.push({ x: a * from.x + b * cx + d * to.x, y: a * from.y + b * cy + d * to.y, s: 1 - 0.58 * t });
    }
    // What happens after: into the net, bounced away by the goalie, or off the post.
    if (after === 'goal') [1, 2, 3, 4].forEach((k) => pts.push({ x: to.x + side * k * 0.3, y: Math.min(GOAL.b - 2, to.y + k * k * 0.9), s: 0.4 }));
    if (after === 'save') [1, 2, 3, 4, 5].forEach((k) => pts.push({ x: to.x + side * k * 7, y: to.y + k * 5 - (k === 2 ? 4 : 0), s: 0.42 + k * 0.05 }));
    if (after === 'post') [1, 2, 3, 4, 5].forEach((k) => pts.push({ x: to.x - side * k * 3, y: to.y + k * 7, s: 0.42 + k * 0.08 }));
    return pts;
  }

  async function kick(id: number, picks: Zone[]) {
    const x = c.current, m = modsRef.current;
    // Silly ones move the ball before it flies.
    let aims = picks;
    if (m.butter) { aims = picks.map(() => ZONES[Math.floor(Math.random() * 6)]); }
    if (m.windy) { aims = picks.map((z) => windPush(z)); }
    const others = x.turns.players.filter((p) => p.id !== x.player.id);
    const level: GoalieLevel = !x.cpu && others.some((p) => p.kind === 'cpu') ? x.cpuLevel : 'none';
    // The run-up.
    setRunUp((n) => n + 1);
    await wait(650);
    if (!alive(id)) return;
    x.sfx.kick();
    if (m.windy) { setGust((n) => n + 1); x.sfx.wind(); }
    if (m.butter) x.sfx.boing();
    // The goalie dives.
    let d: Zone | null = m.sleepy ? null : goalieDive(aims[0], level);
    if (m.banana) d = (aims[0] < 3 ? (col(aims[0]) === 0 ? 2 : 0) : col(aims[0]) === 0 ? 5 : 3) as Zone;
    if (aims.length > 1 && d !== null && Math.random() < 0.5) d = goalieDive(aims[1], level);
    const results = aims.map((z) => (m.banana ? (z === 0 || z === 2) && Math.random() < 0.08 ? 'post' as Outcome : 'goal' as Outcome : kickOutcome(z, d, { tiny: m.tiny })));
    // A fingertip save: the goalie stretches to the ball it stops.
    const saved = results.findIndex((r) => r === 'save');
    setDive(saved >= 0 ? aims[saved] : d);
    const dur = 0.85 * P;
    setShots(aims.map((z, i) => {
      const t = zoneCenter(z);
      const to = { x: t.x + (Math.random() - 0.5) * 10, y: t.y + (Math.random() - 0.5) * 8 };
      const side = to.x < 80 ? -1 : 1;
      const bend = m.banana ? -side * 34 : m.windy ? (col(z) - col(picks[i])) * 26 : (Math.random() - 0.5) * 14;
      return { key: keyN.current++, pts: flightPts({ x: SPOT.x + (aims.length > 1 ? (i ? 6 : -6) : 0), y: SPOT.y }, to, bend, results[i], side), dur, rainbow: m.rainbow };
    }));
    // Wait until the ball reaches the goal line (point 14 of its path).
    await new Promise((r) => window.setTimeout(r, dur * 1.5 * 1000 * (14 / (14 + 4.5))));
    if (!alive(id)) return;
    let total = 0;
    results.forEach((r, i) => {
      const t = zoneCenter(aims[i]);
      if (r === 'goal') {
        total += zonePoints(aims[i]) * (m.rainbow ? 2 : 1);
        setRipple({ key: keyN.current++, x: t.x, y: t.y });
        x.sfx.swish();
      } else if (r === 'save') x.sfx.thud();
      else x.sfx.bell();
    });
    await wait(500);
    if (!alive(id)) return;
    if (total > 0) {
      x.points(total);
      x.say(results.every((r) => r === 'goal') && aims.length > 1 ? 'Double goal!' : 'GOAL!', 'big');
      x.sfx.cheer(); playClip(`${ART}/celebrate.mp3`, x.settings, 0.6);
      setCheer((n) => n + 1);
      setPop({ key: keyN.current++, text: `+${total}`, x: 80, y: GOAL.t - 2 });
      x.burst(0.45, 0.3, total >= 3 ? 'big' : 'small');
    } else {
      x.sfx.oops();
      x.say(results.includes('post') ? 'Ping! Off the post!' : m.tiny ? 'Tiny save!' : 'Great save!', 'oops');
      playClip(`${ART}/clap.mp3`, x.settings, 0.35);
    }
    setPhase('busy');
    await wait(2000);
    if (!alive(id)) return;
    c.current.next();
  }

  // Number keys 1 to 6 pick a spot (top row then bottom row).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { const n = Number(e.key); if (n >= 1 && n <= 6 && !c.current.cpu) input.current?.((n - 1) as Zone); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const top = Math.max(10, ...ctx.turns.players.map((p) => p.score));
  const human = !ctx.cpu;
  const ballIdle = shots.length === 0;
  const goalie = goaliePose(dive, phase === 'kick' || phase === 'busy');

  return (
    <div className="absolute inset-0 grid place-items-center">
      <style>{CSS}</style>
      <div className="relative lab-fit rounded-[1.4rem] border-heavy border-border overflow-hidden" style={{ ['--ar' as string]: 1.6, boxShadow: '0 8px 0 #000, 0 24px 44px rgba(36,28,61,0.35)' }}>
        <svg viewBox="0 0 160 100" className="absolute inset-0 w-full h-full" role="img" aria-label="Soccer goal">
          <PitchArt />
          <g key={`ch${cheer}`} className={still ? '' : 'gk-cheer'}><Crowd /></g>
          {/* The net, rippling where a goal lands. */}
          <motion.g key={`net${ripple?.key ?? 0}`} animate={still || !ripple ? undefined : { scale: [1, 1.05, 0.98, 1.01, 1] }} transition={{ duration: 0.7 }}
            style={ripple ? { originX: (ripple.x - GOAL.l) / (GOAL.r - GOAL.l), originY: (ripple.y - GOAL.t) / (GOAL.b - GOAL.t) } : undefined}>
            <NetArt />
          </motion.g>
          {ripple && !still && (
            <motion.ellipse key={`r${ripple.key}`} cx={ripple.x} cy={ripple.y} rx="3" ry="2" fill="none" stroke="#fbfcf8" strokeWidth="0.8" initial={{ scale: 0.4, opacity: 1 }} animate={{ scale: 4, opacity: 0 }} transition={{ duration: 0.8 }} />
          )}
          {/* The goalie: big gloves, a silly grin. */}
          <motion.g initial={false} animate={{ x: goalie.x, y: goalie.y, rotate: goalie.r }} transition={{ type: 'spring', stiffness: 90, damping: 11, mass: 0.9 }}>
            <circle cx="80" cy="44" r="22" fill="none" />
            <g transform="translate(80 58)">
              <motion.g animate={{ scale: mods.tiny ? 0.5 : 1 }} transition={{ type: 'spring', stiffness: 200, damping: 10 }} style={{ originY: 1 }}>
                <g className={still || mods.sleepy || phase !== 'pick' && phase !== 'wait' ? '' : 'gk-sway'}><Keeper sleepy={mods.sleepy} reach={dive !== null && phase !== 'wait'} /></g>
              </motion.g>
            </g>
          </motion.g>
          {mods.sleepy && !still && [0, 1, 2].map((i) => (
            <motion.text key={i} x="88" y="28" fontSize="5" fontWeight="900" fill="#241c3d" initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0], x: [88, 92 + i * 3, 96 + i * 4], y: [28, 22 - i * 3, 16 - i * 4] }} transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.7 }}>z</motion.text>
          ))}
          {/* The wind. */}
          {gust > 0 && !still && (
            <motion.g key={`g${gust}`} initial={{ x: -60, opacity: 0 }} animate={{ x: 180, opacity: [0, 1, 1, 0] }} transition={{ duration: 1.1 }}>
              {[60, 70, 80].map((y, i) => <path key={y} d={`M0 ${y} q10 -4 20 0 t20 0`} stroke="#fbfcf8" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity={0.9 - i * 0.2} />)}
              <image href={`${ART}/wind.webp`} x="20" y="54" width="18" height="18" />
            </motion.g>
          )}
          {/* The penalty spot and the kicker, seen from behind. */}
          <ellipse cx={SPOT.x} cy={SPOT.y + 4} rx="3" ry="1" fill="#fbfcf8" opacity="0.9" />
          <motion.g key={`k${runUp}`} initial={false} animate={still || !runUp ? { x: 60, y: 98 } : { x: [56, 64, 71, 71], y: [100, 99, 98, 98] }} transition={{ duration: 0.75 * P, times: [0, 0.5, 0.85, 1] }}>
            <Kicker shirt={color} skin={SKINS[ctx.player.colorIndex % SKINS.length]} kick={runUp > 0} />
          </motion.g>
          {ballIdle && (
            <motion.g animate={still ? undefined : { y: [0, -0.4, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>
              {(mods.double ? [-6, 6] : [0]).map((dx) => (
                <g key={dx}><ellipse cx={SPOT.x + dx} cy={SPOT.y + 4.4} rx="4" ry="1.1" fill="#000" opacity="0.25" /><image href={`${ART}/soccer.webp`} x={SPOT.x + dx - 4.5} y={SPOT.y - 4.5} width="9" height="9" /></g>
              ))}
            </motion.g>
          )}
          {/* The kicked balls. */}
          {shots.map((s) => (
            <g key={s.key}>
              {s.rainbow && !still && s.pts.slice(0, 15).map((p, i) => (
                <motion.circle key={i} cx={p.x} cy={p.y} r={3.4 * p.s} fill={['#ef7d96', '#f5a08c', '#fdfd94', '#8fe3a0', '#7fd6e3', '#b4c4fb', '#c58ce8'][i % 7]}
                  initial={{ opacity: 0 }} animate={{ opacity: [0, 0.85, 0] }} transition={{ duration: 0.9, delay: (i / 15) * s.dur * 1.5 * 0.76 }} />
              ))}
              <motion.g initial={{ x: s.pts[0].x, y: s.pts[0].y, scale: 1 }} animate={{ x: s.pts.map((p) => p.x), y: s.pts.map((p) => p.y), scale: s.pts.map((p) => p.s), rotate: 540 }} transition={{ duration: s.dur * 1.5, ease: 'linear' }}>
                <image href={`${ART}/soccer.webp`} x="-4.5" y="-4.5" width="9" height="9" />
              </motion.g>
            </g>
          ))}
          <AnimatePresence>
            {pop && (
              <motion.text key={pop.key} x={pop.x} y={pop.y} textAnchor="middle" className="font-display" fontSize="10" fill="#fdfd94" stroke="#000" strokeWidth="0.9" paintOrder="stroke"
                initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: [0, 1, 1, 0], scale: 1, y: -6 }} transition={{ duration: 1.4 }} onAnimationComplete={() => setPop(null)}>{pop.text}</motion.text>
            )}
          </AnimatePresence>
        </svg>
        {/* Each team's flag climbs its pole with every point. */}
        <div className="absolute inset-x-[2%] top-[1%] h-[17%] flex justify-between pointer-events-none" aria-hidden="true">
          {ctx.turns.players.map((p) => (
            <div key={p.id} className="relative h-full w-[clamp(2.2rem,8%,4.6rem)]">
              <span className="absolute left-0 top-0 bottom-0 w-[0.2rem] rounded-full bg-[#5b5f7a] border border-border" />
              <motion.span className="absolute left-[0.2rem] w-[80%] h-[52%] border-std border-border flex items-center justify-center"
                style={{ background: TEAM_COLORS[p.colorIndex % TEAM_COLORS.length], clipPath: 'polygon(0 0, 100% 10%, 88% 50%, 100% 90%, 0 100%)' }}
                initial={false} animate={{ top: `${48 - 48 * Math.min(1, p.score / top)}%`, rotate: still ? 0 : [0, 2, -1, 0] }} transition={{ top: { type: 'spring', stiffness: 70, damping: 12 }, rotate: { duration: 2, repeat: Infinity } }}>
                <TeamBadge colorIndex={p.colorIndex} size={18} />
              </motion.span>
            </div>
          ))}
        </div>
        {/* Six spots in the goal to aim for. */}
        <AnimatePresence>
          {phase === 'pick' && ZONES.map((z) => {
            const on = picked.includes(z);
            return (
              <motion.button key={z} type="button" disabled={!human || on} onClick={() => input.current?.(z)} aria-label={`Kick ${row(z) ? 'low' : 'high'} ${['left', 'middle', 'right'][col(z)]}, ${zonePoints(z)} points`}
                className="absolute grid place-items-center rounded-[0.9rem] border-[0.2rem] border-dashed disabled:cursor-default motion-safe:hover:scale-[1.06] motion-safe:transition-transform"
                style={{ left: `${((GOAL.l + col(z) * 28 + 2) / 160) * 100}%`, top: `${GOAL.t + row(z) * 19 + 1.5}%`, width: `${(24 / 160) * 100}%`, height: '16%', borderColor: on ? '#000' : '#241c3d', background: on ? 'rgba(253,253,148,0.85)' : 'rgba(251,252,248,0.62)', boxShadow: '0 0 0 0.15rem #fdfd94' }}
                initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 14, delay: z * 0.05 }}>
                <span className="flex gap-[0.15rem] w-[78%] justify-center">
                  {Array.from({ length: zonePoints(z) }, (_, i) => <img key={i} src={`${ART}/soccer.webp`} alt="" className="w-[30%] aspect-square drop-shadow-[0_2px_0_rgba(0,0,0,0.5)]" />)}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>
        <AnimatePresence>
          {phase === 'pick' && human && (
            <motion.div className="absolute right-[3%] bottom-[4%] pointer-events-none grid justify-items-center gap-1" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <motion.span className="w-[clamp(3.2rem,8cqw,5.5rem)] aspect-square rounded-full border-heavy border-border grid place-items-center bg-accent" style={{ boxShadow: '0 5px 0 #000' }}
                animate={still ? undefined : { y: [0, -4, 0] }} transition={{ duration: 0.9, repeat: Infinity }}>
                <HandTap weight="fill" className="w-1/2 h-1/2" />
              </motion.span>
              <span className="font-display text-[clamp(1rem,2.3cqw,1.6rem)] text-white leading-none text-center" style={{ WebkitTextStroke: '0.12em #000', paintOrder: 'stroke fill' }}>{mods.double && picked.length === 1 ? 'One more!' : 'Pick a spot!'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Where the goalie ends up: a dive to the side, a leap up or a crouch.
function goaliePose(dive: Zone | null, going: boolean) {
  if (!going || dive === null) return { x: 0, y: 0, r: 0 };
  const t = zoneCenter(dive);
  const c = col(dive);
  if (c === 1) return { x: 0, y: row(dive) === 0 ? -10 : 3, r: 0 };
  return { x: (t.x - 80) * 0.85, y: row(dive) === 0 ? -12 : -2, r: c === 0 ? -68 : 68 };
}

const CSS = `
.gk-cheer > g { animation: gk-cheer 0.5s ease-in-out 3 both; }
.gk-cheer > g:nth-child(2n) { animation-delay: 0.15s; }
@keyframes gk-cheer { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-2px); } }
.gk-sway { animation: gk-sway 1.1s ease-in-out infinite alternate; transform-box: fill-box; transform-origin: 50% 100%; }
@keyframes gk-sway { from { transform: translateX(-2.5px) rotate(-3deg); } to { transform: translateX(2.5px) rotate(3deg); } }
html[data-motion="still"] .gk-cheer > g, html[data-motion="still"] .gk-sway { animation: none; }
`;

function Keeper({ sleepy, reach }: { sleepy: boolean; reach: boolean }) {
  return (
    <g transform="scale(1.75)">
      <ellipse cy="0.3" rx="4" ry="0.9" fill="#000" opacity="0.2" />
      <path d="M-1.6 0 L-1.2 -4 M1.6 0 L1.2 -4" stroke="#241c3d" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="-2.6" y="-5" width="5.2" height="2" rx="0.6" fill="#241c3d" />
      {reach || !sleepy
        ? <path d={reach ? 'M-2.6 -8.4 L-5.4 -13 M2.6 -8.4 L5.4 -13' : 'M-2.6 -8 L-6 -9 M2.6 -8 L6 -9'} stroke="#f1c7a0" strokeWidth="1.2" strokeLinecap="round" />
        : <path d="M-2.6 -8 L-3.6 -5 M2.6 -8 L3.6 -5" stroke="#f1c7a0" strokeWidth="1.2" strokeLinecap="round" />}
      {[-1, 1].map((s) => <circle key={s} cx={s * (reach ? 5.8 : sleepy ? 3.8 : 6.6)} cy={reach ? -13.6 : sleepy ? -4.6 : -9.2} r="1.6" fill="#fdfd94" stroke="#000" strokeWidth="0.4" />)}
      <rect x="-2.8" y="-9.4" width="5.6" height="5" rx="1.6" fill="#ef7d96" stroke="#000" strokeWidth="0.45" />
      <path d="M-2.8 -7.6 h5.6" stroke="#fdfd94" strokeWidth="0.7" />
      <circle cy="-11.8" r="2.7" fill="#f1c7a0" stroke="#000" strokeWidth="0.45" />
      <path d="M-2.6 -12.6 Q0 -15.6 2.6 -12.6 Q1 -13.4 0 -13 Q-1 -13.4 -2.6 -12.6 Z" fill="#7a4f33" />
      {sleepy
        ? <path d="M-1.5 -11.8 h1 M0.5 -11.8 h1" stroke="#000" strokeWidth="0.35" strokeLinecap="round" />
        : <><circle cx="-0.9" cy="-11.9" r="0.36" fill="#000" /><circle cx="0.9" cy="-11.9" r="0.36" fill="#000" /></>}
      {sleepy ? <ellipse cy="-10.4" rx="0.6" ry="0.5" fill="#000" /> : <path d="M-1 -10.6 Q0 -9.8 1 -10.6" stroke="#000" strokeWidth="0.35" fill="none" strokeLinecap="round" />}
    </g>
  );
}

function Kicker({ shirt, skin, kick }: { shirt: string; skin: string; kick: boolean }) {
  return (
    <g transform="scale(2.4)">
      <ellipse cy="0.3" rx="3" ry="0.8" fill="#000" opacity="0.25" />
      <path d="M-1.3 0 L-1 -3.6" stroke={skin} strokeWidth="1.3" strokeLinecap="round" />
      <motion.path d="M1.3 0 L1 -3.6" stroke={skin} strokeWidth="1.3" strokeLinecap="round" animate={kick ? { d: ['M1.3 0 L1 -3.6', 'M-0.2 0.6 L1 -3.6', 'M4 -1.6 L1 -3.6', 'M1.3 0 L1 -3.6'] } : undefined} transition={{ duration: 0.75, times: [0, 0.6, 0.8, 1] }} />
      <rect x="-2.3" y="-4.8" width="4.6" height="1.8" rx="0.6" fill="#241c3d" />
      <path d="M-2.4 -7.6 L-3.6 -4.6 M2.4 -7.6 L3.6 -4.6" stroke={skin} strokeWidth="1.1" strokeLinecap="round" />
      <rect x="-2.6" y="-8.8" width="5.2" height="4.4" rx="1.4" fill={shirt} stroke="#000" strokeWidth="0.45" />
      <circle cy="-10.8" r="2.5" fill={skin} stroke="#000" strokeWidth="0.45" />
      <path d="M-2.5 -10.8 Q-2.4 -13.5 0 -13.4 Q2.4 -13.5 2.5 -10.8 Q0 -9.6 -2.5 -10.8 Z" fill="#241c3d" />
    </g>
  );
}

function NetArt() {
  return (
    <g>
      <path d={`M${GOAL.l} ${GOAL.t} L${GOAL.l + 6} ${GOAL.t + 5} L${GOAL.r - 6} ${GOAL.t + 5} L${GOAL.r} ${GOAL.t} Z`} fill="#e9eefe" opacity="0.6" />
      <rect x={GOAL.l + 6} y={GOAL.t + 5} width={GOAL.r - GOAL.l - 12} height={GOAL.b - GOAL.t - 7} fill="#2f6b4f" opacity="0.35" />
      <g stroke="#fbfcf8" strokeWidth="0.3" opacity="0.85">
        {Array.from({ length: 22 }, (_, i) => <path key={`v${i}`} d={`M${GOAL.l + 6 + i * 3.4} ${GOAL.t + 5} V${GOAL.b - 2}`} />)}
        {Array.from({ length: 10 }, (_, i) => <path key={`h${i}`} d={`M${GOAL.l + 6} ${GOAL.t + 5 + i * 3.4} H${GOAL.r - 6}`} />)}
        {Array.from({ length: 6 }, (_, i) => <path key={`sl${i}`} d={`M${GOAL.l + i} ${GOAL.t + i * 0.8 + 1} L${GOAL.l + i} ${GOAL.b - i * 0.3}`} />)}
        {Array.from({ length: 6 }, (_, i) => <path key={`sr${i}`} d={`M${GOAL.r - i} ${GOAL.t + i * 0.8 + 1} L${GOAL.r - i} ${GOAL.b - i * 0.3}`} />)}
      </g>
      {/* The posts and crossbar. */}
      <path d={`M${GOAL.l} ${GOAL.b} V${GOAL.t} H${GOAL.r} V${GOAL.b}`} stroke="#000" strokeWidth="3.2" fill="none" strokeLinejoin="round" />
      <path d={`M${GOAL.l} ${GOAL.b} V${GOAL.t} H${GOAL.r} V${GOAL.b}`} stroke="#fbfcf8" strokeWidth="2.2" fill="none" strokeLinejoin="round" />
    </g>
  );
}

function Crowd() {
  const fans = useMemo(() => {
    const out: { x: number; y: number; c: string; skin: string }[] = [];
    [20, 26, 32].forEach((y, r) => { for (let x = 3 + r * 1.6; x < 158; x += 4.4) out.push({ x, y, c: TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)], skin: SKINS[Math.floor(Math.random() * SKINS.length)] }); });
    return out;
  }, []);
  return <>{fans.map((f, i) => <g key={i}><path d={`M${f.x - 1.8} ${f.y + 2.4} q0 -2.6 1.8 -2.6 q1.8 0 1.8 2.6 z`} fill={f.c} stroke="#000" strokeWidth="0.25" /><circle cx={f.x} cy={f.y - 1.3} r="1.3" fill={f.skin} stroke="#000" strokeWidth="0.25" /></g>)}</>;
}

// The stadium: sky, stands, boards and striped grass with the box lines.
function PitchArt() {
  return useMemo(() => (
    <g>
      <defs>
        <linearGradient id="gk-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9fd3ff" /><stop offset="1" stopColor="#d9eeff" /></linearGradient>
        <linearGradient id="gk-grass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4f9f45" /><stop offset="1" stopColor="#6cbf55" /></linearGradient>
      </defs>
      <rect width="160" height="20" fill="url(#gk-sky)" />
      <ellipse cx="30" cy="8" rx="10" ry="3" fill="#fff" opacity="0.8" /><ellipse cx="128" cy="6" rx="12" ry="3.2" fill="#fff" opacity="0.8" />
      {[18, 24, 30].map((y, i) => <rect key={y} y={y + 1.6} width="160" height="6" fill={['#6b74c9', '#5c65bb', '#4d56ad'][i]} />)}
      <rect y="37" width="160" height="4" fill="#241c3d" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <rect key={i} x={i * 20 + 1} y="37.6" width="18" height="2.8" rx="0.6" fill={['#fdfd94', '#ef7d96', '#8fe3a0', '#b4c4fb'][i % 4]} />)}
      <rect y="41" width="160" height="59" fill="url(#gk-grass)" />
      {[41, 47, 54, 62, 71, 81, 92].map((y, i) => i % 2 ? <rect key={y} y={y} width="160" height={[6, 7, 8, 9, 10, 11, 12][i]} fill="#fff" opacity="0.07" /> : null)}
      {/* The box lines in front of the goal. */}
      <path d="M0 58 H160" stroke="#fbfcf8" strokeWidth="0.7" />
      <path d="M24 58 L14 76 H146 L136 58" stroke="#fbfcf8" strokeWidth="0.7" fill="none" />
      <path d="M58 76 Q80 86 102 76" stroke="#fbfcf8" strokeWidth="0.7" fill="none" />
      {/* Corner flags. */}
      {[4, 156].map((x) => <g key={x}><path d={`M${x} 58 V48`} stroke="#241c3d" strokeWidth="0.5" /><path d={`M${x} 48 l${x < 80 ? 4 : -4} 1.5 l${x < 80 ? -4 : 4} 1.5 z`} fill="#ef7d96" stroke="#000" strokeWidth="0.25" /></g>)}
    </g>
  ), []);
}

function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'banana' && <>{ring('#8fe3a0')}<path d="M22 66 Q30 26 76 22 Q58 34 54 54 Q48 74 22 66 Z" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><path d="M74 22 l6 -4" stroke="#7a4f33" strokeWidth="5" strokeLinecap="round" /><image href={`${ART}/soccer.webp`} x="58" y="58" width="26" height="26" /></>}
      {kind === 'sleepy' && <>{ring('#b4c4fb')}<circle cx="44" cy="56" r="24" fill="#f1c7a0" stroke="#000" strokeWidth="4" /><path d="M32 54 h8 M48 54 h8" stroke="#000" strokeWidth="4" strokeLinecap="round" /><ellipse cx="44" cy="68" rx="5" ry="4" fill="#000" /><text x="70" y="38" fontSize="18" fontWeight="900">z</text><text x="80" y="24" fontSize="13" fontWeight="900">z</text></>}
      {kind === 'double' && <>{ring('#fdfd94')}<image href={`${ART}/soccer.webp`} x="14" y="26" width="42" height="42" /><image href={`${ART}/soccer.webp`} x="44" y="34" width="42" height="42" /></>}
      {kind === 'rainbow' && <>{ring('#fbfcf8')}{['#ef7d96', '#f5a08c', '#fdfd94', '#8fe3a0', '#7fd6e3', '#b4c4fb'].map((cl, i) => <path key={cl} d={`M${16 + i * 4} 70 A ${34 - i * 4} ${34 - i * 4} 0 0 1 ${84 - i * 4} 70`} stroke={cl} strokeWidth="4.5" fill="none" />)}<image href={`${ART}/soccer.webp`} x="36" y="52" width="28" height="28" /></>}
      {kind === 'tiny' && <>{ring('#e9eefe')}<image href={`${ART}/potion.webp`} x="16" y="14" width="56" height="56" /><circle cx="72" cy="72" r="9" fill="#ef7d96" stroke="#000" strokeWidth="3" /><circle cx="72" cy="62" r="5" fill="#f1c7a0" stroke="#000" strokeWidth="2.5" /></>}
      {kind === 'butter' && <>{ring('#fdfd94')}<rect x="22" y="40" width="44" height="26" rx="4" fill="#fff2a8" stroke="#000" strokeWidth="4" /><path d="M22 48 h44" stroke="#000" strokeWidth="3" /><image href={`${ART}/soccer.webp`} x="54" y="22" width="30" height="30" /><path d="M30 74 q4 8 0 12 M46 72 q4 8 0 12" stroke="#7fd6e3" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
      {kind === 'windy' && <>{ring('#b4c4fb')}<image href={`${ART}/wind.webp`} x="14" y="14" width="72" height="72" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice">
      <rect width="100" height="12" fill="#9fd3ff" />
      {[10, 15].map((y, i) => <rect key={y} y={y} width="100" height="5" fill={['#6b74c9', '#4d56ad'][i]} />)}
      {Array.from({ length: 40 }, (_, i) => <circle key={i} cx={2 + (i % 20) * 5} cy={11 + Math.floor(i / 20) * 5} r="1.4" fill={['#f6c544', '#5cc3a0', '#ef7d96', '#f1c7a0'][i % 4]} stroke="#000" strokeWidth="0.25" />)}
      <rect y="20" width="100" height="42" fill="#56a447" />
      <rect x="22" y="22" width="56" height="20" fill="#2f6b4f" opacity="0.4" />
      {Array.from({ length: 14 }, (_, i) => <path key={i} d={`M${24 + i * 4} 22 V42`} stroke="#fff" strokeWidth="0.25" />)}
      {Array.from({ length: 5 }, (_, i) => <path key={`h${i}`} d={`M22 ${24 + i * 4} H78`} stroke="#fff" strokeWidth="0.25" />)}
      <path d="M22 42 V22 H78 V42" stroke="#000" strokeWidth="2.2" fill="none" /><path d="M22 42 V22 H78 V42" stroke="#fff" strokeWidth="1.4" fill="none" />
      <g transform="translate(36 40) rotate(-60) scale(1.3)"><rect x="-2.8" y="-9.4" width="5.6" height="5" rx="1.6" fill="#ef7d96" stroke="#000" strokeWidth="0.45" /><circle cy="-11.8" r="2.6" fill="#f1c7a0" stroke="#000" strokeWidth="0.45" /><circle cx="5" cy="-10" r="1.5" fill="#fdfd94" stroke="#000" strokeWidth="0.4" /></g>
      <image href={`${ART}/soccer.webp`} x="64" y="25" width="8" height="8" />
      <path d="M50 58 Q78 46 68 30" stroke="#fff" strokeWidth="0.6" strokeDasharray="1.3 1" fill="none" />
    </svg>
  );
}

const def: LabDef = {
  id: 'goal-kick',
  name: 'Goal Kick',
  description: 'Answer right to take a penalty kick. Pick a spot in the goal and beat the goalie.',
  ways: ['teams', 'solo'],
  minTeams: 1,
  maxTeams: 6,
  how: [
    { icon: <CheckCircle weight="fill" />, text: 'Answer right to get a kick' },
    { icon: <HandTap weight="fill" />, text: 'Tap a spot in the goal' },
    { icon: <SoccerBall weight="fill" />, text: 'Top corners score more' },
    { icon: <Trophy weight="fill" />, text: 'Most points wins' },
  ],
  rounds: { label: 'Kicks', min: 3, max: 15, default: 5 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #c8e6ff 0%, #8ec8f5 55%, #5f9fd8 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the stadium' },
    { id: 'stadium', label: 'Stadium', hint: 'The sky, the stands and the boards' },
    { id: 'pitch', label: 'Pitch', hint: 'The striped grass with its lines' },
    { id: 'goal', label: 'Goal', hint: 'The posts, crossbar and net' },
    { id: 'goalie', label: 'Goalie', hint: 'The keeper with big gloves' },
    { id: 'kicker', label: 'Kicker', hint: 'The player taking the kick (wears the team color)' },
    { id: 'ball', label: 'Ball', hint: 'The soccer ball, round' },
    { id: 'flag', label: 'Team flag', hint: 'The flag that climbs with a team\'s points' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
