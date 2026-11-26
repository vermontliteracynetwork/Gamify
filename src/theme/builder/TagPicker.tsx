import { useState } from 'react';
import { Check, MagnifyingGlass, X } from '@phosphor-icons/react';
import { t } from '../../i18n';
import { fieldClasses } from '../../ui/kit';
import { TAG_GROUPS, searchTags, tagLabel, type ThemeTag } from '../tags';

// Pick a theme's tags from the fixed list (owner, 2026-11-26): the same tag
// every time, so teachers can search them and each special day can find its
// entries. Type to search, or open a group; picked tags show on top.
export default function TagPicker({ value, onChange }: { value: string[]; onChange: (tags: string[]) => void }) {
  const [query, setQuery] = useState('');
  const found = searchTags(query);
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);
  const chip = (x: ThemeTag) => {
    const on = value.includes(x.id);
    return (
      <button key={x.id} type="button" aria-pressed={on} onClick={() => toggle(x.id)}
        className={`min-h-11 px-3 rounded-pill border-std font-bold text-sm inline-flex items-center gap-1.5 hover-pop ${on ? 'bg-butter border-border' : 'bg-surface border-border-soft'}`}>
        {on && <Check weight="bold" size={14} aria-hidden="true" />}{x.label}
      </button>
    );
  };
  return (
    <div className="grid gap-2">
      <p className="font-bold">{t('builder.tags')}</p>
      <p className="text-sm font-semibold text-muted">{t('builder.tagsHint')}</p>
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-2 list-none p-0 m-0" aria-label={t('builder.tagsPicked')}>
          {value.map((id) => (
            <li key={id}>
              <button type="button" onClick={() => toggle(id)} aria-label={t('builder.tagRemove', { name: tagLabel(id) })}
                className="min-h-11 px-3 rounded-pill border-std border-border bg-butter font-bold text-sm inline-flex items-center gap-1.5 hover-pop">
                {tagLabel(id)}<X weight="bold" size={14} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm font-bold" role="status">{t('builder.tagsNone')}</p>}
      <label className="relative max-w-md">
        <span className="sr-only">{t('builder.tagsSearch')}</span>
        <MagnifyingGlass size={18} weight="bold" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={t('builder.tagsSearch')} className={fieldClasses('md', 'w-full pl-9')} />
      </label>
      {query.trim() ? (
        found.length ? <div className="flex flex-wrap gap-2">{found.slice(0, 40).map(chip)}</div>
          : <p className="text-sm font-semibold text-muted">{t('builder.tagsNoMatch')}</p>
      ) : (
        <div className="grid gap-1">
          {TAG_GROUPS.map((g, i) => (
            <details key={g.id} open={i === 0} className="rounded-input border-std border-border-soft px-3 py-1">
              <summary className="min-h-11 flex items-center font-bold cursor-pointer">{g.label}</summary>
              <div className="flex flex-wrap gap-2 pb-2">{g.tags.map(chip)}</div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
