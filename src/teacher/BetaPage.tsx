import { Navigate } from 'react-router-dom';
import { t } from '../i18n';
import { PageHeader } from '../ui/kit';
import TeacherNav from '../ui/TeacherNav';
import { useBetaSteps, useBetaTester } from '../beta/tester';
import { BetaTab } from './BetaChecklist';

// The Beta test tab of the teacher portal (owner, 2026-11-27): only for
// teachers in the beta; everyone else is sent home.
export default function BetaPage() {
  const on = useBetaTester();
  const { value: beta } = useBetaSteps(on);
  if (on === false) return <Navigate to="/teacher" replace />;
  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-24">
      <TeacherNav />
      <PageHeader title={t('teacherNav.beta')} />
      {beta && <BetaTab s={beta} />}
    </main>
  );
}
