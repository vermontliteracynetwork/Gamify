import { useEffect, useState } from 'react';
import { supabase } from '../data/supabase';
import { useTeacher } from '../auth/session';

// True only when the owner is signed in (teacher, 2026-11-23: the Developer
// Portal button shows for her account and no one else, and nobody else should
// know it exists). The owner is the cloud account marked is_owner, or the
// email set in the VITE_OWNER_EMAIL environment variable (kept in Vercel, never
// in the code). Signed-out visitors and every other account see nothing.
const OWNER_EMAIL = (import.meta.env.VITE_OWNER_EMAIL as string | undefined)?.trim().toLowerCase();

export function useIsOwner(): boolean {
  const teacher = useTeacher();
  const [owner, setOwner] = useState(false);
  useEffect(() => {
    let live = true;
    if (!supabase || !teacher) { setOwner(false); return; }
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { if (live) setOwner(false); return; }
      if (OWNER_EMAIL && user.email?.toLowerCase() === OWNER_EMAIL) { if (live) setOwner(true); return; }
      const { data } = await supabase.from('profiles').select('is_owner').eq('id', user.id).maybeSingle();
      if (live) setOwner(!!(data as { is_owner?: boolean } | null)?.is_owner);
    })().catch(() => { if (live) setOwner(false); });
    return () => { live = false; };
  }, [teacher]);
  return owner;
}
