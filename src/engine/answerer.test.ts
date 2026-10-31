import { describe, expect, it } from 'vitest';
import { data } from '../data';
import { setAnswerer } from './answerer';

describe('rotating answerer in the question log', () => {
  it('a Share team row names the student who answered', async () => {
    setAnswerer('Owls', 'Maya');
    await data.logQuestion({ id: 'log_t1', at: new Date().toISOString(), teamName: 'Owls', gameId: 'game-show', mode: 'share', prompt: 'Q?', answer: 'A', tries: [], ms: 0, outcome: 'right' });
    setAnswerer('Owls', null);
    await data.logQuestion({ id: 'log_t2', at: new Date().toISOString(), teamName: 'Owls', gameId: 'game-show', mode: 'share', prompt: 'Q2?', answer: 'A', tries: [], ms: 0, outcome: 'right' });
    const rows = await data.listQuestionLog();
    expect(rows.find((r) => r.id === 'log_t1')?.teamName).toBe('Owls: Maya');
    expect(rows.find((r) => r.id === 'log_t2')?.teamName).toBe('Owls');
  });
});
