import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Broadcast, Copy, LockSimple, Play, ProjectorScreen, QrCode, ShareNetwork, UsersThree, X } from '@phosphor-icons/react';
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

// Host or assign one set (Part 3B, path 2): pick a game from cover cards,
// then play it now on this screen, make a game code and link, or assign it.
export default function HostDialog({ set, onClose }: { set: QuestionSet; onClose: () => void }) {
  const tier = useTier();
  const navigate = useNavigate();
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const [gameId, setGameId] = useState<string | null>(null);
  const [code, setCode] = useState<GameCode | null>(null);
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState('');
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
                  <button key={g.id} type="button" role="radio" aria-checked={gameId === g.id} disabled={!open} onClick={() => { setGameId(g.id); setCode(null); setStatus(''); }}
                    className={`rounded-input border-[2.5px] overflow-hidden text-left bg-surface ${gameId === g.id ? 'border-border ring-4 ring-accent' : 'border-border-soft'} disabled:opacity-60`}>
                    <span className="relative block"><GameCover gameId={g.id} className="aspect-[16/10]" />{!open && <LockSimple weight="fill" size={28} className="absolute top-2 right-2" />}</span>
                    <span className="p-2 grid gap-1"><span className="font-display text-lg">{g.name}</span><span className="flex flex-wrap gap-1">{g.modes.map((m) => <ModeBadge key={m} mode={m} />)}</span></span>
                  </button>
                );
              })}
            </div>
            {game && (
              <div className="grid md:grid-cols-3 gap-3">
                <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-2 content-start">
                  <p className="font-bold">{t('host.now')}</p>
                  <Button variant="primary" onClick={() => navigate(`/games/${game.id}?set=${set.id}`)}><Play weight="fill" size={18} />{t('host.play')}</Button>
                  {game.modes.includes('live') && <Button onClick={async () => navigate(`/teacher/live/${(await makeGameCode(game.id, set.id, 'live')).code}`)}><Broadcast weight="bold" size={18} />{t('host.live')}</Button>}
                </div>
                <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-2 content-start">
                  <p className="font-bold">{t('host.code')}</p>
                  {code ? (
                    <>
                      <p className="font-display text-4xl tracking-[0.2em]" aria-label={t('host.codeIs', { code: code.code })}>{code.code}</p>
                      <Button onClick={() => { void navigator.clipboard?.writeText(gameLink(code)).catch(() => undefined); setStatus(t('host.copied')); }}><Copy weight="bold" size={18} />{t('host.copyLink')}</Button>
                      <Button onClick={() => navigate(`/show/${code.code}`)}><ProjectorScreen weight="bold" size={18} />{t('host.show')}</Button>
                      <a href={classroomShare(gameLink(code), set.name)} target="_blank" rel="noreferrer" className={buttonClasses('secondary')}><ShareNetwork weight="bold" size={18} />{t('host.classroom')}</a>
                      <p className="text-xs font-bold text-muted">{t('host.expires', { days: GAME_CODE_DAYS })}</p>
                    </>
                  ) : <Button onClick={async () => setCode(await makeGameCode(game.id, set.id))}><QrCode weight="bold" size={18} />{t('host.makeCode')}</Button>}
                </div>
                <div className="rounded-input border-[2px] border-border-soft p-3 grid gap-2 content-start">
                  <p className="font-bold">{t('host.assign')}</p>
                  <select aria-label={t('reports.class')} value={classId} onChange={(e) => setClassId(e.target.value)} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold">
                    <option value="">{t('host.pickClass')}</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <Button disabled={!classId} onClick={() => void assign()}><UsersThree weight="bold" size={18} />{t('host.assignBtn')}</Button>
                </div>
              </div>
            )}
            <p role="status" aria-live="polite" className="font-bold min-h-6">{status}</p>
            <p className="text-sm font-bold text-muted">{t('host.deviceNote')}</p>
          </>
        )}
      </div>
    </div>
  );
}
