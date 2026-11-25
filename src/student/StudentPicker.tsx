import { useState } from 'react';
import { ArrowLeft } from '@phosphor-icons/react';
import CodeBoxes from '../ui/CodeBoxes';
import { data } from '../data';
import { supabase } from '../data/supabase';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { t } from '../i18n';
import Avatar from './Avatar';
import { avatarOf } from './pictures';

// Student sign-in (teacher, 2026-10-26): tap your avatar, then type your
// 4-digit PIN with the device's own number keyboard (no on-screen pad,
// teacher 2026-11-24). Used on the class sign-in page and when a
// student joins a game by link or code.
// On a student's own device the list comes from the cloud (names and
// pictures only) and the PIN is checked there (0008_game_codes.sql).
async function loadStudents(classroomId: string): Promise<{ list: Student[]; remote: boolean }> {
  const list = await data.listStudents(classroomId);
  if (list.length || !supabase) return { list, remote: false };
  const { data: rows } = await supabase.rpc('roster', { cid: classroomId });
  const remote = ((rows as { id: string; name: string; avatar: string }[] | null) ?? []).map((r): Student => ({ id: r.id, classroomId, name: r.name, avatar: r.avatar, picturePassword: [r.avatar, r.avatar] }));
  return { list: remote, remote: true };
}

export default function StudentPicker({ classroomId, onSignIn }: { classroomId: string; onSignIn: (s: Student) => void }) {
  const { value: loaded } = useAsync(() => loadStudents(classroomId), [classroomId]);
  const students = loaded?.list ?? [];
  const look = undefined; // sign-in picture designs removed (owner, 2026-11-25)
  const [who, setWho] = useState<Student | null>(null);
  const [digits, setDigits] = useState('');
  const [wrong, setWrong] = useState(false);

  function type(next: string) {
    if (!who || wrong) return;
    setDigits(next);
    if (next.length < 4) return;
    void (async () => {
      const ok = loaded?.remote ? !!(await supabase!.rpc('check_pin', { sid: who.id, pin: next })).data : next === who.pin;
      if (ok) window.setTimeout(() => onSignIn(who), 150);
      else { setWrong(true); window.setTimeout(() => { setDigits(''); setWrong(false); }, 700); }
    })();
  }

  if (!who) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 wide:grid-cols-4 gap-2 sm:gap-3 w-full max-w-5xl mx-auto">
        {students.map((s) => (
          <button key={s.id} type="button" onClick={() => setWho(s)} className="min-h-16 min-w-0 rounded-panel border-bold border-border bg-surface flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <Avatar avatar={avatarOf(s)} theme={look} size={48} />
            <span className="font-display text-lg sm:text-xl font-bold min-w-0 leading-tight">{s.name}</span>
          </button>
        ))}
        {students.length === 0 && <p className="font-bold col-span-full text-center">{t('arcade.noStudents')}</p>}
      </div>
    );
  }
  return (
    <div className="grid gap-4 justify-items-center">
      <Avatar avatar={avatarOf(who)} theme={look} size={96} />
      <p className="font-bold text-lg">{t('arcade.typePin')}</p>
      <CodeBoxes value={digits} onChange={type} label={t('arcade.typePin')} shake={wrong} size="lg" />
      <p className="min-h-6 font-bold" role="status" aria-live="polite">{wrong ? t('arcade.wrongPin') : ''}</p>
      <button type="button" onClick={() => { setWho(null); setDigits(''); }} className="min-h-12 px-5 rounded-pill border-std border-border bg-surface-2 font-bold inline-flex items-center gap-2"><ArrowLeft weight="bold" size={20} />{t('arcade.notMe')}</button>
    </div>
  );
}
