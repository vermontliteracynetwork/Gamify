// The teacher's 4-digit PIN that unlocks the accommodations (Teacher) tab.
// Stored as a SHA-256 hash, never as the digits themselves.
export const PIN_KEY = 'teacher-pin-hash';

export function isValidPin(pin: string): boolean {
  return /^\d{4}$/.test(pin);
}

export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(`gamify-teacher-pin:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
