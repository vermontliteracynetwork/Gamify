import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowDown, ArrowRight, Backspace, CheckCircle, Keyboard as KeyIcon, ListNumbers, Trophy } from '@phosphor-icons/react';
import { playClip } from '../../../engine/music';
import { TurnCard } from '../../../engine/ShareQuestion';
import { TEAM_COLORS } from '../../../engine/turns';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import { STARTER_WORDS } from '../../words';
import { cellsOf, entryAt, key, makePuzzle, type Entry, type Puzzle } from './layout';

// Crossword (Game Lab, inspired by the paper puzzle): the words of the set
// are fitted into a crossword pinned to a corkboard, with numbered clues (the
// questions). Tap a clue or a square, type with the big letter keys (or the
// keyboard). Teams take turns answering one clue each; solo fills the whole
// puzzle, as many tries as it takes.

const A = '/lab/crossword';
const img = (f: string) => <img src={`${A}/${f}.webp`} alt="" className="w-full h-full object-contain" draggable={false} />;

const POWERS: LabPower[] = [
  { id: 'letter', name: 'Reveal a Letter', desc: 'A magic star flies in and fills one square for you.', enter: 'spin', art: <Art kind="letter" /> },
  { id: 'word', name: 'Reveal a Word', desc: 'A potion pours a whole word into the puzzle, and it counts for you.', enter: 'drop', art: img('potion') },
  { id: 'check', name: 'Pencil Check', desc: 'Miss your next word and the right letters stay, with one more try.', enter: 'zoom', art: <Art kind="check" /> },
  { id: 'glow', name: 'Glow Keys', desc: 'The keys for your word light up (with a few tricky extras).', enter: 'spin', art: <Art kind="glow" /> },
  { id: 'double', name: 'Double Points', desc: 'Your next word is worth double.', enter: 'spin', art: img('lightning') },
  { id: 'ink', name: 'Ink Spill', desc: 'Splat! A silly ink blob lands on the puzzle. Tap it to wipe it away.', silly: true, art: <Art kind="ink" /> },
  { id: 'wobble', name: 'Wobbly Keys', desc: 'Wibble wobble! The letter keys dance for the next turn.', silly: true, art: <Art kind="wobble" /> },
];

const ROWS = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
const asQuestion = (e: Entry): MultipleChoiceQuestion => ({ id: `cw-${e.word}`, kind: 'mc', prompt: e.clue, choices: [e.word], correctIndex: 0 });
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));
type Mode = 'turn' | 'play' | 'busy';
interface Fixed { l: string; by: string | null }

function useWide(at = 1.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1.6);
  useLayoutEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAspect(e.contentRect.width / Math.max(1, e.contentRect.height)));
    ro.observe(el); return () => ro.disconnect();
  }, []);
  // Short, wide windows put the keys beside the puzzle instead of under it.
  return [ref, aspect > at, aspect > 1.85] as const;
}

function newPuzzle(words: () => { word: string; clue: string }[]): Puzzle {
  const w = words();
  let p = makePuzzle(w, Math.random, 6);
  if (p.entries.length < 4) p = makePuzzle([...w, ...[...STARTER_WORDS].sort(() => Math.random() - 0.5)], Math.random, 6);
  return p;
}

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const clip = (f: string, level = 0.7) => playClip(`${A}/${f}.mp3`, c.current.settings, level);
  const [box, wide, xwide] = useWide();
  const [puz, setPuzState] = useState<Puzzle>(() => newPuzzle(() => ctx.words({ min: 3, max: 9 })));
  const puzRef = useRef(puz);
  const setPuz = (p: Puzzle) => { puzRef.current = p; setPuzState(p); };
  const [fixed, setFixedState] = useState<Record<string, Fixed>>({});
  const fixedRef = useRef(fixed);
  const setFixed = (f: Record<string, Fixed>) => { fixedRef.current = f; setFixedState(f); };
  const [solved, setSolvedState] = useState<Record<number, string>>({});
  const solvedRef = useRef(solved);
  const setSolved = (s: Record<number, string>) => { solvedRef.current = s; setSolvedState(s); };
  const [act, setActState] = useState(0);
  const actRef = useRef(0);
  const [draft, setDraftState] = useState<Record<string, string>>({});
  const draftRef = useRef(draft);
  const setDraft = (d: Record<string, string>) => { draftRef.current = d; setDraftState(d); };
  const [cur, setCurState] = useState(0);
  const curRef = useRef(0);
  const setCur = (n: number) => { curRef.current = n; setCurState(n); };
  const [mode, setModeState] = useState<Mode>('busy');
  const modeRef = useRef(mode);
  const setMode = (m: Mode) => { modeRef.current = m; setModeState(m); };
  const [bad, setBad] = useState<{ id: number; keys: string[] } | null>(null);
  const [wave, setWave] = useState<{ id: number; keys: string[] } | null>(null);
  const [pressed, setPressed] = useState<{ l: string; id: number } | null>(null);
  const [star, setStar] = useState<{ id: number; k: string } | null>(null);
  const [potion, setPotion] = useState(false);
  const [ink, setInk] = useState<{ id: number; x: number; y: number; left: number } | null>(null);
  const [double, setDoubleState] = useState(false);
  const doubleRef = useRef(false);
  const setDouble = (v: boolean) => { doubleRef.current = v; setDoubleState(v); };
  const [check, setCheckState] = useState(false);
  const checkRef = useRef(false);
  const setCheck = (v: boolean) => { checkRef.current = v; setCheckState(v); };
  const [glow, setGlow] = useState(false);
  const [wobble, setWobble] = useState(false);
  const wobbleNext = useRef(false);
  const pending = useRef<Record<string, LabPower[]>>({});
  const color = (id: string | null) => (id ? TEAM_COLORS[(ctx.turns.players.find((p) => p.id === id)?.colorIndex ?? 0) % TEAM_COLORS.length] : '#e2dcfb');
  const open = (s = solvedRef.current) => puzRef.current.entries.map((_, i) => i).filter((i) => s[i] === undefined);

  function select(i: number, at?: number) {
    actRef.current = i; setActState(i); setDraft({});
    const e = puzRef.current.entries[i]; if (!e) return;
    const cells = cellsOf(e);
    const first = at ?? cells.findIndex(([r, cc]) => !fixedRef.current[key(r, cc)]);
    setCur(Math.max(0, first));
  }

  // A new turn (teams) or a new puzzle (solo, or when the board is done).
  useEffect(() => {
    const x = c.current;
    setDouble(false); setCheck(false); setGlow(false);
    setWobble(wobbleNext.current); wobbleNext.current = false;
    if (x.taken > 0 && (x.solo || open().length === 0)) {
      setPuz(newPuzzle(() => c.current.words({ min: 3, max: 9 })));
      setFixed({}); setSolved({}); clip('wipe'); x.say('New puzzle!');
    }
    select(open()[0] ?? 0);
    if (x.solo) setMode('play'); else setMode('turn');
  }, [ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  async function beginTurn() {
    const x = c.current, list = pending.current[x.player.id] ?? [];
    pending.current[x.player.id] = []; x.setHeld(x.player.id, []);
    setMode('play');
    for (const p of list) { fire(p); await wait(1500); }
  }

  function fire(p: LabPower) {
    const x = c.current;
    if (!p.silly) x.say(`${p.name} is on!`);
    if (p.id === 'double') { setDouble(true); x.sfx.coin(); }
    if (p.id === 'check') { setCheck(true); x.sfx.slideUp(); }
    if (p.id === 'glow') { setGlow(true); x.sfx.zap(); }
    if (p.id === 'letter') {
      const cells = open().flatMap((i) => cellsOf(puzRef.current.entries[i]).map(([r, cc]) => key(r, cc))).filter((k) => !fixedRef.current[k]);
      const preferred = cells.filter((k) => cellsOf(puzRef.current.entries[actRef.current] ?? puzRef.current.entries[0]).some(([r, cc]) => key(r, cc) === k));
      const k = (preferred.length ? preferred : cells)[Math.floor(Math.random() * (preferred.length || cells.length))];
      if (!k) return;
      setStar({ id: Date.now(), k }); x.sfx.slideDown();
      window.setTimeout(() => {
        setFixed({ ...fixedRef.current, [k]: { l: puzRef.current.letters[k], by: null } });
        const d = { ...draftRef.current }; delete d[k]; setDraft(d);
        x.sfx.coin(); afterFill();
      }, 900);
      window.setTimeout(() => setStar(null), 1400);
    }
    if (p.id === 'word') {
      const choices = open().filter((i) => i !== actRef.current);
      const i = choices.length ? choices[Math.floor(Math.random() * choices.length)] : open()[0];
      if (i === undefined) return;
      const e = puzRef.current.entries[i], cells = cellsOf(e), who = x.player.id;
      setPotion(true); x.sfx.splash();
      cells.forEach(([r, cc], k) => window.setTimeout(() => { setFixed({ ...fixedRef.current, [key(r, cc)]: { l: e.word[k], by: fixedRef.current[key(r, cc)]?.by ?? who } }); x.sfx.note(k); }, 700 + k * 160));
      window.setTimeout(() => {
        setPotion(false);
        setSolved({ ...solvedRef.current, [i]: who });
        x.points(e.word.length, who); x.say(`${e.word}!`);
        setWave({ id: Date.now(), keys: cells.map(([r, cc]) => key(r, cc)) });
        if (i === actRef.current || solvedRef.current[actRef.current] !== undefined) { const n = open()[0]; if (n !== undefined) select(n); }
        if (open().length === 0) { window.setTimeout(() => puzzleDone(), 600); }
      }, 900 + cells.length * 160);
    }
    if (p.id === 'ink') {
      clip('splat'); x.say('Ink Spill!', 'oops');
      setInk({ id: Date.now(), x: 15 + Math.random() * 40, y: 10 + Math.random() * 40, left: 3 });
    }
    if (p.id === 'wobble') { x.sfx.boing(); x.say('Wobbly Keys!', 'oops'); if (x.solo) setWobble(true); else wobbleNext.current = true; }
  }

  // Typing into the chosen clue.
  function type(l: string) {
    if (modeRef.current !== 'play') return;
    const e = puzRef.current.entries[actRef.current];
    if (!e || solvedRef.current[actRef.current] !== undefined) return;
    const cells = cellsOf(e).map(([r, cc]) => key(r, cc));
    let i = curRef.current;
    while (i < cells.length && fixedRef.current[cells[i]]) i++;
    if (i >= cells.length) { i = cells.findIndex((k) => !fixedRef.current[k] && !draftRef.current[k]); if (i < 0) return; }
    setDraft({ ...draftRef.current, [cells[i]]: l });
    setPressed({ l, id: Date.now() }); clip('key', 0.5);
    let n = i + 1; while (n < cells.length && fixedRef.current[cells[n]]) n++;
    setCur(Math.min(n, cells.length - 1));
    afterFill();
  }
  function back() {
    if (modeRef.current !== 'play') return;
    const e = puzRef.current.entries[actRef.current]; if (!e) return;
    const cells = cellsOf(e).map(([r, cc]) => key(r, cc));
    let i = curRef.current;
    if (!draftRef.current[cells[i]]) { i--; while (i >= 0 && fixedRef.current[cells[i]]) i--; }
    if (i < 0) return;
    const d = { ...draftRef.current }; delete d[cells[i]]; setDraft(d); setCur(i); c.current.sfx.tick();
  }
  function afterFill() {
    const e = puzRef.current.entries[actRef.current];
    if (!e || solvedRef.current[actRef.current] !== undefined) return;
    const cells = cellsOf(e).map(([r, cc]) => key(r, cc));
    if (cells.every((k) => fixedRef.current[k] || draftRef.current[k])) { setMode('busy'); window.setTimeout(() => void checkWord(), 350); }
  }

  async function checkWord() {
    const x = c.current, i = actRef.current, e = puzRef.current.entries[i];
    const cells = cellsOf(e).map(([r, cc]) => key(r, cc));
    const typed = cells.map((k) => fixedRef.current[k]?.l ?? draftRef.current[k] ?? '').join('');
    if (typed === e.word) {
      const who = x.player.id, pts = e.word.length * (doubleRef.current ? 2 : 1);
      if (doubleRef.current) setDouble(false);
      const f = { ...fixedRef.current };
      cells.forEach((k, j) => { f[k] = { l: e.word[j], by: f[k]?.by ?? who }; });
      setFixed(f); setDraft({});
      const s = { ...solvedRef.current, [i]: who }; setSolved(s);
      x.points(pts); clip('right'); x.say(`${e.word}! +${pts}`);
      setWave({ id: Date.now(), keys: cells });
      const [r, cc] = cellsOf(e)[Math.floor(e.word.length / 2)];
      x.burst(0.15 + (cc / puzRef.current.cols) * 0.45, 0.2 + (r / puzRef.current.rows) * 0.45);
      x.log(asQuestion(e), true);
      const left = open(s);
      if (x.solo) {
        if (!left.length) { await puzzleDone(); return; }
        await wait(1000);
        const pw = await c.current.power(0.35, (p) => p.id !== 'word' || left.length > 1);
        select(open()[0]);
        setMode('play');
        if (pw) fire(pw);
        return;
      }
      await wait(1200);
      const pw = await c.current.power(0.45, (p) => p.id !== 'word' || left.length > 1);
      if (pw) {
        if (pw.silly) { fire(pw); await wait(1600); }
        else { pending.current[who] = [...(pending.current[who] ?? []), pw]; c.current.setHeld(who, pending.current[who]); }
      }
      if (!left.length) { x.sfx.cheer(); x.say('Puzzle done!', 'big'); x.burst(0.4, 0.4, 'big'); await wait(1600); }
      c.current.next();
      return;
    }
    // A miss: the wrong squares shake.
    const wrong = cells.filter((k, j) => !fixedRef.current[k] && draftRef.current[k] !== e.word[j]);
    setBad({ id: Date.now(), keys: wrong }); x.sfx.wrong();
    await wait(700);
    setBad(null);
    const keep = { ...draftRef.current }; wrong.forEach((k) => delete keep[k]);
    if (checkRef.current) {
      setCheck(false); setDraft(keep); x.say('Pencil Check! Try again');
      setCur(cells.findIndex((k) => !fixedRef.current[k] && !keep[k])); setMode('play'); return;
    }
    if (x.solo) { setDraft(keep); setCur(cells.findIndex((k) => !fixedRef.current[k] && !keep[k])); x.say('Try again!', 'oops'); setMode('play'); return; }
    setDraft({}); x.say('Not quite!', 'oops');
    if (!x.cpu) x.log(asQuestion(e), false);
    await wait(900);
    c.current.next();
  }

  async function puzzleDone() {
    const x = c.current;
    setMode('busy'); x.sfx.cheer(); x.say('Puzzle done!', 'big'); x.burst(0.4, 0.4, 'big');
    await wait(2600);
    c.current.next();
  }

  // The physical keyboard.
  useEffect(() => {
    if (mode !== 'play' || ctx.cpu) return;
    const on = (ev: KeyboardEvent) => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
      if (/^[a-z]$/i.test(ev.key)) { ev.preventDefault(); type(ev.key.toUpperCase()); }
      else if (ev.key === 'Backspace') { ev.preventDefault(); back(); }
      else if (ev.key === 'Tab' && document.querySelector('[role="dialog"]') === null) {
        const list = open(); if (list.length < 2) return;
        ev.preventDefault(); const k = list.indexOf(actRef.current); select(list[(k + (ev.shiftKey ? -1 : 1) + list.length) % list.length]); c.current.sfx.tick();
      }
    };
    window.addEventListener('keydown', on); return () => window.removeEventListener('keydown', on);
  }, [mode, ctx.cpu]); // eslint-disable-line react-hooks/exhaustive-deps

  // The computer picks a clue and types, key by key.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'play') return;
    let live = true;
    const x = c.current;
    void (async () => {
      await wait(1100);
      const list = open(); if (!live || !list.length) return;
      const i = list[Math.floor(Math.random() * list.length)];
      select(i); x.sfx.tick();
      await wait(900);
      const e = puzRef.current.entries[i], right = c.current.cpuRight();
      const cells = cellsOf(e).map(([r, cc]) => key(r, cc));
      const free = cells.map((k, j) => [k, j] as const).filter(([k]) => !fixedRef.current[k]);
      const slip = right ? -1 : free[Math.floor(Math.random() * free.length)]?.[1];
      for (const [, j] of free) {
        if (!live) return;
        let l = e.word[j];
        if (j === slip) { const abc = 'AEIOURSTLN'.replace(l, ''); l = abc[Math.floor(Math.random() * abc.length)]; }
        type(l); await wait(420);
      }
    })();
    return () => { live = false; };
  }, [ctx.cpu, mode, ctx.taken]); // eslint-disable-line react-hooks/exhaustive-deps

  const e = puz.entries[act];
  const actCells = useMemo(() => (e ? cellsOf(e).map(([r, cc]) => key(r, cc)) : []), [e]);
  const glowKeys = useMemo(() => {
    if (!glow || !e) return new Set<string>();
    const s = new Set(e.word.split(''));
    const extra = 'ABCDEFGHIJKLMNOPRSTUVWY'.split('').filter((l) => !s.has(l)).sort(() => Math.random() - 0.5).slice(0, 3);
    return new Set([...s, ...extra]);
  }, [glow, e]);
  const numAt = useMemo(() => { const m: Record<string, number> = {}; for (const en of puz.entries) m[key(en.r, en.c)] = en.num; return m; }, [puz]);
  const canPlay = mode === 'play' && !ctx.cpu;
  const tapCell = (r: number, cc: number) => {
    if (!canPlay) return;
    const k = key(r, cc);
    const here = actCells.indexOf(k);
    const pref = here >= 0 && e ? (e.dir === 'across' ? 'down' : 'across') : e?.dir ?? 'across';
    let i = entryAt(puz, r, cc, here >= 0 && curRef.current === here ? pref : e?.dir ?? 'across');
    if (solved[i] !== undefined) { const other = puz.entries.map((_, j) => j).find((j) => j !== i && solved[j] === undefined && cellsOf(puz.entries[j]).some(([y, x]) => y === r && x === cc)); if (other === undefined) return; i = other; }
    const at = cellsOf(puz.entries[i]).findIndex(([y, x]) => y === r && x === cc);
    if (i !== act) select(i, at); else setCur(at);
    ctx.sfx.tick();
  };

  const S = wide ? 'cqh' : 'cqw';
  // The big letter keys.
  const keys = (
          <div className="relative shrink-0 grid gap-[3%] rounded-[1.4rem] border-heavy border-border px-[1.5%] py-[1.6%]" role="group" aria-label="Letter keys"
            style={{ height: xwide ? '44%' : wide ? '29%' : '23%', background: '#241c3d', boxShadow: '0 6px 0 #000', containerType: 'size', gridTemplateRows: 'repeat(3, 1fr)' }}>
            {ROWS.map((row, ri) => (
              <div key={row} className="flex justify-center gap-[0.8%] min-h-0">
                {[...row].map((l, li) => (
                  <motion.button key={l} type="button" onClick={() => canPlay && type(l)} disabled={!canPlay} aria-label={l}
                    className="h-full rounded-[0.6rem] border-std border-border font-heading font-bold grid place-items-center disabled:cursor-default"
                    style={{ width: '9%', fontSize: 'max(1rem, 15cqh)', background: glowKeys.has(l) ? '#fdfd94' : '#fbfcf8', boxShadow: glowKeys.has(l) ? '0 0 14px #fdfd94, 0 4px 0 #000' : '0 4px 0 #000' }}
                    animate={pressed?.l === l && !ctx.still ? { y: [0, 4, 0], scale: [1, 0.9, 1] } : wobble && !ctx.still ? { rotate: [0, -10, 9, -6, 0], y: [0, -5, 2, 0] } : { y: 0, rotate: 0 }}
                    transition={pressed?.l === l ? { duration: 0.2 } : wobble ? { duration: 0.8 + ((li * 7 + ri * 3) % 5) * 0.1, repeat: Infinity, delay: ((li + ri) % 4) * 0.1 } : undefined}
                    whileHover={canPlay && !ctx.still ? { scale: 1.08, y: -2 } : undefined} whileTap={{ scale: 0.9, y: 3 }}>
                    {l}
                  </motion.button>
                ))}
                {ri === 2 && (
                  <motion.button type="button" onClick={() => canPlay && back()} disabled={!canPlay} aria-label="Delete a letter"
                    className="h-full rounded-[0.6rem] border-std border-border grid place-items-center disabled:cursor-default" style={{ width: '14%', fontSize: 'max(1rem, 15cqh)', background: '#f5a08c', boxShadow: '0 4px 0 #000' }}
                    whileHover={canPlay && !ctx.still ? { scale: 1.06 } : undefined} whileTap={{ scale: 0.9, y: 3 }}>
                    <Backspace weight="bold" style={{ width: '1.5em', height: '1.5em' }} />
                  </motion.button>
                )}
              </div>
            ))}
          </div>
  );
  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <div className="lab-fit relative" style={{ '--ar': xwide ? 2.05 : wide ? 1.5 : 0.72, containerType: 'size' } as CSSProperties}>
        <div className="absolute inset-0 flex flex-col gap-[2%]">
          <div className={`flex-1 min-h-0 flex ${wide ? 'flex-row' : 'flex-col'} gap-[2%]`}>
            {/* The corkboard with the puzzle pinned on it. */}
            <div className="relative min-w-0 min-h-0" style={xwide ? { width: '47%' } : wide ? { width: '57%' } : { flex: 1 }}>
              <Cork />
              <div className="absolute inset-[4.5%]" style={{ containerType: 'size' }}>
                <div className="absolute inset-0 grid place-items-center">
                  <div className="relative" style={{ width: `min(100cqw, 100cqh * ${puz.cols / puz.rows})`, height: `min(100cqh, 100cqw * ${puz.rows / puz.cols})` }}>
                    <div className="absolute inset-0 grid" role="grid" aria-label="Crossword" style={{ gridTemplateColumns: `repeat(${puz.cols}, 1fr)`, gridTemplateRows: `repeat(${puz.rows}, 1fr)` }}>
                      {Array.from({ length: puz.rows * puz.cols }, (_, n) => {
                        const r = Math.floor(n / puz.cols), cc = n % puz.cols, k = key(r, cc);
                        const answer = puz.letters[k];
                        if (!answer) return <span key={k} aria-hidden="true" />;
                        const f = fixed[k], d = draft[k], inAct = actCells.includes(k), isCur = inAct && actCells[cur] === k && mode === 'play';
                        const isBad = bad?.keys.includes(k), waveAt = wave?.keys.indexOf(k) ?? -1;
                        return (
                          <motion.button key={k} type="button" onClick={() => tapCell(r, cc)} disabled={!canPlay} aria-label={`Square ${numAt[k] ? `${numAt[k]} ` : ''}${f?.l ?? d ?? 'empty'}`}
                            className="relative m-[4%] rounded-[14%] border-border font-heading font-bold grid place-items-center disabled:cursor-default"
                            style={{ borderWidth: 'max(2px, 0.5cqmin)', background: isBad ? '#ef7d96' : f ? color(f.by) : isCur ? '#fdfd94' : inAct ? '#fffbd0' : '#ffffff', boxShadow: isCur ? '0 0 0 3px #241c3d, 0 3px 0 #000' : '0 3px 0 #000', fontSize: `calc(min(100cqw / ${puz.cols}, 100cqh / ${puz.rows}) * 0.5)`, zIndex: isCur ? 2 : 1 }}
                            initial={ctx.still ? false : { scale: 0, rotate: -20 }}
                            animate={isBad && !ctx.still ? { x: [0, -6, 6, -4, 4, 0], scale: 1, rotate: 0 } : waveAt >= 0 && !ctx.still ? { y: [0, -14, 0], scale: [1, 1.15, 1], rotate: 0 } : { scale: isCur && !ctx.still ? [1, 1.06, 1] : 1, rotate: 0, y: 0 }}
                            transition={isBad ? { duration: 0.45 } : waveAt >= 0 ? { duration: 0.5, delay: waveAt * 0.07 } : isCur ? { scale: { duration: 1.2, repeat: Infinity } } : { type: 'spring', stiffness: 300, damping: 16, delay: (r + cc) * 0.03 }}
                            whileHover={canPlay && !ctx.still ? { scale: 1.08 } : undefined}>
                            {numAt[k] && <span className="absolute left-[8%] top-[2%] leading-none font-bold text-ink-night" style={{ fontSize: '0.42em' }}>{numAt[k]}</span>}
                            <AnimatePresence mode="popLayout">
                              {(f?.l ?? d) && (
                                <motion.span key={`${f ? 'f' : 'd'}-${f?.l ?? d}`} className="leading-none mt-[12%]" style={{ color: '#241c3d' }} initial={ctx.still ? false : { scale: 2.2, y: -16, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 18 }}>
                                  {f?.l ?? d}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        );
                      })}
                    </div>
                    {/* The magic star flies to a square. */}
                    <AnimatePresence>
                      {star && (() => { const [r, cc] = star.k.split(',').map(Number); return (
                        <motion.div key={star.id} className="absolute pointer-events-none" style={{ width: `${100 / puz.cols}%`, height: `${100 / puz.rows}%` }}
                          initial={{ left: '110%', top: '-30%', rotate: 0, scale: 1.6 }} animate={{ left: `${(cc / puz.cols) * 100}%`, top: `${(r / puz.rows) * 100}%`, rotate: 540, scale: [1.6, 1.2, 0] }} exit={{ opacity: 0 }}
                          transition={{ duration: ctx.still ? 0.01 : 0.9, ease: 'easeIn' }}><Art kind="letter" /></motion.div>
                      ); })()}
                    </AnimatePresence>
                    {/* The ink blob, tap to wipe. */}
                    <AnimatePresence>
                      {ink && (
                        <motion.button key={ink.id} type="button" aria-label="Wipe the ink" className="absolute z-10" style={{ left: `${ink.x}%`, top: `${ink.y}%`, width: '46%', height: '46%' }}
                          onClick={() => { const n = ink.left - 1; clip('wipe'); c.current.sfx.swish(); if (n <= 0) { setInk(null); c.current.say('Squeaky clean!'); } else setInk({ ...ink, left: n }); }}
                          initial={ctx.still ? false : { scale: 0, rotate: -60 }} animate={{ scale: [0.4 + ink.left * 0.2, 0.3 + ink.left * 0.233], rotate: 0 }} exit={{ scale: 0, opacity: 0, rotate: 90 }} transition={{ type: 'spring', stiffness: 260, damping: 12 }}>
                          <Blob still={ctx.still} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
              {potion && <motion.div className="absolute right-[2%] top-[2%] w-[22%] aspect-square pointer-events-none" initial={{ y: -80, rotate: 0, opacity: 0 }} animate={{ y: 0, rotate: [0, -40, -60, -40], opacity: 1 }} transition={{ duration: 0.9 }}>{img('potion')}</motion.div>}
            </div>

            {/* The clue panel: the chosen clue big, the numbers to pick from. */}
            <div className="relative flex-1 min-w-0 min-h-0 flex flex-col gap-[3%]" style={wide ? undefined : { flex: '0 0 30%' }}>
              <div className="relative flex-1 min-h-0 rounded-[1.4rem] border-heavy border-border bg-surface px-[5%] py-[4%] flex flex-col gap-[4%] justify-center" style={{ boxShadow: '0 6px 0 #000, 0 18px 30px rgba(36,28,61,0.25)' }} aria-live="polite">
                <AnimatePresence mode="wait">
                  {e && (
                    <motion.div key={`${puz.entries.length}-${act}`} className="grid gap-[0.6em] min-h-0" initial={ctx.still ? false : { x: 30, opacity: 0, rotate: 2 }} animate={{ x: 0, opacity: 1, rotate: 0 }} exit={{ x: -30, opacity: 0 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
                      <span className="flex items-center gap-2 font-display leading-none" style={{ fontSize: `max(1.1rem, ${wide ? 5 : 4.4}${S})` }}>
                        <span className="inline-flex items-center gap-1 rounded-full border-std border-border px-[0.45em] py-[0.12em]" style={{ background: solved[act] !== undefined ? color(solved[act]) : '#fdfd94' }}>
                          {e.num}{e.dir === 'across' ? <ArrowRight weight="bold" aria-label="across" /> : <ArrowDown weight="bold" aria-label="down" />}
                        </span>
                        <span className="flex gap-[0.12em]" aria-hidden="true">{[...e.word].map((_, j) => <span key={j} className="inline-block rounded-[0.12em] border-[2px] border-border" style={{ width: '0.42em', height: '0.42em', background: fixed[actCells[j]] || draft[actCells[j]] ? '#241c3d' : '#fff' }} />)}</span>
                      </span>
                      <span className="font-bold leading-snug text-balance" style={{ fontSize: `max(0.95rem, ${(wide ? 4.6 : 3.8) * (e.clue.length > 70 ? 0.72 : e.clue.length > 40 ? 0.86 : 1)}${S})` }}>{e.clue}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <ul className="list-none m-0 p-0 flex flex-wrap gap-[2%] justify-center content-start shrink-0" aria-label="Clues">
                {puz.entries.map((en, i) => {
                  const by = solved[i];
                  return (
                    <li key={`${en.num}-${en.dir}-${en.word}`}>
                      <motion.button type="button" onClick={() => { if (canPlay && by === undefined) { select(i); ctx.sfx.tick(); } }} disabled={!canPlay || by !== undefined}
                        aria-label={`${en.num} ${en.dir}${by !== undefined ? ', solved' : ''}`} aria-pressed={i === act}
                        className="rounded-full border-std border-border font-heading font-bold inline-flex items-center justify-center gap-[0.2em] leading-none disabled:cursor-default"
                        style={{ fontSize: `max(0.85rem, ${wide ? 3 : 2.9}${S})`, minHeight: 44, minWidth: 44, padding: '0 0.55em', background: by !== undefined ? color(by) : i === act ? '#fdfd94' : '#fbfcf8', boxShadow: i === act ? '0 0 0 3px #241c3d' : '0 3px 0 #000' }}
                        whileHover={canPlay && by === undefined && !ctx.still ? { scale: 1.08 } : undefined} whileTap={{ scale: 0.92 }}>
                        {by !== undefined ? <CheckCircle weight="fill" aria-hidden="true" /> : null}{en.num}{en.dir === 'across' ? <ArrowRight weight="bold" aria-hidden="true" /> : <ArrowDown weight="bold" aria-hidden="true" />}
                      </motion.button>
                    </li>
                  );
                })}
              </ul>
              {xwide && keys}
              <div className="absolute -top-[0.2rem] right-[0.4rem] flex gap-1">
                <AnimatePresence>
                  {double && <Badge key="x2" still={ctx.still}>x2</Badge>}
                  {check && <Badge key="check" still={ctx.still}><span className="w-[1.4em] h-[1.4em] inline-flex"><Art kind="check" /></span></Badge>}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {!xwide && keys}
        </div>
      </div>
      {mode === 'turn' && !ctx.solo && <TurnCard key={ctx.taken} player={ctx.player} onStart={() => void beginTurn()} />}
    </div>
  );
}

function Badge({ children, still }: { children: ReactNode; still: boolean }) {
  return (
    <motion.span className="h-11 min-w-11 px-2 rounded-full border-heavy border-border bg-accent grid place-items-center font-display text-xl" style={{ boxShadow: '0 3px 0 #000' }}
      initial={still ? false : { scale: 0, rotate: -180 }} animate={{ scale: still ? 1 : [1, 1.1, 1], rotate: 0 }} exit={{ scale: 0 }} transition={{ scale: { duration: 1, repeat: Infinity } }}>{children}</motion.span>
  );
}

// A cute ink blob with a face.
function Blob({ still }: { still: boolean }) {
  return (
    <motion.svg viewBox="0 0 100 100" className="w-full h-full" animate={still ? undefined : { scaleX: [1, 1.05, 0.97, 1], scaleY: [1, 0.96, 1.04, 1] }} transition={{ duration: 1.4, repeat: Infinity }} aria-hidden="true">
      <path d="M50 8c10 0 12 10 22 9s16 9 13 18 8 14 4 24-14 6-16 15-14 14-24 10-14-8-22-6-16-8-14-18-10-14-4-24 2-12 12-16 19-12 29-12z" fill="#241c3d" stroke="#000" strokeWidth="3" />
      <circle cx="12" cy="86" r="5" fill="#241c3d" /><circle cx="90" cy="14" r="4" fill="#241c3d" /><circle cx="94" cy="80" r="3" fill="#241c3d" />
      <circle cx="38" cy="44" r="8" fill="#fff" /><circle cx="62" cy="44" r="8" fill="#fff" /><circle cx="40" cy="46" r="4" /><circle cx="64" cy="46" r="4" />
      <path d="M38 62q12 10 24 0" stroke="#fff" strokeWidth="4" fill="none" strokeLinecap="round" />
      <circle cx="28" cy="58" r="4" fill="#ef7d96" opacity="0.8" /><circle cx="72" cy="58" r="4" fill="#ef7d96" opacity="0.8" />
    </motion.svg>
  );
}

// The Classic corkboard in a wooden frame, with the puzzle page pinned on.
function Cork() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full" aria-hidden="true" style={{ filter: 'drop-shadow(0 6px 0 #000) drop-shadow(0 18px 18px rgba(36,28,61,0.35))' }}>
      <defs>
        <pattern id="cw-cork" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="0.5" fill="#b9814a" /><circle cx="4" cy="3.5" r="0.4" fill="#e9c08e" /><circle cx="2.5" cy="5" r="0.35" fill="#a86f3b" /></pattern>
      </defs>
      <rect x="0.8" y="0.8" width="98.4" height="98.4" rx="4" fill="#c98a52" stroke="#000" strokeWidth="0.9" vectorEffect="non-scaling-stroke" />
      <rect x="3" y="3" width="94" height="94" rx="2" fill="#dcae78" />
      <rect x="3" y="3" width="94" height="94" rx="2" fill="url(#cw-cork)" />
      <rect x="4.2" y="4.2" width="91.6" height="91.6" rx="1.5" fill="#fbfcf8" stroke="#000" strokeWidth="0.6" vectorEffect="non-scaling-stroke" transform="rotate(-0.6 50 50)" />
      {[[7, 7, '#ef7d96'], [93, 7, '#8fe3a0'], [7, 93, '#b4c4fb'], [93, 93, '#fdfd94']].map(([x, y, f], i) => (
        <g key={i}><ellipse cx={x as number} cy={y as number} rx="2.2" ry="2.2" fill={f as string} stroke="#000" strokeWidth="0.5" vectorEffect="non-scaling-stroke" /><ellipse cx={(x as number) - 0.6} cy={(y as number) - 0.7} rx="0.7" ry="0.5" fill="#fff" opacity="0.8" /></g>
      ))}
    </svg>
  );
}

// Classic power-up pictures, drawn in code.
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      {kind === 'letter' && <>{ring('#b4c4fb')}<path d="M50 14l10 22 24 3-18 16 5 24-21-12-21 12 5-24-18-16 24-3z" fill="#fdfd94" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><text x="50" y="64" textAnchor="middle" fontSize="24" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">A</text></>}
      {kind === 'check' && <>{ring('#8fe3a0')}<g transform="rotate(35 50 50)"><rect x="40" y="14" width="20" height="54" rx="3" fill="#f6c544" stroke="#000" strokeWidth="4" /><path d="M40 68l10 18 10-18z" fill="#f5d6b0" stroke="#000" strokeWidth="4" strokeLinejoin="round" /><rect x="40" y="10" width="20" height="10" rx="3" fill="#ef7d96" stroke="#000" strokeWidth="4" /></g><path d="M18 60l9 9 16-18" stroke="#000" strokeWidth="7" fill="none" strokeLinecap="round" strokeLinejoin="round" /></>}
      {kind === 'glow' && <>{ring('#241c3d')}<rect x="26" y="30" width="48" height="40" rx="8" fill="#fdfd94" stroke="#000" strokeWidth="4" /><text x="50" y="60" textAnchor="middle" fontSize="26" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">K</text>{[[50, 14], [86, 50], [14, 50], [50, 86]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="#fdfd94" />)}</>}
      {kind === 'ink' && <>{ring('#fdfd94')}<path d="M50 22c8 0 10 8 18 7s12 7 10 14 6 11 3 18-11 5-13 12-11 10-19 7-11-6-17-5-13-6-11-14-8-11-3-18 2-10 10-13 14-8 22-8z" fill="#241c3d" stroke="#000" strokeWidth="3" /><circle cx="42" cy="48" r="5" fill="#fff" /><circle cx="58" cy="48" r="5" fill="#fff" /><path d="M42 60q8 6 16 0" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
      {kind === 'wobble' && <>{ring('#f5a08c')}<g transform="rotate(-12 38 50)"><rect x="22" y="34" width="30" height="30" rx="6" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><text x="37" y="56" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">A</text></g><g transform="rotate(14 64 50)"><rect x="50" y="36" width="30" height="30" rx="6" fill="#fbfcf8" stroke="#000" strokeWidth="4" /><text x="65" y="58" textAnchor="middle" fontSize="18" fontWeight="800" fontFamily="Inclusive Sans, sans-serif">B</text></g><path d="M20 78q8-6 16 0t16 0 16 0 16 0" stroke="#000" strokeWidth="4" fill="none" strokeLinecap="round" /></>}
    </svg>
  );
}

function Cover() {
  const cells: [number, number, string][] = [[1, 0, 'C'], [1, 1, 'A'], [1, 2, 'K'], [1, 3, 'E'], [0, 1, 'B'], [2, 1, 'T'], [3, 1, 'S'], [0, 3, 'S'], [2, 3, 'A'], [3, 3, 'T']];
  return (
    <svg viewBox="0 0 100 62" preserveAspectRatio="xMidYMid slice" style={{ background: 'radial-gradient(circle at 50% 30%, #c9d2ff, #8d9df0)' }}>
      <rect x="22" y="3" width="56" height="56" rx="3" fill="#c98a52" stroke="#000" strokeWidth="0.7" />
      <rect x="24.5" y="5.5" width="51" height="51" rx="1.5" fill="#dcae78" />
      <rect x="27" y="8" width="46" height="46" rx="1" fill="#fbfcf8" stroke="#000" strokeWidth="0.5" transform="rotate(-1 50 31)" />
      {cells.map(([r, c, l], i) => (
        <g key={i} transform={`translate(${32 + c * 9.5} ${12 + r * 9.5})`}>
          <rect width="8.6" height="8.6" rx="1.4" fill={r === 1 ? '#f6c544' : c === 3 ? '#5cc3a0' : '#fff'} stroke="#000" strokeWidth="0.6" />
          <text x="4.3" y="6.6" textAnchor="middle" fontSize="5.4" fontWeight="800" fontFamily="Inclusive Sans, sans-serif" fill="#241c3d">{l}</text>
        </g>
      ))}
      <text x="33" y="24.4" fontSize="2.4" fontWeight="800">1</text>
      {[[28, 9, '#ef7d96'], [72, 9, '#8fe3a0'], [28, 53, '#b4c4fb'], [72, 53, '#fdfd94']].map(([x, y, f], i) => <circle key={i} cx={x as number} cy={y as number} r="1.6" fill={f as string} stroke="#000" strokeWidth="0.4" />)}
      <g transform="translate(78 40) rotate(30)"><rect x="-2.5" y="-12" width="5" height="18" rx="1" fill="#f6c544" stroke="#000" strokeWidth="0.6" /><path d="M-2.5 6l2.5 5 2.5-5z" fill="#f5d6b0" stroke="#000" strokeWidth="0.6" /><rect x="-2.5" y="-14" width="5" height="3" rx="1" fill="#ef7d96" stroke="#000" strokeWidth="0.6" /></g>
    </svg>
  );
}

const def: LabDef = {
  id: 'crossword',
  name: 'Crossword',
  description: 'The words of your set cross in a puzzle. Read a clue, type the word with the big keys.',
  ways: ['solo', 'teams'],
  minTeams: 2,
  maxTeams: 6,
  uses: 'words',
  how: [
    { icon: <ListNumbers weight="fill" />, text: 'Tap a clue or a square' },
    { icon: <KeyIcon weight="fill" />, text: 'Type the word with the big keys' },
    { icon: <Trophy weight="fill" />, text: 'Right words fill in your color' },
  ],
  rounds: { label: 'Rounds', min: 1, max: 10, default: 3 },
  powers: POWERS,
  background: 'radial-gradient(circle at 2px 2px, rgba(36,28,61,0.10) 1.5px, transparent 0) 0 0 / 26px 26px, radial-gradient(120% 90% at 50% 10%, #c9d2ff 0%, #9aa8f2 60%, #7d8be0 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the corkboard' },
    { id: 'board', label: 'Corkboard', hint: 'The framed board the puzzle is pinned to' },
    { id: 'square', label: 'Letter square', hint: 'One square of the crossword' },
    { id: 'pin', label: 'Push pin', hint: 'The pins in the corners' },
    { id: 'key', label: 'Letter key', hint: 'One big key on the keyboard' },
    { id: 'clue', label: 'Clue card', hint: 'The card that shows the chosen clue' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
