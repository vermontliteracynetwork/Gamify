import { data } from '../data';
import { supabase } from '../data/supabase';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { t } from '../i18n';
import Avatar from './Avatar';
import { avatarOf } from './pictures';

// Student sign-in: tap your name and picture (owner, 2026-11-26: no PIN
// sign-in at all). Used on the class sign-in page and when a student joins a
// game by link or code. On a student's own device the list comes from the
// cloud (names and pictures only).
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
  // No PIN sign-in at all (owner, 2026-11-26): tap your name and picture.
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 wide:grid-cols-4 gap-2 sm:gap-3 w-full max-w-5xl mx-auto">
      {students.map((s) => (
        <button key={s.id} type="button" onClick={() => onSignIn(s)} className="min-h-16 min-w-0 rounded-panel border-bold border-border bg-surface flex items-center gap-2 sm:gap-3 p-2 sm:p-3 text-left active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
          <Avatar avatar={avatarOf(s)} theme={look} size={48} />
          <span className="font-display text-lg sm:text-xl font-bold min-w-0 leading-tight">{s.name}</span>
        </button>
      ))}
      {students.length === 0 && <p className="font-bold col-span-full text-center">{t('arcade.noStudents')}</p>}
    </div>
  );
}
