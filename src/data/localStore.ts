import type { DataStore } from './store';
import type { Classroom, QuestionLogEntry, QuestionSet, SetAssignment, Student } from './types';

// Browser-storage backend. Falls back to memory when localStorage is
// unavailable (private mode, quota), so the app still works for the session.
type Tables = {
  sets: QuestionSet[];
  classrooms: Classroom[];
  students: Student[];
  assignments: SetAssignment[];
  log: QuestionLogEntry[];
  settings: Record<string, unknown>;
};

const PREFIX = 'gamify:';
const empty = (): Tables => ({ sets: [], classrooms: [], students: [], assignments: [], log: [], settings: {} });

export function createLocalStore(storage: Storage | null = safeStorage()): DataStore {
  const memory = empty();

  function read<K extends keyof Tables>(key: K): Tables[K] {
    if (!storage) return memory[key];
    try {
      const raw = storage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as Tables[K]) : empty()[key];
    } catch {
      return memory[key];
    }
  }
  function write<K extends keyof Tables>(key: K, value: Tables[K]): void {
    memory[key] = value;
    try { storage?.setItem(PREFIX + key, JSON.stringify(value)); } catch { /* memory copy kept */ }
  }
  function upsert<T extends { id: string }>(list: T[], item: T): T[] {
    const i = list.findIndex((x) => x.id === item.id);
    return i === -1 ? [...list, item] : list.map((x, j) => (j === i ? item : x));
  }

  return {
    async listQuestionSets() { return read('sets'); },
    async getQuestionSet(id) { return read('sets').find((s) => s.id === id); },
    async saveQuestionSet(set) { write('sets', upsert(read('sets'), set)); },
    async deleteQuestionSet(id) {
      write('sets', read('sets').filter((s) => s.id !== id));
      write('assignments', read('assignments').filter((a) => a.setId !== id));
    },

    async listClassrooms() { return read('classrooms'); },
    async saveClassroom(c) { write('classrooms', upsert(read('classrooms'), c)); },
    async deleteClassroom(id) {
      // Deleting a class deletes everything in it (privacy, product plan 6.6).
      write('classrooms', read('classrooms').filter((c) => c.id !== id));
      write('students', read('students').filter((s) => s.classroomId !== id));
      write('assignments', read('assignments').filter((a) => a.classroomId !== id));
      write('log', read('log').filter((e) => e.classroomId !== id));
    },

    async listStudents(classroomId) { return read('students').filter((s) => s.classroomId === classroomId); },
    async saveStudent(s) { write('students', upsert(read('students'), s)); },
    async deleteStudent(id) {
      write('students', read('students').filter((s) => s.id !== id));
      write('assignments', read('assignments').filter((a) => a.studentId !== id));
      write('log', read('log').filter((e) => e.studentId !== id));
    },

    async listAssignments(classroomId) { return read('assignments').filter((a) => a.classroomId === classroomId); },
    async saveAssignment(a) { write('assignments', upsert(read('assignments'), a)); },
    async deleteAssignment(id) { write('assignments', read('assignments').filter((a) => a.id !== id)); },

    async logQuestion(entry) { write('log', [...read('log'), entry]); },
    async listQuestionLog(filter) {
      return read('log').filter((e) =>
        (!filter?.classroomId || e.classroomId === filter.classroomId) &&
        (!filter?.studentId || e.studentId === filter.studentId));
    },

    async getSetting<T>(key: string) { return read('settings')[key] as T | undefined; },
    async setSetting<T>(key: string, value: T) { write('settings', { ...read('settings'), [key]: value }); },
  };
}

function safeStorage(): Storage | null {
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}
