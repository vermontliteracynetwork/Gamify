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
  return (
    <div className="grid gap-3 justify-items-center text-center">
      <ChoiceRow label="How do you share?" value={how} onChange={setHow} options={[{ value: 'here', label: 'Same device' }, { value: 'code', label: 'Share a join code' }]} />
      {how === 'code' && (code
        ? <p className="font-bold">Join code: <span className="font-display text-3xl tracking-widest">{code}</span><br /><span className="text-sm text-muted">Players go to the Join page and type it.</span></p>
        : <Button variant="main" onClick={async () => setCode((await makeGameCode(gameId, setId, 'play')).code)}>Make a join code</Button>)}
    </div>
  );
}
