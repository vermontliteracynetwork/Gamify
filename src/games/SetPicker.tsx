import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TeachCards } from './TeachCard';
import { CaretLeft, CaretRight, CheckCircle } from '@phosphor-icons/react';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { ART } from './SetCover';
import SetFilterBar from './SetFilterBar';

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
  const compact = fit.size < 140;
  const ready = sets.filter((s) => missingDetails(s).length === 0);
  const shown = ready.filter((s) => matchesFilter(s, filter));
  const hidden = sets.length - ready.length;
  // Sets come in pages (teacher, 2026-10-31), opening on the page with the pick.
  const pages = Math.max(1, Math.ceil(shown.length / PAGE));
  const [page, setPage] = useState(() => Math.max(0, Math.floor(shown.findIndex((s) => value.includes(s.id)) / PAGE)));
  useEffect(() => { if (page >= pages) setPage(pages - 1); }, [page, pages]);
  // When the cards across change with the screen, stay on the picked set.
  useEffect(() => { const k = shown.findIndex((s) => value.includes(s.id)); if (k >= 0) setPage(Math.floor(k / PAGE)); }, [PAGE]); // eslint-disable-line react-hooks/exhaustive-deps
  const onPage = shown.slice(page * PAGE, page * PAGE + PAGE);
  return (
    <div ref={wrap} className="grid gap-3">
      {max > 1 && <p className="font-bold">{t('setup.pickSets', { max })}</p>}
      <SetFilterBar value={filter} onChange={(f) => { setFilter(f); setPage(0); }} sets={ready} />
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
            <button key={s.id} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
              onClick={() => onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value)}
              className={`relative rounded-input border-[2.5px] text-left overflow-hidden flex flex-col justify-between ${compact ? 'p-2' : 'p-2.5'} ${on ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`}
              style={{ background: `color-mix(in srgb, ${art.bg} 45%, var(--color-surface, #fbfcf8))` }}>
              <I weight="fill" size={compact ? 18 : 22} color={art.ink} aria-hidden="true" />
              {on && (
                <span className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold">
                  {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                </span>
              )}
              <span className="grid gap-0.5 min-w-0">
                <span className={`font-bold text-sm leading-tight ${compact ? 'line-clamp-2' : 'line-clamp-3'}`}>{s.name || t('sets.untitled')}</span>
                <span className={`text-[11px] leading-tight text-muted font-bold ${compact ? 'line-clamp-1' : 'line-clamp-2'}`}>{s.subject} · {t('filter.gradesShort', { grades: gradeLabel(s.grades!) })} · {t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
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
const MIN = 104; // the smallest card that still reads (name and details)
const MAX = 180;

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
  for (const rows of [3, 2, 1]) {
    const tall = (high - GAP * (rows - 1)) / rows;
    for (const least of [120, MIN]) {
      for (const cols of [6, 5, 4, 3, 2]) {
        const size = Math.min(MAX, (width - GAP * (cols - 1)) / cols, tall);
        if (size >= least) return { cols, rows, size: Math.floor(size) };
      }
    }
  }
  // A short screen: one full row of the biggest cards the height allows.
  const size = Math.max(84, Math.floor(Math.min(MAX, high)));
  return { cols: Math.max(1, Math.min(6, Math.floor((width + GAP) / (size + GAP)))), rows: 1, size };
}
