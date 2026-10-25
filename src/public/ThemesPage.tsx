import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowRight, Heart, PaintBrush, Trophy } from '@phosphor-icons/react';
import { GAMES } from '../games/registry';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import ThemePreview from '../theme/builder/ThemePreview';
import { useFavoriteThemes, useMadeThemes } from '../theme/made';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { BANDS, STARTER_THEMES, type Band, type StarterTheme } from '../theme/starters';

type Sort = 'trending' | 'popular' | 'newest' | 'name';

// The public Themes page (teacher, 2026-10-25): every shared theme, sortable
// and filterable, with favorites. Until launch it shows sample themes (always
// labeled) plus the Gamify library; the Theme Building Challenge winner gets
// the featured spot at the top.
export default function ThemesPage() {
  const reduce = useReducedMotion();
  const { themes: made } = useMadeThemes();
  const { favorites, toggle } = useFavoriteThemes();
  const [sort, setSort] = useState<Sort>('trending');
  const [game, setGame] = useState('');
  const [band, setBand] = useState<Band | ''>('');
  const [onlyFavs, setOnlyFavs] = useState(false);
  // Gamify library themes, and class themes approved for the public gallery
  // (on this device until cloud accounts share them with every teacher).
  const shared = made.filter((th) => th.source === 'library' || th.gallery?.status === 'approved');
  const library: StarterTheme[] = shared.map((th, i) => ({ id: th.id, name: th.name, gameId: th.gameId, band: 'all', interest: '', order: -100 + i, theme: th }));
  const all = [...library, ...STARTER_THEMES];
  const shown = all
    .filter((x) => (!game || x.gameId === game) && (!band || x.band === band || x.band === 'all') && (!onlyFavs || favorites.includes(x.theme.id)))
    // Plays, hearts and dates come with cloud accounts; until then the
    // samples keep their showcase order under every sort but Name.
    .sort((a, b) => (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'newest' ? b.order - a.order : a.order - b.order));
  const gameName = (id: string) => GAMES.find((g) => g.id === id)?.name ?? id;
  const field = 'min-h-11 px-3 rounded-input border-[2px] border-border bg-surface font-bold';

  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <div className="grid gap-3">
          <h1 className="title-bubble text-5xl sm:text-6xl flex items-center gap-3"><PaintBrush weight="fill" size={48} aria-hidden="true" className="wiggle-on-hover" /><Title text={t('themes.title')} /></h1>
          <p className="text-xl font-bold max-w-3xl">{t('themes.sub')}</p>
        </div>

        <Link to="/challenge" className="hover-lift grid sm:grid-cols-[auto_1fr_auto] gap-4 items-center bg-accent border-[2.5px] border-border rounded-panel p-5 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <span className="w-16 h-16 rounded-full bg-surface border-[2.5px] border-border flex items-center justify-center wiggle-on-hover"><Trophy weight="fill" size={34} color="#c98a00" aria-hidden="true" /></span>
          <span className="grid gap-1">
            <span className="text-xs font-bold uppercase tracking-wider">{t('themes.featured')}</span>
            <span className="font-display text-2xl">{t('themes.featuredTitle')}</span>
            <span className="font-semibold">{t('themes.featuredText')}</span>
          </span>
          <span className={buttonClasses('primary', '!bg-text !text-white')}>{t('themes.challengeLink')}<ArrowRight weight="bold" size={18} /></span>
        </Link>

        <div className="grid gap-3 sm:grid-cols-[repeat(3,minmax(0,1fr))_auto] items-end">
          <label className="grid gap-1 font-bold text-sm">{t('themes.sort')}
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className={field}>
              {(['trending', 'popular', 'newest', 'name'] as Sort[]).map((s) => <option key={s} value={s}>{t(`themes.sort.${s}` as StringKey)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-bold text-sm">{t('themes.game')}
            <select value={game} onChange={(e) => setGame(e.target.value)} className={field}>
              <option value="">{t('themes.allGames')}</option>
              {[...new Set(all.map((x) => x.gameId))].map((id) => <option key={id} value={id}>{gameName(id)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-bold text-sm">{t('themes.band')}
            <select value={band} onChange={(e) => setBand(e.target.value as Band | '')} className={field}>
              <option value="">{t('themes.allBands')}</option>
              {BANDS.filter((b) => b !== 'all').map((b) => <option key={b} value={b}>{t(`features.band.${b}` as StringKey)}</option>)}
            </select>
          </label>
          <button type="button" aria-pressed={onlyFavs} onClick={() => setOnlyFavs(!onlyFavs)} className={`${field} inline-flex items-center gap-2 ${onlyFavs ? '!bg-accent' : ''}`}>
            <Heart weight={onlyFavs ? 'fill' : 'bold'} size={18} aria-hidden="true" />{t('themes.favorites', { count: favorites.length })}
          </button>
        </div>

        {shown.length === 0 && <p className="font-bold">{onlyFavs ? t('themes.noFavorites') : t('themes.none')}</p>}
        <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 list-none p-0 m-0">
          {shown.map((x, i) => {
            const fav = favorites.includes(x.theme.id);
            return (
              <motion.li key={x.theme.id} layout={!reduce} initial={reduce ? false : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: reduce ? 0 : Math.min(i, 8) * 0.04 }}
                className="hover-lift bg-surface border-[2.5px] border-border rounded-panel p-3 grid gap-2 content-start" style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <ThemePreview theme={x.theme} gameName={gameName(x.gameId)} />
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-display text-2xl leading-tight">{x.name}</h2>
                    <p className="text-sm font-semibold text-muted">{gameName(x.gameId)} · {t(`features.band.${x.band}` as StringKey)}{x.interest ? ` · ${x.interest}` : ''}</p>
                  </div>
                  <button type="button" aria-pressed={fav} aria-label={t(fav ? 'themes.unfavorite' : 'themes.favorite', { name: x.name })} onClick={() => toggle(x.theme.id)}
                    className={`w-11 h-11 shrink-0 rounded-full border-[2px] border-border flex items-center justify-center hover-pop ${fav ? 'bg-[#ffd9e3]' : 'bg-surface'}`}>
                    <Heart weight={fav ? 'fill' : 'bold'} size={22} color={fav ? '#d6336c' : undefined} />
                  </button>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-pill border-[2px] border-border-soft">{x.theme.id.startsWith('starter:') ? t('themes.starter') : x.theme.source === 'custom' ? t('themes.madeBy', { name: x.theme.designedBy ?? '' }) : t('themes.byGamify')}</span>
                  <span className="flex-1" />
                  <Link to="/login?mode=signup" className="text-sm font-bold inline-flex items-center gap-1">{t('themes.use')}<ArrowRight weight="bold" size={14} /></Link>
                </div>
              </motion.li>
            );
          })}
        </ul>
        <p className="text-sm font-bold text-muted">{t('themes.note')}</p>
      </main>
      <PublicFooter />
    </>
  );
}
