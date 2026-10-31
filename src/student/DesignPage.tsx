import { isSolid } from '../theme/builder/template';
import { lazy, Suspense, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Camera, CheckCircle, PaintBrush, PaperPlaneTilt, Star } from '@phosphor-icons/react';
import { THEME_TRIAL_GAME, TIERS } from '../config';
import { newId } from '../data';
import { useTier } from '../data/hooks';
import { GameCover } from '../games/covers';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { classicTheme } from '../theme/classic';
import { sendThemeRequest } from '../theme/requests';
import ThemePreview from '../theme/builder/ThemePreview';
import type { GameTheme } from '../theme/types';
import { imageFileToDataUrl } from '../ui/imageFile';
import Title from '../ui/Title';
import { useSession } from './session';

// The same drawing studio teachers use, so students can draw each piece
// right here (the Theme Builder track of the challenge).
const DrawStudio = lazy(() => import('../theme/builder/DrawStudio'));

const SWATCHES = ['#fdfd94', '#ddfcc6', '#b4c4fb', '#ed9d75', '#f6a5c0', '#8ec5ff', '#c9a3f5', '#ffffff'];
const big = 'min-h-14 px-6 rounded-pill border-[2.5px] border-border font-display text-xl inline-flex items-center gap-2 no-underline text-text';

// A student's own theme, step by step with big pictures: pick a game, add a
// photo or picture for each piece, pick a color, name it, send it to the
// teacher. Nothing plays in it until the teacher says yes.
export default function DesignPage() {
  const session = useSession();
  const navigate = useNavigate();
  const tier = useTier();
  const games = useMemo(() => GAMES.filter((g) => TIERS[tier].themeBuilder !== 'trial' || g.id === THEME_TRIAL_GAME), [tier]);
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<GameTheme | null>(null);
  const [piece, setPiece] = useState(0);
  const file = useRef<HTMLInputElement>(null);
  const [drawing, setDrawing] = useState(false);
  if (!session || session.gameId !== 'design') return <main className="max-w-xl mx-auto p-6"><Link to="/join" className={`${big} bg-accent`}>{t('design.signIn')}</Link></main>;
  const game = draft ? GAMES.find((g) => g.id === draft.gameId)! : null;
  const pieces = game ? game.themePieces.filter((p) => p.id !== 'cover') : [];

  function pick(gameId: string) {
    setDraft({ ...classicTheme(gameId), id: newId('theme'), name: '', source: 'custom', pieces: {} });
    setPiece(0); setStep(1);
  }
  async function add(f: File | undefined) {
    if (!f || !draft || !pieces[piece]) return;
    const p = pieces[piece];
    put(await imageFileToDataUrl(f, Math.max(p.width, p.height, 256), !isSolid(p)));
  }
  function put(image: string) {
    if (!draft || !pieces[piece]) return;
    const p = pieces[piece];
    setDraft({ ...draft, pieces: { ...draft.pieces, [p.id]: { ...draft.pieces[p.id], image } }, ...(p.id === 'background' ? { backdrop: { kind: 'image' as const, src: image, alt: '' } } : {}) });
  }
  async function send() {
    if (!draft || !draft.name.trim()) return;
    await sendThemeRequest(session!.classroomId, { ...draft, name: draft.name.trim() });
    setStep(4);
  }

  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 pb-6 grid gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <Link to="/join" className={`${big} bg-surface !text-base !min-h-12`}><ArrowLeft weight="bold" size={20} />{t('design.back')}</Link>
        <h1 className="title-bubble text-3xl sm:text-4xl"><Title text={t('design.title')} /></h1>
      </div>

      {step === 0 && (
        <section className="grid gap-3">
          <p className="font-display text-2xl">{t('design.pickGame')}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {games.map((g) => (
              <button key={g.id} type="button" onClick={() => pick(g.id)} className="rounded-panel bg-surface border-[2.5px] border-border overflow-hidden text-left active:scale-[0.98]" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <GameCover gameId={g.id} className="aspect-[16/10] border-b-[2.5px] border-border" />
                <span className="block p-3 font-display text-xl">{g.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      {draft && game && step >= 1 && step <= 3 && (
        <div className="grid md:grid-cols-2 gap-4 items-start">
          <div className="grid gap-2"><ThemePreview theme={draft} gameName={draft.name || game.name} /></div>
          <section className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            {step === 1 && pieces[piece] && (
              <>
                <p className="font-bold text-sm">{t('design.pieceOf', { n: piece + 1, total: pieces.length })}</p>
                <p className="font-display text-2xl">{pieces[piece].label}</p>
                <p className="font-semibold">{pieces[piece].hint}</p>
                {draft.pieces[pieces[piece].id]?.image && <p className="flex items-center gap-2 font-bold"><CheckCircle weight="fill" size={26} color="#1f7a45" aria-hidden="true" />{t('design.done')}</p>}
                <div className="flex gap-2 flex-wrap">
                  <button type="button" onClick={() => setDrawing(true)} className={`${big} bg-accent`}><PaintBrush weight="fill" size={26} />{t('design.draw')}</button>
                  <button type="button" onClick={() => file.current?.click()} className={`${big} bg-surface-2`}><Camera weight="fill" size={26} />{t('design.addPicture')}</button>
                </div>
                {drawing && (
                  <Suspense fallback={null}>
                    <DrawStudio simple piece={pieces[piece]} image={draft.pieces[pieces[piece].id]?.image} onClose={() => setDrawing(false)} onSave={(img) => { put(img); setDrawing(false); }} />
                  </Suspense>
                )}
                <input ref={file} type="file" accept="image/*" capture="environment" hidden aria-label={t('design.addPicture')} onChange={(e) => { void add(e.target.files?.[0]); e.target.value = ''; }} />
                <div className="flex gap-2 flex-wrap">
                  <button type="button" disabled={piece === 0} onClick={() => setPiece(piece - 1)} className={`${big} bg-surface-2 !text-base disabled:opacity-40`} aria-label={t('design.prev')}><ArrowLeft weight="bold" size={20} /></button>
                  <button type="button" onClick={() => (piece + 1 < pieces.length ? setPiece(piece + 1) : setStep(2))} className={`${big} bg-surface-2 !text-base`}>{t('design.next')}<ArrowRight weight="bold" size={20} /></button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <p className="font-display text-2xl">{t('design.pickColor')}</p>
                <div className="grid grid-cols-4 gap-3" role="radiogroup" aria-label={t('design.pickColor')}>
                  {SWATCHES.map((c) => (
                    <button key={c} type="button" role="radio" aria-checked={draft.colors.accent === c} aria-label={c} onClick={() => setDraft({ ...draft, colors: { ...draft.colors, accent: c, accentText: '#000000' } })}
                      className={`aspect-square rounded-full border-[3px] ${draft.colors.accent === c ? 'border-border ring-4 ring-offset-2 ring-border' : 'border-border'}`} style={{ background: c }} />
                  ))}
                </div>
                <button type="button" onClick={() => setStep(3)} className={`${big} bg-surface-2 !text-base justify-self-start`}>{t('design.next')}<ArrowRight weight="bold" size={20} /></button>
              </>
            )}
            {step === 3 && (
              <>
                <label className="grid gap-2"><span className="font-display text-2xl">{t('design.name')}</span>
                  <input value={draft.name} maxLength={30} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="min-h-14 px-4 rounded-input border-[2.5px] border-border font-bold text-xl" />
                </label>
                <button type="button" disabled={!draft.name.trim()} onClick={() => void send()} className={`${big} bg-accent justify-self-start disabled:opacity-50`}><PaperPlaneTilt weight="fill" size={24} />{t('design.send')}</button>
              </>
            )}
          </section>
        </div>
      )}

      {step === 4 && (
        <motion.section initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="grid justify-items-center gap-3 py-10 text-center" role="status">
          <Star weight="fill" size={110} color="#ffd166" aria-hidden="true" />
          <p className="font-display text-3xl sm:text-4xl">{t('design.sent')}</p>
          <button type="button" onClick={() => navigate('/join')} className={`${big} bg-accent`}>{t('design.back')}</button>
        </motion.section>
      )}
    </main>
  );
}
