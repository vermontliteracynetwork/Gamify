// Teacher question-set import/storage. Platform-level (not Plink-oh-specific)
// per docs/platform-spec.md's data model -- any future game module can reuse
// this. No backend yet, so sets persist to localStorage (per browser/device
// only) -- documented plainly in the import UI, not hidden.
//
// CSV schema is adapted from Blooket's own import template (a teacher sent
// us a real copy to match): Question #, Question Text, Answer 1, Answer 2,
// Answer 3 (Optional), Answer 4 (Optional), Correct Answer(s) (Only include
// Answer #). We drop Blooket's per-question "Time Limit" column -- Gamify's
// timer is a whole-game option, not per-question, and keeping a column that
// silently does nothing would be a worse teacher experience than not having
// it at all.

const STORAGE_KEY = 'gamify:question-sets';

export const CSV_HEADERS = ['Question #', 'Question Text', 'Answer 1', 'Answer 2', 'Answer 3', 'Answer 4', 'Correct Answer #'];

export function generateSampleCsv() {
  const rows = [
    CSV_HEADERS,
    ['1', 'Fill in the blank: c__t', 'oa', 'ai', 'ea', 'a', '4'],
    ['2', 'Which word rhymes with "night"?', 'light', 'net', 'nut', 'not', '1'],
    ['3', 'What is the opposite of "ancient"?', 'modern', 'old', 'antique', '', '1'],
  ];
  return rows.map((r) => r.map(csvEscape).join(',')).join('\r\n');
}

function csvEscape(field) {
  const s = String(field ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Minimal RFC4180-ish CSV parser -- handles quoted fields containing commas
// and escaped quotes, which a naive `split(',')` breaks on. No dependency
// needed for this scale of file.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\r') {
      // skip, \n handles the line break
    } else if (c === '\n') {
      row.push(field); field = '';
      rows.push(row); row = [];
    } else {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

// Converts parsed CSV rows (first row assumed to be a header, skipped by
// column position rather than exact header text so minor renames in a
// teacher's copy of the template don't break import) into Gamify
// multiple-choice questions. Returns { questions, errors } -- errors are
// row-level and non-fatal, so teachers can fix specific rows without
// losing the rest of a valid import.
export function csvRowsToQuestions(rows) {
  const dataRows = rows.slice(1); // drop header row
  const questions = [];
  const errors = [];

  dataRows.forEach((row, i) => {
    const rowNum = i + 2; // +1 for header, +1 for 1-based row numbering
    const [, promptRaw, a1, a2, a3, a4, correctRaw] = row;
    const prompt = (promptRaw || '').trim();
    const options = [a1, a2, a3, a4].map((a) => (a || '').trim()).filter(Boolean);
    const correctNum = parseInt(correctRaw, 10);

    if (!prompt) { errors.push({ row: rowNum, message: 'Missing question text.' }); return; }
    if (options.length < 2) { errors.push({ row: rowNum, message: 'Needs at least 2 answers.' }); return; }
    if (!correctNum || correctNum < 1 || correctNum > options.length) {
      errors.push({ row: rowNum, message: `Correct Answer # must be between 1 and ${options.length}.` });
      return;
    }

    questions.push({
      id: `import-${Date.now()}-${i}`,
      type: 'multiple-choice',
      prompt,
      options,
      correctIndex: correctNum - 1,
    });
  });

  return { questions, errors };
}

export function loadCustomQuestionSets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomQuestionSets(sets) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sets));
  } catch {
    // localStorage unavailable (private mode, quota) -- import still works
    // for the current session, it just won't persist across reloads.
  }
}

export function addQuestionSet(name, questions) {
  const sets = loadCustomQuestionSets();
  const set = { id: `qs-${Date.now()}`, name, questions, createdAt: new Date().toISOString() };
  saveCustomQuestionSets([...sets, set]);
  return set;
}

export function deleteQuestionSet(id) {
  saveCustomQuestionSets(loadCustomQuestionSets().filter((s) => s.id !== id));
}
