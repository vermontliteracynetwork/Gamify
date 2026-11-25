import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Broadcast, Check, Sticker } from '@phosphor-icons/react';
import { STARTER, StickerArt } from '../brand/Stickers';
import { data } from '../data';
import { listGameCodes } from '../data/gameCodes';
import { useAsync } from '../data/hooks';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { loadMadeThemes } from '../theme/made';
import { Button, buttonClasses, PageHeader, Panel } from '../ui/kit';
import Meter from '../ui/Meter';
import TeacherNav from '../ui/TeacherNav';

// Achievements (approved /brand teacher portal mockup 8, teacher 2026-11-25:
// "apply the new mockups that are in the brand page to the main site").
// Stickers reward playing and trying, never scores, so every child can earn
// them and the fun stays the reason to play (overjustification effect); the
// whole collection shows with how to earn each one, so the goal visibly
// builds (goal-gradient effect). The art is the Starter collection from the
// Classic kit (src/brand/Stickers.tsx).
//
// Only real data (no made-up counts): each sticker is earned from what this
// device already records. The question log has no game id, so "a game played"
// is one game on one day, as the beta checklist counts it; that can only
// undercount. Themes tried, rounds and Calm mode are not recorded yet, so
// those stickers stay locked with their how-to-earn line until they are.
type Have = { have: number; need: number } | null;

async function loadProgress(): Promise<Record<string, Have>> {
  const [classes, log, sets, themes, codes] = await Promise.all([
    data.listClassrooms(), data.listQuestionLog(), data.listQuestionSets(), loadMadeThemes(), listGameCodes(),
  ]);
  const [students, assignments] = await Promise.all([
    Promise.all(classes.map((c) => data.listStudents(c.id))).then((x) => x.flat()),
    Promise.all(classes.map((c) => data.listAssignments(c.id))).then((x) => x.flat()),
  ]);
  const games = new Set(log.map((e) => `${e.at.slice(0, 10)}|${e.gameId}`));
  const perGame = new Map<string, number>();
  for (const k of games) { const g = k.split('|')[1]; perGame.set(g, (perGame.get(g) ?? 0) + 1); }
  const month = new Date().toISOString().slice(0, 7);
  const days = new Set(log.filter((e) => e.at.startsWith(month)).map((e) => e.at.slice(0, 10))).size;
  const played = new Set(log.map((e) => e.gameId));
  const own = sets.filter((s) => s.ownerId !== 'gamify' && s.questions.length > 0).length;
  const homework = codes.some((c) => !!c.due) || assignments.some((a) => !!a.endsOn) ? 1 : 0;
  return {
    first: { have: Math.min(games.size, 1), need: 1 },
    plays: { have: Math.min(Math.max(0, ...perGame.values()), 5), need: 5 },
    days: { have: Math.min(days, 5), need: 5 },
    students: { have: Math.min(students.length, 10), need: 10 },
    set: { have: Math.min(own, 1), need: 1 },
    homework: { have: homework, need: 1 },
    live: { have: log.some((e) => e.mode === 'live') ? 1 : 0, need: 1 },
    every: { have: GAMES.filter((g) => played.has(g.id)).length, need: GAMES.length },
    theme: { have: Math.min(themes.filter((th) => th.source === 'custom').length, 1), need: 1 },
    themes: null, rounds: null, calm: null,
  };
}

export default function AchievementsPage() {
  const { value: progress } = useAsync(loadProgress);
  const board = useRef<HTMLDivElement>(null);
  const done = (id: string) => { const p = progress?.[id]; return !!p && p.have >= p.need; };
  const earned = progress ? STARTER.filter((s) => done(s.id)).length : 0;
  const bigScreen = () => { void board.current?.requestFullscreen?.().catch(() => undefined); };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav startOpen={false} />
      <PageHeader title={t('ach.title')} subtitle={t('ach.sub')}
        actions={<Button variant="main" onClick={bigScreen}><Broadcast weight="bold" size={18} />{t('ach.bigScreen')}</Button>} />
      {progress && earned === 0 && (
        <div className="rounded-card p-5 mb-4 flex flex-wrap items-center gap-4 border-[2.5px] border-dashed border-muted bg-surface/60">
          <span className="w-12 h-12 rounded-full grid place-items-center border-std border-border bg-blush shrink-0"><Sticker weight="bold" size={22} /></span>
          <div className="grid gap-0.5 flex-1 min-w-60">
            <h2 className="font-heading font-bold">{t('ach.emptyTitle')}</h2>
            <p className="text-sm font-bold text-muted leading-snug">{t('ach.emptyText')}</p>
          </div>
          <Link to="/teacher/activity" className={buttonClasses('main')}>{t('teacherNav.create')}<ArrowRight weight="bold" size={16} /></Link>
        </div>
      )}
      <div ref={board} className="ach-board grid gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-heading font-bold text-lg flex-1 min-w-48">{t('ach.collection')}</h2>
          {progress && <b>{t('ach.count', { got: earned, total: STARTER.length })}</b>}
          {progress && <Meter part={earned / STARTER.length} width="min(100%, 12rem)" height={18} label={t('ach.count', { got: earned, total: STARTER.length })} />}
        </div>
        <Panel>
          <ul className="list-none m-0 p-0 grid gap-x-4 gap-y-6" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 8.5rem), 1fr))' }}>
            {STARTER.map((s) => {
              const p = progress?.[s.id];
              const got = done(s.id);
              return (
                <li key={s.id} className="grid justify-items-center content-start text-center gap-1.5">
                  <span className="block w-full max-w-[8.5rem] aspect-square"><StickerArt s={s} size="100%" locked={!got} /></span>
                  <span className="text-sm font-bold leading-snug text-balance">{s.earn}</span>
                  <span className={`min-h-7 px-2.5 rounded-pill text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap ${got ? 'bg-mint-soft' : 'bg-surface-2'}`}>
                    {got ? <><Check weight="bold" size={12} />{t('ach.earned')}</>
                      : p && p.need > 1 ? t('ach.sofar', { have: p.have, need: p.need }) : t('ach.notYet')}
                  </span>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>
    </main>
  );
}
