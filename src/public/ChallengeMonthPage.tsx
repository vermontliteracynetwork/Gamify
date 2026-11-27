import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from '@phosphor-icons/react';
import { SPECIAL_DAYS } from '../theme/tags';
import { t } from '../i18n';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import ChallengeVote from './ChallengeVote';

// One month of the Theme Building Challenge (owner, 2026-11-27: "When you
// click on each card, it should show on another page all of the submissions
// for that month. Make sure that this is something that's easy to look at,
// easy to understand what's happening, easy to vote.").
const day = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' });

export default function ChallengeMonthPage() {
  const { tag = '' } = useParams();
  const d = SPECIAL_DAYS.find((x) => x.tag === tag);
  return (
    <>
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 grid gap-6">
        <Link to="/challenge" className="justify-self-start inline-flex items-center gap-1.5 font-bold underline underline-offset-4"><ArrowLeft weight="bold" size={16} aria-hidden="true" />{t('challenge.back')}</Link>
        {d ? (
          <>
            <header className="grid gap-1">
              <h1 className="title-bubble text-4xl sm:text-6xl"><Title text={d.name} /></h1>
              <p className="text-lg font-bold m-0">{day(d.date)}</p>
            </header>
            <ChallengeVote tag={d.tag} />
          </>
        ) : <p className="font-bold">{t('editor.notFound')}</p>}
      </main>
      <PublicFooter />
    </>
  );
}
