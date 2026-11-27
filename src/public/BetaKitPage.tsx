import { Bug, CheckCircle, Flag, GearSix, Keyboard, Lightbulb, Printer, SmileySad, UserCircle, Warning } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Link } from 'react-router-dom';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import { MATERIALS, PHOTO_TIPS, THEME_IDEAS } from '../beta/themeIdeas';

// The beta classroom kit (development plan Part 5A): a one-page teacher
// lesson for the Tell Gamify button and a student poster, both printable on
// letter paper. Pictures first, so pre-readers can use the poster.
const CHOICES = [
  { icon: Bug, key: 'tell.bug', color: '#ffd9b3' },
  { icon: SmileySad, key: 'tell.problem', color: '#ddd6ff' },
  { icon: Lightbulb, key: 'tell.idea', color: 'var(--color-butter)' },
] as const;

const DAY = [
  { icon: Keyboard, color: 'var(--color-butter)' },
  { icon: UserCircle, color: '#ddd6ff' },
  { icon: CheckCircle, color: '#c8f2c9' },
  { icon: GearSix, color: '#ffd9b3' },
] as const;

export default function BetaKitPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 pb-10 grid gap-5">
      <div className="no-print grid gap-2">
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('kit.title')} /></h1>
        <p className="font-bold">{t('kit.sub')}</p>
        <button type="button" onClick={() => window.print()} className={buttonClasses('main', 'justify-self-start hover-pop')}><Printer weight="bold" size={18} />{t('kit.print')}</button>
      </div>

      {/* Student training (owner checklist, 2026-11-27): the first day, then a picture poster for pre-readers. */}
      <section className="template-page bg-white border-bold border-border rounded-panel p-10 grid gap-4 content-start" aria-label={t('kit.dayTitle')}>
        <h2 className="title-bubble text-4xl"><Title text={t('kit.dayTitle')} /></h2>
        <p className="font-bold text-lg">{t('kit.dayGoal')}</p>
        <ol className="grid gap-3 pl-7 m-0 list-decimal text-lg font-semibold">
          {[1, 2, 3, 4, 5].map((n) => <li key={n}>{t(`kit.day.${n}` as StringKey)}</li>)}
        </ol>
      </section>

      <section className="template-page bg-white border-bold border-border rounded-panel p-10 grid gap-6 content-evenly justify-items-center text-center min-h-[10in]" aria-label={t('kit.dayPoster')}>
        <h2 className="font-display text-6xl"><Title text={t('kit.dayPoster')} /></h2>
        <ol className="grid grid-cols-2 gap-5 w-full list-none m-0 p-0">
          {DAY.map(({ icon: Icon, color }, i) => (
            <li key={i} className="rounded-panel border-heavy border-border p-6 grid justify-items-center gap-3" style={{ background: color }}>
              <span className="w-12 h-12 rounded-full bg-white border-std border-border grid place-items-center font-display text-2xl">{i + 1}</span>
              <Icon weight="bold" size={96} aria-hidden="true" />
              <span className="font-display text-3xl leading-tight">{t(`kit.dayPoster.${i + 1}` as StringKey)}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="template-page bg-white border-bold border-border rounded-panel p-10 grid gap-4 content-start" aria-label={t('kit.lessonTitle')}>
        <h2 className="title-bubble text-4xl"><Title text={t('kit.lessonTitle')} /></h2>
        <p className="font-bold text-lg">{t('kit.lessonGoal')}</p>
        <ol className="grid gap-3 pl-7 m-0 list-decimal text-lg font-semibold">
          {[1, 2, 3, 4, 5].map((n) => <li key={n}>{t(`kit.step.${n}` as StringKey)}</li>)}
        </ol>
        <div className="rounded-input border-std border-border p-4 grid gap-2">
          <p className="font-display text-2xl">{t('kit.goodTitle')}</p>
          <ul className="grid gap-1 pl-6 m-0 list-disc font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`kit.good.${n}` as StringKey)}</li>)}</ul>
        </div>
        <div className="rounded-input border-std border-border p-4 grid gap-2">
          <p className="font-display text-2xl">{t('kit.facesTitle')}</p>
          <ul className="grid gap-1 pl-6 m-0 list-disc font-semibold">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`kit.faces.${n}` as StringKey)}</li>)}</ul>
        </div>
        <p className="font-bold flex gap-2 items-start"><Warning weight="fill" size={22} className="shrink-0" aria-hidden="true" />{t('kit.privacy')}</p>
        <p className="font-semibold">{t('kit.itNote')} <Link to="/it">{window.location.host}/it</Link></p>
      </section>

      <section className="template-page bg-white border-bold border-border rounded-panel p-10 grid gap-6 content-evenly justify-items-center text-center min-h-[10in]" aria-label={t('kit.posterTitle')}>
        <h2 className="font-display text-6xl"><Title text={t('kit.posterTitle')} /></h2>
        <span className="w-44 h-44 rounded-full border-[4px] border-border bg-mint-soft flex items-center justify-center"><Flag weight="bold" size={110} aria-hidden="true" /></span>
        <p className="font-display text-3xl">{t('kit.posterTap')}</p>
        <div className="grid grid-cols-3 gap-4 w-full">
          {CHOICES.map(({ icon: Icon, key, color }) => (
            <div key={key} className="rounded-panel border-heavy border-border p-6 grid justify-items-center gap-3" style={{ background: color }}>
              <Icon weight="bold" size={96} aria-hidden="true" />
              <span className="font-display text-2xl leading-tight">{t(key)}</span>
            </div>
          ))}
        </div>
        <p className="font-display text-3xl">{t('kit.posterTell')}</p>
        <p className="font-display text-3xl flex items-center gap-3"><Warning weight="fill" size={40} aria-hidden="true" />{t('kit.posterNoNames')}</p>
      </section>

      <section className="template-page bg-white border-bold border-border rounded-panel p-10 grid gap-4 content-start" aria-labelledby="kit-themes">
        <h2 id="kit-themes" className="title-bubble text-4xl"><Title text={t('kit.themesTitle')} /></h2>
        <p className="font-bold text-lg">{t('kit.themesSub')}</p>
        <ul className="grid sm:grid-cols-2 gap-3 list-none p-0 m-0">
          {THEME_IDEAS.map((i) => (
            <li key={i.title} className="rounded-input border-std border-border p-3 grid gap-1 content-start">
              <p className="text-sm font-bold text-muted m-0">{i.game}{i.older ? ` · ${t('kit.older')}` : ''}</p>
              <p className="font-display text-xl m-0">{i.title}</p>
              <p className="font-semibold m-0">{i.idea}</p>
              <p className="text-sm font-semibold m-0"><span className="font-bold">{t('kit.material')} </span>{i.material}</p>
            </li>
          ))}
        </ul>
        <h3 className="font-display text-2xl">{t('kit.materialsTitle')}</h3>
        <ul className="grid gap-2 pl-6 m-0 list-disc font-semibold">
          {MATERIALS.map((m) => <li key={m.name}><span className="font-bold">{m.name}: </span>{m.tip}</li>)}
        </ul>
        <h3 className="font-display text-2xl">{t('kit.photoTitle')}</h3>
        <ol className="grid gap-1 pl-7 m-0 list-decimal font-semibold">{PHOTO_TIPS.map((p) => <li key={p}>{p}</li>)}</ol>
      </section>
    </main>
  );
}
