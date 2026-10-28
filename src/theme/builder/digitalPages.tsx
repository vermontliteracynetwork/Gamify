import { renderToStaticMarkup } from 'react-dom/server';
import { zipSync } from 'fflate';
import type { ThemePieceSpec } from '../types';
import { BlankGuide } from './classicArt';

// The digital template: one PNG per piece at its exact size (for Canva or
// any drawing app), blank with a shape guide, all in one zip with a list of
// the sizes. Never the Classic art: Classic is seen, not handed out
// (teacher, 2026-10-28).
function pieceSvg(piece: ThemePieceSpec): string {
  return renderToStaticMarkup(
    <svg xmlns="http://www.w3.org/2000/svg" width={piece.width} height={piece.height} viewBox={`0 0 ${piece.width} ${piece.height}`}>
      <BlankGuide piece={piece} />
    </svg>,
  );
}

async function svgToPng(svg: string, width: number, height: number): Promise<Uint8Array> {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((ok, fail) => canvas.toBlob((b) => (b ? ok(b) : fail(new Error('PNG failed'))), 'image/png'));
    return new Uint8Array(await blob.arrayBuffer());
  } finally { URL.revokeObjectURL(url); }
}

export const fileSlug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export async function digitalZip(gameName: string, pieces: ThemePieceSpec[]): Promise<Blob> {
  const files: Record<string, Uint8Array> = {};
  const sizes: string[] = [`${gameName} theme pieces`, 'Make each design at exactly this size, save it as a PNG, then add it on the Upload tab. To see the Classic look of each piece, open Classic example on the Download tab.', ''];
  for (const [i, p] of pieces.entries()) {
    const name = `${String(i + 1).padStart(2, '0')}-${fileSlug(p.label)}-${p.width}x${p.height}.png`;
    files[name] = await svgToPng(pieceSvg(p), p.width, p.height);
    sizes.push(`${name}: ${p.label}, ${p.width} x ${p.height} px. ${p.hint}`);
  }
  files['sizes.txt'] = new TextEncoder().encode(sizes.join('\n'));
  return new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' });
}

export function saveFile(blob: Blob, name: string) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
