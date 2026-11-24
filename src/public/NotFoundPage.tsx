import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, House, Question } from '@phosphor-icons/react';

// Page not found (teacher, 2026-11-24: "do the ... 404 page"). One plain
// sentence and one way out, no blame words. Student-looking links (a code,
// join, live) offer Join with a code; everything else offers the home page.
export default function NotFoundPage() {
  const { pathname } = useLocation();
  const student = /^\/(join|choose|live|mirror|play|look-up|arcade|games)\b/.test(pathname);
  return (
    <main className="min-h-[calc(100dvh-4rem)] grid place-items-center px-4 py-10 text-center">
      <div className="grid justify-items-center gap-5 max-w-xl">
        <span className="w-36 h-36 rounded-full grid place-items-center" style={{ background: '#ddd6ff' }} aria-hidden="true">
          <Question weight="bold" size={72} />
        </span>
        <h1 className="font-display text-5xl sm:text-6xl leading-none">This page is not here</h1>
        <p className="text-lg font-semibold">{student ? 'The link may be old. Check the code with your teacher.' : 'The link may be old or typed a little wrong.'}</p>
        <Link to={student ? '/join' : '/'} className="min-h-14 px-7 rounded-pill border-bold border-border bg-accent font-bold text-lg inline-flex items-center gap-2" style={{ boxShadow: '0 4px 0 #000' }}>
          {student ? <>Join with a code<ArrowRight weight="bold" size={22} /></> : <><House weight="bold" size={22} />Go to the home page</>}
        </Link>
      </div>
    </main>
  );
}
