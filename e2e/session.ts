// The signed-in teacher every test starts as (public-page tests sign out),
// for the port this run serves on (E2E_PORT, default 4173). The quicker
// game pace key is test-only: the app never sets it (src/engine/pace.ts).
export const E2E_PORT = Number(process.env.E2E_PORT ?? 4173);

export const teacherSession = {
  cookies: [],
  origins: [{
    origin: `http://localhost:${E2E_PORT}`,
    localStorage: [
      { name: 'gamify:teacher-session', value: JSON.stringify({ name: 'Test Teacher', at: '2026-10-24T00:00:00.000Z' }) },
      { name: 'gamify:e2e-pace', value: '0.6' },
    ],
  }],
};
