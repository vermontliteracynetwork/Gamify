import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Clock, GraduationCap } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { POSTS } from './posts';
import PublicFooter from './PublicFooter';

// Grade bands for the filter; a post shows when its grades overlap the band.
const BANDS = [{ id: 'all', lo: 0, hi: 12 }, { id: 'k2', lo: 0, hi: 2 }, { id: '35', lo: 3, hi: 5 }, { id: '68', lo: 6, hi: 8 }, { id: '912', lo: 9, hi: 12 }] as const;
export function gradeRange(grades: string): [number, number] {
  const [a, b = a] = grades.split('-').map((g) => (g.trim().toUpperCase() === 'K' ? 0 : Number(g)));
  return [a, b];
}

// The public "Ways to use Gamify" pages: a list of posts and each post.
export function WaysList() {
  const [params, setParams] = useSearchParams();
  const band = BANDS.find((b) => b.id === params.get('grades')) ?? BANDS[0];
  const tag = params.get('tag');
  const posts = POSTS.filter((p) => { const [lo, hi] = gradeRange(p.grades); return lo <= band.hi && hi >= band.lo && (!tag || p.tags?.includes(tag)); });
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <div>
          <h1 className="title-bubble text-5xl"><Title text={t('ways.title')} /></h1>
          <p className="text-lg font-bold mt-1">{t('ways.sub')}</p>
        </div>
        <div role="group" aria-label={t('ways.filter')} className="flex flex-wrap gap-2">
          {BANDS.map((b) => (
            <button key={b.id} type="button" aria-pressed={band.id === b.id} onClick={() => setParams(b.id === 'all' ? {} : { grades: b.id }, { replace: true })}
              className={`hover-pop min-h-11 px-4 rounded-pill border-[2px] border-border font-bold text-sm ${band.id === b.id && !tag ? 'bg-accent' : 'bg-surface'}`}>{t(`ways.band.${b.id}` as StringKey)}</button>
          ))}
          <button type="button" aria-pressed={tag === 'homeschool'} onClick={() => setParams(tag === 'homeschool' ? {} : { tag: 'homeschool' }, { replace: true })}
            className={`hover-pop min-h-11 px-4 rounded-pill border-[2px] border-border font-bold text-sm ${tag === 'homeschool' ? 'bg-accent' : 'bg-surface'}`}>{t('ways.tag.homeschool')}</button>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map((p) => (
            <Link key={p.slug} to={`/blog/${p.slug}`} className="hover-lift rounded-panel bg-surface border-[2.5px] border-border no-underline text-text overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
              <span className="block overflow-hidden border-b-[2.5px] border-border"><GameCover gameId={p.cover} className="aspect-[16/9] cover-zoom" /></span>
              <span className="p-4 grid gap-2">
                <span className="font-display text-2xl leading-tight">{p.title}</span>
                <span className="font-semibold text-sm">{p.summary}</span>
                <Meta grades={p.grades} minutes={p.minutes} />
              </span>
            </Link>
          ))}
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

function Meta({ grades, minutes }: { grades: string; minutes: number }) {
  return (
    <span className="flex flex-wrap gap-3 text-xs font-bold text-muted">
      <span className="inline-flex items-center gap-1"><GraduationCap weight="bold" size={16} aria-hidden="true" />{t('ways.grades', { grades })}</span>
      <span className="inline-flex items-center gap-1"><Clock weight="bold" size={16} aria-hidden="true" />{t('ways.minutes', { minutes })}</span>
    </span>
  );
}

export function WaysPost() {
  const { slug } = useParams();
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return <main className="max-w-3xl mx-auto p-6"><Link to="/blog" className={buttonClasses('secondary')}>{t('ways.all')}</Link></main>;
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 grid gap-5">
        <Link to="/blog" className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t('ways.all')}</Link>
        <GameCover gameId={post.cover} className="aspect-[21/9] rounded-panel border-[2.5px] border-border" />
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={post.title} /></h1>
        <Meta grades={post.grades} minutes={post.minutes} />
        <p className="text-xl font-bold">{post.summary}</p>
        {post.body.map((para, i) => <p key={i} className="text-lg leading-relaxed">{para}</p>)}
        <section className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl"><Title text={t('ways.tryIt')} /></h2>
          <p className="font-bold">{t('ways.tryItSub')}</p>
          <ol className="grid gap-2 pl-7 m-0 font-semibold text-lg list-decimal marker:font-bold">{post.tryIt.map((s, i) => <li key={i}>{s}</li>)}</ol>
          <Link to="/login?mode=signup" className={buttonClasses('secondary', 'justify-self-start min-h-14 px-8 text-lg hover-pop')}>{t('ways.start')}<ArrowRight weight="bold" size={20} /></Link>
        </section>
      </main>
      <PublicFooter />
    </>
  );
}
