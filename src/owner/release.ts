// The road to release (owner production line, 2026-11-09): every item still
// between Gamify and launch, mirrored from the live dev plan doc (Stages 7 to
// 9 and Part 5). Claudia keeps it current with the doc. `you` = only the
// owner can do it; `build` = Claudia builds it; `done` = shipped.
export type ReleaseState = 'done' | 'build' | 'you';
export interface ReleaseItem { id: string; text: string; state: ReleaseState; note?: string }
export interface ReleaseStage { id: string; title: string; items: ReleaseItem[] }

export const RELEASE: ReleaseStage[] = [
  { id: 'accounts', title: 'Business', items: [
    { id: 'llc', text: 'Gamify assigned to the LLC, trade name filed', state: 'you' },
    { id: 'trademark', text: 'Trademark search, then buy the domain', state: 'you' },
    { id: 'insurance', text: 'Insurance: liability and cyber', state: 'you' },
    { id: 'attorney', text: 'Attorney review of Terms, Privacy, agreements', state: 'you' },
    { id: 'grow-year', text: 'Grow Year font license for the web', state: 'you' },
  ] },
  { id: 'cloud', title: 'Cloud setup', items: [
    { id: 'supabase', text: 'Supabase project', state: 'done' },
    { id: 'migrations', text: 'Run Supabase migrations 0001 to 0012', state: 'you', note: 'Owner page lists each one' },
    { id: 'two-step', text: 'Two-step sign-in for the owner page', state: 'you' },
    { id: 'voice', text: 'Read-aloud voice key in Vercel', state: 'you' },
    { id: 'email', text: 'Quote emails (after the domain)', state: 'you' },
    { id: 'network', text: 'Wider network access for the cloud', state: 'you' },
  ] },
  { id: 'money', title: 'Payments', items: [
    { id: 'stripe-account', text: 'Open the Stripe account', state: 'you' },
    { id: 'prices', text: 'Confirm final prices', state: 'you' },
    { id: 'checkout', text: 'Checkout, customer portal, receipts', state: 'build', note: 'Starts when the Stripe keys are in' },
    { id: 'po', text: 'School purchase-order form', state: 'build' },
    { id: 'promo', text: 'Stripe promotion codes', state: 'build' },
    { id: 'limits', text: 'Plan limits enforced', state: 'done' },
    { id: 'access-codes', text: 'Access codes and beta plans', state: 'done' },
  ] },
  { id: 'product', title: 'Product', items: [
    { id: 'roster', text: 'Launch game roster', state: 'done' },
    { id: 'board-game', text: 'Board Game classic rework', state: 'done' },
    { id: 'engagement', text: 'Engagement audit improvements', state: 'build', note: 'docs/engagement-audit.md' },
    { id: 'themes', text: 'Theme library and Theme Builder', state: 'done' },
    { id: 'shelf', text: 'My shelf stickers', state: 'done' },
    { id: 'art', text: 'Buy avatar and theme art', state: 'you' },
  ] },
  { id: 'readiness', title: 'Readiness', items: [
    { id: 'a11y', text: 'Accessibility audit and report', state: 'done' },
    { id: 'security', text: 'Security review and backups', state: 'done' },
    { id: 'privacy', text: 'Privacy and Terms drafts', state: 'done' },
    { id: 'devices', text: 'Device check', state: 'done' },
    { id: 'website', text: 'Website, help center, blog', state: 'done' },
    { id: 'filter', text: 'School web filter test', state: 'build', note: 'During the beta' },
  ] },
  { id: 'beta', title: 'Launch', items: [
    { id: 'pilots', text: '2 to 4 beta classrooms', state: 'you' },
    { id: 'video', text: 'Demo video voice and footage', state: 'you' },
    { id: 'pilot-report', text: 'Pilot results write-up', state: 'build', note: 'After the pilots' },
    { id: 'rostering', text: 'Rostering developer accounts', state: 'you' },
    { id: 'domain-live', text: 'Production domain live', state: 'you' },
    { id: 'approve', text: 'Approve the release', state: 'you' },
  ] },
];
