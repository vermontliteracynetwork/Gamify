import { openChannel, type Channel } from './channel';

// Share Mirror (development plan Stage 6): a view-only copy of the big-screen
// question on one student's own device, with their own zoom, contrast and
// read-aloud. The teacher's device sends what the class sees; nothing goes
// back. Same-device tabs today; across devices once the cloud connects.
export type MirrorMsg =
  | { t: 'q'; prompt: string; choices: string[]; player: string; imageUrl?: string; imageAlt?: string }
  | { t: 'result'; picked: number | null; correct: number; right: boolean }
  | { t: 'clear' }
  | { t: 'hello' };

const KEY = 'gamify:mirror';
export const getMirrorCode = () => { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } };
export function setMirrorCode(code: string) { try { if (code) sessionStorage.setItem(KEY, code); else sessionStorage.removeItem(KEY); } catch { /* this tab only */ } }

const channels = new Map<string, Channel<MirrorMsg>>();
const chan = (code: string) => { let c = channels.get(code); if (!c) { c = openChannel<MirrorMsg>(`mirror-${code}`); c.listen((m) => { if (m.t === 'hello') last.forEach((x) => c!.send(x)); }); channels.set(code, c); } return c; };

// The teacher's side: every Share question goes out to the mirror, and the
// last one is sent again when a mirror opens late.
let last: MirrorMsg[] = [];
export function mirrorSend(msg: MirrorMsg) {
  const code = getMirrorCode();
  if (!code) return;
  last = msg.t === 'q' ? [msg] : msg.t === 'result' ? [...last.slice(0, 1), msg] : [];
  chan(code).send(msg);
}

export function listenMirror(code: string, fn: (m: MirrorMsg) => void): () => void {
  const c = openChannel<MirrorMsg>(`mirror-${code}`);
  const off = c.listen(fn);
  c.send({ t: 'hello' });
  return () => { off(); c.close(); };
}
