import type { MultipleChoiceQuestion } from './types';

// Teacher CSV import for multiple-choice question sets. Columns: Question #,
// Question Text, Answer 1, Answer 2, Answer 3, Answer 4, Correct Answer #.
// The header row is skipped by position, so small header renames in a
// teacher's copy don't break import. Row errors are reported, not fatal.

export const CSV_HEADERS = ['Question #', 'Question Text', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Correct Answer #'];

export function generateSampleCsv(): string {
  const rows = [
    CSV_HEADERS,
    ['1', 'Fill in the blank: c__t', 'oa', 'ai', 'ea', 'a', '4'],
    ['2', 'Which word rhymes with "night"?', 'light', 'net', 'nut', 'not', '1'],
    ['3', 'What is the opposite of "ancient"?', 'modern', 'old', 'antique', '', '1'],
  ];
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

function csvEscape(field: string): string {
  return /[",\r\n]/.test(field) ? `"${field.replace(/"/g, '""')}"` : field;
}

// Small RFC 4180 parser: quoted fields with commas, escaped quotes, CRLF.
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else inQuotes = false;
      } else field += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (c !== '\r') field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

export interface CsvRowError { row: number; message: string }

export function csvRowsToQuestions(rows: string[][], makeId: (i: number) => string): { questions: MultipleChoiceQuestion[]; errors: CsvRowError[] } {
  const questions: MultipleChoiceQuestion[] = [];
  const errors: CsvRowError[] = [];

  rows.slice(1).forEach((r, i) => {
    const rowNum = i + 2; // header row + 1-based numbering
    const [, promptRaw, a1, a2, a3, a4, correctRaw] = r;
    const prompt = (promptRaw ?? '').trim();
    const choices = [a1, a2, a3, a4].map((a) => (a ?? '').trim()).filter(Boolean);
    const correctNum = parseInt(correctRaw ?? '', 10);

    if (!prompt) { errors.push({ row: rowNum, message: 'Missing question text.' }); return; }
    if (choices.length < 2) { errors.push({ row: rowNum, message: 'Needs at least 2 answers.' }); return; }
    if (!correctNum || correctNum < 1 || correctNum > choices.length) {
      errors.push({ row: rowNum, message: `Correct Answer # must be between 1 and ${choices.length}.` });
      return;
    }
    questions.push({ id: makeId(i), kind: 'mc', prompt, choices, correctIndex: correctNum - 1 });
  });

  return { questions, errors };
}
