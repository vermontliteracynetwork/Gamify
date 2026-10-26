import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Acorn, Airplane, Alien, Anchor, ArrowCounterClockwise, ArrowClockwise, Atom, Avocado, Backpack, Balloon, Baseball, Basketball, Bell, Bicycle, Bird, Boat, Bone, Book,
  Bread, Brain, Bug, Bus, Butterfly, Cactus, Cake, Camera, Campfire, Car, Carrot, Cat, Cheese, Circle, Clock, Cloud, CloudRain, Clover, Coffee, Coin, Compass,
  Confetti, Cookie, Cow, Crown, Diamond, DiceFive, Dog, Drop, Egg, Eraser, Eyes, Feather, Fire, Fish, Flag, Flask, Flower, FlowerLotus, Football, Footprints,
  GameController, Ghost, Gift, Globe, Guitar, Hamburger, HandWaving, Headphones, Heart, Horse, Hourglass, House, IceCream, Key, Leaf, Lightbulb,
  Lightning, Lighthouse, MagicWand, Magnet, MapPin, Medal, Megaphone, Microphone, Microscope, Moon, Mountains, MusicNote, Orange, PaintBrush, PaintBucket,
  Palette, PawPrint, Pencil, Pepper, PiggyBank, Pizza, Planet, Plant, Popcorn, PuzzlePiece, Rabbit, Rainbow, Robot, Rocket, Sailboat, Scissors, Shapes,
  Shield, Shrimp, Smiley, Snowflake, SoccerBall, Sparkle, Square, Star, StarFour, Sticker, Sun, Television, TennisBall, Tent, Tipi, Tractor, Train, Tree,
  TreeEvergreen, Triangle, Trophy, TShirt, Umbrella, Waves, X, type Icon,
} from '@phosphor-icons/react';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { Button } from '../../ui/kit';
import DialogFocus from '../../ui/DialogFocus';
import type { ThemePieceSpec } from '../types';
import { CLASSIC_ITEM_ART, ClassicItemSvg } from '../classicItems';
import { ClassicPiece } from './classicArt';
import { isRound } from './template';

// Draw a theme piece right in the Theme Builder (teacher, 2026-10-26: "think
// Canva and Procreate", "simple yet intuitive... menus collapsable, things
// searchable... free usable assets... paint brush options, fill bucket").
// Everything here is ours or MIT (Phosphor icons, docs/asset-ledger.md), so
// whatever a class draws is theirs to use.

type Tool = 'brush' | 'eraser' | 'fill' | 'sticker' | 'shape';
type BrushKind = 'pen' | 'marker' | 'crayon' | 'spray';
type ShapeKind = 'circle' | 'square' | 'triangle';

// Free stickers: Phosphor icons (MIT) with words to search by.
const STICKERS: [string, Icon, string][] = [
  ['star', Star, 'sky night space'], ['heart', Heart, 'love'], ['sun', Sun, 'sky day weather'], ['moon', Moon, 'sky night'], ['cloud', Cloud, 'sky weather'],
  ['rain', CloudRain, 'weather'], ['lightning', Lightning, 'weather storm'], ['snowflake', Snowflake, 'winter weather'], ['rainbow', Rainbow, 'sky weather'],
  ['sparkle', Sparkle, 'magic shine'], ['star four', StarFour, 'shine sparkle'], ['planet', Planet, 'space'], ['rocket', Rocket, 'space'], ['alien', Alien, 'space'],
  ['tree', Tree, 'nature forest'], ['pine tree', TreeEvergreen, 'nature forest winter'], ['flower', Flower, 'nature garden'], ['lotus', FlowerLotus, 'nature garden'],
  ['leaf', Leaf, 'nature fall'], ['cactus', Cactus, 'desert nature'], ['plant', Plant, 'nature garden'], ['acorn', Acorn, 'nature fall'], ['clover', Clover, 'nature luck'],
  ['mountains', Mountains, 'nature'], ['waves', Waves, 'ocean sea water'], ['drop', Drop, 'water'], ['fire', Fire, 'camp hot'], ['campfire', Campfire, 'camp'],
  ['fish', Fish, 'ocean sea animal'], ['shrimp', Shrimp, 'ocean sea animal'], ['cat', Cat, 'animal pet'], ['dog', Dog, 'animal pet'], ['bird', Bird, 'animal'],
  ['butterfly', Butterfly, 'animal bug'], ['bug', Bug, 'animal insect'], ['horse', Horse, 'animal farm'], ['cow', Cow, 'animal farm'], ['rabbit', Rabbit, 'animal bunny'],
  ['paw print', PawPrint, 'animal'], ['bone', Bone, 'dog'], ['feather', Feather, 'bird'], ['footprints', Footprints, 'walk'], ['ghost', Ghost, 'halloween spooky'],
  ['robot', Robot, 'tech'], ['car', Car, 'vehicle road'], ['bus', Bus, 'vehicle school'], ['bike', Bicycle, 'vehicle'], ['airplane', Airplane, 'vehicle sky'],
  ['boat', Boat, 'vehicle water'], ['sailboat', Sailboat, 'vehicle water ocean'], ['train', Train, 'vehicle'], ['tractor', Tractor, 'vehicle farm'],
  ['house', House, 'home building'], ['tent', Tent, 'camp'], ['tipi', Tipi, 'camp'], ['lighthouse', Lighthouse, 'ocean building'], ['crown', Crown, 'king queen'],
  ['diamond', Diamond, 'gem jewel'], ['gift', Gift, 'present party'], ['trophy', Trophy, 'win prize'], ['medal', Medal, 'win prize'], ['balloon', Balloon, 'party'],
  ['confetti', Confetti, 'party'], ['music', MusicNote, 'song'], ['guitar', Guitar, 'music'], ['bell', Bell, 'school'], ['book', Book, 'school read'],
  ['pencil', Pencil, 'school write'], ['paintbrush', PaintBrush, 'art'], ['palette', Palette, 'art paint'], ['scissors', Scissors, 'school art'], ['backpack', Backpack, 'school'],
  ['carrot', Carrot, 'food vegetable'], ['pepper', Pepper, 'food vegetable'], ['avocado', Avocado, 'food'], ['pizza', Pizza, 'food'], ['hamburger', Hamburger, 'food'],
  ['ice cream', IceCream, 'food dessert'], ['cookie', Cookie, 'food dessert'], ['cake', Cake, 'food dessert party'], ['bread', Bread, 'food'], ['cheese', Cheese, 'food'],
  ['egg', Egg, 'food'], ['orange', Orange, 'food fruit'], ['popcorn', Popcorn, 'food movie'], ['coffee', Coffee, 'drink cup'],
  ['basketball', Basketball, 'sport ball'], ['soccer ball', SoccerBall, 'sport ball'], ['football', Football, 'sport ball'], ['baseball', Baseball, 'sport ball'],
  ['tennis ball', TennisBall, 'sport ball'], ['game controller', GameController, 'video game'], ['puzzle piece', PuzzlePiece, 'game'], ['dice', DiceFive, 'game'],
  ['key', Key, 'lock'], ['magic wand', MagicWand, 'magic'], ['shield', Shield, 'knight'], ['anchor', Anchor, 'ocean ship'], ['compass', Compass, 'map'],
  ['map pin', MapPin, 'map place'], ['globe', Globe, 'world earth map'], ['clock', Clock, 'time'], ['hourglass', Hourglass, 'time'], ['magnet', Magnet, 'science'],
  ['lightbulb', Lightbulb, 'idea science'], ['atom', Atom, 'science'], ['flask', Flask, 'science'], ['microscope', Microscope, 'science'], ['brain', Brain, 'think science'],
  ['wave hello', HandWaving, 'hand'], ['smiley', Smiley, 'face happy'], ['eyes', Eyes, 'face look'], ['piggy bank', PiggyBank, 'money'], ['coin', Coin, 'money'],
  ['camera', Camera, 'photo'], ['tv', Television, 'screen'], ['headphones', Headphones, 'music'], ['microphone', Microphone, 'music sing'], ['megaphone', Megaphone, 'loud'],
  ['flag', Flag, 'win'], ['umbrella', Umbrella, 'rain weather'], ['t-shirt', TShirt, 'clothes'],
];

// Brand colors first, then a full rainbow.
const SWATCHES = ['#000000', '#ffffff', '#fdfd94', '#f2735f', '#ff9a8b', '#1f2a5a', '#9fe7a0', '#b4c1fb', '#e53935', '#fb8c00', '#fdd835', '#43a047', '#1e88e5', '#8e24aa', '#6d4c41', '#9e9e9e'];

// Starter backgrounds, drawn in code.
const BACKDROPS: { id: string; stops: string[]; dots?: string }[] = [
  { id: 'night', stops: ['#0d1638', '#2c3a7a'], dots: '#ffffff' },
  { id: 'day', stops: ['#8ec5ff', '#e8f4ff'] },
  { id: 'ocean', stops: ['#8ec5ff', '#1e5aa8'] },
  { id: 'meadow', stops: ['#bfe8ff', '#bfe8ff', '#7cc96b', '#4f9a45'] },
  { id: 'sunset', stops: ['#ff9a8b', '#fdd36a', '#fdfd94'] },
  { id: 'candy', stops: ['#ffd1ec', '#c9b6ff'], dots: '#ffffff' },
];

const MAX_SIDE = 1200;
const MAX_UNDO = 30;

export default function DrawStudio({ piece, gameId, image, onSave, onClose }: {
  piece: ThemePieceSpec; gameId: string; image?: string; onSave: (dataUrl: string) => void; onClose: () => void;
}) {
  const scale = Math.min(1, MAX_SIDE / Math.max(piece.width, piece.height));
  const W = Math.round(piece.width * scale), H = Math.round(piece.height * scale);
  const canvas = useRef<HTMLCanvasElement>(null);
  const classicRef = useRef<SVGSVGElement>(null);
  const [tool, setTool] = useState<Tool>('brush');
  const [brush, setBrush] = useState<BrushKind>('pen');
  const [shape, setShape] = useState<ShapeKind>('circle');
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(Math.max(4, Math.round(Math.min(W, H) * 0.02)));
  const [sticker, setSticker] = useState<{ svg: string; recolor: boolean; label: string } | null>(null);
  const [stickerSize, setStickerSize] = useState(Math.round(Math.min(W, H) * 0.25));
  const [query, setQuery] = useState('');
  const [undo, setUndo] = useState<ImageData[]>([]);
  const [redo, setRedo] = useState<ImageData[]>([]);
  const stroke = useRef<{ base: ImageData; points: [number, number][] } | null>(null);
  const round = isRound(piece);
  // The canvas keeps the piece's shape at any screen size.
  const frame = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(0.1);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const measure = () => setFit(Math.max(0.05, Math.min((el.clientWidth - 24) / W, (el.clientHeight - 24) / H)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [W, H]);

  const ctx = () => canvas.current!.getContext('2d', { willReadFrequently: true })!;
  const snapshot = () => ctx().getImageData(0, 0, W, H);
  function remember() { setUndo((u) => [...u.slice(-MAX_UNDO + 1), snapshot()]); setRedo([]); }
  function step(from: ImageData[], to: (f: (x: ImageData[]) => ImageData[]) => void, setFrom: (f: (x: ImageData[]) => ImageData[]) => void) {
    const last = from.at(-1);
    if (!last) return;
    to((x) => [...x, snapshot()]);
    setFrom((x) => x.slice(0, -1));
    ctx().putImageData(last, 0, 0);
  }

  // Start from the current picture, if there is one.
  useEffect(() => {
    if (!image) return;
    const img = new Image();
    img.onload = () => ctx().drawImage(img, 0, 0, W, H);
    img.src = image;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const at = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H];
  };

  function paint(points: [number, number][], base: ImageData) {
    const c = ctx();
    c.putImageData(base, 0, 0);
    c.save();
    c.lineCap = 'round'; c.lineJoin = 'round'; c.lineWidth = size;
    c.globalCompositeOperation = tool === 'eraser' ? 'destination-out' : 'source-over';
    c.strokeStyle = c.fillStyle = color;
    if (tool === 'eraser' || brush === 'pen' || brush === 'marker') {
      if (tool !== 'eraser' && brush === 'marker') { c.globalAlpha = 0.45; c.lineWidth = size * 1.6; c.lineCap = 'square'; }
      c.beginPath();
      points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
      if (points.length === 1) c.lineTo(points[0][0] + 0.1, points[0][1]);
      c.stroke();
    } else {
      // Crayon and spray: speckles along the line, seeded per point so a
      // stroke looks the same each time it is redrawn.
      const crayon = brush === 'crayon';
      for (let i = 0; i < points.length; i++) {
        const [x0, y0] = points[Math.max(0, i - 1)], [x1, y1] = points[i];
        const steps = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / (size / 4)));
        for (let s = 0; s < steps; s++) {
          const x = x0 + ((x1 - x0) * s) / steps, y = y0 + ((y1 - y0) * s) / steps;
          let seed = (i * 131 + s * 17) >>> 0;
          const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
          const n = crayon ? 14 : 22;
          for (let k = 0; k < n; k++) {
            const a = rand() * Math.PI * 2, d = (crayon ? 0.5 : Math.sqrt(rand())) * size * (crayon ? 0.5 + rand() * 0.5 : 1);
            c.globalAlpha = crayon ? 0.55 : 0.35;
            const dot = crayon ? Math.max(1, size * 0.18) : Math.max(1, size * 0.06);
            c.fillRect(x + Math.cos(a) * d, y + Math.sin(a) * d, dot, dot);
          }
        }
      }
    }
    c.restore();
  }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = at(e);
    if (tool === 'fill') { remember(); floodFill(ctx(), W, H, Math.round(p[0]), Math.round(p[1]), color); return; }
    if (tool === 'sticker') { if (sticker) { remember(); void stamp(sticker, p); } return; }
    if (tool === 'shape') { remember(); drawShape(p); return; }
    remember();
    stroke.current = { base: snapshot(), points: [p] };
    paint(stroke.current.points, stroke.current.base);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!stroke.current) return;
    stroke.current.points.push(at(e));
    paint(stroke.current.points, stroke.current.base);
  }
  function up() { stroke.current = null; }

  async function stamp(s: { svg: string; recolor: boolean }, [x, y]: [number, number]) {
    const svg = s.recolor ? s.svg.replace(/currentColor/g, color) : s.svg;
    const img = await loadSvg(svg);
    ctx().drawImage(img, x - stickerSize / 2, y - stickerSize / 2, stickerSize, stickerSize);
  }
  function drawShape([x, y]: [number, number]) {
    const c = ctx(), r = stickerSize / 2;
    c.save(); c.fillStyle = color; c.strokeStyle = '#000000'; c.lineWidth = Math.max(2, r * 0.06);
    c.beginPath();
    if (shape === 'circle') c.arc(x, y, r, 0, Math.PI * 2);
    else if (shape === 'square') c.rect(x - r, y - r, r * 2, r * 2);
    else { c.moveTo(x, y - r); c.lineTo(x + r, y + r * 0.8); c.lineTo(x - r, y + r * 0.8); c.closePath(); }
    c.fill(); c.stroke(); c.restore();
  }
  function backdrop(b: typeof BACKDROPS[number]) {
    remember();
    const c = ctx();
    const g = c.createLinearGradient(0, 0, 0, H);
    b.stops.forEach((s, i) => g.addColorStop(b.stops.length === 1 ? 0 : i / (b.stops.length - 1), s));
    c.save(); c.globalCompositeOperation = 'destination-over'; c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore();
    if (b.dots) {
      c.save(); c.globalCompositeOperation = 'destination-over'; c.fillStyle = b.dots;
      for (let i = 0; i < 60; i++) { c.beginPath(); c.arc((i * 397) % W, (i * 211) % H, 1.5 + (i % 3), 0, Math.PI * 2); c.fill(); }
      c.restore();
    }
  }
  async function startFrom(kind: 'blank' | 'classic') {
    remember();
    ctx().clearRect(0, 0, W, H);
    if (kind === 'classic' && classicRef.current) ctx().drawImage(await loadSvg(new XMLSerializer().serializeToString(classicRef.current)), 0, 0, W, H);
  }
  function save() {
    const opaque = piece.id === 'background';
    onSave(canvas.current!.toDataURL(opaque ? 'image/jpeg' : 'image/png', 0.88));
  }

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STICKERS.filter(([name, , words]) => !q || name.includes(q) || words.includes(q));
  }, [query]);
  const pickSticker = (e: React.MouseEvent<HTMLButtonElement>, label: string, recolor: boolean) => {
    const svg = e.currentTarget.querySelector('svg');
    if (!svg) return;
    setSticker({ svg: new XMLSerializer().serializeToString(svg), recolor, label });
    setTool('sticker');
  };

  const TOOLS: [Tool, Icon][] = [['brush', PaintBrush], ['eraser', Eraser], ['fill', PaintBucket], ['sticker', Sticker], ['shape', Shapes]];

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-stretch justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={t('studio.title', { piece: piece.label })}>
      <DialogFocus onClose={onClose} />
      <div className="bg-surface border-[2.5px] border-border rounded-panel w-full max-w-7xl grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <div className="flex flex-wrap items-center gap-2 p-3 border-b-[2px] border-border-soft">
          <h2 className="font-display text-xl sm:text-2xl flex-1 min-w-40">{t('studio.title', { piece: piece.label })}</h2>
          <Button disabled={!undo.length} onClick={() => step(undo, setRedo, setUndo)} aria-label={t('studio.undo')}><ArrowCounterClockwise weight="bold" size={18} /><span className="hidden sm:inline">{t('studio.undo')}</span></Button>
          <Button disabled={!redo.length} onClick={() => step(redo, setUndo, setRedo)} aria-label={t('studio.redo')}><ArrowClockwise weight="bold" size={18} /><span className="hidden sm:inline">{t('studio.redo')}</span></Button>
          <Button onClick={onClose}><X weight="bold" size={18} />{t('studio.cancel')}</Button>
          <Button variant="primary" onClick={save}>{t('studio.use')}</Button>
        </div>

        <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-rows-1 lg:grid-cols-[auto_minmax(0,1fr)_300px] min-h-0">
          {/* Tools */}
          <div role="radiogroup" aria-label={t('studio.tools')} className="flex lg:flex-col gap-1.5 p-2 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-border-soft overflow-x-auto">
            {TOOLS.map(([id, I]) => (
              <button key={id} type="button" role="radio" aria-checked={tool === id} onClick={() => setTool(id)}
                className={`shrink-0 w-[4.5rem] min-h-16 rounded-input border-[2px] grid justify-items-center content-center gap-0.5 font-bold text-xs ${tool === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <I weight={tool === id ? 'fill' : 'bold'} size={26} aria-hidden="true" />{t(`studio.tool.${id}`)}
              </button>
            ))}
            <span className="shrink-0 w-12 h-12 lg:w-[4.5rem] lg:h-12 self-center rounded-input border-[2.5px] border-border" style={{ background: color }} aria-label={t('studio.colorNow', { color })} role="img" />
          </div>

          {/* Canvas */}
          <div ref={frame} className="min-h-0 p-3 flex items-center justify-center bg-[repeating-conic-gradient(#eef0f7_0_25%,#ffffff_0_50%)] [background-size:24px_24px]">
            <div className="relative" style={{ width: W * fit, height: H * fit }}>
              <canvas ref={canvas} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                aria-label={t('studio.canvas', { piece: piece.label })} className="w-full h-full border-[2.5px] border-border bg-transparent touch-none cursor-crosshair" style={{ borderRadius: round ? '50%' : 12 }} />
            </div>
          </div>

          {/* Options: collapsible and searchable */}
          <div className="min-h-0 max-h-[38dvh] lg:max-h-none overflow-y-auto p-2 border-t-[2px] lg:border-t-0 lg:border-l-[2px] border-border-soft grid gap-2 content-start">
            <Section title={t('studio.color')} open>
              <div className="grid grid-cols-8 gap-1.5">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" onClick={() => { setColor(c); if (tool === 'eraser') setTool('brush'); }} aria-label={c} aria-pressed={color === c}
                    className={`aspect-square rounded-full border-[2px] ${color === c ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`} style={{ background: c }} />
                ))}
              </div>
              <label className="flex items-center gap-2 font-bold text-sm">{t('studio.anyColor')}
                <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-12 h-10 rounded-input border-[2px] border-border" />
              </label>
            </Section>
            <Section title={t('studio.brush')} open={tool === 'brush' || tool === 'eraser'}>
              <div role="radiogroup" aria-label={t('studio.brushKind')} className="grid grid-cols-2 gap-1.5">
                {(['pen', 'marker', 'crayon', 'spray'] as const).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={brush === k} onClick={() => { setBrush(k); setTool('brush'); }}
                    className={`min-h-11 rounded-input border-[2px] font-bold text-sm ${brush === k && tool === 'brush' ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`studio.brush.${k}`)}</button>
                ))}
              </div>
              <label className="grid gap-1 font-bold text-sm">{t('studio.size', { size })}
                <input type="range" min={1} max={Math.round(Math.min(W, H) * 0.15)} value={size} onChange={(e) => setSize(Number(e.target.value))} />
              </label>
            </Section>
            <Section title={t('studio.stickers')} open={tool === 'sticker'}>
              <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('studio.search')} aria-label={t('studio.search')}
                className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
              <div className="grid grid-cols-6 gap-1">
                {Object.keys(CLASSIC_ITEM_ART).filter((a) => !query.trim() || a.includes(query.trim().toLowerCase())).map((a) => (
                  <button key={a} type="button" aria-label={a.replace(/-/g, ' ')} aria-pressed={sticker?.label === a} onClick={(e) => pickSticker(e, a, false)}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${sticker?.label === a ? 'border-border bg-accent' : 'border-transparent'}`}><ClassicItemSvg art={a} size={32} /></button>
                ))}
                {found.map(([name, I]) => (
                  <button key={name} type="button" aria-label={name} aria-pressed={sticker?.label === name} onClick={(e) => pickSticker(e, name, true)}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${sticker?.label === name ? 'border-border bg-accent' : 'border-transparent'}`}><I weight="fill" size={28} /></button>
                ))}
              </div>
              {found.length === 0 && <p className="text-sm font-bold text-muted">{t('studio.noStickers')}</p>}
              <label className="grid gap-1 font-bold text-sm">{t('studio.stickerSize')}
                <input type="range" min={16} max={Math.round(Math.min(W, H))} value={stickerSize} onChange={(e) => setStickerSize(Number(e.target.value))} />
              </label>
              <p className="text-xs font-semibold text-muted">{t('studio.stickerHint')}</p>
            </Section>
            <Section title={t('studio.shapes')} open={tool === 'shape'}>
              <div role="radiogroup" aria-label={t('studio.shapes')} className="grid grid-cols-3 gap-1.5">
                {([['circle', Circle], ['square', Square], ['triangle', Triangle]] as const).map(([k, I]) => (
                  <button key={k} type="button" role="radio" aria-checked={shape === k && tool === 'shape'} aria-label={t(`studio.shape.${k}`)} onClick={() => { setShape(k); setTool('shape'); }}
                    className={`min-h-12 rounded-input border-[2px] flex items-center justify-center ${shape === k && tool === 'shape' ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}><I weight="fill" size={26} color={color} /></button>
                ))}
              </div>
              <p className="text-xs font-semibold text-muted">{t('studio.shapeHint')}</p>
            </Section>
            <Section title={t('studio.backgrounds')}>
              <div className="grid grid-cols-3 gap-1.5">
                {BACKDROPS.map((b) => (
                  <button key={b.id} type="button" onClick={() => backdrop(b)} className="min-h-14 rounded-input border-[2px] border-border font-bold text-xs text-left p-1.5 flex items-end"
                    style={{ background: `linear-gradient(180deg, ${b.stops.join(', ')})`, color: b.id === 'night' || b.id === 'ocean' ? '#ffffff' : '#000000' }}>{t(`studio.bg.${b.id}` as StringKey)}</button>
                ))}
              </div>
              <p className="text-xs font-semibold text-muted">{t('studio.bgHint')}</p>
            </Section>
            <Section title={t('studio.startFrom')}>
              <div className="flex flex-wrap gap-1.5">
                <Button onClick={() => void startFrom('classic')}>{t('studio.fromClassic')}</Button>
                <Button onClick={() => void startFrom('blank')}>{t('studio.blank')}</Button>
              </div>
            </Section>
          </div>
        </div>
      </div>
      {/* The Classic look of this piece, drawn off screen for "Start from". */}
      <svg ref={classicRef} xmlns="http://www.w3.org/2000/svg" width={piece.width} height={piece.height} viewBox={`0 0 ${piece.width} ${piece.height}`} className="absolute -left-[99999px] w-0 h-0" aria-hidden="true">
        <ClassicPiece piece={piece} gameId={gameId} />
      </svg>
    </div>
  );
}

function Section({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  return (
    <details open={open} className="rounded-input border-[2px] border-border-soft bg-surface group">
      <summary className="min-h-11 px-3 flex items-center font-bold cursor-pointer select-none list-none [&::-webkit-details-marker]:hidden">
        <span className="flex-1">{title}</span><span aria-hidden="true" className="motion-safe:transition-transform group-open:rotate-90">▸</span>
      </summary>
      <div className="p-2 pt-0 grid gap-2">{children}</div>
    </details>
  );
}

function loadSvg(svg: string): Promise<HTMLImageElement> {
  const withNs = svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(withNs)}`;
  });
}

// Fill bucket: fills the touching area of the same color (with a little
// give, so soft edges from the brush fill too).
export function floodFill(c: CanvasRenderingContext2D, w: number, h: number, x: number, y: number, hex: string, tolerance = 40) {
  if (x < 0 || y < 0 || x >= w || y >= h) return;
  const img = c.getImageData(0, 0, w, h);
  const d = img.data;
  const fill = [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16), 255];
  const i0 = (y * w + x) * 4;
  const start = [d[i0], d[i0 + 1], d[i0 + 2], d[i0 + 3]];
  if (start.every((v, k) => Math.abs(v - fill[k]) < 2)) return;
  const near = (i: number) => Math.abs(d[i] - start[0]) + Math.abs(d[i + 1] - start[1]) + Math.abs(d[i + 2] - start[2]) + Math.abs(d[i + 3] - start[3]) <= tolerance * 2;
  const seen = new Uint8Array(w * h);
  const stack = [x, y];
  while (stack.length) {
    const py = stack.pop()!, px0 = stack.pop()!;
    let px = px0;
    while (px >= 0 && !seen[py * w + px] && near((py * w + px) * 4)) px--;
    px++;
    let up = false, down = false;
    while (px < w && !seen[py * w + px] && near((py * w + px) * 4)) {
      const i = (py * w + px) * 4;
      seen[py * w + px] = 1;
      d[i] = fill[0]; d[i + 1] = fill[1]; d[i + 2] = fill[2]; d[i + 3] = 255;
      if (py > 0) { const u = !seen[(py - 1) * w + px] && near(((py - 1) * w + px) * 4); if (u && !up) { stack.push(px, py - 1); } up = u; }
      if (py < h - 1) { const dn = !seen[(py + 1) * w + px] && near(((py + 1) * w + px) * 4); if (dn && !down) { stack.push(px, py + 1); } down = dn; }
      px++;
    }
  }
  c.putImageData(img, 0, 0);
}
