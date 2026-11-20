import { describe, expect, it } from 'vitest';
import { signForTest, verifyStripeSignature } from './stripeSignature';

describe('Stripe webhook signature', () => {
  const secret = 'whsec_test', body = '{"type":"checkout.session.completed"}', now = 1_800_000_000;
  it('accepts a real signed event', async () => {
    expect(await verifyStripeSignature(body, await signForTest(secret, now, body), secret, now)).toBe(true);
  });
  it('refuses a faked or changed event', async () => {
    const header = await signForTest(secret, now, body);
    expect(await verifyStripeSignature(body.replace('completed', 'expired'), header, secret, now)).toBe(false);
    expect(await verifyStripeSignature(body, await signForTest('whsec_wrong', now, body), secret, now)).toBe(false);
    expect(await verifyStripeSignature(body, null, secret, now)).toBe(false);
    expect(await verifyStripeSignature(body, 't=abc,v1=00', secret, now)).toBe(false);
  });
  it('refuses an old replayed event', async () => {
    expect(await verifyStripeSignature(body, await signForTest(secret, now - 600, body), secret, now)).toBe(false);
  });
  it('refuses everything with no secret set', async () => {
    expect(await verifyStripeSignature(body, await signForTest('whsec_x', now, body), '', now)).toBe(false);
  });
});
