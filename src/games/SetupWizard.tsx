import { Children, Fragment, isValidElement, useLayoutEffect, useRef, useState, type ReactElement, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Play } from '@phosphor-icons/react';
import { t } from '../i18n';
import Title from '../ui/Title';
import { TeachCardBox, TeachCards, type TeachShow } from './TeachCard';

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
export default function SetupWizard({ pages, onBack, onPlay, playLabel }: { pages: SetupPage[]; onBack: () => void; onPlay: () => void; playLabel?: string }) {
  const [i, setI] = useState(0);
  // Teach cards from the picked sets, shown after Play (market gaps, 2026-11-01).
  const [teach, setTeach] = useState<TeachShow[]>([]);
  const [teaching, setTeaching] = useState(false);
  const [part, setPart] = useState(0);
  // How many parts each page splits into (measured when it is shown).
  const [splits, setSplits] = useState<Record<string, number[][]>>({});
  // Only a single setting taller than the whole screen may scroll on its own.
  const [tall, setTall] = useState(false);
  const page = pages[i];
  const items = itemsOf(page.content);
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
      const groups: number[][] = [];
      let cur: number[] = [], used = 0;
      hs.forEach((h, k) => {
        const need = (cur.length ? GAP : 0) + h;
        if (cur.length && used + need > room) { groups.push(cur); cur = [k]; used = h; } else { cur.push(k); used += need; }
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
    <TeachCards.Provider value={setTeach}>
    {teaching && teach.length > 0 && <TeachCardBox cards={teach} onDone={() => { setTeaching(false); onPlay(); }} />}
    <div className="grid">
    {/* Roomy, never cramped (teacher, 2026-10-31): full width up to a big
        card, a generous minimum height, larger text and controls. */}
    <section className="setup-roomy menu-panel w-full max-w-6xl mx-auto flex flex-col overflow-hidden" style={{ height: 'calc(100dvh - 7.5rem)' }}>
      {/* The step title and its progress line sit on one row, centered
          with the corner buttons (teacher, 2026-11-06). */}
      <div className="px-6 sm:px-8 pt-0 pb-3 min-h-11 flex flex-wrap items-center gap-x-6 gap-y-2 pr-40 sm:pr-44">
        <h2 className="font-display text-xl font-bold"><Title text={t('setup.stepTitle', { n: stepNo, total, title: page.title })} /></h2>
        <ol className="flex gap-1 list-none p-0 m-0 w-56 max-w-full" aria-label={t('setup.steps')}>
          {pages.flatMap((p, k) => Array.from({ length: partsOf(p) }, (_, q) => {
            const n = pages.slice(0, k).reduce((m, x) => m + partsOf(x), 0) + q + 1;
            return (
              <li key={`${p.id}-${q}`} className="flex-1">
                <button type="button" onClick={() => goTo(k, q)} disabled={k > i && pages.slice(i, k).some((x) => x.ready === false)}
                  aria-current={n === stepNo ? 'step' : undefined} aria-label={t('setup.stepOf', { n, total, title: p.title })}
                  className={`w-full h-1.5 rounded-pill ${n <= stepNo ? 'bg-border' : 'bg-border-soft/50'} motion-safe:transition-colors`} />
              </li>
            );
          }))}
        </ol>
      </div>
      <div ref={body} className={`relative px-6 sm:px-8 py-4 grid gap-5 content-center min-h-0 flex-1 text-base ${tall ? 'overflow-y-auto' : 'overflow-hidden'}`}>
        {items.map((it, k) => (
          // Settings on other parts stay mounted (so nothing resets) but out of sight.
          // Centered with wide side margins, like a game-show settings page (teacher, 2026-11-06).
          <div key={k} ref={(el) => { refs.current[k] = el; }} className={showing.has(k) ? 'grid gap-6 min-w-0 w-full max-w-4xl mx-auto' : 'grid gap-6 absolute left-6 right-6 sm:left-8 sm:right-8 top-0 invisible pointer-events-none'} aria-hidden={showing.has(k) ? undefined : true}>{it}</div>
        ))}
      </div>
      <div className="px-6 sm:px-8 py-3 flex justify-between gap-2">
        <button type="button" onClick={back}
          className="min-h-11 px-4 rounded-pill border-[2px] border-border bg-surface-2 font-bold text-base inline-flex items-center gap-1.5 motion-safe:hover:-translate-x-0.5 motion-safe:transition-transform">
          <ArrowLeft weight="bold" size={16} />{t('setup.back')}
        </button>
        <button type="button" disabled={page.ready === false} onClick={() => (last ? (teach.length ? setTeaching(true) : onPlay()) : next())}
          className="min-h-11 px-6 rounded-pill border-[2.5px] border-border bg-accent font-display text-lg font-bold inline-flex items-center gap-1.5 disabled:opacity-50 motion-safe:hover:scale-105 motion-safe:transition-transform" style={{ boxShadow: '0 3px 0 #000' }}>
          {last ? <><Play weight="fill" size={18} />{playLabel ?? t('start.play')}</> : <>{t('setup.next')}<ArrowRight weight="bold" size={16} /></>}
        </button>
      </div>
    </section>
    </div>
    </TeachCards.Provider>
  );
}
