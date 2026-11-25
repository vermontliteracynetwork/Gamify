import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, GearSix, PencilSimple, Printer, Trash, UserCircle } from '@phosphor-icons/react';
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from 'recharts';
import { data } from '../data';
import { useAsync, useMySets } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { QuestionLogEntry } from '../data/types';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import PinGate from '../settings/PinGate';
import Avatar from '../student/Avatar';
import { avatarOf } from '../student/pictures';
import { useMadeThemes } from '../theme/made';
import { AXIS, ChartContainer, useChartAnimate } from '../ui/chart';
import { Button, buttonClasses, IconButton } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import Title from '../ui/Title';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { AvatarDialog, Dialog, StudentStrip, SupportsDialog, supportChips } from './ClassPage';
import { Chip, firstTry, fmtDay, PortalCard, skillsOf, Takeaway, weekly, type SkillBand } from './portalParts';
import ReportDoc from './reportDoc';

// One student inside a class, in the approved teacher portal look
// (/brand?tab=teacher, view 7c, 2026-11-25): growth over time compared with
// the student's own start (never classmates), skills by standard in three
// bands, recent play and the teacher's own notes; Family report prints it.
// Every classmate stays one tap away at the top (teacher, 2026-11-16), and
// the full progress report follows. Only real data: cards with too little
// play say what will fill them.
const BANDS: [SkillBand, StringKey, string][] = [['mastered', 'sp.mastered', 'bg-mint-soft'], ['practicing', 'sp.practicing', 'bg-butter'], ['notYet', 'sp.notYet', 'bg-blush']];
const MODE: Record<QuestionLogEntry['mode'], StringKey> = { live: 'sp.mode.live', share: 'sp.mode.share', solo: 'sp.mode.solo', versus: 'sp.mode.versus' };

export default function StudentPage() {
  const { id = '', sid = '' } = useParams();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { value: students = [], reload } = useAsync(() => data.listStudents(id), [id]);
  const { value: assignments = [] } = useAsync(() => data.listAssignments(id), [id]);
  const { value: log = [] } = useAsync(() => data.listQuestionLog({ classroomId: id }), [id]);
  const { value: mine = [] } = useMySets();
  const sets = useMemo(() => [...mine, ...LIBRARY], [mine]);
  const { themes } = useMadeThemes();
  const animate = useChartAnimate();
  const classroom = classes.find((c) => c.id === id);
  const student = students.find((s) => s.id === sid);
  const look = themes.find((th) => th.id === classroom?.signInThemeId);
  const [dialog, setDialog] = useState<'pin' | 'supports' | 'avatar' | 'note' | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [note, setNote] = useState('');
  useCrumbLabel(student?.name);
  const mineLog = useMemo(() => log.filter((e) => e.studentId === sid), [log, sid]);
  const weeks = useMemo(() => weekly(mineLog).slice(-8), [mineLog]);
  const skills = useMemo(() => skillsOf(mineLog, sets), [mineLog, sets]);
  // Recent play: one row per day, set, game and way to play.
  const sessions = useRecent(mineLog);
  if (!classroom || !student) return null;
  const setName = (x?: string) => sets.find((s) => s.id === x)?.name ?? t('reports.noSet');
  const gameName = (g: string) => GAMES.find((x) => x.id === g)?.name ?? g;
  const own = assignments.filter((a) => !a.studentId || a.studentId === sid);
  const names = { student: () => student.name, set: setName, game: gameName };
  const chips = supportChips(student);
  const sub = chips.length ? t('sp.subSupports', { cls: classroom.name, supports: chips.join(', ') }) : classroom.name;

  // Growth: this week against the student's first week.
  const start = weeks[0];
  const now = weeks[weeks.length - 1];
  const diff = start && now ? now.pct - start.pct : 0;
  const growthText = weeks.length < 2 ? '' : diff >= 5 ? t('sp.growthUp', { name: student.name, n: diff, week: start.label }) : diff <= -5 ? t('sp.growthDown', { name: student.name, n: -diff, week: start.label }) : t('sp.growthSteady', { name: student.name, week: start.label });
  const lowest = [...skills].filter((s) => s.band !== 'mastered').sort((a, b) => a.pct - b.pct)[0];

  async function saveNote() {
    if (!student || !note.trim()) return;
    await data.saveStudent({ ...student, notes: [{ at: new Date().toISOString(), text: note.trim().slice(0, 500) }, ...(student.notes ?? [])] });
    setNote(''); setDialog(null); reload();
  }
  async function removeNote(at: string) {
    if (!student) return;
    const rest = (student.notes ?? []).filter((n) => n.at !== at);
    await data.saveStudent({ ...student, notes: rest.length ? rest : undefined });
    reload();
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <Link to={`/teacher/classes/${id}`} className="inline-flex items-center gap-1.5 font-bold mb-3"><ArrowLeft weight="bold" size={18} />{classroom.name}</Link>
      <StudentStrip classId={id} students={students} current={sid} look={look} />
      <div className="flex flex-wrap items-center gap-4 mb-5">
        <button type="button" onClick={() => setDialog('avatar')} aria-label={t('class.avatarFor', { name: student.name })} className="rounded-full active:scale-95 shrink-0"><Avatar avatar={avatarOf(student)} theme={look} size={68} /></button>
        <div className="min-w-0 flex-1 basis-[20rem]">
          <p className="text-xs font-bold uppercase tracking-wider text-muted">{t('cv.studentView')}</p>
          <h1 className="title-bubble text-3xl"><Title text={student.name} /></h1>
          <p className="font-semibold text-muted break-words">{sub} · <span className="tabular-nums">{t('class.pinIs', { pin: student.pin ?? '' })}</span></p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setDialog(unlocked ? 'supports' : 'pin')}><GearSix weight="bold" size={18} />{t('cv.supports')}</Button>
          <Button onClick={() => setDialog('avatar')}><UserCircle weight="bold" size={18} />{t('cv.avatarPin')}</Button>
          <Button onClick={() => setDialog('note')}><PencilSimple weight="bold" size={18} />{t('sp.addNote')}</Button>
          <Link to={`/teacher/reports/print?class=${id}&student=${sid}`} className={buttonClasses('primary')}><Printer weight="bold" size={18} />{t('sp.family')}</Link>
        </div>
      </div>

      <div className="grid gap-4 items-start lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] mb-6">
        <div className="grid gap-4 min-w-0">
          <PortalCard labelledBy="sp-growth" title={t('sp.growth')} tip={t('sp.growthTip', { name: student.name })}>
            {weeks.length < 2 ? <p className="text-sm font-semibold text-muted">{t('sp.growthEmpty')}</p> : <>
              <ChartContainer label={t('sp.growthChart', { name: student.name, from: start.pct, to: now.pct, weeks: weeks.length })} height={230} config={{ pct: { label: t('rp.firstTry'), color: 'var(--grape)' } }}>
                <LineChart data={weeks} margin={{ top: 12, right: 16, left: -18, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="rgba(29,26,51,0.08)" />
                  <XAxis dataKey="label" {...AXIS} />
                  <YAxis domain={[0, 100]} ticks={[0, 50, 80, 100]} {...AXIS} />
                  <ReferenceLine y={start.pct} stroke="var(--text-muted)" strokeDasharray="4 4" label={{ value: t('sp.start'), position: 'insideTopLeft', fill: 'var(--text-muted)', fontSize: 12, fontWeight: 700 }} />
                  <Line dataKey="pct" stroke="var(--color-pct)" strokeWidth={3.5} dot={{ r: 5, fill: 'var(--paper)', strokeWidth: 3 }} isAnimationActive={animate} />
                </LineChart>
              </ChartContainer>
              <Takeaway text={growthText} />
            </>}
          </PortalCard>
          <PortalCard labelledBy="sp-skills" title={t('sp.skills')} tip={t('sp.skillsTip')}>
            {skills.length === 0 ? <p className="text-sm font-semibold text-muted">{t('sp.skillsEmpty')}</p> : <>
              <div className="grid gap-3 sm:grid-cols-3 mb-3">
                {BANDS.map(([band, label, bg]) => (
                  <div key={band} className={`rounded-input p-3 grid gap-1.5 content-start ${bg}`}>
                    <h3 className="m-0 text-sm font-bold">{t(label)}</h3>
                    {skills.filter((s) => s.band === band).map((s) => <span key={s.standard} className="text-[0.8125rem] font-semibold leading-snug"><b>{s.standard}</b> · {s.pct}%</span>)}
                    {!skills.some((s) => s.band === band) && <span className="text-[0.8125rem] font-semibold text-muted">{t('sp.noneHere')}</span>}
                  </div>
                ))}
              </div>
              {lowest && <Takeaway text={t('sp.skillsNext', { standard: lowest.standard, pct: lowest.pct })}
                action={<Link to={`/teacher/classes/${id}?tab=sets`} className={buttonClasses('primary', '', 'sm')}>{t('sp.assignPractice')}<ArrowRight weight="bold" size={14} /></Link>} />}
            </>}
          </PortalCard>
        </div>
        <div className="grid gap-4 min-w-0">
          <PortalCard labelledBy="sp-recent" title={t('sp.recent')}>
            {sessions.length === 0 ? <p className="text-sm font-semibold text-muted">{t('sp.recentEmpty')}</p> : (
              <ul className="list-none m-0 p-0 grid gap-2 text-sm">
                {sessions.slice(0, 5).map((r) => (
                  <li key={r.key} className="rounded-[0.625rem] p-2.5 grid gap-0.5 bg-[var(--cream)]">
                    <span className="flex gap-2"><b className="min-w-0 break-words">{setName(r.setId)}</b><span className="ml-auto font-bold whitespace-nowrap">{t('sp.ofRight', { right: r.right, of: r.answered })}</span></span>
                    <span className="text-[0.8125rem] font-semibold text-muted">{fmtDay(r.day)}, {gameName(r.gameId)}, {t(MODE[r.mode])}, {t('sp.minutes', { count: r.minutes })}</span>
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>
          <PortalCard labelledBy="sp-notes" title={t('sp.notes')} tip={t('sp.notesTip')} right={<Button size="sm" onClick={() => setDialog('note')}><PencilSimple weight="bold" size={16} />{t('sp.addNote')}</Button>}>
            {(student.notes ?? []).length === 0 ? <p className="text-sm font-semibold text-muted">{t('sp.notesEmpty')}</p> : (
              <ul className="list-none m-0 p-0 grid gap-2">
                {(student.notes ?? []).map((n) => (
                  <li key={n.at} className="rounded-input p-3 text-[0.8125rem] font-semibold leading-snug bg-lavender flex gap-2 items-start">
                    <span className="flex-1 min-w-0 break-words"><b>{fmtDay(n.at.slice(0, 10))}:</b> {n.text}</span>
                    <IconButton label={t('sp.removeNote')} onClick={() => void removeNote(n.at)} className="!w-8 !h-8 bg-surface"><Trash weight="bold" size={16} /></IconButton>
                  </li>
                ))}
              </ul>
            )}
          </PortalCard>
          <PortalCard labelledBy="sp-sets" title={t('cv.assignedHere', { name: student.name })}>
            {own.length === 0 ? <p className="text-sm font-semibold">{t('class.noAssigned')}</p> : (
              <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0">
                {own.map((a) => <li key={a.id}><Chip bg="var(--color-gamify)"><b>{setName(a.setId)}</b><span className="text-muted">· {a.studentId ? student.name : t('class.wholeClass')}</span></Chip></li>)}
              </ul>
            )}
          </PortalCard>
        </div>
      </div>

      <ReportDoc log={mineLog} students={[student]} names={names} standardsOf={(x) => sets.find((s) => s.id === x)?.standards} className={classroom.name} student={student} />
      {dialog === 'pin' && <Dialog title={t('class.supportsFor', { name: student.name })} onClose={() => setDialog(null)}><PinGate onUnlock={() => { setUnlocked(true); setDialog('supports'); }} /></Dialog>}
      {dialog === 'supports' && <SupportsDialog student={student} onClose={() => { setDialog(null); reload(); }} />}
      {dialog === 'avatar' && <AvatarDialog student={student} others={students.filter((x) => x.id !== sid)} look={look} onClose={() => { setDialog(null); reload(); }} />}
      {dialog === 'note' && (
        <Dialog title={t('sp.noteFor', { name: student.name })} onClose={() => setDialog(null)}>
          <label className="grid gap-1 font-bold">{t('sp.noteLabel')}
            <textarea autoFocus value={note} maxLength={500} rows={4} onChange={(e) => setNote(e.target.value)} placeholder={t('sp.notePlaceholder')} className="px-3 py-2 rounded-input border-std border-border font-semibold" />
          </label>
          <p className="text-sm font-semibold text-muted">{t('sp.notePrivate')}</p>
          <Button variant="primary" disabled={!note.trim()} onClick={() => void saveNote()}>{t('sp.saveNote')}</Button>
        </Dialog>
      )}
    </main>
  );
}

function useRecent(entries: QuestionLogEntry[]) {
  return useMemo(() => {
    const by = new Map<string, QuestionLogEntry[]>();
    for (const e of entries) {
      const k = `${e.at.slice(0, 10)}|${e.setId ?? ''}|${e.gameId}|${e.mode}`;
      by.set(k, [...(by.get(k) ?? []), e]);
    }
    return [...by].map(([key, es]) => {
      const ft = firstTry(es);
      return {
        key, day: es[0].at.slice(0, 10), setId: es[0].setId, gameId: es[0].gameId, mode: es[0].mode,
        answered: ft.answered, right: es.filter((e) => e.outcome === 'right').length,
        minutes: Math.max(1, Math.round(es.reduce((s, e) => s + e.ms, 0) / 60000)), last: es.reduce((d, e) => (e.at > d ? e.at : d), ''),
      };
    }).sort((a, b) => b.last.localeCompare(a.last));
  }, [entries]);
}
