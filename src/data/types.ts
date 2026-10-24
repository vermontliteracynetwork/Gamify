// Gamify's data model (docs/product-plan.md, question engine and reports).
// Multiple choice only to start (decided 2026-10-24); other question kinds
// are added to the Question union later without changing existing data.

export interface MultipleChoiceQuestion {
  id: string;
  kind: 'mc';
  prompt: string;
  choices: string[];
  correctIndex: number;
  imageUrl?: string;
  imageAlt?: string;
}

export type Question = MultipleChoiceQuestion;

export interface QuestionSet {
  id: string;
  name: string;
  questions: Question[];
  ownerId: string;
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
}

export interface Student {
  id: string;
  classroomId: string;
  name: string;
  // Two picture ids for the K-1 friendly sign-in.
  picturePassword: [string, string];
}

// A set assigned to a whole class (studentId absent) or to one student.
export interface SetAssignment {
  id: string;
  classroomId: string;
  setId: string;
  studentId?: string;
  starred: boolean;
  startsOn?: string;
  endsOn?: string;
}

export type QuestionOutcome = 'right' | 'skipped' | 'left' | 'timeout';

// One row per question shown, in every game and mode (product plan 4C).
export interface QuestionLogEntry {
  id: string;
  at: string;
  classroomId?: string;
  studentId?: string;
  teamName?: string;
  gameId: string;
  mode: 'live' | 'share' | 'solo' | 'versus';
  setId?: string;
  prompt: string;
  answer: string;
  tries: string[];
  ms: number;
  outcome: QuestionOutcome;
}
