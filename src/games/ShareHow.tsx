import { useState } from 'react';
import { makeGameCode } from '../data/gameCodes';
import { ChoiceRow } from '../ui/fields';
import { Button } from '../ui/kit';

// After Share is picked (teacher, 2026-11-23): play on this same device, or
// share a join code so the game opens on another shared device with the same
// question set.
export default function ShareHow({ gameId, setId }: { gameId: string; setId: string }) {
  const [how, setHow] = useState<'here' | 'code'>('here');
  const [code, setCode] = useState<string | null>(null);
  // The button shows it is working and never fails silently (owner, 2026-11-26:
  // "make a join code doesnt work on click"): the cloud can take seconds.
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const make = async () => {
    setBusy(true); setFailed(false);
    try { setCode((await makeGameCode(gameId, setId, 'play')).code); } catch (e) { console.warn('join code not made', e); setFailed(true); } finally { setBusy(false); }
  };
  return (
    <div className="grid gap-3 justify-items-center text-center">
      <ChoiceRow label="How do you share?" value={how} onChange={setHow} options={[{ value: 'here', label: 'Same device' }, { value: 'code', label: 'Share a join code' }]} />
      {/* A code carries its question set, so it waits until one is picked
          (a code made with no set sent players to an empty game). */}
      {how === 'code' && !setId && <p className="font-bold">Pick your questions first: come back to this step and tap Make a join code.</p>}
      {how === 'code' && !!setId && (code
        ? <p className="font-bold">Join code: <span className="font-display text-3xl tracking-widest">{code}</span><br /><span className="text-sm text-muted">Players go to the Join page and type it.</span></p>
        : <span className="grid justify-items-center gap-1"><Button variant="main" disabled={busy} aria-busy={busy} onClick={() => void make()}>{busy ? 'Making your code...' : 'Make a join code'}</Button>
            {failed && <span role="alert" className="text-sm font-bold">That did not work. Check the internet and tap again.</span>}</span>)}
    </div>
  );
}
