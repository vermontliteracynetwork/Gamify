// What a file upload may be (teacher, 2026-11-20: "check the file type and
// size and store uploads where they can never be executed"). Pictures are
// checked here, then redrawn onto a canvas and saved as a fresh PNG or JPEG,
// so nothing inside the original file (a script in an SVG, hidden data) is
// ever kept or run. Nothing is stored on a server as an executable file.
export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/heic', 'image/heif', 'image/avif', 'image/bmp'];
export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_CSV_BYTES = 2 * 1024 * 1024;

export function checkImageFile(file: File): void {
  if (!IMAGE_TYPES.includes(file.type.toLowerCase())) throw new FriendlyError('Pick a picture file (PNG, JPG, GIF or WebP).');
  if (file.size > MAX_IMAGE_BYTES) throw new FriendlyError('That picture is too big. Pick one under 15 MB.');
}

export function checkCsvFile(file: File): string | null {
  if (!/\.csv$/i.test(file.name) && !/^(text\/csv|text\/plain|application\/vnd\.ms-excel)$/i.test(file.type)) return 'Pick a .csv file.';
  if (file.size > MAX_CSV_BYTES) return 'That file is too big. Pick one under 2 MB.';
  return null;
}

// Errors written for people. Anything else (a browser decoding message) is
// never shown raw: the user sees one plain sentence instead (2026-11-21).
export class FriendlyError extends Error {}
export const friendlyMessage = (e: unknown, fallback = 'That picture could not be read. Try another file, like a PNG or JPG.') =>
  e instanceof FriendlyError ? e.message : fallback;
