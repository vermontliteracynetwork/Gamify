import { useEffect, useMemo, useState } from 'react';
import { data } from '../data';
import { useMySets } from '../data/hooks';
import { LIBRARY } from '../data/library';
import type { PlayMode, SetAssignment, Student } from '../data/types';
import type { PoolSet } from '../engine/picker';

// Who is signed in to the student Arcade on this tab. Kept per tab (session
// storage) so a shared iPad forgets the student when the tab closes.
export interface ArcadeSession { classroomId: string; studentId: string; name: string }
const KEY = 'gamify:arcade-session';
const EVENT = 'gamify-arcade-session';

export function getSession(): ArcadeSession | null {
  try { const raw = sessionStorage.getItem(KEY); return raw ? (JSON.parse(raw) as ArcadeSession) : null; } catch { return null; }
}
export function setSession(s: ArcadeSession | null) {
  try { if (s) sessionStorage.setItem(KEY, JSON.stringify(s)); else sessionStorage.removeItem(KEY); } catch { /* this tab only */ }
  window.dispatchEvent(new Event(EVENT));
}
export function useSession(): ArcadeSession | null {
  const [s, setS] = useState(getSession);
  useEffect(() => {
    const on = () => setS(getSession());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);
  return s;
}

// Assignments that apply to a student today: the class's and their own.
export function activeAssignments(all: SetAssignment[], studentId: string, today = new Date().toISOString().slice(0, 10)): SetAssignment[] {
  return all.filter((a) => (!a.studentId || a.studentId === studentId) && (!a.startsOn || a.startsOn <= today) && (!a.endsOn || a.endsOn >= today));
}

// The signed-in student's record, their question pool and the play modes
// they may see (the class's, narrowed by their own).
export function useArcade(session: ArcadeSession | null) {
  const { value: mine = [] } = useMySets();
  const [assignments, setAssignments] = useState<SetAssignment[]>([]);
  const [student, setStudent] = useState<Student>();
  const [classModes, setClassModes] = useState<PlayMode[] | undefined>();
  useEffect(() => {
    if (!session) return;
    void data.listAssignments(session.classroomId).then(setAssignments);
    void data.listStudents(session.classroomId).then((list) => setStudent(list.find((s) => s.id === session.studentId)));
    void data.listClassrooms().then((list) => setClassModes(list.find((c) => c.id === session.classroomId)?.allowedModes));
  }, [session]);
  const pool = useMemo<PoolSet[]>(() => {
    if (!session) return [];
    const sets = [...mine, ...LIBRARY];
    return activeAssignments(assignments, session.studentId)
      .map((a) => ({ set: sets.find((s) => s.id === a.setId)!, starred: a.starred }))
      .filter((p) => p.set);
  }, [session, assignments, mine]);
  const modes = (student?.allowedModes ?? classModes ?? ['live', 'share', 'solo', 'versus']).filter((m) => !classModes || classModes.includes(m));
  return { student, pool, modes };
}

// A game's question pool: the signed-in student's assigned sets, or the set
// picked in the game's setup when nobody is signed in.
export function useGamePool(picked: PoolSet[]) {
  const session = useSession();
  const { pool } = useArcade(session);
  const assigned = !!session && pool.length > 0;
  return { pool: assigned ? pool : picked, assigned, classroomId: session?.classroomId, studentId: session?.studentId };
}

// Lays a signed-in student's accommodations over this device's settings.
export function SessionSupports({ setOverrides }: { setOverrides: (o: object) => void }) {
  const session = useSession();
  const { student } = useArcade(session);
  useEffect(() => { setOverrides(session ? student?.accommodations ?? {} : {}); }, [session, student, setOverrides]);
  return null;
}
