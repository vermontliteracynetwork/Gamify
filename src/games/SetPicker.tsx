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
  const [fit, setFit] = useState({ cols: 4, rows: 2, size: 240, h: 170 });
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
      setFit((f) => (f.cols === next.cols && f.rows === next.rows && Math.abs(f.size - next.size) < 1 && Math.abs(f.h - next.h) < 1 ? f : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  const PAGE = fit.cols * fit.rows;
  const compact = fit.h < 185 || fit.size < 240;
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
    <div ref={wrap} className="grid grid-cols-[minmax(0,1fr)] gap-3 min-w-0 w-full">
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
      <div ref={gridEl} className="grid" style={{ gap: GAP, gridTemplateColumns: `repeat(${fit.cols}, ${fit.size}px)`, gridAutoRows: `${fit.h}px` }}>
        {onPage.map((s) => {
          const on = value.includes(s.id);
          const art = ART[s.subject ?? 'Other'];
          const I = art.icon;
          return (
            // A set card like a game library card (teacher, 2026-11-06): a
            // colored picture band with the subject's icon, then the name and
            // small chips for grades and how many questions.
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              aria-label={`${s.name || t('sets.untitled')}, ${s.subject ?? t('sets.otherSubject')}, ${t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}, ${t('setup.count', { count: s.questions.filter(isPlayable).length })}`}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`group relative rounded-panel border-[2.5px] border-border text-left grid grid-rows-[auto_1fr_auto] gap-2 bg-surface motion-safe:transition-all motion-safe:duration-200 motion-safe:hover:-translate-y-1 ${compact ? 'p-3' : 'p-4'} ${on ? 'ring-4 ring-[#b4c4fb] -translate-y-1' : ''}`}
              style={{ boxShadow: on ? '0 6px 0 #000, 0 16px 26px rgba(36,28,61,0.18)' : '0 4px 0 #000, 0 10px 18px rgba(36,28,61,0.08)' }}>
              {/* No cover picture unless the teacher added one (teacher, 2026-11-13):
                  just a small subject badge, the full name and the details. */}
              <span className="flex items-center gap-2 min-w-0 pr-8">
                <span className="w-8 h-8 shrink-0 rounded-full border-[2px] border-border flex items-center justify-center motion-safe:group-hover:-rotate-12 motion-safe:transition-transform" style={{ background: art.bg }}>
                  <I weight="fill" size={17} color={art.ink} aria-hidden="true" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-muted">{s.subject ?? t('sets.otherSubject')}</span>
              </span>
              {on && (
                <span className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold motion-safe:animate-[pop_0.3s_ease-out]">
                  {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                </span>
              )}
              <span className={`font-bold leading-snug self-start break-words text-balance ${compact ? 'text-base' : 'text-lg'}`}>{s.name || t('sets.untitled')}</span>
              <span className="flex flex-wrap gap-1.5 text-xs font-bold leading-none">
                <span className="rounded-pill border-[1.5px] border-border px-2 py-1 bg-surface-2">{t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}</span>
                <span className="rounded-pill border-[1.5px] border-border px-2 py-1" style={{ background: art.bg }}>{t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
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
const MIN = 210; // the narrowest card that still reads (name and details)
const MAX = 320;
const H_MIN = 165;
const H_MAX = 210;

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
  // Wide cards that show every word (teacher, 2026-11-13): as many across as
  // keep a card at least MIN wide, in as many rows as the height holds.
  let best: { cols: number; rows: number; size: number; h: number } | null = null, score = 0;
  for (const rows of [3, 2, 1]) {
    const h = Math.floor(Math.min(H_MAX, (high - GAP * (rows - 1)) / rows));
    if (h < H_MIN) continue;
    for (const cols of [6, 5, 4, 3, 2]) {
      const size = Math.floor(Math.min(MAX, (width - GAP * (cols - 1)) / cols));
      if (size < MIN) continue;
      const sc = rows * cols * Math.min(size, 260) * h;
      if (sc > score) { score = sc; best = { cols, rows, size, h }; }
    }
  }
  if (best) return best;
  const size = Math.max(160, Math.floor(Math.min(MAX, width)));
  return { cols: Math.max(1, Math.min(4, Math.floor((width + GAP) / (size + GAP)))), rows: 1, size, h: Math.max(140, Math.min(H_MAX, high)) };
}
