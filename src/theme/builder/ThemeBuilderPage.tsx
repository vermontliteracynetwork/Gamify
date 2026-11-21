import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { lazyPage } from '../../lib/lazyPage';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Info, BookOpen, CaretDown, CaretLeft, CaretRight, CheckCircle, DownloadSimple, FloppyDisk, LockSimple, PaintBrush, Play, Printer, Trash, UploadSimple, WarningCircle } from '@phosphor-icons/react';
import { CHALLENGE_OPEN, THEME_TRIAL_GAME, TIERS, type Tier } from '../../config';
import { newId } from '../../data';
import { useTier } from '../../data/hooks';
import { GameCover } from '../../games/covers';
import { GAMES } from '../../games/registry';
import { signInManifestFor } from '../../student/pictures';

import { t } from '../../i18n';
import { imageFileToDataUrl } from '../../ui/imageFile';
import { friendlyMessage } from '../../ui/uploadRules';
import { Button, buttonClasses, IconButton, PageHeader, Panel, Tabs, fieldClasses } from '../../ui/kit';
import TeacherNav from '../../ui/TeacherNav';
import { teacherUsername } from '../credit';
import { classicTheme } from '../classic';
import { deleteMadeTheme, saveMadeTheme, useMadeThemes } from '../made';
import { ITEM_MOTIONS, SOUND_PACKS, type GameTheme, type ItemSlotsSpec, type ThemeItem, type SoundPack, type ThemeColors, type ThemePieceSpec } from '../types';
import ItemArt from '../ItemArt';
import { playEffect } from '../../engine/feedback';
import { MUSIC_TRACKS, RIGHT_SOUNDS, WRONG_SOUNDS } from '../../engine/music';
import { useSettings } from '../../settings/SettingsContext';
import type { StringKey } from '../../i18n/en';
import { themeProblems } from '../validate';
import { cutPhotoForPiece } from './scan';
import { loadDraft, loadOriginal, saveDraft, saveOriginal } from './draftStore';
import { isRound, isSolid } from './template';
import ThemePreview, { previewViews, type PreviewView } from './ThemePreview';
import ThemeSquare from './ThemeSquare';
import Title from '../../ui/Title';
import { listThemeRequests, removeThemeRequest } from '../requests';
import { data as store } from '../../data';
import { useAsync } from '../../data/hooks';
import { LimitNote, UpgradeButton } from '../../billing/Upgrade';

const DrawStudio = lazyPage(() => import('./DrawStudio'));

// Everything the builder can design: each game, plus the sign-in pictures.
// No Big screen design (teacher, 2026-11-20). Sign-in pictures go up to the
// plan's students per class.
export const builderTargets = (tier: Tier) => [...GAMES, signInManifestFor(TIERS[tier].studentsPerClassroom)];
export const BUILDER_TARGETS = builderTargets('pro');

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
// Games with the top strip's progress bar get its color too (teacher, 2026-11-20).
export const PROGRESS_BAR_GAMES = ['match-three', 'bubble-pop'];
export const PROGRESS_DEFAULT = '#5cc3a0';
const HEX = /^#[0-9a-f]{6}$/i;

export default function ThemeBuilderPage({ owner = false }: { owner?: boolean }) {
  const { gameId } = useParams();
  const tier = useTier();
  const game = builderTargets(owner ? 'pro' : tier).find((g) => g.id === gameId);
  const base = owner ? '/owner/themes' : '/teacher/themes';
  return (
    // A game's builder fills the screen and never scrolls (teacher, 2026-10-31):
    // the preview and the tabs share the space left under the menu.
    <main className={`max-w-7xl mx-auto px-4 sm:px-6 pt-4 ${game ? 'pb-4 h-[calc(100dvh-3.5rem)] flex flex-col' : 'pb-6'}`}>
      <div className="shrink-0">{owner ? <Link to="/owner" className={buttonClasses('secondary', 'mb-4')}><ArrowLeft weight="bold" size={18} />{t('owner.back')}</Link> : <TeacherNav startOpen={!game} />}</div>
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
        {builderTargets(owner ? 'pro' : tier).map((g) => {
          const mine = themes.filter((th) => th.gameId === g.id && (owner ? th.source === 'library' : th.source === 'custom'));
          const locked = !owner && TIERS[tier].themeBuilder === 'trial' && g.id !== THEME_TRIAL_GAME;
          return (
            <Link key={g.id} to={`${base}/${g.id}`} className="group rounded-panel bg-surface border-bold border-border no-underline overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
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
    if (plan === 'three-per-game') return made.filter((th) => th.gameId === gameId).length >= 3 ? t('builder.limitHomeschool') : null;
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
            <div key={r.id} className="rounded-input border-std border-border-soft p-2 grid gap-2">
              <ThemeSquare theme={r.theme} className="max-w-56" />
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

function Builder({ gameId, owner }: { gameId: string; owner: boolean; base: string }) {
  const tier0 = useTier();
  const game = builderTargets(owner ? 'pro' : tier0).find((g) => g.id === gameId)!;
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const tier = useTier();
  const { themes, reload } = useMadeThemes();
  const mine = themes.filter((th) => th.gameId === gameId && th.source === (owner ? 'library' : 'custom'));
  const editId = params.get('id');
  const [draft, setDraft] = useState<GameTheme>(() => blankTheme(gameId, owner));
  const [status, setStatus] = useState('');
  const [, setBusy] = useState(false);
  const [tab, setTab] = useState<'download' | 'upload' | 'items' | 'colors' | 'style' | 'share'>('upload');
  // No "downloading" line (teacher, 2026-11-20); the button just waits while the file is made.
  const [dl, setDl] = useState(false);
  const { settings } = useSettings();

  // Work in progress is kept on this device as it changes, and comes back
  // when the builder opens again (teacher, 2026-11-01).
  const restored = useRef(false);
  // Anything added since the page opened wins over an older kept draft, so an
  // upload is never replaced by earlier drawing (teacher, 2026-11-02).
  const touched = useRef(false);
  useEffect(() => {
    let live = true;
    void loadDraft(gameId).then((kept) => {
      if (!live) return;
      if (kept && !touched.current && (!editId || kept.id === editId)) { setDraft(kept); setStatus(t('builder.draftBack')); }
      restored.current = true;
    });
    return () => { live = false; };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!restored.current) return;
    const id = window.setTimeout(() => void saveDraft(gameId, draft), 400);
    return () => window.clearTimeout(id);
  }, [draft, gameId]);
  // Opening a saved design loads it, but a reload of the list never wipes
  // changes made to the design already open.
  useEffect(() => {
    const found = themes.find((th) => th.id === editId);
    if (found) setDraft((d) => (d.id === found.id ? d : found));
  }, [editId, themes]);

  const plan = TIERS[tier].themeBuilder;
  const isNew = !mine.some((th) => th.id === draft.id);
  const madeCount = themes.filter((th) => th.source === 'custom').length;
  const blocked = owner ? null
    : plan === 'trial' && gameId !== THEME_TRIAL_GAME ? t('builder.limitTrialGame')
    : plan === 'trial' && isNew && madeCount >= 1 ? t('builder.limitTrial')
    : plan === 'one-per-game' && isNew && mine.length >= 1 ? t('builder.limitPlus')
    : plan === 'three-per-game' && isNew && mine.length >= 3 ? t('builder.limitHomeschool')
    : null;
  const problems = useMemo(() => [...themeProblems(draft), ...((draft.items ?? []).some((it) => !it.name.trim()) ? [t('builder.items.nameEvery')] : [])], [draft]);

  const [drawing, setDrawingPiece] = useState<ThemePieceSpec | null>(null);
  // The piece's last upload, so the studio's Restore and Start over bring it
  // back, and a new upload always replaces it (teacher, 2026-11-02).
  const [original, setOriginal] = useState<string | undefined>();
  function setDrawing(p: ThemePieceSpec | null) {
    setOriginal(undefined);
    setDrawingPiece(p);
    if (p) void loadOriginal(draft.id, p.id).then((o) => setOriginal(o && draft.pieces[p.id]?.image ? o : undefined));
  }
  const views = previewViews(gameId, !!game.items);
  const previewBox = useRef<HTMLDivElement>(null);
  const [previewH, setPreviewH] = useState<number>();
  useEffect(() => {
    const el = previewBox.current;
    if (!el) return;
    const wide = window.matchMedia('(min-width: 1024px)');
    const measure = () => setPreviewH(wide.matches ? el.getBoundingClientRect().height : undefined);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    wide.addEventListener('change', measure);
    return () => { ro.disconnect(); wide.removeEventListener('change', measure); };
  }, [blocked]);
  const [picked, setView] = useState<PreviewView>(views[0].id);
  // Always one of this game's screens (board sizes start on the first size).
  const view = views.some((v) => v.id === picked) ? picked : views[0].id;
  const [find, setFind] = useState('');
  // Tall screens show more pieces a page, so there is no empty space.
  const [tall, setTall] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-height: 860px)').matches);
  useEffect(() => { const m = window.matchMedia('(min-height: 860px)'); const on = () => setTall(m.matches); m.addEventListener('change', on); return () => m.removeEventListener('change', on); }, []);
  const shownPieces = game.themePieces.filter((p) => !find.trim() || `${p.label} ${p.hint}`.toLowerCase().includes(find.trim().toLowerCase()));
  function setPiece(id: string, image: string | undefined) {
    touched.current = true;
    setDraft((d) => {
      const pieces = { ...d.pieces, [id]: { ...d.pieces[id], image } };
      if (!image) delete pieces[id].image;
      const next = { ...d, pieces };
      if (id === 'background') next.backdrop = image ? { kind: 'image', src: image, alt: `${d.name || game.name} background` } : { kind: 'color' };
      if (id === 'cover') next.cover = image;
      return next;
    });
  }
  // Every picture is cut out for its piece (teacher, 2026-11-01): a photo
  // of a template page (any version) or of a drawing on paper.
  // The last file picked for each piece this visit, so flipping its
  // see-through switch cuts it again (teacher, 2026-11-16).
  const files = useRef(new Map<string, File>());
  const isClear = (piece: ThemePieceSpec) => draft.pieces[piece.id]?.clear ?? !isSolid(piece);
  async function upload(piece: ThemePieceSpec, file: File | undefined, clear = isClear(piece)) {
    if (!file) return;
    files.current.set(piece.id, file);
    setBusy(true); setStatus(t('builder.cutting'));
    try {
      const art = await cutPhotoForPiece(file, piece, isRound(piece), !clear);
      if (art) { setPiece(piece.id, art); void saveOriginal(draft.id, piece.id, art); setStatus(''); } else setStatus(t('builder.cutEmpty'));
    } catch (e) { setStatus(friendlyMessage(e)); }
    finally { setBusy(false); }
  }
  function toggleClear(piece: ThemePieceSpec) {
    const clear = !isClear(piece);
    touched.current = true;
    setDraft((d) => ({ ...d, pieces: { ...d.pieces, [piece.id]: { ...d.pieces[piece.id], clear } } }));
    const file = files.current.get(piece.id);
    // No message line when it switches (teacher, 2026-11-19); the button's
    // checkers (transparent) or solid fill and its hover text say which.
    if (file && draft.pieces[piece.id]?.image) void upload(piece, file, clear);
  }
  async function save() {
    const theme = { ...draft, name: draft.name.trim(), designedBy: owner ? 'Gamify' : teacherUsername() || undefined, studentDesigner: owner ? undefined : draft.studentDesigner?.trim() || undefined };
    await saveMadeTheme(theme);
    setDraft(theme); // keep what was saved (credit names) in the open design
    reload();
    setParams({ id: theme.id });
    setStatus(t('builder.saved', { name: theme.name }));
  }
  // Deleting is one tap, with Undo right after (2026-11-21: undo toasts, not
  // a browser confirm box).
  const [undo, setUndo] = useState<GameTheme | null>(null);
  async function remove() {
    setUndo(draft);
    await deleteMadeTheme(draft.id);
    void saveDraft(gameId, null);
    reload();
    setDraft(blankTheme(gameId, owner));
    setParams({});
    setStatus(t('builder.deleted'));
  }

  return (
    <>
      {drawing && (
        <Suspense fallback={null}>
          <DrawStudio piece={drawing} image={draft.pieces[drawing.id]?.image} original={original} onClose={() => setDrawing(null)}
            onSave={(img) => { setPiece(drawing.id, img); setDrawing(null); setStatus(''); }} />
        </Suspense>
      )}
      {/* One bar across the top, under the teacher bar (teacher, 2026-11-19):
          the theme's name, Save, and the design tabs. No back arrow: the
          teacher bar's Theme Builder link goes back to all games. */}
      <h1 className="sr-only">{t('builder.designsFor', { game: game.name })}</h1>
      {(!blocked || mine.length > 0) && (
        <div className="shrink-0 mb-3 flex flex-wrap items-center gap-2 bg-surface border-bold border-border rounded-panel p-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          {/* The name box is also the list of saved designs (teacher, 2026-11-20:
              "show previous themes by making the input field of new name theme a
              drop down"): type a name, or open the caret to pick an earlier one. */}
          <ThemeNameCombo value={draft.name} onChange={(name) => setDraft({ ...draft, name })} current={draft.id} themes={mine}
            onPick={(id) => setParams({ id })} onNew={() => { touched.current = true; setDraft(blankTheme(gameId, owner)); setParams({}); setStatus(''); }} />
          {/* At the plan's limit only the list shows, so a saved theme is one pick away. */}
          {!blocked && <>
          <Button variant="primary" size="sm" disabled={!!blocked || problems.length > 0 || !draft.name.trim()} onClick={() => void save()}><FloppyDisk weight="bold" size={18} />{t('builder.save')}</Button>
          {!isNew && !owner && game.modes.length > 0 && <IconButton label={t('builder.tryIt')} onClick={() => navigate(`/games/${gameId}`)}><Play weight="fill" size={18} /></IconButton>}
          {!isNew && <IconButton variant="danger" label={t('builder.delete')} onClick={() => void remove()}><Trash weight="bold" size={18} /></IconButton>}
          {/* Paper, pictures and colors are tabs, and long lists turn pages, so the builder never scrolls. */}
          <Tabs size="sm" fill panelIds className="flex-1 min-w-[22rem]" label={t('builder.tabsLabel')} value={tab} onChange={setTab}
            options={(['download', 'upload', ...(game.items ? ['items' as const] : []), 'colors', 'style', ...(owner ? [] : ['share' as const])] as const).map((k) => ({ id: k, label: t(`builder.${k}Title`) }))} />
          </>}
        </div>
      )}

      <div className="flex-1 min-h-0 grid gap-4 lg:gap-6 grid-rows-[minmax(0,0.38fr)_minmax(0,1fr)] lg:grid-rows-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        {/* The preview, as big as the space allows, with arrows that turn
            between the screens the pieces show up on (teacher, 2026-11-18:
            no Game / Power-ups buttons, no count line). */}
        <div className="min-h-0 flex items-center justify-center gap-2 [container-type:size]">
          {views.length > 1 && <PageTurn dir="prev" label={t('builder.prevView')} onClick={() => setView(views[(views.findIndex((v) => v.id === view) - 1 + views.length) % views.length].id)} />}
          <div className="flex-1 min-w-0 grid justify-items-center">
            {/* The dots hang under the preview, so the preview itself sits in
                the middle and the panel beside it can match its height. */}
            <div ref={previewBox} className="relative w-full" style={{ maxWidth: `calc((100cqh - ${views.length > 1 ? 3 : 0}rem) * 4 / 3)` }}><ThemePreview theme={draft} gameName={game.name} view={view} />
            {views.length > 1 && (
              <span className="absolute left-1/2 -translate-x-1/2 top-full mt-1.5 flex items-center gap-1.5" role="status" aria-label={views.find((v) => v.id === view)?.label}>
                {views.map((v) => <span key={v.id} aria-hidden="true" className={`w-2.5 h-2.5 rounded-full border-thin border-border ${v.id === view ? 'bg-accent' : 'bg-surface'}`} />)}
                {/* Board sizes say which size is showing. */}
                {<span aria-hidden="true" className="ml-1 font-bold text-xs leading-none whitespace-nowrap">{views.find((v) => v.id === view)?.label}</span>}
              </span>
            )}
            </div>
          </div>
          {views.length > 1 && <PageTurn dir="next" label={t('builder.nextView')} onClick={() => setView(views[(views.findIndex((v) => v.id === view) + 1) % views.length].id)} />}
        </div>

        {/* The menu is as tall as the preview beside it (teacher, 2026-11-19). */}
        <div className="min-h-0 flex flex-col gap-3 lg:self-center" style={previewH ? { height: previewH } : undefined}>
          {blocked && <LimitNote><span className="flex items-center gap-2"><LockSimple weight="fill" size={20} />{blocked}</span></LimitNote>}
          {!blocked && (
          <Panel className="flex-1 min-h-0 flex flex-col gap-3 !p-4">
            <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="@container flex-1 min-h-0 overflow-y-auto flex flex-col gap-3 pr-1">
              {tab === 'download' && (
                <>
                  {/* Print and digital stacked, one above the other (teacher, 2026-11-20). */}
                  <div className="grid gap-3">
                    <div className="rounded-input border-std border-border p-3 grid gap-2 content-start">
                      <p className="font-display text-lg flex items-center gap-2"><Printer weight="fill" size={22} aria-hidden="true" />{t('builder.dl.print')}</p>
                      <p className="text-sm font-semibold">{t('builder.dl.printText')}</p>
                      <div className="flex flex-wrap gap-2">
                        <Link to={`/teacher/themes/${gameId}/template`} className={buttonClasses('primary', 'hover-pop')}><Printer weight="bold" size={18} />{t('builder.dl.blank')}</Link>
                        {GAMES.some((g) => g.id === gameId) && <Link to={`/blog/themes/${gameId}`} className={buttonClasses('secondary', 'hover-pop')}><BookOpen weight="bold" size={18} />{t('builder.dl.guide')}</Link>}
                      </div>
                    </div>
                    <div className="rounded-input border-std border-border p-3 grid gap-2 content-start">
                      <p className="font-display text-lg flex items-center gap-2"><DownloadSimple weight="bold" size={22} aria-hidden="true" />{t('builder.dl.digital')}</p>
                      <p className="text-sm font-semibold">{t('builder.dl.digitalText')}</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="primary" className="hover-pop" disabled={dl}
                          onClick={async () => {
                            setDl(true);
                            const [{ saveFile }, { templatePieces }, { templatePdf }] = await Promise.all([import('./download'), import('./template'), import('./templatePdf')]);
                            saveFile(new Blob([templatePdf(templatePieces(game))], { type: 'application/pdf' }), `gamify_digital_${game.id}.pdf`);
                            setDl(false);
                          }}><DownloadSimple weight="bold" size={20} />{t('builder.dl.pdf')}</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
              {tab === 'upload' && (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <input type="search" value={find} onChange={(e) => setFind(e.target.value)} placeholder={t('builder.findPiece')} aria-label={t('builder.findPiece')}
                      className="min-h-8 px-3 rounded-input border-std border-border font-bold text-sm flex-1 min-w-40" />
                  </div>
                  {shownPieces.length === 0 && <p className="font-bold text-sm text-muted">{t('builder.noPieces')}</p>}
                  <Pages key={`upload-${find}`} per={tall ? 12 : 8} items={shownPieces.map((p) => <PieceCard key={p.id} piece={p} image={draft.pieces[p.id]?.image} clear={isClear(p)} onClearBg={() => toggleClear(p)} onFile={(f) => void upload(p, f)} onDraw={() => setDrawing(p)} onClear={() => { setPiece(p.id, undefined); void saveOriginal(draft.id, p.id, undefined); }} />)} />
                </>
              )}
              {tab === 'items' && game.items && (
                <ItemsTab spec={game.items} items={draft.items ?? []} onChange={(items) => setDraft({ ...draft, items })} onProblem={setStatus} />
              )}
              {tab === 'share' && (
                <>
                  {/* Less text (teacher, 2026-11-19): no "Credited to" line; explanations are hover text. */}
                  <div className="grid gap-1">
                    <label className="grid gap-1 font-bold text-sm">{t('builder.studentDesigner')}
                      <input id="theme-student" value={draft.studentDesigner ?? ''} maxLength={20} onChange={(e) => setDraft({ ...draft, studentDesigner: e.target.value || undefined })} placeholder={t('builder.studentDesignerPlaceholder')}
                        className="min-h-11 px-3 rounded-input border-std border-border font-bold w-full max-w-72" />
                    </label>
                  </div>
                  <ShareTab theme={draft} saved={!isNew} problems={problems.length > 0} onChange={async (next) => { setDraft(next); if (!isNew) { await saveMadeTheme(next); reload(); } }} />
                </>
              )}
              {tab === 'style' && (
                <>
                  {/* No title font choice and no explanation line (teacher, 2026-11-20). */}
                  <p className="font-bold">{t('builder.sounds')}</p>
                  <div className="grid grid-cols-[repeat(auto-fill,minmax(5.5rem,1fr))] gap-2" role="radiogroup" aria-label={t('builder.sounds')}>
                    {SOUND_PACKS.map((p: SoundPack) => (
                      <button key={p} type="button" role="radio" aria-checked={(draft.sounds ?? 'classic') === p}
                        onClick={() => { setDraft({ ...draft, sounds: p }); playEffect('right', settings, p); window.setTimeout(() => playEffect('win', settings, p), 450); }}
                        className={`min-h-12 px-3 rounded-input border-std font-bold ${(draft.sounds ?? 'classic') === p ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                        {t(`builder.sound.${p}` as StringKey)}
                      </button>
                    ))}
                  </div>
                  <AdvancedAudio audio={draft.audio} onChange={(audio) => setDraft({ ...draft, audio })} />
                </>
              )}
              {tab === 'colors' && (
                <>
                  <Pages key="colors" per={6} items={[
                    ...COLOR_FIELDS.map((f) => (
                      <ColorField key={f.key} label={f.label} hint={f.hint} value={draft.colors[f.key] ?? ''} onChange={(v) => setDraft({ ...draft, colors: { ...draft.colors, [f.key]: v } })} />
                    )),
                    ...(PROGRESS_BAR_GAMES.includes(gameId) ? [<ColorField key="progress" label={t('builder.progressBar')} hint={t('builder.progressBarHint')} value={draft.colors.progress ?? PROGRESS_DEFAULT} onChange={(v) => setDraft({ ...draft, colors: { ...draft.colors, progress: v } })} />] : []),
                    ...game.themePieces.filter((p) => p.color).map((p) => (
                      <ColorField key={p.id} label={p.label} hint={t('builder.pieceColorHint')} value={draft.pieces[p.id]?.color ?? p.color!}
                        onChange={(v) => setDraft({ ...draft, pieces: { ...draft.pieces, [p.id]: { ...draft.pieces[p.id], color: v } } })} />
                    )),
                  ]} />
                </>
              )}
            </div>
            {problems.length > 0 && (
              <div className="shrink-0 grid gap-1 rounded-input border-std border-danger/60 bg-danger/10 p-2">
                {problems.map((p) => <p key={p} className="font-bold text-sm flex items-center gap-2"><WarningCircle weight="fill" size={18} color="#9b2c3a" className="shrink-0" />{p}</p>)}
              </div>
            )}
            <p role="status" aria-live="polite" className="shrink-0 font-bold text-sm empty:hidden">{status}</p>
            {undo && <Button size="sm" className="shrink-0 justify-self-start" onClick={() => { const th = undo; setUndo(null); void saveMadeTheme(th).then(() => { reload(); setParams({ id: th.id }); setDraft(th); setStatus(t('builder.restored', { name: th.name })); }); }}>{t('builder.undo')}</Button>}
          </Panel>
          )}
        </div>
      </div>
    </>
  );
}

// A grid that turns pages instead of growing (two columns on wider
// screens). It holds as many rows as fit the space left in the tab, so the
// builder never scrolls (teacher, 2026-10-31); `per` is the most per page.
function Pages({ items, per }: { items: ReactNode[]; per: number }) {
  const [page, setPage] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(per);
  useEffect(() => {
    const el = ref.current;
    const panel = el?.closest('[role=tabpanel]') as HTMLElement | null;
    if (!el || !panel) return;
    const measure = () => {
      const grid = el.firstElementChild as HTMLElement;
      const card = grid.firstElementChild as HTMLElement | null;
      if (!card) return;
      const cols = getComputedStyle(grid).gridTemplateColumns.split(' ').length;
      const gap = 12;
      const pager = items.length > cols ? 56 : 0;
      const room = panel.getBoundingClientRect().bottom - el.getBoundingClientRect().top - pager;
      const rows = Math.max(1, Math.floor((room + gap) / (card.getBoundingClientRect().height + gap)));
      setFit(Math.min(per, rows * cols));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(panel);
    return () => ro.disconnect();
  }, [per, items.length]);
  const total = Math.max(1, Math.ceil(items.length / fit));
  const at = Math.min(page, total - 1);
  return (
    // The page number sits at the bottom of the panel (teacher, 2026-11-19).
    <div ref={ref} className="flex-1 flex flex-col gap-3">
      {/* Two columns of cards (teacher, 2026-11-19). */}
      <div className="grid grid-cols-2 gap-3">{items.slice(at * fit, at * fit + fit)}</div>
      {total > 1 && (
        <div className="mt-auto flex items-center gap-2">
          <Button aria-label={t('builder.prevPage')} disabled={at === 0} onClick={() => setPage(at - 1)} className="w-11 !px-0"><CaretLeft weight="bold" size={18} /></Button>
          <span className="font-bold text-sm" aria-live="polite">{t('builder.pageOf', { n: at + 1, total })}</span>
          <Button aria-label={t('builder.nextPage')} disabled={at === total - 1} onClick={() => setPage(at + 1)} className="w-11 !px-0"><CaretRight weight="bold" size={18} /></Button>
        </div>
      )}
    </div>
  );
}

// The checkerboard that means "see-through", like in drawing apps.
const CHECKER_SMALL = { backgroundColor: '#ffffff', backgroundImage: 'conic-gradient(#c4c8d4 25%, transparent 0 50%, #c4c8d4 0 75%, transparent 0)', backgroundSize: '6px 6px' };
const CHECKER = { backgroundColor: '#ffffff', backgroundImage: 'conic-gradient(#d9dce6 25%, transparent 0 50%, #d9dce6 0 75%, transparent 0)', backgroundSize: '10px 10px' };

function PieceCard({ piece, image, clear, onClearBg, onFile, onDraw, onClear }: { piece: ThemePieceSpec; image?: string; clear: boolean; onClearBg: () => void; onFile: (f: File | undefined) => void; onDraw: () => void; onClear: () => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  return (
    <div className={`rounded-input border-std p-2 grid grid-cols-[auto_1fr_auto] items-center gap-x-2 gap-y-1.5 ${image ? 'border-success bg-surface' : 'border-border-soft bg-surface'} ${drag ? 'ring-4 ring-accent' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); onFile(e.dataTransfer.files[0]); }}>
      <button type="button" onClick={() => ref.current?.click()} aria-label={t('builder.uploadPiece', { piece: piece.label })}
        className={`shrink-0 w-12 h-12 border-std border-dashed border-border-soft flex items-center justify-center overflow-hidden ${isRound(piece) ? 'rounded-full' : 'rounded-input'}`}>
        {image ? <img src={image} alt="" className={`w-full h-full ${clear ? 'object-contain' : 'object-cover'}`} style={clear ? CHECKER : undefined} /> : <UploadSimple weight="bold" size={22} className="text-muted" />}
      </button>
      <input ref={ref} type="file" accept="image/*" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
      {/* Only the title shows; what the piece is and its size are hover
          text (teacher, 2026-11-18). */}
      {/* Two columns of cards (teacher, 2026-11-19): the title gets its own
          line under the picture and buttons, so words never split. */}
      <div className="min-w-0 col-span-3 row-start-2" data-tip={`${piece.hint} (${piece.width} x ${piece.height})`}>
        <p className="font-bold text-sm leading-tight flex items-center gap-1.5 min-w-0"><span className="break-words">{piece.label}</span>{image && <CheckCircle weight="fill" size={16} color="#1f7a45" className="shrink-0" aria-label={t('builder.done')} />}</p>
        <p className="sr-only">{piece.hint} {piece.width} x {piece.height}</p>
      </div>
      {/* Small buttons (teacher, 2026-11-16): draw, see-through on or off, remove. */}
      <div className="shrink-0 flex gap-1 col-start-3">
        <IconButton variant="primary" className="!w-8 !h-8" label={t('builder.drawPiece', { piece: piece.label })} onClick={onDraw}><PaintBrush weight="fill" size={15} /></IconButton>
        <button type="button" onClick={onClearBg} aria-pressed={clear} aria-label={t(clear ? 'builder.clearPiece' : 'builder.solidPiece', { piece: piece.label })} data-tip={t(clear ? 'builder.clearPiece' : 'builder.solidPiece', { piece: piece.label })}
          className="shrink-0 w-8 h-8 rounded-full border-std border-border grid place-items-center overflow-hidden active:scale-95 motion-safe:transition"
          style={clear ? CHECKER_SMALL : { background: '#fbfcf8' }}>
          {/* Transparent: small white and gray checkers; solid: a filled square (teacher, 2026-11-19). */}
          {/* Solid: a solid black dot (teacher, 2026-11-20). */}
          {!clear && <span className="block w-4 h-4 rounded-full bg-black" />}
        </button>
        {image && <IconButton className="!w-8 !h-8" label={t('builder.removePiece', { piece: piece.label })} onClick={onClear}><Trash weight="bold" size={14} /></IconButton>}
      </div>
    </div>
  );
}

// Power-up items (teacher, 2026-10-26): each gets art, a name, and dropdowns
// for what it does (only the abilities this game's code can do), how much,
// how it moves and how often it turns up. Not every ability has to be used.
function ItemsTab({ spec, items, onChange, onProblem }: { spec: ItemSlotsSpec; items: ThemeItem[]; onChange: (items: ThemeItem[]) => void; onProblem: (msg: string) => void }) {
  const [drawing, setDrawing] = useState<number | null>(null);
  const drawn = drawing === null ? undefined : items[drawing];
  const put = (i: number, patch: Partial<ThemeItem>) => onChange(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  const field = fieldClasses('md', 'w-full');
  // One power-up per action (teacher, 2026-11-20).
  const free = spec.abilities.filter((a) => !items.some((x) => x.ability === a.id));
  // Only the game's own power-ups (and actions) can be added back.
  function add() {
    const c = spec.classic.find((x) => free.some((a) => a.id === x.ability));
    if (!c) return;
    onChange([{ id: newId('item'), name: c.name, ability: c.ability, amount: c.amount, motion: c.motion, often: c.often }, ...items]);
  }
  return (
    <div className="grid gap-3">
      {drawn && drawing !== null && (
        <Suspense fallback={null}>
          <DrawStudio piece={{ id: 'item', label: drawn.name || t('builder.items.piece'), width: spec.width, height: spec.height, hint: '' }}
            image={drawn.image} onClose={() => setDrawing(null)} onSave={(img) => { put(drawing, { image: img }); setDrawing(null); }} />
        </Suspense>
      )}
      {items.length === 0 && <p className="font-bold">{t('builder.items.none')}</p>}
      {/* Start from the game's power-ups in the same order as the template's
          power-up pages (teacher, 2026-11-13), so each uploaded page lands on
          the power it was drawn for. Only names and powers: Classic art is never handed out. */}
      {items.length === 0 && (
        <Button variant="primary" className="justify-self-start" onClick={() => onChange(spec.classic.map((c) => ({ id: newId('item'), name: c.name, ability: c.ability, amount: c.amount, motion: c.motion, often: c.often })))}>
          <PaintBrush weight="bold" size={18} />{t('builder.items.fromTemplate', { n: spec.classic.length })}
        </Button>
      )}
      <Pages key={`items-${items.length}`} per={2} items={items.map((it, i) => {
        const ability = spec.abilities.find((a) => a.id === it.ability) ?? spec.abilities[0];
        return (
          <div key={it.id} className="rounded-input border-std border-border p-3 grid gap-2 content-start">
            {/* No "Template page" line (teacher, 2026-11-19): the name gets the room. */}
            <div className="flex items-center gap-3">
              <span className="relative shrink-0">
              <label className="block cursor-pointer rounded-input border-std border-dashed border-border-soft p-1" aria-label={t('builder.items.upload', { name: it.name || t('builder.items.piece') })}>
                <ItemArt item={it} size={64} still />
                <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (!f) return; try { put(i, { image: await imageFileToDataUrl(f, Math.max(spec.width, spec.height), true) }); } catch (err) { onProblem(friendlyMessage(err)); } }} />
              </label>
              {/* The yellow brush opens the drawing studio for this power-up's picture; it sits on the picture's corner. */}
              <IconButton variant="primary" className="!w-8 !h-8 absolute -right-2 -bottom-2" label={t('builder.drawPiece', { piece: it.name || t('builder.items.piece') })} data-tip={t('builder.drawPiece', { piece: it.name || t('builder.items.piece') })} onClick={() => setDrawing(i)}><PaintBrush weight="fill" size={15} /></IconButton>
              </span>
              <label className="grid gap-1 font-bold text-sm flex-1 min-w-0">{t('builder.items.name')}
                <input value={it.name} maxLength={30} onChange={(e) => put(i, { name: e.target.value })} placeholder={t('builder.items.namePlaceholder')} className={field} />
              </label>
            </div>
            {/* Action, with what it does and the Classic example in a white (i) hover card (teacher, 2026-11-20). */}
            <label className="grid gap-1 font-bold text-sm mt-2 text-left">
              <span className="inline-flex items-center gap-1.5">{t('builder.items.ability')}
                <span data-tip={[ability.hint + (ability.amount ? ` ${t('builder.items.amountNote', { what: ability.amount.label.toLowerCase() })}` : ''), spec.classic.find((c) => c.ability === ability.id) ? t('builder.items.example', { name: spec.classic.find((c) => c.ability === ability.id)!.name }) : ''].filter(Boolean).join(' ')}
                  data-tip-bg="#ffffff" aria-hidden="true" className="text-muted cursor-help"><Info weight="bold" size={16} /></span>
              </span>
              {/* No custom actions (teacher, 2026-11-20): each power-up keeps its game's own action. */}
              <span className={`${field} flex items-center bg-surface-2`}>{ability.label}</span>
            </label>
            {ability.amount && (
              <label className="grid gap-1 font-bold text-sm">{ability.amount.label}: {it.amount ?? ability.amount.default}
                <input type="range" min={ability.amount.min} max={ability.amount.default} step={ability.amount.step} value={Math.min(it.amount ?? ability.amount.default, ability.amount.default)} onChange={(e) => put(i, { amount: Number(e.target.value) })} />
              </label>
            )}
            <div className="grid grid-cols-2 gap-2 text-left">
              <label className="grid gap-1 font-bold text-sm">{t('builder.items.motion')}
                <select value={it.motion} onChange={(e) => put(i, { motion: e.target.value as ThemeItem['motion'] })} className={field}>
                  {ITEM_MOTIONS.map((m) => <option key={m} value={m}>{t(`builder.motion.${m}` as StringKey)}</option>)}
                </select>
              </label>
              <label className="grid gap-1 font-bold text-sm">{t('builder.items.often')}
                <select value={it.often} onChange={(e) => put(i, { often: Number(e.target.value) as ThemeItem['often'] })} className={field}>
                  {([1, 2, 3] as const).map((n) => <option key={n} value={n}>{t(`builder.often.${n}` as StringKey)}</option>)}
                </select>
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {!it.image && <label className="flex items-center gap-2 font-bold text-sm" data-tip={t('builder.items.colorTip')}>{t('builder.items.color')}<input type="color" value={it.color ?? '#fdfd94'} onChange={(e) => put(i, { color: e.target.value })} className="color-dot w-9 h-9" /></label>}
              <IconButton variant="danger" className="ml-auto" label={t('builder.items.delete')} onClick={() => onChange(items.filter((_, j) => j !== i))}><Trash weight="bold" size={18} /></IconButton>
            </div>
          </div>
        );
      })} />
      {/* No new power-ups with their own actions (teacher, 2026-11-20); a removed one comes back from the game's set. */}
      {free.some((a) => spec.classic.some((c) => c.ability === a.id)) && <Button className="justify-self-start" disabled={items.length >= spec.max} onClick={add}><PaintBrush weight="bold" size={18} />{t('builder.items.add')}</Button>}
    </div>
  );
}

// A color: just its circle and name (teacher, 2026-11-19: no hint line, no
// hex box). Double-tap or double-click the circle to open a color picker with
// a hex code box; what the color is for is hover text.
function ColorField({ label, hint, value, onChange }: { label: string; hint: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  const lastTap = useRef(0);
  const id = `color-${label.replace(/\W+/g, '-').toLowerCase()}`;
  function tap() {
    const now = Date.now();
    if (now - lastTap.current < 400) { setOpen((o) => !o); lastTap.current = 0; } else lastTap.current = now;
  }
  return (
    <div className="relative rounded-input border-std border-border-soft p-2 flex items-center gap-2" data-tip={hint}>
      <button type="button" onClick={tap} aria-expanded={open} aria-label={t('builder.colorOpen', { name: label })}
        className="shrink-0 w-11 h-11 rounded-full border-bold border-border motion-safe:active:scale-95" style={{ background: value }} />
      <span className="font-bold text-sm leading-tight min-w-0 [overflow-wrap:anywhere]">{label}</span>
      {open && (
        <div className="absolute left-2 top-full mt-1 z-20 bg-surface border-std border-border rounded-input p-2 flex items-center gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={t('builder.colorPick', { name: label })} className="color-dot shrink-0 w-11 h-11" />
          <input value={text} aria-label={`${label} hex code`} maxLength={7} autoFocus onChange={(e) => { setText(e.target.value); if (HEX.test(e.target.value)) onChange(e.target.value.toLowerCase()); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === 'Escape') setOpen(false); }}
            className={fieldClasses('sm', 'w-24 font-mono uppercase')} />
          <Button size="sm" onClick={() => setOpen(false)}>{t('builder.colorDone')}</Button>
        </div>
      )}
    </div>
  );
}

// Share a saved class theme in the public gallery (reviewed by the owner
// before anyone sees it) and, once entries open, enter the challenge
// (teacher, 2026-10-25). Credit is the class name, never a student's.
function ShareTab({ theme, saved, problems, onChange }: { theme: GameTheme; saved: boolean; problems: boolean; onChange: (th: GameTheme) => void }) {
  const inGallery = !!theme.gallery && theme.gallery.status !== 'declined';
  const ready = saved && !problems;
  const opt = (on: boolean) => `min-h-12 px-4 rounded-input border-std font-bold text-left ${on ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`;
  return (
    <div className="grid gap-3">
      <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('builder.shareTitle')}>
        <button type="button" role="radio" aria-checked={!inGallery} className={opt(!inGallery)} data-tip={t('builder.shareClassTip')} onClick={() => onChange({ ...theme, gallery: undefined, challenge: false })}>{t('builder.shareClass')}</button>
        {/* Why it can't be shared yet is hover text (disabled buttons get no hover, so the tip sits on a wrapper). */}
        <span className="grid" data-tip={!saved ? t('builder.shareSaveFirst') : problems ? t('builder.shareProblems') : t('builder.shareGalleryTip')}>
          <button type="button" role="radio" aria-checked={inGallery} disabled={!ready} className={`${opt(inGallery)} disabled:opacity-40`} onClick={() => onChange({ ...theme, gallery: { status: 'pending', at: new Date().toISOString() } })}>{t('builder.shareGallery')}</button>
        </span>
      </div>
      {theme.gallery && <p className="text-sm font-bold rounded-input bg-surface-2 p-2" role="status">{t(`builder.gallery.${theme.gallery.status}` as StringKey)}{theme.gallery.reason ? ` ${t(`gallery.reason.${theme.gallery.reason}` as StringKey)}` : ''}</p>}
      {/* The challenge shows only once entries open (guess, 2026-11-19: less text until launch). */}
      {CHALLENGE_OPEN && <label className={`inline-flex items-center gap-2 font-bold min-h-11 ${inGallery ? '' : 'opacity-60'}`} data-tip={t('builder.shareChallengeOpen')}>
        <input type="checkbox" className="w-5 h-5" disabled={!inGallery} checked={!!theme.challenge} onChange={(e) => onChange({ ...theme, challenge: e.target.checked })} />
        {t('builder.shareChallenge')} <Link to="/challenge" className="text-sm">{t('builder.shareChallengeLink')}</Link>
      </label>}
      {theme.challenge && (
        <div className="grid gap-2 rounded-input border-std border-border-soft p-3">
          <p className="font-bold">{t('builder.track')}</p>
          <div className="grid sm:grid-cols-2 gap-2" role="radiogroup" aria-label={t('builder.track')}>
            {(['studio', 'hand'] as const).map((k) => (
              <button key={k} type="button" role="radio" aria-checked={(theme.challengeTrack ?? 'studio') === k} className={opt((theme.challengeTrack ?? 'studio') === k)}
                onClick={() => onChange({ ...theme, challengeTrack: k, permissionOnFile: k === 'hand' ? theme.permissionOnFile : undefined })}>{t(`builder.track.${k}`)}</button>
            ))}
          </div>
          {theme.challengeTrack === 'hand' && (
            <label className="inline-flex items-start gap-2 font-bold text-sm">
              <input type="checkbox" className="w-5 h-5 mt-0.5" checked={!!theme.permissionOnFile} onChange={(e) => onChange({ ...theme, permissionOnFile: e.target.checked })} />
              <span>{t('builder.permission')} <Link to="/challenge/permission" target="_blank">{t('builder.permissionLink')}</Link></span>
            </label>
          )}
        </div>
      )}
    </div>
  );
}

// A round page-turn arrow beside the preview.
function PageTurn({ dir, label, onClick }: { dir: 'prev' | 'next'; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} data-tip={label}
      className="shrink-0 w-9 h-9 rounded-full border-std border-border bg-surface flex items-center justify-center hover:bg-accent motion-safe:active:scale-95">
      {dir === 'prev' ? <CaretLeft weight="bold" size={18} /> : <CaretRight weight="bold" size={18} />}
    </button>
  );
}

// Advanced audio settings (teacher, 2026-11-20): a quiet "Advanced audio
// settings" line that opens the background music and answer sounds, from
// the sounds already in Gamify. Tap a choice to hear it.
function AdvancedAudio({ audio, onChange }: { audio?: GameTheme['audio']; onChange: (a: GameTheme['audio']) => void }) {
  const [open, setOpen] = useState(false);
  const { settings } = useSettings();
  const a = audio ?? {};
  const preview = useRef<HTMLAudioElement | null>(null);
  const hear = (src?: string) => { preview.current?.pause(); if (!src || src === 'none') return; const el = new Audio(src); el.volume = 0.5; preview.current = el; void el.play().catch(() => undefined); window.setTimeout(() => { if (preview.current === el) el.pause(); }, 6000); };
  useEffect(() => () => preview.current?.pause(), []);
  const row = (label: string, value: string, opts: { id: string; label: string }[], set: (v: string) => void) => (
    <label className="grid gap-1 font-bold text-sm">{label}
      <select value={value} onChange={(e) => { set(e.target.value); hear(e.target.value); }} className={fieldClasses('md', 'w-full')}>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
      </select>
    </label>
  );
  void settings;
  return (
    <div className="grid gap-2">
      <button type="button" aria-expanded={open} onClick={() => setOpen((o) => !o)} className="justify-self-start inline-flex items-center gap-1.5 font-bold text-sm text-muted hover:text-text">
        {t('builder.audio.advanced')}<CaretDown weight="bold" size={14} className={`motion-safe:transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        // Stacked so no choice is ever cut off (teacher, 2026-11-20).
        <div className="grid gap-3">
          {row(t('builder.audio.music'), a.music ?? '', [{ id: '', label: t('builder.audio.gameMusic') }, { id: 'none', label: t('builder.audio.none') }, ...MUSIC_TRACKS], (v) => onChange({ ...a, music: v || undefined }))}
          {row(t('builder.audio.right'), a.right ?? '', [{ id: '', label: t('builder.audio.packSound') }, ...RIGHT_SOUNDS], (v) => onChange({ ...a, right: v || undefined }))}
          {row(t('builder.audio.wrong'), a.wrong ?? '', [{ id: '', label: t('builder.audio.packSound') }, ...WRONG_SOUNDS], (v) => onChange({ ...a, wrong: v || undefined }))}
        </div>
      )}
    </div>
  );
}

// The theme name field with the saved designs in a drop-down under it.
function ThemeNameCombo({ value, onChange, themes, current, onPick, onNew }: {
  value: string; onChange: (name: string) => void; themes: GameTheme[]; current: string; onPick: (id: string) => void; onNew: () => void;
}) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => { if (!box.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', close); document.addEventListener('keydown', esc);
    return () => { document.removeEventListener('pointerdown', close); document.removeEventListener('keydown', esc); };
  }, [open]);
  const row = 'w-full text-left min-h-10 px-3 rounded-input font-bold text-sm flex items-center gap-2 hover:bg-surface-2';
  return (
    <div ref={box} className="relative w-64 max-w-full">
      <label className="grid font-bold text-sm"><span className="sr-only">{t('builder.name')}</span>
        <input id="theme-name" value={value} maxLength={40} onChange={(e) => onChange(e.target.value)} placeholder={t('builder.namePlaceholder')}
          className={fieldClasses('sm', 'w-full pr-10')} />
      </label>
      <button type="button" aria-label={t('builder.savedThemes')} aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((o) => !o)}
        className="absolute right-1 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-2">
        <CaretDown weight="bold" size={16} className={`motion-safe:transition-transform motion-safe:duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div role="listbox" aria-label={t('builder.savedThemes')} className="absolute z-30 left-0 right-0 mt-1 p-1.5 bg-surface border-bold border-border rounded-input grid gap-0.5 max-h-72 overflow-y-auto" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <button type="button" role="option" aria-selected={false} className={row} onClick={() => { setOpen(false); onNew(); }}>+ {t('builder.new')}</button>
          {themes.length === 0 && <p className="px-3 py-2 text-sm text-muted">{t('builder.noSavedThemes')}</p>}
          {themes.map((th) => (
            <button key={th.id} type="button" role="option" aria-selected={th.id === current} className={`${row} ${th.id === current ? 'bg-accent' : ''}`}
              onClick={() => { setOpen(false); onPick(th.id); }}>
              <span className="truncate flex-1">{th.name}</span>{th.id === current && <CheckCircle weight="fill" size={16} aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
