// Rough demo recording (silent): a scripted walkthrough at 1280x720.
import { chromium } from 'playwright';
const B = 'http://localhost:4173';
const out = process.argv[2];
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, recordVideo: { dir: out, size: { width: 1280, height: 720 } } });
await ctx.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro', readFirstSeconds: 1 })); });
const p = await ctx.newPage();
const wait = (ms) => p.waitForTimeout(ms);
const smooth = async (y) => { await p.evaluate((y) => window.scrollTo({ top: y, behavior: 'smooth' }), y); await wait(1400); };
// 1. Home page
await p.goto(B + '/'); await wait(2500);
await p.mouse.move(400, 520, { steps: 15 }); await wait(500);
await smooth(700); await smooth(1500);
const card = p.getByRole('link', { name: /Bubble Pop/ }); await card.scrollIntoViewIfNeeded(); await card.hover(); await wait(1200);
await smooth(0); await wait(600);
// 2. Teacher signs in
await p.getByRole('link', { name: 'Log in' }).first().click(); await wait(1200);
await p.getByLabel('Your name (what students see)').pressSequentially('Ms. Rivera', { delay: 80 }); await wait(400);
await p.getByRole('button', { name: 'Continue on this device' }).click(); await wait(1800);
// 3. Make a class
await p.getByLabel('New class name').pressSequentially('Room 12', { delay: 80 }); await wait(300);
await p.getByRole('button', { name: 'Make class' }).click(); await wait(1800);
// 4. Play Game Show
await p.goto(B + '/games/game-show'); await wait(1800);
await p.getByRole('button', { name: 'Set up and play' }).click(); await wait(1500);
await p.getByRole('button', { name: 'Next', exact: true }).click(); await wait(1200);
for (let i = 0; i < 5; i++) { const n = p.getByRole('button', { name: 'Next', exact: true }); if (!(await n.isVisible())) break; await n.click(); await wait(1000); }
await p.getByRole('button', { name: 'Play', exact: true }).click(); await wait(1500);
await p.getByRole('button', { name: 'Card 3', exact: true }).click(); await wait(2500);
const btns = p.getByRole('dialog').getByRole('button', { name: /^[A-D] / });
await btns.nth(0).click(); await wait(3000);
const ok = p.getByRole('dialog').getByRole('button', { name: 'OK' }); if (await ok.isVisible().catch(() => false)) { await ok.click(); await wait(1200); }
// 5. Bubble Pop
await p.goto(B + '/games/bubble-pop'); await wait(1500);
await p.getByRole('button', { name: 'Set up and play' }).click(); await wait(1000);
for (let i = 0; i < 5; i++) { const n = p.getByRole('button', { name: 'Next', exact: true }); if (!(await n.isVisible())) break; await n.click(); await wait(800); }
await p.getByRole('button', { name: 'Play', exact: true }).click(); await wait(2500);
for (let tries = 0; tries < 4; tries++) {
  const d = p.getByRole('dialog');
  if (!(await d.isVisible().catch(() => false))) break;
  const bs = d.getByRole('button', { name: /^[A-D] / });
  const n = await bs.count(); if (!n) break;
  await bs.nth(tries % n).click(); await wait(2200);
}
const board = p.getByRole('img', { name: /^Bubble board/ });
if (await board.isVisible().catch(() => false)) {
  const bb = await board.boundingBox();
  for (const fx of [0.3, 0.7, 0.5]) { await p.mouse.move(bb.x + bb.width * fx, bb.y + bb.height * 0.25, { steps: 20 }); await wait(500); await p.mouse.click(bb.x + bb.width * fx, bb.y + bb.height * 0.25); await wait(1800); }
}
// 6. Theme Builder and Reports
await p.goto(B + '/teacher/themes/game-show'); await wait(2500);
await p.getByRole('tab', { name: 'Font and sound' }).click(); await wait(800);
await p.getByRole('radio', { name: 'Storybook' }).click(); await wait(1500);
await p.goto(B + '/teacher/reports'); await wait(2500);
await p.goto(B + '/research'); await wait(2500); await smooth(600); await wait(800);
await ctx.close(); await b.close();
