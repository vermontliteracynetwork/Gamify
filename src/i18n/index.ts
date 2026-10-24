import { en, type StringKey } from './en';

export type Strings = Record<StringKey, string>;

const languages: Record<string, Strings> = { en };
let current: Strings = en;

export function setLanguage(code: string): void {
  current = languages[code] ?? en;
}

// t('key') or t('key', { name: 'Ava' }) for "{name}" placeholders.
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const text = current[key] ?? en[key] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}
