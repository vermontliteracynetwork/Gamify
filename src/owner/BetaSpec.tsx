import { Link } from 'react-router-dom';
import { data } from '../data';
import { useAsync } from '../data/hooks';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { BETA, GOALS, MEDIA_RULES, REQUIREMENTS, STUDENT_COMMENT_GUIDE, dollars, fullPrice, offerPrice } from '../beta/spec';
import { MATERIALS, THEME_IDEAS } from '../beta/themeIdeas';
import { readApplication, scoreApplication } from '../beta/application';
import type { FeedbackReport } from '../data/types';
import type { StringKey } from '../i18n/en';

// Every beta test rule on the owner's Beta test page (owner, 2026-11-24: "add
// all the beta test specifications to my developer portal"), from
// src/beta/spec.ts, plus the beta reports that have come in. The live,
// editable copy is the dev plan doc's Beta Test Plan tab.
const PLAN_DOC = 'https://claude.ai/artifact/P8kwMjDCq1E2yCa8VaMSpj';

// Proposed ready-to-launch bar (question 4): still the owner's call.
const LAUNCH_BAR = [
  'Every listed game played in at least 5 classrooms, on at least 3 kinds of device',
  'No bug that stops a class open for the last 2 weeks',
  'Every school network or IT block has a fix or an allowlist step on the IT page',
  'Most students pick the happy face for most games',
  'At least 25 new themes from beta classes, some for high school',
  'At least 5 teacher quotes with permission',
  'Attorney has approved Terms, Privacy and the photo release',
];

function Block({ title, items }: { title: string; items: string[] }) {
  return (
    <section className="dash-card">
      <h2 className="font-bold text-lg m-0">{title}</h2>
      <ul className="dash-list">{items.map((i) => <li key={i} className="flex gap-2"><span className="dash-dot mt-2" />{i}</li>)}</ul>
    </section>
  );
}

export default function BetaSpec() {
  const { value: reports = [] } = useAsync(() => data.listFeedback());
  const beta = reports.filter((r) => r.kind === 'beta').slice().reverse();
  const applications = beta.filter((r) => r.details.startsWith('Beta test request'));
  const forms = beta.filter((r) => r.details.startsWith('Beta game form'));
  const student = beta.filter((r) => r.role === 'student');
  const offer = offerPrice();
  return (
    <div className="grid gap-5">
      <section className="dash-card">
        <div className="dash-card-head">
          <h2 className="font-bold text-lg m-0">{t('obeta.title')}</h2>
          <a href={PLAN_DOC} target="_blank" rel="noreferrer" className="dash-link">{t('obeta.doc')}</a>
        </div>
        <ul className="dash-kpis">
          {[[t('obeta.apps'), applications.length], [t('obeta.spots'), BETA.spots], [t('obeta.forms'), forms.length], [t('obeta.student'), student.length]].map(([l, v]) => (
            <li key={String(l)} className="dash-card !p-3"><span className="dash-kpi-label">{l}</span><span className="dash-kpi-value">{v}</span></li>
          ))}
        </ul>
        <p className="dash-sub m-0">{t('obeta.note')}</p>
      </section>
      <div className="grid lg:grid-cols-2 gap-5">
        <Block title={t('obeta.goals')} items={GOALS} />
        <Block title={t('obeta.who')} items={[`Enrollment closes after ${BETA.spots} approved beta testers.`, ...BETA.mix]} />
        <Block title={t('obeta.plan')} items={[
          `During the beta: ${t(`pricing.${BETA.tier}`)} free for ${BETA.months} months for every approved tester, with unlimited themes.`,
          `After: ${BETA.offer.discount * 100}% off a yearly ${t(`pricing.${BETA.offer.tier}`)} plan for ${BETA.offer.years} year (${dollars(offer)} instead of ${dollars(fullPrice())}). Yearly only.`,
          `Give access with one beta code (${t(`pricing.${BETA.tier}`)}, ${BETA.months} months, ${BETA.spots} uses) in Access codes, or give a plan with the note "beta".`,
        ]} />
        <Block title={t('obeta.must')} items={[...REQUIREMENTS, `The listed games: ${GAMES.map((g) => g.name).join(', ')}.`]} />
        <Block title={t('obeta.forms2')} items={[
          `Teacher after-game form: ${BETA.teacherFormMinutes} minutes. Did it work, what went wrong (froze, slow, blocked by the network or IT, cut off, sound, confusing), did students like it, setup, plus two short answers.`,
          `Students: three faces after each game (${BETA.studentFormMinutes} minutes with a comment). The comment is optional.`,
          ...STUDENT_COMMENT_GUIDE,
        ]} />
        <Block title={t('obeta.media')} items={MEDIA_RULES} />
        <Block title={t('obeta.themes')} items={[
          'Two ways to design, always named together: Digital design and Physical design. Never the word Canva.',
          `Materials: ${MATERIALS.map((m) => m.name.toLowerCase()).join('; ')}.`,
          `${THEME_IDEAS.length} theme ideas on the classroom kit, for example ${THEME_IDEAS.slice(0, 3).map((i) => `${i.title} (${i.game})`).join(', ')}.`,
          'Regular theme idea emails to testers (after the domain and the email service).',
        ]} />
        <Block title={t('obeta.bar')} items={LAUNCH_BAR} />
      </div>
      <Applications list={applications} />
      <section className="dash-card">
        <div className="dash-card-head"><h2 className="font-bold text-lg m-0">{t('obeta.latest')}</h2><Link to="/owner?s=feedback" className="dash-link">{t('obeta.all')}</Link></div>
        {beta.length === 0 ? <p className="dash-empty m-0">{t('obeta.none')}</p> : (
          <ul className="dash-list">{beta.slice(0, 8).map((r) => <li key={r.id} className="dash-report"><span className="dash-tag">{r.role} · {r.at.slice(0, 10)}</span>{r.details}</li>)}</ul>
        )}
      </section>
      <p className="text-sm font-semibold text-muted m-0">{t('obeta.links')} <Link to="/beta">/beta</Link> · <Link to="/beta-kit">/beta-kit</Link> · <Link to="/it">/it</Link></p>
    </div>
  );
}

// The formal applications from /beta/apply (owner, 2026-11-26), each field on
// its own line, with a plain follow-through score. The score only helps her
// read; it never rejects anyone. Older one-line requests show as sent.
const SHOW = ['Email', 'Role', 'School', 'State', 'Grades', 'Class size', 'Subjects', 'Devices', 'Can play', 'Games', 'Commitments', 'Network notes'];
function Applications({ list }: { list: FeedbackReport[] }) {
  return (
    <section className="dash-card" aria-labelledby="beta-apps">
      <h2 id="beta-apps" className="font-bold text-lg m-0">{t('obeta.appsTitle')}</h2>
      <p className="dash-sub m-0">{t('obeta.appsNote')}</p>
      {list.length === 0 ? <p className="dash-empty m-0">{t('obeta.noApps')}</p> : (
        <ul className="grid gap-3 list-none p-0 m-0">
          {list.map((r) => {
            const f = readApplication(r.details);
            if (!f) return <li key={r.id} className="rounded-input border-std border-border-soft p-3 grid gap-1"><span className="dash-tag">{t('obeta.oldApp')} · {r.at.slice(0, 10)}</span><span className="font-semibold">{r.details}</span></li>;
            const sc = scoreApplication(f);
            return (
              <li key={r.id} className="rounded-input border-std border-border-soft p-3 grid gap-2" data-beta-app>
                <div className="flex flex-wrap items-center gap-2">
                  <strong className="text-base">{f['Name']}</strong>
                  <span className="dash-tag">{r.at.slice(0, 10)}</span>
                  <span className={`ml-auto px-2.5 py-0.5 rounded-pill border-std border-border font-bold text-sm ${sc.points >= sc.of ? 'bg-mint' : sc.points >= sc.of - 1 ? 'bg-butter' : 'bg-surface-2'}`}>{t('obeta.score', { n: sc.points, of: sc.of })}</span>
                </div>
                <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                  {sc.signals.map((x) => <li key={x.key} className={`text-xs font-bold px-2 py-0.5 rounded-pill border ${x.ok ? 'border-border bg-mint' : 'border-border-soft bg-surface text-muted line-through'}`}>{t(`obeta.sig.${x.key}` as StringKey)}</li>)}
                </ul>
                <dl className="grid sm:grid-cols-[9rem_1fr] gap-x-3 gap-y-0.5 m-0 text-sm">
                  {SHOW.map((k) => <div key={k} className="contents"><dt className="font-bold text-muted">{k}</dt><dd className="m-0 font-semibold break-words">{f[k] ?? ''}</dd></div>)}
                </dl>
                <p className="m-0 text-sm"><strong>Why: </strong>{f['Why']}</p>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
