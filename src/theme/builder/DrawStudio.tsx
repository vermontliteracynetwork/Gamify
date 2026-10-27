import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Acorn, Airplane, Alien, Anchor, ArrowCounterClockwise, ArrowClockwise, Atom, Avocado, Backpack, Balloon, Baseball, Basketball, Bell, Bicycle, Bird, Boat, Bone, Book,
  Bread, Brain, Bug, Bus, Butterfly, Cactus, Cake, Camera, Campfire, Car, Carrot, Cat, Cheese, Clock, Cloud, CloudRain, Clover, Coffee, Coin, Compass,
  Confetti, Cookie, Cow, Crown, Diamond, DiceFive, Dog, Drop, Egg, Eraser, Eyes, Feather, Fire, Fish, Flag, Flask, Flower, FlowerLotus, Football, Footprints,
  GameController, Ghost, Gift, Globe, Guitar, Hamburger, HandWaving, Headphones, Heart, Horse, Hourglass, House, IceCream, Key, Leaf, Lightbulb,
  Lightning, Lighthouse, MagicWand, Magnet, MapPin, Medal, Megaphone, Microphone, Microscope, Moon, Mountains, MusicNote, Orange, PaintBrush, PaintBucket,
  Palette, PawPrint, Pencil, Pepper, PiggyBank, Pizza, Planet, Plant, Popcorn, PuzzlePiece, Rabbit, Rainbow, Robot, Rocket, Sailboat, Scissors, Shapes,
  Shield, Shrimp, Smiley, Snowflake, SoccerBall, Sparkle, Star, StarFour, Sticker, Sun, Television, TennisBall, Tent, Tipi, Tractor, Train, Tree,
  TreeEvergreen, Trophy, TShirt, Umbrella, Waves, X, HandGrabbing, TextT, ArrowsOutSimple, CopySimple, Trash, type Icon,
} from '@phosphor-icons/react';
import { t } from '../../i18n';
import type { StringKey } from '../../i18n/en';
import { Button } from '../../ui/kit';
import DialogFocus from '../../ui/DialogFocus';
import { APPROVED_FONTS, THEME_FONTS, type FontName, type ThemePieceSpec } from '../types';
import { CLASSIC_ITEM_ART, ClassicItemSvg } from '../classicItems';
import { ClassicPiece } from './classicArt';
import { isRound } from './template';

// Draw a theme piece right in the Theme Builder (teacher, 2026-10-26: "think
// Canva and Procreate", "simple yet intuitive... menus collapsable, things
// searchable... free usable assets... paint brush options, fill bucket").
// Everything here is ours or MIT (Phosphor icons, docs/asset-ledger.md), so
// whatever a class draws is theirs to use.

type Tool = 'move' | 'brush' | 'eraser' | 'fill' | 'sticker' | 'shape' | 'text';
type BrushKind = 'pen' | 'marker' | 'crayon' | 'spray';
type ShapeKind = 'circle' | 'square' | 'triangle' | 'heart' | 'star';

// Stickers, shapes and words sit above the paint as pieces you can move,
// resize, turn and delete (Canva style); brushes paint underneath (Procreate
// style). Saving flattens both into one picture.
interface Obj { id: number; kind: 'sticker' | 'shape' | 'text'; x: number; y: number; size: number; rot: number; color: string; svg?: string; recolor?: boolean; shape?: ShapeKind; text?: string; font?: FontName; label: string }
interface Snap { img: ImageData; objs: Obj[] }

const SHAPE_SVG: Record<ShapeKind, (fill: string) => string> = {
  circle: (f) => `<circle cx="50" cy="50" r="44" fill="${f}" stroke="#000" stroke-width="4"/>`,
  square: (f) => `<rect x="6" y="6" width="88" height="88" rx="8" fill="${f}" stroke="#000" stroke-width="4"/>`,
  triangle: (f) => `<path d="M50 6 L94 90 H6 Z" fill="${f}" stroke="#000" stroke-width="4" stroke-linejoin="round"/>`,
  heart: (f) => `<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88 Z" fill="${f}" stroke="#000" stroke-width="4" stroke-linejoin="round"/>`,
  star: (f) => `<path d="M50 5 L62 37 L95 38 L69 58 L78 92 L50 72 L22 92 L31 58 L5 38 L38 37 Z" fill="${f}" stroke="#000" stroke-width="4" stroke-linejoin="round"/>`,
};
const svgDoc = (inner: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${inner}</svg>`;
// What a sticker or shape looks like right now, as an image source.
function objSvg(o: Obj): string {
  if (o.kind === 'shape') return svgDoc(SHAPE_SVG[o.shape ?? 'circle'](o.color));
  const svg = o.recolor ? (o.svg ?? '').replace(/currentColor/g, o.color) : o.svg ?? '';
  return svg.includes('xmlns=') ? svg : svg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
}
const svgUrl = (svg: string) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

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

// Clipart sorted into shelves (teacher: "clipart sorted"), plus search.
const SHELVES: [string, string[]][] = [
  ['sky', ['sky', 'space', 'weather', 'night']], ['nature', ['nature', 'garden', 'forest', 'ocean', 'water', 'camp']], ['animals', ['animal', 'pet', 'bird', 'bug']],
  ['food', ['food', 'drink', 'dessert']], ['play', ['sport', 'game', 'ball', 'party', 'win', 'prize']], ['school', ['school', 'art', 'music', 'science', 'read', 'write']],
];
const shelfOf = (words: string) => SHELVES.find(([, keys]) => keys.some((k) => words.includes(k)))?.[0] ?? 'things';

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
  const [query, setQuery] = useState('');
  const [shelf, setShelf] = useState('all');
  const [objs, setObjs] = useState<Obj[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [undo, setUndo] = useState<Snap[]>([]);
  const [redo, setRedo] = useState<Snap[]>([]);
  const [saving, setSaving] = useState(false);
  const stroke = useRef<{ base: ImageData; points: [number, number][] } | null>(null);
  const dragging = useRef<{ id: number; mode: 'move' | 'size' | 'turn'; x: number; y: number; o: Obj } | null>(null);
  const nextId = useRef(1);
  const round = isRound(piece);
  const selected = objs.find((o) => o.id === sel) ?? null;
  const base = Math.round(Math.min(W, H) * 0.3);
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
  const snapshot = (): Snap => ({ img: ctx().getImageData(0, 0, W, H), objs });
  function remember() { setUndo((u) => [...u.slice(-MAX_UNDO + 1), snapshot()]); setRedo([]); }
  function restore(snap: Snap) { ctx().putImageData(snap.img, 0, 0); setObjs(snap.objs); setSel(null); }
  function stepBack() { const last = undo.at(-1); if (!last) return; setRedo((r) => [...r, snapshot()]); setUndo((u) => u.slice(0, -1)); restore(last); }
  function stepForward() { const last = redo.at(-1); if (!last) return; setUndo((u) => [...u, snapshot()]); setRedo((r) => r.slice(0, -1)); restore(last); }

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

  function paint(points: [number, number][], baseImg: ImageData) {
    const c = ctx();
    c.putImageData(baseImg, 0, 0);
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

  function add(o: Omit<Obj, 'id' | 'rot'>) {
    remember();
    const id = nextId.current++;
    setObjs((list) => [...list, { ...o, id, rot: 0 }]);
    setSel(id);
    setTool('move');
  }
  function update(id: number, patch: Partial<Obj>) { setObjs((list) => list.map((o) => (o.id === id ? { ...o, ...patch } : o))); }

  function down(e: React.PointerEvent<HTMLCanvasElement>) {
    const p = at(e);
    setSel(null);
    if (tool === 'fill') { remember(); floodFill(ctx(), W, H, Math.round(p[0]), Math.round(p[1]), color); return; }
    if (tool === 'sticker') { if (sticker) add({ kind: 'sticker', x: p[0], y: p[1], size: base, color, svg: sticker.svg, recolor: sticker.recolor, label: sticker.label }); return; }
    if (tool === 'shape') { add({ kind: 'shape', x: p[0], y: p[1], size: base, color, shape, label: t(`studio.shape.${shape}`) }); return; }
    if (tool === 'text') { add({ kind: 'text', x: p[0], y: p[1], size: Math.round(base / 2.5), color, text: t('studio.textDefault'), font: 'Grow Year', label: t('studio.tool.text') }); return; }
    if (tool === 'move') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    remember();
    stroke.current = { base: ctx().getImageData(0, 0, W, H), points: [p] };
    paint(stroke.current.points, stroke.current.base);
  }
  function move(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!stroke.current) return;
    stroke.current.points.push(at(e));
    paint(stroke.current.points, stroke.current.base);
  }
  function up() { stroke.current = null; }

  // Moving, resizing and turning a piece with a finger or the mouse.
  function grab(e: React.PointerEvent, o: Obj, mode: 'move' | 'size' | 'turn') {
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    remember();
    setSel(o.id);
    dragging.current = { id: o.id, mode, x: e.clientX, y: e.clientY, o };
  }
  function drag(e: React.PointerEvent) {
    const d = dragging.current;
    if (!d) return;
    if (d.mode === 'move') { update(d.id, { x: d.o.x + (e.clientX - d.x) / fit, y: d.o.y + (e.clientY - d.y) / fit }); return; }
    const r = canvas.current!.getBoundingClientRect();
    const cx = r.left + d.o.x * fit, cy = r.top + d.o.y * fit;
    if (d.mode === 'size') {
      const was = Math.hypot(d.x - cx, d.y - cy) || 1;
      update(d.id, { size: Math.max(12, Math.round(d.o.size * (Math.hypot(e.clientX - cx, e.clientY - cy) / was))) });
    } else {
      update(d.id, { rot: Math.round((Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI + 90) });
    }
  }
  function drop() { dragging.current = null; }
  function layer(id: number, to: 'front' | 'back') {
    remember();
    setObjs((list) => { const o = list.find((x) => x.id === id)!; const rest = list.filter((x) => x.id !== id); return to === 'front' ? [...rest, o] : [o, ...rest]; });
  }
  function copy(o: Obj) { add({ ...o, x: o.x + o.size * 0.2, y: o.y + o.size * 0.2 }); }
  function remove(id: number) { remember(); setObjs((list) => list.filter((o) => o.id !== id)); setSel(null); }

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
    setObjs([]); setSel(null);
    ctx().clearRect(0, 0, W, H);
    if (kind === 'classic' && classicRef.current) ctx().drawImage(await loadSvg(new XMLSerializer().serializeToString(classicRef.current)), 0, 0, W, H);
  }
  // Paint first, then every piece in order, into one picture.
  async function save() {
    setSaving(true);
    const out = document.createElement('canvas');
    out.width = W; out.height = H;
    const c = out.getContext('2d')!;
    c.drawImage(canvas.current!, 0, 0);
    for (const o of objs) {
      c.save();
      c.translate(o.x, o.y);
      c.rotate((o.rot * Math.PI) / 180);
      if (o.kind === 'text') {
        c.font = `${o.size}px ${THEME_FONTS[o.font ?? 'Grow Year']}`;
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = o.color;
        c.fillText(o.text ?? '', 0, 0);
      } else {
        c.drawImage(await loadSvg(objSvg(o)), -o.size / 2, -o.size / 2, o.size, o.size);
      }
      c.restore();
    }
    const opaque = piece.id === 'background';
    onSave(out.toDataURL(opaque ? 'image/jpeg' : 'image/png', 0.88));
  }

  const found = useMemo(() => {
    const q = query.trim().toLowerCase();
    return STICKERS.filter(([name, , words]) => (!q || name.includes(q) || words.includes(q)) && (shelf === 'all' || shelfOf(words) === shelf));
  }, [query, shelf]);
  const classicFound = Object.keys(CLASSIC_ITEM_ART).filter((a) => (!query.trim() || a.includes(query.trim().toLowerCase())) && (shelf === 'all' || shelf === 'powers'));
  const pickSticker = (e: React.MouseEvent<HTMLButtonElement>, label: string, recolor: boolean) => {
    const svg = e.currentTarget.querySelector('svg');
    if (!svg) return;
    setSticker({ svg: new XMLSerializer().serializeToString(svg), recolor, label });
    setTool('sticker');
  };
  // Drag a sticker from the shelf straight onto the picture (mouse and pen).
  const carried = useRef<{ svg: string; recolor: boolean; label: string } | null>(null);
  function dragOut(e: React.DragEvent<HTMLButtonElement>, label: string, recolor: boolean) {
    const svg = e.currentTarget.querySelector('svg');
    if (!svg) return;
    carried.current = { svg: new XMLSerializer().serializeToString(svg), recolor, label };
    e.dataTransfer.setData('text/plain', label);
    e.dataTransfer.effectAllowed = 'copy';
  }
  function dropIn(e: React.DragEvent) {
    e.preventDefault();
    const c = carried.current;
    if (!c) return;
    const r = canvas.current!.getBoundingClientRect();
    setSticker(c);
    add({ kind: 'sticker', x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H, size: base, color, svg: c.svg, recolor: c.recolor, label: c.label });
    carried.current = null;
  }
  const pickColor = (c: string) => {
    setColor(c);
    if (tool === 'eraser') setTool('brush');
    if (selected && (selected.kind !== 'sticker' || selected.recolor)) { remember(); update(selected.id, { color: c }); }
  };

  const TOOLS: [Tool, Icon][] = [['move', HandGrabbing], ['brush', PaintBrush], ['eraser', Eraser], ['fill', PaintBucket], ['sticker', Sticker], ['shape', Shapes], ['text', TextT]];
  const handle = 'absolute w-9 h-9 rounded-full border-[2.5px] border-border bg-accent flex items-center justify-center touch-none';

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-stretch justify-center p-2 sm:p-4" role="dialog" aria-modal="true" aria-label={t('studio.title', { piece: piece.label })}>
      <DialogFocus onClose={onClose} />
      <div className="bg-surface border-[2.5px] border-border rounded-panel w-full max-w-7xl grid grid-rows-[auto_minmax(0,1fr)] overflow-hidden" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
        <div className="flex flex-wrap items-center gap-2 p-3 border-b-[2px] border-border-soft">
          <h2 className="font-display text-xl sm:text-2xl flex-1 min-w-40">{t('studio.title', { piece: piece.label })}</h2>
          <Button disabled={!undo.length} onClick={stepBack} aria-label={t('studio.undo')}><ArrowCounterClockwise weight="bold" size={18} /><span className="hidden sm:inline">{t('studio.undo')}</span></Button>
          <Button disabled={!redo.length} onClick={stepForward} aria-label={t('studio.redo')}><ArrowClockwise weight="bold" size={18} /><span className="hidden sm:inline">{t('studio.redo')}</span></Button>
          <Button onClick={onClose}><X weight="bold" size={18} />{t('studio.cancel')}</Button>
          <Button variant="primary" disabled={saving} onClick={() => void save()}>{t('studio.use')}</Button>
        </div>

        <div className="grid grid-rows-[auto_minmax(0,1fr)_auto] lg:grid-rows-1 lg:grid-cols-[auto_minmax(0,1fr)_300px] min-h-0">
          {/* Tools */}
          <div role="radiogroup" aria-label={t('studio.tools')} className="flex lg:flex-col gap-1.5 p-2 border-b-[2px] lg:border-b-0 lg:border-r-[2px] border-border-soft overflow-x-auto lg:overflow-y-auto">
            {TOOLS.map(([id, I]) => (
              <button key={id} type="button" role="radio" aria-checked={tool === id} onClick={() => { setTool(id); if (id !== 'move') setSel(null); }}
                className={`shrink-0 w-[4.5rem] min-h-14 rounded-input border-[2px] grid justify-items-center content-center gap-0.5 font-bold text-xs ${tool === id ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                <I weight={tool === id ? 'fill' : 'bold'} size={24} aria-hidden="true" />{t(`studio.tool.${id}`)}
              </button>
            ))}
            <span className="shrink-0 w-12 h-12 lg:w-[4.5rem] lg:h-10 self-center rounded-input border-[2.5px] border-border" style={{ background: color }} aria-label={t('studio.colorNow', { color })} role="img" />
          </div>

          {/* Canvas, with the pieces on top */}
          <div ref={frame} className="min-h-0 p-3 flex items-center justify-center bg-[repeating-conic-gradient(#eef0f7_0_25%,#ffffff_0_50%)] [background-size:24px_24px]">
            <div className="relative" style={{ width: W * fit, height: H * fit }} onDragOver={(e) => e.preventDefault()} onDrop={dropIn}>
              <canvas ref={canvas} width={W} height={H} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
                aria-label={t('studio.canvas', { piece: piece.label })} className="w-full h-full border-[2.5px] border-border bg-transparent touch-none cursor-crosshair" style={{ borderRadius: round ? '50%' : 12 }} />
              <div className="absolute inset-0 overflow-hidden" style={{ pointerEvents: tool === 'move' ? 'auto' : 'none', borderRadius: round ? '50%' : 12 }} onPointerDown={() => setSel(null)} onPointerMove={drag} onPointerUp={drop} onPointerCancel={drop}>
                {objs.map((o) => (
                  <div key={o.id} role="button" tabIndex={-1} aria-label={t('studio.piece', { what: o.kind === 'text' ? o.text ?? '' : o.label })} aria-pressed={sel === o.id}
                    onPointerDown={(e) => grab(e, o, 'move')}
                    className={`absolute touch-none select-none ${tool === 'move' ? 'cursor-move' : ''}`}
                    style={{ left: o.x * fit, top: o.y * fit, transform: `translate(-50%, -50%) rotate(${o.rot}deg)`, ...(o.kind === 'text' ? {} : { width: o.size * fit, height: o.size * fit }) }}>
                    {o.kind === 'text'
                      ? <span className="block whitespace-nowrap leading-none" style={{ fontSize: o.size * fit, fontFamily: THEME_FONTS[o.font ?? 'Grow Year'], color: o.color }}>{o.text}</span>
                      : <img src={svgUrl(objSvg(o))} alt="" draggable={false} className="w-full h-full pointer-events-none" />}
                  </div>
                ))}
              </div>
              {/* Handles for the chosen piece, outside the clip so they stay reachable. */}
              {selected && tool === 'move' && (
                <div className="absolute pointer-events-none" style={{ left: selected.x * fit, top: selected.y * fit, transform: `translate(-50%, -50%) rotate(${selected.rot}deg)`, width: (selected.kind === 'text' ? selected.size * Math.max(2, (selected.text?.length ?? 1) * 0.6) : selected.size) * fit, height: selected.size * fit }}>
                  <div className="absolute -inset-1 border-[2.5px] border-dashed border-border rounded-md" />
                  <button type="button" aria-label={t('studio.resize')} className={`${handle} pointer-events-auto -right-5 -bottom-5 cursor-nwse-resize`} onPointerDown={(e) => grab(e, selected, 'size')} onPointerMove={drag} onPointerUp={drop}><ArrowsOutSimple weight="bold" size={16} /></button>
                  <button type="button" aria-label={t('studio.turn')} className={`${handle} pointer-events-auto left-1/2 -translate-x-1/2 -top-12 cursor-grab`} onPointerDown={(e) => grab(e, selected, 'turn')} onPointerMove={drag} onPointerUp={drop}><ArrowClockwise weight="bold" size={16} /></button>
                </div>
              )}
            </div>
          </div>

          {/* Options: collapsible and searchable */}
          <div className="min-h-0 max-h-[38dvh] lg:max-h-none overflow-y-auto p-2 border-t-[2px] lg:border-t-0 lg:border-l-[2px] border-border-soft grid gap-2 content-start">
            {selected && (
              <Section title={t('studio.selected', { what: selected.kind === 'text' ? t('studio.tool.text') : selected.label })} open>
                {selected.kind === 'text' && (
                  <>
                    <label className="grid gap-1 font-bold text-sm">{t('studio.words')}
                      <input value={selected.text ?? ''} maxLength={40} onChange={(e) => update(selected.id, { text: e.target.value })} className="min-h-11 px-3 rounded-input border-[2px] border-border font-bold" />
                    </label>
                    <label className="grid gap-1 font-bold text-sm">{t('builder.font')}
                      <select value={selected.font} onChange={(e) => update(selected.id, { font: e.target.value as FontName })} className="min-h-11 px-2 rounded-input border-[2px] border-border font-bold bg-surface">
                        {APPROVED_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </label>
                  </>
                )}
                <label className="grid gap-1 font-bold text-sm">{t('studio.pieceSize')}
                  <input type="range" min={12} max={Math.max(W, H)} value={selected.size} onChange={(e) => update(selected.id, { size: Number(e.target.value) })} />
                </label>
                <label className="grid gap-1 font-bold text-sm">{t('studio.turnBy', { deg: ((selected.rot % 360) + 360) % 360 })}
                  <input type="range" min={-180} max={180} value={((selected.rot + 180) % 360 + 360) % 360 - 180} onChange={(e) => update(selected.id, { rot: Number(e.target.value) })} />
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <Button onClick={() => layer(selected.id, 'front')}>{t('studio.front')}</Button>
                  <Button onClick={() => layer(selected.id, 'back')}>{t('studio.back')}</Button>
                  <Button onClick={() => copy(selected)}><CopySimple weight="bold" size={16} />{t('studio.copy')}</Button>
                  <Button variant="danger" onClick={() => remove(selected.id)}><Trash weight="bold" size={16} />{t('studio.delete')}</Button>
                </div>
              </Section>
            )}
            <Section title={t('studio.color')} open>
              <div className="grid grid-cols-8 gap-1.5 max-w-[22rem]">
                {SWATCHES.map((c) => (
                  <button key={c} type="button" onClick={() => pickColor(c)} aria-label={c} aria-pressed={color === c}
                    className={`aspect-square rounded-full border-[2px] ${color === c ? 'border-border ring-4 ring-accent' : 'border-border-soft'}`} style={{ background: c }} />
                ))}
              </div>
              <label className="flex items-center gap-2 font-bold text-sm">{t('studio.anyColor')}
                <input type="color" value={color} onChange={(e) => pickColor(e.target.value)} className="w-12 h-10 rounded-input border-[2px] border-border" />
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
              <div role="radiogroup" aria-label={t('studio.shelves')} className="flex flex-wrap gap-1">
                {['all', ...SHELVES.map(([k]) => k), 'things', 'powers'].map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={shelf === k} onClick={() => setShelf(k)}
                    className={`min-h-9 px-2.5 rounded-pill border-[2px] font-bold text-xs ${shelf === k ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>{t(`studio.shelf.${k}` as StringKey)}</button>
                ))}
              </div>
              <div className="grid grid-cols-6 gap-1">
                {classicFound.map((a) => (
                  <button key={a} type="button" draggable aria-label={a.replace(/-/g, ' ')} aria-pressed={sticker?.label === a} onClick={(e) => pickSticker(e, a, false)} onDragStart={(e) => dragOut(e, a, false)}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${sticker?.label === a ? 'border-border bg-accent' : 'border-transparent'}`}><ClassicItemSvg art={a} size={32} /></button>
                ))}
                {found.map(([name, I]) => (
                  <button key={name} type="button" draggable aria-label={name} aria-pressed={sticker?.label === name} onClick={(e) => pickSticker(e, name, true)} onDragStart={(e) => dragOut(e, name, true)}
                    className={`aspect-square rounded-input border-[2px] flex items-center justify-center ${sticker?.label === name ? 'border-border bg-accent' : 'border-transparent'}`}><I weight="fill" size={28} /></button>
                ))}
              </div>
              {found.length + classicFound.length === 0 && <p className="text-sm font-bold text-muted">{t('studio.noStickers')}</p>}
              <p className="text-xs font-semibold text-muted">{t('studio.stickerHint')}</p>
            </Section>
            <Section title={t('studio.shapes')} open={tool === 'shape'}>
              <div role="radiogroup" aria-label={t('studio.shapes')} className="grid grid-cols-5 gap-1.5">
                {(Object.keys(SHAPE_SVG) as ShapeKind[]).map((k) => (
                  <button key={k} type="button" role="radio" aria-checked={shape === k && tool === 'shape'} aria-label={t(`studio.shape.${k}`)} onClick={() => { setShape(k); setTool('shape'); }}
                    className={`min-h-12 rounded-input border-[2px] flex items-center justify-center ${shape === k && tool === 'shape' ? 'bg-accent border-border' : 'bg-surface border-border-soft'}`}>
                    <img src={svgUrl(svgDoc(SHAPE_SVG[k](color)))} alt="" className="w-7 h-7" />
                  </button>
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
      {/* The Classic look of this piece, drawn off screen for "Start over". */}
      <svg ref={classicRef} xmlns="http://www.w3.org/2000/svg" width={piece.width} height={piece.height} viewBox={`0 0 ${piece.width} ${piece.height}`} className="absolute -left-[99999px] w-0 h-0" aria-hidden="true">
        <ClassicPiece piece={piece} gameId={gameId} />
      </svg>
    </div>
  );
}

function Section({ title, open = false, children }: { title: string; open?: boolean; children: ReactNode }) {
  // Opens itself when its tool is picked; only the person closes it.
  const [isOpen, setOpen] = useState(open);
  useEffect(() => { if (open) setOpen(true); }, [open]);
  return (
    <details open={isOpen} onToggle={(e) => setOpen(e.currentTarget.open)} className="rounded-input border-[2px] border-border-soft bg-surface group">
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
