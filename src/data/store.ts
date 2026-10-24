import type { Classroom, QuestionLogEntry, QuestionSet, SetAssignment, Student } from './types';

// Every screen talks to this interface, never to storage directly. Local
// backend now (src/data/localStore.ts); a Supabase backend with the same
// shape comes in Stage 5.
export interface DataStore {
  listQuestionSets(): Promise<QuestionSet[]>;
  getQuestionSet(id: string): Promise<QuestionSet | undefined>;
  saveQuestionSet(set: QuestionSet): Promise<void>;
  deleteQuestionSet(id: string): Promise<void>;

  listClassrooms(): Promise<Classroom[]>;
  saveClassroom(classroom: Classroom): Promise<void>;
  deleteClassroom(id: string): Promise<void>;

  listStudents(classroomId: string): Promise<Student[]>;
  saveStudent(student: Student): Promise<void>;
  deleteStudent(id: string): Promise<void>;

  listAssignments(classroomId: string): Promise<SetAssignment[]>;
  saveAssignment(assignment: SetAssignment): Promise<void>;
  deleteAssignment(id: string): Promise<void>;

  logQuestion(entry: QuestionLogEntry): Promise<void>;
  listQuestionLog(filter?: { classroomId?: string; studentId?: string }): Promise<QuestionLogEntry[]>;

  getSetting<T>(key: string): Promise<T | undefined>;
  setSetting<T>(key: string, value: T): Promise<void>;
}
