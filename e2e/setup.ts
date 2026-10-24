import { expect, type Page } from '@playwright/test';

// Every game opens on its cover welcome screen, then the theme screen; this
// goes past both to the setup pages.
export async function openSetup(page: Page, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: 'Set up and play' }).click();
  await expect(page.getByRole('heading', { name: 'Pick a theme' })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText(/^Step 1 of \d+:/)).toBeVisible();
}

// Next through the remaining setup pages, then Play.
export async function finishSetup(page: Page) {
  for (;;) {
    const next = page.getByRole('button', { name: 'Next', exact: true });
    if (!(await next.isVisible())) break;
    await next.click();
  }
  await page.getByRole('button', { name: 'Play', exact: true }).click();
}
