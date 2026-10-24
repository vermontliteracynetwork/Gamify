import { en, type StringKey } from './en';

export type Strings = Record<StringKey, string>;

const languages: Record<string, Strings> = { en };
let current: Strings = en;

export function setLanguage(code: string): void {
  current = languages[code] ?? en;
}

// t('key') or t('key', { name: 'Ava' }) for "{name}" placeholders. When
// count is 1 and a "<key>.one" string exists, that one is used.
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const one = `${key}.one` as StringKey;
  const pick = vars?.count === 1 && (current[one] ?? en[one]) ? one : key;
  const text = current[pick] ?? en[pick] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}
