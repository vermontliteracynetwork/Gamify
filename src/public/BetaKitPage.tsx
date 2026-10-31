import { Bug, ChatCircleDots, Lightbulb, Printer, SmileySad, Warning } from '@phosphor-icons/react';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { buttonClasses } from '../ui/kit';
import Title from '../ui/Title';

// The beta classroom kit (development plan Part 5A): a one-page teacher
// lesson for the Tell Gamify button and a student poster, both printable on
// letter paper. Pictures first, so pre-readers can use the poster.
const CHOICES = [
  { icon: Bug, key: 'tell.bug', color: '#ed9d75' },
  { icon: SmileySad, key: 'tell.problem', color: '#b4c4fb' },
  { icon: Lightbulb, key: 'tell.idea', color: '#fdfd94' },
] as const;

export default function BetaKitPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 pb-10 grid gap-5">
      <div className="no-print grid gap-2">
        <h1 className="title-bubble text-4xl sm:text-5xl"><Title text={t('kit.title')} /></h1>
        <p className="font-bold">{t('kit.sub')}</p>
        <button type="button" onClick={() => window.print()} className={buttonClasses('primary', 'justify-self-start hover-pop')}><Printer weight="bold" size={18} />{t('kit.print')}</button>
      </div>

      <section className="template-page bg-white border-[2.5px] border-border rounded-panel p-10 grid gap-4 content-start" aria-label={t('kit.lessonTitle')}>
        <h2 className="title-bubble text-4xl"><Title text={t('kit.lessonTitle')} /></h2>
        <p className="font-bold text-lg">{t('kit.lessonGoal')}</p>
        <ol className="grid gap-3 pl-7 m-0 list-decimal text-lg font-semibold">
          {[1, 2, 3, 4, 5].map((n) => <li key={n}>{t(`kit.step.${n}` as StringKey)}</li>)}
        </ol>
        <div className="rounded-input border-[2px] border-border p-4 grid gap-2">
          <p className="font-display text-2xl">{t('kit.goodTitle')}</p>
          <ul className="grid gap-1 pl-6 m-0 list-disc font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`kit.good.${n}` as StringKey)}</li>)}</ul>
        </div>
        <p className="font-bold flex gap-2 items-start"><Warning weight="fill" size={22} className="shrink-0" aria-hidden="true" />{t('kit.privacy')}</p>
      </section>

      <section className="template-page bg-white border-[2.5px] border-border rounded-panel p-10 grid gap-6 content-evenly justify-items-center text-center min-h-[10in]" aria-label={t('kit.posterTitle')}>
        <h2 className="font-display text-6xl"><Title text={t('kit.posterTitle')} /></h2>
        <span className="w-44 h-44 rounded-full border-[4px] border-border bg-[#ddfcc6] flex items-center justify-center"><ChatCircleDots weight="bold" size={110} aria-hidden="true" /></span>
        <p className="font-display text-3xl">{t('kit.posterTap')}</p>
        <div className="grid grid-cols-3 gap-4 w-full">
          {CHOICES.map(({ icon: Icon, key, color }) => (
            <div key={key} className="rounded-panel border-[3px] border-border p-6 grid justify-items-center gap-3" style={{ background: color }}>
              <Icon weight="bold" size={96} aria-hidden="true" />
              <span className="font-display text-2xl leading-tight">{t(key)}</span>
            </div>
          ))}
        </div>
        <p className="font-display text-3xl">{t('kit.posterTell')}</p>
        <p className="font-display text-3xl flex items-center gap-3"><Warning weight="fill" size={40} aria-hidden="true" />{t('kit.posterNoNames')}</p>
      </section>
    </main>
  );
}
