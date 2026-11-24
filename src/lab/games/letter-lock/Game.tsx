import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion, useAnimate } from 'motion/react';
import { Backspace, KeyReturn, LockKey, Palette, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TurnCard } from '../../../engine/ShareQuestion';
import { TEAM_COLORS } from '../../../engine/turns';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { STARTER_WORDS, type WordPair } from '../../words';
import { crackPoints, fits, grade, keyMarks, type Mark } from './lock';

// Letter Lock (Game Lab): a word from the teacher's set (4 to 6 letters,
// the length the set has most of) locks a vault. Its clue sits on the
// envelope from the start. Type a word and the padlock tiles flip one by one:
// mint with a check is the right letter in the right spot, yellow with a sun
// is in the word somewhere else, soft gray with a dash is not in it. Each
// team has its own vault and its own word; cracking it in fewer tries
// scores more (never under 3).

const A = '/lab/letter-lock';
const img = (f: string) => <img src={`${A}/${f}.webp`} alt="" className="w-full h-full object-contain" draggable={false} />;

const POWERS: LabPower[] = [
  { id: 'sun', name: 'Lucky Sun', desc: 'A letter that is in your word lights up on the keys.', enter: 'zoom', art: <Art kind="sun" /> },
  { id: 'green', name: 'Free Letter', desc: 'One right letter stamps itself into your next row.', enter: 'drop', art: <Art kind="green" /> },
  { id: 'row', name: 'Extra Row', desc: 'A new row of tiles slides into the vault: one more try.', enter: 'drop', art: <Art kind="row" /> },
  { id: 'remove', name: 'Remove 3 Keys', desc: 'Three letters that are not in the word go puff.', enter: 'spin', art: <Art kind="remove" /> },
  { id: 'double', name: 'Double Points', desc: 'Crack the word on this turn for double points.', enter: 'spin', art: img('lightning') },
  { id: 'key', name: 'Gold Key', desc: 'A gold key turns and drops two bonus points.', enter: 'spin', art: img('key') },
  { id: 'jumble', name: 'Jumbled Keyboard', desc: 'Whoops! Your keys hop out of order for your next guess.', silly: true, art: <Art kind="jumble" /> },
];

const QWERTY = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
// ABC order is the default for young readers; the choice is remembered.
const ABC = ['ABCDEFGHIJ', 'KLMNOPQRS', 'TUVWXYZ'];
const ROWS = QWERTY;
const ORDER_KEY = 'gamify:lab:letter-lock:keys';
function loadOrder(): 'abc' | 'qwerty' { try { return localStorage.getItem(ORDER_KEY) === 'qwerty' ? 'qwerty' : 'abc'; } catch { return 'abc'; } }
// Its own look: mint for the right spot, pale yellow with a sun for in the
// word, soft gray with a dash for not in it (never color alone).
const FILL: Record<Mark, string> = { g: '#8fe3a0', y: '#fdfd94', x: '#d3d5e0' };
const MARK_WORD: Record<Mark, string> = { g: 'right spot', y: 'in the word', x: 'not in the word' };
const asQuestion = (w: WordPair): MultipleChoiceQuestion => ({ id: `ll-${w.word}`, kind: 'mc', prompt: w.clue, choices: [w.word], correctIndex: 0 });
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
type Mode = 'turn' | 'play' | 'busy' | 'flip';
interface Row { word: string; marks: Mark[]; by: string }
// One team's vault: its own word, rows and helpers.
interface VaultState { pair: WordPair; rows: Row[]; max: number; given: Record<number, string>; gone: Set<string>; lucky: string[]; open: boolean; gen: number }
const range = (n: number) => Array.from({ length: n }, (_, i) => i);

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
  // The word length the set has most of (4, 5 or 6), so the teacher's own
  // words are used instead of starter words.
  const L = useMemo(() => {
    const starters = new Set(STARTER_WORDS.map((w) => w.word));
    const n: Record<number, number> = { 4: 0, 5: 0, 6: 0 };
    for (const w of ctx.words({ min: 4, max: 6 })) if (!starters.has(w.word)) n[w.word.length]++;
    const best = [5, 4, 6].sort((a, b) => n[b] - n[a])[0];
    return n[best] > 0 ? best : 5;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const spots = range(L);
  const queue = useRef<WordPair[]>([]);
  const take = () => { if (!queue.current.length) queue.current = c.current.words({ length: L }); return queue.current.shift()!; };
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
  const [lucky, setLuckyState] = useState<string[]>([]);
  const luckyRef = useRef(lucky);
  const setLucky = (v: string[]) => { luckyRef.current = v; setLuckyState(v); };
  const [double, setDoubleState] = useState(false);
  const doubleRef = useRef(false);
  const setDouble = (v: boolean) => { doubleRef.current = v; setDoubleState(v); };
  const [keyFx, setKeyFx] = useState(0);
  const [pressed, setPressed] = useState<{ l: string; id: number } | null>(null);
  const pending = useRef<Record<string, LabPower[]>>({});
  const fresh = useRef(true);
  const [shakeRef, animateShake] = useAnimate();
  const [keyOrder, setKeyOrder] = useState(loadOrder);
  const flipOrder = () => { const n = keyOrder === 'abc' ? 'qwerty' : 'abc'; setKeyOrder(n); try { localStorage.setItem(ORDER_KEY, n); } catch { /* private window */ } };
  // Shake the vault (a stable wrapper, never remounted), only when allowed.
  useEffect(() => {
    if (!shake || !c.current.shake || !shakeRef.current) return;
    void animateShake(shakeRef.current, { x: [0, -10, 10, -6, 6, 0] }, { duration: 0.4 });
  }, [shake]); // eslint-disable-line react-hooks/exhaustive-deps
  const vaults = useRef<Record<string, VaultState>>({});
  const owner = useRef<string | null>(null);
  const genRef = useRef(0); genRef.current = gen;
  const color = (id: string) => TEAM_COLORS[(ctx.turns.players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length];

  function newVault() {
    const w = fresh.current ? pairRef.current : take();
    fresh.current = false;
    pairRef.current = w; setPair(w); setGen((g) => g + 1);
    setRows([]); setMax(6); setInput(''); setGiven({}); setGone(new Set()); setOpen(false); setLucky([]);
  }
  const snapshot = (): VaultState => ({ pair: pairRef.current, rows: rowsRef.current, max: maxRef.current, given: givenRef.current, gone: goneRef.current, lucky: luckyRef.current, open: openRef.current, gen: genRef.current });
  function restore(v: VaultState) {
    pairRef.current = v.pair; setPair(v.pair); setGen(v.gen);
    setRows(v.rows); setMax(v.max); setGiven(v.given); setGone(v.gone); setLucky(v.lucky); setOpen(v.open); setInput('');
  }

  // Every turn: a guess (teams), or a whole vault (solo).
  useEffect(() => {
    const x = c.current;
    // Park the last team's vault, bring out this team's own (or a new one).
    if (owner.current) vaults.current[owner.current] = snapshot();
    owner.current = x.player.id;
    const mine = vaults.current[x.player.id];
    if (mine && !mine.open && !fresh.current) restore(mine); else newVault();
    setDouble(false); setInput(''); setOrder(null);
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
    if (p.id === 'sun') {
      const marks = keyMarks(rowsRef.current);
      const l = [...new Set(w)].find((q) => !marks[q] && !luckyRef.current.includes(q)) ?? [...new Set(w)].find((q) => marks[q] !== 'g');
      if (l) setLucky([...luckyRef.current, l]);
      x.sfx.slideUp();
    }
    if (p.id === 'double') { setDouble(true); x.sfx.coin(); }
    if (p.id === 'key') { setKeyFx((n) => n + 1); x.sfx.chest(); window.setTimeout(() => { c.current.points(2); c.current.sfx.coin(); }, 900); }
    if (p.id === 'row') { setMax((m) => Math.min(8, m + 1)); x.sfx.slideDown(); }
    if (p.id === 'green') {
      const known = new Set(rowsRef.current.flatMap((r) => r.marks.map((m, i) => (m === 'g' ? i : -1))).filter((i) => i >= 0));
      const open = spots.filter((i) => !known.has(i) && givenRef.current[i] === undefined);
      const pick = (open.length ? open : spots)[Math.floor(Math.random() * (open.length || L))];
      setGiven({ ...givenRef.current, [pick]: w[pick] }); setInput(''); x.sfx.thud();
    }
    if (p.id === 'remove') {
      const marks = keyMarks(rowsRef.current);
      const out = [...ROWS.join('')].filter((l) => !w.includes(l) && !marks[l] && !goneRef.current.has(l)).sort(() => Math.random() - 0.5).slice(0, 3);
      out.forEach((l, i) => window.setTimeout(() => { setGone((g) => new Set([...g, l])); clip('puff'); }, 300 + i * 350));
    }
    // Only ever on the earner's own guess (it fires at the start of their turn).
    if (p.id === 'jumble') { x.sfx.boing(); x.say('Jumbled Keyboard!', 'oops'); setOrder(jumbled()); window.setTimeout(() => setOrder(null), 3000); }
  }

  // Typing a guess. Free green letters stay put.
  const freeSpots = () => spots.filter((i) => givenRef.current[i] === undefined);
  function type(l: string) {
    if (modeRef.current !== 'play' || goneRef.current.has(l)) return;
    if (inputRef.current.length >= freeSpots().length) return;
    setInput(inputRef.current + l); setPressed({ l, id: Date.now() }); clip('key', 0.5);
  }
  function back() { if (modeRef.current === 'play' && inputRef.current) { setInput(inputRef.current.slice(0, -1)); c.current.sfx.tick(); } }
  const guessWord = () => { const g = { ...givenRef.current }, spots = freeSpots(); let s = ''; for (let i = 0; i < L; i++) s += g[i] ?? inputRef.current[spots.indexOf(i)] ?? ''; return s; };

  async function submit() {
    if (modeRef.current !== 'play') return;
    const x = c.current, guess = guessWord();
    if (guess.length < L) { setShake((n) => n + 1); x.sfx.boing(); x.say(`${L} letters!`, 'oops'); return; }
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
      setOpen(true); if (!x.cpu) x.log(asQuestion(w), true);
      await wait(2600);
      await afterGuess(true);
      return;
    }
    if (r.length >= maxRef.current) {
      x.sfx.slideDown(); x.say(`It was ${w.word}`); setOpen(true);
      if (!x.cpu) x.log(asQuestion(w), false);
      await wait(3000);
      c.current.next();
      return;
    }
    const newGreen = marks.some((m, i) => m === 'g' && !before.has(i));
    // Effort pays: one point for every new letter in its right spot.
    const greens = marks.filter((m, i) => m === 'g' && !before.has(i)).length;
    if (newGreen) { x.sfx.coin(); x.points(greens); }
    await afterGuess(newGreen);
  }

  // A good guess (a new green letter or a crack) may earn a power-up.
  async function afterGuess(good: boolean) {
    const x = c.current;
    if (good) {
      const pw = await c.current.power(0.4, (p) => !openRef.current || p.id === 'key' || p.id === 'double' || !!p.silly);
      if (pw) {
        // Solo uses it on the next guess; teams keep it for their own next turn.
        if (x.solo && !openRef.current) fire(pw);
        else { const id = x.player.id; pending.current[id] = [...(pending.current[id] ?? []), pw]; x.setHeld(id, pending.current[id]); }
      }
    }
    if (x.solo && !openRef.current) { setMode('play'); return; }
    await revealIfLast();
    c.current.next();
  }
  // The very last turn of the game: an uncracked word is shown, never left a secret.
  async function revealIfLast() {
    const x = c.current;
    if (openRef.current || x.taken + 1 < x.rounds * x.turns.players.length) return;
    setOpen(true); x.say(`The word was ${pairRef.current.word}`); x.sfx.slideDown();
    await wait(2600);
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
  const pool = useMemo(() => [...new Set([...ctx.words({ length: L }).map((w) => w.word), ...STARTER_WORDS.filter((w) => w.word.length === L).map((w) => w.word)])], [L]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!ctx.cpu || mode !== 'play') return;
    let live = true;
    void (async () => {
      await wait(1400);
      const sharp = c.current.cpuRight();
      const ok = pool.filter((w) => fits(w, rowsRef.current) && Object.entries(givenRef.current).every(([i, l]) => w[+i] === l));
      const allowed = pool.filter((w) => ![...w].some((l) => goneRef.current.has(l)));
      const list = sharp && ok.length ? ok : allowed.length ? allowed : pool;
      let word = list[Math.floor(Math.random() * list.length)] ?? pairRef.current.word;
      if (sharp && !ok.length) word = pairRef.current.word;
      // Any removed letter is swapped for one still on the keys, so the guess always completes.
      const free = [...ROWS.join('')].filter((l) => !goneRef.current.has(l));
      for (const i of freeSpots()) { if (!live) return; const l = goneRef.current.has(word[i]) ? free[Math.floor(Math.random() * free.length)] : word[i]; type(l); await wait(380); }
      await wait(500);
      if (live) void submit();
    })();
    return () => { live = false; };
  }, [ctx.cpu, mode, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  const marks = keyMarks(rows);
  const current = (() => { const g = given, free = spots.filter((i) => g[i] === undefined); return spots.map((i) => g[i] ?? input[free.indexOf(i)] ?? ''); })();
  const canPlay = mode === 'play' && !ctx.cpu;
  const full = current.every(Boolean);
  const keys = order ?? [...(keyOrder === 'abc' ? ABC : QWERTY).join('')];
  const keyRows = [keys.slice(0, 10), keys.slice(10, 19), keys.slice(19)];
  const keyboard = (
            <div className="relative shrink-0 grid gap-[3%] rounded-[1.4rem] border-heavy border-border px-[2%] py-[2.4%]" role="group" aria-label="Letter keys"
              style={{ height: layout === 'wide' ? '58%' : layout === 'mid' ? '33%' : '68%', background: '#241c3d', boxShadow: '0 6px 0 #000', containerType: 'size', gridTemplateRows: 'repeat(4, 1fr)' }}>
              {keyRows.map((row, ri) => (
                <div key={ri} className="flex justify-center gap-[1%] min-h-0">
                  {row.map((l, li) => {
                    const mk = marks[l] ?? (lucky.includes(l) ? 'y' : undefined), out = gone.has(l);
                    return (
                      <motion.button key={l} layout={!ctx.still} type="button" onClick={() => canPlay && type(l)} disabled={!canPlay || out} aria-label={`${l}${mk ? `, ${MARK_WORD[mk]}` : out ? ', not in the word' : ''}`}
                        className="relative h-full rounded-[0.6rem] border-std border-border font-heading font-bold grid place-items-center disabled:cursor-default"
                        style={{ width: '9%', fontSize: 'max(0.95rem, min(13cqh, 5.4cqw))', color: '#241c3d', background: out ? '#5b5675' : mk ? FILL[mk] : '#fbfcf8', opacity: out ? 0.4 : 1, boxShadow: '0 4px 0 #000' }}
                        animate={pressed?.l === l && !ctx.still ? { y: [0, 4, 0], scale: [1, 0.9, 1] } : out && !ctx.still ? { scale: [1, 1.3, 0.85], rotate: [0, 12, 0] } : { y: 0 }}
                        transition={{ layout: { type: 'spring', stiffness: 300, damping: 18, delay: li * 0.02 }, default: { duration: 0.25 } }}
                        whileHover={canPlay && !out && !ctx.still ? { scale: 1.08, y: -2 } : undefined} whileTap={{ scale: 0.9, y: 3 }}>
                        {l}
                        {(mk || out) && <span className="absolute top-[6%] right-[8%] w-[34%] aspect-square"><MarkGlyph m={mk ?? 'x'} /></span>}
                      </motion.button>
                    );
                  })}
                </div>
              ))}
              <div className="flex justify-center gap-[2%] min-h-0">
                <button type="button" onClick={() => { flipOrder(); c.current.sfx.tick(); }} aria-label={`Key order: ${keyOrder === 'abc' ? 'A B C' : 'keyboard'}. Tap to change.`}
                  className="h-full rounded-[0.6rem] border-std border-border font-heading font-bold bg-surface-2 whitespace-nowrap" style={{ width: '22%', fontSize: 'max(0.8rem, min(9cqh, 3.6cqw))', boxShadow: '0 4px 0 #000' }}>
                  {keyOrder === 'abc' ? 'ABC' : 'QWERTY'}
                </button>
                <motion.button type="button" onClick={() => canPlay && back()} disabled={!canPlay} aria-label="Back: delete a letter"
                  className="h-full rounded-[0.6rem] border-std border-border inline-flex items-center justify-center gap-[0.3em] font-display disabled:cursor-default" style={{ width: '26%', fontSize: 'max(0.95rem, min(13cqh, 5.4cqw))', background: '#f5a08c', boxShadow: '0 4px 0 #000' }}
                  whileHover={canPlay && !ctx.still ? { scale: 1.05 } : undefined} whileTap={{ scale: 0.92, y: 3 }}>
                  <Backspace weight="bold" style={{ width: '1.2em', height: '1.2em' }} aria-hidden="true" />Back
                </motion.button>
                <motion.button type="button" onClick={() => void submit()} disabled={!canPlay} aria-label="Try this word"
                  className="h-full rounded-[0.6rem] border-std border-border inline-flex items-center justify-center gap-[0.3em] whitespace-nowrap font-display disabled:cursor-default" style={{ width: '44%', fontSize: 'max(0.95rem, min(12cqh, 5cqw))', background: full ? '#8fe3a0' : '#fdfd94', boxShadow: '0 4px 0 #000' }}
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
          <motion.div className="relative min-w-0 min-h-0" style={layout === 'wide' ? { width: `${80 / ar}%` } : layout === 'mid' ? { width: '44%' } : { height: '62%' }} ref={shakeRef}>
            <Vault open={open} still={ctx.still} gen={gen} />
            <div className="absolute inset-[11%_12%_6%_12%]" style={{ containerType: 'size' }}>
              <div className="absolute inset-0 grid place-items-center" style={{ perspective: 900 }}>
                <div className="relative grid gap-[1.6%]" role="grid" aria-label="Guesses" style={{ width: `min(100cqw, 100cqh * ${L / max})`, height: `min(100cqh, 100cqw * ${max / L})`, gridTemplateRows: `repeat(${max}, 1fr)` }}>
                  {Array.from({ length: max }, (_, ri) => {
                    const row = rows[ri], isCur = ri === rows.length && !open;
                    const won = row && row.marks.every((m) => m === 'g');
                    return (
                      <motion.div key={`${gen}-${ri}`} role="row" className="grid gap-[2.4%] min-h-0" style={{ gridTemplateColumns: `repeat(${L}, 1fr)` }} initial={ctx.still || ri < 6 ? false : { y: -40, opacity: 0, scaleY: 0.4 }} animate={{ y: 0, opacity: 1, scaleY: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 14 }}>
                        {spots.map((i) => {
                          const l = row ? row.word[i] : isCur ? current[i] : '';
                          const m = row?.marks[i];
                          const isGiven = isCur && given[i] !== undefined;
                          return (
                            <Tile key={i} l={l} mark={m} i={i} given={isGiven} won={!!won} still={ctx.still} cur={isCur && mode === 'play'} by={row ? color(row.by) : undefined} solo={ctx.solo} max={max} cols={L} />
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
            <ClueCard pair={pair} open={open} still={ctx.still} wide={wide} double={double} len={L} />
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
// One padlock tile: a little shackle on top, the letter on the lock body.
// It flips over to show its color and mark, one after another.
function Tile({ l, mark, i, given, won, still, cur, by, solo, max, cols }: { l: string; mark?: Mark; i: number; given: boolean; won: boolean; still: boolean; cur: boolean; by?: string; solo: boolean; max: number; cols: number }) {
  const face = 'absolute inset-0 rounded-[26%] border-border grid place-items-center font-heading font-bold';
  const fs = `calc(min(100cqw / ${cols}, 100cqh / ${max}) * 0.46)`;
  return (
    <div className="relative min-h-0" style={{ transformStyle: 'preserve-3d' }} role="gridcell" aria-label={l ? `${l}${mark ? `, ${MARK_WORD[mark]}` : ''}` : 'empty'}>
      <svg viewBox="0 0 40 16" preserveAspectRatio="none" className="absolute left-[24%] right-[24%] top-0 h-[24%] w-[52%]" aria-hidden="true">
        <path d="M5 16V11a15 9 0 0 1 30 0v5" fill="none" stroke={mark === 'g' && won ? '#8fe3a0' : '#b4c4fb'} strokeWidth="5" />
      </svg>
      <motion.div className="absolute inset-x-0 bottom-0 top-[18%]" style={{ transformStyle: 'preserve-3d' }}
        initial={false} animate={{ rotateX: mark ? 180 : 0, y: won && !still ? [0, 0, -18, 0] : 0, scale: l && !mark && !still ? [1.12, 1] : 1 }}
        transition={{ rotateX: { duration: still ? 0 : 0.5, delay: still ? 0 : 0.3 + i * 0.3, ease: 'easeInOut' }, y: { duration: 0.5, delay: 2 + i * 0.1 }, scale: { duration: 0.15 } }}>
        <div className={face} style={{ borderWidth: 'max(2px, 0.6cqmin)', backfaceVisibility: 'hidden', fontSize: fs, background: given ? FILL.g : l ? '#ffffff' : 'rgba(251,252,248,0.85)', boxShadow: cur ? '0 0 0 3px #fdfd94, 0 4px 0 #000' : '0 4px 0 #000', color: '#241c3d' }}>
          {l}
          {given && !still && <motion.span className="absolute inset-0 rounded-[18%]" initial={{ scale: 2.4, opacity: 0.9 }} animate={{ scale: 1, opacity: 0 }} transition={{ duration: 0.5 }} style={{ border: '4px solid #fff' }} />}
        </div>
        <div className={face} style={{ borderWidth: 'max(2px, 0.6cqmin)', backfaceVisibility: 'hidden', transform: 'rotateX(180deg)', fontSize: fs, background: mark ? FILL[mark] : '#fff', boxShadow: '0 4px 0 #000', color: '#241c3d' }}>
          {l}
          {mark && <span className="absolute top-[6%] right-[7%] w-[30%] aspect-square"><MarkGlyph m={mark} /></span>}
          {/* Who guessed it (teams): a small dot in their color. */}
          {by && !solo && i === 0 && <span className="absolute -left-[12%] top-1/2 -translate-y-1/2 w-[18%] aspect-square rounded-full border-2 border-border" style={{ background: by }} aria-hidden="true" />}
        </div>
      </motion.div>
    </div>
  );
}

// The clue, on its envelope from the start; the word joins it once the
// vault opens.
function ClueCard({ pair, open, still, wide, double, len }: { pair: WordPair; open: boolean; still: boolean; wide: boolean; double: boolean; len: number }) {
  const U = wide ? 'cqh' : 'cqw';
  return (
    <div className="relative flex-1 min-h-0 rounded-[1.4rem] border-heavy border-border bg-surface px-[5%] py-[3%] grid content-center justify-items-center text-center gap-[0.4em]" style={{ boxShadow: '0 6px 0 #000, 0 18px 30px rgba(36,28,61,0.25)' }} aria-live="polite">
      <AnimatePresence mode="wait">
        <motion.div key={`clue-${pair.word}-${open}`} className="grid gap-[0.35em] justify-items-center" initial={still ? false : { rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
          {open ? <span className="font-display leading-none rounded-full border-std border-border px-[0.5em] py-[0.1em]" style={{ fontSize: `max(1.1rem, ${wide ? 5 : 5.5}${U})`, background: '#8fe3a0' }}>{pair.word}</span>
            : <span className="inline-flex items-center gap-[0.4em] font-bold text-muted" style={{ fontSize: `max(0.85rem, ${wide ? 2.6 : 3}${U})` }}><span className="inline-flex" style={{ width: '2.2em', height: '1.5em' }}><Art kind="envelope" /></span>{len} letters</span>}
          <span className="font-bold leading-snug text-balance" style={{ fontSize: `max(0.95rem, ${(wide ? 5 : 5) * (pair.clue.length > 60 ? 0.7 : pair.clue.length > 35 ? 0.85 : 1)}${U})` }}>{pair.clue}</span>
        </motion.div>
      </AnimatePresence>
      {double && <motion.span className="absolute top-2 right-2 h-11 min-w-11 rounded-full border-heavy border-border bg-accent grid place-items-center font-display text-xl" initial={still ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>x2</motion.span>}
    </div>
  );
}

// The mark on a tile or key, so color is never the only cue: a check, a
// sun, or a dash.
function MarkGlyph({ m }: { m: Mark }) {
  return (
    <svg viewBox="0 0 20 20" className="w-full h-full" aria-hidden="true">
      {m === 'g' && <path d="M4 10.5l4 4 8-9" fill="none" stroke="#241c3d" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />}
      {m === 'y' && <><circle cx="10" cy="10" r="4" fill="#f6c544" stroke="#241c3d" strokeWidth="1.8" />{[0, 45, 90, 135, 180, 225, 270, 315].map((d) => <path key={d} d="M10 1.5v2.6" stroke="#241c3d" strokeWidth="1.8" strokeLinecap="round" transform={`rotate(${d} 10 10)`} />)}</>}
      {m === 'x' && <path d="M5 10h10" stroke="#5b6390" strokeWidth="3.2" strokeLinecap="round" />}
    </svg>
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
      {kind === 'sun' && <>{ring('#b4c4fb')}<circle cx="50" cy="50" r="16" fill="#fdfd94" stroke="#000" strokeWidth="4" />{[0, 45, 90, 135, 180, 225, 270, 315].map((d) => <path key={d} d="M50 16v10" stroke="#000" strokeWidth="5" strokeLinecap="round" transform={`rotate(${d} 50 50)`} />)}</>}
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
  description: 'A word from your set locks the vault. Read its clue, guess words and use the marks to crack the code.',
  ways: ['solo', 'teams'],
  minTeams: 2,
  maxTeams: 6,
  uses: 'words',
  how: [
    { icon: <LockKey weight="fill" />, text: 'Read the clue and type a word' },
    { icon: <Palette weight="fill" />, text: 'Check: right spot. Sun: in the word. Dash: not in it' },
    { icon: <Trophy weight="fill" />, text: 'Find the word to win' },
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
