import { TemplateLock, useTemplateAccess } from './templateAccess';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from '@phosphor-icons/react';
import { GAMES } from '../../games/registry';
import { signInManifest } from '../../student/pictures';
import { bigScreenManifest } from '../../live/screenManifest';
import { t } from '../../i18n';
import type { ThemePieceSpec } from '../types';
import { buttonClasses } from '../../ui/kit';
import { hasShape, shapePath } from './shapes';
import { CODE, codeBits, codeX, isRound, MARKER, markerCenters, OUTLINE_STROKE, outlineBox, PAGE, templatePieces } from './template';

function wrap(text: string, max: number): string[] {
  const out: string[] = []; let cur = '';
  for (const w of text.split(' ')) { if ((cur + ' ' + w).trim().length > max && cur) { out.push(cur); cur = w; } else cur = (cur + ' ' + w).trim(); }
  if (cur) out.push(cur);
  return out;
}

// One printed page for one piece: corner squares, page number squares, what
// to draw, and the outline at the piece's shape. Students draw inside the
// outline, then the teacher photographs the pages into the Theme Builder.
export function TemplateSheet({ gameName, piece, page, total }: { gameName: string; piece: ThemePieceSpec; page: number; total: number }) {
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
      {/* The hint wraps (a power-up's power can be long), never cut off. */}
      {wrap(piece.hint ?? '', 66).slice(0, 3).map((ln, i, all) => (
        <text key={i} x={PAGE.width / 2} y={300 + i * 42 - (all.length - 1) * 8} textAnchor="middle" fontSize={34} fill="#333">{ln}</text>
      ))}
      <text x={PAGE.width / 2} y={2030} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetNote')}</text>
      {piece.id === 'dice'
        // The die: all six sides on one strip, one square each, numbered (teacher, 2026-11-08).
        ? Array.from({ length: 6 }, (_, k) => { const w = box.width / 6; return (
            <g key={k}>
              <rect x={box.x + k * w + 8} y={box.y + 8} width={w - 16} height={box.height - 16} rx={22} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} />
              <text x={box.x + k * w + w / 2} y={box.y + box.height + 56} textAnchor="middle" fontSize={40} fontWeight={700} fill="#555">{t('builder.dieSide', { n: k + 1 })}</text>
            </g>); })
        : hasShape(piece.id)
        ? <path d={shapePath(piece.id, box.x, box.y, box.width, box.height)!} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} strokeLinejoin="round" />
        : isRound(piece)
        ? <ellipse cx={box.x + box.width / 2} cy={box.y + box.height / 2} rx={box.width / 2} ry={box.height / 2} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} />
        : <rect x={box.x} y={box.y} width={box.width} height={box.height} rx={18} fill="none" stroke={ink} strokeWidth={OUTLINE_STROKE} />}
      <text x={PAGE.width / 2} y={2085} textAnchor="middle" fontSize={30} fill="#555">{t('builder.sheetFooter', { game: gameName, n: page, total })}</text>
    </svg>
  );
}

// Every template page for one game, ready to print (one piece per page).
// Always blank: the Classic look is shown in the blog's theme guides, never
// printed (teacher, 2026-10-28). `guide`: opened from the public guide.
export default function TemplatePage({ guide = false }: { guide?: boolean }) {
  const { gameId } = useParams();
  const game = [...GAMES, signInManifest, bigScreenManifest].find((g) => g.id === gameId);
  const access = useTemplateAccess(gameId ?? '');
  if (!game) return null;
  const pages = templatePieces(game);
  const back = guide ? `/blog/themes/${game.id}` : `/teacher/themes/${game.id}`;
  if (access !== 'ok') {
    return (
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16 grid gap-4">
        <Link to={back} className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t(guide ? 'guide.back' : 'builder.backToBuilder')}</Link>
        <TemplateLock access={access} />
      </main>
    );
  }
  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 pb-16">
      <div className="no-print flex flex-wrap items-center gap-3 mb-6">
        <Link to={guide ? `/blog/themes/${game.id}` : `/teacher/themes/${game.id}`} className={buttonClasses('secondary')}><ArrowLeft weight="bold" size={18} />{t(guide ? 'guide.back' : 'builder.backToBuilder')}</Link>
        <button type="button" onClick={() => window.print()} className={buttonClasses('primary')}><Printer weight="bold" size={18} />{t('builder.print')}</button>
        <p className="font-bold">{t('builder.printNote', { count: pages.length })}</p>
      </div>
      <div className="grid gap-6">
        {pages.map((p, i) => (
          <div key={p.id} className="template-page bg-white border-[2px] border-border-soft rounded-input overflow-hidden">
            <TemplateSheet gameName={game.name} piece={p} page={i + 1} total={pages.length} />
          </div>
        ))}
      </div>
    </main>
  );
}
