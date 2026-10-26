import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Broadcast, CalendarCheck, Copy, DeviceTablet, LockSimple, Play, ProjectorScreen, QrCode, ShareNetwork, UsersThree, X } from '@phosphor-icons/react';
import { canPlayGame, TIERS } from '../config';
import { data, newId } from '../data';
import { GAME_CODE_DAYS, gameLink, makeGameCode, type GameCode } from '../data/gameCodes';
import { useAsync, useTier } from '../data/hooks';
import { missingDetails } from '../data/setDetails';
import type { QuestionSet } from '../data/types';
import { GameCover } from '../games/covers';
import { ModeBadge } from '../games/ModeBadge';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { Button, buttonClasses } from '../ui/kit';
import { classroomShare } from '../data/gameCodes';
import Title from '../ui/Title';
import DialogFocus from '../ui/DialogFocus';
import { supabase } from '../data/supabase';

// Host or assign one set (Part 3B, path 2): pick a game from cover cards,
// then how the class plays it (teacher, 2026-10-26): on the big screen (teams
// the teacher makes, random teams, or the whole class together), on their own
// devices with a code (compete or together), or as homework with a due date.
type Where = 'screen' | 'devices' | 'homework';
const WHERE = [
  { id: 'screen' as const, icon: ProjectorScreen },
  { id: 'devices' as const, icon: DeviceTablet },
  { id: 'homework' as const, icon: CalendarCheck },
];
export default function HostDialog({ set, onClose }: { set: QuestionSet; onClose: () => void }) {
  const tier = useTier();
  const navigate = useNavigate();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [gameId, setGameId] = useState<string | null>(null);
  const [code, setCode] = useState<GameCode | null>(null);
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
  const [where, setWhere] = useState<Where>('screen');
  const [teams, setTeams] = useState<'teacher' | 'random' | 'class'>('teacher');
  const [together, setTogether] = useState<'compete' | 'together'>('compete');
  const today = new Date().toLocaleDateString('en-CA');
  const days = TIERS[tier].homeworkDaysAhead;
  const lastDue = Number.isFinite(days) ? new Date(Date.now() + days * 86400000).toLocaleDateString('en-CA') : undefined;
  const [due, setDue] = useState(() => new Date(Date.now() + 7 * 86400000).toLocaleDateString('en-CA'));
  const dueOk = !!due && due >= today && (!lastDue || due <= lastDue);
  const missing = missingDetails(set);
  const game = GAMES.find((g) => g.id === gameId);

  async function assign() {
    const current = await data.listAssignments(classId);
    if (current.filter((a) => !a.studentId).length >= TIERS[tier].assignedSetsPerStudent) { setStatus(t('host.assignLimit')); return; }
    await data.saveAssignment({ id: newId('asg'), classroomId: classId, setId: set.id, starred: false });
    setStatus(t('host.assigned', { name: classes.find((c) => c.id === classId)?.name ?? '' }));
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45" role="dialog" aria-modal="true" aria-label={t('host.title', { name: set.name })}>
      <DialogFocus onClose={onClose} />
      <div className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-4 w-full max-w-3xl max-h-[calc(100dvh-32px)] overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-2xl"><Title text={t('host.title', { name: set.name || t('sets.untitled') })} /></h2>
          <button type="button" onClick={onClose} aria-label={t('class.close')} className="w-11 h-11 rounded-full border-[2px] border-border bg-surface-2 flex items-center justify-center"><X weight="bold" size={20} /></button>
        </div>
        {missing.length > 0 ? <p className="font-bold">{t('host.needsDetails')}</p> : (
          <>
            <p className="font-bold">{t('host.pickGame')}</p>
            <div role="radiogroup" aria-label={t('host.pickGame')} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GAMES.map((g) => {
                const open = canPlayGame(tier, g.id);
                return (
                  <button key={g.id} type="button" role="radio" aria-checked={gameId === g.id} disabled={!open} onClick={() => { setGameId(g.id); setWhere(g.modes.includes('share') ? 'screen' : 'devices'); setCode(null); setStatus(''); }}
                    className={`rounded-input border-[2.5px] overflow-hidden text-left bg-surface ${gameId === g.id ? 'border-border ring-4 ring-accent' : 'border-border-soft'} disabled:opacity-60`}>
                    <span className="relative block"><GameCover gameId={g.id} className="aspect-[16/10]" />{!open && <LockSimple weight="fill" size={28} className="absolute top-2 right-2" />}</span>
                    <span className="p-2 grid gap-1"><span className="font-display text-lg">{g.name}</span><span className="flex flex-wrap gap-1">{g.modes.map((m) => <ModeBadge key={m} mode={m} />)}</span></span>
                  </button>
                );
              })}
            </div>
            {game && (
              <>
                <p className="font-bold">{t('host.where')}</p>
                <div role="radiogroup" aria-label={t('host.where')} className="grid sm:grid-cols-3 gap-2">
                  {WHERE.map(({ id, icon: Icon }) => (
                    <button key={id} type="button" role="radio" aria-checked={where === id} onClick={() => { setWhere(id); setCode(null); setStatus(''); }}
                      className={`min-h-20 p-3 rounded-input border-[2.5px] text-left grid grid-cols-[auto_1fr] gap-x-2 items-center ${where === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                      <Icon weight="fill" size={30} aria-hidden="true" className="row-span-2" />
                      <span className="font-display text-lg leading-tight">{t(`host.where.${id}`)}</span>
                      <span className="text-sm font-semibold text-muted leading-snug">{t(`host.where.${id}Hint`)}</span>
                    </button>
                  ))}
                </div>

                {where === 'screen' && (
                  <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-3">
                    {game.modes.includes('share') ? (
                      <Choices label={t('host.teams')} value={teams} onChange={setTeams}
                        options={(['teacher', 'random', 'class'] as const).map((k) => ({ id: k, title: t(`host.teams.${k}`), hint: t(`host.teams.${k}Hint`) }))} />
                    ) : <p className="font-bold text-sm">{t('host.screenSolo')}</p>}
                    <Button variant="primary" className="justify-self-start" onClick={() => navigate(`/games/${game.id}?set=${set.id}${game.modes.includes('share') ? `&teams=${teams}` : ''}`)}><Play weight="fill" size={18} />{t('host.play')}</Button>
                  </div>
                )}

                {where === 'devices' && (
                  <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-3">
                    <Choices label={t('live.howPlay')} value={together} onChange={setTogether}
                      options={(['compete', 'together'] as const).map((k) => ({ id: k, title: t(`live.mode.${k}`), hint: t(`live.mode.${k}Hint`) }))} />
                    <div className="flex flex-wrap gap-2">
                      <Button variant="primary" onClick={async () => navigate(`/teacher/live/${(await makeGameCode(game.id, set.id, 'live')).code}?mode=${together}`)}><Broadcast weight="bold" size={18} />{t('host.live')}</Button>
                      {!code && <Button onClick={async () => setCode(await makeGameCode(game.id, set.id))}><QrCode weight="bold" size={18} />{t('host.makeCode')}</Button>}
                    </div>
                    <p className="text-sm font-semibold text-muted">{t('host.liveHint')}</p>
                    {code && <CodeBox code={code} setName={set.name} onCopied={() => setStatus(t('host.copied'))} onShow={() => navigate(`/show/${code.code}`)} />}
                  </div>
                )}

                {where === 'homework' && (
                  <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-3">
                    <label className="flex flex-wrap items-center gap-2 font-bold">{t('host.due')}
                      <input type="date" value={due} min={today} max={lastDue} onChange={(e) => { setDue(e.target.value); setCode(null); }}
                        className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold bg-surface" />
                    </label>
                    {Number.isFinite(TIERS[tier].homeworkDaysAhead) && <p className="text-sm font-semibold text-muted">{t('host.dueLimit', { days: TIERS[tier].homeworkDaysAhead })}</p>}
                    {code ? <CodeBox code={code} setName={set.name} onCopied={() => setStatus(t('host.copied'))} />
                      : <Button variant="primary" className="justify-self-start" disabled={!dueOk} onClick={async () => setCode(await makeGameCode(game.id, set.id, 'play', due))}><QrCode weight="bold" size={18} />{t('host.makeHomework')}</Button>}
                    {classes.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select aria-label={t('reports.class')} value={classId} onChange={(e) => setClassId(e.target.value)} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold">
                          <option value="">{t('host.pickClass')}</option>
                          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <Button disabled={!classId} onClick={() => void assign()}><UsersThree weight="bold" size={18} />{t('host.assignBtn')}</Button>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            <p role="status" aria-live="polite" className="font-bold min-h-6">{status}</p>
            {!supabase && <p className="text-sm font-bold text-muted">{t('host.deviceNote')}</p>}
          </>
        )}
      </div>
    </div>
  );
}

function Choices<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { id: T; title: string; hint: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="grid gap-1.5">
      <span className="font-bold">{label}</span>
      <div role="radiogroup" aria-label={label} className={`grid gap-2 ${options.length > 2 ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} onClick={() => onChange(o.id)}
            className={`min-h-14 px-3 py-2 rounded-input border-[2px] text-left grid ${value === o.id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
            <span className="font-bold">{o.title}</span><span className="text-sm font-semibold text-muted">{o.hint}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function CodeBox({ code, setName, onCopied, onShow }: { code: GameCode; setName: string; onCopied: () => void; onShow?: () => void }) {
  return (
    <div className="grid gap-2 justify-items-start">
      <p className="font-display text-4xl tracking-[0.2em]" aria-label={t('host.codeIs', { code: code.code })}>{code.code}</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => { void navigator.clipboard?.writeText(gameLink(code)).catch(() => undefined); onCopied(); }}><Copy weight="bold" size={18} />{t('host.copyLink')}</Button>
        {onShow && <Button onClick={onShow}><ProjectorScreen weight="bold" size={18} />{t('host.show')}</Button>}
        <a href={classroomShare(gameLink(code), setName)} target="_blank" rel="noreferrer" className={buttonClasses('secondary')}><ShareNetwork weight="bold" size={18} />{t('host.classroom')}</a>
      </div>
      <p className="text-xs font-bold text-muted">{code.due ? t('host.dueOn', { date: new Date(`${code.due}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' }) }) : t('host.expires', { days: GAME_CODE_DAYS })}</p>
    </div>
  );
}
