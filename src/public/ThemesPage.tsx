import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useReducedMotion } from '../ui/useReducedMotion';
import { ArrowRight, Heart, MagnifyingGlass, Trophy } from '@phosphor-icons/react';
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
import { SbDot, SbHead, SbMain, SbMore, sbCard, sbCardLink, sbPill, Words } from './scrapbookA';
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
        <SbHead title={t('themes.title')} sub={t('themes.sub')}>
          <p className="m-0 flex flex-wrap gap-x-5 gap-y-2">
            <Link to="/teacher/themes" className="text-text pointer-coarse:min-h-11 inline-flex items-center"><SbMore>{t('themes.linkBuilder')}</SbMore></Link>
            <Link to="/blog/themes/game-show" className="text-text pointer-coarse:min-h-11 inline-flex items-center"><SbMore>{t('themes.linkGuides')}</SbMore></Link>
          </p>
        </SbHead>

        <Link to="/challenge" className={`${sbCardLink} !bg-butter grid sm:grid-cols-[auto_1fr_auto] gap-4 sm:gap-5 items-center p-5 sm:p-6`}>
          <SbDot bg="bg-lemon" size="lg"><Trophy weight="bold" size={30} /></SbDot>
          <span className="grid gap-1">
            <span className="title-bubble text-[1.5rem] sm:text-[1.75rem] leading-none"><Words text={t('themes.featuredTitle')} /></span>
            <span className="font-semibold text-base sm:text-lg">{t('themes.featuredText')}</span>
          </span>
          <span className={buttonClasses('secondary', 'justify-self-start', 'lg')}>{t('themes.challengeLink')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

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
            <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('themes.search')} className={fieldClasses('md', 'pl-9 rounded-pill w-60')} />
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
                  <p className="m-0 text-base font-semibold">{gameName(x.gameId)} · {t(`features.band.${x.band}` as StringKey)}{x.interest ? ` · ${x.interest}` : ''}</p>
                </div>
                {(x.theme.tags ?? []).length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 px-5" aria-label={t('themes.tags')}>
                    {(x.theme.tags ?? []).slice(0, 6).map((id) => (
                      <li key={id}><button type="button" onClick={() => setQuery(tagLabel(id))} className="min-h-8 px-2.5 rounded-pill border-std border-border-soft bg-surface-2 text-xs font-bold hover-pop max-sm:min-h-11">{tagLabel(id)}</button></li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2 px-5">
                  <span className="text-sm font-bold text-muted">{x.theme.id.startsWith('starter:') ? t('themes.starter') : x.theme.source === 'custom' ? t('themes.madeBy', { name: creditLine(x.theme) }) : t('themes.byGamify')}</span>
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
