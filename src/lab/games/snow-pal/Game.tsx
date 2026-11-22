import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, Keyboard, Snowflake, X as XIcon } from '@phosphor-icons/react';
import type { MultipleChoiceQuestion } from '../../../data/types';
import type { LabCtx, LabDef, LabPower } from '../../types';
import type { WordPair } from '../../words';
import { ALPHABET, cpuLetter, hidden, hits, lost as lostOf, PIECES, solved, VOWELS } from './rules';

// Save the Snow Pal (Game Lab, a kind guess-the-word game): guess the
// letters of a word from its clue on a big keyboard. Each miss melts one
// piece of the friend (hat, nose, arms...), the puddle grows and the sun
// peeks out; a solve and the friend dances. Four looks, picked on the board
// before the first word and remembered on this device.

type Look = 'snow' | 'ice' | 'sand' | 'balloon';
const LOOKS: { id: Look; name: string }[] = [
  { id: 'snow', name: 'Snow Pal' },
  { id: 'ice', name: 'Ice Pop' },
  { id: 'sand', name: 'Sand Castle' },
  { id: 'balloon', name: 'Balloons' },
];
const LOOK_KEY = 'gamify:lab:snow-pal:look';
function readLook(): Look {
  try { const v = localStorage.getItem(LOOK_KEY); if (v && LOOKS.some((l) => l.id === v)) return v as Look; } catch { /* storage blocked */ }
  return 'snow';
}
function saveLook(l: Look) { try { localStorage.setItem(LOOK_KEY, l); } catch { /* storage blocked */ } }

const POWERS: LabPower[] = [
  { id: 'cocoa', name: 'Hot Cocoa', desc: 'One lost piece comes back.', enter: 'drop', art: <Art kind="cocoa" /> },
  { id: 'vowel', name: 'Vowel Finder', desc: 'The vowels in the word light up.', enter: 'zoom', art: <Art kind="vowel" /> },
  { id: 'plow', name: 'Snowplow', desc: 'The plow digs up one letter for you.', enter: 'spin', art: <Art kind="plow" /> },
  { id: 'double', name: 'Double Points', desc: 'Your letters count two times this turn.', enter: 'spin', art: <Art kind="double" /> },
  { id: 'extra', name: 'Snow Day', desc: 'Your next miss this turn costs nothing.', enter: 'drop', art: <Art kind="extra" /> },
  { id: 'sneeze', name: 'Sneeze', desc: 'Achoo! Everything wobbles. Hold on!', silly: true, art: <Art kind="sneeze" /> },
  { id: 'brain', name: 'Brain Freeze', desc: 'Brrr! The keys froze. Tap the ice to crack it.', silly: true, art: <Art kind="brain" /> },
];

// What a lost piece is called in each look.
const LOOK_WORDS: Record<Look, { lose: string; gone: string; back: string }> = {
  snow: { lose: 'A piece melted', gone: 'All melted! A new friend', back: 'Frozen back on!' },
  ice: { lose: 'A stripe melted', gone: 'All melted! A new treat', back: 'Frozen back on!' },
  sand: { lose: 'A tower washed away', gone: 'All washed away! A new castle', back: 'Built back up!' },
  balloon: { lose: 'A balloon floated off', gone: 'All floated off! New balloons', back: 'A balloon came back!' },
};

// Each team (or the solo player) works on its own word.
interface WordState { pair: WordPair; guessed: string[]; refrozen: number }
const asQuestion = (p: WordPair): MultipleChoiceQuestion => ({ id: `word-${p.word}`, kind: 'mc', prompt: p.clue, choices: [p.word], correctIndex: 0 });
const HITS_PER_TURN = 3;

type Mode = 'look' | 'pick' | 'busy';

function Play({ ctx }: { ctx: LabCtx }) {
  const c = useRef(ctx); c.current = ctx;
  const [look, setLook] = useState<Look>(readLook);
  const [started, setStarted] = useState(false);
  const words = useRef<WordPair[]>([]);
  const wi = useRef(0);
  const states = useRef<Record<string, WordState>>({});
  const [, setVersion] = useState(0);
  const bump = () => setVersion((v) => v + 1);
  const [mode, setMode] = useState<Mode>('look');
  const modeRef = useRef(mode); modeRef.current = mode;
  const [glow, setGlow] = useState(false);
  const [double, setDouble] = useState(false);
  const doubleRef = useRef(false); doubleRef.current = double;
  const freeMiss = useRef(false);
  const turnHits = useRef(0);
  const [sneezing, setSneezing] = useState(false);
  const [ice, setIce] = useState(0); // taps left to crack the frozen keys
  const [dance, setDance] = useState(false);
  const [plow, setPlow] = useState(0);
  const [plowing, setPlowing] = useState(false);
  const plowingRef = useRef(false);
  const [cocoa, setCocoa] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [last, setLast] = useState<{ letter: string; hit: boolean; id: number } | null>(null);
  const me = ctx.player.id;
  const cur = states.current[me];
  const pair = cur?.pair ?? null;
  const guessed = cur?.guessed ?? [];
  const word = pair?.word ?? '';
  const lost = lostOf(word, guessed, cur?.refrozen ?? 0);
  const lw = LOOK_WORDS[look];

  const get = () => states.current[c.current.player.id];
  function put(patch: Partial<WordState>) {
    const id = c.current.player.id, s = states.current[id];
    if (!s) return;
    states.current[id] = { ...s, ...patch };
    bump();
  }
  function newWord(id: string) {
    if (!words.current.length || wi.current >= words.current.length) { words.current = c.current.words({ min: 3, max: 9 }); wi.current = 0; }
    states.current[id] = { pair: words.current[wi.current++], guessed: [], refrozen: 0 };
    setReveal(false); setDance(false); setGlow(false); setLast(null);
    bump();
  }

  function pickLook(l: Look) {
    setLook(l); saveLook(l);
    c.current.sfx.pop();
    setStarted(true);
  }

  // The computer team picks the remembered look on its own.
  useEffect(() => {
    if (started || !ctx.cpu) return;
    const id = window.setTimeout(() => pickLook(look), 1800);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Every turn: the team's own word and its clue are the question. A right
  // letter keeps the turn going (up to three); a miss passes it on. Solo:
  // the letters are the play, one word a round.
  useEffect(() => {
    if (!started) return;
    const x = c.current;
    if (!states.current[x.player.id]) newWord(x.player.id);
    setDouble(false); setGlow(false); setReveal(false); setDance(false); setLast(null); setIce(0);
    freeMiss.current = false; turnHits.current = 0;
    x.setHeld(x.player.id, []);
    setMode('busy');
    const id = window.setTimeout(() => setMode('pick'), 500);
    return () => window.clearTimeout(id);
  }, [ctx.taken, started]); // eslint-disable-line react-hooks/exhaustive-deps

  function endTurn(delay = 1100) { setMode('busy'); window.setTimeout(() => c.current.next(), delay); }

  async function earn() {
    const x = c.current, s = get(); if (!s) return;
    const w = s.pair.word, g = s.guessed;
    setMode('busy');
    const p = await x.power(0.35, (pw) => {
      if (pw.id === 'cocoa') return lostOf(w, g, s.refrozen) > 0;
      if (pw.id === 'vowel') return hidden(w, g).some((l) => VOWELS.has(l));
      if (pw.id === 'plow') return hidden(w, g).length > 1 && !plowingRef.current;
      return true;
    });
    if (p) fire(p);
    if (modeRef.current === 'busy') setMode('pick');
  }

  function fire(p: LabPower) {
    const x = c.current;
    if (p.id === 'cocoa') { setCocoa((n) => n + 1); x.sfx.freeze(); window.setTimeout(() => { const s = get(); if (s) put({ refrozen: s.refrozen + 1 }); c.current.sfx.build(); c.current.say(LOOK_WORDS[look].back); }, 700); }
    if (p.id === 'vowel') { setGlow(true); x.sfx.magnet(); }
    if (p.id === 'plow') {
      setPlow((n) => n + 1); setPlowing(true); plowingRef.current = true; x.sfx.whoosh();
      const w0 = get()?.pair.word;
      window.setTimeout(() => {
        plowingRef.current = false;
        const s = get();
        if (!s || s.pair.word !== w0) return;
        const h = hidden(s.pair.word, s.guessed);
        const l = h[Math.floor(Math.random() * h.length)];
        if (!l || h.length < 2) return;
        put({ guessed: [...s.guessed, l] });
        c.current.points(hits(s.pair.word, l)); c.current.sfx.bell();
        setLast({ letter: l, hit: true, id: Date.now() });
      }, 900);
    }
    if (p.id === 'double') { setDouble(true); x.setHeld(x.player.id, [p]); x.sfx.coin(); }
    if (p.id === 'extra') { freeMiss.current = true; x.setHeld(x.player.id, [p]); x.sfx.chest(); }
    if (p.id === 'sneeze') { setSneezing(true); window.setTimeout(() => setSneezing(false), 700); x.sfx.boing(); x.say('Achoo!', 'oops'); }
    if (p.id === 'brain') { setIce(3); x.sfx.freeze(); }
  }

  function guess(l: string) {
    const x = c.current, s = get();
    if (modeRef.current !== 'pick' || ice > 0 || !s || s.guessed.includes(l)) return;
    const w = s.pair.word;
    const g = [...s.guessed, l];
    const n = hits(w, l);
    let refrozen = s.refrozen;
    setLast({ letter: l, hit: n > 0, id: Date.now() });
    if (n > 0) {
      x.points(n * (doubleRef.current ? 2 : 1)); x.sfx.note(4 + g.filter((k) => w.includes(k)).length); x.sfx.coin();
      if (n > 1) x.say(`${n} ${l}s!`);
    } else if (freeMiss.current) {
      freeMiss.current = false; refrozen += 1; x.setHeld(x.player.id, []);
      x.sfx.bump(); x.say('Snow Day! No piece lost');
    } else {
      x.sfx.slideDown(); window.setTimeout(() => c.current.sfx.splash(), 250);
    }
    put({ guessed: g, refrozen });
    // The word is done: a dance, or a gentle "all gone" and a new one.
    if (solved(w, g)) {
      setMode('busy'); setDance(true);
      const bonus = 3 + (x.solo ? PIECES - lostOf(w, g, refrozen) : 0);
      x.points(bonus); x.log(asQuestion(s.pair), true);
      x.sfx.cheer(); x.say('You saved it!', 'big'); x.burst(0.3, 0.4, 'big');
      window.setTimeout(() => { setDance(false); delete states.current[c.current.player.id]; c.current.next(); }, 2800);
      return;
    }
    if (lostOf(w, g, refrozen) >= PIECES) {
      setMode('busy'); setReveal(true);
      x.log(asQuestion(s.pair), false);
      x.sfx.oops(); x.say(LOOK_WORDS[look].gone);
      window.setTimeout(() => { delete states.current[c.current.player.id]; c.current.next(); }, 3000);
      return;
    }
    if (n > 0) {
      turnHits.current += 1;
      if (!x.solo && turnHits.current >= HITS_PER_TURN) { x.say('Great turn!'); endTurn(1300); return; }
      void earn();
      return;
    }
    if (refrozen === s.refrozen) x.say(LOOK_WORDS[look].lose, 'oops');
    if (!x.solo) endTurn(1300);
  }

  // The computer guesses on its own, after a little think.
  useEffect(() => {
    if (!ctx.cpu || mode !== 'pick' || !pair) return;
    const id = window.setTimeout(() => {
      if (ice > 0) { setIce(0); c.current.sfx.crash(); return; }
      guess(cpuLetter(word, get()?.guessed ?? [], c.current.cpuRight()));
    }, 1600 + Math.random() * 900);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard letters work too.
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (c.current.cpu || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toUpperCase();
      if (k.length === 1 && k >= 'A' && k <= 'Z') guess(k);
    };
    window.addEventListener('keydown', on);
    return () => window.removeEventListener('keydown', on);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  function crack() {
    if (ice <= 0) return;
    const n = ice - 1; setIce(n);
    if (n === 0) { c.current.sfx.crash(); c.current.say('Crack!'); } else c.current.sfx.bump();
  }

  const box = useRef<HTMLDivElement>(null);
  const shape = useShape(box);
  const tall = shape > 0.95;
  const mid = !tall && shape > 0.72;
  const still = ctx.still;
  const canPick = mode === 'pick' && !ctx.cpu;
  const glowSet = useMemo(() => (glow ? new Set(hidden(word, guessed).filter((l) => VOWELS.has(l))) : new Set<string>()), [glow, word, guessed]);
  const clue = pair?.clue ?? '';
  const clueSize = clue.length > 90 ? 4 : clue.length > 50 ? 4.4 : 5.2;
  const letterSize = word.length > 7 ? 7.5 : 9;

  return (
    <div ref={box} className="absolute inset-0 grid place-items-center">
      <motion.div className="relative lab-fit" style={{ '--ar': tall ? 0.8 : mid ? 1.25 : 1.5, '--u': tall ? '0.66cqw' : mid ? '0.8cqw' : '1cqh', containerType: 'size' } as CSSProperties}
        animate={sneezing && ctx.shake ? { x: [0, -12, 10, -6, 4, 0], rotate: [0, -1.2, 1, -0.6, 0] } : { x: 0, rotate: 0 }} transition={{ duration: 0.7 }}>
        {/* The scene: the friend in its world. */}
        <div className={`absolute left-0 top-0 ${tall ? "w-full h-[44%]" : "w-[47%] h-[64%]"} rounded-[calc(var(--u)*3)] border-heavy border-border overflow-hidden bg-[#cfe6ff]`} style={{ boxShadow: '0 calc(var(--u)*1) 0 #000, 0 calc(var(--u)*3) calc(var(--u)*5) rgba(36,28,61,0.3)' }}>
          <svg viewBox={tall ? '-90 0 380 185' : '0 0 200 185'} preserveAspectRatio={tall ? 'xMidYMax meet' : 'xMidYMid slice'} className="w-full h-full" style={{ overflow: 'visible' }} aria-label={`${LOOKS.find((l) => l.id === look)?.name}: ${PIECES - lost} pieces left`} role="img">
            <Scene look={look} lost={lost} dance={dance} still={still} />
          </svg>
          <AnimatePresence>
            {cocoa > 0 && !still && (
              <motion.span key={`c${cocoa}`} className="absolute left-[40%] top-[30%] w-[22%] [&>svg]:w-full" initial={{ x: '-180%', y: '-120%', rotate: -40, opacity: 0 }} animate={{ x: 0, y: 0, rotate: [0, 20, -10, 0], opacity: [0, 1, 1, 0] }} transition={{ duration: 1.3 }} exit={{ opacity: 0 }}>
                <Art kind="cocoa" />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* The clue, the word and how many pieces are left. */}
        <div className={`absolute right-0 ${tall ? "top-[46%] w-full h-[28%]" : "top-0 w-[51%] h-[64%]"} grid grid-rows-[auto_1fr_auto] gap-[calc(var(--u)*2)]`}>
          <div className="rounded-[calc(var(--u)*3)] border-bold border-border bg-surface px-[calc(var(--u)*2.5)] py-[calc(var(--u)*2)] flex items-center gap-[calc(var(--u)*2)] min-h-[calc(var(--u)*22)]" style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000' }}>
            <span className="shrink-0 w-[calc(var(--u)*9)] h-[calc(var(--u)*9)] rounded-full border-std border-border bg-accent grid place-items-center" aria-hidden="true"><Snowflake weight="fill" className="w-[60%] h-[60%]" /></span>
            <p className="font-bold leading-snug text-balance m-0" style={{ fontSize: `calc(var(--u)*${clueSize})` }} aria-live="polite">{clue}</p>
          </div>
          <div className="relative flex flex-wrap items-center justify-center content-center gap-[calc(var(--u)*1.4)]" aria-label="The word">
            {Array.from(word).map((ch, i) => {
              const open = guessed.includes(ch) || reveal;
              return (
                <motion.span key={`${word}-${i}`} className="relative grid place-items-center rounded-[calc(var(--u)*1.6)] border-std border-border bg-surface"
                  style={{ width: `calc(var(--u)*${letterSize})`, height: `calc(var(--u)*${letterSize * 1.2})`, boxShadow: '0 calc(var(--u)*0.6) 0 #000' }}
                  initial={still ? false : { y: -40, opacity: 0, rotate: -12 }} animate={dance && !still ? { y: [0, -14, 0], rotate: [0, i % 2 ? 8 : -8, 0], opacity: 1 } : { y: 0, opacity: 1, rotate: 0 }}
                  transition={dance ? { duration: 0.6, repeat: 3, delay: i * 0.06 } : { type: 'spring', stiffness: 260, damping: 14, delay: i * 0.05 }}>
                  <AnimatePresence>
                    {open && (
                      <motion.span key="l" className="font-display leading-none" style={{ fontSize: `calc(var(--u)*${letterSize * 0.75})`, color: guessed.includes(ch) ? '#241c3d' : '#c0465e' }}
                        initial={still ? false : { scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 12 }}>{ch}</motion.span>
                    )}
                  </AnimatePresence>
                </motion.span>
              );
            })}
            <AnimatePresence>
              {plowing && !still && (
                <motion.span key={`p${plow}`} onAnimationComplete={() => setPlowing(false)} className="absolute top-1/2 -translate-y-1/2 w-[calc(var(--u)*22)] [&>svg]:w-full pointer-events-none" initial={{ left: '-30%' }} animate={{ left: '110%' }} exit={{ opacity: 0 }} transition={{ duration: 1.4, ease: 'easeInOut' }}>
                  <Art kind="plow" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex items-center justify-center gap-[calc(var(--u)*1.2)]" aria-label={`${PIECES - lost} of ${PIECES} pieces left`}>
            {Array.from({ length: PIECES }, (_, i) => (
              <motion.span key={i} className="w-[calc(var(--u)*6)] h-[calc(var(--u)*6)] [&>svg]:w-full [&>svg]:h-full" animate={{ scale: i < PIECES - lost ? 1 : 0.7, opacity: i < PIECES - lost ? 1 : 0.35, rotate: i < PIECES - lost ? 0 : 30 }} transition={{ type: 'spring', stiffness: 300, damping: 12 }}>
                <svg viewBox="0 0 40 40" aria-hidden="true"><path d="M20 3v34M5 11.5l30 17M5 28.5l30-17" stroke={i < PIECES - lost ? '#241c3d' : '#7383ad'} strokeWidth="4.5" strokeLinecap="round" /><circle cx="20" cy="20" r="6" fill={i < PIECES - lost ? '#b4c4fb' : '#e9eefe'} stroke="#000" strokeWidth="2.5" /></svg>
              </motion.span>
            ))}
            {double && <motion.span className="ml-[calc(var(--u)*1)] font-display text-[calc(var(--u)*5)] px-[calc(var(--u)*1.5)] rounded-full border-std border-border bg-accent" initial={still ? false : { scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }}>x2</motion.span>}
          </div>
        </div>

        {/* The big keyboard. */}
        <div className={`absolute left-0 right-0 bottom-0 ${tall ? "h-[24%]" : "h-[33%]"} rounded-[calc(var(--u)*3)] border-bold border-border bg-[#e9eefe] p-[calc(var(--u)*1.6)] grid grid-rows-2 gap-[calc(var(--u)*1.2)]`} style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000', gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }} aria-label="Letters">
          {ALPHABET.map((l, i) => {
            const used = guessed.includes(l);
            const hit = used && word.includes(l);
            const glowing = glowSet.has(l);
            return (
              <motion.button key={l} type="button" disabled={!canPick || used || ice > 0} onClick={() => guess(l)} aria-label={`Letter ${l}${used ? (hit ? ', in the word' : ', not in the word') : ''}`}
                className={`relative rounded-[calc(var(--u)*1.6)] border-std border-border font-display leading-none grid place-items-center disabled:cursor-default ${hit ? 'bg-[#9fe7a0]' : used ? 'bg-[#cdd7fb] text-[#7383ad]' : 'bg-surface'}`}
                style={{ fontSize: 'calc(var(--u)*6.4)', boxShadow: used ? 'none' : '0 calc(var(--u)*0.6) 0 #000' }}
                animate={sneezing && !still ? { rotate: [0, (i % 3 - 1) * 12, 0], y: [0, -5, 0] } : last?.letter === l && !still ? (last.hit ? { scale: [1, 1.3, 1], y: [0, -8, 0] } : { x: [0, -6, 6, -4, 0] }) : { scale: 1, y: used ? 'calc(var(--u)*0.5)' : 0 }}
                transition={{ duration: 0.45, delay: sneezing ? i * 0.02 : 0 }}
                whileHover={canPick && !used && !still ? { scale: 1.08 } : undefined} whileTap={canPick && !used ? { scale: 0.92, y: 4 } : undefined}>
                {l}
                {used && <span className="absolute top-[calc(var(--u)*0.4)] right-[calc(var(--u)*0.4)] w-[38%] aspect-square rounded-full border-thin border-border grid place-items-center" style={{ background: hit ? '#fbfcf8' : '#f5a08c' }} aria-hidden="true">{hit ? <Check weight="bold" className="w-[70%] h-[70%]" /> : <XIcon weight="bold" className="w-[64%] h-[64%]" />}</span>}
                {glowing && <motion.span aria-hidden="true" className="absolute -inset-[calc(var(--u)*0.6)] rounded-[calc(var(--u)*1.8)] border-[calc(var(--u)*0.7)] border-[#f6c544]" animate={still ? undefined : { opacity: [0.4, 1, 0.4], scale: [1, 1.06, 1] }} transition={{ duration: 2, repeat: Infinity }} />}
              </motion.button>
            );
          })}
          <AnimatePresence>
            {ice > 0 && (
              <motion.button type="button" key="ice" onClick={crack} aria-label={`Frozen keys. Tap ${ice} times to crack the ice`}
                className="absolute inset-0 rounded-[calc(var(--u)*3)] border-bold border-border grid place-items-center font-display text-[calc(var(--u)*8)] text-[#241c3d]"
                style={{ background: 'linear-gradient(135deg, rgba(220,240,255,0.92), rgba(160,205,245,0.92))', backdropFilter: 'blur(2px)' }}
                initial={still ? { opacity: 0 } : { scaleY: 0, opacity: 0 }} animate={{ scaleY: 1, opacity: 1, x: ice < 3 && !still ? [0, -6, 6, 0] : 0 }} exit={still ? { opacity: 0 } : { scale: 1.2, opacity: 0, rotate: 4 }} transition={{ type: 'spring', stiffness: 260, damping: 16 }}>
                <svg viewBox="0 0 300 80" className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" aria-hidden="true">
                  {ice <= 2 && <path d="M150 0 L140 30 L160 45 L150 80" stroke="#fff" strokeWidth="2.5" fill="none" />}
                  {ice <= 1 && <path d="M60 0 L75 35 L55 60 L70 80 M240 0 L225 40 L250 80" stroke="#fff" strokeWidth="2.5" fill="none" />}
                </svg>
                <span className="relative">Tap the ice!</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {/* Before the first word: pick a look. */}
        <AnimatePresence>
          {!started && (
            <motion.div className="absolute inset-0 z-10 rounded-[calc(var(--u)*3)] border-heavy border-border bg-[#fbfcf8]/95 grid grid-rows-[auto_1fr] p-[calc(var(--u)*3)] gap-[calc(var(--u)*2.5)]" style={{ boxShadow: '0 calc(var(--u)*1) 0 #000' }}
              initial={still ? false : { y: '-8%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={still ? { opacity: 0 } : { y: '-120%', rotate: -4 }} transition={{ type: 'spring', stiffness: 140, damping: 16 }}>
              <h2 className="m-0 text-center font-heading font-bold text-[calc(var(--u)*5.5)]">Pick a look</h2>
              <div className="grid grid-cols-4 gap-[calc(var(--u)*2.5)] min-h-0">
                {LOOKS.map((l, i) => (
                  <motion.button key={l.id} type="button" onClick={() => pickLook(l.id)} disabled={ctx.cpu}
                    className={`grid grid-rows-[1fr_auto] rounded-[calc(var(--u)*2.5)] border-bold overflow-hidden bg-white min-h-0 ${look === l.id ? 'border-border ring-[calc(var(--u)*0.8)] ring-[#fdfd94]' : 'border-border'}`}
                    style={{ boxShadow: '0 calc(var(--u)*0.8) 0 #000' }}
                    initial={still ? false : { y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 + i * 0.08, type: 'spring', stiffness: 220, damping: 16 }}
                    whileHover={still ? undefined : { scale: 1.04, y: -4 }} whileTap={{ scale: 0.97 }}>
                    <svg viewBox="0 0 200 185" preserveAspectRatio="xMidYMid slice" className="w-full h-full min-h-0" aria-hidden="true"><Scene look={l.id} lost={0} dance={false} still /></svg>
                    <span className="font-bold text-[calc(var(--u)*4.2)] py-[calc(var(--u)*1.4)] border-t-2 border-border bg-surface">{l.name}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// Tall boxes (iPad portrait) stack the scene over the word and keys.
// Height over width of the board's box: tall boxes stack, middling ones get a squarer board.
function useShape(ref: RefObject<HTMLDivElement | null>) {
  const [shape, setShape] = useState(0.6);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setShape(e.contentRect.height / Math.max(1, e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return shape;
}

// ---------- The four looks, each a full scene (viewBox 200 x 185) ----------

function Scene({ look, lost, dance, still }: { look: Look; lost: number; dance: boolean; still: boolean }) {
  if (look === 'ice') return <IcePop lost={lost} dance={dance} still={still} />;
  if (look === 'sand') return <SandCastle lost={lost} dance={dance} still={still} />;
  if (look === 'balloon') return <BalloonBunch lost={lost} dance={dance} still={still} />;
  return <SnowPal lost={lost} dance={dance} still={still} />;
}

const FB = { transformBox: 'fill-box', transformOrigin: 'center' } as const;
const SPRING = { type: 'spring', stiffness: 120, damping: 11, mass: 1.2 } as const;

// One piece: on the friend, or fallen where it lands.
function Piece({ gone, to, children, shift = 0, slow }: { gone: boolean; to: { x: number; y: number; rotate?: number; opacity?: number; scale?: number }; children: ReactNode; shift?: number; slow?: number }) {
  return (
    <motion.g style={FB} initial={false} animate={gone ? { x: to.x, y: to.y, rotate: to.rotate ?? 0, opacity: to.opacity ?? 1, scale: to.scale ?? 1 } : { x: 0, y: shift, rotate: 0, opacity: 1, scale: 1 }}
      transition={gone && slow ? { duration: slow, ease: [0.45, 0, 0.7, 1] } : SPRING}>
      {children}
    </motion.g>
  );
}

function Sun({ lost, still, x = 160, y = 34 }: { lost: number; still: boolean; x?: number; y?: number }) {
  return (
    <motion.g initial={false} animate={{ y: 26 - lost * 4.5 }} transition={{ type: 'spring', stiffness: 60, damping: 14 }}>
      <motion.g style={{ transformOrigin: `${x}px ${y}px` }} animate={still ? undefined : { rotate: 360 }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}>
        {Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2; return <line key={i} x1={x + Math.cos(a) * 20} y1={y + Math.sin(a) * 20} x2={x + Math.cos(a) * 27} y2={y + Math.sin(a) * 27} stroke="#f6c544" strokeWidth="4" strokeLinecap="round" />; })}
      </motion.g>
      <circle cx={x} cy={y} r="16" fill="#fdd65a" stroke="#000" strokeWidth="2" />
      <path d={`M${x - 6} ${y + 3}q6 5 12 0`} stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <circle cx={x - 5} cy={y - 3} r="1.6" /><circle cx={x + 5} cy={y - 3} r="1.6" />
    </motion.g>
  );
}

function Cloud({ x, y, s = 1, drift = 0 }: { x: number; y: number; s?: number; drift?: number }) {
  return (
    <motion.g initial={false} animate={{ x: drift }} transition={{ type: 'spring', stiffness: 40, damping: 14 }}>
      <path d={`M${x} ${y}a${10 * s} ${10 * s} 0 0 1 ${18 * s} ${-6 * s}a${12 * s} ${12 * s} 0 0 1 ${22 * s} ${2 * s}a${8 * s} ${8 * s} 0 0 1 ${4 * s} ${14 * s}h${-44 * s}a${6 * s} ${6 * s} 0 0 1 0 ${-10 * s}z`} fill="#fff" stroke="#000" strokeWidth="1.8" />
    </motion.g>
  );
}

function Drips({ on, still, xs, y, color }: { on: boolean; still: boolean; xs: number[]; y: number; color: string }) {
  if (!on || still) return null;
  return <>{xs.map((x, i) => <motion.path key={i} d={`M${x} ${y}q-2.5 4 0 6q2.5-2 0-6z`} fill={color} stroke="#000" strokeWidth="0.8" initial={{ y: 0, opacity: 0 }} animate={{ y: [0, 14], opacity: [0, 1, 0] }} transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.45, ease: 'easeIn' }} />)}</>;
}

function Dance({ on, still, children, ox = 100, oy = 180 }: { on: boolean; still: boolean; children: ReactNode; ox?: number; oy?: number }) {
  return (
    <motion.g style={{ transformOrigin: `${ox}px ${oy}px` }} animate={on && !still ? { rotate: [0, -9, 9, -9, 0], y: [0, -10, 0, -10, 0] } : { rotate: 0, y: 0 }} transition={on ? { duration: 1, repeat: Infinity } : { duration: 0.3 }}>
      {children}
    </motion.g>
  );
}

function SnowPal({ lost, dance, still }: { lost: number; dance: boolean; still: boolean }) {
  const sh = (y0: number) => (180 - y0) * lost * 0.02;
  return (
    <>
      <defs><linearGradient id="sp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9c8ff" /><stop offset="1" stopColor="#e4efff" /></linearGradient></defs>
      <rect x="-200" y="-120" width="600" height="305" fill="url(#sp-sky)" />
      <Sun lost={lost} still={still} />
      <Cloud x={140} y={44} s={1.1} drift={lost * 9} />
      <Cloud x={20} y={30} s={0.8} />
      {[[-60, 126, 1.2], [-28, 130, 0.8], [22, 128, 1], [48, 122, 0.8], [176, 126, 1.1], [226, 128, 0.9], [258, 124, 1.2]].map(([x, y, s], i) => (
        <g key={i}><path d={`M${x} ${y - 46 * s}l${16 * s} ${30 * s}h${-8 * s}l${12 * s} ${20 * s}h${-40 * s}l${12 * s} ${-20 * s}h${-8 * s}z`} fill="#5cae86" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" /><rect x={x - 3 * s} y={y + 4 * s} width={6 * s} height={8 * s} fill="#8a5a3b" stroke="#000" strokeWidth="1.2" /></g>
      ))}
      <path d="M-200 142q150-10 300-6t300-2v51H-200z" fill="#fbfcf8" stroke="#000" strokeWidth="2" />
      <path d="M-200 162q160-8 320 0t280-2" stroke="#cdd7fb" strokeWidth="3" fill="none" />
      <motion.ellipse cx="100" cy="176" initial={false} animate={{ rx: 26 + lost * 9, ry: 4 + lost * 1.4 }} fill="#8fc6f5" stroke="#000" strokeWidth="1.6" transition={{ type: 'spring', stiffness: 80, damping: 12 }} />
      <Dance on={dance} still={still}>
        <motion.g style={{ transformOrigin: '100px 180px' }} initial={false} animate={{ scaleY: 1 - lost * 0.02, scaleX: 1 + lost * 0.012 }} transition={{ type: 'spring', stiffness: 80, damping: 12 }}>
          <circle cx="100" cy="148" r="32" fill="#fff" stroke="#000" strokeWidth="2.2" />
          <circle cx="100" cy="104" r="24" fill="#fff" stroke="#000" strokeWidth="2.2" />
          <circle cx="100" cy="68" r="18" fill="#fff" stroke="#000" strokeWidth="2.2" />
          <path d="M84 156q16 10 32 0" stroke="#e4ecfb" strokeWidth="4" fill="none" />
          <circle cx="93.5" cy="64" r="2.6" /><circle cx="106.5" cy="64" r="2.6" />
          <path d={lost >= PIECES ? 'M93 75q7 -2 14 0' : 'M92 74q8 6 16 0'} stroke="#000" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="89" cy="71" r="2.6" fill="#f5a08c" opacity="0.7" /><circle cx="111" cy="71" r="2.6" fill="#f5a08c" opacity="0.7" />
        </motion.g>
        <Drips on={lost > 0} still={still} xs={[72, 128, 96]} y={150} color="#bfe0ff" />
        {/* Buttons */}
        <Piece gone={lost > 5} to={{ x: 0, y: 70, opacity: 0.6, scale: 0.6 }} shift={sh(110)}>
          {[96, 108, 138].map((y) => <circle key={y} cx="100" cy={y} r="3.4" fill="#241c3d" />)}
        </Piece>
        {/* Scarf */}
        <Piece gone={lost > 4} slow={2.2} to={{ x: 110, y: -95, rotate: 240, opacity: 0 }} shift={sh(86)}>
          <path d="M80 84q20 9 40 0l1 7q-21 9-42 0z" fill="#ef7d96" stroke="#000" strokeWidth="1.8" /><path d="M110 88l4 22h-8l-2-20z" fill="#ef7d96" stroke="#000" strokeWidth="1.8" /><path d="M86 87v6M94 89v6" stroke="#fdfd94" strokeWidth="2" />
        </Piece>
        {/* Right arm */}
        <Piece gone={lost > 3} to={{ x: 18, y: 66, rotate: 80 }} shift={sh(98)}>
          <path d="M123 100l28-20M144 85l4-10M144 85l9 2" stroke="#7a4b2a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </Piece>
        {/* Left arm */}
        <Piece gone={lost > 2} to={{ x: -16, y: 68, rotate: -80 }} shift={sh(98)}>
          <path d="M77 100l-28-20M56 85l-4-10M56 85l-9 2" stroke="#7a4b2a" strokeWidth="3.4" strokeLinecap="round" fill="none" />
        </Piece>
        {/* Carrot nose */}
        <Piece gone={lost > 1} to={{ x: 36, y: 102, rotate: 100 }} shift={sh(70)}>
          <path d="M100 67l17 3-17 4z" fill="#f39a6b" stroke="#000" strokeWidth="1.6" strokeLinejoin="round" />
        </Piece>
        {/* Hat */}
        <Piece gone={lost > 0} to={{ x: -64, y: 116, rotate: -110 }} shift={sh(40)}>
          <rect x="82" y="47" width="36" height="6" rx="2" fill="#241c3d" stroke="#000" strokeWidth="1.6" />
          <rect x="88" y="26" width="24" height="23" rx="2" fill="#241c3d" stroke="#000" strokeWidth="1.6" />
          <rect x="88" y="40" width="24" height="5" fill="#6aa9e9" />
        </Piece>
      </Dance>
    </>
  );
}

function IcePop({ lost, dance, still }: { lost: number; dance: boolean; still: boolean }) {
  const stripes = ['#ef7d96', '#f5a08c', '#fdfd94', '#8fe3a0', '#7fd6e3', '#b4c4fb', '#c58ce8'];
  return (
    <>
      <defs><linearGradient id="ip-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7fd0ff" /><stop offset="1" stopColor="#d8f2ff" /></linearGradient></defs>
      <rect x="-200" y="-120" width="600" height="305" fill="url(#ip-sky)" />
      <Sun lost={lost + 1} still={still} />
      <Cloud x={24} y={36} s={0.9} drift={-lost * 3} />
      <path d="M-200 112h600v20H-200z" fill="#3f9fd8" stroke="#000" strokeWidth="1.6" />
      <motion.path d="M-200 114q12-5 25 0t25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0 25 0" stroke="#fff" strokeWidth="2.5" fill="none" animate={still ? undefined : { x: [0, -25] }} transition={{ duration: 3, repeat: Infinity, ease: 'linear' }} />
      <path d="M-200 128q160-8 320-2t280 0v59H-200z" fill="#f6dfa0" stroke="#000" strokeWidth="2" />
      {[[30, 160], [160, 170], [60, 176], [140, 150]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="#c9a65a" />)}
      <g><path d="M160 150l12-40" stroke="#000" strokeWidth="2" /><path d="M146 112q26-22 52 0z" fill="#ef7d96" stroke="#000" strokeWidth="1.8" /><path d="M159 112q13-22 13 0" fill="#fbfcf8" stroke="#000" strokeWidth="1.2" /></g>
      <motion.ellipse cx="100" cy="172" initial={false} animate={{ rx: 18 + lost * 9, ry: 4 + lost * 1.3 }} fill={stripes[Math.max(0, lost - 1)]} stroke="#000" strokeWidth="1.6" opacity="0.85" transition={{ type: 'spring', stiffness: 80, damping: 12 }} />
      <Dance on={dance} still={still} oy={175}>
        <rect x="95" y="140" width="10" height="34" rx="4" fill="#e7c48a" stroke="#000" strokeWidth="1.8" />
        {stripes.map((col, i) => {
          const y = 40 + i * 14.5;
          const body = <rect x="72" y={y} width="56" height={i === 0 ? 18 : 16} rx={i === 0 ? 14 : 3} fill={col} stroke="#000" strokeWidth="2" />;
          if (i === stripes.length - 1) return <g key={i}>{body}</g>;
          return <Piece key={i} gone={lost > i} slow={1.6} to={{ x: (i % 2 ? 8 : -8), y: 120 - y, scale: 0.3, opacity: 0 }}>{body}</Piece>;
        })}
        <circle cx="90" cy="134" r="2.4" /><circle cx="110" cy="134" r="2.4" />
        <path d="M94 139q6 4 12 0" stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <Drips on={lost > 0} still={still} xs={[74, 126, 100]} y={40 + Math.min(lost, 6) * 14.5 + 14} color={stripes[Math.min(lost, 6)]} />
      </Dance>
    </>
  );
}

function SandCastle({ lost, dance, still }: { lost: number; dance: boolean; still: boolean }) {
  const sand = '#f0cf7c';
  const block = (d: string) => <path d={d} fill={sand} stroke="#000" strokeWidth="2" strokeLinejoin="round" />;
  const sink = (dx: number) => ({ x: dx, y: 26, scale: 0.2, opacity: 0 });
  return (
    <>
      <defs><linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffc9a8" /><stop offset="1" stopColor="#ffeccc" /></linearGradient></defs>
      <rect x="-200" y="-120" width="600" height="305" fill="url(#sc-sky)" />
      <Sun lost={lost} still={still} x={40} />
      <path d="M-200 96h600v34H-200z" fill="#4aa8db" stroke="#000" strokeWidth="1.6" />
      <path d="M-200 126q150-8 300-2t300-4v65H-200z" fill="#f6dfa0" stroke="#000" strokeWidth="2" />
      {/* The waves reach a little farther with every miss. */}
      <motion.g initial={false} animate={{ x: -150 + lost * 18 }} transition={{ type: 'spring', stiffness: 40, damping: 12 }}>
        <path d="M-200 126h320q10 6 0 12q10 6 0 14q12 8-4 16H-200z" fill="#7fd6e3" stroke="#000" strokeWidth="1.8" opacity="0.9" />
        <motion.path d="M118 128q8 6 0 12q8 6 0 14" stroke="#fff" strokeWidth="3" fill="none" animate={still ? undefined : { x: [0, 4, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
      </motion.g>
      <Dance on={dance} still={still} oy={168}>
        <path d="M52 168q48-14 96 0z" fill="#e9c26a" stroke="#000" strokeWidth="2" />
        {/* Walls, the keep, the towers and the flag go one by one. */}
        <Piece slow={1.3} gone={lost > 5} to={sink(4)}>{block('M108 168v-34h30v34z')}<path d="M112 134v-5h6v5M124 134v-5h6v5" fill={sand} stroke="#000" strokeWidth="1.6" /></Piece>
        <Piece slow={1.3} gone={lost > 4} to={sink(-4)}>{block('M62 168v-34h30v34z')}<path d="M66 134v-5h6v5M78 134v-5h6v5" fill={sand} stroke="#000" strokeWidth="1.6" /></Piece>
        {block('M84 168v-26q16-12 32 0v26z')}
        <path d="M94 168v-14q6-7 12 0v14z" fill="#8a5a3b" stroke="#000" strokeWidth="1.6" />
        <Piece slow={1.3} gone={lost > 3} to={sink(0)}>{block('M86 136v-30h28v30z')}<path d="M86 106v-6h6v6M97 106v-6h6v6M108 106v-6h6v6" fill={sand} stroke="#000" strokeWidth="1.6" /><circle cx="100" cy="120" r="4" fill="#241c3d" /></Piece>
        <Piece slow={1.3} gone={lost > 2} to={sink(8)}>{block('M120 134v-38h16v38z')}<path d="M118 96l10-14 10 14z" fill="#f5a08c" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" /></Piece>
        <Piece slow={1.3} gone={lost > 1} to={sink(-8)}>{block('M64 134v-38h16v38z')}<path d="M62 96l10-14 10 14z" fill="#f5a08c" stroke="#000" strokeWidth="1.8" strokeLinejoin="round" /></Piece>
        <Piece gone={lost > 0} to={{ x: 40, y: -60, rotate: 120, opacity: 0 }}>
          <path d="M100 100V74" stroke="#000" strokeWidth="2" /><motion.path d="M100 74l16 5-16 6z" fill="#ef7d96" stroke="#000" strokeWidth="1.6" animate={still ? undefined : { skewY: [0, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity }} />
        </Piece>
      </Dance>
      {/* A crab friend who waves when the castle is saved. */}
      <g transform="translate(160 160)">
        <ellipse cx="0" cy="6" rx="12" ry="8" fill="#ef7d96" stroke="#000" strokeWidth="1.8" />
        <motion.g style={{ transformOrigin: '-10px 2px' }} animate={dance && !still ? { rotate: [0, -30, 0] } : { rotate: 0 }} transition={{ duration: 0.4, repeat: dance ? Infinity : 0 }}><path d="M-10 2l-6-8M-16-6l-4 2M-16-6l1-5" stroke="#000" strokeWidth="2" strokeLinecap="round" /></motion.g>
        <motion.g style={{ transformOrigin: '10px 2px' }} animate={dance && !still ? { rotate: [0, 30, 0] } : { rotate: 0 }} transition={{ duration: 0.4, repeat: dance ? Infinity : 0 }}><path d="M10 2l6-8M16-6l4 2M16-6l-1-5" stroke="#000" strokeWidth="2" strokeLinecap="round" /></motion.g>
        <circle cx="-4" cy="2" r="1.6" /><circle cx="4" cy="2" r="1.6" />
      </g>
    </>
  );
}

function BalloonBunch({ lost, dance, still }: { lost: number; dance: boolean; still: boolean }) {
  const balloons: [number, number, string][] = [[72, 50, '#ef7d96'], [128, 52, '#6aa9e9'], [100, 34, '#fdfd94'], [56, 78, '#8fe3a0'], [144, 80, '#c58ce8'], [100, 66, '#f5a08c']];
  const away = [[-70, -220, -30], [80, -230, 25], [10, -240, 10], [-90, -200, -40], [90, -210, 35], [-20, -230, -15]];
  return (
    <>
      <defs><linearGradient id="bb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#b4c4fb" /><stop offset="1" stopColor="#e9eefe" /></linearGradient></defs>
      <rect x="-200" y="-120" width="600" height="305" fill="url(#bb-sky)" />
      <Sun lost={lost} still={still} x={170} y={30} />
      <Cloud x={14} y={26} s={0.8} drift={lost * 2} />
      <path d="M-200 150q150-10 300-4t300-2v41H-200z" fill="#8fe3a0" stroke="#000" strokeWidth="2" />
      {[[24, 160], [40, 170], [170, 164], [150, 176]].map(([x, y], i) => <path key={i} d={`M${x} ${y}l3-6 3 6`} stroke="#3c8f5c" strokeWidth="1.8" fill="none" />)}
      <Dance on={dance} still={still} oy={176}>
        {balloons.map(([x, y, col], i) => (
          <Piece key={i} gone={lost > i} slow={3.2} to={{ x: away[i][0], y: away[i][1], rotate: away[i][2] }}>
            <motion.g animate={still ? undefined : { y: [0, -3, 0], rotate: [0, i % 2 ? 3 : -3, 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity }} style={FB}>
              <path d={`M${x} ${y + 15}Q${(x + 100) / 2 + (i % 2 ? 6 : -6)} ${(y + 128) / 2} 100 128`} stroke="#241c3d" strokeWidth="1.2" fill="none" />
              <ellipse cx={x} cy={y} rx="12" ry="15" fill={col} stroke="#000" strokeWidth="2" />
              <path d={`M${x - 3} ${y + 15}l3 4 3-4z`} fill={col} stroke="#000" strokeWidth="1.4" />
              <ellipse cx={x - 4} cy={y - 6} rx="3" ry="5" fill="#fff" opacity="0.6" />
            </motion.g>
          </Piece>
        ))}
        {/* A puppy friend holding the strings. */}
        <ellipse cx="100" cy="164" rx="22" ry="14" fill="#e7b98a" stroke="#000" strokeWidth="2" />
        <circle cx="100" cy="140" r="17" fill="#e7b98a" stroke="#000" strokeWidth="2" />
        <path d="M84 132q-10 4-6 18q8-2 8-12zM116 132q10 4 6 18q-8-2-8-12z" fill="#8a5a3b" stroke="#000" strokeWidth="1.8" />
        <circle cx="94" cy="138" r="2.4" /><circle cx="106" cy="138" r="2.4" />
        <ellipse cx="100" cy="144" rx="3.4" ry="2.4" fill="#241c3d" />
        <path d={lost >= PIECES ? 'M95 150q5 -2 10 0' : 'M94 148q6 5 12 0'} stroke="#000" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <circle cx="100" cy="128" r="4" fill="#e7b98a" stroke="#000" strokeWidth="1.8" />
      </Dance>
    </>
  );
}

// ---------- Power-up pictures ----------
function Art({ kind }: { kind: string }) {
  const ring = (fill: string) => <circle cx="50" cy="50" r="44" fill={fill} stroke="#000" strokeWidth="5" />;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true">
      {kind === 'cocoa' && <>{ring('#fbe3c8')}<path d="M30 40h36v30a10 10 0 0 1-10 10H40a10 10 0 0 1-10-10z" fill="#ef7d96" stroke="#000" strokeWidth="4" /><path d="M66 46h6a8 8 0 0 1 0 16h-6" stroke="#000" strokeWidth="4" fill="none" /><ellipse cx="48" cy="42" rx="16" ry="4" fill="#8a5a3b" stroke="#000" strokeWidth="3" /><path d="M40 32q-4-6 0-12M50 32q-4-6 0-12M58 32q-4-6 0-12" stroke="#000" strokeWidth="3" fill="none" strokeLinecap="round" /></>}
      {kind === 'vowel' && <>{ring('#fdfd94')}<circle cx="44" cy="44" r="18" fill="#e9eefe" stroke="#000" strokeWidth="5" /><path d="M57 57l18 18" stroke="#000" strokeWidth="8" strokeLinecap="round" /><text x="44" y="52" textAnchor="middle" fontSize="22" fontWeight="900" fontFamily="sans-serif">A</text></>}
      {kind === 'plow' && <>{ring('#b4c4fb')}<rect x="34" y="38" width="34" height="22" rx="4" fill="#f6c544" stroke="#000" strokeWidth="4" /><rect x="44" y="28" width="18" height="12" rx="3" fill="#7fd6e3" stroke="#000" strokeWidth="3" /><path d="M20 44l10 4v14l-10 4z" fill="#ef7d96" stroke="#000" strokeWidth="3.5" strokeLinejoin="round" /><circle cx="42" cy="66" r="7" fill="#241c3d" stroke="#000" strokeWidth="3" /><circle cx="62" cy="66" r="7" fill="#241c3d" stroke="#000" strokeWidth="3" /></>}
      {kind === 'double' && <>{ring('#fff6b0')}<text x="50" y="64" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="2" fill="#f6c544">x2</text></>}
      {kind === 'extra' && <>{ring('#e9eefe')}<path d="M50 18v64M22 34l56 32M22 66l56-32" stroke="#6aa9e9" strokeWidth="7" strokeLinecap="round" /><circle cx="50" cy="50" r="10" fill="#fff" stroke="#000" strokeWidth="4" /><text x="78" y="86" textAnchor="middle" fontSize="24" fontWeight="900" fontFamily="sans-serif" stroke="#000" strokeWidth="1.5" fill="#8fe3a0">+1</text></>}
      {kind === 'sneeze' && <>{ring('#f5a08c')}<circle cx="44" cy="52" r="20" fill="#fff" stroke="#000" strokeWidth="4" /><path d="M36 48l4 2M52 48l-4 2" stroke="#000" strokeWidth="4" strokeLinecap="round" /><ellipse cx="44" cy="62" rx="5" ry="4" fill="#241c3d" /><path d="M66 40l12-6M68 52h14M66 64l12 6" stroke="#000" strokeWidth="4" strokeLinecap="round" /></>}
      {kind === 'brain' && <>{ring('#c9ecff')}<rect x="24" y="30" width="52" height="40" rx="8" fill="#e9f7ff" stroke="#000" strokeWidth="4" /><path d="M36 30l6 14-8 10 6 16M60 30l-4 16 10 8-6 16" stroke="#6aa9e9" strokeWidth="3" fill="none" /><circle cx="40" cy="48" r="3" /><circle cx="60" cy="48" r="3" /><path d="M42 60q8-4 16 0" stroke="#000" strokeWidth="3" fill="none" /></>}
    </svg>
  );
}

function Cover() {
  return (
    <svg viewBox="0 0 310 192" preserveAspectRatio="xMidYMid slice">
      <rect width="310" height="192" fill="#b4c4fb" />
      <svg x="8" y="8" width="170" height="176" viewBox="0 0 200 185" preserveAspectRatio="xMidYMid slice"><SnowPal lost={1} dance={false} still /></svg>
      <rect x="8" y="8" width="170" height="176" rx="12" fill="none" stroke="#000" strokeWidth="3" />
      {['S', null, 'O', 'W'].map((l, i) => (
        <g key={i}><rect x={190 + i * 28} y="70" width="24" height="30" rx="5" fill="#fbfcf8" stroke="#000" strokeWidth="2.5" />{l && <text x={202 + i * 28} y="93" textAnchor="middle" fontSize="20" fontWeight="900" fontFamily="sans-serif" fill="#241c3d">{l}</text>}</g>
      ))}
      {'ABCDEFGH'.split('').map((l, i) => (
        <g key={l}><rect x={188 + (i % 4) * 29} y={120 + Math.floor(i / 4) * 30} width="25" height="25" rx="5" fill={l === 'O' ? '#9fe7a0' : '#fbfcf8'} stroke="#000" strokeWidth="2" /><text x={200.5 + (i % 4) * 29} y={138 + Math.floor(i / 4) * 30} textAnchor="middle" fontSize="14" fontWeight="900" fontFamily="sans-serif">{l}</text></g>
      ))}
    </svg>
  );
}

const def: LabDef = {
  id: 'snow-pal',
  name: 'Save the Snow Pal',
  description: 'Read the clue and guess the letters of the word. Every miss loses a piece of your friend, so save it!',
  ways: ['teams', 'solo'],
  uses: 'words',
  how: [
    { icon: <Snowflake weight="fill" />, text: 'Read the clue' },
    { icon: <Keyboard weight="fill" />, text: 'Tap a letter in the word' },
    { icon: <XIcon weight="bold" />, text: 'A miss loses a piece, so save your friend' },
  ],
  rounds: { label: 'Rounds', min: 3, max: 20, default: 10 },
  powers: POWERS,
  background: 'radial-gradient(120% 90% at 50% 0%, #dbe6ff 0%, #b4c4fb 55%, #93a5ee 100%)',
  cover: <Cover />,
  pieces: [
    { id: 'background', label: 'Background', hint: 'Behind the board' },
    { id: 'scene-snow', label: 'Snow Pal scene', hint: 'The winter hill behind the snow pal' },
    { id: 'friend-snow', label: 'Snow Pal', hint: 'The friend, with hat, nose, arms, scarf and buttons as separate pieces' },
    { id: 'scene-ice', label: 'Ice Pop scene', hint: 'The beach behind the ice pop' },
    { id: 'friend-ice', label: 'Ice Pop', hint: 'Seven stripes that melt from the top' },
    { id: 'scene-sand', label: 'Sand Castle scene', hint: 'The beach and the waves' },
    { id: 'friend-sand', label: 'Sand Castle', hint: 'Flag, towers, keep and walls as separate pieces' },
    { id: 'scene-balloon', label: 'Balloons scene', hint: 'The park' },
    { id: 'friend-balloon', label: 'Balloon friend', hint: 'Six balloons and the friend holding them' },
    { id: 'letter-tile', label: 'Letter tile', hint: 'One space of the word' },
    { id: 'key', label: 'Keyboard key', hint: 'A letter key' },
    ...POWERS.map((p) => ({ id: `power-${p.id}`, label: p.name, hint: p.desc })),
  ],
  Play,
};
export default def;
