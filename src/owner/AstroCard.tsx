import { Link } from 'react-router-dom';
import { ChatCircleDots } from '@phosphor-icons/react';
import { t } from '../i18n';
import { buttonClasses } from '../ui/kit';
import { ASTRO_UPDATED, BIG_THREE, STRENGTHS, WATCH, WINDOWS, type AstroTrait } from './astro';

// The owner's private Astrology Advisor page (/owner?s=astro). Readings live
// in astro.ts; the chat version is @astrology_advisor in the CEO Agent.
const TONE = { build: 'astro.tone.build', grow: 'astro.tone.grow', care: 'astro.tone.care' } as const;

function Traits({ id, title, items }: { id: string; title: string; items: AstroTrait[] }) {
  return (
    <section className="dash-card" aria-labelledby={id}>
      <h2 id={id} className="font-bold text-lg m-0">{title}</h2>
      <ul className="grid gap-3 list-none p-0 m-0">
        {items.map((x) => (
          <li key={x.id} className="rounded-input border-std border-border p-3 grid gap-1">
            <p className="dash-tag m-0">{x.placement}</p>
            <p className="font-bold m-0">{x.title}</p>
            <p className="text-sm font-medium m-0">{x.detail}</p>
            <p className="text-sm font-semibold m-0"><span className="font-bold">{t('astro.forGamify')} </span>{x.use}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function AstroCard() {
  return (
    <div className="grid gap-6">
      <section className="dash-card" aria-labelledby="astro-me">
        <div className="dash-card-head">
          <h2 id="astro-me" className="font-bold text-lg m-0">{t('astro.chart')}</h2>
          <span className="dash-tag">{t('astro.updated', { date: ASTRO_UPDATED })}</span>
        </div>
        <ul className="flex flex-wrap gap-3 list-none p-0 m-0">
          {BIG_THREE.map((b) => (
            <li key={b.label} className="rounded-input border-std border-border px-3 py-2">
              <p className="dash-tag m-0">{b.label}</p>
              <p className="font-bold m-0">{b.value}</p>
            </li>
          ))}
        </ul>
        <p className="dash-sub m-0">{t('astro.note')}</p>
        <Link to="/owner?s=ceo&ask=astrology_advisor" className={`${buttonClasses('primary', 'justify-self-start self-start', 'sm')}`}>
          <ChatCircleDots size={18} aria-hidden="true" />{t('astro.ask')}
        </Link>
      </section>

      <section className="dash-card" aria-labelledby="astro-when">
        <h2 id="astro-when" className="font-bold text-lg m-0">{t('astro.timing')}</h2>
        <p className="dash-sub m-0">{t('astro.timingNote')}</p>
        <ul className="grid gap-3 list-none p-0 m-0">
          {WINDOWS.map((w) => (
            <li key={w.id} className="rounded-input border-std border-border p-3 grid gap-1">
              <p className="dash-tag m-0">{w.when} · {t(TONE[w.tone])}</p>
              <p className="font-bold m-0">{w.sky}</p>
              <p className="text-sm font-medium m-0">{w.advice}</p>
              <p className="text-sm font-semibold m-0"><span className="font-bold">{t('astro.step')} </span>{w.step}</p>
            </li>
          ))}
        </ul>
      </section>

      <Traits id="astro-strong" title={t('astro.strengths')} items={STRENGTHS} />
      <Traits id="astro-watch" title={t('astro.watch')} items={WATCH} />
    </div>
  );
}
