import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowRight, Crown, Heart, MagnifyingGlass, Sparkle, Trophy } from '@phosphor-icons/react';
import { tagLabel } from '../theme/tags';
import { fieldClasses } from '../ui/kit';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import { creditLine } from '../theme/credit';
import type { StringKey } from '../i18n/en';
import ThemePreview from '../theme/builder/ThemePreview';
import { useFavoriteThemes, useMadeThemes } from '../theme/made';
import { buttonClasses } from '../ui/kit';
import PillSelect from '../ui/PillSelect';
import { SbHead, SbMain, SbMore, sbCard, sbPill, Words } from './scrapbookA';
import PublicFooter from './PublicFooter';
import { BANDS, STARTER_THEMES, type Band, type StarterTheme } from '../theme/starters';
import { useScrapbookGround } from './scrapbook/Shell';

type Sort = 'trending' | 'popular' | 'newest' | 'name';

// The public Themes page (teacher, 2026-10-25): every shared theme, sortable
// and filterable, with favorites. Until launch it shows sample themes (always
// labeled) plus the Gamify library; the Theme Building Challenge winner gets
// the featured spot at the top. Scrapbook strength A (owner 2026-11-26:
// "themes=a"): white cards with the ink outline, each theme's own preview
// as the card's picture band, a Butter featured card with a Grow Year title.
export default function ThemesPage() {
  useScrapbookGround(); // owner 2026-11-26: this page is scrapbook A
  return (
    <>
      <SbMain className="!gap-6">
        <SbHead title={t('themes.title')}>
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/teacher/themes" className="text-text pointer-coarse:min-h-11 inline-flex items-center"><SbMore>{t('themes.linkBuilder')}</SbMore></Link>
            <Link to="/blog/themes/game-show" className="text-text pointer-coarse:min-h-11 inline-flex items-center"><SbMore>{t('themes.linkGuides')}</SbMore></Link>
          </p>
        </SbHead>

        {/* The challenge as a spotlight (owner, 2026-11-27: "make the display for the
            challenge larger and more visually nice to look and intreguing to click on"):
            an empty gold frame waiting for a class's theme, a big trophy and the prize. */}
        <ChallengeSpot />

        <ThemeGallery />
      </SbMain>
      <PublicFooter />
    </>
  );
}

// The shared theme gallery: filters, search, favorites and the cards. Also on
// the teacher Themes page's Public themes tab (owner, 2026-11-26: "give me the
// ability in the theme tab to view public themes").
export function ThemeGallery({ signedIn = false }: { signedIn?: boolean }) {
  const reduce = useReducedMotion();
  const { themes: made } = useMadeThemes();
  const { favorites, toggle } = useFavoriteThemes();
  const [sort, setSort] = useState<Sort>('trending');
  const [game, setGame] = useState('');
  const [band, setBand] = useState<Band | ''>('');
  const [onlyFavs, setOnlyFavs] = useState(false);
  // Search by name or tag (owner, 2026-11-26: tags "so that people can search for them").
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const matches = (x: StarterTheme) => !q || x.name.toLowerCase().includes(q) || (x.theme.tags ?? []).some((id) => id.includes(q.replace(/\s+/g, '-')) || tagLabel(id).toLowerCase().includes(q));
  // Gamify library themes, and class themes approved for the public gallery
  // (on this device until cloud accounts share them with every teacher).
  const shared = made.filter((th) => th.source === 'library' || th.gallery?.status === 'approved');
  const library: StarterTheme[] = shared.map((th, i) => ({ id: th.id, name: th.name, gameId: th.gameId, band: 'all', interest: '', order: -100 + i, theme: th }));
  const all = [...library, ...STARTER_THEMES];
  const shown = all
    .filter((x) => (!game || x.gameId === game) && (!band || x.band === band || x.band === 'all') && (!onlyFavs || favorites.includes(x.theme.id)) && matches(x))
    // Plays, hearts and dates come with cloud accounts; until then the
    // samples keep their showcase order under every sort but Name.
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.order - a.order : a.order - b.order));
  const gameName = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;

  return (
    <div className="grid gap-6">
        <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label={t('themes.filters')}>
          <label className="relative">
            <span className="sr-only">{t('themes.search')}</span>
            <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('themes.search')} className={fieldClasses('md', 'pl-9 rounded-pill w-60 !text-sm')} />
          </label>
          <PillSelect label={t('themes.game')} value={game} onChange={setGame} active={!!game}>
            <option value="">{t('themes.allGames')}</option>
            {[...new Set(all.map((x) => x.gameId))].map((id) => <option key={id} value={id}>{gameName(id)}</option>)}
          </PillSelect>
          <PillSelect label={t('themes.band')} value={band} onChange={(v) => setBand(v as Band | '')} active={!!band}>
            <option value="">{t('themes.allBands')}</option>
            {BANDS.filter((b) => b !== 'all').map((b) => <option key={b} value={b}>{t(`features.band.${b}` as StringKey)}</option>)}
          </PillSelect>
          <PillSelect label={t('themes.sort')} value={sort} onChange={(v) => setSort(v as Sort)}>
            {(['trending', 'popular', 'newest', 'name'] as Sort[]).map((x) => <option key={x} value={x}>{t(`themes.sort.${x}` as StringKey)}</option>)}
          </PillSelect>
          <button type="button" aria-pressed={onlyFavs} onClick={() => setOnlyFavs(!onlyFavs)} className={sbPill(onlyFavs)}>
            <Heart weight={onlyFavs ? 'fill' : 'bold'} size={18} aria-hidden="true" />{t('themes.favorites', { count: favorites.length })}
          </button>
        </div>

        {shown.length === 0 && <p className="font-bold">{onlyFavs ? t('themes.noFavorites') : t('themes.none')}</p>}
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[1.375rem] list-none p-0 m-0">
          {shown.map((x, i) => {
            const fav = favorites.includes(x.theme.id);
            return (
              <motion.li key={x.theme.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                className={`${sbCard} hover-lift overflow-hidden grid gap-2 content-start pb-4`}>
                {/* The theme's own preview is the card's picture band, edge to
                    edge (Scrapbook A); the heart sits in its top-right corner,
                    in the spot the preview keeps free for it. */}
                <div className="relative border-b-[3px] border-border [&>div:first-child]:rounded-none [&>div:first-child]:border-0">
                  <ThemePreview bare theme={x.theme} gameName={gameName(x.gameId)} corner={<span className="w-11 h-11 shrink-0" aria-hidden="true" />} />
                  <button type="button" aria-pressed={fav} aria-label={t(fav ? 'themes.unfavorite' : 'themes.favorite', { name: x.name })} onClick={() => toggle(x.theme.id)}
                    className={`absolute top-3 right-3 w-11 h-11 rounded-full border-std border-border flex items-center justify-center hover-pop ${fav ? 'bg-blush' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                    <Heart weight={fav ? 'fill' : 'bold'} size={22} color={fav ? '#d6336c' : undefined} />
                  </button>
                </div>
                <div className="grid gap-0.5 px-5 pt-2">
                  <h2 className="m-0 font-heading font-bold text-xl sm:text-[1.4375rem] leading-tight">{x.name}</h2>
                  <p className="m-0 text-base font-semibold">{gameName(x.gameId)}</p>
                </div>
                {(x.theme.tags ?? []).length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 px-5" aria-label={t('themes.tags')}>
                    {(x.theme.tags ?? []).slice(0, 6).map((id) => (
                      <li key={id}><button type="button" onClick={() => setQuery(tagLabel(id))} className="min-h-8 px-2.5 rounded-pill border-std border-border-soft bg-surface-2 text-xs font-bold hover-pop max-sm:min-h-11">{tagLabel(id)}</button></li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2 px-5">
                  {/* The maker's name only when it is not Gamify (owner, 2026-11-27). */}
                  <span className="text-sm font-bold text-muted">{x.theme.source === 'custom' && creditLine(x.theme) ? t('themes.madeBy', { name: creditLine(x.theme) }) : ''}</span>
                  <span className="flex-1" />
                  <Link to={signedIn ? `/teacher/activity?game=${x.gameId}` : '/login?mode=signup'} className="text-sm font-bold inline-flex items-center gap-1 max-sm:min-h-11 max-sm:text-base">{t('themes.use')}<ArrowRight weight="bold" size={14} /></Link>
                </div>
              </motion.li>
            );
          })}
        </ul>
        <p className="text-sm font-bold text-muted">{t('themes.note')}</p>
    </div>
  );
}

function ChallengeSpot() {
  const reduce = useReducedMotion();
  // The frame shows real looks taking turns, so it reads as "a theme like this, by your class".
  // Sample makers for now (owner, 2026-11-27: "put a few test names in for
  // now"); swap for real challenge winners as they come. Every fourth slide is
  // a question mark: "What will you design?"
  const looks = [...STARTER_THEMES].sort((a, b) => a.order - b.order).slice(0, 6);
  const makers = ['Ms. Rivera\'s Class', 'Suzie Smith', 'Room 12 Artists', 'Mr. Okafor\'s 3rd Grade', 'The Kindness Club', 'Ms. Lee\'s Kindergarten'];
  const slides = looks.flatMap((l, i) => [{ look: l, maker: makers[i % makers.length] }, ...((i + 1) % 3 === 0 ? [{ look: null, maker: '' }] : [])]);
  const [at, setAt] = useState(0);
  useEffect(() => {
    if (reduce || slides.length < 2) return;
    const id = window.setInterval(() => setAt((x) => (x + 1) % slides.length), 3000);
    return () => window.clearInterval(id);
  }, [reduce, slides.length]);
  const slide = slides[at];
  const x = slide.look;
  const bits: [number, number, string, number, 'star' | 'dot' | 'tri'][] = [[4, 10, 'var(--color-pink)', -10, 'tri'], [46, 6, 'var(--color-sky)', 0, 'star'], [6, 82, 'var(--color-kelly)', 0, 'dot'], [44, 88, 'var(--color-grape)', 20, 'tri'], [96, 8, 'var(--color-pink)', 0, 'star'], [94, 86, 'var(--color-sky)', 0, 'dot'], [30, 92, 'var(--color-orange)', 0, 'star']];
  return (
    <Link to="/challenge" className="group relative block rounded-[1.9rem] border-[3.5px] border-border bg-lemon overflow-hidden no-underline text-text hover-lift" style={{ boxShadow: '0 8px 0 var(--ink)' }}>
      {/* Sun rays behind everything, slowly turning. */}
      <motion.span aria-hidden="true" className="absolute -inset-[40%] opacity-60 pointer-events-none"
        style={{ background: 'repeating-conic-gradient(from 0deg, #ffe48a 0deg 10deg, transparent 10deg 20deg)' }}
        animate={reduce ? undefined : { rotate: 360 }} transition={{ duration: 60, repeat: Infinity, ease: 'linear' }} />
      {bits.map(([l, tp, c, r, k], i) => (
        <motion.span key={i} aria-hidden="true" className="absolute" style={{ left: `${l}%`, top: `${tp}%`, rotate: r, color: c }}
          animate={reduce ? undefined : { y: [0, -6, 0] }} transition={{ duration: 2 + i * 0.3, repeat: Infinity, ease: 'easeInOut' }}>
          {k === 'star' ? <Sparkle weight="fill" size={30} /> : k === 'dot' ? <span className="block w-5 h-5 rounded-full border-[2.5px] border-border" style={{ background: c }} /> : <svg width="28" height="26" viewBox="0 0 28 26"><path d="M14 2 L26 24 H2 Z" fill={c} stroke="var(--ink)" strokeWidth="2.5" strokeLinejoin="round" /></svg>}
        </motion.span>
      ))}
      <div className="relative grid gap-8 p-6 sm:p-10 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] items-center">
        <div className="grid gap-4 justify-items-start">
          <span className="rounded-pill bg-pink text-white border-std border-border px-4 min-h-10 inline-flex items-center gap-2 font-bold" style={{ boxShadow: '0 3px 0 var(--ink)' }}><Trophy weight="fill" size={20} aria-hidden="true" />{t('themes.challengeKicker')}</span>
          <span className="title-bubble text-[2.3rem] sm:text-[3.2rem] leading-[0.95]"><Words text={t('themes.featuredTitle')} /></span>
          <span className="rounded-pill bg-grape text-white border-std border-border px-4 min-h-11 inline-flex items-center gap-2 font-bold text-lg" style={{ boxShadow: '0 3px 0 var(--ink)' }}><Crown weight="fill" size={20} aria-hidden="true" />{t('themes.challengePrize')}</span>
          <span className={buttonClasses('main', 'group-hover:scale-105 motion-safe:transition-transform', 'lg')}>{t('themes.challengeLink')}<ArrowRight weight="bold" size={20} /></span>
        </div>
        {/* A gold award frame, tilted, with real looks taking turns inside, a ribbon and a medal. */}
        <div className="relative justify-self-center w-full max-w-[34rem] rotate-[2.5deg] group-hover:rotate-0 motion-safe:transition-transform" aria-hidden="true">
          <div className="rounded-[1.4rem] border-[3.5px] border-border p-3 sm:p-4" style={{ background: 'linear-gradient(135deg,#ffd76a,#fabe37 45%,#ff9b28)', boxShadow: '0 8px 0 var(--ink)' }}>
            <div className="rounded-[0.9rem] border-[3px] border-border bg-paper overflow-hidden p-2">
              <AnimatePresence mode="wait" initial={false}>
                {x ? <motion.div key={`${x.id}-${at}`} initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.35 }}>
                  <ThemePreview bare theme={x.theme} gameName={GAMES.find((g) => g.id === x.gameId)?.name ?? ''} />
                </motion.div> : (
                  <motion.div key={`ask-${at}`} className="aspect-[16/10] grid place-items-center rounded-[0.6rem]" style={{ background: 'radial-gradient(circle at 50% 45%, #fff6cf, #ffd3e6 60%, #ddd6ff)' }}
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
                    <motion.span className="font-display text-[7rem] sm:text-[9rem] leading-none text-[#6a45f0]" style={{ WebkitTextStroke: '3px #1d1a33' }}
                      animate={reduce ? undefined : { rotate: [-10, 10, -10], y: [0, -10, 0], scale: [1, 1.08, 1] }} transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}>?</motion.span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-[0.6rem] bg-pink text-white border-std border-border px-4 py-1.5 font-display text-xl whitespace-nowrap -rotate-2" style={{ boxShadow: '0 3px 0 var(--ink)' }}>{slide.look ? slide.maker : t('themes.challengeAsk')}</span>
          <motion.span className="absolute -bottom-6 -right-4 sm:-right-6 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-sky border-[3.5px] border-border grid place-items-center text-white" style={{ boxShadow: '0 6px 0 var(--ink)' }}
            animate={reduce ? undefined : { rotate: [-8, 8, -8] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}>
            <span className="absolute inset-2 rounded-full border-[3px] border-dashed border-white/70" />
            <Trophy weight="fill" size={46} />
          </motion.span>
        </div>
      </div>
    </Link>
  );
}
