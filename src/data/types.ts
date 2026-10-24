import type { SetDetails } from './setDetails';
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

export interface QuestionSet extends SetDetails {
  id: string;
  name: string;
  questions: Question[];
  ownerId: string;
  visibility: 'private' | 'public';
  createdAt: string;
  updatedAt: string;
}

export type PlayMode = 'live' | 'share' | 'solo' | 'versus';
export const ALL_MODES: PlayMode[] = ['live', 'share', 'solo', 'versus'];

export interface Classroom {
  id: string;
  name: string;
  ownerId: string;
  createdAt: string;
  // Play modes students in this class see (all plans). Missing = all four.
  allowedModes?: PlayMode[];
  // The Theme Builder design its sign-in pictures use (missing = built-in).
  signInThemeId?: string;
  // Letters-only code students type on the join page to reach sign-in.
  joinCode?: string;
}

export interface Student {
  id: string;
  classroomId: string;
  name: string;
  // Two picture ids for the K-1 friendly sign-in.
  picturePassword: [string, string];
  // Narrows the class's modes for this one student (never widens them).
  allowedModes?: PlayMode[];
  // Question screen accommodations the teacher set (behind the teacher PIN):
  // read-first seconds, tries, shuffle and tools. Applied while they play.
  accommodations?: {
    readFirstSeconds?: number;
    triesPerQuestion?: 1 | 2 | 3 | 4;
    shuffleAnswers?: boolean;
    tools?: { listen: boolean; calculator: boolean; scratchpad: boolean; highlighter: boolean; timesTable: boolean };
  };
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

// A "Tell Gamify" report to the developer: bugs, game problems, ideas.
// Student reports never carry a name.
export interface FeedbackReport {
  id: string;
  at: string;
  kind: 'bug' | 'problem' | 'idea';
  details: string;
  where: string;
  role: 'teacher' | 'student';
  device: string;
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
