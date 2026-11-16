import { useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TeachCards } from './TeachCard';
import { CheckCircle } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useSettings } from '../settings/SettingsContext';
import { gradeLabel, matchesFilter, missingDetails, type SetFilter } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { isPlayable } from '../engine/questions';
import { t } from '../i18n';
import { ART } from './SetCover';
import SetFilterBar from './SetFilterBar';
import { LIBRARY } from '../data/library';

const LIBRARY_IDS = new Set(LIBRARY.map((s) => s.id));
const COL_GAP = 18;
const COL_MIN = 230;
// At most five across (teacher, 2026-11-16).
const MAX_COLS = 5;

// Pick one question set (or up to `max` for games like the category grid)
// from cards, the same menu in every game, with filters. The cards sit in an
// uneven gallery that scrolls under the locked tabs and search (teacher,
// 2026-11-16): every name shown whole inside its card, never cut short, a
// teacher's cover at the shape it was uploaded, and a double-tap turns a card
// over to show question 1. Sets still missing their details (subject,
// grades, tags, standards) can't be picked until they're added.
export default function SetPicker({ sets, value, onChange, max = 1 }: {
  sets: QuestionSet[]; value: string[]; onChange: (ids: string[]) => void; max?: number;
}) {
  const [filter, setFilter] = useState<SetFilter>({});
  const still = useSettings().settings.motion === 'still';
  // The picked sets' teach cards, shown before play.
  const teach = useContext(TeachCards);
  useEffect(() => {
    teach?.(value.map((id) => sets.find((s) => s.id === id)).filter((s): s is QuestionSet => !!s?.teachCard?.text.trim()).map((s) => ({ name: s.name, card: s.teachCard! })));
  }, [value.join(','), sets]); // eslint-disable-line react-hooks/exhaustive-deps
  const wrap = useRef<HTMLDivElement>(null);
  const gallery = useRef<HTMLDivElement>(null);
  // The gallery scrolls on its own under the locked tabs and search
  // (teacher, 2026-11-16: a vertical scroll, not pages). In the setup box it
  // takes the height left; elsewhere about two thirds of the screen.
  const [high, setHigh] = useState<number | null>(null);
  const [cols, setCols] = useState(3);
  useLayoutEffect(() => {
    const measure = () => {
      const w = wrap.current, g = gallery.current;
      if (!w || !g) return;
      // Cards in fixed columns, so turning one over never shuffles the others.
      const c = Math.max(1, Math.min(MAX_COLS, Math.floor((g.clientWidth - 16 + COL_GAP) / (COL_MIN + COL_GAP))));
      setCols((x) => (x === c ? x : c));
      const card = w.closest('section.setup-roomy') as HTMLElement | null;
      if (!card) { setHigh(null); return; }
      // The room the setup box gives its body (its padding is 8 + 16, its
      // border 5), less what sits above the gallery. Fixed, not measured
      // from the body, so it never feeds back into itself.
      const maxH = parseFloat(getComputedStyle(card).maxHeight) || card.clientHeight;
      const head = (card.firstElementChild as HTMLElement | null)?.offsetHeight ?? 0;
      const foot = (card.lastElementChild as HTMLElement | null)?.offsetHeight ?? 0;
      const next = Math.max(220, Math.floor(maxH - head - foot - 24 - 5 - (g.offsetTop - w.offsetTop) - 2));
      setHigh((h) => (h !== null && Math.abs(h - next) < 1 ? h : next));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (wrap.current) ro.observe(wrap.current);
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, []);
  // My sets and public (ready-made) sets on their own tabs (teacher, 2026-11-06).
  const ready = sets.filter((s) => missingDetails(s).length === 0);
  const mineReady = ready.filter((s) => !LIBRARY_IDS.has(s.id));
  const [tab, setTab] = useState<'mine' | 'library'>(() => (mineReady.length > 0 || sets.some((x) => !LIBRARY_IDS.has(x.id)) ? 'mine' : 'library'));
  const inTab = tab === 'mine' ? mineReady : ready.filter((s) => LIBRARY_IDS.has(s.id));
  const shown = inTab.filter((s) => matchesFilter(s, filter));
  const hidden = tab === 'mine' ? sets.filter((s) => !LIBRARY_IDS.has(s.id)).length - mineReady.length : 0;
  // Double-tap (or double-click) a card to turn it over and see question 1
  // with its answers (teacher, 2026-11-16).
  const [flipped, setFlipped] = useState<Set<string>>(new Set());
  const lastTap = useRef<{ id: string; at: number } | null>(null);
  function tap(s: QuestionSet, on: boolean) {
    const now = Date.now(), last = lastTap.current;
    if (last && last.id === s.id && now - last.at < 400) {
      lastTap.current = null;
      setFlipped((f) => { const n = new Set(f); if (n.has(s.id)) n.delete(s.id); else n.add(s.id); return n; });
      return;
    }
    lastTap.current = { id: s.id, at: now };
    if (!on || max > 1) onChange(max === 1 ? [s.id] : on ? value.filter((x) => x !== s.id) : value.length < max ? [...value, s.id] : value);
  }
  return (
    <div ref={wrap} className="grid grid-cols-[minmax(0,1fr)] gap-3 min-w-0 w-full">
      {max > 1 && <p className="font-bold text-base">{t('setup.pickSets', { max })}</p>}
      <div className="flex flex-wrap items-center gap-2 [&>[role=tablist]]:mb-0">
        <div role="tablist" aria-label={t('sets.tabs')} className="inline-flex shrink-0 p-0.5 rounded-pill border-[2px] border-border bg-surface">
          {(['mine', 'library'] as const).map((v) => (
            <button key={v} type="button" role="tab" aria-selected={tab === v} onClick={() => setTab(v)}
              className={`min-h-8 px-3 rounded-pill text-sm font-bold motion-safe:transition-colors ${tab === v ? 'bg-accent' : 'hover:bg-surface-2'}`}>{t(v === 'mine' ? 'sets.mine' : 'sets.library')}</button>
          ))}
        </div>
        <div className="flex-1 min-w-64"><SetFilterBar compact value={filter} onChange={setFilter} sets={inTab} /></div>
      </div>
      {hidden > 0 && <p className="text-sm font-bold text-muted">{t('filter.needDetails', { count: hidden })}</p>}
      {shown.length === 0 && <p className="font-bold">{t('filter.none')}</p>}
      <div ref={gallery} className="overflow-y-auto overscroll-contain -mx-4 px-4 pt-2 pb-4" style={{ maxHeight: high ?? '68vh' }}>
        {/* An uneven gallery (teacher, 2026-11-16): each card as tall as its
            words and cover need, with room between cards. */}
        <div className="grid items-start" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: COL_GAP }}>
          {Array.from({ length: cols }, (_, col) => (
          <div key={col} className="grid gap-[18px] min-w-0">
          {shown.filter((_, k) => k % cols === col).map((s) => {
            const on = value.includes(s.id);
            const art = ART[s.subject ?? 'Other'];
            const I = art.icon;
            const back = flipped.has(s.id);
            const q = s.questions.find(isPlayable);
            return (
              <div key={s.id} className="[perspective:900px]">
                <motion.button key={back ? 'back' : 'front'} type="button" role={max > 1 ? 'checkbox' : 'radio'} aria-checked={on}
                  initial={still ? false : { rotateY: back ? -90 : 90 }} animate={{ rotateY: 0 }} transition={{ duration: 0.28, ease: 'easeOut' }}
                  aria-label={`${s.name || t('sets.untitled')}, ${s.subject ?? t('sets.otherSubject')}, ${t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}, ${t('setup.count', { count: s.questions.filter(isPlayable).length })}`}
                  aria-description={t('sets.flipHint')} title={t('sets.flipHint')}
                  onClick={() => tap(s, on)}
                  className={`group relative w-full rounded-panel border-[2.5px] border-border text-left grid gap-2.5 p-4 bg-surface motion-safe:transition-[translate,box-shadow] motion-safe:duration-200 motion-safe:hover:-translate-y-1 ${on ? 'ring-4 ring-[#b4c4fb] -translate-y-1' : ''}`}
                  style={{ boxShadow: on ? '0 6px 0 #000, 0 16px 26px rgba(36,28,61,0.18)' : '0 4px 0 #000, 0 10px 18px rgba(36,28,61,0.08)' }}>
                  {on && (
                    <span className="absolute top-2.5 right-2.5 z-10 w-8 h-8 rounded-full bg-accent border-[2px] border-border flex items-center justify-center font-display font-bold motion-safe:animate-[pop_0.3s_ease-out]">
                      {max > 1 ? value.indexOf(s.id) + 1 : <CheckCircle weight="fill" size={22} />}
                    </span>
                  )}
                  {!back ? (
                    <>
                      {/* A small subject tag (teacher, 2026-11-16). */}
                      <span className="flex items-center gap-1.5 min-w-0 pr-9">
                        <span className="w-6 h-6 shrink-0 rounded-full border-[1.5px] border-border flex items-center justify-center motion-safe:group-hover:-rotate-12 motion-safe:transition-transform" style={{ background: art.bg }}>
                          <I weight="fill" size={13} color={art.ink} aria-hidden="true" />
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-wide text-muted">{s.subject ?? t('sets.otherSubject')}</span>
                      </span>
                      {/* A cover keeps the shape it was uploaded in. */}
                      {s.cover && <img src={s.cover} alt="" className="w-full h-auto rounded-input border-[2px] border-border" />}
                      <span className="font-bold text-lg leading-snug break-words [overflow-wrap:anywhere]">{s.name || t('sets.untitled')}</span>
                      <span className="flex flex-wrap gap-1.5 text-xs font-bold leading-none">
                        <span className="rounded-pill border-[1.5px] border-border px-2 py-1 bg-surface-2">{t('filter.gradesShort', { grades: gradeLabel(s.grades!) })}</span>
                        <span className="rounded-pill border-[1.5px] border-border px-2 py-1" style={{ background: art.bg }}>{t('setup.count', { count: s.questions.filter(isPlayable).length })}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] font-bold uppercase tracking-wide text-muted pr-9">{t('sets.question1')}</span>
                      {q?.imageUrl && <img src={q.imageUrl} alt={q.imageAlt ?? ''} className="w-full h-auto max-h-28 object-contain rounded-input" />}
                      <span className="text-sm font-bold leading-snug break-words [overflow-wrap:anywhere]">{q ? q.prompt : t('sets.noQuestions')}</span>
                      {q && (
                        <ol className="grid gap-1 list-none p-0 m-0">
                          {q.choices.map((c, k) => {
                            const right = k === q.correctIndex;
                            return (
                              <li key={k} className={`flex items-start justify-between gap-1.5 text-left text-xs font-semibold leading-snug rounded-input border-[1.5px] px-2 py-1 break-words [overflow-wrap:anywhere] ${right ? 'border-success bg-[#e5f4e4] font-bold' : 'border-border-soft'}`}>
                                <span className="min-w-0">{c}</span>
                                {right && <CheckCircle weight="fill" size={15} color="#1f7a45" className="shrink-0 mt-px" aria-label={t('sets.correct')} />}
                              </li>
                            );
                          })}
                        </ol>
                      )}
                    </>
                  )}
                </motion.button>
              </div>
            );
          })}
          </div>
          ))}
        </div>
      </div>
    </div>
  );
}
