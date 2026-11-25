// A cloud call that never answers (a dropped connection, a stuck sign-in
// lock across many open tabs) must never leave a blank page or a dead button
// (owner, 2026-11-25: the live site's game page stayed empty and "Open the
// live lobby" did nothing). Rejects after `ms` so the caller's fallback runs.
export function withTimeout<T>(p: Promise<T>, ms = 6000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error('timed out')), ms);
    p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); });
  });
}
