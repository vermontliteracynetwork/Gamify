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
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { BANDS, STARTER_THEMES, type Band, type StarterTheme } from '../theme/starters';

type Sort = 'trending' | 'popular' | 'newest' | 'name';

// The public Themes page (teacher, 2026-10-25): every shared theme, sortable
// and filterable, with favorites. Until launch it shows sample themes (always
// labeled) plus the Gamify library; the Theme Building Challenge winner gets
// the featured spot at the top.
export default function ThemesPage() {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <div className="grid gap-3">
          <h1 className="title-bubble"><Title text={t('themes.title')} /></h1>
          <p className="text-lg font-semibold max-w-3xl">{t('themes.sub')}</p>
          <p className="flex flex-wrap gap-x-5 gap-y-2 font-bold">
            <Link to="/teacher/themes" className="inline-flex items-center gap-1.5 text-text underline underline-offset-4">{t('themes.linkBuilder')}<ArrowRight weight="bold" size={16} /></Link>
            <Link to="/blog/themes/game-show" className="inline-flex items-center gap-1.5 text-text underline underline-offset-4">{t('themes.linkGuides')}<ArrowRight weight="bold" size={16} /></Link>
          </p>
        </div>

        <Link to="/challenge" className="hover-lift grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center bg-butter border-bold border-border rounded-panel p-5 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <span className="w-16 h-16 rounded-full bg-surface border-bold border-border flex items-center justify-center wiggle-on-hover"><Trophy weight="fill" size={34} color="var(--lemon)" aria-hidden="true" /></span>
          <span className="grid gap-1">
            <span className="font-display text-2xl">{t('themes.featuredTitle')}</span>
            <span className="font-semibold">{t('themes.featuredText')}</span>
          </span>
          <span className={buttonClasses()}>{t('themes.challengeLink')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

        <ThemeGallery />
      </main>
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
          <button type="button" aria-pressed={onlyFavs} onClick={() => setOnlyFavs(!onlyFavs)} className={`hover-pop min-h-11 px-4 rounded-pill border-std border-border font-bold text-sm inline-flex items-center gap-2 ${onlyFavs ? 'bg-butter' : 'bg-surface'}`}>
            <Heart weight={onlyFavs ? 'fill' : 'bold'} size={18} aria-hidden="true" />{t('themes.favorites', { count: favorites.length })}
          </button>
        </div>

        {shown.length === 0 && <p className="font-bold">{onlyFavs ? t('themes.noFavorites') : t('themes.none')}</p>}
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
          {shown.map((x, i) => {
            const fav = favorites.includes(x.theme.id);
            return (
              <motion.li key={x.theme.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                className="hover-lift bg-surface border-bold border-border rounded-panel p-3 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                {/* The heart sits in the art's top-right corner (the /brand Themes
                    mockup), in the spot the preview keeps free for it. */}
                <div className="relative">
                  <ThemePreview theme={x.theme} gameName={gameName(x.gameId)} corner={<span className="w-11 h-11 shrink-0" aria-hidden="true" />} />
                  <button type="button" aria-pressed={fav} aria-label={t(fav ? 'themes.unfavorite' : 'themes.favorite', { name: x.name })} onClick={() => toggle(x.theme.id)}
                    className={`absolute top-3 right-3 w-11 h-11 rounded-full border-std border-border flex items-center justify-center hover-pop ${fav ? 'bg-blush' : 'bg-surface'}`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                    <Heart weight={fav ? 'fill' : 'bold'} size={22} color={fav ? '#d6336c' : undefined} />
                  </button>
                </div>
                <div className="grid gap-0.5 px-1">
                  <h2 className="font-heading font-bold text-xl leading-tight">{x.name}</h2>
                  <p className="text-sm font-semibold text-muted">{gameName(x.gameId)} · {t(`features.band.${x.band}` as StringKey)}{x.interest ? ` · ${x.interest}` : ''}</p>
                </div>
                {(x.theme.tags ?? []).length > 0 && (
                  <ul className="flex flex-wrap gap-1.5 list-none p-0 m-0 px-1" aria-label={t('themes.tags')}>
                    {(x.theme.tags ?? []).slice(0, 6).map((id) => (
                      <li key={id}><button type="button" onClick={() => setQuery(tagLabel(id))} className="min-h-8 px-2.5 rounded-pill border-std border-border-soft bg-surface-2 text-xs font-bold hover-pop max-sm:min-h-11">{tagLabel(id)}</button></li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-pill border-std border-border-soft">{x.theme.id.startsWith('starter:') ? t('themes.starter') : x.theme.source === 'custom' ? t('themes.madeBy', { name: creditLine(x.theme) }) : t('themes.byGamify')}</span>
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
