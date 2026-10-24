import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChartLineUp, ChatCircleDots, CreditCard, PaintBrush, Ticket, UsersThree } from '@phosphor-icons/react';
import { t } from '../i18n';
import PinGate from '../settings/PinGate';
import { PageHeader, Panel } from '../ui/kit';

export const OWNER_PIN_KEY = 'owner-pin-hash';

// The owner's developer view (development plan Stage 7B). Until accounts
// exist (Stage 5) it opens with its own 4-digit owner PIN. The Theme Builder
// works now; the other cards fill in as their stages ship.
export default function OwnerPage() {
  const [open, setOpen] = useState(false);
  if (!open) {
    return (
      <main className="max-w-md mx-auto px-4 pt-10 pb-24">
        <Panel><p className="font-display text-2xl font-bold text-center mb-2">{t('owner.title')}</p><PinGate pinKey={OWNER_PIN_KEY} createLabel={t('owner.pinCreate')} onUnlock={() => setOpen(true)} /></Panel>
      </main>
    );
  }
  const soon = [
    { icon: CreditCard, title: t('owner.subs'), stage: '7B' },
    { icon: ChartLineUp, title: t('owner.income'), stage: '7B' },
    { icon: UsersThree, title: t('owner.teachers'), stage: '7B' },
    { icon: ChatCircleDots, title: t('owner.inbox'), stage: '7B' },
    { icon: Ticket, title: t('owner.coupons'), stage: '7' },
  ];
  return (
    <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-8 pb-24">
      <PageHeader title={t('owner.title')} subtitle={t('owner.subtitle')} />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link to="/owner/themes" className="rounded-panel bg-accent border-[2.5px] border-border p-5 grid gap-2 no-underline text-text" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <PaintBrush weight="fill" size={36} aria-hidden="true" />
          <span className="font-display text-2xl font-bold">{t('owner.themes')}</span>
          <span className="font-bold text-sm">{t('owner.themesHint')}</span>
        </Link>
        {soon.map(({ icon: Icon, title, stage }) => (
          <Panel key={title} className="grid gap-2 opacity-80">
            <Icon weight="bold" size={32} aria-hidden="true" />
            <span className="font-display text-xl font-bold">{title}</span>
            <span className="font-bold text-sm text-muted">{t('owner.comingIn', { stage })}</span>
          </Panel>
        ))}
      </div>
    </main>
  );
}
