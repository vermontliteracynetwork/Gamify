import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, GraduationCap } from '@phosphor-icons/react';
import { GameCover } from '../games/covers';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { POSTS } from './posts';
import PublicFooter from './PublicFooter';

// The public "Ways to use Gamify" pages: a list of posts and each post.
export function WaysList() {
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 grid gap-6">
        <div>
          <h1 className="title-bubble text-5xl"><Title text={t('ways.title')} /></h1>
          <p className="text-lg font-bold mt-1">{t('ways.sub')}</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {POSTS.map((p) => (
            <Link key={p.slug} to={`/ways/${p.slug}`} className="hover-lift rounded-panel bg-surface border-[2.5px] border-border no-underline text-text overflow-hidden flex flex-col" style={{ boxShadow: 'var(--shadow-sticker)' }}>
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
  if (!post) return <main className="max-w-3xl mx-auto p-6"><Link to="/ways" className={buttonClasses('secondary')}>{t('ways.all')}</Link></main>;
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 grid gap-5">
        <Link to="/ways" className={buttonClasses('secondary', 'justify-self-start')}><ArrowLeft weight="bold" size={18} />{t('ways.all')}</Link>
        <GameCover gameId={post.cover} className="aspect-[21/9] rounded-panel border-[2.5px] border-border" />
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={post.title} /></h1>
        <Meta grades={post.grades} minutes={post.minutes} />
        <p className="text-xl font-bold">{post.summary}</p>
        {post.body.map((para, i) => <p key={i} className="text-lg leading-relaxed">{para}</p>)}
        <section className="bg-accent border-[2.5px] border-border rounded-panel p-5 grid gap-2" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl"><Title text={t('ways.tryIt')} /></h2>
          <ol className="grid gap-2 pl-7 m-0 font-semibold text-lg list-decimal marker:font-bold">{post.tryIt.map((s, i) => <li key={i}>{s}</li>)}</ol>
        </section>
        <Link to="/login" className={buttonClasses('primary', 'justify-self-start min-h-14 px-8 text-lg hover-pop')}>{t('ways.start')}</Link>
      </main>
      <PublicFooter />
    </>
  );
}
