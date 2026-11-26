import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useCrumbLabel } from '../ui/Breadcrumbs';
import { ArrowRight, Clock, GraduationCap } from '@phosphor-icons/react';
import { BlogCard, BlogCrumb, PostCover, PostHeader, Steps, type Topic } from './BlogCard';
import { SbHead, SbMain, sbCard, sbPill, Words } from './scrapbookA';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import PillSelect from '../ui/PillSelect';
import { POSTS, type Post } from './posts';
import { guideGames, ThemeGuideCard } from './ThemeGuide';
import { HowToPlayCard, howToGames } from './HowToPlayPage';
import PublicFooter from './PublicFooter';
import { useScrapbookGround } from './scrapbook/Shell';

// Grade bands for the filter; a post shows when its grades overlap the band.
const BANDS = [{ id: 'all', lo: 0, hi: 12 }, { id: 'k2', lo: 0, hi: 2 }, { id: '35', lo: 3, hi: 5 }, { id: '68', lo: 6, hi: 8 }, { id: '912', lo: 9, hi: 12 }] as const;
export function gradeRange(grades: string): [number, number] {
  const [a, b = a] = grades.split('-').map((g) => (g.trim().toUpperCase() === 'K' ? 0 : Number(g)));
  return [a, b];
}

// Topics (the /brand Blog index mockup): All, Classroom ideas, Themes, How to
// play, Homeschool. Classroom ideas are the posts with no homeschool or
// themes tag; Themes adds every game's theme guide, How to play every game's
// article.
const TOPICS: readonly Topic[] = ['all', 'classroom', 'themes', 'howto', 'homeschool'];
const topicOf = (p: Post): Exclude<Topic, 'all' | 'howto'> => (p.tags?.includes('homeschool') ? 'homeschool' : p.tags?.includes('themes') ? 'themes' : 'classroom');


// The public Blog: topic pills and a grade dropdown over a grid of cards.
export function WaysList() {
  useScrapbookGround(); // owner 2026-11-26: this page is scrapbook A
  const [params, setParams] = useSearchParams();
  const band = BANDS.find((b) => b.id === params.get('grades')) ?? BANDS[0];
  const topic: Topic = (TOPICS as readonly string[]).includes(params.get('tag') ?? '') ? (params.get('tag') as Topic) : 'all';
  const go = (next: { tag?: Topic; grades?: string }) => {
    const tag = next.tag ?? topic, grades = next.grades ?? band.id;
    setParams({ ...(tag !== 'all' ? { tag } : {}), ...(grades !== 'all' ? { grades } : {}) }, { replace: true });
  };
  const posts = POSTS.map((p, i) => ({ p, i })).filter(({ p }) => {
    const [lo, hi] = gradeRange(p.grades);
    return lo <= band.hi && hi >= band.lo && (topic === 'all' || topicOf(p) === topic);
  });
  return (
    <>
      {/* The Scrapbook A Blog index (owner 2026-11-26: "blog index=a"). */}
      <SbMain className="!gap-6">
        <SbHead title={t('ways.title')} sub={t('ways.sub')} />
        <div className="flex flex-wrap items-center gap-2.5">
          <div role="group" aria-label={t('ways.topics')} className="flex flex-wrap gap-2.5">
            {TOPICS.map((k) => <button key={k} type="button" aria-pressed={topic === k} onClick={() => go({ tag: k })} className={sbPill(topic === k)}>{t(`ways.topic.${k}` as StringKey)}</button>)}
          </div>
          <PillSelect label={t('ways.gradesLabel')} value={band.id} onChange={(v) => go({ grades: v })} active={band.id !== 'all'}>
            {BANDS.map((b) => <option key={b.id} value={b.id}>{t(`ways.band.${b.id}` as StringKey)}</option>)}
          </PillSelect>
        </div>
        {topic === 'themes' && <p className="font-semibold max-w-3xl -mt-2">{t('guide.listSub')}</p>}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-[1.375rem]">
          {posts.map(({ p, i }) => <BlogCard key={p.slug} to={`/blog/${p.slug}`} header={<PostHeader i={i} />} title={p.title} sub={p.summary} meta={<Meta grades={p.grades} minutes={p.minutes} />} />)}
          {topic === 'themes' && guideGames().map((g) => <ThemeGuideCard key={g.id} game={g} />)}
          {topic === 'howto' && howToGames().map((g) => <HowToPlayCard key={g.id} game={g} />)}
        </div>
        {posts.length === 0 && topic !== 'themes' && topic !== 'howto' && <p className="font-bold">{t('ways.none')}</p>}
      </SbMain>
      <PublicFooter />
    </>
  );
}

function Meta({ grades, minutes }: { grades: string; minutes: number }) {
  return (
    <span className="flex flex-wrap gap-3 text-sm sm:text-[0.9375rem] font-bold text-muted">
      <span className="inline-flex items-center gap-1"><GraduationCap weight="bold" size={16} aria-hidden="true" />{t('ways.grades', { grades })}</span>
      <span className="inline-flex items-center gap-1"><Clock weight="bold" size={16} aria-hidden="true" />{t('ways.minutes', { minutes })}</span>
    </span>
  );
}

export function WaysPost() {
  useScrapbookGround(); // owner 2026-11-26: this page is scrapbook A
  const { slug } = useParams();
  const index = POSTS.findIndex((p) => p.slug === slug);
  const post = POSTS[index];
  useCrumbLabel(post?.title);
  if (!post) return <main className="max-w-6xl mx-auto px-4 sm:px-6 p-6"><Link to="/blog" className={buttonClasses('secondary')}>{t('ways.all')}</Link></main>;
  return (
    <>
      {/* The Scrapbook A Blog post (owner 2026-11-26: "blog post=a"): the
          reading column stays plain and flat; the picture is the post's game
          cover on a white mat. */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-7 sm:pt-12">
        <article className="max-w-[47.5rem] mx-auto grid gap-5">
          <BlogCrumb topic={topicOf(post)} />
          <h1 className="title-bubble m-0 text-[2.6rem] sm:text-[3.6rem] lg:text-[4.375rem] leading-[0.98]"><Words text={post.title} /></h1>
          <p className="m-0 text-lg sm:text-[1.375rem] font-semibold leading-snug">{post.summary}</p>
          <Meta grades={post.grades} minutes={post.minutes} />
          <PostCover gameId={post.cover} />
          {post.body.map((para, i) => <p key={i} className="m-0 text-lg sm:text-xl leading-relaxed">{para}</p>)}
          {post.lists?.map((l) => (
            <section key={l.heading} className="grid gap-2">
              <h2 className="font-heading font-bold text-2xl">{l.heading}</h2>
              <ul className="grid gap-1 pl-7 m-0 text-lg list-disc">{l.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
          ))}
          <section className={`${sbCard} !bg-mint p-5 sm:p-6 grid gap-4 mt-2`}>
            <h2 className="m-0 font-heading font-bold text-2xl sm:text-3xl">{t('ways.tryIt')}</h2>
            <Steps items={post.tryIt} />
            <p className="m-0 font-semibold text-lg">{t('ways.tryItSub')}</p>
            {/* Sign up is a main action, so Grape (New direction rule 9; the A mockup). */}
            <Link to="/login?mode=signup" className={buttonClasses('main', 'justify-self-start hover-pop', 'lg')}>{t('ways.start')}<ArrowRight weight="bold" size={20} /></Link>
          </section>
        </article>
      </main>
      <PublicFooter />
    </>
  );
}
