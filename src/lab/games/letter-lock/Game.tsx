import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Backspace, KeyReturn, LockKey, Palette, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TurnCard } from '../../../engine/ShareQuestion';
import { TEAM_COLORS } from '../../../engine/turns';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { STARTER_WORDS, type WordPair } from '../../words';
import { crackPoints, fits, grade, keyMarks, type Mark } from './lock';

// Letter Lock (Game Lab, a five-letter guessing game in the classic
// color-hint style): a vault door holds six rows of tiles. Type a word and
// the tiles flip one by one: green is the right letter in the right spot,
// yellow is in the word somewhere else, gray is not in it. Crack the word to
// swing the vault open. Teams take turns guessing on the same vault; the
// team that cracks it scores more for fewer tries.

const A = '/lab/letter-lock';
const img = (f: string) => <img src={`${A}/${f}.webp`} alt="" className="w-full h-full object-contain" draggable={false} />;

const POWERS: LabPower[] = [
  { id: 'peek', name: 'Clue Peek', desc: 'The envelope opens and shows the clue for the word.', enter: 'zoom', art: <Art kind="peek" /> },
  { id: 'green', name: 'Free Green Letter', desc: 'One right letter stamps itself into your next row.', enter: 'drop', art: <Art kind="green" /> },
  { id: 'row', name: 'Extra Row', desc: 'A new row of tiles slides into the vault: one more try.', enter: 'drop', art: <Art kind="row" /> },
  { id: 'remove', name: 'Remove 3 Keys', desc: 'Three letters that are not in the word go puff.', enter: 'spin', art: <Art kind="remove" /> },
  { id: 'double', name: 'Double Points', desc: 'Crack the word on this turn for double points.', enter: 'spin', art: img('lightning') },
  { id: 'key', name: 'Gold Key', desc: 'A gold key turns and drops two bonus points.', enter: 'spin', art: img('key') },
  { id: 'jumble', name: 'Jumbled Keyboard', desc: 'Whoops! The keys hop out of order for the next guess.', silly: true, art: <Art kind="jumble" /> },
];

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const FILL: Record<Mark, string> = { g: '#5cc3a0', y: '#f6c544', x: '#9aa0bd' };
const asQuestion = (w: WordPair): MultipleChoiceQuestion => ({ id: `ll-${w.word}`, kind: 'mc', prompt: w.clue, choices: [w.word], correctIndex: 0 });
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
type Mode = 'turn' | 'play' | 'busy' | 'flip';
interface Row { word: string; marks: Mark[]; by: string }

function useAspect() {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.5);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAspect(e.contentRect.width / Math.max(1, e.contentRect.height)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  return [ref, aspect] as const;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const clip = (f: string, level = 0.7) => playClip(`${A}/${f}.mp3`, c.current.settings, level);
  const [box, aspect] = useAspect();
  // Tall screens stack everything; middle ones put the keys under the vault
  // and the clue; wide short ones put the keys beside the vault.
  const layout = aspect < 1 ? 'tall' : aspect < 1.6 ? 'mid' : 'wide';
  const wide = layout !== 'tall';
  const ar = layout === 'wide' ? Math.min(2, aspect) : layout === 'mid' ? 1.3 : 0.68;
  const queue = useRef<WordPair[]>([]);
  const take = () => { if (!queue.current.length) queue.current = c.current.words({ length: 5 }); return queue.current.shift()!; };
  const [pair, setPair] = useState<WordPair>(() => take());
  const pairRef = useRef(pair); pairRef.current = pair;
  const [gen, setGen] = useState(0);
  const [rows, setRowsState] = useState<Row[]>([]);
  const rowsRef = useRef(rows);
  const setRows = (r: Row[]) => { rowsRef.current = r; setRowsState(r); };
  const [max, setMax] = useState(6);
  const maxRef = useRef(max); maxRef.current = max;
  const [input, setInputState] = useState('');
  const inputRef = useRef('');
  const setInput = (s: string) => { inputRef.current = s; setInputState(s); };
  const [given, setGivenState] = useState<Record<number, string>>({});
  const givenRef = useRef(given);
  const setGiven = (g: Record<number, string>) => { givenRef.current = g; setGivenState(g); };
  const [gone, setGone] = useState<Set<string>>(new Set());
  const goneRef = useRef(gone); goneRef.current = gone;
  const [order, setOrder] = useState<string[] | null>(null);
  const [mode, setModeState] = useState<Mode>('busy');
  const modeRef = useRef(mode);
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const [shake, setShake] = useState(0);
  const [open, setOpen] = useState(false);
  const [clue, setClue] = useState(false);
  const [double, setDoubleState] = useState(false);
  const doubleRef = useRef(false);
  const setDouble = (v: boolean) => { doubleRef.current = v; setDoubleState(v); };
  const [keyFx, setKeyFx] = useState(0);
  const [pressed, setPressed] = useState<{ l: string; id: number } | null>(null);
  const pending = useRef<Record<string, LabPower[]>>({});
  const jumbleNext = useRef(false);
  const fresh = useRef(true);
  const color = (id: string) => TEAM_COLORS[(ctx.turns.players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];

  function newVault() {
    const w = fresh.current ? pairRef.current : take();
    fresh.current = false;
    pairRef.current = w; setPair(w); setGen((g) => g + 1);
    setRows([]); setMax(6); setInput(''); setGiven({}); setGone(new Set()); setOpen(false); setClue(false);
  }

  // Every turn: a guess (teams), or a whole vault (solo).
  useEffect(() => {
    const x = c.current;
    if (x.solo || fresh.current || open) newVault();
    setDouble(false); setInput('');
    setOrder(jumbleNext.current ? jumbled() : null); jumbleNext.current = false;
    if (x.solo) {
      setMode('play');
      const list = pending.current[x.player.id] ?? []; pending.current[x.player.id] = [];
      void (async () => { for (const p of list) { await wait(900); fire(p); } })();
    } else setMode('turn');
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function begin() {
    const x = c.current, list = pending.current[x.player.id] ?? [];
    pending.current[x.player.id] = []; x.setHeld(x.player.id, []);
    setMode('play');
    for (const p of list) { fire(p); await wait(1500); }
  }

  const jumbled = () => [...ROWS.join('')].sort(() => Math.random() - 0.5);

  function fire(p: LabPower) {
    const x = c.current, w = pairRef.current.word;
    if (!p.silly) x.say(`${p.name} is on!`);
    if (p.id === 'peek') { setClue(true); x.sfx.slideUp(); }
    if (p.id === 'double') { setDouble(true); x.sfx.coin(); }
    if (p.id === 'key') { setKeyFx((n) => n + 1); x.sfx.chest(); window.setTimeout(() => { c.current.points(2); c.current.sfx.coin(); }, 900); }
    if (p.id === 'row') { setMax((m) => Math.min(8, m + 1)); x.sfx.slideDown(); }
    if (p.id === 'green') {
      const known = new Set(rowsRef.current.flatMap((r) => r.marks.map((m, i) => (m === 'g' ? i : -1))).filter((i) => i >= 0));
      const spots = [0, 1, 2, 3, 4].filter((i) => !known.has(i) && givenRef.current[i] === undefined);
      const pick = (spots.length ? spots : [0, 1, 2, 3, 4])[Math.floor(Math.random() * (spots.length || 5))];
      setGiven({ ...givenRef.current, [pick]: w[pick] }); setInput(''); x.sfx.thud();
    }
    if (p.id === 'remove') {
      const marks = keyMarks(rowsRef.current);
      const out = [...ROWS.join('')].filter((l) => !w.includes(l) && !marks[l] && !goneRef.current.has(l)).sort(() => Math.random() - 0.5).slice(0, 3);
      out.forEach((l, i) => window.setTimeout(() => { setGone((g) => new Set([...g, l])); clip('puff'); }, 300 + i * 350));
    }
    if (p.id === 'jumble') { x.sfx.boing(); x.say('Jumbled Keyboard!', 'oops'); if (x.solo) setOrder(jumbled()); else jumbleNext.current = true; }
  }

  // Typing a guess. Free green letters stay put.
  const freeSpots = () => [0, 1, 2, 3, 4].filter((i) => givenRef.current[i] === undefined);
  function type(l: string) {
    if (modeRef.current !== 'play' || goneRef.current.has(l)) return;
    if (inputRef.current.length >= freeSpots().length) return;
    setInput(inputRef.current + l); setPressed({ l, id: Date.now() }); clip('key', 0.5);
  }
  function back() { if (modeRef.current === 'play' && inputRef.current) { setInput(inputRef.current.slice(0, -1)); c.current.sfx.tick(); } }
  const guessWord = () => { const g = { ...givenRef.current }, spots = freeSpots(); let s = ''; for (let i = 0; i < 5; i++) s += g[i] ?? inputRef.current[spots.indexOf(i)] ?? ''; return s; };

  async function submit() {
    if (modeRef.current !== 'play') return;
    const x = c.current, guess = guessWord();
    if (guess.length < 5) { setShake((n) => n + 1); x.sfx.boing(); x.say('Five letters!', 'oops'); return; }
    const w = pairRef.current, marks = grade(guess, w.word);
    const before = new Set(rowsRef.current.flatMap((r) => r.marks.map((m, i) => (m === 'g' ? i : -1))));
    const r = [...rowsRef.current, { word: guess, marks, by: x.player.id }];
    setRows(r); setInput(''); setGiven({}); setOrder(null); setMode('flip');
    marks.forEach((m, i) => window.setTimeout(() => { clip('flip', 0.6); if (m === 'g') x.sfx.note(i + 3); }, (ctx.still ? 0 : 300) + i * 300));
    await wait(ctx.still ? 400 : 2000);
    const cracked = marks.every((m) => m === 'g');
    if (cracked) {
      const pts = crackPoints(r.length) * (doubleRef.current ? 2 : 1);
      if (doubleRef.current) setDouble(false);
      x.points(pts); clip('unlock'); x.sfx.cheer(); x.say(`Cracked! +${pts}`, 'big'); x.burst(0.35, 0.4, 'big');
      setOpen(true); setClue(true); x.log(asQuestion(w), true);
      await wait(2600);
      await afterGuess(true);
      return;
    }
    if (r.length >= maxRef.current) {
      x.sfx.oops(); x.say(`It was ${w.word}`, 'oops'); setOpen(true); setClue(true);
      if (!x.cpu) x.log(asQuestion(w), false);
      await wait(3000);
      c.current.next();
      return;
    }
    const newGreen = marks.some((m, i) => m === 'g' && !before.has(i));
    if (newGreen) x.sfx.coin();
    await afterGuess(newGreen);
  }

  // A good guess (a new green letter or a crack) may earn a power-up.
  async function afterGuess(good: boolean) {
    const x = c.current;
    if (good) {
      const pw = await c.current.power(0.4, (p) => !openRef.current || p.id === 'key' || p.id === 'double' || !!p.silly);
      if (pw) {
        if (pw.silly) { fire(pw); await wait(1500); }
        else if (x.solo && !openRef.current) fire(pw);
        else { const id = x.player.id; pending.current[id] = [...(pending.current[id] ?? []), pw]; x.setHeld(id, pending.current[id]); }
      }
    }
    if (x.solo && !openRef.current) { setMode('play'); return; }
    c.current.next();
  }
  const openRef = useRef(open); openRef.current = open;

  // The physical keyboard.
  useEffect(() => {
    if (mode !== 'play' || ctx.cpu) return;
    const on = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (/^[a-z]$/i.test(ev.key)) { ev.preventDefault(); type(ev.key.toUpperCase()); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); back(); }
      else if (ev.key === 'Enter' && !document.querySelector('[role="dialog"]')) { ev.preventDefault(); void submit(); }
    };
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on);
  }, [mode, ctx.cpu]); // eslint-disable-line react-hooks/exhaustive-deps

  // The computer types its own guess.
  const pool = useMemo(() => [...new Set([...ctx.words({ length: 5 }).map((w) => w.word), ...STARTER_WORDS.filter((w) => w.word.length === 5).map((w) => w.word)])], []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ctx.cpu || mode !== 'play') return;
    let live = true;
    void (async () => {
      await wait(1400);
      const sharp = c.current.cpuRight();
      const ok = pool.filter((w) => fits(w, rowsRef.current) && Object.entries(givenRef.current).every(([i, l]) => w[+i] === l));
      const list = sharp && ok.length ? ok : pool.filter((w) => !goneRef.current.has(w[0]));
      let word = list[Math.floor(Math.random() * list.length)] ?? pairRef.current.word;
      if (sharp && !ok.length) word = pairRef.current.word;
      for (const i of freeSpots()) { if (!live) return; type(word[i]); await wait(380); }
      await wait(500);
      if (live) void submit();
    })();
    return () => { live = false; };
  }, [ctx.cpu, mode, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  const marks = keyMarks(rows);
  const current = (() => { const g = given, spots = [0, 1, 2, 3, 4].filter((i) => g[i] === undefined); return [0, 1, 2, 3, 4].map((i) => g[i] ?? input[spots.indexOf(i)] ?? ''); })();
  const canPlay = mode === 'play' && !ctx.cpu;
  const full = current.every(Boolean);
  const keys = order ?? [...ROWS.join('')];
  const keyRows = [keys.slice(0, 10), keys.slice(10, 19), keys.slice(19)];
  const keyboard = (
            <div className="relative shrink-0 grid gap-[3%] rounded-[1.4rem] border-heavy border-border px-[2%] py-[2.4%]" role="group" aria-label="Letter keys"
              style={{ height: layout === 'wide' ? '58%' : layout === 'mid' ? '33%' : '68%', background: '#241c3d', boxShadow: '0 6px 0 #000', containerType: 'size', gridTemplateRows: 'repeat(4, 1fr)' }}>
              {keyRows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-[1%] min-h-0">
                  {row.map((l, li) => {
                    const mk = marks[l], out = gone.has(l);
                    return (
                      <motion.button key={l} layout={!ctx.still} type="button" onClick={() => canPlay && type(l)} disabled={!canPlay || out} aria-label={`${l}${mk === 'g' ? ', right spot' : mk === 'y' ? ', in the word' : mk === 'x' || out ? ', not in the word' : ''}`}
                        className="h-full rounded-[0.6rem] border-std border-border font-heading font-bold grid place-items-center disabled:cursor-default"
                        style={{ width: '9%', fontSize: 'max(0.95rem, min(13cqh, 5.4cqw))', color: '#241c3d', background: out ? '#5b5675' : mk ? FILL[mk] : '#fbfcf8', opacity: out ? 0.35 : 1, boxShadow: '0 4px 0 #000' }}
                        animate={pressed?.l === l && !ctx.still ? { y: [0, 4, 0], scale: [1, 0.9, 1] } : out && !ctx.still ? { scale: [1, 1.3, 0.85], rotate: [0, 12, 0] } : { y: 0 }}
                        transition={{ layout: { type: 'spring', stiffness: 300, damping: 18, delay: li * 0.02 }, default: { duration: 0.25 } }}
                        whileHover={canPlay && !out && !ctx.still ? { scale: 1.08, y: -2 } : undefined} whileTap={{ scale: 0.9, y: 3 }}>
                        {l}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-center gap-[2%] min-h-0">
                <motion.button type="button" onClick={() => canPlay && back()} disabled={!canPlay} aria-label="Delete a letter"
                  className="h-full rounded-[0.6rem] border-std border-border grid place-items-center disabled:cursor-default" style={{ width: '26%', fontSize: 'max(0.95rem, min(13cqh, 5.4cqw))', background: '#f5a08c', boxShadow: '0 4px 0 #000' }}
                  whileHover={canPlay && !ctx.still ? { scale: 1.05 } : undefined} whileTap={{ scale: 0.92, y: 3 }}>
                  <Backspace weight="bold" style={{ width: '1.4em', height: '1.4em' }} />
                </motion.button>
                <motion.button type="button" onClick={() => void submit()} disabled={!canPlay} aria-label="Try this word"
                  className="h-full rounded-[0.6rem] border-std border-border inline-flex items-center justify-center gap-[0.3em] whitespace-nowrap font-display disabled:cursor-default" style={{ width: '44%', fontSize: 'max(0.95rem, min(12cqh, 5cqw))', background: full ? '#8fe3a0' : '#fdfd94', boxShadow: '0 4px 0 #000' }}
                  animate={full && canPlay && !ctx.still ? { scale: [1, 1.05, 1] } : { scale: 1 }} transition={{ duration: 0.9, repeat: full ? Infinity : 0 }}
                  whileHover={canPlay && !ctx.still ? { scale: 1.06 } : undefined} whileTap={{ scale: 0.92, y: 3 }}>
                  <KeyReturn weight="bold" style={{ width: '1.2em', height: '1.2em' }} aria-hidden="true" />Try it
                </motion.button>
              </div>
            </div>
  );
  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <div className="lab-fit relative" style={{ '--ar': ar, containerType: 'size' } as CSSProperties}>
        <div className="absolute inset-0 flex flex-col gap-[2%]">
          <div className={`flex-1 min-h-0 min-w-0 flex ${wide ? 'flex-row' : 'flex-col'} gap-[2%]`}>
          {/* The vault door with the tile rows. */}
          <motion.div className="relative min-w-0 min-h-0" style={layout === 'wide' ? { width: `${80 / ar}%` } : layout === 'mid' ? { width: '44%' } : { height: '62%' }} key={`shake-${shake}`}
            animate={shake && !ctx.still ? { x: [0, -10, 10, -6, 6, 0] } : undefined} transition={{ duration: 0.4 }}>
            <Vault open={open} still={ctx.still} gen={gen} />
            <div className="absolute inset-[11%_12%_6%_12%]" style={{ containerType: 'size' }}>
              <div className="absolute inset-0 grid place-items-center" style={{ perspective: 900 }}>
                <div className="relative grid gap-[1.6%]" role="grid" aria-label="Guesses" style={{ width: `min(100cqw, 100cqh * ${5 / max})`, height: `min(100cqh, 100cqw * ${max / 5})`, gridTemplateRows: `repeat(${max}, 1fr)` }}>
                  {Array.from({ length: max }, (_, ri) => {
                    const row = rows[ri], isCur = ri === rows.length && !open;
                    const won = row && row.marks.every((m) => m === 'g');
                    return (
                      <motion.div key={`${gen}-${ri}`} role="row" className="grid grid-cols-5 gap-[2.4%] min-h-0" initial={ctx.still || ri < 6 ? false : { y: -40, opacity: 0, scaleY: 0.4 }} animate={{ y: 0, opacity: 1, scaleY: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                        {[0, 1, 2, 3, 4].map((i) => {
                          const l = row ? row.word[i] : isCur ? current[i] : '';
                          const m = row?.marks[i];
                          const isGiven = isCur && given[i] !== undefined;
                          return (
                            <Tile key={i} l={l} mark={m} i={i} given={isGiven} won={!!won} still={ctx.still} cur={isCur && mode === 'play'} by={row ? color(row.by) : undefined} solo={ctx.solo} max={max} />
                          );
                        })}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </div>
            <AnimatePresence>
              {keyFx > 0 && !ctx.still && (
                <motion.div key={keyFx} className="absolute left-1/2 top-1/2 w-[30%] aspect-square pointer-events-none" style={{ x: '-50%', y: '-50%' }}
                  initial={{ scale: 0, rotate: -90 }} animate={{ scale: [0, 1.2, 1, 0], rotate: [-90, 0, 90, 90] }} transition={{ duration: 1.5, times: [0, 0.3, 0.7, 1] }}>{img('key')}</motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* The clue envelope and the keyboard. */}
          <div className="relative flex-1 min-w-0 min-h-0 flex flex-col gap-[3%]">
            <ClueCard pair={pair} shown={clue} open={open} still={ctx.still} wide={wide} double={double} />
            {layout !== 'mid' && keyboard}
          </div>
          </div>
          {layout === 'mid' && keyboard}
        </div>
      </div>
      {mode === 'turn' && !ctx.solo && <TurnCard key={ctx.taken} player={ctx.player} onStart={() => void begin()} />}
    </div>
  );
}

// One tile: flips over to show its color, one after another.
function Tile({ l, mark, i, given, won, still, cur, by, solo, max }: { l: string; mark?: Mark; i: number; given: boolean; won: boolean; still: boolean; cur: boolean; by?: string; solo: boolean; max: number }) {
  const face = 'absolute inset-0 rounded-[18%] border-border grid place-items-center font-heading font-bold';
  const fs = `calc(min(100cqw / 5, 100cqh / ${max}) * 0.5)`;
  return (
    <div className="relative min-h-0" style={{ transformStyle: 'preserve-3d' }} role="gridcell" aria-label={l ? `${l}${mark === 'g' ? ' green' : mark === 'y' ? ' yellow' : mark === 'x' ? ' gray' : ''}` : 'empty'}>
      <motion.div className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}
        initial={false} animate={{ rotateX: mark ? 180 : 0, y: won && !still ? [0, 0, -18, 0] : 0, scale: l && !mark && !still ? [1.12, 1] : 1 }}
        transition={{ rotateX: { duration: still ? 0 : 0.5, delay: still ? 0 : 0.3 + i * 0.3, ease: 'easeInOut' }, y: { duration: 0.5, delay: 2 + i * 0.1 }, scale: { duration: 0.15 } }}>
        <div className={face} style={{ borderWidth: 'max(2px, 0.6cqmin)', backfaceVisibility: 'hidden', fontSize: fs, background: given ? FILL.g : l ? '#ffffff' : 'rgba(251,252,248,0.85)', boxShadow: cur ? '0 0 0 3px #fdfd94, 0 4px 0 #000' : '0 4px 0 #000', color: '#241c3d' }}>
          {l}
          {given && !still && <motion.span className="absolute inset-0 rounded-[18%]" initial={{ scale: 2.4, opacity: 0.9 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.5 }} style={{ border: '4px solid #fff' }} />}
        </div>
        <div className={face} style={{ borderWidth: 'max(2px, 0.6cqmin)', backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', fontSize: fs, background: mark ? FILL[mark] : '#fff', boxShadow: '0 4px 0 #000', color: '#241c3d' }}>
          {l}
          {/* Who guessed it (teams): a small dot in their color. */}
          {by && !solo && i === 0 && <span className="absolute -left-[12%] top-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full border-2 border-border" style={{ background: by }} aria-hidden="true" />}
        </div>
      </motion.div>
    </div>
  );
}

// The clue, sealed in an envelope until it is peeked or the vault opens.
function ClueCard({ pair, shown, open, still, wide, double }: { pair: WordPair; shown: boolean; open: boolean; still: boolean; wide: boolean; double: boolean }) {
  const U = wide ? 'cqh' : 'cqw';
  return (
    <div className="relative flex-1 min-h-0 rounded-[1.4rem] border-heavy border-border bg-surface px-[5%] py-[3%] grid content-center justify-items-center text-center" style={{ boxShadow: '0 6px 0 #000, 0 18px 30px rgba(36,28,61,0.25)' }} aria-live="polite">
      <AnimatePresence mode="wait">
        {shown ? (
          <motion.div key={`clue-${pair.word}`} className="grid gap-[0.4em] justify-items-center" initial={still ? false : { rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
            {open && <span className="font-display leading-none rounded-full border-std border-border px-[0.5em] py-[0.1em]" style={{ fontSize: `max(1.1rem, ${wide ? 5 : 5.5}${U})`, background: '#8fe3a0' }}>{pair.word}</span>}
            <span className="font-bold leading-snug text-balance" style={{ fontSize: `max(0.95rem, ${(wide ? 3.6 : 3.8) * (pair.clue.length > 60 ? 0.78 : 1)}${U})` }}>{pair.clue}</span>
          </motion.div>
        ) : (
          <motion.div key="sealed" className="grid justify-items-center gap-[0.3em]" initial={still ? false : { scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.2, opacity: 0, rotate: 8 }}>
            <motion.span className="inline-flex" style={{ width: `${wide ? 13 : 9}${U}`, height: `${wide ? 9 : 6.3}${U}` }} animate={still ? undefined : { rotate: [0, -3, 3, 0] }} transition={{ duration: 2.4, repeat: Infinity }}><Art kind="envelope" /></motion.span>
            <span className="font-bold text-muted" style={{ fontSize: `max(0.95rem, ${wide ? 3.4 : 3.6}${U})` }}>Crack the code: five letters</span>
          </motion.div>
        )}
      </AnimatePresence>
      {double && <motion.span className="absolute top-2 right-2 h-11 min-w-11 rounded-full border-heavy border-border bg-accent grid place-items-center font-display text-xl" initial={still ? false : { scale: 0 }} animate={{ scale: still ? 1 : [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>x2</motion.span>}
    </div>
  );
}

// The Classic vault door: navy steel, bolts all round and a dial that spins
// open when the word is cracked, with gold glowing behind.
function Vault({ open, still, gen }: { open: boolean; still: boolean; gen: number }) {
  return (
    <div className="absolute inset-0 rounded-[1.6rem] overflow-hidden" aria-hidden="true" style={{ perspective: 1600 }}>
      <div className="absolute inset-[1%] rounded-[1.6rem] border-heavy border-border" style={{ background: 'radial-gradient(circle at 50% 50%, #fff6b0, #f6c544 55%, #c9901c)', boxShadow: 'inset 0 0 40px rgba(0,0,0,0.45)' }}>
        {[[20, 30], [70, 24], [40, 70], [78, 72], [24, 82], [56, 46]].map(([x, y], i) => <span key={i} className="absolute w-[11%] aspect-square rounded-full border-std border-border" style={{ left: `${x}%`, top: `${y}%`, background: '#f6c544', boxShadow: 'inset -3px -3px 0 #c9901c' }} />)}
      </div>
      <motion.div key={gen} className="absolute inset-0 rounded-[1.6rem] border-heavy border-border" style={{ transformOrigin: 'left center', background: 'linear-gradient(160deg, #3a3160 0%, #241c3d 60%, #1a1430 100%)', boxShadow: '0 8px 0 #000, 0 24px 40px rgba(36,28,61,0.45)' }}
        initial={false} animate={open && !still ? { rotateY: -64, opacity: 0.94 } : { rotateY: 0, opacity: 1 }} transition={{ duration: 1.1, delay: open ? 0.4 : 0, ease: [0.3, 1.3, 0.5, 1] }}>
        <div className="absolute inset-[3%] rounded-[1.2rem] border-[3px]" style={{ borderColor: '#5b5180' }} />
        {Array.from({ length: 10 }, (_, i) => {
          const side = i < 5, k = i % 5;
          return <span key={i} className="absolute w-[3.2%] aspect-square rounded-full border-2 border-border" style={{ left: side ? '4.2%' : '92.6%', top: `${12 + k * 18}%`, background: '#b4c4fb' }} />;
        })}
        <motion.span className="absolute left-1/2 top-[1.8%] aspect-square rounded-full border-std border-border grid place-items-center" style={{ x: '-50%', height: '7.5%', background: '#b4c4fb' }}
          animate={open && !still ? { rotate: 540 } : { rotate: 0 }} transition={{ duration: 0.9 }}>
          <span className="w-[24%] h-[60%] rounded-full bg-ink-night" />
        </motion.span>
      </motion.div>
    </div>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  const tile = (x: number, y: number, f: string, l: string, s = 26) => <g transform={`translate(${x} ${y})`}><rect width={s} height={s} rx="5" fill={f} stroke="#000" strokeWidth="3.5" /><text x={s / 2} y={s * 0.72} textAnchor="middle" fontSize={s * 0.62} fontWeight="800" fontFamily="Inclusive Sans, sans-serif">{l}</text></g>;
  if (kind === 'envelope') return (
    <svg viewBox="0 0 120 84" className="w-full h-full">
      <rect x="4" y="4" width="112" height="76" rx="8" fill="#fbfcf8" stroke="#000" strokeWidth="4" />
      <path d="M6 8l54 38 54-38" fill="#f5a08c" stroke="#000" strokeWidth="4" strokeLinejoin="round" />
      <circle cx="60" cy="46" r="12" fill="#ef7d96" stroke="#000" strokeWidth="3.5" /><path d="M55 46h10M60 41v10" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      {kind === 'peek' && <>{ring('#b4c4fb')}<rect x="20" y="32" width="60" height="42" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><path d="M20 34l30 18 30-18" fill="#f5a08c" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><circle cx="70" cy="30" r="12" fill="#fdfd94" stroke="#000" strokeWidth="4" /><circle cx="70" cy="30" r="5" /></>}
      {kind === 'green' && <>{ring('#e9eefe')}{tile(37, 30, '#5cc3a0', 'A', 30)}<path d="M28 74h44" stroke="#000" strokeWidth="5" strokeLinecap="round" /><path d="M40 22l4-8M60 22l-4-8M50 20v-9" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'row' && <>{ring('#fdfd94')}{[0, 1, 2].map((k) => <rect key={k} x={18 + k * 22} y="24" width="18" height="18" rx="4" fill="#5cc3a0" stroke="#000" strokeWidth="3.5" />)}{[0, 1, 2].map((k) => <rect key={k} x={18 + k * 22} y="52" width="18" height="18" rx="4" fill="#fff" stroke="#000" strokeWidth="3.5" strokeDasharray="5 3" />)}<path d="M76 58v16M68 66h16" stroke="#000" strokeWidth="5" strokeLinecap="round" /></>}
      {kind === 'remove' && <>{ring('#f5a08c')}{tile(16, 36, '#9aa0bd', 'Q')}{tile(40, 30, '#9aa0bd', 'X')}{tile(62, 38, '#9aa0bd', 'Z')}{[[22, 72], [50, 78], [76, 72], [30, 24], [70, 22]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#fbfcf8" stroke="#000" strokeWidth="2.5" />)}</>}
      {kind === 'jumble' && <>{ring('#8fe3a0')}<g transform="rotate(-16 32 40)">{tile(18, 26, '#fbfcf8', 'B')}</g><g transform="rotate(14 66 36)">{tile(54, 22, '#fbfcf8', 'A')}</g><g transform="rotate(-6 50 68)">{tile(37, 54, '#fbfcf8', 'C')}</g><path d="M22 64q-8-14 4-24M80 56q6-14-6-22" stroke="#000" strokeWidth="3.5" fill="none" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  const rows: [string, Mark[]][] = [['TRAIN', ['x', 'y', 'x', 'x', 'x']], ['HORSE', ['x', 'x', 'g', 'x', 'x']], ['BREAD', ['x', 'g', 'x', 'x', 'x']]];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="24" y="3" width="52" height="56" rx="5" fill="#241c3d" stroke="#000" strokeWidth="0.9" />
      <rect x="26" y="5" width="48" height="52" rx="3.5" fill="none" stroke="#5b5180" strokeWidth="0.7" />
      <circle cx="50" cy="7" r="2.6" fill="#b4c4fb" stroke="#000" strokeWidth="0.5" />
      {[...rows, ['GRASS', ['g', 'g', 'g', 'g', 'g']] as [string, Mark[]]].map(([w, m], r) => [...w].map((l, i) => (
        <g key={`${r}${i}`} transform={`translate(${31.5 + i * 7.6} ${12 + r * 9.6})`}><rect width="6.8" height="6.8" rx="1.3" fill={FILL[m[i]]} stroke="#000" strokeWidth="0.5" /><text x="3.4" y="5.2" textAnchor="middle" fontSize="4.6" fontWeight="800" fontFamily="Inclusive Sans, sans-serif" fill="#241c3d">{l}</text></g>
      )))}
      {[0, 1, 2, 3, 4].map((i) => <rect key={i} x={31.5 + i * 7.6} y={50.4} width="6.8" height="6.8" rx="1.3" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" opacity="0.8" />)}
      <g transform="translate(84 44) rotate(-30)"><circle r="5" fill="#f6c544" stroke="#000" strokeWidth="0.7" /><circle r="2" fill="#241c3d" /><rect x="4" y="-1.4" width="12" height="2.8" rx="1" fill="#f6c544" stroke="#000" strokeWidth="0.7" /><rect x="12" y="1.2" width="2.4" height="3" fill="#f6c544" stroke="#000" strokeWidth="0.5" /></g>
    </svg>
  );
}

const def: LabDef = {
  id: 'letter-lock',
  name: 'Letter Lock',
  description: 'A five-letter word locks the vault. Guess words and use the colors to crack the code.',
  ways: ['solo', 'teams'],
  minTeams: 2,
  maxTeams: 6,
  uses: 'words',
  how: [
    { icon: <LockKey weight="fill" />, text: 'Type a five-letter word' },
    { icon: <Palette weight="fill" />, text: 'Green: right spot. Yellow: in the word. Gray: not in it' },
    { icon: <Trophy weight="fill" />, text: 'Crack it in fewer tries for more points' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 12, default: 4 },
  powers: POWERS,
  background: 'radial-gradient(circle at 2px 2px, rgba(36,28,61,0.10) 1.5px, transparent 0) 0 0 / 26px 26px, radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the vault' },
    { id: 'vault', label: 'Vault door', hint: 'The steel door that swings open' },
    { id: 'treasure', label: 'Treasure', hint: 'The gold behind the door' },
    { id: 'tile', label: 'Letter tile', hint: 'One tile in a row (green, yellow, gray and blank)' },
    { id: 'key', label: 'Letter key', hint: 'One key on the keyboard' },
    { id: 'envelope', label: 'Clue envelope', hint: 'The sealed clue' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
