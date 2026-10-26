import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Camera, CaretLeft, CaretRight, CheckCircle, DownloadSimple, FloppyDisk, LockSimple, PaintBrush, Printer, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { CHALLENGE_OPEN, THEME_TRIAL_GAME, TIERS } from '../../config';
import { newId } from '../../data';
import { useTier } from '../../data/hooks';
import { GameCover } from '../../games/covers';
import { GAMES } from '../../games/registry';
import { signInManifest } from '../../student/pictures';

import { t } from '../../i18n';
import { imageFileToDataUrl } from '../../ui/imageFile';
import { Button, buttonClasses, PageHeader, Panel } from '../../ui/kit';
import TeacherNav from '../../ui/TeacherNav';
import { teacherUsername } from '../credit';
import { classicTheme } from '../classic';
import { deleteMadeTheme, saveMadeTheme, useMadeThemes } from '../made';
import { APPROVED_FONTS, SOUND_PACKS, THEME_FONTS, type GameTheme, type SoundPack, type ThemeColors, type ThemePieceSpec } from '../types';
import { playEffect } from '../../engine/feedback';
import { useSettings } from '../../settings/SettingsContext';
import type { StringKey } from '../../i18n/en';
import { themeProblems } from '../validate';
import { scanTemplatePages } from './scan';
import { isRound } from './template';
import ThemePreview from './ThemePreview';
import Title from '../../ui/Title';
import { listThemeRequests, removeThemeRequest } from '../requests';
import { data as store } from '../../data';
import { useAsync } from '../../data/hooks';
import { LimitNote, UpgradeButton } from '../../billing/Upgrade';

// Everything the builder can design: each game, plus the sign-in pictures.
export const BUILDER_TARGETS = [...GAMES, signInManifest];

// The Theme Builder (teacher page, and the owner's developer view): pick a
// game, then design its theme with a live preview, an upload card per piece
// (a check once filled), colors with hex codes, and the printable template
// students draw on, read back from phone photos. Rebuilt from the
// Dashboard's Plinko theme builder. `owner` designs become library themes.

const COLOR_FIELDS: { key: keyof ThemeColors; label: string; hint: string }[] = [
  { key: 'background', label: 'Background', hint: 'Behind the game when there is no background picture' },
  { key: 'backgroundText', label: 'Title text', hint: 'Words that sit right on the background' },
  { key: 'accent', label: 'Main color', hint: 'Big buttons and highlights' },
  { key: 'accentText', label: 'Button text', hint: 'Words on the main color' },
];
const HEX = /^#[0-9a-f]{6}$/i;

export default function ThemeBuilderPage({ owner = false }: { owner?: boolean }) {
  const { gameId } = useParams();
  const game = BUILDER_TARGETS.find((g) => g.id === gameId);
  const base = owner ? '/owner/themes' : '/teacher/themes';
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-6">
      {owner ? <Link to="/owner" className={buttonClasses('secondary', 'mb-4')}><ArrowLeft weight="bold" size={18} />{t('owner.back')}</Link> : <TeacherNav />}
      {game ? <Builder key={game.id} gameId={game.id} owner={owner} base={base} /> : <GamePicker owner={owner} base={base} />}
    </main>
  );
}

function GamePicker({ owner, base }: { owner: boolean; base: string }) {
  const { themes } = useMadeThemes();
  const tier = useTier();
  return (
    <>
      <PageHeader title={owner ? t('builder.ownerTitle') : t('builder.title')} subtitle={owner ? t('builder.ownerSubtitle') : t('builder.subtitle')} />
      {!owner && TIERS[tier].themeBuilder === 'trial' && <LimitNote className="mb-4">{t('builder.trialNote')}</LimitNote>}
      {!owner && <StudentRequests />}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {BUILDER_TARGETS.map((g) => {
          const mine = themes.filter((th) => th.gameId === g.id && (owner ? th.source === 'library' : th.source === 'custom'));
          const locked = !owner && TIERS[tier].themeBuilder === 'trial' && g.id !== THEME_TRIAL_GAME;
          return (
            <Link key={g.id} to={`${base}/${g.id}`} className="group rounded-panel bg-surface border-[2.5px] border-border no-underline overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <GameCover gameId={g.id} className="aspect-[16/10] border-b-[2.5px] border-border" />
              <span className="p-4 grid gap-1">
                <span className="font-display text-xl font-bold text-text flex items-center gap-2">{locked && <LockSimple weight="fill" size={18} aria-label={t('builder.lockedGame')} />}{g.name}</span>
                <span className="text-sm font-bold text-muted">{t('builder.designs', { count: mine.length })} · {t('builder.pieces', { count: g.themePieces.length })}</span>
              </span>
            </Link>
          );
        })}
      </div>
    </>
  );
}

// Designs students sent from their Arcade (student design mode). Approving
// saves it as a class theme credited to the class, within the plan's limits.
function StudentRequests() {
  const tier = useTier();
  const { themes, reload } = useMadeThemes();
  const { value: requests = [], reload: reloadRequests } = useAsync(() => listThemeRequests());
  const { value: classes = [] } = useAsync(() => store.listClassrooms());
  const [status, setStatus] = useState('');
  if (!requests.length && !status) return null;
  const plan = TIERS[tier].themeBuilder;
  const limit = (gameId: string) => {
    const made = themes.filter((th) => th.source === 'custom');
    if (plan === 'trial') return gameId !== THEME_TRIAL_GAME ? t('builder.limitTrialGame') : made.length >= 1 ? t('builder.limitTrial') : null;
    if (plan === 'one-per-game') return made.some((th) => th.gameId === gameId) ? t('builder.limitPlus') : null;
    return null;
  };
  return (
    <Panel className="mb-4 grid gap-3">
      <div>
        <h2 className="font-display text-2xl"><Title text={t('builder.requests')} /></h2>
        <p className="font-semibold text-sm text-muted">{t('builder.requestsHint')}</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {requests.map((r) => {
          const game = BUILDER_TARGETS.find((g) => g.id === r.theme.gameId);
          const room = classes.find((c) => c.id === r.classroomId)?.name ?? '';
          const blocked = limit(r.theme.gameId);
          return (
            <div key={r.id} className="rounded-input border-[2px] border-border-soft p-2 grid gap-2">
              <ThemePreview theme={r.theme} gameName={r.theme.name} />
              <p className="font-bold text-sm">{t('builder.requestFor', { game: game?.name ?? '', class: room })}</p>
              {blocked && <div className="flex flex-wrap items-center gap-2"><p className="text-xs font-bold flex items-center gap-1"><LockSimple weight="fill" size={14} />{blocked}</p><UpgradeButton className="min-h-10 px-3 text-sm" /></div>}
              <div className="flex flex-wrap gap-2">
                <Button variant="primary" disabled={!!blocked} onClick={async () => {
                  await saveMadeTheme({ ...r.theme, source: 'custom', designedBy: teacherUsername() || room || undefined });
                  await removeThemeRequest(r.id); reload(); reloadRequests();
                  setStatus(t('builder.approved', { name: r.theme.name }));
                }}><CheckCircle weight="bold" size={18} />{t('builder.approve')}</Button>
                <Button onClick={async () => { await removeThemeRequest(r.id); reloadRequests(); }}>{t('builder.decline')}</Button>
              </div>
            </div>
          );
        })}
      </div>
      <p role="status" className="font-bold empty:hidden">{status}</p>
    </Panel>
  );
}

function blankTheme(gameId: string, owner: boolean): GameTheme {
  return { ...classicTheme(gameId), id: newId('theme'), name: '', source: owner ? 'library' : 'custom', pieces: {} };
}

function Builder({ gameId, owner, base }: { gameId: string; owner: boolean; base: string }) {
  const game = BUILDER_TARGETS.find((g) => g.id === gameId)!;
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tier = useTier();
  const { themes, reload } = useMadeThemes();
  const mine = themes.filter((th) => th.gameId === gameId && th.source === (owner ? 'library' : 'custom'));
  const editId = params.get('id');
  const [draft, setDraft] = useState<GameTheme>(() => blankTheme(gameId, owner));
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const scanRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<'download' | 'upload' | 'colors' | 'style' | 'share'>('upload');
  const [dl, setDl] = useState('');
  const { settings } = useSettings();

  useEffect(() => {
    const found = themes.find((th) => th.id === editId);
    if (found) setDraft(found);
  }, [editId, themes]);

  const plan = TIERS[tier].themeBuilder;
  const isNew = !mine.some((th) => th.id === draft.id);
  const madeCount = themes.filter((th) => th.source === 'custom').length;
  const blocked = owner ? null
    : plan === 'trial' && gameId !== THEME_TRIAL_GAME ? t('builder.limitTrialGame')
    : plan === 'trial' && isNew && madeCount >= 1 ? t('builder.limitTrial')
    : plan === 'one-per-game' && isNew && mine.length >= 1 ? t('builder.limitPlus')
    : null;
  const problems = useMemo(() => themeProblems(draft), [draft]);
  const filled = game.themePieces.filter((p) => draft.pieces[p.id]?.image).length;

  function setPiece(id: string, image: string | undefined) {
    setDraft((d) => {
      const pieces = { ...d.pieces, [id]: { ...d.pieces[id], image } };
      if (!image) delete pieces[id].image;
      const next = { ...d, pieces };
      if (id === 'background') next.backdrop = image ? { kind: 'image', src: image, alt: `${d.name || game.name} background` } : { kind: 'color' };
      if (id === 'cover') next.cover = image;
      return next;
    });
  }
  async function upload(piece: ThemePieceSpec, file: File | undefined) {
    if (!file) return;
    try { setPiece(piece.id, await imageFileToDataUrl(file, Math.max(piece.width, piece.height, 256))); setStatus(''); }
    catch (e) { setStatus(e instanceof Error ? e.message : String(e)); }
  }
  async function scan(files: File[]) {
    setBusy(true); setStatus(t('builder.scanning'));
    try {
      const res = await scanTemplatePages(files, game.themePieces, isRound);
      Object.entries(res.pieces).forEach(([id, img]) => setPiece(id, img));
      const got = Object.keys(res.pieces).length;
      setStatus([t('builder.scanGot', { count: got }), res.unread ? t('builder.scanUnread', { count: res.unread }) : '', res.empty.length ? t('builder.scanEmpty', { count: res.empty.length }) : ''].filter(Boolean).join(' '));
    } finally { setBusy(false); }
  }
  async function save() {
    const theme = { ...draft, name: draft.name.trim(), designedBy: owner ? 'Gamify' : teacherUsername() || undefined, studentDesigner: owner ? undefined : draft.studentDesigner?.trim() || undefined };
    await saveMadeTheme(theme);
    reload();
    setParams({ id: theme.id });
    setStatus(t('builder.saved', { name: theme.name }));
  }
  async function remove() {
    await deleteMadeTheme(draft.id);
    reload();
    setDraft(blankTheme(gameId, owner));
    setParams({});
    setStatus(t('builder.deleted'));
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Link to={base} className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t('builder.allGames')}</Link>
        <span className="font-bold">{t('builder.designsFor', { game: game.name })}</span>
        {mine.map((th) => (
          <button key={th.id} type="button" onClick={() => setParams({ id: th.id })} aria-pressed={draft.id === th.id}
            className={`min-h-11 px-4 rounded-pill border-[2px] font-bold text-sm ${draft.id === th.id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{th.name}</button>
        ))}
        <Button onClick={() => { setDraft(blankTheme(gameId, owner)); setParams({}); setStatus(''); }}><PaintBrush weight="bold" size={18} />{t('builder.new')}</Button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-4 lg:gap-6 items-start">
        <div className="lg:sticky lg:top-20 grid gap-2 w-full max-w-[min(100%,340px)] lg:max-w-none mx-auto">
          <ThemePreview theme={draft} gameName={game.name} />
          <p className="font-bold text-sm">{t('builder.filled', { filled, total: game.themePieces.length })}</p>
        </div>

        <div className="grid gap-3">
          {blocked && <LimitNote><span className="flex items-center gap-2"><LockSimple weight="fill" size={20} />{blocked}</span></LimitNote>}
          {!blocked && (
          <>
          {/* Paper, pictures and colors are tabs, and long lists turn pages, so the builder never scrolls. */}
          <Panel className="grid gap-3 !p-4">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <label htmlFor="theme-name" className="font-bold">{t('builder.name')}</label>
              <input id="theme-name" value={draft.name} maxLength={40} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder={t('builder.namePlaceholder')}
                className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold flex-1 min-w-48" />
              <Button variant="primary" disabled={!!blocked || problems.length > 0 || !draft.name.trim()} onClick={() => void save()}><FloppyDisk weight="bold" size={18} />{t('builder.save')}</Button>
              {!isNew && <Button variant="danger" onClick={() => void remove()}><Trash weight="bold" size={18} />{t('builder.delete')}</Button>}
              {!isNew && !owner && game.modes.length > 0 && <Button onClick={() => navigate(`/games/${gameId}`)}>{t('builder.tryIt')}</Button>}
            </div>
            {!owner && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <p className="font-bold">{t('builder.creditedTo', { name: teacherUsername() })}</p>
                <label htmlFor="theme-student" className="font-bold">{t('builder.studentDesigner')}</label>
                <input id="theme-student" value={draft.studentDesigner ?? ''} maxLength={20} onChange={(e) => setDraft({ ...draft, studentDesigner: e.target.value || undefined })} placeholder={t('builder.studentDesignerPlaceholder')}
                  className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold flex-1 min-w-32 max-w-48" />
              </div>
            )}
            <div role="tablist" aria-label={t('builder.tabsLabel')} className="flex flex-wrap gap-1 p-1 rounded-pill bg-surface-2 border-[2px] border-border justify-self-start">
              {(['download', 'upload', 'colors', 'style', ...(owner ? [] : ['share' as const])] as const).map((k) => (
                <button key={k} type="button" role="tab" id={`tab-${k}`} aria-controls={`panel-${k}`} aria-selected={tab === k} onClick={() => setTab(k)}
                  className={`min-h-11 px-4 rounded-pill font-bold text-sm ${tab === k ? 'bg-accent text-accent-ink border-[2px] border-border' : 'text-text'}`}>{t(`builder.${k}Title`)}</button>
              ))}
            </div>
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="grid gap-3">
              {tab === 'download' && (
                <>
                  <p className="font-semibold text-muted text-sm">{t('builder.downloadHint')}</p>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div className="rounded-input border-[2px] border-border p-3 grid gap-2 content-start">
                      <p className="font-display text-lg flex items-center gap-2"><Printer weight="fill" size={22} aria-hidden="true" />{t('builder.dl.print')}</p>
                      <p className="text-sm font-semibold">{t('builder.dl.printText')}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/teacher/themes/${gameId}/template`} className={buttonClasses('primary', 'hover-pop')}>{t('builder.dl.blank')}</Link>
                        <Link to={`/teacher/themes/${gameId}/template?example=classic`} className={buttonClasses('secondary', 'hover-pop')}>{t('builder.dl.example')}</Link>
                      </div>
                    </div>
                    <div className="rounded-input border-[2px] border-border p-3 grid gap-2 content-start">
                      <p className="font-display text-lg flex items-center gap-2"><DownloadSimple weight="bold" size={22} aria-hidden="true" />{t('builder.dl.digital')}</p>
                      <p className="text-sm font-semibold">{t('builder.dl.digitalText')}</p>
                      <div className="flex flex-wrap gap-2">
                        {([false, true] as const).map((example) => (
                          <Button key={String(example)} variant={example ? 'secondary' : 'primary'} className="hover-pop" disabled={!!dl && dl !== t('builder.dl.ready')}
                            onClick={async () => {
                              setDl(t('builder.dl.making'));
                              const { digitalZip, fileSlug, saveFile } = await import('./digitalPages');
                              saveFile(await digitalZip(game.name, gameId, game.themePieces, example), `${fileSlug(game.name)}-theme-${example ? 'classic-example' : 'blank'}.zip`);
                              setDl(t('builder.dl.ready'));
                            }}>{example ? t('builder.dl.example') : t('builder.dl.blank')} (.zip)</Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {dl && <p className="text-sm font-bold" role="status">{dl}</p>}
                </>
              )}
              {tab === 'upload' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button disabled={busy} onClick={() => scanRef.current?.click()}><Camera weight="bold" size={18} />{t('builder.scan')}</Button>
                    <input ref={scanRef} type="file" accept="image/*" multiple hidden aria-label={t('builder.scan')}
                      onChange={(e) => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) void scan(f); }} />
                    <span className="text-xs font-semibold text-muted flex-1 min-w-40">{t('builder.scanHint')}</span>
                  </div>
                  <Pages key="upload" per={4} items={game.themePieces.map((p) => <PieceCard key={p.id} piece={p} image={draft.pieces[p.id]?.image} onFile={(f) => void upload(p, f)} onClear={() => setPiece(p.id, undefined)} />)} />
                </>
              )}
              {tab === 'share' && (
                <ShareTab theme={draft} saved={!isNew} problems={problems.length > 0} onChange={async (next) => { setDraft(next); if (!isNew) { await saveMadeTheme(next); reload(); } }} />
              )}
              {tab === 'style' && (
                <>
                  <p className="font-semibold text-muted text-sm">{t('builder.styleHint')}</p>
                  <p className="font-bold">{t('builder.font')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2" role="radiogroup" aria-label={t('builder.font')}>
                    {APPROVED_FONTS.map((f) => (
                      <button key={f} type="button" role="radio" aria-checked={draft.fonts.display === f} aria-label={f} onClick={() => setDraft({ ...draft, fonts: { ...draft.fonts, display: f } })}
                        className={`min-h-14 px-3 rounded-input border-[2px] text-left ${draft.fonts.display === f ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                        <span className="block text-xl leading-tight" style={{ fontFamily: THEME_FONTS[f] }}>{game.name}</span>
                        <span className="block text-xs font-bold text-muted">{f}</span>
                      </button>
                    ))}
                  </div>
                  <p className="font-bold">{t('builder.sounds')}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2" role="radiogroup" aria-label={t('builder.sounds')}>
                    {SOUND_PACKS.map((p: SoundPack) => (
                      <button key={p} type="button" role="radio" aria-checked={(draft.sounds ?? 'classic') === p}
                        onClick={() => { setDraft({ ...draft, sounds: p }); playEffect('right', settings, p); window.setTimeout(() => playEffect('win', settings, p), 450); }}
                        className={`min-h-12 px-3 rounded-input border-[2px] font-bold ${(draft.sounds ?? 'classic') === p ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                        {t(`builder.sound.${p}` as StringKey)}
                      </button>
                    ))}
                  </div>
                </>
              )}
              {tab === 'colors' && (
                <>
                  <p className="font-semibold text-muted text-sm">{t('builder.colorsHint')}</p>
                  <Pages key="colors" per={6} items={[
                    ...COLOR_FIELDS.map((f) => (
                      <ColorField key={f.key} label={f.label} hint={f.hint} value={draft.colors[f.key]} onChange={(v) => setDraft({ ...draft, colors: { ...draft.colors, [f.key]: v } })} />
                    )),
                    ...game.themePieces.filter((p) => p.color).map((p) => (
                      <ColorField key={p.id} label={p.label} hint={t('builder.pieceColorHint')} value={draft.pieces[p.id]?.color ?? p.color!}
                        onChange={(v) => setDraft({ ...draft, pieces: { ...draft.pieces, [p.id]: { ...draft.pieces[p.id], color: v } } })} />
                    )),
                  ]} />
                </>
              )}
            </div>
          </Panel>

          {problems.length > 0 && (
            <Panel className="grid gap-1">
              {problems.map((p) => <p key={p} className="font-bold flex items-center gap-2"><WarningCircle weight="fill" size={20} color="#9b2c3a" className="shrink-0" />{p}</p>)}
            </Panel>
          )}

          <p role="status" aria-live="polite" className="font-bold empty:hidden">{status}</p>
          </>
          )}
        </div>
      </div>
    </>
  );
}

// A grid that turns pages instead of growing (two columns on wider screens).
function Pages({ items, per }: { items: ReactNode[]; per: number }) {
  const [page, setPage] = useState(0);
  const total = Math.max(1, Math.ceil(items.length / per));
  const at = Math.min(page, total - 1);
  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-3">{items.slice(at * per, at * per + per)}</div>
      {total > 1 && (
        <div className="flex items-center gap-2">
          <Button aria-label={t('builder.prevPage')} disabled={at === 0} onClick={() => setPage(at - 1)} className="w-11 !px-0"><CaretLeft weight="bold" size={18} /></Button>
          <span className="font-bold text-sm" aria-live="polite">{t('builder.pageOf', { n: at + 1, total })}</span>
          <Button aria-label={t('builder.nextPage')} disabled={at === total - 1} onClick={() => setPage(at + 1)} className="w-11 !px-0"><CaretRight weight="bold" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

function PieceCard({ piece, image, onFile, onClear }: { piece: ThemePieceSpec; image?: string; onFile: (f: File | undefined) => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div className={`rounded-input border-[2px] p-2 flex items-center gap-3 ${image ? 'border-success bg-surface' : 'border-border-soft bg-surface'} ${drag ? 'ring-4 ring-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}>
      <button type="button" onClick={() => ref.current?.click()} aria-label={t('builder.uploadPiece', { piece: piece.label })}
        className={`shrink-0 w-16 h-16 border-[2px] border-dashed border-border-soft flex items-center justify-center overflow-hidden ${isRound(piece) ? 'rounded-full' : 'rounded-input'}`}>
        {image ? <img src={image} alt="" className="w-full h-full object-cover" /> : <UploadSimple weight="bold" size={22} className="text-muted" />}
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      <div className="min-w-0 flex-1">
        <p className="font-bold flex items-center gap-1.5">{piece.label}{image && <CheckCircle weight="fill" size={20} color="#1f7a45" className="shrink-0" aria-label={t('builder.done')} />}</p>
        <p className="text-xs font-semibold text-muted line-clamp-2">{piece.hint} · {piece.width} x {piece.height}</p>
        {image ? <button type="button" onClick={onClear} className="font-bold text-xs underline">{t('builder.remove')}</button>
          : <p className="text-xs font-bold text-muted">{t('builder.tapOrDrop')}</p>}
      </div>
    </div>
  );
}

function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const id = `color-${label.replace(/\W+/g, '-').toLowerCase()}`;
  return (
    <div className="rounded-input border-[2px] border-border-soft p-2 flex items-center gap-2">
      <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} className="color-dot shrink-0 w-11 h-11" />
      <div className="min-w-0 flex-1">
        <label htmlFor={id} className="font-bold block">{label}</label>
        <p className="text-xs font-semibold text-muted truncate" title={hint}>{hint}</p>
      </div>
      <input value={text} aria-label={`${label} hex code`} maxLength={7} onChange={(e) => { setText(e.target.value); if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase()); }}
        className="shrink-0 min-h-11 w-24 px-2 rounded-input border-[2px] border-border font-mono font-bold uppercase text-sm" />
    </div>
  );
}

// Share a saved class theme in the public gallery (reviewed by the owner
// before anyone sees it) and, once entries open, enter the challenge
// (teacher, 2026-10-25). Credit is the class name, never a student's.
function ShareTab({ theme, saved, problems, onChange }: { theme: GameTheme; saved: boolean; problems: boolean; onChange: (th: GameTheme) => void }) {
  const inGallery = !!theme.gallery && theme.gallery.status !== 'declined';
  const ready = saved && !problems;
  const opt = (on: boolean) => `min-h-12 px-4 rounded-input border-[2px] font-bold text-left ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`;
  return (
    <div className="grid gap-3">
      <p className="font-semibold text-muted text-sm">{t('builder.shareHint')}</p>
      <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('builder.shareTitle')}>
        <button type="button" role="radio" aria-checked={!inGallery} className={opt(!inGallery)} onClick={() => onChange({ ...theme, gallery: undefined, challenge: false })}>{t('builder.shareClass')}</button>
        <button type="button" role="radio" aria-checked={inGallery} disabled={!ready} className={`${opt(inGallery)} disabled:opacity-50`} onClick={() => onChange({ ...theme, gallery: { status: 'pending', at: new Date().toISOString() } })}>{t('builder.shareGallery')}</button>
      </div>
      {!saved ? <p className="text-sm font-bold">{t('builder.shareSaveFirst')}</p>
        : problems ? <p className="text-sm font-bold">{t('builder.shareProblems')}</p> : null}
      {theme.gallery && <p className="text-sm font-bold rounded-input bg-surface-2 p-2" role="status">{t(`builder.gallery.${theme.gallery.status}` as StringKey)}{theme.gallery.reason ? ` ${t(`gallery.reason.${theme.gallery.reason}` as StringKey)}` : ''}</p>}
      <label className={`inline-flex items-center gap-2 font-bold min-h-11 ${CHALLENGE_OPEN && inGallery ? '' : 'opacity-60'}`}>
        <input type="checkbox" className="w-5 h-5" disabled={!CHALLENGE_OPEN || !inGallery} checked={!!theme.challenge} onChange={(e) => onChange({ ...theme, challenge: e.target.checked })} />
        {t('builder.shareChallenge')}
      </label>
      <p className="text-xs font-semibold text-muted">{CHALLENGE_OPEN ? t('builder.shareChallengeOpen') : t('builder.shareChallengeSoon')} <Link to="/challenge">{t('builder.shareChallengeLink')}</Link></p>
    </div>
  );
}
