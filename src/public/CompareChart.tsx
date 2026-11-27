import { Fragment, useState } from 'react';
import { CaretDown, Check, Info, Minus } from '@phosphor-icons/react';
import { STUDENT_THEME_BUILDER, TIERS, type Tier } from '../config';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Tabs } from '../ui/kit';
import Title from '../ui/Title';

// The detailed comparison chart (teacher, 2026-11-25: "shorten each plan and
// then have a very detailed comparison chart"). One row per feature, a column
// per plan, each row with a plain "what it means" line. Every value comes from
// src/config.ts (TIERS), the template rule in
// src/theme/builder/templateAccess.tsx and the live plan copy; nothing new is
// promised here. Laptops and tablets get one table with a sticky plan header;
// phones pick one plan at a time, so nothing scrolls sideways.
type Plan = Exclude<Tier, 'homeschool'>;
type Value = boolean | string;
interface Row { label: string; what: string; value: (x: Plan) => Value }
interface Group { id: string; title: string; note?: string; rows: Row[] }

const PLANS: Plan[] = ['free', 'plus', 'pro'];
const fmt = (n: number) => (Number.isFinite(n) ? String(n) : t('pricing.unlimited'));
const all = () => true;

// Owner's chart edits, 2026-11-27: no pricing in the table (the plan cards
// above carry it), rows combined where they say one thing, the crossed-out
// rows gone, and Free described by what it gives (quick play, no setup)
// rather than what it lacks. Paid rows read as "more of a good thing" (the
// decoy and goal-gradient ideas: Plus as the full classroom, Pro as the
// whole school), never as a list of locks.
export function compareGroups(): Group[] {
  const row = (label: StringKey, what: StringKey, value: Row['value']): Row => ({ label: t(label), what: t(what), value });
  const perClass = (x: Plan) => (!TIERS[x].studentList ? t('cmp.students.none') : !Number.isFinite(TIERS[x].studentsPerClassroom) ? t('pricing.unlimited') : t('cmp.students.plus', { n: TIERS[x].studentsPerClassroom }));
  return [
    { id: 'games', title: t('cmp.s.games'), rows: [
      row('pricing.row.games', 'cmp.games.what', (x) => (x === 'free' ? t('cmp.games.free') : t('cmp.games.all'))),
      row('cmp.liveLobby', 'cmp.liveLobby.what', (x) => (TIERS[x].liveMode ? true : t('cmp.liveLobby.free'))),
      row('cmp.groups', 'cmp.groups.what', (x) => TIERS[x].setPerStudent),
      row('pricing.row.each', 'cmp.each.what', (x) => TIERS[x].gamePerStudent),
      row('pricing.row.board', 'cmp.board.what', (x) => TIERS[x].themeChoices),
      row('cmp.homework', 'cmp.homework.what', (x) => TIERS[x].homework),
    ] },
    { id: 'classes', title: t('cmp.s.classes'), rows: [
      row('pricing.row.classes', 'cmp.classes.what', (x) => (!TIERS[x].studentList ? t('cmp.classes.none') : fmt(TIERS[x].classrooms))),
      row('pricing.row.students', 'cmp.students.what', perClass),
      row('cmp.signin', 'cmp.signin.what', (x) => (!TIERS[x].studentList ? t('cmp.signin.free') : TIERS[x].customPictures ? t('cmp.signin.own') : t('cmp.signin.list'))),
    ] },
    { id: 'sets', title: t('cmp.s.sets'), rows: [
      row('pricing.row.sets', 'cmp.sets.what', (x) => fmt(TIERS[x].savedQuestionSets)),
      row('cmp.library', 'cmp.library.what', all),
      row('pricing.row.assigned', 'cmp.assigned.what', (x) => (TIERS[x].assignedSetsPerStudent ? fmt(TIERS[x].assignedSetsPerStudent) : false)),
    ] },
    { id: 'themes', title: t('cmp.s.themes'), rows: [
      row('pricing.row.themes', 'cmp.builder.what', (x) => ({ trial: t('pricing.themeTrial'), 'one-per-game': t('pricing.themeOne'), 'three-per-game': t('pricing.themeThree'), unlimited: t('pricing.unlimited') })[TIERS[x].themeBuilder]),
      ...(STUDENT_THEME_BUILDER ? [row('cmp.studio', 'cmp.studio.what', (x) => (TIERS[x].themeBuilder === 'trial' ? t('cmp.studio.free') : t('cmp.studio.paid')))] : []),
      row('pricing.row.library', 'cmp.libraryThemes.what', (x) => TIERS[x].themesPlayable),
    ] },
    { id: 'live', title: t('cmp.s.live'), rows: [
      row('pricing.row.live', 'cmp.live.what', (x) => TIERS[x].liveMonitorAndLock),
      row('cmp.lockMessage', 'cmp.lockMessage.what', (x) => (TIERS[x].customLockMessage ? t('cmp.lockMessage.custom') : TIERS[x].liveMonitorAndLock ? t('cmp.lockMessage.preset') : false)),
      row('cmp.scores', 'cmp.scores.what', all),
      row('cmp.results', 'cmp.results.what', (x) => TIERS[x].questionReports && TIERS[x].reportsByStudent),
      row('pricing.row.reports', 'cmp.reports.what', (x) => (Number.isFinite(TIERS[x].reportHistoryDays) ? t('cmp.reports.today') : t('pricing.allTime'))),
    ] },
    { id: 'access', title: t('cmp.s.access'), note: t('cmp.s.accessNote'), rows: [
      row('cmp.readAloud', 'cmp.readAloud.what', all),
      row('cmp.calm', 'cmp.calm.what', all),
      row('cmp.text', 'cmp.text.what', all),
      row('cmp.tries', 'cmp.tries.what', all),
    ] },
    { id: 'privacy', title: t('cmp.s.privacy'), rows: [
      row('cmp.freshCode', 'cmp.freshCode.what', all),
      row('cmp.account', 'cmp.account.what', (x) => (Number.isFinite(TIERS[x].reportHistoryDays) ? t('cmp.reports.today') : true)),
      row('cmp.ads', 'cmp.ads.what', all),
    ] },
  ];
}

// A check or a dash is a shape, never a color alone, and says its word to a
// screen reader; limits are plain text.
function Cell({ v }: { v: Value }) {
  if (typeof v === 'string') return <>{v}</>;
  return v
    ? <><Check weight="bold" size={22} className="text-kelly shrink-0" aria-hidden="true" /><span className="sr-only">{t('pricing.yes')}</span></>
    : <><Minus weight="bold" size={22} className="text-muted shrink-0" aria-hidden="true" /><span className="sr-only">{t('pricing.no')}</span></>;
}

// What a row means, as a small (i): hover or tap shows it, a screen reader
// reads it (design system: hints are hover text). Keeps the chart scannable
// (owner, 2026-11-27: "dont be too heavy on text").
function Tip({ text }: { text: string }) {
  return <span className="inline-flex text-muted cursor-help align-middle ml-1.5" tabIndex={0}><span data-tip={text} aria-hidden="true" className="inline-flex"><Info weight="bold" size={15} /></span><span className="sr-only">{text}</span></span>;
}

// A section's fold: the title, how many features are inside, and a caret
// that turns (owner, 2026-11-27: "use expand/collapse carrots").
function Fold({ g, open, onToggle, id }: { g: Group; open: boolean; onToggle: () => void; id: string }) {
  return (
    <button type="button" aria-expanded={open} aria-controls={id} onClick={onToggle} className="w-full flex items-center gap-3 text-left min-h-12 cursor-pointer">
      <span className="font-display text-xl leading-tight flex-1">{g.title}{g.note && <span className="ml-3 font-body text-base font-bold text-muted normal-case">{g.note}</span>}</span>
      <span className="text-sm font-bold text-muted whitespace-nowrap">{t('cmp.count', { count: g.rows.length })}</span>
      <span className="w-9 h-9 rounded-full border-std border-border bg-surface grid place-items-center shrink-0"><CaretDown weight="bold" size={18} className={`motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" /></span>
    </button>
  );
}

export default function CompareChart({ titleClass }: { titleClass: string }) {
  const [pick, setPick] = useState<Plan>('plus');
  const groups = compareGroups();
  // The first section opens; the rest fold, so the chart reads as a short list of topics.
  const [open, setOpen] = useState<Set<string>>(() => new Set(['games']));
  const allOpen = open.size === groups.length;
  const toggle = (id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const shade = (x: Plan) => (x === 'plus' ? 'bg-butter/70' : '');
  return (
    <section id="compare" aria-labelledby="compare-title" className="grid gap-4 mt-4 scroll-mt-20">
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-2 flex-1 min-w-64">
          <h2 id="compare-title" className={titleClass}><Title text={t('cmp.title')} /></h2>
          <p className="text-lg font-semibold leading-snug max-w-3xl m-0">{t('cmp.sub')}</p>
        </div>
        <button type="button" onClick={() => setOpen(allOpen ? new Set() : new Set(groups.map((g) => g.id)))} className="min-h-11 px-4 rounded-pill border-std border-border bg-surface font-bold inline-flex items-center gap-2 hover-pop">
          {allOpen ? t('cmp.closeAll') : t('cmp.openAll')}<CaretDown weight="bold" size={16} className={allOpen ? 'rotate-180' : ''} aria-hidden="true" />
        </button>
      </div>

      {/* Phones: one plan at a time, picked at the top, each section a card. */}
      <div className="sm:hidden grid gap-4">
        <div className="sticky top-16 z-10">
          <Tabs value={pick} onChange={setPick} label={t('cmp.pick')} fill className="mb-0"
            options={PLANS.map((x) => ({ id: x, label: t(`pricing.${x}` as StringKey) }))} />
        </div>
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`cmp-m-${g.id}`} className="bg-surface border-bold border-border rounded-panel overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h3 id={`cmp-m-${g.id}`} className="px-4 py-2 m-0"><Fold g={g} open={open.has(g.id)} onToggle={() => toggle(g.id)} id={`cmp-mb-${g.id}`} /></h3>
            {open.has(g.id) && <dl id={`cmp-mb-${g.id}`} className="m-0">
              {g.rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[1fr_auto] gap-3 items-center px-4 py-3 border-t border-border-soft">
                  <dt className="font-bold leading-snug">{r.label}<Tip text={r.what} /></dt>
                  <dd className={`m-0 font-bold text-right max-w-[9.5rem] flex items-center justify-end gap-1 leading-snug rounded-input px-2 py-1 ${shade(pick)}`}>
                    <span className="sr-only">{t(`pricing.${pick}` as StringKey)}: </span><Cell v={r.value(pick)} />
                  </dd>
                </div>
              ))}
            </dl>}
          </section>
        ))}
      </div>

      {/* Tablets and laptops: one table, the plan names stay at the top while
          it scrolls (overflow clip, not hidden, so the header can stick). */}
      <div className="hidden sm:block bg-surface border-bold border-border rounded-panel overflow-clip" style={{ boxShadow: 'var(--shadow-sticker)' }}>
        <table className="w-full text-left border-separate border-spacing-0">
          <caption className="sr-only">{t('cmp.title')}</caption>
          <colgroup><col className="w-[40%]" /><col className="w-[20%]" /><col className="w-[20%]" /><col className="w-[20%]" /></colgroup>
          <thead>
            <tr>
              <th scope="col" className="sticky top-14 z-10 bg-surface p-3 border-b-[2.5px] border-border text-left"><span className="font-bold text-muted">{t('cmp.feature')}</span></th>
              {PLANS.map((x) => <th key={x} scope="col" className={`sticky top-14 z-10 p-3 border-b-[2.5px] border-border font-score text-2xl font-normal ${x === 'plus' ? 'bg-butter' : 'bg-surface'}`}>{t(`pricing.${x}` as StringKey)}</th>)}
            </tr>
          </thead>
          {groups.map((g) => (
            <Fragment key={g.id}>
              <tbody>
                <tr>
                  <th scope="colgroup" colSpan={4} className="bg-surface-2 px-4 py-2 border-b-[2px] border-border text-left">
                    <Fold g={g} open={open.has(g.id)} onToggle={() => toggle(g.id)} id={`cmp-d-${g.id}`} />
                  </th>
                </tr>
              </tbody>
              <tbody id={`cmp-d-${g.id}`} hidden={!open.has(g.id)}>
                {g.rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="px-4 py-3.5 align-middle border-b border-border-soft text-left font-bold leading-snug">
                      {r.label}<Tip text={r.what} />
                    </th>
                    {PLANS.map((x) => (
                      <td key={x} className={`px-3 py-3.5 align-middle border-b border-border-soft font-semibold leading-snug ${shade(x)}`}>
                        <span className="flex items-start gap-1"><Cell v={r.value(x)} /></span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Fragment>
          ))}
        </table>
      </div>
    </section>
  );
}
