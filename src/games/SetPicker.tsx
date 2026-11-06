import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TeachCards } from './TeachCard';
import { CaretLeft, CaretRight, CheckCircle } from '@phosphor-icons/react';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { ART } from './SetCover';
import SetFilterBar from './SetFilterBar';
import { LIBRARY } from '../data/library';

const LIBRARY_IDS = new Set(LIBRARY.map((s) => s.id));

// Pick one question set (or up to `max` for games like the category grid)
// from square cards, the same menu in every game (teacher, 2026-11-01: no
// cover pictures, no "Pick a question set" line), with filters. The cards
// fill whole rows, 4, 5 or 6 across, whatever fits, and their rows always
// fit the setup box with no scroll (teacher, 2026-11-01). Sets still missing their details
// (subject, grades, tags, standards) can't be picked until they're added.
export default function SetPicker({ sets, value, onChange, max = 1 }: {
  sets: QuestionSet[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [filter, setFilter] = useState<SetFilter>({});
  // The picked sets' teach cards, shown before play.
  const teach = useContext(TeachCards);
  useEffect(() => {
    teach?.(value.map((id) => sets.find((s) => s.id === id)).filter((s): s is QuestionSet => !!s?.teachCard?.text.trim()).map((s) => ({ name: s.name, card: s.teachCard! })));
  }, [value.join(','), sets]); // eslint-disable-line react-hooks/exhaustive-deps
  const wrap = useRef<HTMLDivElement>(null);
  const gridEl = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState({ cols: 4, rows: 2, size: 140 });
  useLayoutEffect(() => {
    const measure = () => {
      const w = wrap.current, g = gridEl.current;
      if (!w || !g) return;
      // The room the setup box gives its body (the same sum the setup
      // pages use), less what sits above the cards and the page arrows.
      const card = w.closest('section.setup-roomy') as HTMLElement | null;
      let room = Infinity;
      if (card) {
        const maxH = parseFloat(getComputedStyle(card).maxHeight) || card.clientHeight;
        const head = (card.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
        const foot = (card.lastElementChild as HTMLElement | null)?.offsetHeight ?? 0;
        room = maxH - head - foot - 48 - 6;
      }
      // Outside the setup box (class and activity pages): two rows.
      // The page arrows sit beside the cards, not under them, so the cards
      // get all the height (teacher, 2026-11-01: "the cards are the priority").
      const high = card ? room - (g.offsetTop - w.offsetTop) - 4 : MAX * 2 + GAP;
      const width = w.clientWidth - 2 * (ARROW + GAP);
      const next = layout(width, high);
      setFit((f) => (f.cols === next.cols && f.rows === next.rows && Math.abs(f.size - next.size) < 1 ? f : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const PAGE = fit.cols * fit.rows;
  const compact = fit.size < 200;
  // My sets and public (ready-made) sets on their own tabs (teacher, 2026-11-06).
  const ready = sets.filter((s) => missingDetails(s).length === 0);
  const mineReady = ready.filter((s) => !LIBRARY_IDS.has(s.id));
  const [tab, setTab] = useState<'mine' | 'library'>(() => (mineReady.length > 0 || sets.some((x) => !LIBRARY_IDS.has(x.id)) ? 'mine' : 'library'));
  const inTab = tab === 'mine' ? mineReady : ready.filter((s) => LIBRARY_IDS.has(s.id));
  const shown = inTab.filter((s) => matchesFilter(s, filter));
  const hidden = tab === 'mine' ? sets.filter((s) => !LIBRARY_IDS.has(s.id)).length - mineReady.length : 0;
  // Sets come in pages (teacher, 2026-10-31), opening on the page with the pick.
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const [page, setPage] = useState(() => Math.max(0, Math.floor(shown.findIndex((s) => value.includes(s.id)) / PAGE)));
  useEffect(() => { if (page >= pages) setPage(pages - 1); }, [page, pages]);
  // When the cards across change with the screen, stay on the picked set.
  useEffect(() => { const k = shown.findIndex((s) => value.includes(s.id)); if (k >= 0) setPage(Math.floor(k / PAGE)); }, [PAGE]); // eslint-disable-line react-hooks/exhaustive-deps
  const onPage = shown.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div ref={wrap} className="grid gap-3">
      {max > 1 && <p className="font-bold text-base">{t('setup.pickSets', { max })}</p>}
      <div className="flex flex-wrap items-center gap-2 [&>[role=tablist]]:mb-0">
        <div role="tablist" aria-label={t('sets.tabs')} className="inline-flex shrink-0 p-0.5 rounded-pill border-[2px] border-border bg-surface">
          {(['mine', 'library'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => { setTab(v); setPage(0); }}
              className={`min-h-8 px-3 rounded-pill text-sm font-bold motion-safe:transition-colors ${tab === v ? 'bg-accent' : 'hover:bg-surface-2'}`}>{t(v === 'mine' ? 'sets.mine' : 'sets.library')}</button>
          ))}
        </div>
        <div className="flex-1 min-w-64"><SetFilterBar compact value={filter} onChange={(f) => { setFilter(f); setPage(0); }} sets={inTab} /></div>
      </div>
      {hidden > 0 && <p className="text-sm font-bold text-muted">{t('filter.needDetails', { count: hidden })}</p>}
      {shown.length === 0 && <p className="font-bold">{t('filter.none')}</p>}
      <div className="flex items-center justify-center gap-2.5">
      <PageArrow side="prev" show={pages > 1} disabled={page === 0} onClick={() => setPage(page - 1)} />
      <div ref={gridEl} className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${fit.cols}, ${fit.size}px)`, gridAutoRows: `${fit.size}px` }}>
        {onPage.map((s) => {
          const on = value.includes(s.id);
          const art = ART[s.subject ?? 'Other'];
          const I = art.icon;
          return (
            // A set card like a game library card (teacher, 2026-11-06): a
            // colored picture band with the subject's icon, then the name and
            // small chips for grades and how many questions.
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`tile-wiggle relative rounded-input border-[2.5px] border-border text-left overflow-hidden grid grid-rows-[40%_1fr] bg-surface motion-safe:transition-transform ${on ? 'ring-4 ring-accent -translate-y-1' : ''}`}
              style={{ boxShadow: on ? '0 6px 0 #000' : '0 3px 0 rgba(0,0,0,0.85)' }}>
              <span className="relative flex items-center justify-center border-b-[2.5px] border-border overflow-hidden" style={{ background: art.bg }}>
                <I weight="fill" size={Math.round(fit.size * 0.26)} color={art.ink} aria-hidden="true" className="-rotate-6 drop-shadow-[0_2px_0_rgba(0,0,0,0.15)]" />
                <I weight="fill" size={Math.round(fit.size * 0.14)} color={art.ink} aria-hidden="true" className="absolute left-[8%] bottom-[8%] rotate-12 opacity-25" />
                <I weight="fill" size={Math.round(fit.size * 0.11)} color={art.ink} aria-hidden="true" className="absolute right-[10%] top-[10%] -rotate-12 opacity-25" />
              </span>
              {on && (
                <span className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold motion-safe:animate-[pop_0.3s_ease-out]">
                  {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                </span>
              )}
              <span className={`grid content-between gap-1 min-w-0 ${compact ? 'p-2.5' : 'p-3'}`}>
                <span className={`font-bold leading-snug line-clamp-2 ${compact ? 'text-base' : 'text-lg'}`}>{s.name || t('sets.untitled')}</span>
                <span className={`flex flex-wrap gap-1.5 font-bold leading-none ${compact ? 'text-xs' : 'text-sm'}`}>
                  <span className="rounded-pill border border-border px-2 py-1 bg-surface-2">{t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}</span>
                  <span className="rounded-pill border border-border px-2 py-1" style={{ background: art.bg }}>{t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
                </span>
              </span>
            </button>
          );
        })}
      </div>
      <span className="grid justify-items-center gap-1">
        <PageArrow side="next" show={pages > 1} disabled={page >= pages - 1} onClick={() => setPage(page + 1)} />
        {pages > 1 && <span className="text-xs font-bold tabular-nums whitespace-nowrap" aria-live="polite" aria-label={t('sets.pageOf', { n: page + 1, total: pages })}>{page + 1} / {pages}</span>}
      </span>
      </div>
    </div>
  );
}

const GAP = 10;
const ARROW = 44;
// Big cards with big text are the main view (teacher, 2026-11-06).
const MIN = 180; // the smallest card that still reads (name and details)
const MAX = 290;

// A page arrow beside the cards (space kept even when there is one page).
function PageArrow({ side, show, disabled, onClick }: { side: 'prev' | 'next'; show: boolean; disabled: boolean; onClick: () => void }) {
  const label = t(side === 'prev' ? 'sets.prevPage' : 'sets.nextPage');
  if (!show) return <span className="w-11 shrink-0" aria-hidden="true" />;
  return (
    <button type="button" data-tip={label} aria-label={label} disabled={disabled} onClick={onClick}
      className="w-11 h-11 shrink-0 rounded-full border-[2px] border-border bg-surface flex items-center justify-center disabled:opacity-40">
      {side === 'prev' ? <CaretLeft weight="bold" size={20} /> : <CaretRight weight="bold" size={20} />}
    </button>
  );
}

// The most cards across (6, 5, 4...) that keep each square readable, in as
// many rows (3, 2, then 1) as the height holds, so rows are always full and
// tall screens have no empty space.
export function layout(width: number, high: number) {
  // The shape that gives the cards the most room in all (teacher, 2026-11-06:
  // the cards are the main view), with full rows of 2 to 8 across.
  let best: { cols: number; rows: number; size: number } | null = null, score = 0;
  for (const rows of [3, 2, 1]) {
    const tall = (high - GAP * (rows - 1)) / rows;
    for (const cols of [8, 7, 6, 5, 4, 3, 2]) {
      const size = Math.floor(Math.min(MAX, (width - GAP * (cols - 1)) / cols, tall));
      const sc = rows * cols * size * size;
      if (size >= MIN && sc > score) { score = sc; best = { cols, rows, size }; }
    }
  }
  if (best) return best;
  const size = Math.max(84, Math.floor(Math.min(MAX, high)));
  return { cols: Math.max(1, Math.min(6, Math.floor((width + GAP) / (size + GAP)))), rows: 1, size };
}
