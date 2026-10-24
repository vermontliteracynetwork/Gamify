import { describe, expect, it } from 'vitest';
import { GAMES, manifestProblems } from './registry';
import type { GameManifest } from './types';

const sample: GameManifest = {
  id: 'peg-drop', name: 'Peg Drop', description: 'Answer, then drop a ball.', modes: ['solo'], questionKinds: ['mc'],
  themePieces: [{ id: 'ball', label: 'Ball', width: 96, height: 96, hint: 'A round ball' }],
  rounds: { label: 'Rounds', min: 3, max: 10, default: 5 }, hasCpu: true,
};

describe('game registry', () => {
  it('registered games are valid', () => expect(manifestProblems(GAMES)).toEqual([]));
  it('catches duplicate ids and bad defaults', () => {
    const bad = { ...sample, rounds: { label: 'Rounds', min: 3, max: 10, default: 12 } };
    expect(manifestProblems([sample, bad])).toEqual(['Duplicate game id: peg-drop', 'peg-drop: Rounds default is outside its range']);
  });
});
