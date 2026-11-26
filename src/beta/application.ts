// The formal beta application (owner, 2026-11-26: "we need to have a formal
// form page for beta sign up then"; "we need to make sure people arent signing
// up for the beta test to play and then not do anything, but i also want to
// make sure that we get people signed up even if they dont want to beta test
// offically"). The page is /beta/apply; this file holds its choices, the text
// it sends to the owner inbox (feedback kind 'beta', at most 1000 characters)
// and the reading and the simple score the owner sees on /owner. The score
// only helps her read; nobody is ever rejected by it.

// What we ask of every tester, as listed on /beta (betaPage.ask.*), with how
// long each takes. /beta and the application both read this list.
export const BETA_ASKS: { key: string; minutes: string }[] = [
  { key: 'setup', minutes: '15' }, { key: 'weekly', minutes: '10-20 a week' }, { key: 'questions', minutes: '15-30 each' }, { key: 'theme', minutes: '20+' }, { key: 'lesson', minutes: '10' }, { key: 'play', minutes: '10-20' },
  { key: 'checkin', minutes: '3-5' }, { key: 'surveys', minutes: '1-3' }, { key: 'report', minutes: '1' },
];

export const ROLES = ['teacher', 'specialist', 'homeschool', 'coop', 'other'] as const;
export const GRADE_BANDS = ['Pre-K', 'K-2', '3-5', '6-8', '9-12', 'Adult'] as const;
export const DEVICES = ['tablets', 'chromebooks', 'computers', 'board', 'phones'] as const;
export const HOW_OFTEN = ['1-2', '3+'] as const;
export const REASON_MIN = 30;

export const US_STATES = ['Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming', 'Outside the US'];

export type Role = typeof ROLES[number];
export interface BetaApplication {
  name: string; email: string; role: Role; school: string; state: string;
  grades: string[]; subjects: string; classSize: string;
  devices: string[]; often: string; games: string[]; network: string;
  asks: string[]; reason: string; agree: boolean;
}

export const emptyApplication = (): BetaApplication => ({
  name: '', email: '', role: 'teacher', school: '', state: '', grades: [], subjects: '', classSize: '',
  devices: [], often: '', games: [], network: '', asks: [], reason: '', agree: false,
});

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

// The steps and what each one needs before Next works.
export type Problem = 'name' | 'email' | 'school' | 'state' | 'grades' | 'devices' | 'often' | 'asks' | 'reason' | 'agree';
export const STEP_FIELDS: Problem[][] = [['name', 'email', 'school', 'state', 'grades'], ['devices', 'often'], ['asks'], ['reason', 'agree'], []];
export function problems(a: BetaApplication): Problem[] {
  const out: Problem[] = [];
  if (!a.name.trim()) out.push('name');
  if (!validEmail(a.email)) out.push('email');
  if (!a.school.trim()) out.push('school');
  if (!a.state) out.push('state');
  if (a.grades.length === 0) out.push('grades');
  if (a.devices.length === 0) out.push('devices');
  if (!a.often) out.push('often');
  if (BETA_ASKS.some((x) => !a.asks.includes(x.key))) out.push('asks');
  if (a.reason.trim().length < REASON_MIN) out.push('reason');
  if (!a.agree) out.push('agree');
  return out;
}
export const stepProblems = (a: BetaApplication, step: number) => problems(a).filter((p) => STEP_FIELDS[step]?.includes(p));

// The text for the owner inbox: one "Label: value" line each, the score
// facts before the free text so the 1000-character limit never cuts them.
const HEADER = 'Beta test request';
const clean = (s: string, max: number) => s.replace(/\s+/g, ' ').trim().slice(0, max);
export function applicationText(a: BetaApplication, labels: { role: string; devices: string[]; often: string }): string {
  const lines = [
    HEADER,
    `Name: ${clean(a.name, 80)}`,
    `Email: ${clean(a.email, 120)}`,
    `Role: ${labels.role}`,
    `School: ${clean(a.school, 100)}`,
    `State: ${a.state}`,
    `Grades: ${a.grades.join(', ')}`,
    `Class size: ${clean(a.classSize, 6) || 'not given'}`,
    `Subjects: ${clean(a.subjects, 80) || 'not given'}`,
    `Devices: ${labels.devices.join(', ')}`,
    `Can play: ${labels.often}`,
    `Games: ${a.games.join(', ') || 'not given'}`,
    `Commitments: ${BETA_ASKS.filter((x) => a.asks.includes(x.key)).length}/${BETA_ASKS.length}${a.agree ? ', agreed' : ''}`,
    `Network notes: ${clean(a.network, 120) || 'none'}`,
  ];
  const head = lines.join('\n');
  const room = 1000 - head.length - '\nWhy: '.length;
  return `${head}\nWhy: ${clean(a.reason, Math.max(0, room))}`;
}

/** Reads an application back from the inbox text; null for anything else (old one-line requests too). */
export function readApplication(details: string): Record<string, string> | null {
  if (!details.startsWith(`${HEADER}\n`)) return null;
  const out: Record<string, string> = {};
  for (const line of details.split('\n').slice(1)) {
    const i = line.indexOf(': ');
    if (i > 0) out[line.slice(0, i)] = line.slice(i + 2);
  }
  return out;
}

// Free email services: fine for homeschool families, worth a look for a
// classroom teacher (it may still be right; it is a flag, never a rejection).
const FREE_MAIL = /@(gmail|yahoo|hotmail|outlook|aol|icloud|me|live|msn|proton|protonmail)\./i;

export interface Score { points: number; of: number; signals: { key: string; ok: boolean }[] }
/**
 * Three plain signals that a tester will follow through. Information only.
 * No beta filters beyond her approval (owner, 2026-11-26): no games or
 * commitment signal, the reason bar is the form's own minimum, and either
 * answer to how often passes.
 */
export function scoreApplication(f: Record<string, string>): Score {
  const why = f['Why'] ?? '';
  const homeschool = /homeschool/i.test(f['Role'] ?? '');
  const signals = [
    { key: 'reason', ok: why.length >= REASON_MIN },
    { key: 'often', ok: !!(f['Can play'] ?? '').trim() },
    { key: 'email', ok: homeschool || !FREE_MAIL.test(f['Email'] ?? '') },
  ];
  return { points: signals.filter((s) => s.ok).length, of: signals.length, signals };
}
