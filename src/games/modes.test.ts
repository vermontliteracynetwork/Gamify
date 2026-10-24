import { describe, expect, it } from 'vitest';
import type { Classroom, Student } from '../data/types';
import { visibleModes } from './modes';
import type { GameManifest } from './types';

const game = { id: 'peg-drop', modes: ['live', 'share', 'solo', 'versus'] } as GameManifest;
const room: Classroom = { id: 'c', name: 'Room 12', ownerId: 't', createdAt: '', allowedModes: ['solo', 'versus'] };
const ava: Student = { id: 's', classroomId: 'c', name: 'Ava', picturePassword: ['cat', 'sun'], allowedModes: ['solo'] };

describe('play mode switches', () => {
  it('shows every mode by default', () => expect(visibleModes(game)).toEqual(['live', 'share', 'solo', 'versus']));
  it('limits to the class choice', () => expect(visibleModes(game, room)).toEqual(['solo', 'versus']));
  it('a student setting narrows further, never widens', () => {
    expect(visibleModes(game, room, ava)).toEqual(['solo']);
    expect(visibleModes(game, { ...room, allowedModes: ['share'] }, ava)).toEqual([]);
  });
  it('never shows a mode the game lacks', () => expect(visibleModes({ ...game, modes: ['solo'] }, { ...room, allowedModes: ['share', 'solo'] })).toEqual(['solo']));
});
