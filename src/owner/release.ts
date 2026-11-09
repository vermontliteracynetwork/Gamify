// The road to release (owner production line, 2026-11-09): every item still
// between Gamify and launch, mirrored from the live dev plan doc (Stages 7 to
// 9 and Part 5). Claudia keeps it current with the doc. `you` = only the
// owner can do it; `build` = Claudia builds it; `done` = shipped.
export type ReleaseState = 'done' | 'build' | 'you';
export interface ReleaseItem { id: string; text: string; state: ReleaseState; note?: string }
export interface ReleaseStage { id: string; title: string; items: ReleaseItem[] }

export const RELEASE: ReleaseStage[] = [
  { id: 'accounts', title: 'Business and accounts', items: [
    { id: 'llc', text: 'Assign Gamify to Vermont Literacy Network LLC and register the trade name', state: 'you' },
    { id: 'trademark', text: 'Trademark search for "Gamify", then buy the domain', state: 'you' },
    { id: 'insurance', text: 'Check insurance (general liability and cyber) before schools pay', state: 'you' },
    { id: 'attorney', text: 'Attorney review: Terms, Privacy, beta agreement, Challenge rules, data privacy agreement, DMCA agent', state: 'you' },
    { id: 'grow-year', text: 'Confirm the Grow Year font license covers a website', state: 'you' },
  ] },
  { id: 'cloud', title: 'Cloud setup', items: [
    { id: 'supabase', text: 'Supabase project with Claudia access', state: 'done' },
    { id: 'migrations', text: 'Run migrations 0001 to 0012 in the Supabase SQL Editor', state: 'you', note: 'Owner page lists each one' },
    { id: 'two-step', text: 'Two-step sign-in for the owner page', state: 'you' },
    { id: 'voice', text: 'Natural read-aloud voice: add OPENAI_API_KEY in Vercel', state: 'you' },
    { id: 'email', text: 'Quote emails: Resend account and keys (after the domain)', state: 'you' },
    { id: 'network', text: 'Widen network access for the Gamify cloud environment', state: 'you' },
  ] },
  { id: 'money', title: 'Payments (Stripe)', items: [
    { id: 'stripe-account', text: 'Open the Stripe account in the business name', state: 'you' },
    { id: 'prices', text: 'Confirm final prices (Plus $96, Pro $180, Homeschool $96 a year)', state: 'you' },
    { id: 'checkout', text: 'Stripe checkout (monthly and yearly), customer portal and receipts', state: 'build', note: 'Starts when the Stripe keys are in' },
    { id: 'po', text: 'School purchase-order request form', state: 'build' },
    { id: 'promo', text: 'Stripe promotion codes (the 3 months of Plus code)', state: 'build' },
    { id: 'limits', text: 'Plan limits enforced everywhere from the config file', state: 'done' },
    { id: 'access-codes', text: 'Access codes and beta plans without Stripe', state: 'done' },
  ] },
  { id: 'product', title: 'Product', items: [
    { id: 'roster', text: 'Launch game roster built and polished', state: 'done' },
    { id: 'board-game', text: 'Board Game classic rework', state: 'done' },
    { id: 'engagement', text: 'Engagement audit improvements (Claudia list)', state: 'build', note: 'docs/engagement-audit.md' },
    { id: 'themes', text: 'Theme library and Theme Builder', state: 'done' },
    { id: 'shelf', text: 'My shelf sticker collection', state: 'done' },
    { id: 'art', text: 'Buy art for avatar items and library theme accents', state: 'you' },
  ] },
  { id: 'readiness', title: 'Launch readiness', items: [
    { id: 'a11y', text: 'Accessibility audit and conformance report', state: 'done' },
    { id: 'security', text: 'Security review, backups, breach plan', state: 'done' },
    { id: 'privacy', text: 'Privacy and Terms drafts; student pages free of trackers', state: 'done' },
    { id: 'devices', text: 'Device check: oldest iPad, Chromebook, smart board', state: 'done' },
    { id: 'website', text: 'Public website, pricing, help center, status page, blog', state: 'done' },
    { id: 'filter', text: 'Test on a filtered school network; ask web filters to list Gamify as education', state: 'build', note: 'During the beta' },
  ] },
  { id: 'beta', title: 'Beta and launch', items: [
    { id: 'pilots', text: 'Line up 2 to 4 beta classrooms', state: 'you' },
    { id: 'video', text: 'Demo video: voice-over and classroom footage', state: 'you' },
    { id: 'pilot-report', text: 'Pilot results write-up for marketing and district sales', state: 'build', note: 'After the pilots' },
    { id: 'rostering', text: 'Google Classroom, Clever and ClassLink developer accounts', state: 'you' },
    { id: 'domain-live', text: 'Production domain live', state: 'you' },
    { id: 'approve', text: 'Approve the production release', state: 'you' },
  ] },
];
