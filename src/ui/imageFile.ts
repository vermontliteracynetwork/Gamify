// Turns a picked image file into a small data URL (longest side <= max px)
// so question pictures stay light in browser storage. Cloud uploads replace
// this in Stage 5.
// `keepClear`: keep see-through parts (a PNG); otherwise white goes behind
// them and it is saved as a smaller JPEG (never a black background).
export async function imageFileToDataUrl(file: File, max = 800, keepClear = false): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Pick a picture file (PNG, JPG, GIF or WebP).');
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('That picture could not be opened.'));
      el.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const c = canvas.getContext('2d')!;
    if (!keepClear) { c.fillStyle = '#ffffff'; c.fillRect(0, 0, canvas.width, canvas.height); }
    c.drawImage(img, 0, 0, canvas.width, canvas.height);
    return keepClear ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
