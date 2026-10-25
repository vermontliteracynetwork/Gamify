import { describe, expect, it } from 'vitest';
import { csvRowsToQuestions, generateSampleCsv, parseCsv } from './csv';

describe('csv', () => {
  it('parses quoted fields with commas and quotes', () => {
    expect(parseCsv('a,"b, c","say ""hi"""\r\n1,2,3')).toEqual([['a', 'b, c', 'say "hi"'], ['1', '2', '3']]);
  });

  it('round-trips the sample file into 3 questions', () => {
    const { questions, errors } = csvRowsToQuestions(parseCsv(generateSampleCsv()), (i) => `q${i}`);
    expect(errors).toEqual([]);
    expect(questions).toHaveLength(3);
    expect(questions[2]).toMatchObject({ choices: ['modern', 'old', 'antique'], correctIndex: 0 });
  });

  it('reports bad rows without losing good ones', () => {
    const rows = parseCsv('h\n1,,a,b,,,1\n2,Q,a,,,,1\n3,Q,a,b,,,5\n4,Good,a,b,,,2');
    const { questions, errors } = csvRowsToQuestions(rows, (i) => `q${i}`);
    expect(errors.map((e) => e.row)).toEqual([2, 3, 4]);
    expect(questions.map((q) => q.prompt)).toEqual(['Good']);
  });
});

describe('download and copy', () => {
  it('a downloaded set uploads again unchanged', async () => {
    const { questionsToCsv, questionsToTsv } = await import('./csv');
    const qs = [{ id: 'a', kind: 'mc' as const, prompt: 'Say "hi", please', choices: ['yes', 'no, thanks'], correctIndex: 1 }];
    const back = csvRowsToQuestions(parseCsv(questionsToCsv(qs)), (i) => `n${i}`).questions;
    expect(back.map(({ prompt, choices, correctIndex }) => ({ prompt, choices, correctIndex }))).toEqual([{ prompt: 'Say "hi", please', choices: ['yes', 'no, thanks'], correctIndex: 1 }]);
    expect(questionsToTsv(qs).split('\n')[1]).toBe('1\tSay "hi", please\tyes\tno, thanks\t\t\t2');
  });
});

