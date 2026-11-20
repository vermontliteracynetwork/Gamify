// Password checks (teacher, 2026-11-20 security list: password rules and a
// leak check). Long enough, not a well-known password, and not in a known
// data breach. The breach check uses k-anonymity: only the first 5
// characters of the password's SHA-1 hash leave the device, never the
// password or the full hash. If the check can't run, sign up still works.
const COMMON = new Set(['password', 'password1', 'password123', '12345678', '123456789', '1234567890', 'qwerty123', 'qwertyuiop', 'iloveyou', 'abc12345', 'letmein1', 'welcome1', 'teacher1', 'teacher123', 'gamify123', 'school123', 'classroom', 'sunshine1', 'football1', 'baseball1', '11111111', '00000000', 'passw0rd']);

export const isCommonPassword = (p: string) => COMMON.has(p.trim().toLowerCase());

export async function isLeakedPassword(p: string): Promise<boolean | null> {
  if (typeof navigator !== 'undefined' && navigator.webdriver) return null;
  try {
    const bytes = new Uint8Array(await crypto.subtle.digest('SHA-1', new TextEncoder().encode(p)));
    const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hex.slice(0, 5)}`, { headers: { 'Add-Padding': 'true' } });
    if (!res.ok) return null;
    const rest = hex.slice(5);
    return (await res.text()).split('\n').some((line) => { const [suffix, count] = line.trim().split(':'); return suffix === rest && Number(count) > 0; });
  } catch { return null; }
}
