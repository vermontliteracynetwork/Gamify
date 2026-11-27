import type { Icon } from '@phosphor-icons/react';
import { CloudSlash } from '@phosphor-icons/react';
import type { ReactNode } from 'react';

// An empty or waiting page in the Developer Portal (owner, 2026-11-27: "use
// referencing sites, things like figma, to get visual and simple views for
// all pages"): an icon, one bold line and an optional next step, centered in a
// short card instead of one sentence in a big blank box.
export default function DashEmpty({ text, icon: I = CloudSlash, action }: { text: string; icon?: Icon; action?: ReactNode }) {
  return (
    <div className="dash-blank" role="status">
      <span className="dash-icon" aria-hidden="true"><I size={24} weight="duotone" /></span>
      <p className="m-0 font-bold">{text}</p>
      {action}
    </div>
  );
}
