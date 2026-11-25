import { useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { saveRef } from './program';

// An affiliate's link (gamify link /a/MSRIVERA, for a TikTok or Instagram
// bio): remembers the code on this device, then opens the home page.
export default function RefLink() {
  const { code = '' } = useParams();
  useEffect(() => { saveRef(code); }, [code]);
  return <Navigate to="/" replace />;
}
