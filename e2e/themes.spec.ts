import { test, expect, type Page } from '@playwright/test';
import { finishSetup, openSetup } from './setup';

function watch(page: Page) {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  page.on('pageerror', (e) => problems.push(e.message));
  return problems;
}

// A small solid-color PNG made in the page (stands in for a student drawing).
async function png(page: Page, color: string): Promise<Buffer> {
  const data = await page.evaluate((c) => {
    const cv = document.createElement('canvas'); cv.width = 300; cv.height = 220;
    const x = cv.getContext('2d')!; x.fillStyle = c; x.fillRect(0, 0, 300, 220); x.fillStyle = '#222'; x.fillRect(100, 60, 100, 100);
    return cv.toDataURL('image/png').split(',')[1];
  }, color);
  return Buffer.from(data, 'base64');
}

test('Classic first, plus Gamify\'s designed themes; a game with only Classic skips the theme step', async ({ page }, info) => {
  await page.goto('/games/match-three');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a Theme' })).toBeVisible();
  await expect(page.getByRole('radio', { name: /Christmas Treats/ })).toBeVisible();
  await page.screenshot({ path: `test-results/theme-screen-${info.project.name}.png` });
  // Cast and Catch wears only Classic, so the theme step is skipped and Back returns to the start.
  await page.goto('/games/cast-catch');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a Theme' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /^Step 1 of \d+:/ })).toBeVisible();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Set up and play' })).toBeVisible();
});

test('Theme Builder: upload a piece, save, and play the game in it', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.goto('/teacher/themes');
  await page.screenshot({ path: `test-results/builder-games-${info.project.name}.png`, fullPage: true });
  await page.getByRole('link', { name: /Game Show/ }).click();
  await page.getByLabel('Theme name').fill('Ocean Party');
  const cardBack = page.locator('input[type=file]').nth(1); // Upload tab: background, then card back
  await cardBack.setInputFiles({ name: 'card.png', mimeType: 'image/png', buffer: await png(page, '#2a9df4') });
  await expect(page.getByLabel('Added')).toHaveCount(1);
  await page.getByRole('tab', { name: 'Colors' }).click();
  await page.getByLabel('Main color hex code').fill('#7ad3f5');
  await page.getByRole('tab', { name: 'Share' }).click();
  await page.getByLabel('Student first name or nickname (optional)').fill('Ava');
  await page.getByRole('tab', { name: 'Style' }).click();
  await page.getByRole('radio', { name: 'Storybook' }).click();
  await page.getByRole('radio', { name: 'Chimes' }).click();
  await page.screenshot({ path: `test-results/builder-style-${info.project.name}.png` });
  await page.screenshot({ path: `test-results/builder-edit-${info.project.name}.png`, fullPage: true });
  await page.getByRole('button', { name: 'Save theme' }).click();
  await expect(page.getByText('Saved Ocean Party.', { exact: false })).toBeVisible();

  await page.goto('/games/game-show');
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await page.getByRole('radio', { name: 'Ocean Party' }).click();
  await expect(page.getByText('Made by Test Teacher, designed by Ava')).toBeVisible();
  await expect(page).toHaveTitle('Game Show | Gamify');
  await page.screenshot({ path: `test-results/theme-screen-made-${info.project.name}.png` });
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByRole('heading', { name: /^Step 1 of 5:/ })).toBeVisible();
  await finishSetup(page);
  expect(await page.locator('h1, h2').first().evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Georgia');
  const bg = await page.getByRole('button', { name: /^Card 1(,|$)/ }).evaluate((el) => getComputedStyle(el).backgroundImage);
  expect(bg).toContain('url(');
  await page.screenshot({ path: `test-results/builder-played-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

test('Theme Builder: a photo of a drawn template page, uploaded on its card, is cut out', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.goto('/teacher/themes/game-show/template');
  const sheet = page.locator('.template-sheet').first();
  await expect(sheet).toBeVisible();
  if (info.project.name === 'ipad-portrait') await page.screenshot({ path: 'test-results/builder-template.png', fullPage: false });
  // A student "draws" inside page 1's outline.
  await sheet.evaluate((svg) => {
    const ns = 'http://www.w3.org/2000/svg';
    const r = document.createElementNS(ns, 'circle');
    r.setAttribute('cx', '850'); r.setAttribute('cy', '1200'); r.setAttribute('r', '300'); r.setAttribute('fill', '#e85d75');
    svg.appendChild(r);
  });
  await page.addStyleTag({ content: 'header { display: none !important; }' }); // the sticky nav would cover the page top
  const photo = await sheet.screenshot();
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Upload' }).click();
  // No separate photos button (teacher, 2026-11-01): the piece's own upload
  // takes the photo of its page and cuts the piece out.
  await expect(page.getByRole('button', { name: 'Add photos of the pages' })).toHaveCount(0);
  await page.locator('input[type=file]').first().setInputFiles({ name: 'page1.png', mimeType: 'image/png', buffer: photo });
  await expect(page.getByLabel('Added')).toHaveCount(1, { timeout: 20_000 });
  await page.screenshot({ path: `test-results/builder-scanned-${info.project.name}.png`, fullPage: true });
  expect(problems).toEqual([]);
});

test('Bowling: ten round ball pieces; a photo of a drawing is cut out; players pick a ball as their icon', async ({ page }, info) => {
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  await page.goto('/teacher/themes/bowling');
  await page.getByRole('tab', { name: 'Upload' }).click();
  await page.getByPlaceholder('Find a piece').fill('Ball 1');
  await expect(page.getByText('Team 1 icon')).toHaveCount(0);
  // A drawing photographed on gray paper, no template: a red ball.
  const photo = await page.evaluate(() => {
    const c = document.createElement('canvas'); c.width = 600; c.height = 500;
    const x = c.getContext('2d')!;
    x.fillStyle = '#d9d6cf'; x.fillRect(0, 0, 600, 500);
    x.fillStyle = '#d0302a'; x.beginPath(); x.arc(330, 240, 140, 0, Math.PI * 2); x.fill();
    return c.toDataURL('image/png').split(',')[1];
  });
  await page.locator('input[type=file]').first().setInputFiles({ name: 'ball.png', mimeType: 'image/png', buffer: Buffer.from(photo, 'base64') });
  await expect(page.getByLabel('Added')).toHaveCount(1, { timeout: 20_000 });
  // The cut ball is round with see-through corners, centered on the drawing.
  const px = await page.locator('img[src^="data:image/png"]').first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0);
    return { corner: x.getImageData(2, 2, 1, 1).data[3], middle: Array.from(x.getImageData(c.width / 2, c.height / 2, 1, 1).data) };
  });
  expect(px.corner).toBe(0);
  expect(px.middle[0]).toBeGreaterThan(150);
  expect(px.middle[1]).toBeLessThan(100);
  if (info.project.name === 'ipad-landscape') await page.screenshot({ path: 'test-results/bowling-ball-cut.png' });
  // The preview shows each screen the pieces appear on (teacher, 2026-11-01).
  const views = page.getByRole('tablist', { name: 'Preview screens' });
  await expect(views.getByRole('tab')).toHaveText(['Lane', 'Pick a ball', 'Power-ups']);
  await views.getByRole('tab', { name: 'Pick a ball' }).click();
  const picker = page.getByRole('group', { name: 'Preview: each team picks its ball' });
  await expect(picker.locator('img[src^="data:image"]').first()).toBeVisible();
  // Tap a ball: it shows big on white; tap again: back to the list (teacher, 2026-11-02).
  await picker.getByRole('button', { name: 'See picture 1 big' }).click();
  await expect(picker.getByRole('img', { name: 'Picture 1' })).toBeVisible();
  if (info.project.name === 'laptop') await page.screenshot({ path: 'test-results/preview-ball-big.png' });
  await picker.getByRole('button', { name: 'Back to the list' }).click();
  await expect(picker.getByRole('button', { name: 'Back to the list' })).toHaveCount(0);
  await views.getByRole('tab', { name: 'Power-ups' }).click();
  await expect(page.getByRole('img', { name: /^Preview of / })).toBeVisible();
  await views.getByRole('tab', { name: 'Lane' }).click();
  // Players pick a ball as their icon.
  await openSetup(page, '/games/bowling');
  for (let k = 0; k < 6 && !(await page.getByRole('button', { name: /^Pick a team picture for / }).first().isVisible()); k++) await page.getByRole('button', { name: 'Next', exact: true }).click();
  await page.getByRole('button', { name: /^Pick a team picture for / }).first().click();
  const balls = page.getByRole('group', { name: /^Pick a team picture for / }).locator('img');
  await expect(balls).toHaveCount(10);
  expect(await balls.first().getAttribute('src')).toContain('/classic/bowling/ball-0.webp');
  await page.screenshot({ path: `test-results/bowling-ball-icons-${info.project.name}.png` });
  expect(problems).toEqual([]);
});

// Hand-drawn pages photographed in a real room (teacher, 2026-11-01): a
// page full of dark marker, on a dark table, tilted or sideways, in uneven
// light. Each is found by its corner squares and cut to the piece's size.
for (const shot of [{ name: 'tilted', turn: 6, w: 1500, h: 2000 }, { name: 'sideways', turn: 88, w: 2000, h: 1500 }]) {
  test(`Bowling Lane: a ${shot.name} photo of a drawn template page is cut to the lane's size`, async ({ page }, info) => {
    test.skip(info.project.name !== 'laptop', 'image processing; one size is enough');
    test.setTimeout(90_000);
    const problems = watch(page);
    await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
    await page.goto('/teacher/themes/bowling/template');
    const sheet = page.locator('.template-sheet').nth(1); // page 2: the lane
    await expect(sheet).toBeVisible();
    // The student colors the whole lane outline in dark brown stripes.
    const box = await sheet.evaluate((svg) => {
      const ns = 'http://www.w3.org/2000/svg';
      const rects = [...svg.querySelectorAll('rect')].filter((r) => Number(r.getAttribute('width')) > 600);
      const o = rects[rects.length - 1];
      const x = Number(o.getAttribute('x')), y = Number(o.getAttribute('y')), w = Number(o.getAttribute('width')), h = Number(o.getAttribute('height'));
      for (let k = 0; k < 12; k++) {
        const r = document.createElementNS(ns, 'rect');
        r.setAttribute('x', String(x + (k * w) / 12)); r.setAttribute('y', String(y)); r.setAttribute('width', String(w / 12)); r.setAttribute('height', String(h));
        r.setAttribute('fill', k % 2 ? '#5a3214' : '#b5651d');
        svg.appendChild(r);
      }
      return { x, y, w, h };
    });
    expect(box.w).toBeGreaterThan(600);
    await page.addStyleTag({ content: 'header { display: none !important; }' });
    const scan = (await sheet.screenshot({ scale: 'css' })).toString('base64');
    // The "photo": the page on a dark wood table, turned, in uneven light.
    const photo = await page.evaluate(async ({ scan, shot }) => {
      const img = new Image(); img.src = `data:image/png;base64,${scan}`; await img.decode();
      const c = document.createElement('canvas'); c.width = shot.w; c.height = shot.h;
      const x = c.getContext('2d')!;
      x.fillStyle = '#3b2a1e'; x.fillRect(0, 0, c.width, c.height);
      x.save(); x.translate(c.width / 2, c.height / 2); x.rotate((shot.turn * Math.PI) / 180);
      const sc = (Math.min(c.width, c.height) * 0.86) / img.width;
      x.drawImage(img, (-img.width * sc) / 2, (-img.height * sc) / 2, img.width * sc, img.height * sc);
      x.restore();
      const g = x.createLinearGradient(0, 0, c.width, c.height); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
      x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
      return c.toDataURL('image/jpeg', 0.9).split(',')[1];
    }, { scan, shot });
    await page.goto('/teacher/themes/bowling');
    await page.getByRole('tab', { name: 'Upload' }).click();
    const chooser = page.waitForEvent('filechooser');
    await page.getByRole('button', { name: 'Add a picture for Lane' }).click();
    await (await chooser).setFiles({ name: 'lane.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(photo, 'base64') });
    await expect(page.getByLabel('Added')).toHaveCount(1, { timeout: 30_000 });
    const cut = await page.locator('img[src^="data:image"]').first().evaluate(async (img: HTMLImageElement) => {
      await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0);
      const at = (u: number, v: number) => Array.from(x.getImageData(Math.round(u * (c.width - 1)), Math.round(v * (c.height - 1)), 1, 1).data);
      return { w: c.width, h: c.height, corners: [at(0.02, 0.02), at(0.98, 0.02), at(0.98, 0.98), at(0.02, 0.98)] };
    });
    // The lane's own shape (800 x 1000), filled edge to edge with the drawing: no table, no page margin.
    expect(Math.abs(cut.w / cut.h - 0.8)).toBeLessThan(0.02);
    for (const [r, g, b] of cut.corners) expect(r > 70 && r > b + 25 && !(r > 225 && g > 225 && b > 225)).toBe(true);
    expect(problems).toEqual([]);
  });
}

// The pin page is a pin-shaped outline, and a drawn pin is cut out along it
// (teacher, 2026-11-02): even if the student colors past the outline.
test('Bowling Pin: the template page is pin-shaped and the cut follows the pin outline', async ({ page }, info) => {
  test.skip(info.project.name !== 'laptop', 'image processing; one size is enough');
  test.setTimeout(90_000);
  const problems = watch(page);
  await page.addInitScript(() => { if (!localStorage.getItem('gamify:settings')) localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })); });
  await page.goto('/teacher/themes/bowling/template');
  const sheet = page.locator('.template-sheet').nth(2); // page 3: the pin
  await expect(sheet.locator('path[fill="none"]')).toHaveCount(1);
  // The student colors the whole pin area red, even past the outline.
  await sheet.evaluate((svg) => {
    const ns = 'http://www.w3.org/2000/svg';
    const r = document.createElementNS(ns, 'rect');
    r.setAttribute('x', '450'); r.setAttribute('y', '440'); r.setAttribute('width', '800'); r.setAttribute('height', '1540'); r.setAttribute('fill', '#d0302a');
    svg.insertBefore(r, svg.querySelector('path[fill="none"]'));
  });
  await page.addStyleTag({ content: 'header { display: none !important; }' });
  const shot = await sheet.screenshot({ scale: 'css' });
  await page.goto('/teacher/themes/bowling');
  await page.getByRole('tab', { name: 'Upload' }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Add a picture for Pin' }).click();
  await (await chooser).setFiles({ name: 'pin.png', mimeType: 'image/png', buffer: shot });
  await expect(page.getByLabel('Added')).toHaveCount(1, { timeout: 30_000 });
  const px = await page.locator('img[src^="data:image/png"]').first().evaluate(async (img: HTMLImageElement) => {
    await img.decode();
    const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const x = c.getContext('2d', { willReadFrequently: true })!; x.drawImage(img, 0, 0);
    const a = (u: number, v: number) => x.getImageData(Math.round(u * (c.width - 1)), Math.round(v * (c.height - 1)), 1, 1).data[3];
    return { corner: a(0.03, 0.03), neck: a(0.15, 0.3), belly: a(0.5, 0.75), w: c.width, h: c.height };
  });
  // Outside the pin is see-through; the pin's body keeps the drawing.
  expect(px.corner).toBe(0);
  expect(px.neck).toBe(0);
  expect(px.belly).toBe(255);
  expect(px.w / px.h).toBeCloseTo(0.5, 1);
  expect(problems).toEqual([]);
});

test('Free plan: the Theme Builder works on Game Show only', async ({ page }) => {
  await page.goto('/teacher/themes/match-three');
  await expect(page.getByText('Designing this game comes with Plus and Pro.', { exact: false })).toBeVisible();
  // Only the note shows: nothing to fill in that couldn't be saved.
  await expect(page.getByLabel('Theme name')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Save theme' })).toHaveCount(0);
});

test('developer view opens with the owner PIN and links to the Theme Builder', async ({ page }) => {
  await page.goto('/owner');
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByText('Type the same PIN again', { exact: false })).toBeVisible();
  for (const d of '2468') await page.getByRole('button', { name: d, exact: true }).click();
  await expect(page.getByRole('region', { name: 'Tell Gamify reports' })).toBeVisible();
  await page.screenshot({ path: `test-results/owner-${test.info().project.name}.png`, fullPage: true });
  // Cards reorder and the layout is remembered.
  await page.getByRole('button', { name: 'Move Usage earlier' }).click();
  await page.getByRole('link', { name: 'Open the Theme Builder' }).click();
  await expect(page.getByRole('heading', { name: 'Library Themes' })).toBeVisible();
});

test('Theme Builder fits the screen: tabs and pages, no scrolling', async ({ page }, info) => {
  await page.goto('/teacher/themes/match-three');
  await page.addInitScript(() => localStorage.setItem('gamify:settings', JSON.stringify({ tier: 'pro' })));
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Upload' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByText(/^Page 1 of \d/)).toBeVisible();
  await page.getByRole('button', { name: 'Next page' }).click();
  await expect(page.getByText(/^Page 2 of \d/)).toBeVisible();
  await page.screenshot({ path: `test-results/builder-tabs-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  await page.getByRole('tab', { name: 'Colors' }).click();
  await page.screenshot({ path: `test-results/builder-colors-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
});

test('Download tab: blank printable pages and digital files; the Classic look is in the theme guide', async ({ page }, info) => {
  await page.goto('/teacher/themes/game-show');
  await page.getByRole('tab', { name: 'Download' }).click();
  await page.screenshot({ path: `test-results/builder-download-${info.project.name}.png` });
  expect(await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight - (document.getElementById('teacher-footer')?.getBoundingClientRect().height ?? 0))).toBeLessThanOrEqual(1);
  // Classic is seen, never handed out (teacher, 2026-10-28): no Classic files.
  await expect(page.getByRole('button', { name: 'Classic example (.zip)' })).toHaveCount(0);
  const wait = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Canva file (.pdf)' }).click();
  const file = await wait;
  expect(file.suggestedFilename()).toBe('game-show-theme-for-canva.pdf');
  // One PDF, a page per piece, each page the piece's own size (Canva reads 96 dpi: 0.75 pt a pixel).
  const pdf = (await (await import('node:fs/promises')).readFile(await file.path())).toString('latin1');
  expect(pdf.startsWith('%PDF-')).toBe(true);
  expect(pdf).toContain('/MediaBox [0 0 1440.00 810.00]');
  expect((pdf.match(/\/Type \/Page /g) ?? []).length).toBeGreaterThan(5);
  // The Classic look lives in the blog's theme guide, look-only.
  await expect(page.getByRole('link', { name: 'Classic example' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Theme guide' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /Theme Guide: Game Show/ })).toBeVisible();
});
