import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Backspace } from '@phosphor-icons/react';
import { data } from '../data';
import { supabase } from '../data/supabase';
import { useAsync } from '../data/hooks';
import type { Student } from '../data/types';
import { t } from '../i18n';
import { useMadeThemes } from '../theme/made';
import Avatar from './Avatar';
import { avatarOf } from './pictures';

// Student sign-in (teacher, 2026-10-26): tap your avatar, then type your
// 4-digit PIN on big number keys. Used on the class sign-in page and when a
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
  const { value: classes = [] } = useAsync(() => data.listClassrooms());
  const { themes } = useMadeThemes();
  const look = themes.find((th) => th.id === classes.find((c) => c.id === classroomId)?.signInThemeId);
  const [who, setWho] = useState<Student | null>(null);
  const [digits, setDigits] = useState('');
  const [wrong, setWrong] = useState(false);

  function press(d: string) {
    if (!who || digits.length >= 4) return;
    const next = digits + d;
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {students.map((s) => (
          <button key={s.id} type="button" onClick={() => setWho(s)} className="min-h-20 rounded-panel border-[2.5px] border-border bg-surface flex items-center gap-3 p-3 text-left active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>
            <Avatar avatar={avatarOf(s)} theme={look} size={56} />
            <span className="font-display text-xl font-bold">{s.name}</span>
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
      <motion.div className="flex gap-3" animate={wrong ? { x: [0, -10, 10, -6, 6, 0] } : undefined} role="img" aria-label={t('pin.entered', { count: digits.length })}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={`w-6 h-6 rounded-full border-[2.5px] border-border ${i < digits.length ? 'bg-border' : 'bg-surface'}`} />)}
      </motion.div>
      <p className="min-h-6 font-bold" role="status" aria-live="polite">{wrong ? t('arcade.wrongPin') : ''}</p>
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <button key={d} type="button" onClick={() => press(d)} className="w-20 h-20 rounded-full border-[2.5px] border-border bg-surface font-display text-3xl font-bold active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>{d}</button>
        ))}
        <span />
        <button type="button" onClick={() => press('0')} className="w-20 h-20 rounded-full border-[2.5px] border-border bg-surface font-display text-3xl font-bold active:scale-95" style={{ boxShadow: 'var(--shadow-sticker)' }}>0</button>
        <button type="button" onClick={() => setDigits(digits.slice(0, -1))} aria-label={t('arcade.backspace')} className="w-20 h-20 rounded-full border-[2.5px] border-border bg-surface-2 flex items-center justify-center active:scale-95"><Backspace weight="bold" size={30} /></button>
      </div>
      <button type="button" onClick={() => { setWho(null); setDigits(''); }} className="min-h-12 px-5 rounded-pill border-[2px] border-border bg-surface-2 font-bold inline-flex items-center gap-2"><ArrowLeft weight="bold" size={20} />{t('arcade.notMe')}</button>
    </div>
  );
}
