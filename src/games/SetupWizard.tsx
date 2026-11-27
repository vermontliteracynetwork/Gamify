import { Children, createContext, Fragment, isValidElement, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import JoinCodeCard from './JoinCodeCard';
import { ArrowLeft, ArrowRight, Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import Title from '../ui/Title';
import { PowerUpCards } from '../engine/PowerUpSwitches';

// Card-choice steps start unpicked (teacher, 2026-11-24: "dont select either
// card option for game type at first. the user must click, then the setting on
// the bottom should appear"): until a card on a choice page is tapped, no card
// shows as picked, the settings under the cards stay hidden and Next is off.
export const ChoicePicked = createContext(true);
// The footer spot between Back and Next, for a step's own button (Teams: Add
// team, Universal views 6); a step renders into it with a portal.
export const FooterSlot = createContext<HTMLElement | null>(null);
const CHOICE_PAGES = ['way', 'class'];
// "Share a join code" (Universal views 3): the Way step's Share choice turns
// on its own step with the code big on one paper card. It comes after the
// questions, because a code carries its question set.
export const ShareChoice = createContext<{ want: boolean; setWant: (v: boolean) => void } | null>(null);

export interface SetupPage { id: string; title: string; content: ReactNode; ready?: boolean }

// A page's settings, one by one (a fragment of several settings splits).
function itemsOf(content: ReactNode): ReactNode[] {
  if (isValidElement(content) && content.type === Fragment) return Children.toArray((content as ReactElement<{ children?: ReactNode }>).props.children).filter(Boolean).flatMap(itemsOf);
  return [content];
}
const GAP = 24;

// Game settings split into short pages (questions, game options, teams,
// theme...) with a step bar, Back and Next, and Play on the last page.
// NEVER a scroll (teacher, 2026-10-31: "always do pages"): when a page's
// settings do not fit the screen, they flow onto more pages.
// Power-ups always get their own page (teacher, 2026-11-13: "rounds and
// power ups should be two separate pages").
function splitPowers(pages: SetupPage[]): SetupPage[] {
  return pages.flatMap((p) => {
    const items = itemsOf(p.content);
    const isPow = (it: ReactNode) => isValidElement(it) && it.type === PowerUpCards;
    const pow = items.filter(isPow);
    if (!pow.length || pow.length === items.length) return [p];
    return [{ ...p, content: <>{items.filter((it) => !isPow(it))}</> }, { id: `${p.id}-powers`, title: t('tb.powers'), content: <>{pow}</> }];
  });
}

export default function SetupWizard({ pages: given, onBack, onPlay, playLabel, share }: { pages: SetupPage[]; onBack: () => void; onPlay: () => void; playLabel?: string; share?: { gameId: string; setId?: string } }) {
  const [wantCode, setWantCode] = useState(false);
  const withCode = (list: SetupPage[]): SetupPage[] => {
    if (!share || !wantCode) return list;
    const at = Math.max(list.findIndex((p) => p.id === 'questions'), list.findIndex((p) => p.id === 'way'));
    const codePage: SetupPage = { id: 'share-code', title: t('share.codeTitle'), content: <JoinCodeCard gameId={share.gameId} setId={share.setId} /> };
    return [...list.slice(0, at + 1), codePage, ...list.slice(at + 1)];
  };
  // Power-ups come last, after Teams, and the last step plays (Universal views 6, 7).
  const split = splitPowers(withCode(given));
  const isPowers = (p: SetupPage) => p.id === 'powers' || p.id.endsWith('-powers');
  const pages = [...split.filter((p) => !isPowers(p)), ...split.filter(isPowers)];
  const [i, setI] = useState(0);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [part, setPart] = useState(0);
  // How many parts each page splits into (measured when it is shown).
  const [splits, setSplits] = useState<Record<string, number[][]>>({});
  // Only a single setting taller than the whole screen may scroll on its own.
  // The question sets scroll inside their own gallery, so that page never
  // shows a second scroll bar (teacher, 2026-11-16).
  const [tall, setTall] = useState(false);
  const [bw, setBw] = useState(0);
  const page = pages[i];
  const [picked, setPicked] = useState<Set<string>>(() => new Set());
  const choice = CHOICE_PAGES.includes(page.id) && !picked.has(page.id);
  const ready = page.ready !== false && !choice;
  // Pages of just cards (players, teams, boards, power-ups) sit in the middle of the
  // box, the same in every game (teacher, 2026-11-16).
  // Power-up pages have no white box behind the cards (teacher, 2026-11-23).
  const isCards = (id: string) => ['way', 'class', 'players', 'teams', 'board', 'powers', 'share-code'].includes(id) || id.endsWith('-powers');
  const cardsOnly = isCards(page.id);
  const items = itemsOf(page.content);
  const twoUp = page.id !== 'questions' && !cardsOnly && items.length > 1;
  const cols = (w: number) => (twoUp && w >= 860 ? 2 : 1);
  const body = useRef<HTMLDivElement>(null);
  const refs = useRef<(HTMLDivElement | null)[]>([]);
  useLayoutEffect(() => {
    const measure = () => {
      const box = body.current;
      const card = box?.parentElement;
      if (!box || !card) return;
      // The room is what the card may grow to, not what it is now, so the
      // split never flips back and forth as the card changes size.
      const maxH = parseFloat(getComputedStyle(card).maxHeight) || card.clientHeight;
      const head = (card.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
      const foot = (card.lastElementChild as HTMLElement | null)?.offsetHeight ?? 0;
      const room = maxH - head - foot - 48 - 6; // the body's padding and the card's border
      const hs = items.map((_, k) => refs.current[k]?.offsetHeight ?? 0);
      // Option cards sit two side by side on wide screens (Universal views 5),
      // so a page holds rows of two.
      setBw(box.clientWidth);
      const per = cols(box.clientWidth);
      const groups: number[][] = [];
      let cur: number[] = [], used = 0, rowH = 0;
      hs.forEach((h, k) => {
        const newRow = cur.length % per === 0;
        const need = newRow ? (cur.length ? GAP : 0) + h : Math.max(0, h - rowH);
        if (cur.length && newRow && used + need > room) { groups.push(cur); cur = [k]; used = h; rowH = h; }
        else { cur.push(k); used += need; rowH = newRow ? h : Math.max(rowH, h); }
      });
      if (cur.length) groups.push(cur);
      setTall((v) => (v === hs.some((h) => h > room) ? v : !v));
      setSplits((s) => (JSON.stringify(s[page.id]) === JSON.stringify(groups) ? s : { ...s, [page.id]: groups }));
    };
    measure();
    const ro = new ResizeObserver(() => measure());
    refs.current.slice(0, items.length).forEach((el) => el && ro.observe(el));
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [page.id, items.length]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = splits[page.id] ?? [items.map((_, k) => k)];
  const partNow = Math.min(part, groups.length - 1);
  const showing = new Set(groups[partNow]);
  const partsOf = (p: SetupPage) => splits[p.id]?.length ?? 1;
  const total = pages.reduce((n, p) => n + partsOf(p), 0);
  const stepNo = pages.slice(0, i).reduce((n, p) => n + partsOf(p), 0) + partNow + 1;
  const last = i === pages.length - 1 && partNow === groups.length - 1;
  const goTo = (k: number, toPart = 0) => { setI(k); setPart(toPart); };
  const next = () => (partNow < groups.length - 1 ? setPart(partNow + 1) : goTo(i + 1));
  const back = () => (partNow > 0 ? setPart(partNow - 1) : i === 0 ? onBack() : goTo(i - 1, partsOf(pages[i - 1]) - 1));
  return (
    <>
    <div className="grid">
    {/* Roomy, never cramped (teacher, 2026-10-31): full width up to a big
        card, a generous minimum height, larger text and controls. */}
    <section className="setup-roomy menu-panel w-full mx-auto flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 6.5rem)' }}>
      {/* The step title and its progress line sit on one row, centered
          with the corner buttons (teacher, 2026-11-06). The question set
          search and filters lock right under it. */}
      <div className="setup-head px-6 sm:px-8 pt-1.5 pb-3 min-h-12 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] max-sm:grid-cols-[minmax(0,1fr)_auto] items-center gap-x-6 gap-y-2">
        {/* Step title left, the step meter right, no "Step x of x" on screen
            (teacher, 2026-11-23); screen readers still hear the step number. */}
        <h2 className="title-bubble text-[1.9rem] sm:text-[2.4rem] leading-none"><span className="sr-only">{t('setup.stepTitle', { n: stepNo, total, title: '' })}</span><Title text={page.title} /></h2>
        {/* THE meter (approved 2026-11-24): one rounded track with an ink edge,
            done steps Kelly, the current one Lemon with a glowing knob. */}
        <ol className="flex gap-[4px] list-none m-0 rounded-full p-[3px] box-border" style={{ width: `min(${Math.max(total, 3) * 3}rem, 40vw)`, height: 22, background: '#eeeaf8', border: '2.5px solid var(--ink)', boxShadow: 'inset 0 2px 4px rgba(29,26,51,0.22)' }} aria-label={t('setup.steps')}>
          {pages.flatMap((p, k) => Array.from({ length: partsOf(p) }, (_, q) => {
            const n = pages.slice(0, k).reduce((m, x) => m + partsOf(x), 0) + q + 1;
            return (
              <li key={`${p.id}-${q}`} className="flex-1">
                <button type="button" onClick={() => goTo(k, q)} disabled={k > i && pages.slice(i, k).some((x) => x.ready === false || (CHOICE_PAGES.includes(x.id) && !picked.has(x.id)))}
                  aria-current={n === stepNo ? 'step' : undefined} aria-label={t('setup.stepOf', { n, total, title: p.title })}
                  className="relative block w-full h-full rounded-full motion-safe:transition-colors" style={{ background: n < stepNo ? 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), var(--kelly)' : n === stepNo ? 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0) 55%), var(--lemon)' : 'rgba(29,26,51,0.06)' }}>
                  {n === stepNo && <span aria-hidden="true" className="absolute top-1/2 right-0 translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] rounded-full bg-paper border-[2.5px] border-border" style={{ boxShadow: '0 0 0 3px rgba(250,190,55,0.55), 0 0 10px 3px rgba(250,190,55,0.6)' }} />}
                </button>
              </li>
            );
          }))}
        </ol>
        {/* The round buttons (Settings, Full screen, Close) sit here, level with the title. */}
        <span className="max-sm:hidden" aria-hidden="true" />
      </div>
      <ShareChoice.Provider value={share ? { want: wantCode, setWant: setWantCode } : null}>
      <FooterSlot.Provider value={slot}>
      <ChoicePicked.Provider value={!choice}>
      <div ref={body} data-setup-body="" onClickCapture={(e) => { if (choice && (e.target as HTMLElement).closest('[role="radio"]')) setPicked((p) => new Set(p).add(page.id)); }} data-unpicked={choice ? '' : undefined} style={cols(bw) === 2 ? { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', maxWidth: '64rem', marginInline: 'auto', width: '100%' } : undefined} className={`relative px-6 sm:px-8 grid gap-5 min-h-0 ${cardsOnly || twoUp ? 'content-center items-start' : 'content-start'} pt-2 pb-4 flex-1 text-base ${tall && page.id !== 'questions' ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {items.map((it, k) => (
          // Settings on other parts stay mounted (so nothing resets) but out of sight.
          // Centered with wide side margins, like a game-show settings page (teacher, 2026-11-06).
          <div key={k} ref={(el) => { refs.current[k] = el; }} className={showing.has(k) ? `grid grid-cols-[minmax(0,1fr)] gap-6 min-w-0 w-full max-w-5xl mx-auto ${page.id === 'questions' || cardsOnly ? '' : 'setup-item'}` : `grid grid-cols-[minmax(0,1fr)] gap-6 min-w-0 w-auto max-w-5xl mx-auto absolute left-6 right-6 sm:left-8 sm:right-8 top-0 invisible pointer-events-none ${page.id === 'questions' || cardsOnly ? '' : 'setup-item'}`} aria-hidden={showing.has(k) ? undefined : true}>{it}</div>
        ))}
      </div>
      </ChoicePicked.Provider>
      </FooterSlot.Provider>
      </ShareChoice.Provider>
      {/* Back and Next side by side in the middle, under the cards (Universal
          views, approved 2026-11-25); a step's own extra button (Add team)
          sits between them. */}
      <div className="px-6 sm:px-8 pt-2 pb-3 flex flex-wrap-reverse justify-center items-center gap-x-5 gap-y-3">
        <button type="button" onClick={back}
          className="max-sm:order-1 min-h-12 px-6 rounded-pill border-[3px] border-border bg-white font-bold text-lg inline-flex items-center gap-2 shadow-[0_4px_0_var(--ink)] motion-safe:hover:-translate-x-0.5 motion-safe:transition-transform">
          <ArrowLeft weight="bold" size={20} />{t('setup.back')}
        </button>
        <span ref={setSlot} className="contents" />
        <button type="button" disabled={!ready} onClick={() => (last ? onPlay() : next())}
          className="max-sm:order-2 min-h-[3.25rem] px-8 rounded-pill border-[3px] border-border bg-accent font-display text-xl font-bold inline-flex items-center gap-2 shadow-[0_5px_0_var(--ink)] disabled:bg-surface disabled:text-muted disabled:border-dashed disabled:shadow-none disabled:translate-y-1 motion-safe:hover:enabled:scale-105 motion-safe:transition-transform">
          {/* Next stays off, pale and dashed, until a card is picked (rule 9). */}
          {last ? <><Play weight="fill" size={18} />{playLabel ?? t('start.play')}</> : <>{t('setup.next')}<ArrowRight weight="bold" size={18} /></>}
        </button>
      </div>
    </section>
    </div>
    </>
  );
}
