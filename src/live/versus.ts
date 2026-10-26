import { openChannel } from './channel';

// Versus on two devices (development plan Stage 6): two players, each on
// their own device, one game. Same-device tabs today (BroadcastChannel);
// the same messages go across devices once the cloud connects.
export type VersusMsg =
  | { t: 'vjoin'; name: string }
  | { t: 'vstart'; names: [string, string]; first: 0 | 1 }
  | { t: 'vmove'; seat: 0 | 1; col: number }
  | { t: 'vbye' };

export interface VersusLink { send(m: VersusMsg): void; listen(fn: (m: VersusMsg) => void): () => void; close(): void }
export function openVersus(code: string): VersusLink {
  return openChannel<VersusMsg>(`versus-${code}`);
}
