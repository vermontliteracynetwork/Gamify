import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, DownloadSimple, PaintBrush, Printer } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { GAMES } from '../games/registry';
import type { GameManifest } from '../games/types';
import { t } from '../i18n';
import { ClassicPiece, ROUND_LOOK } from '../theme/builder/classicArt';
import { isRound, isSolid, itemPages } from '../theme/builder/template';
import { ClassicItemSvg } from '../theme/classicItems';
import type { ThemePieceSpec } from '../theme/types';
import { Button, buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { TemplateLock, useTemplateAccess } from '../theme/builder/templateAccess';

// Theme guides in the blog (teacher, 2026-10-28): one article per game that
// shows every piece of the Classic look on screen, with what it is, its exact
// size and what it needs, plus the blank templates to download. The Classic
// art is only shown, never handed out: no Classic files anywhere.


export type PieceKind = 'background' | 'cover' | 'round' | 'surface' | 'object';
export function pieceKind(p: ThemePieceSpec): PieceKind {
  if (p.id === 'background') return 'background';
  if (p.id === 'cover') return 'cover';
  if (isRound(p)) return 'round';
  if (isSolid(p)) return 'surface';
  return 'object';
}

// What each kind of piece needs, in plain words.
export function pieceTips(p: ThemePieceSpec): string[] {
  const kind = pieceKind(p);
  const tips = [t(`guide.tip.${kind}`)];
  if (kind === 'object') tips.push(t('guide.tip.transparent'));
  if (kind === 'surface' || kind === 'background') tips.push(t('guide.tip.contrast'));
  if (p.color) tips.push(t('guide.tip.color'));
  return tips;
}

export const guideGames = (): GameManifest[] => GAMES;

export function ThemeGuideCard({ game }: { game: GameManifest }) {
  return (
    <Link to={`/blog/themes/${game.id}`} className="hover-lift rounded-panel bg-surface border-[2.5px] border-border no-underline text-text overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
      <span className="block overflow-hidden border-b-[2.5px] border-border"><GameCover gameId={game.id} className="aspect-[16/9] cover-zoom" /></span>
      <span className="p-4 grid gap-2">
        <span className="font-display text-2xl leading-tight">{t('guide.cardTitle', { game: game.name })}</span>
        <span className="font-semibold text-sm">{t('guide.cardSub', { n: game.themePieces.length + (game.items?.classic.length ?? 0) })}</span>
        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted"><PaintBrush weight="bold" size={16} aria-hidden="true" />{t('guide.tag')}</span>
      </span>
    </Link>
  );
}

// A look at the Classic piece: drawn on screen, small, marked Example.
function ClassicLook({ piece, gameId }: { piece: ThemePieceSpec; gameId: string }) {
  const max = 150;
  const k = Math.min(max / piece.width, max / piece.height);
  return (
    <span className="relative inline-block select-none" style={{ width: piece.width * k, height: piece.height * k }} aria-hidden="true" onContextMenu={(e) => e.preventDefault()}>
      <svg width={piece.width * k} height={piece.height * k} viewBox={`0 0 ${piece.width} ${piece.height}`} className="pointer-events-none" style={isRound(piece) ? { clipPath: 'circle(50%)' } : undefined}>
        <ClassicPiece piece={piece} gameId={gameId} />
      </svg>
      <span className="absolute -top-2 -left-2 px-1.5 rounded-pill bg-surface border-[2px] border-border text-[10px] font-bold tracking-wide">{t('guide.example')}</span>
    </span>
  );
}

export function ThemeGuidePage() {
  const { gameId } = useParams();
  const game = guideGames().find((g) => g.id === gameId);
  const [dl, setDl] = useState('');
  const access = useTemplateAccess(gameId ?? '');
  if (!game) return <main className="max-w-3xl mx-auto p-6"><Link to="/blog?tag=themes" className={buttonClasses('secondary')}>{t('guide.all')}</Link></main>;
  const items = game.items;
  async function zip() {
    if (access !== 'ok') return;
    setDl(t('builder.dl.making'));
    const [{ fileSlug, saveFile }, { templatePdf }] = await Promise.all([import('../theme/builder/download'), import('../theme/builder/templatePdf')]);
    saveFile(new Blob([templatePdf([...game!.themePieces, ...itemPages(game!.items)])], { type: 'application/pdf' }), `${fileSlug(game!.name)}-theme-for-canva.pdf`);
    setDl(t('builder.dl.ready'));
  }
  return (
    <>
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 grid gap-5">
        <Link to="/blog?tag=themes" className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t('guide.all')}</Link>
        <GameCover gameId={game.id} className="aspect-[21/9] rounded-panel border-[2.5px] border-border" />
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('guide.cardTitle', { game: game.name })} /></h1>
        <p className="text-xl font-bold">{t('guide.intro', { game: game.name })}</p>
        <p className="text-lg leading-relaxed">{t('guide.classicNote')}</p>

        <section className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-3" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-labelledby="guide-dl">
          <h2 id="guide-dl" className="font-display text-3xl"><Title text={t('guide.dlTitle')} /></h2>
          <p className="font-bold">{t('guide.dlSub')}</p>
          <TemplateLock access={access} />
          {access === 'ok' && <div className="flex flex-wrap gap-2">
            <Link to={`/blog/themes/${game.id}/print`} className={buttonClasses('secondary', 'min-h-14 px-6 hover-pop')}><Printer weight="bold" size={20} />{t('guide.dlPrint')}</Link>
            <Button variant="secondary" className="min-h-14 px-6 hover-pop" disabled={!!dl && dl !== t('builder.dl.ready')} onClick={() => void zip()}><DownloadSimple weight="bold" size={20} />{t('guide.dlDigital')}</Button>
          </div>}
          {dl && <p className="font-bold" role="status">{dl}</p>}
          <p className="text-sm font-semibold">{t('guide.dlThen')}</p>
        </section>

        <h2 className="font-display text-3xl mt-2"><Title text={t('guide.piecesTitle')} /></h2>
        <ol className="grid gap-3 list-none p-0 m-0">
          {game.themePieces.map((p, i) => (
            <li key={p.id} className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid sm:grid-cols-[170px_1fr] gap-4 items-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <span className="flex items-center justify-center min-h-[150px] bg-surface-2 rounded-input border-[2px] border-border-soft p-2"><ClassicLook piece={p} gameId={game.id} /></span>
              <div className="grid gap-1.5">
                <h3 className="font-display text-2xl">{i + 1}. {p.label}</h3>
                <p className="font-bold">{t(`guide.what.${pieceKind(p)}`, { hint: p.hint })}</p>
                <p className="text-sm font-bold"><span className="inline-block px-2 rounded-pill bg-accent border-[2px] border-border mr-2">{t('guide.size', { w: p.width, h: p.height })}</span>{isRound(p) || ROUND_LOOK.test(p.id) ? t('guide.shapeRound') : t('guide.shapeBox')}</p>
                <ul className="grid gap-1 pl-5 m-0 list-disc text-sm font-semibold">{pieceTips(p).map((tip) => <li key={tip}>{tip}</li>)}</ul>
              </div>
            </li>
          ))}
        </ol>

        {items && items.classic.length > 0 && (
          <>
            <h2 className="font-display text-3xl mt-2"><Title text={t('guide.powersTitle')} /></h2>
            <p className="text-lg">{t('guide.powersSub', { w: items.width, h: items.height, max: items.max })}</p>
            <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
              {items.classic.map((it) => {
                const ability = items.abilities.find((a) => a.id === it.ability);
                return (
                  <li key={it.id} className="bg-surface border-[2.5px] border-border rounded-panel p-4 grid grid-cols-[84px_1fr] gap-3 items-center" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                    <span className="relative w-20 h-20 flex items-center justify-center bg-surface-2 rounded-input border-[2px] border-border-soft select-none" aria-hidden="true" onContextMenu={(e) => e.preventDefault()}>
                      <span className="pointer-events-none"><ClassicItemSvg art={it.art ?? ''} size={64} /></span>
                      <span className="absolute -top-2 -left-2 px-1.5 rounded-pill bg-surface border-[2px] border-border text-[10px] font-bold tracking-wide">{t('guide.example')}</span>
                    </span>
                    <span className="grid gap-1">
                      <span className="font-display text-xl">{it.name}</span>
                      <span className="text-sm font-bold">{ability?.label}{ability?.hint ? `: ${ability.hint}` : ''}</span>
                    </span>
                  </li>
                );
              })}
            </ul>
            <ul className="grid gap-1 pl-5 m-0 list-disc font-semibold">
              <li>{t('guide.tip.transparent')}</li>
              <li>{t('guide.tip.powerName')}</li>
              <li>{t('guide.tip.powerSmall')}</li>
            </ul>
          </>
        )}

        <section className="bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl"><Title text={t('guide.allTipsTitle')} /></h2>
          <ul className="grid gap-1.5 pl-5 m-0 list-disc text-lg font-semibold">
            {(['png', 'exact', 'words', 'kids', 'own'] as const).map((k) => <li key={k}>{t(`guide.rule.${k}`)}</li>)}
          </ul>
          <Link to="/blog/designing-a-theme-file" className={buttonClasses('secondary', 'justify-self-start hover-pop')}>{t('guide.howTo')}</Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
