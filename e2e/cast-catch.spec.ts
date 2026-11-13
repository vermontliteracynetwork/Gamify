import { test, expect } from '@playwright/test';
import { LIBRARY } from '../src/data/library';
import { finishSetup, openSetup } from './setup';

const answers = new Map(LIBRARY.flatMap((s) => s.questions.map((q) => [q.prompt, q.choices[q.correctIndex]] as const)));

test('Cast and Catch: cast, answer while the bobber floats, reel in a fish', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  await openSetup(page, '/games/cast-catch');
  await finishSetup(page);
  await expect(page.getByLabel(/seconds left/)).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  // Tap Cast and the line flies out: no power meter (teacher, 2026-11-13).
  await page.getByRole('button', { name: 'Cast', exact: true }).click({ force: true });
  await expect(page.getByRole('meter')).toHaveCount(0);
  if (info.project.name === 'ipad-portrait') for (let f = 0; f < 5; f++) { await page.screenshot({ path: `test-results/cast-frame-${f}.png` }); await page.waitForTimeout(140); }
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByText('Read the question')).toBeHidden({ timeout: 8000 });
  const prompt = (await dialog.getByRole('heading', { level: 2 }).innerText()).trim();
  const buttons = dialog.getByRole('button', { name: /^[A-D] / });
  const labels = await buttons.allInnerTexts();
  await buttons.nth(labels.findIndex((l) => l.trim().endsWith(answers.get(prompt)!))).click();
  // Frame check: a fish shadow swims to the bobber; reeling pulls it in.
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 4; f++) { await page.screenshot({ path: `test-results/cast-swim-${f}.png` }); await page.waitForTimeout(350); }
  await page.getByRole('button', { name: 'Reel it in!' }).click({ timeout: 8000 });
  if (info.project.name === 'ipad-landscape') for (let f = 0; f < 3; f++) { await page.screenshot({ path: `test-results/cast-reel-${f}.png` }); await page.waitForTimeout(250); }
  // A fish, or one of the Classic power-ups (a boot, a rainbow fish...).
  // The catch card stays until it is closed (teacher, 2026-11-13).
  const caught = page.getByRole('dialog').filter({ hasText: / cm |You reeled in/ });
  await expect(caught).toBeVisible();
  await page.screenshot({ path: `test-results/cast-caught-${info.project.name}.png` });
  await page.waitForTimeout(3200);
  await expect(caught).toBeVisible();
  await caught.getByRole('button', { name: 'Close' }).click();
  await expect(caught).toBeHidden();
  await expect(page.getByLabel('1 fish caught')).toBeVisible();
  expect(problems).toEqual([]);
});
