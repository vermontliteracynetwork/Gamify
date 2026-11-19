import { test, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { LIBRARY } from '../src/data/library';
import { GAMES } from '../src/games/registry';

// The design reviewer's screenshot sweep (.claude/agents/design-reviewer.md):
// every listed game's welcome, theme, setup pages, play screen, question and
// (where reachable) results, at the four audit sizes. Run on purpose only:
//   DESIGN_AUDIT=1 AUDIT_DIR=<folder> npx playwright test e2e/design-audit.spec.ts --project=laptop
const SIZES = [
  { id: 'ipad-portrait', width: 820, height: 1180 },
  { id: 'ipad-landscape', width: 1180, height: 820 },
  { id: 'laptop', width: 1440, height: 900 },
  { id: 'short-laptop', width: 1190, height: 540 },
];
const OUT = process.env.AUDIT_DIR ?? 'test-results/design-audit';
const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt.trim(), q.choices[q.correctIndex]] as const)));

async function answerRight(page: Page) {
  const dialog = page.getByRole('dialog');
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  await buttons.first().waitFor({ timeout: 8000 });
  await page.waitForTimeout(1600);
  const prompt = (await dialog.getByRole('heading', { level: 2 }).first().innerText()).trim();
  const labels = (await buttons.allInnerTexts()).map((l) => l.trim());
  await buttons.nth(Math.max(0, labels.findIndex((l) => l.endsWith(answers.get(prompt) ?? '\u0000')))).click();
}
async function tapStart(page: Page) {
  const start = page.getByRole('button', { name: 'Tap to start' });
  if (await start.waitFor({ timeout: 3000 }).then(() => true, () => false)) { await start.click(); await page.waitForTimeout(400); }
}

for (const size of SIZES) {
  test(`audit pages: ${size.id}`, async ({ page }, info) => {
    test.skip(!process.env.DESIGN_AUDIT || info.project.name !== 'laptop', 'made on purpose');
    mkdirSync(OUT, { recursive: true });
    await page.setViewportSize(size);
    for (const [name, path] of [['pick-a-game', '/play'], ['join', '/join'], ['activity', '/teacher/activity']]) {
      await page.goto(path); await page.waitForTimeout(900);
      await page.screenshot({ path: `${OUT}/${name}__${size.id}.png` });
    }
  });
  for (const g of GAMES) {
    test(`audit ${g.id}: ${size.id}`, async ({ page }, info) => {
      test.skip(!process.env.DESIGN_AUDIT || info.project.name !== 'laptop', 'made on purpose');
      test.setTimeout(120_000);
      mkdirSync(OUT, { recursive: true });
      const errors: string[] = [];
      page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.setViewportSize(size);
      await page.addInitScript((id) => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro', [`setup:${id}`]: { powerUps: true } })); }, g.id);
      let n = 0;
      const shot = (step: string) => page.screenshot({ path: `${OUT}/${g.id}__${String(++n).padStart(2, '0')}-${step}__${size.id}.png` });
      try {
        await page.goto(`/games/${g.id}`); await page.waitForTimeout(900); await shot('welcome');
        await page.getByRole('button', { name: 'Set up and play' }).click(); await page.waitForTimeout(700);
        if (await page.getByRole('heading', { name: 'Pick a Theme' }).isVisible()) { await shot('theme'); await page.getByRole('button', { name: 'Next', exact: true }).click(); await page.waitForTimeout(600); }
        for (let k = 1; k < 10; k++) {
          await shot(`setup-${k}`);
          const qs = page.getByRole('slider', { name: 'Questions' });
          if (g.id === 'star-quiz' && await qs.isVisible().catch(() => false)) await qs.fill('3', { timeout: 2000 }).catch(() => {});
          const next = page.getByRole('button', { name: 'Next', exact: true });
          if (!(await next.isVisible())) break;
          await next.click(); await page.waitForTimeout(600);
        }
        await page.getByRole('button', { name: 'Play', exact: true }).click(); await page.waitForTimeout(1500);
        await shot('play-start');
        await tapStart(page);
        if (await page.getByRole('dialog').getByRole('button', { name: /^[A-D] / }).first().isVisible({ timeout: 4000 }).catch(() => false)) {
          await page.waitForTimeout(1400); await shot('question');
          await answerRight(page); await page.waitForTimeout(700); await shot('answer-feedback');
          await page.waitForTimeout(2200);
          if (g.id === 'game-show') { await page.getByRole('button', { name: /^Card 1(,|$)/ }).click().catch(() => {}); await page.waitForTimeout(2600); }
          await shot('after-answer');
          const ok = page.getByRole('dialog').getByRole('button', { name: /^(OK|Close)$/ });
          if (await ok.first().isVisible().catch(() => false)) await ok.first().click();
          await page.waitForTimeout(1500); await shot('play-mid');
        }
        // Star Quiz is short enough to finish: the shared results box.
        if (g.id === 'star-quiz') {
          for (let k = 0; k < 6; k++) {
            if (await page.getByRole('button', { name: /^Play again/ }).isVisible().catch(() => false)) break;
            await answerRight(page).catch(() => {}); await page.waitForTimeout(2500);
          }
          await page.waitForTimeout(1500); await shot('results');
        }
      } catch (e) {
        errors.push(`AUDIT STOPPED: ${(e as Error).message.split('\n')[0]}`);
        await shot('stopped').catch(() => {});
      }
      writeFileSync(`${OUT}/${g.id}__${size.id}.errors.json`, JSON.stringify(errors, null, 1));
    });
  }
}
