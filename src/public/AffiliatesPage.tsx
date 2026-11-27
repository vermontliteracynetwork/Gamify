import { useState } from 'react';
import { Check, Handshake } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses, fieldClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';
import { AFFILIATE, commission } from '../affiliate/program';

// Become a Gamify affiliate (owner, 2026-11-25): teachers, homeschool
// parents and education creators with an audience earn a share of the
// subscriptions they bring. For adults only; nothing here is a student page.
const card = 'bg-surface border-bold border-border rounded-panel p-5 grid gap-3 content-start';
const pct = (n: number) => `${Math.round(n * 100)}%`;

export default function AffiliatesPage() {
  const terms = { rate: pct(AFFILIATE.rate), months: AFFILIATE.months, school: pct(AFFILIATE.schoolRate), days: AFFILIATE.windowDays, min: AFFILIATE.minimumPayout, offer: pct(AFFILIATE.followerOffer), hold: AFFILIATE.holdDays, friend: AFFILIATE.friendMonths };
  const examples: [string, number][] = [[t('affPage.ex.plusYear'), commission('plus', 'year')], [t('affPage.ex.proYear'), commission('pro', 'year')], [t('affPage.ex.plusHalf'), commission('plus', 'half')], [t('affPage.ex.plusMonth'), commission('plus', 'month')]];
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-10">
        <section className="grid gap-4 justify-items-start text-left">
          <h1 className="title-bubble text-4xl sm:text-6xl min-w-0"><Title text={t('affPage.title')} /></h1>
          <p className="text-xl font-bold max-w-3xl">{t('affPage.sub', terms)}</p>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {(['share', 'pro', 'offer'] as const).map((k) => <li key={k} className="bg-surface border-std border-border rounded-pill px-3 min-h-10 inline-flex items-center gap-1.5 font-bold text-sm"><Check weight="bold" size={16} aria-hidden="true" />{t(`affPage.chip.${k}` as StringKey, terms)}</li>)}
          </ul>
          <a href="#apply" className={buttonClasses('primary', 'justify-self-start hover-pop', 'lg')}>{t('affPage.apply')}</a>
        </section>

        <section aria-labelledby="aff-how" className="grid md:grid-cols-2 gap-5 items-start">
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 id="aff-how" className="font-display text-2xl"><Title text={t('affPage.howTitle')} /></h2>
            <ol className="grid gap-2 pl-6 m-0 list-decimal font-semibold">{[1, 2, 3, 4].map((n) => <li key={n}>{t(`affPage.how.${n}` as StringKey, terms)}</li>)}</ol>
          </div>
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-2xl"><Title text={t('affPage.earnTitle')} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">
              {examples.map(([label, n]) => <li key={label} className="flex justify-between gap-3 font-semibold"><span>{label}</span><span className="font-bold tabular-nums">${n.toFixed(2)}</span></li>)}
            </ul>
            <p className="text-sm font-semibold text-muted m-0">{t('affPage.earnNote', terms)}</p>
          </div>
        </section>

        <section aria-labelledby="aff-who" className="grid md:grid-cols-2 gap-5 items-start">
          <div className="grid gap-3">
            <h2 id="aff-who" className="title-bubble text-4xl"><Title text={t('affPage.whoTitle')} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`affPage.who.${n}` as StringKey, { followers: AFFILIATE.minFollowers.toLocaleString() })}</li>)}</ul>
          </div>
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-2xl flex items-center gap-2"><Handshake weight="fill" size={26} aria-hidden="true" /><Title text={t('affPage.rulesTitle')} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4, 6, 7, 5].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`affPage.rule.${n}` as StringKey)}</li>)}</ul>
          </div>
        </section>

        {/* Every detail in one scannable table (owner, 2026-11-27: "a page for the affiliate program where it'll have all the details"). */}
        <section aria-labelledby="aff-details" className="grid gap-4">
          <h2 id="aff-details" className="title-bubble text-4xl"><Title text={t('affPage.detailsTitle')} /></h2>
          <dl className="grid sm:grid-cols-2 gap-3 m-0">
            {(['rate', 'plans', 'school', 'window', 'hold', 'how', 'offer', 'pro'] as const).map((k) => (
              <div key={k} className={`${card} !gap-1`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <dt className="font-heading font-bold text-lg">{t(`affPage.d.${k}` as StringKey)}</dt>
                <dd className="m-0 font-semibold">{t(`affPage.d.${k}V` as StringKey, terms)}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="aff-friend" className={`${card} !bg-mint`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 id="aff-friend" className="font-display text-2xl"><Title text={t('affPage.friendTitle')} /></h2>
          <p className="m-0 font-semibold">{t('affPage.friendText', terms)}</p>
        </section>

        <ApplyForm />
      </main>
      <PublicFooter />
    </>
  );
}

function ApplyForm() {
  const [form, setForm] = useState({ name: '', email: '', role: 'teacher', platform: 'TikTok', handle: '', audience: '', about: '', agree: false });
  const [sent, setSent] = useState(false);
  const ready = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.handle.trim() && form.agree;
  async function send() {
    if (!ready) return;
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: 'affiliate', role: 'teacher', where: '/affiliates', device: navigator.userAgent,
      details: `Affiliate application: ${form.name.trim()} <${form.email.trim()}>, ${form.role}, ${form.platform} ${form.handle.trim()}, audience ${form.audience.trim() || 'not given'}. About: ${form.about.trim() || 'not given'}. Agreed to disclose every post and to the affiliate rules.`.slice(0, 1000),
    });
    setSent(true);
  }
  const field = fieldClasses('md', 'w-full');
  return (
    <section id="apply" aria-labelledby="aff-apply" className={`${card} scroll-mt-24 !p-6`} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <h2 id="aff-apply" className="title-bubble text-4xl"><Title text={t('affPage.applyTitle')} /></h2>
      {sent ? <p className="text-xl font-display" role="status">{t('affPage.sent')}</p> : (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 font-bold min-w-0">{t('beta.name')}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('betaPage.email')}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('betaPage.role')}
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}>
              {(['teacher', 'specialist', 'homeschool', 'coop', 'other'] as const).map((r) => <option key={r} value={r}>{t(`betaPage.role.${r}` as StringKey)}</option>)}
            </select>
          </label>
          <div className="grid grid-cols-[auto_1fr] gap-2 min-w-0">
            <label className="grid gap-1 font-bold">{t('affPage.platform')}
              <select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value })} className={fieldClasses('md')}>
                {['TikTok', 'Instagram', 'YouTube', 'Facebook', 'Pinterest', 'Blog or newsletter'].map((p) => <option key={p}>{p}</option>)}
              </select>
            </label>
            <label className="grid gap-1 font-bold min-w-0">{t('affPage.handle')}<input value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value })} maxLength={80} placeholder="@" className={field} /></label>
          </div>
          <label className="grid gap-1 font-bold min-w-0">{t('affPage.audience')}<input value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} maxLength={80} placeholder={t('affPage.audienceHint')} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0 sm:col-span-2">{t('affPage.about')}<textarea value={form.about} onChange={(e) => setForm({ ...form, about: e.target.value })} rows={3} maxLength={400} className={fieldClasses('md', 'w-full resize-none')} /></label>
          <label className="sm:col-span-2 flex items-start gap-2 font-bold"><input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} className="w-5 h-5 mt-0.5 shrink-0" />{t('affPage.agree')}</label>
          <p className="text-sm font-semibold text-muted sm:col-span-2">{t('beta.privacy')}</p>
          <Button variant="primary" className="justify-self-start min-h-14 px-8 text-lg hover-pop" disabled={!ready} onClick={() => void send()}>{t('affPage.send')}</Button>
        </div>
      )}
    </section>
  );
}
