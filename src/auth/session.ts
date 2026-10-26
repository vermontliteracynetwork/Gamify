import { useEffect, useState } from 'react';
import { useSession as useStudentSession } from '../student/session';

// The teacher's sign-in. Until cloud accounts (Stage 5) it is a local
// session on this device; the log in page sets it. Kept in local storage so
// a teacher stays signed in on their own computer.
const KEY = 'gamify:teacher-session';
const EVENT = 'gamify-teacher-session';
export interface TeacherSession { name: string; at: string; username?: string }

export function getTeacher(): TeacherSession | null {
  try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as TeacherSession) : null; } catch { return null; }
}
export function setTeacher(s: TeacherSession | null) {
  try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* memory only */ }
  window.dispatchEvent(new Event(EVENT));
}
export function useTeacher(): TeacherSession | null {
  const [s, setS] = useState(getTeacher);
  useEffect(() => {
    const on = () => setS(getTeacher());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return s;
}

// Anyone allowed into the games: a signed-in teacher or a signed-in student.
export function useSignedIn() {
  const teacher = useTeacher();
  const student = useStudentSession();
  return { teacher, student, any: !!teacher || !!student };
}

// Class join codes: letters only, no vowels (so no words), easy to read.
const LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
export function newJoinCode(taken: string[], rand: () => number = Math.random): string {
  for (;;) {
    const code = Array.from({ length: 5 }, () => LETTERS[Math.floor(rand() * LETTERS.length)]).join('');
    if (!taken.includes(code)) return code;
  }
}
