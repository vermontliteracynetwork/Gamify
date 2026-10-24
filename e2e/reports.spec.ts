import { test, expect } from '@playwright/test';

test('reports group the question log, show the most common wrong answer, and download a CSV', async ({ page }, info) => {
  const problems: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') problems.push(m.text()); });
  await page.addInitScript(() => {
    if (localStorage.getItem('gamify:log')) return;
    const now = new Date().toISOString();
    localStorage.setItem('gamify:classrooms', JSON.stringify([{ id: 'c1', name: 'Room 9', ownerId: 'local-teacher', createdAt: now, joinCode: 'BCDFG' }]));
    localStorage.setItem('gamify:students', JSON.stringify([{ id: 'ava', classroomId: 'c1', name: 'Ava', picturePassword: ['cat', 'dog'] }, { id: 'ben', classroomId: 'c1', name: 'Ben', picturePassword: ['sun', 'moon'] }]));
    const row = (studentId: string, prompt: string, tries: string[], right: boolean) => ({ id: Math.random().toString(), at: now, classroomId: 'c1', studentId, gameId: 'star-quiz', mode: 'solo', prompt, answer: 'cat', tries, ms: 3000, outcome: right ? 'right' : 'skipped' });
    localStorage.setItem('gamify:log', JSON.stringify([
      row('ava', 'Which is an animal?', ['cat'], true), row('ava', 'Which word rhymes with hat?', ['dog', 'cat'], true),
      row('ben', 'Which word rhymes with hat?', ['dog'], false), row('ben', 'Which word rhymes with hat?', ['dog'], false),
    ]));
  });
  await page.goto('/teacher/reports');
  await expect(page.getByRole('rowheader', { name: 'Ava' })).toBeVisible();
  await expect(page.getByRole('rowheader', { name: 'Ben' })).toBeVisible();
  await page.getByRole('tab', { name: 'Question' }).click();
  const row = page.getByRole('row', { name: /Which word rhymes with hat\?/ });
  await expect(row).toContainText('33%');
  await expect(row).toContainText('dog');
  await page.screenshot({ path: `test-results/reports-${info.project.name}.png`, fullPage: true });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  expect((await download).suggestedFilename()).toMatch(/^gamify-report-question-/);
  expect(problems).toEqual([]);
});
