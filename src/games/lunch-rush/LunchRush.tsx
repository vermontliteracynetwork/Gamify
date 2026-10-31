import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Carrot, CheckCircle, Hamburger, Heart, HandTap, IceCream, Pizza, Trophy, type Icon } from '@phosphor-icons/react';
import { data, newId } from '../../data';
import { LIBRARY } from '../../data/library';
import { useMySets } from '../../data/hooks';
import type { MultipleChoiceQuestion } from '../../data/types';
import { buzz, playEffect } from '../../engine/feedback';
import { makeDeck } from '../../engine/picker';
import ResultsModal from '../../engine/ResultsModal';
import ShareQuestion from '../../engine/ShareQuestion';
import { TeamBadge } from '../../engine/TeamBadge';
import TeamSetup from '../../engine/TeamSetup';
import { addPoints, current, leaders, nextTurn, startTurns, type CpuLevel, type TurnPlayer, type TurnState } from '../../engine/turns';
import { useAsk } from '../../engine/useAsk';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { GameTopRow, SettingsPanel } from '../../settings/SettingsPanel';
import { useSettings } from '../../settings/SettingsContext';
import { useGamePool } from '../../student/session';
import { pieceColor, pieceFill, pieceImage } from '../../theme/library';
import { ThemedPage, useGameTheme } from '../../theme/useGameTheme';
import type { GameTheme } from '../../theme/types';
import { ChoiceRow, Slider, Toggle } from '../../ui/fields';
import GameWelcome from '../GameWelcome';
import SetPicker from '../SetPicker';
import SetupWizard from '../SetupWizard';
import ThemeScreen from '../ThemeScreen';
import { useSavedSetup } from '../useSavedSetup';
import { usePowerUps } from '../../engine/usePowerUps';
import { lunchRushManifest } from './manifest';
import { cpuFood, FOODS, openCounter, PATIENCE, SEATS, serve, type Counter, type Food } from './lunch';

type Phase = 'welcome' | 'theme' | 'setup' | 'play' | 'end';
type Step = 'question' | 'serve' | 'pause';
const SERVES = 2;
const FLY_MS = 450;
// Each food has its own icon and color, so a pre-reader matches by picture.
export const FOOD_ART: Record<Food, { icon: Icon; color: string }> = {
  pizza: { icon: Pizza, color: '#f6c544' },
  burger: { icon: Hamburger, color: '#f39a6b' },
  icecream: { icon: IceCream, color: '#f6a5c0' },
  carrot: { icon: Carrot, color: '#9bd35a' },
};
const SKIN = ['#f5d0b5', '#e0ac85', '#c68a5e', '#8d5a3b', '#f1c27d', '#5c3a24'];
const SHIRT = ['#6aa9e9', '#c58ce8', '#5cc3a0', '#ef7d96', '#f0d36b', '#7fd6e3'];

// Lunch Rush (roster Stage 9): a right answer earns two serves. Tap a food
// and it flies to the guest who wants it; quick serves earn a tip. Guests
// wait a few serves, never a clock, so reading is never rushed. A guest
// who waits too long just waves goodbye.
export default function LunchRush() {
  const { settings } = useSettings();
  const still = settings.motion === 'still';
  const { theme, themes, playable, choose } = useGameTheme('lunch-rush');
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const [setup, change] = useSavedSetup('lunch-rush', { setId: LIBRARY[0].id, turns: 6, who: 'teams' as 'teams' | 'solo', powerUps: true });
  const setId = sets.some((s) => s.id === setup.setId) ? setup.setId : LIBRARY[0].id;
  const picked = useMemo(() => sets.filter((s) => s.id === setId).map((set) => ({ set, starred: false })), [sets, setId]);
  const game = useGamePool(picked);
  const solo = setup.who === 'solo';
  const { ask, element, missed: soloMissed } = useAsk({ gameId: 'lunch-rush', mode: 'solo', pool: game.pool, classroomId: game.classroomId, studentId: game.studentId });
  const deck = useMemo(() => makeDeck(game.pool), [game.pool]);
  const [team, setTeam] = useState<{ players: TurnPlayer[]; level: CpuLevel }>({ players: [], level: 'medium' });
  const [phase, setPhase] = useState<Phase>('welcome');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [turns, setTurns] = useState<TurnState | null>(null);
  const [step, setStep] = useState<Step>('question');
  const [question, setQuestion] = useState<{ q: MultipleChoiceQuestion; setId?: string } | null>(null);
  const [counter, setCounter] = useState<Counter>(() => openCounter());
  const [serves, setServes] = useState(0);
  const [asked, setAsked] = useState(0);
  const [served, setServed] = useState(0);
  const [flying, setFlying] = useState<{ id: number; food: Food; seat: number | null } | null>(null);
  const [happy, setHappy] = useState<number | null>(null);
  const [banner, setBanner] = useState<{ id: number; text: string } | null>(null);
  const [missed, setMissed] = useState<MultipleChoiceQuestion[]>([]);
  const timers = useRef<number[]>([]);
  const player = turns ? current(turns) : null;
  const total = (turns?.players.length ?? 1) * setup.turns;

  useEffect(() => () => timers.current.forEach((id) => window.clearTimeout(id)), []);
  const later = (fn: () => void, ms: number) => { timers.current.push(window.setTimeout(fn, still ? Math.min(ms, 250) : ms)); };

  function begin() {
    const players = solo ? [{ id: 'solo', name: t('mm.you'), kind: 'student' as const, colorIndex: 0, score: 0 }] : team.players;
    const state = startTurns(players);
    setTurns(state); setAsked(0); setServed(0); setMissed([]); setBanner(null); setFlying(null); setHappy(null);
    setCounter(openCounter()); setServes(0);
    setPhase('play');
    askNext(state, 0);
  }
  // Power-ups a right answer brought: more serves, tips now, or double tips this turn.
  const powers = usePowerUps(lunchRushManifest, theme, setup.powerUps);
  const doubleTips = useRef(false);
  function earned(state: TurnState) {
    const it = powers.grant();
    setServes(SERVES + (it?.ability === 'serves' ? powers.amount(it) : 0));
    if (it?.ability === 'bonus') setTurns(addPoints(state, current(state).id, powers.amount(it)));
    if (it?.ability === 'double') doubleTips.current = true;
  }
  function askNext(state: TurnState, n: number) {
    if (n >= total) { end(state); return; }
    setAsked(n);
    setStep('question');
    if (solo) void ask().then((ok) => { if (!ok) { end(state); return; } earned(state); setStep('serve'); });
    else { const d = deck.next(); setQuestion({ q: d.question, setId: d.setId }); }
  }
  function onShareResult(right: boolean) {
    if (!turns || !question || !player) return;
    if (player.kind !== 'cpu' && player.kind !== 'teacher') {
      void data.logQuestion({ id: newId('log'), at: new Date().toISOString(), teamName: player.name, gameId: 'lunch-rush', mode: 'share', setId: question.setId, prompt: question.q.prompt, answer: question.q.choices[question.q.correctIndex], tries: [], ms: 0, outcome: right ? 'right' : 'skipped' });
      if (!right) setMissed((m) => (m.some((x) => x.id === question.q.id) ? m : [...m, question.q]));
    }
    setQuestion(null);
    if (right) { earned(turns); setStep('serve'); } else endTurn(turns);
  }
  function endTurn(state: TurnState) {
    doubleTips.current = false;
    const n = asked + 1;
    if (n >= total) { end(state); return; }
    const next = solo ? state : nextTurn(state);
    setTurns(next);
    askNext(next, n);
  }

  function give(food: Food) {
    if (step !== 'serve' || !turns || !player || serves <= 0) return;
    const served0 = serve(counter, food);
    const res = doubleTips.current ? { ...served0, points: served0.points * 2 } : served0;
    setStep('pause');
    setFlying({ id: Date.now(), food, seat: res.servedSeat });
    playEffect('whoosh', settings);
    const left = serves - 1;
    const scored = res.points ? addPoints(turns, player.id, res.points) : turns;
    later(() => {
      setFlying(null);
      if (res.servedSeat !== null) {
        setHappy(res.servedSeat); setServed((n) => n + 1); setTurns(scored);
        setBanner({ id: Date.now(), text: t('lr.yum', { count: res.points }) });
        playEffect('right', settings); buzz(25, settings);
        if (res.points >= 5 + PATIENCE && settings.celebrations !== 'off' && !still) void confetti({ particleCount: 40, spread: 60, origin: { y: 0.4 }, disableForReducedMotion: true });
      } else {
        setBanner({ id: Date.now(), text: t('lr.nobody') });
        playEffect('miss', settings);
      }
      if (res.left.length) later(() => setBanner({ id: Date.now() + 1, text: t('lr.bye') }), 500);
    }, FLY_MS);
    // The happy guest steps away, then the counter moves on.
    later(() => {
      setHappy(null); setCounter(res.counter); setServes(left);
      later(() => { setBanner(null); if (left > 0) setStep('serve'); else endTurn(scored); }, res.left.length ? 700 : 350);
    }, FLY_MS + 650);
  }
  function end(state: TurnState) {
    setTurns(state); setPhase('end');
    playEffect('win', settings);
    if (settings.celebrations !== 'off' && !still) void confetti({ particleCount: 90, spread: 90, origin: { y: 0.5 }, disableForReducedMotion: true });
  }
  // The computer serves on its own.
  useEffect(() => {
    if (phase !== 'play' || step !== 'serve' || player?.kind !== 'cpu') return;
    const id = window.setTimeout(() => give(cpuFood(counter)), 800);
    return () => window.clearTimeout(id);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const canServe = phase === 'play' && step === 'serve' && player?.kind !== 'cpu';
  const counterColor = pieceColor(theme, 'counter', '#ed9d75');
  const guestPics = [1, 2, 3].map((n) => pieceImage(theme, `guest-${n}`)).filter((x): x is string => !!x);
  // Wider than tall on a landscape screen, square on a portrait one, so the
  // board fills the screen without leaving empty space below.
  const boardWidth = 'min(100%, calc((100dvh - 22.5rem + var(--chrome-save, 0rem) + var(--wide-save, 0rem) - var(--lr-extra)) * var(--lr-ratio)))';
  const foodName = (f: Food) => t(`lr.food.${f}` as StringKey);

  return (
    <ThemedPage theme={theme}>
    <main className="landscape:[--wide-save:2.625rem] max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-4">
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} context="lunch-rush" />
      <GameTopRow onSettings={() => setSettingsOpen(true)} />
      {phase === 'welcome' && (
        <GameWelcome game={lunchRushManifest} cover={pieceImage(theme, 'cover')} onStart={() => setPhase(themes.length > 1 ? 'theme' : 'setup')} steps={[
          { icon: <CheckCircle weight="fill" size={22} />, text: t('lr.how1') },
          { icon: <HandTap weight="fill" size={22} />, text: t('lr.how2') },
          { icon: <Trophy weight="fill" size={22} />, text: t('lr.how3') },
        ]} />
      )}
      {phase === 'theme' && <ThemeScreen gameName={lunchRushManifest.name} current={theme} themes={themes} playable={playable} onChoose={choose} onBack={() => setPhase('welcome')} onNext={() => setPhase('setup')} />}
      {phase === 'setup' && (
        <SetupWizard onBack={() => setPhase(themes.length > 1 ? 'theme' : 'welcome')} onPlay={begin} pages={[
          ...(game.assigned ? [] : [{ id: 'questions', title: t('setup.questions'), content: <SetPicker sets={sets} value={[setId]} onChange={(ids) => change({ setId: ids[0] })} /> }]),
          { id: 'options', title: t('setup.options'), content: (
            <>
              <ChoiceRow label={t('mm.who')} value={setup.who} onChange={(v) => change({ who: v })} options={[{ value: 'teams', label: t('pd.teams') }, { value: 'solo', label: t('mm.solo') }]} />
              <Slider label={solo ? t('rh.turnsSolo') : t('rh.turns')} min={2} max={15} value={setup.turns} onChange={(v) => change({ turns: v })} />
              <Toggle label={t('pu.toggle')} hint={t('pu.toggleHint')} value={setup.powerUps} onChange={(v) => change({ powerUps: v })} />
            </>
          ) },
          ...(solo ? [] : [{ id: 'teams', title: t('setup.teams'), ready: team.players.length > 0, content: <TeamSetup mode="share" min={1} max={10} embedded onChange={(players, level) => setTeam({ players, level })} /> }]),
        ]} />
      )}
      {(phase === 'play' || phase === 'end') && turns && player && (
        <div className="grid lg:grid-cols-[1fr_260px] gap-3 lg:gap-4 items-start">
          <section className="grid gap-2 min-w-0 [--lr-extra:4.375rem] lg:[--lr-extra:0rem] [--lr-ratio:1.5] portrait:[--lr-ratio:1.05]">
            {phase === 'play' && (
              <div className="flex items-center gap-3 bg-surface border-[2.5px] border-border rounded-panel px-4 py-2" aria-live="polite">
                <TeamBadge colorIndex={player.colorIndex} size={36} />
                <span className="font-display text-xl sm:text-2xl">{step === 'question' ? t('share.whoseTurn', { name: player.name }) : player.kind === 'cpu' ? t('fr.cpuThinking') : t('lr.go', { name: player.name })}</span>
                <span className="ml-auto font-bold text-sm text-right">
                  {t('rh.turn', { n: Math.min(asked + 1, total), total })}<br />
                  <span className="inline-flex gap-1 align-middle" aria-label={t('lr.serves', { count: serves })}>
                    {Array.from({ length: Math.max(SERVES, serves) }, (_, i) => <span key={i} className="w-3.5 h-3.5 rounded-full border-2 border-border" style={{ background: i < serves ? '#f6c544' : 'transparent' }} />)}
                  </span>
                </span>
              </div>
            )}
            <div className="relative mx-auto w-full rounded-panel border-[3px] border-border overflow-hidden" role="group" aria-label={t('lr.counter')}
              style={{ ...pieceFill(theme, 'background', '#fde2c4'), aspectRatio: 'var(--lr-ratio)', maxWidth: boardWidth }}>
              {!pieceImage(theme, 'background') && <div className="absolute inset-x-0 top-0 h-[14%] border-b-[3px] border-border" style={{ background: 'repeating-linear-gradient(90deg, #e5635f 0 8%, #fbfcf8 8% 16%)' }} aria-hidden="true" />}
              <div className="absolute inset-x-0 bottom-0 h-[26%] border-t-[3px] border-border" style={{ background: counterColor }} aria-hidden="true" />
              {!pieceImage(theme, 'background') && (
                <div className="hidden portrait:flex absolute left-1/2 -translate-x-1/2 top-[19%] w-[56%] h-[14%] rounded-input border-[3px] border-border bg-[#314677] items-center justify-around px-[3%]" aria-hidden="true">
                  {FOODS.map((f) => { return <span key={f} className="h-[70%] aspect-square rounded-full border-2 border-border flex items-center justify-center" style={foodBg(theme, f)}><FoodFace theme={theme} food={f} /></span>; })}
                </div>
              )}
              {counter.seats.map((g, i) => g && (
                <div key={i} className="absolute bottom-[18%] h-[72%]" style={{ left: `${(i / SEATS) * 100 + 2}%`, width: `${100 / SEATS - 4}%` }}>
                  <AnimatePresence mode="popLayout">
                    <motion.div key={g.id} className="absolute inset-0 flex flex-col items-center justify-end gap-[5%]" role="img" aria-label={t('lr.guest', { n: i + 1, food: foodName(g.food), count: g.patience })}
                      initial={still ? false : { x: '120%', opacity: 0 }} animate={{ x: 0, opacity: 1, y: happy === i && !still ? [0, -14, 0] : 0 }} exit={still ? { opacity: 0 } : { x: '-120%', opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 24 }}>
                      <OrderBubble theme={theme} food={g.food} patience={g.patience} served={happy === i} />
                      {guestPics.length ? <img src={guestPics[g.look % guestPics.length]} alt="" className="w-[78%] h-auto block object-contain" /> : <GuestArt look={g.look} happy={happy === i} worried={g.patience <= 2} />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ))}
              <AnimatePresence>
                {flying && (() => {
                  const toX = flying.seat === null ? 50 : ((flying.seat + 0.5) / SEATS) * 100;
                  return (
                    <motion.span key={flying.id} className="absolute w-[11%] aspect-square -translate-x-1/2 rounded-full border-[3px] border-border flex items-center justify-center pointer-events-none" style={foodBg(theme, flying.food)}
                      initial={{ left: '50%', top: '96%', scale: 0.6 }} animate={flying.seat === null ? { left: ['50%', '50%'], top: ['96%', '70%', '96%'], rotate: [0, -12, 12, 0] } : { left: `${toX}%`, top: '44%', scale: 1 }} exit={{ opacity: 0, scale: 0.4 }}
                      transition={{ duration: still ? 0 : FLY_MS / 1000, ease: 'easeOut' }}>
                      <FoodFace theme={theme} food={flying.food} />
                    </motion.span>
                  );
                })()}
              </AnimatePresence>
              <AnimatePresence>
                {banner && (
                  <motion.p key={banner.id} className="absolute inset-x-0 top-[16%] text-center font-display text-3xl sm:text-5xl text-white pointer-events-none" style={{ WebkitTextStroke: '2px #000' }}
                    initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 18 }} role="status">{banner.text}</motion.p>
                )}
              </AnimatePresence>
            </div>
            <div className="grid grid-cols-4 gap-2 mx-auto w-full" style={{ maxWidth: boardWidth }}>
              {FOODS.map((f) => {
                const wanted = counter.seats.some((g) => g?.food === f);
                return (
                  <button key={f} type="button" onClick={() => give(f)} disabled={!canServe} aria-label={t('lr.serve', { food: foodName(f) })}
                    className={`min-h-16 rounded-input border-[2.5px] border-border flex flex-col items-center justify-center font-bold text-sm disabled:opacity-50 ${canServe && wanted ? 'motion-safe:animate-pulse' : ''}`}
                    style={{ ...foodBg(theme, f), boxShadow: 'var(--shadow-sticker)' }}>
                    <FoodFace theme={theme} food={f} size={34} /><span className="hidden sm:inline">{foodName(f)}</span>
                  </button>
                );
              })}
            </div>
          </section>
          <aside className="order-first lg:order-none bg-surface border-[2.5px] border-border rounded-panel p-2 lg:p-4" aria-label={t('share.scores')}>
            <p className="hidden lg:block font-display text-lg mb-2">{t('lr.served', { count: served })}</p>
            <ol className="flex flex-wrap lg:grid gap-1.5 list-none p-0 m-0">
              {turns.players.map((p) => (
                <li key={p.id} className={`flex items-center gap-2 rounded-input border-[2px] p-1.5 ${player.id === p.id && phase === 'play' ? 'border-border bg-surface-2' : 'border-border-soft'}`}>
                  <TeamBadge colorIndex={p.colorIndex} size={28} /><span className="font-bold flex-1 truncate">{p.name}</span>
                  <motion.span key={p.score} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="font-display text-2xl tabular-nums">{p.score}</motion.span>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      )}
      {question && player && phase === 'play' && !solo && <ShareQuestion question={question.q} player={player} cpuLevel={team.level} onResult={onShareResult} />}
      {phase === 'end' && turns && (
        <ResultsModal winners={turns.players.length > 1 ? leaders(turns) : undefined} title={turns.players.length > 1 ? (leaders(turns).length > 1 ? t('share.tie') : t('share.winner', { name: leaders(turns)[0].name })) : t('pd.done', { count: turns.players[0].score })} missed={solo ? soloMissed : missed} againLabel={t('share.again')} onAgain={() => setPhase('welcome')} />
      )}
      {powers.element}
      {element}
    </main>
    </ThemedPage>
  );
}

// The guest's order: the food picture, and hearts for how long they'll wait.
function OrderBubble({ theme, food, patience, served }: { theme: GameTheme; food: Food; patience: number; served: boolean }) {
  return (
    <div className="w-[70%] bg-surface border-[2.5px] border-border rounded-panel p-[4%] grid justify-items-center gap-1" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="w-[62%] aspect-square rounded-full border-[2.5px] border-border flex items-center justify-center" style={{ ...foodBg(theme, food), opacity: served ? 0.4 : 1 }}>
        <FoodFace theme={theme} food={food} />
      </span>
      <span className="flex gap-[3%] w-full justify-center" aria-hidden="true">
        {Array.from({ length: PATIENCE }, (_, i) => <Heart key={i} weight={i < patience ? 'fill' : 'bold'} className="w-[16%] h-auto" color={i < patience ? (patience <= 2 ? '#e5635f' : '#ef7d96') : '#b8b2c8'} />)}
      </span>
    </div>
  );
}

// A friendly guest drawn in code: six skin tones and shirt colors.
function GuestArt({ look, happy, worried }: { look: number; happy: boolean; worried: boolean }) {
  return (
    <svg viewBox="0 0 40 40" className="w-[78%] h-auto block" aria-hidden="true">
      <path d="M6,40 Q6,27 20,27 Q34,27 34,40 Z" fill={SHIRT[look % SHIRT.length]} stroke="#000" strokeWidth="1.2" />
      <circle cx="20" cy="17" r="10" fill={SKIN[look % SKIN.length]} stroke="#000" strokeWidth="1.2" />
      <circle cx="16.5" cy="16" r="1.3" fill="#241c3d" /><circle cx="23.5" cy="16" r="1.3" fill="#241c3d" />
      {happy ? <path d="M15,20 Q20,25.5 25,20 Z" fill="#241c3d" /> : worried ? <path d="M16.5,22 Q20,20 23.5,22" fill="none" stroke="#241c3d" strokeWidth="1.2" strokeLinecap="round" /> : <path d="M16,20.5 Q20,23.5 24,20.5" fill="none" stroke="#241c3d" strokeWidth="1.2" strokeLinecap="round" />}
      <circle cx="14" cy="19.5" r="1.4" fill="#f6a5c0" opacity="0.7" /><circle cx="26" cy="19.5" r="1.4" fill="#f6a5c0" opacity="0.7" />
    </svg>
  );
}

// A food's look: the theme's picture on its color, or the Classic icon.
const foodBg = (theme: GameTheme, f: Food) => ({ background: pieceColor(theme, `food-${f}`, FOOD_ART[f].color) });
function FoodFace({ theme, food, size }: { theme: GameTheme; food: Food; size?: number }) {
  const img = pieceImage(theme, `food-${food}`);
  if (img) return <img src={img} alt="" className={size ? 'object-contain' : 'w-[85%] h-[85%] object-contain'} style={size ? { width: size + 6, height: size + 6 } : undefined} />;
  const F = FOOD_ART[food].icon;
  return size ? <F weight="fill" size={size} color="#241c3d" /> : <F weight="fill" className="w-3/5 h-3/5" color="#241c3d" />;
}
