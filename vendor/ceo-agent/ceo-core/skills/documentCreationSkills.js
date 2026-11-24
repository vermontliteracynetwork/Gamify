/**
 * Original document-creation skills: DOCX, PDF, and spreadsheet generation.
 *
 * Scoped and structured with reference to the public `anthropics/skills`
 * repo's docx/pdf/xlsx skill conventions (a narrow, validated input ->
 * generated-file-output boundary, one skill per format) — those skills are
 * source-available, not open-source, so no code from them is used here.
 * This is an original implementation against the same problem, built on
 * open (MIT/Apache-2.0) npm libraries: `docx`, `pdf-lib`, `exceljs`.
 *
 * All three write the generated file through lib/uploadStore.js (the same
 * scoped, non-world-readable store issue #44's upload infra uses), so the
 * result is downloadable via GET /api/uploads?fileId=<id>&download=1 or
 * attachable to a chat message the same way an uploaded file is.
 */

// Gamify: docx, pdf-lib and exceljs are not installed, so they load only
// when a document skill runs (and that skill then reports it cannot).
const docx = () => require('docx');
const pdf = () => require('pdf-lib');
const excel = () => require('exceljs');
const { saveUpload } = require('../../lib/uploadStore');

const PDF_PAGE_SIZE = [612, 792]; // US Letter, points
const PDF_MARGIN = 50;
const PDF_BODY_SIZE = 12;
const PDF_LINE_HEIGHT = 16;
const PDF_TITLE_SIZE = 20;

/** Splits body text into paragraphs on blank lines, dropping empty ones. */
function splitParagraphs(content) {
  return String(content)
    .split(/\r?\n\s*\r?\n/)
    .map(p => p.trim())
    .filter(Boolean);
}

/** Word-wraps a single paragraph of text to fit within maxWidth at the given font/size. */
function wrapParagraph(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function slugify(title) {
  const slug = String(title || 'document')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'document';
}

/**
 * Registers the docx/pdf/spreadsheet generation skills onto a SkillRegistry.
 * @param {import('../SkillRegistry').SkillRegistry} registry
 */
function registerDocumentCreationSkills(registry) {
  registry.register('generate_docx', {
    capability: 'document_generation_docx',
    description: 'Generates a downloadable .docx file from a title and body text.',
    inputSchema: {
      title: { type: 'string', required: true },
      content: { type: 'string', required: true },
      filename: { type: 'string', required: false },
    },
    outputSchema: {
      fileId: { type: 'string', required: true },
      filename: { type: 'string', required: true },
      size: { type: 'number', required: true },
      mimeType: { type: 'string', required: true },
    },
    permissions: { requiresAgentAssignment: true },
    handler: async ({ title, content, filename }) => {
      const paragraphs = splitParagraphs(content);
      const doc = new (docx().Document)({
        sections: [{
          children: [
            new (docx().Paragraph)({ text: title, heading: docx().HeadingLevel.TITLE }),
            ...paragraphs.map(text => new (docx().Paragraph)({ children: [new (docx().TextRun)(text)] })),
          ],
        }],
      });
      const buffer = await docx().Packer.toBuffer(doc);
      const metadata = saveUpload({
        filename: `${filename ? slugify(filename) : slugify(title)}.docx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      return { fileId: metadata.fileId, filename: metadata.filename, size: metadata.size, mimeType: metadata.mimeType };
    },
  });

  registry.register('generate_pdf', {
    capability: 'document_generation_pdf',
    description: 'Generates a downloadable .pdf file from a title and body text.',
    inputSchema: {
      title: { type: 'string', required: true },
      content: { type: 'string', required: true },
      filename: { type: 'string', required: false },
    },
    outputSchema: {
      fileId: { type: 'string', required: true },
      filename: { type: 'string', required: true },
      size: { type: 'number', required: true },
      mimeType: { type: 'string', required: true },
    },
    permissions: { requiresAgentAssignment: true },
    handler: async ({ title, content, filename }) => {
      const pdfDoc = await pdf().PDFDocument.create();
      const font = await pdfDoc.embedFont(pdf().StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(pdf().StandardFonts.HelveticaBold);
      const maxWidth = PDF_PAGE_SIZE[0] - PDF_MARGIN * 2;

      let page = pdfDoc.addPage(PDF_PAGE_SIZE);
      let y = PDF_PAGE_SIZE[1] - PDF_MARGIN;

      for (const titleLine of wrapParagraph(title, boldFont, PDF_TITLE_SIZE, maxWidth)) {
        page.drawText(titleLine, { x: PDF_MARGIN, y, size: PDF_TITLE_SIZE, font: boldFont, color: pdf().rgb(0, 0, 0) });
        y -= PDF_TITLE_SIZE + 6;
      }
      y -= 10;

      for (const paragraph of splitParagraphs(content)) {
        for (const line of wrapParagraph(paragraph, font, PDF_BODY_SIZE, maxWidth)) {
          if (y < PDF_MARGIN) {
            page = pdfDoc.addPage(PDF_PAGE_SIZE);
            y = PDF_PAGE_SIZE[1] - PDF_MARGIN;
          }
          page.drawText(line, { x: PDF_MARGIN, y, size: PDF_BODY_SIZE, font, color: pdf().rgb(0, 0, 0) });
          y -= PDF_LINE_HEIGHT;
        }
        y -= PDF_LINE_HEIGHT / 2;
      }

      const bytes = await pdfDoc.save();
      const metadata = saveUpload({
        filename: `${filename ? slugify(filename) : slugify(title)}.pdf`,
        buffer: Buffer.from(bytes),
        mimeType: 'application/pdf',
      });
      return { fileId: metadata.fileId, filename: metadata.filename, size: metadata.size, mimeType: metadata.mimeType };
    },
  });

  registry.register('generate_spreadsheet', {
    capability: 'document_generation_spreadsheet',
    description: 'Generates a downloadable .xlsx spreadsheet from headers and rows.',
    inputSchema: {
      title: { type: 'string', required: true },
      rows: { type: 'array', required: true },
      headers: { type: 'array', required: false },
      filename: { type: 'string', required: false },
    },
    outputSchema: {
      fileId: { type: 'string', required: true },
      filename: { type: 'string', required: true },
      size: { type: 'number', required: true },
      mimeType: { type: 'string', required: true },
    },
    permissions: { requiresAgentAssignment: true },
    handler: async ({ title, rows, headers, filename }) => {
      if (!rows.every(row => Array.isArray(row))) {
        throw new TypeError('rows must be an array of arrays.');
      }
      const workbook = new (excel().Workbook)();
      const sheetName = String(title).slice(0, 31) || 'Sheet1'; // Excel's 31-char sheet name limit
      const sheet = workbook.addWorksheet(sheetName);
      if (Array.isArray(headers) && headers.length > 0) {
        sheet.addRow(headers).font = { bold: true };
      }
      for (const row of rows) sheet.addRow(row);

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
      const metadata = saveUpload({
        filename: `${filename ? slugify(filename) : slugify(title)}.xlsx`,
        buffer,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      return { fileId: metadata.fileId, filename: metadata.filename, size: metadata.size, mimeType: metadata.mimeType };
    },
  });
}

module.exports = { registerDocumentCreationSkills };
