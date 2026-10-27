import type { SupabaseClient } from '@supabase/supabase-js';
import type { Tier } from '../config';
import type { Grade, Subject } from './setDetails';
import type { DataStore } from './store';
import type { Classroom, FeedbackReport, QuestionLogEntry, QuestionSet, SetAssignment, Student } from './types';
import { normId, toUuid } from './supabase';

// Cloud backend (Stage 5): the same DataStore shape as localStore, saved in
// Gamify's Supabase project. Row level security (supabase/migrations) keeps
// each teacher to their own rows; this file only maps fields to columns.
/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const setRow = (s: QuestionSet): Row => ({
  id: toUuid(s.id), name: s.name, visibility: s.visibility, questions: s.questions, created_at: s.createdAt,
  subject: s.subject ?? null, grade_from: s.grades?.[0] ?? null, grade_to: s.grades?.[1] ?? null,
  tags: s.tags ?? [], standards: s.standards ?? [], no_standard: !!s.noStandard, cover: s.cover ?? null,
});
const fromSet = (r: Row): QuestionSet => ({
  id: r.id, name: r.name, questions: r.questions ?? [], ownerId: r.owner_id, visibility: r.visibility,
  createdAt: r.created_at, updatedAt: r.updated_at, subject: (r.subject ?? undefined) as Subject | undefined,
  grades: r.grade_from && r.grade_to ? [r.grade_from as Grade, r.grade_to as Grade] : undefined,
  tags: r.tags ?? [], standards: r.standards ?? [], noStandard: r.no_standard || undefined, cover: r.cover ?? undefined,
});

const classRow = (c: Classroom): Row => ({
  id: toUuid(c.id), name: c.name, created_at: c.createdAt, allowed_modes: c.allowedModes ?? null,
  join_code: c.joinCode ?? null, sign_in_theme: c.signInThemeId ?? null, student_design: !!c.studentDesign,
});
const fromClass = (r: Row): Classroom => ({
  id: r.id, name: r.name, ownerId: r.owner_id, createdAt: r.created_at, allowedModes: r.allowed_modes ?? undefined,
  joinCode: r.join_code ?? undefined, signInThemeId: r.sign_in_theme ?? undefined, studentDesign: r.student_design || undefined,
});

const studentRow = (s: Student): Row => ({
  id: toUuid(s.id), classroom_id: toUuid(s.classroomId), name: s.name, picture_password: s.picturePassword,
  allowed_modes: s.allowedModes ?? null, settings: { accommodations: s.accommodations ?? null, avatar: s.avatar ?? null, pin: s.pin ?? null },
});
const fromStudent = (r: Row): Student => ({
  id: r.id, classroomId: r.classroom_id, name: r.name, picturePassword: r.picture_password as [string, string],
  allowedModes: r.allowed_modes ?? undefined, accommodations: r.settings?.accommodations ?? undefined,
  avatar: r.settings?.avatar ?? undefined, pin: r.settings?.pin ?? undefined,
});

const assignmentRow = (a: SetAssignment): Row => ({
  id: toUuid(a.id), classroom_id: toUuid(a.classroomId), set_id: normId(a.setId), student_id: a.studentId ? toUuid(a.studentId) : null,
  starred: a.starred, starts_on: a.startsOn ?? null, ends_on: a.endsOn ?? null, theme_ids: a.themeIds ?? null,
});
const fromAssignment = (r: Row): SetAssignment => ({
  id: r.id, classroomId: r.classroom_id, setId: r.set_id, studentId: r.student_id ?? undefined, starred: r.starred,
  startsOn: r.starts_on ?? undefined, endsOn: r.ends_on ?? undefined, themeIds: r.theme_ids ?? undefined,
});

const logRow = (e: QuestionLogEntry): Row => ({
  id: toUuid(e.id), at: e.at, classroom_id: e.classroomId ? toUuid(e.classroomId) : null, student_id: e.studentId ? normId(e.studentId) : null,
  team_name: e.teamName ?? null, game_id: e.gameId, mode: e.mode, set_id: e.setId ? normId(e.setId) : null,
  prompt: e.prompt, answer: e.answer, tries: e.tries, ms: Math.round(e.ms), outcome: e.outcome,
});
const fromLog = (r: Row): QuestionLogEntry => ({
  id: r.id, at: r.at, classroomId: r.classroom_id ?? undefined, studentId: r.student_id ?? undefined, teamName: r.team_name ?? undefined,
  gameId: r.game_id, mode: r.mode, setId: r.set_id ?? undefined, prompt: r.prompt, answer: r.answer, tries: r.tries ?? [], ms: r.ms, outcome: r.outcome,
});

// Class codes are unique across every teacher in the cloud.
const LETTERS = 'BCDFGHJKLMNPQRSTVWXZ';
const freshCode = () => Array.from({ length: 5 }, () => LETTERS[Math.floor(Math.random() * LETTERS.length)]).join('');

export type CloudStore = DataStore & { logMany(entries: QuestionLogEntry[]): Promise<void> };

export function createCloudStore(db: SupabaseClient): CloudStore {
  async function uid(): Promise<string> {
    const { data } = await db.auth.getSession();
    if (!data.session) throw new Error('Not signed in');
    return data.session.user.id;
  }
  function ok<T>(res: { data: T; error: { message: string } | null }): T {
    if (res.error) throw new Error(res.error.message);
    return res.data;
  }
  const rows = (res: { data: Row[] | null; error: { message: string } | null }): Row[] => ok(res) ?? [];
  async function settings(): Promise<Record<string, unknown>> {
    const row = ok(await db.from('teacher_settings').select('data').eq('owner_id', await uid()).maybeSingle());
    return (row?.data as Record<string, unknown>) ?? {};
  }

  return {
    async listQuestionSets() {
      return rows(await db.from('question_sets').select('*').eq('owner_id', await uid()).order('created_at')).map(fromSet);
    },
    async getQuestionSet(id) {
      const row = ok(await db.from('question_sets').select('*').eq('id', toUuid(id)).maybeSingle());
      return row ? fromSet(row) : undefined;
    },
    async saveQuestionSet(set) { ok(await db.from('question_sets').upsert(setRow(set))); },
    async deleteQuestionSet(id) {
      ok(await db.from('set_assignments').delete().eq('set_id', normId(id)));
      ok(await db.from('question_sets').delete().eq('id', toUuid(id)));
    },

    async listClassrooms() {
      return rows(await db.from('classrooms').select('*').eq('owner_id', await uid()).order('created_at')).map(fromClass);
    },
    async saveClassroom(c) {
      let row = classRow(c);
      for (let i = 0; ; i++) {
        const { error } = await db.from('classrooms').upsert(row);
        if (!error) return;
        if (error.code !== '23505' || i >= 4) throw new Error(error.message);
        row = { ...row, join_code: freshCode() };
      }
    },
    // Students, assignments and the class's log go with it (on delete cascade).
    async deleteClassroom(id) { ok(await db.from('classrooms').delete().eq('id', toUuid(id))); },

    async listStudents(classroomId) {
      return rows(await db.from('students').select('*').eq('classroom_id', toUuid(classroomId)).order('created_at')).map(fromStudent);
    },
    async saveStudent(s) { ok(await db.from('students').upsert(studentRow(s))); },
    async deleteStudent(id) {
      ok(await db.from('question_log').delete().eq('student_id', normId(id)));
      ok(await db.from('students').delete().eq('id', toUuid(id)));
    },

    async listAssignments(classroomId) {
      return rows(await db.from('set_assignments').select('*').eq('classroom_id', toUuid(classroomId)).order('created_at')).map(fromAssignment);
    },
    async saveAssignment(a) { ok(await db.from('set_assignments').upsert(assignmentRow(a))); },
    async deleteAssignment(id) { ok(await db.from('set_assignments').delete().eq('id', toUuid(id))); },

    // A lost answer row never stops a game.
    async logQuestion(entry) { await db.from('question_log').insert(logRow(entry)); },
    async logMany(entries) {
      for (let i = 0; i < entries.length; i += 500) ok(await db.from('question_log').upsert(entries.slice(i, i + 500).map(logRow)));
    },
    async listQuestionLog(filter) {
      let q = db.from('question_log').select('*');
      if (filter?.classroomId) q = q.eq('classroom_id', toUuid(filter.classroomId));
      if (filter?.studentId) q = q.eq('student_id', normId(filter.studentId));
      return rows(await q.order('at').limit(20000)).map(fromLog);
    },

    // Anyone can send a report; only the owner can read them.
    async sendFeedback(r) {
      ok(await db.from('feedback_reports').insert({ id: toUuid(r.id), at: r.at, kind: r.kind, details: r.details.slice(0, 1000), where_at: r.where.slice(0, 300), role: r.role, device: r.device.slice(0, 300) }));
    },
    async listFeedback() {
      return rows(await db.from('feedback_reports').select('*').order('at')).map((r: Row): FeedbackReport => ({
        id: r.id, at: r.at, kind: r.kind, details: r.details, where: r.where_at ?? '', role: r.role, device: r.device ?? '', ...(r.reply ? { reply: r.reply, repliedAt: r.replied_at } : {}),
      }));
    },

    // The plan comes from the teacher's profile, which only billing (and the
    // owner in the dashboard) can change, never the teacher's own browser.
    async getSetting<T>(key: string) {
      if (key === 'tier' || key === 'plan-info') {
        // select('*') so this works before 0011 adds plan_until.
        const p = ok(await db.from('profiles').select('*').eq('id', await uid()).maybeSingle()) as { tier?: string; plan_until?: string | null; plan_note?: string | null } | null;
        // A plan from an access code or the owner ends on its date: then Free.
        const ended = !!p?.plan_until && Date.parse(p.plan_until) < Date.now();
        const tier = ended ? 'free' : p?.tier === 'school' ? 'pro' : p?.tier;
        if (key === 'plan-info') return ({ tier, until: ended ? null : p?.plan_until ?? null, note: ended ? null : p?.plan_note ?? null }) as T;
        return (tier as Tier | undefined) as T | undefined;
      }
      return (await settings())[key] as T | undefined;
    },
    async setSetting<T>(key: string, value: T) {
      if (key === 'tier') return;
      const owner = await uid();
      ok(await db.from('teacher_settings').upsert({ owner_id: owner, data: { ...(await settings()), [key]: value } }));
    },
  };
}
