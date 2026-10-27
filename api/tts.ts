// A natural reading voice (development plan Stage 9). Only the words on the
// screen come here (questions, answers, directions), never a student's name
// or answers, and nothing is stored. GET, so the same words are served from
// the CDN cache after the first time.
// Vercel env: OPENAI_API_KEY. Without it the app uses the device's voice.
const KEY = process.env.OPENAI_API_KEY;

export async function GET(request: Request): Promise<Response> {
  if (!KEY) return new Response('setup', { status: 503 });
  const url = new URL(request.url);
  // Only Gamify's own pages may ask (stops other sites using it).
  const from = request.headers.get('referer') ?? '';
  if (from && !from.startsWith(`${url.protocol}//${url.host}`)) return new Response('forbidden', { status: 403 });
  const text = (url.searchParams.get('t') ?? '').trim().slice(0, 400);
  if (!text) return new Response('empty', { status: 400 });
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'tts-1', voice: 'nova', input: text, response_format: 'mp3' }),
  });
  if (!res.ok || !res.body) return new Response('voice', { status: 502 });
  return new Response(res.body, { headers: { 'Content-Type': 'audio/mpeg', 'Cache-Control': 'public, max-age=86400, s-maxage=31536000, immutable' } });
}
