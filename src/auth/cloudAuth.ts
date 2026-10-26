import { createCloudStore } from '../data/cloudStore';
import { createLocalStore } from '../data/localStore';
import { supabase } from '../data/supabase';
import { normalizeUsername, signUpProblems, type SignUpProblem } from './accounts';
import { getTeacher, setTeacher } from './session';

// Cloud teacher accounts (Stage 5). Log in is by username: /api/login looks
// up the email on the server (emails are never sent to a browser) and hands
// back a session. Sign up is Supabase Auth with the username in metadata
// (0005_usernames.sql copies it onto the profile).
export const cloudOn = !!supabase;
export type LogInResult = 'ok' | 'wrong' | 'confirm' | 'offline';

export async function cloudLogIn(username: string, password: string): Promise<LogInResult> {
  const res = await fetch('/api/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: normalizeUsername(username), password }),
  }).catch(() => null);
  if (!res) return 'offline';
  if (res.status === 401) return 'wrong';
  if (res.status === 403) return 'confirm';
  if (!res.ok) return 'offline';
  const tokens = (await res.json()) as { access_token: string; refresh_token: string };
  const { error } = await supabase!.auth.setSession(tokens);
  if (error) return 'offline';
  await enterCloud();
  return 'ok';
}

export async function cloudSignUp(f: { username: string; email: string; password: string; confirm: string }): Promise<SignUpProblem[] | 'ok' | 'checkEmail' | 'offline'> {
  const problems = signUpProblems(f, []);
  if (problems.length) return problems;
  const u = normalizeUsername(f.username);
  const free = await supabase!.rpc('username_free', { u });
  if (free.error) return 'offline';
  if (!free.data) return ['usernameTaken'];
  const { data, error } = await supabase!.auth.signUp({
    email: f.email.trim(), password: f.password,
    options: { data: { username: u }, emailRedirectTo: `${window.location.origin}/login` },
  });
  if (error) return /registered|exists/i.test(error.message) ? ['emailTaken'] : 'offline';
  if (!data.session) return 'checkEmail';
  await enterCloud();
  return 'ok';
}

// Signed in to the cloud: move anything saved on this device up, then open
// the teacher's session.
async function enterCloud() {
  const { data } = await supabase!.auth.getSession();
  const session = data.session;
  if (!session) return;
  const { data: p } = await supabase!.from('profiles').select('username, display_name').eq('id', session.user.id).maybeSingle();
  const username = (p?.username as string | null) ?? (session.user.user_metadata?.username as string | undefined) ?? '';
  await moveDeviceWork();
  setTeacher({ name: (p?.display_name as string | null) || username, username, at: new Date().toISOString() });
}

let moving: Promise<void> | null = null;
function moveDeviceWork(): Promise<void> {
  moving ??= (async () => {
    const local = createLocalStore();
    const cloud = createCloudStore(supabase!);
    const sets = await local.listQuestionSets();
    const classes = await local.listClassrooms();
    const log = await local.listQuestionLog();
    if (!sets.length && !classes.length && !log.length) return;
    try {
      for (const s of sets) await cloud.saveQuestionSet(s);
      for (const c of classes) {
        await cloud.saveClassroom(c);
        for (const s of await local.listStudents(c.id)) await cloud.saveStudent(s);
        for (const a of await local.listAssignments(c.id)) await cloud.saveAssignment(a);
      }
      await cloud.logMany(log);
      for (const k of ['sets', 'classrooms', 'students', 'assignments', 'log']) localStorage.removeItem(`gamify:${k}`);
    } catch {
      // The device copy stays; the move runs again at the next log in.
    }
  })().finally(() => { moving = null; });
  return moving;
}

export function startCloudAuth() {
  if (!supabase) return;
  void supabase.auth.getSession().then(({ data }) => {
    // A teacher still signed in to an on-device account logs in to the cloud.
    if (!data.session && getTeacher()) setTeacher(null);
    if (data.session && !getTeacher()) void enterCloud();
  });
  // Opening the confirm-your-email link signs the teacher in.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' && !getTeacher()) setTimeout(() => void enterCloud(), 0);
  });
  // Logging out of Gamify logs out of the cloud too.
  window.addEventListener('gamify-teacher-session', () => { if (!getTeacher()) void supabase!.auth.signOut(); });
}
