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
