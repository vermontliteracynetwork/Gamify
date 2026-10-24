// Turns a picked image file into a small data URL (longest side <= max px)
// so question pictures stay light in browser storage. Cloud uploads replace
// this in Stage 5.
export async function imageFileToDataUrl(file: File, max = 800): Promise<string> {
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
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}
