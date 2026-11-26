import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Check } from '@phosphor-icons/react';
import { supabase } from '../data/supabase';
import { t } from '../i18n';
import Dialog from '../ui/Dialog';
import { Button, fieldClasses } from '../ui/kit';

// An account the owner made with a starting password (owner, 2026-11-26):
// the teacher makes their own password before anything else opens
// (0016_new_password.sql). Nothing else on the page can be used until then.
export default function NewPasswordGate() {
  const { pathname } = useLocation();
  const [must, setMust] = useState(false);
  const [pw, setPw] = useState('');
  const [again, setAgain] = useState('');
  const [problem, setProblem] = useState<'' | 'short' | 'same' | 'match' | 'offline'>('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!supabase) return;
    let gone = false;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const id = data.session?.user.id;
      if (!id) { if (!gone) setMust(false); return; }
      const { data: p } = await supabase.from('profiles').select('must_change_password').eq('id', id).maybeSingle();
      if (!gone) setMust(!!(p as { must_change_password?: boolean } | null)?.must_change_password);
    })().catch(() => { /* the flag is checked again on the next page */ });
    return () => { gone = true; };
  }, [pathname]);

  if (!must) return null;
  async function save() {
    if (pw.length < 8) return setProblem('short');
    if (pw !== again) return setProblem('match');
    setSaving(true);
    const { error } = await supabase!.auth.updateUser({ password: pw });
    if (error) { setSaving(false); return setProblem(/different|same/i.test(error.message) ? 'same' : 'offline'); }
    await supabase!.rpc('password_changed');
    setSaving(false); setMust(false);
  }
  const field = fieldClasses('md', 'w-full');
  return (
    <Dialog title={t('newPw.title')} sub={t('newPw.sub')} zIndex={90}>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); void save(); }}>
        <label className="grid gap-1 font-bold text-sm">{t('newPw.new')}
          <input type="password" autoComplete="new-password" value={pw} onChange={(e) => { setPw(e.target.value); setProblem(''); }} className={field} autoFocus />
        </label>
        <label className="grid gap-1 font-bold text-sm">{t('newPw.again')}
          <input type="password" autoComplete="new-password" value={again} onChange={(e) => { setAgain(e.target.value); setProblem(''); }} className={field} />
        </label>
        {problem && <p role="alert" className="font-bold text-sm rounded-input bg-blush p-2">{t(`newPw.${problem}`)}</p>}
        <Button variant="main" type="submit" disabled={saving}><Check weight="bold" size={18} />{t('newPw.save')}</Button>
      </form>
    </Dialog>
  );
}
