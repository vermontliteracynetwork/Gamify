// Teacher accounts by username (teacher, 2026-10-26): sign up with email,
// password, confirm password and a username; log in with username and
// password. Until the cloud database is connected (Stage 5) accounts live
// on this device, with the password stored only as a salted hash. In the
// cloud, the same checks run and a server endpoint turns the username into
// the email for sign-in, so emails are never shown to anyone.
const KEY = 'gamify:accounts';

export interface Account { username: string; email: string; salt: string; hash: string; createdAt: string }
export type SignUpProblem = 'username' | 'usernameTaken' | 'email' | 'password' | 'confirm';

export const USERNAME_RULE = /^[a-z0-9._]{3,20}$/;
export const normalizeUsername = (u: string) => u.trim().toLowerCase();

function read(): Account[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Account[]; } catch { return []; }
}
function write(list: Account[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* memory only */ }
}

async function hashPassword(password: string, salt: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${salt}:${password}`));
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Every problem with a sign up form, so the form can show them all at once.
export function signUpProblems(f: { username: string; email: string; password: string; confirm: string }, taken = read().map((a) => a.username)): SignUpProblem[] {
  const out: SignUpProblem[] = [];
  const u = normalizeUsername(f.username);
  if (!USERNAME_RULE.test(u)) out.push('username');
  else if (taken.includes(u)) out.push('usernameTaken');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) out.push('email');
  if (f.password.length < 8) out.push('password');
  if (f.confirm !== f.password) out.push('confirm');
  return out;
}

export async function signUp(f: { username: string; email: string; password: string; confirm: string }): Promise<SignUpProblem[] | Account> {
  const problems = signUpProblems(f);
  if (problems.length) return problems;
  const salt = crypto.randomUUID();
  const account: Account = { username: normalizeUsername(f.username), email: f.email.trim(), salt, hash: await hashPassword(f.password, salt), createdAt: new Date().toISOString() };
  write([...read(), account]);
  return account;
}

export async function logIn(username: string, password: string): Promise<Account | null> {
  const account = read().find((a) => a.username === normalizeUsername(username));
  if (!account) return null;
  return (await hashPassword(password, account.salt)) === account.hash ? account : null;
}
