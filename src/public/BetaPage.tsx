import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'motion/react';
import { CalendarCheck, ChalkboardTeacher, ChatCircleDots, Check, Clock, Gift, Printer, RocketLaunch, ShieldCheck } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { t } from '../i18n';
import type { StringKey } from '../i18n/en';
import { Button, buttonClasses } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// Join the Gamify beta test (teacher, 2026-10-25): say exactly what a beta
// tester does, how long it takes and what they get. Testers get Plus free;
// what we need back is honest feedback from real classrooms.
const ASKS: { key: string; minutes: string }[] = [
  { key: 'setup', minutes: '15' }, { key: 'lesson', minutes: '10' }, { key: 'play', minutes: '10-20' },
  { key: 'checkin', minutes: '1' }, { key: 'surveys', minutes: '5' }, { key: 'report', minutes: '1' },
];
const card = 'bg-surface border-[2.5px] border-border rounded-panel p-5 grid gap-3 content-start';

export default function BetaPage() {
  const reduce = useReducedMotion();
  const enter = (i: number) => ({ initial: reduce ? false : { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 }, transition: { delay: reduce ? 0 : Math.min(i, 8) * 0.05 } });
  return (
    <>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-10 grid gap-10">
        <section className="bg-accent border-[2.5px] border-border rounded-panel p-6 sm:p-8 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
          <p className="font-bold uppercase tracking-wider text-sm">{t('betaPage.kicker')}</p>
          <h1 className="title-bubble text-4xl sm:text-6xl flex items-center gap-3 min-w-0 break-words"><RocketLaunch weight="fill" size={52} aria-hidden="true" className="shrink-0 hidden sm:block wiggle-on-hover" /><Title text={t('betaPage.title')} /></h1>
          <p className="text-xl font-bold max-w-3xl">{t('betaPage.sub')}</p>
          <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
            {(['free', 'time', 'length'] as const).map((k) => <li key={k} className="bg-surface border-[2px] border-border rounded-pill px-3 min-h-10 inline-flex items-center gap-1.5 font-bold text-sm"><Check weight="bold" size={16} aria-hidden="true" />{t(`betaPage.chip.${k}` as StringKey)}</li>)}
          </ul>
          <a href="#apply" className={buttonClasses('primary', 'justify-self-start min-h-14 px-8 text-lg hover-pop !bg-text !text-white')}>{t('betaPage.apply')}</a>
        </section>

        <section aria-labelledby="what-is" className="grid md:grid-cols-[1.2fr_1fr] gap-5 items-start">
          <div className="grid gap-3">
            <h2 id="what-is" className="font-display text-4xl"><Title text={t('betaPage.whatTitle')} /></h2>
            <p className="text-lg font-semibold">{t('betaPage.what')}</p>
            <p className="text-lg font-semibold">{t('betaPage.goal')}</p>
          </div>
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h3 className="font-display text-2xl flex items-center gap-2"><ChalkboardTeacher weight="fill" size={26} aria-hidden="true" /><Title text={t('betaPage.whoTitle')} /></h3>
            <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`betaPage.who.${n}` as StringKey)}</li>)}</ul>
          </div>
        </section>

        <section aria-labelledby="asks" className="grid gap-4">
          <h2 id="asks" className="font-display text-4xl"><Title text={t('betaPage.askTitle')} /></h2>
          <p className="text-lg font-semibold max-w-3xl">{t('betaPage.askSub')}</p>
          <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 list-none p-0 m-0">
            {ASKS.map((a, i) => (
              <motion.li key={a.key} {...enter(i)} className={`${card} hover-lift`} style={{ boxShadow: 'var(--shadow-sticker)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-11 h-11 shrink-0 rounded-full bg-accent border-[2.5px] border-border flex items-center justify-center font-display text-xl">{i + 1}</span>
                  <span className="text-sm font-bold inline-flex items-center gap-1 bg-surface-2 border-[2px] border-border-soft rounded-pill px-2 py-0.5"><Clock weight="bold" size={14} aria-hidden="true" />{t('betaPage.minutes', { n: a.minutes })}</span>
                </div>
                <h3 className="font-display text-2xl">{t(`betaPage.ask.${a.key}` as StringKey)}</h3>
                <p className="font-semibold">{t(`betaPage.ask.${a.key}.text` as StringKey)}</p>
              </motion.li>
            ))}
          </ol>
          <p className="font-bold bg-surface-2 border-[2px] border-border rounded-input p-3">{t('betaPage.optional')}</p>
        </section>

        <section aria-labelledby="gets" className="grid md:grid-cols-2 gap-5">
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 id="gets" className="font-display text-3xl flex items-center gap-2"><Gift weight="fill" size={30} aria-hidden="true" /><Title text={t('betaPage.getTitle')} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4, 5].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`betaPage.get.${n}` as StringKey)}</li>)}</ul>
          </div>
          <div className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <h2 className="font-display text-3xl flex items-center gap-2"><ChatCircleDots weight="fill" size={30} aria-hidden="true" /><Title text={t('betaPage.testTitle')} /></h2>
            <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4, 5].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`betaPage.test.${n}` as StringKey)}</li>)}</ul>
          </div>
        </section>

        <section aria-labelledby="timeline" className="grid gap-4">
          <h2 id="timeline" className="font-display text-4xl flex items-center gap-3"><CalendarCheck weight="fill" size={36} aria-hidden="true" /><Title text={t('betaPage.whenTitle')} /></h2>
          <ol className="grid sm:grid-cols-4 gap-3 list-none p-0 m-0">
            {[1, 2, 3, 4].map((n) => (
              <li key={n} className="bg-surface border-[2px] border-border rounded-input p-4 grid gap-1 content-start">
                <span className="font-display text-xl">{t(`betaPage.when.${n}` as StringKey)}</span>
                <span className="font-semibold text-sm">{t(`betaPage.when.${n}.text` as StringKey)}</span>
              </li>
            ))}
          </ol>
          <p className="font-semibold">{t('betaPage.after')}</p>
        </section>

        <section className={card} style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <h2 className="font-display text-3xl flex items-center gap-2"><ShieldCheck weight="fill" size={30} aria-hidden="true" /><Title text={t('betaPage.privacyTitle')} /></h2>
          <ul className="grid gap-2 list-none p-0 m-0">{[1, 2, 3, 4].map((n) => <li key={n} className="flex gap-2 font-semibold"><Check weight="bold" size={20} className="shrink-0 mt-0.5" aria-hidden="true" />{t(`betaPage.privacy.${n}` as StringKey)}</li>)}</ul>
          <div className="flex flex-wrap gap-2">
            <Link to="/beta-kit" className={buttonClasses('secondary', 'hover-pop')}><Printer weight="bold" size={18} />{t('beta.kit')}</Link>
            <Link to="/student-data" className={buttonClasses('ghost', 'hover-pop')}>{t('betaPage.promise')}</Link>
          </div>
        </section>

        <ApplyForm />
      </main>
      <PublicFooter />
    </>
  );
}

// The short application; it reaches the owner dashboard as a Beta request.
function ApplyForm() {
  const [form, setForm] = useState({ name: '', email: '', school: '', grades: '', role: 'teacher', devices: '', agree: false });
  const [sent, setSent] = useState(false);
  const ready = form.name.trim() && /\S+@\S+\.\S+/.test(form.email) && form.agree;
  async function send() {
    if (!ready) return;
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: 'beta', role: 'teacher', where: '/beta', device: navigator.userAgent,
      details: `Beta test request: ${form.name.trim()} <${form.email.trim()}>, ${form.role}, ${form.school.trim() || 'no school given'}, grades ${form.grades.trim() || 'not given'}, devices ${form.devices.trim() || 'not given'}. Agreed to the beta tester asks.`.slice(0, 1000),
    });
    setSent(true);
  }
  const field = 'min-h-12 px-3 rounded-input border-[2px] border-border font-bold bg-surface w-full';
  return (
    <section id="apply" aria-labelledby="apply-title" className={`${card} scroll-mt-24 !p-6`} style={{ boxShadow: 'var(--shadow-sticker-lg)' }}>
      <h2 id="apply-title" className="font-display text-4xl"><Title text={t('betaPage.applyTitle')} /></h2>
      <ol className="grid gap-1 pl-6 m-0 list-decimal font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`betaPage.how.${n}` as StringKey)}</li>)}</ol>
      {sent ? <p className="text-xl font-display" role="status">{t('betaPage.sent')}</p> : (
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="grid gap-1 font-bold min-w-0">{t('beta.name')}<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('betaPage.email')}<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} maxLength={120} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('betaPage.role')}
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={field}>
              {(['teacher', 'specialist', 'homeschool', 'other'] as const).map((r) => <option key={r} value={r}>{t(`betaPage.role.${r}` as StringKey)}</option>)}
            </select>
          </label>
          <label className="grid gap-1 font-bold min-w-0">{t('beta.school')}<input value={form.school} onChange={(e) => setForm({ ...form, school: e.target.value })} maxLength={120} className={field} /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('beta.grades')}<input value={form.grades} onChange={(e) => setForm({ ...form, grades: e.target.value })} maxLength={40} className={field} placeholder="K-3" /></label>
          <label className="grid gap-1 font-bold min-w-0">{t('betaPage.devices')}<input value={form.devices} onChange={(e) => setForm({ ...form, devices: e.target.value })} maxLength={80} className={field} placeholder={t('betaPage.devicesHint')} /></label>
          <label className="sm:col-span-2 flex items-start gap-2 font-bold"><input type="checkbox" checked={form.agree} onChange={(e) => setForm({ ...form, agree: e.target.checked })} className="w-5 h-5 mt-0.5 shrink-0" />{t('betaPage.agree')}</label>
          <p className="text-sm font-semibold text-muted sm:col-span-2">{t('beta.privacy')}</p>
          <Button variant="primary" className="justify-self-start min-h-14 px-8 text-lg hover-pop" disabled={!ready} onClick={() => void send()}>{t('betaPage.send')}</Button>
        </div>
      )}
    </section>
  );
}
