import { Fragment, useState } from 'react';
import { Check, Minus } from '@phosphor-icons/react';
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

export default function CompareChart({ titleClass }: { titleClass: string }) {
  const [pick, setPick] = useState<Plan>('plus');
  const groups = compareGroups();
  const shade = (x: Plan) => (x === 'plus' ? 'bg-butter/70' : '');
  return (
    <section id="compare" aria-labelledby="compare-title" className="grid gap-4 mt-4 scroll-mt-20">
      <div className="grid gap-2">
        <h2 id="compare-title" className={titleClass}><Title text={t('cmp.title')} /></h2>
        <p className="text-lg font-semibold leading-snug max-w-3xl m-0">{t('cmp.sub')}</p>
      </div>

      {/* Phones: one plan at a time, picked at the top, each section a card. */}
      <div className="sm:hidden grid gap-4">
        <div className="sticky top-16 z-10">
          <Tabs value={pick} onChange={setPick} label={t('cmp.pick')} fill className="mb-0"
            options={PLANS.map((x) => ({ id: x, label: t(`pricing.${x}` as StringKey) }))} />
        </div>
        {groups.map((g) => (
          <section key={g.id} aria-labelledby={`cmp-m-${g.id}`} className="bg-surface border-bold border-border rounded-panel overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h3 id={`cmp-m-${g.id}`} className="font-display text-xl leading-tight px-4 pt-4 pb-2 m-0">{g.title}{g.note && <span className="block font-body text-base font-bold text-muted mt-1">{g.note}</span>}</h3>
            <dl className="m-0">
              {g.rows.map((r) => (
                <div key={r.label} className="grid grid-cols-[1fr_auto] gap-3 items-center px-4 py-3 border-t border-border-soft">
                  <dt className="grid gap-0.5"><span className="font-bold leading-snug">{r.label}</span><span className="text-sm font-semibold text-muted leading-snug">{r.what}</span></dt>
                  <dd className={`m-0 font-bold text-right max-w-[9.5rem] flex items-center justify-end gap-1 leading-snug rounded-input px-2 py-1 ${shade(pick)}`}>
                    <span className="sr-only">{t(`pricing.${pick}` as StringKey)}: </span><Cell v={r.value(pick)} />
                  </dd>
                </div>
              ))}
            </dl>
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
                  <th scope="colgroup" colSpan={4} className="bg-surface-2 px-3 pt-5 pb-2 border-b-[2px] border-border text-left">
                    <span className="font-display text-xl">{g.title}</span>
                    {g.note && <span className="ml-3 font-bold text-muted">{g.note}</span>}
                  </th>
                </tr>
                {g.rows.map((r) => (
                  <tr key={r.label}>
                    <th scope="row" className="p-3 align-top border-b border-border-soft text-left font-normal">
                      <span className="block font-bold leading-snug">{r.label}</span>
                      <span className="block text-sm font-semibold text-muted leading-snug mt-0.5">{r.what}</span>
                    </th>
                    {PLANS.map((x) => (
                      <td key={x} className={`p-3 align-top border-b border-border-soft font-semibold leading-snug ${shade(x)}`}>
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
