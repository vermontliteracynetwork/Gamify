import { data } from '../data';

// Upgrading (teacher rule, 2026-10-25: it must always be too easy not to
// upgrade). One tap from any limit opens the plan choice; one more tap
// upgrades. Until Stripe is connected (Stage 7) the tap switches the plan on
// this device so everything can be tested; then it opens Stripe Checkout
// with the plan already chosen, and the customer only confirms payment.
export const TIER_EVENT = 'gamify-tier';
export async function upgradeTo(plan: 'plus' | 'pro' | 'homeschool') {
  await data.setSetting('tier', plan);
  window.dispatchEvent(new Event(TIER_EVENT));
}

// Cancelling online (legal pass, 2026-11-21: "let users cancel online"). Until
// Stripe is connected this moves the plan to Free on this device; with Stripe
// it opens the customer portal, where the plan stays on until the end of the
// paid year (Waiting on you: Stripe).
export async function cancelPlan() {
  await data.setSetting('tier', 'free');
  window.dispatchEvent(new Event(TIER_EVENT));
}
