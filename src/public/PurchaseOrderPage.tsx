import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Receipt } from '@phosphor-icons/react';
import { data, newId } from '../data';
import { t } from '../i18n';
import { Button } from '../ui/kit';
import Title from '../ui/Title';
import PublicFooter from './PublicFooter';

// The school purchase-order request (dev plan, Payments): a business office
// sends the details of its purchase order so Gamify can invoice and turn on
// the school plan. It lands in Tell Gamify on the owner page (as a quote
// request starting "Purchase order:") and, with email set up, a reply comes
// from the owner. No prices here (they are in the emailed quote).
export default function PurchaseOrderPage() {
  const [form, setForm] = useState({ school: '', name: '', email: '', phone: '', po: '', quote: '', seats: 10, address: '', notes: '' });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = form.school.trim() && form.name.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) && form.po.trim() && form.address.trim() && form.seats >= 1;
  async function send() {
    if (!ready) return;
    setBusy(true);
    const f = Object.fromEntries(Object.entries(form).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v])) as typeof form;
    await data.sendFeedback({
      id: newId('fb'), at: new Date().toISOString(), kind: 'quote', role: 'teacher', where: '/pricing/purchase-order', device: navigator.userAgent,
      details: `Purchase order: ${f.po} from ${f.school}, ${f.seats} teachers. Contact ${f.name} <${f.email}>${f.phone ? `, ${f.phone}` : ''}. Quote ${f.quote || 'none'}. Bill to: ${f.address}. ${f.notes}`.slice(0, 1000),
    });
    setBusy(false);
    setSent(true);
  }
  const field = 'min-h-12 px-3 rounded-input border-[2px] border-border font-bold bg-surface w-full';
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: k === 'seats' ? Math.max(1, Number(e.target.value) || 1) : e.target.value });
  return (
    <>
      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 pb-16 grid gap-6">
        <div className="grid gap-2">
          <h1 className="title-bubble text-4xl sm:text-5xl flex items-center gap-3"><Receipt weight="fill" size={44} aria-hidden="true" /><Title text={t('po.title')} /></h1>
          <p className="text-lg font-bold">{t('po.sub')}</p>
        </div>
        {sent ? (
          <section className="bg-surface border-[2.5px] border-border rounded-panel p-6 grid gap-3 justify-items-start" style={{ boxShadow: 'var(--shadow-sticker)' }} role="status">
            <CheckCircle weight="fill" size={48} color="#1f7a45" aria-hidden="true" />
            <p className="font-display text-2xl">{t('po.thanks')}</p>
            <p className="font-bold">{t('po.thanksText', { email: form.email.trim() })}</p>
            <Link to="/pricing" className="font-bold">{t('po.back')}</Link>
          </section>
        ) : (
          <section className="bg-surface border-[2.5px] border-border rounded-panel p-5 sm:p-6 grid gap-4" style={{ boxShadow: 'var(--shadow-sticker)' }} aria-label={t('po.title')}>
            <ol className="grid gap-1 pl-6 m-0 list-decimal font-semibold">{[1, 2, 3].map((n) => <li key={n}>{t(`po.step.${n}` as 'po.step.1')}</li>)}</ol>
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="grid gap-1 font-bold sm:col-span-2">{t('po.school')}<input value={form.school} onChange={set('school')} maxLength={120} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.name')}<input value={form.name} onChange={set('name')} maxLength={80} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.email')}<input type="email" value={form.email} onChange={set('email')} maxLength={120} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.phone')}<input type="tel" value={form.phone} onChange={set('phone')} maxLength={30} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.number')}<input value={form.po} onChange={set('po')} maxLength={40} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.quote')}<input value={form.quote} onChange={set('quote')} maxLength={40} placeholder={t('po.quoteHint')} className={field} /></label>
              <label className="grid gap-1 font-bold">{t('po.seats')}<input type="number" min={1} max={5000} value={form.seats} onChange={set('seats')} className={`${field} sm:w-40`} /></label>
              <label className="grid gap-1 font-bold sm:col-span-2">{t('po.address')}<textarea value={form.address} onChange={set('address')} maxLength={300} rows={3} className={`${field} py-2`} /></label>
              <label className="grid gap-1 font-bold sm:col-span-2">{t('po.notes')}<textarea value={form.notes} onChange={set('notes')} maxLength={400} rows={2} className={`${field} py-2`} /></label>
            </div>
            <p className="text-sm font-semibold text-muted">{t('po.pdfNote')}</p>
            <Button variant="primary" className="justify-self-start min-h-14 px-8 text-lg hover-pop" disabled={!ready || busy} onClick={() => void send()}>{t('po.send')}</Button>
          </section>
        )}
      </main>
      <PublicFooter />
    </>
  );
}
