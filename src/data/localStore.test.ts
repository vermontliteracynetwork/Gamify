import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalStore } from './localStore';
import type { DataStore } from './store';

let store: DataStore;
beforeEach(() => { localStorage.clear(); store = createLocalStore(localStorage); });

const now = '2026-10-24T00:00:00.000Z';

describe('local store', () => {
  it('saves, updates and lists question sets', async () => {
    const set = { id: 's1', name: 'Fractions', questions: [], ownerId: 't1', visibility: 'private' as const, createdAt: now, updatedAt: now };
    await store.saveQuestionSet(set);
    await store.saveQuestionSet({ ...set, name: 'Fractions 2' });
    expect((await store.listQuestionSets()).map((s) => s.name)).toEqual(['Fractions 2']);
  });

  it('deleting a classroom deletes its students, assignments and log', async () => {
    await store.saveClassroom({ id: 'c1', name: 'Room 12', ownerId: 't1', createdAt: now });
    await store.saveStudent({ id: 'st1', classroomId: 'c1', name: 'Ava', picturePassword: ['cat', 'sun'] });
    await store.saveAssignment({ id: 'a1', classroomId: 'c1', setId: 's1', starred: false });
    await store.logQuestion({ id: 'l1', at: now, classroomId: 'c1', studentId: 'st1', gameId: 'peg-drop', mode: 'solo', prompt: 'q', answer: 'a', tries: ['a'], ms: 1000, outcome: 'right' });
    await store.deleteClassroom('c1');
    expect(await store.listStudents('c1')).toEqual([]);
    expect(await store.listAssignments('c1')).toEqual([]);
    expect(await store.listQuestionLog({ classroomId: 'c1' })).toEqual([]);
  });

  it('works without storage (memory fallback)', async () => {
    const mem = createLocalStore(null);
    await mem.setSetting('sound', 3);
    expect(await mem.getSetting<number>('sound')).toBe(3);
  });
});
