import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import { GAMES } from '../../games/registry';
import { signInManifest } from '../../student/pictures';
import { bigScreenManifest } from '../../live/screenManifest';
import { t } from '../../i18n';
import type { ThemePieceSpec } from '../types';
import { buttonClasses } from '../../ui/kit';
import { ClassicPiece } from './classicArt';
import { CODE, codeBits, codeX, isRound, MARKER, markerCenters, OUTLINE_STROKE, outlineBox, PAGE } from './template';

// One printed page for one piece: corner squares, page number squares, what
// to draw, and the outline at the piece's shape. Students draw inside the
// outline, then the teacher photographs the pages into the Theme Builder.
export function TemplateSheet({ gameName, gameId, piece, page, total, example = false }: { gameName: string; gameId?: string; piece: ThemePieceSpec; page: number; total: number; example?: boolean }) {
  if (example && gameId) return <ExampleSheet gameName={gameName} gameId={gameId} piece={piece} page={page} total={total} />;
  const box = outlineBox(piece);
  const ink = '#3a3a3a';
  return (
    <svg viewBox={`0 0 ${PAGE.width} ${PAGE.height}`} className="template-sheet" role="img" aria-label={t('builder.sheet', { n: page, piece: piece.label })}
      style={{ fontFamily: "'Inclusive Sans', system-ui, sans-serif" }}>
      <rect width={PAGE.width} height={PAGE.height} fill="#fff" />
      {markerCenters().map(([x, y], i) => (
        <g key={i}>
          <rect x={x - MARKER.size / 2} y={y - MARKER.size / 2} width={MARKER.size} height={MARKER.size} fill="#000" />
          {i === 0 && <rect x={x - 20} y={y - 20} width={40} height={40} fill="#fff" />}
        </g>
      ))}
      {codeBits(page).map((bit, b) => (
        <rect key={b} x={codeX(b) + 2} y={CODE.y + 2} width={CODE.size - 4} height={CODE.size - 4} fill={bit ? '#000' : '#fff'} stroke="#000" strokeWidth={4} />
      ))}
      <text x={PAGE.width / 2} y={240} textAnchor="middle" fontSize={64} fontWeight={700} fill="#000">{piece.label}</text>
      <text x={PAGE.width / 2} y={310} textAnchor="middle" fontSize={38} fill="#333">{piece.hint}</text>
      <text x={PAGE.width / 2} y={370} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetNote')}</text>
      {isRound(piece)
        ? <ellipse cx={box.x + box.width / 2} cy={box.y + box.height / 2} rx={box.width / 2} ry={box.height / 2} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} />
        : <rect x={box.x} y={box.y} width={box.width} height={box.height} rx={18} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} />}
      <text x={PAGE.width / 2} y={2080} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetFooter', { game: gameName, n: page, total })}</text>
    </svg>
  );
}

// The Classic example (teacher, 2026-10-28: "classic example, yes, but not
// recreatable"): a look-only page. The Classic art is small and stamped
// EXAMPLE, with no corner squares, page code or outline, so a photo of it
// cannot be read back into a theme. Designers see what the piece is, then
// draw their own on the blank pages.
function ExampleSheet({ gameName, gameId, piece, page, total }: { gameName: string; gameId: string; piece: ThemePieceSpec; page: number; total: number }) {
  const full = outlineBox(piece);
  const k = 0.5;
  const box = { width: full.width * k, height: full.height * k, x: PAGE.width / 2 - (full.width * k) / 2, y: 480 };
  return (
    <svg viewBox={`0 0 ${PAGE.width} ${PAGE.height}`} className="template-sheet" role="img" aria-label={t('builder.sheetExampleLabel', { n: page, piece: piece.label })}
      style={{ fontFamily: "'Inclusive Sans', system-ui, sans-serif" }}>
      <rect width={PAGE.width} height={PAGE.height} fill="#fff" />
      <text x={PAGE.width / 2} y={240} textAnchor="middle" fontSize={64} fontWeight={700} fill="#000">{piece.label}</text>
      <text x={PAGE.width / 2} y={310} textAnchor="middle" fontSize={38} fill="#333">{piece.hint}</text>
      <text x={PAGE.width / 2} y={370} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetExample')}</text>
      <svg x={box.x} y={box.y} width={box.width} height={box.height} viewBox={`0 0 ${piece.width} ${piece.height}`} preserveAspectRatio="none">
        <ClassicPiece piece={piece} gameId={gameId} />
      </svg>
      {/* Stamped EXAMPLE across the art, sized to the piece. */}
      <defs><clipPath id={`example-clip-${page}`}><rect x={box.x} y={box.y} width={box.width} height={box.height} /></clipPath></defs>
      <g clipPath={`url(#example-clip-${page})`} pointerEvents="none">
        {Array.from({ length: 12 }, (_, i) => {
          const fs = Math.max(48, Math.min(box.width, box.height) * 0.16);
          const x = box.x + (i % 3) * (box.width / 2.4) - fs, y = box.y + fs + Math.floor(i / 3) * (box.height / 3.2);
          return <text key={i} x={x} y={y} fontSize={fs} fontWeight={700} fill="#000" opacity={0.2} transform={`rotate(-24 ${x} ${y})`}>EXAMPLE</text>;
        })}
      </g>
      <rect x={box.x} y={box.y} width={box.width} height={box.height} fill="none" stroke="#000" strokeWidth={4} strokeDasharray="18 12" />
      <text x={PAGE.width / 2} y={box.y + box.height + 90} textAnchor="middle" fontSize={40} fontWeight={700} fill="#000">{t('builder.sheetExampleOnly')}</text>
      <text x={PAGE.width / 2} y={2080} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetFooter', { game: gameName, n: page, total })}</text>
    </svg>
  );
}

// Every template page for one game, ready to print (one piece per page).
export default function TemplatePage() {
  const { gameId } = useParams();
  const example = useSearchParams()[0].get('example') === 'classic';
  const game = [...GAMES, signInManifest, bigScreenManifest].find((g) => g.id === gameId);
  if (!game) return null;
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <div className="no-print flex flex-wrap items-center gap-3 mb-6">
        <Link to={`/teacher/themes/${game.id}`} className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t('builder.backToBuilder')}</Link>
        <button type="button" onClick={() => window.print()} className={buttonClasses('primary')}><Printer weight="bold" size={18} />{t('builder.print')}</button>
        <p className="font-bold">{t(example ? 'builder.printNoteExample' : 'builder.printNote', { count: game.themePieces.length })}</p>
      </div>
      <div className="grid gap-6">
        {game.themePieces.map((p, i) => (
          <div key={p.id} className="template-page bg-white border-[2px] border-border-soft rounded-input overflow-hidden">
            <TemplateSheet gameName={game.name} gameId={game.id} piece={p} page={i + 1} total={game.themePieces.length} example={example} />
          </div>
        ))}
      </div>
    </main>
  );
}
