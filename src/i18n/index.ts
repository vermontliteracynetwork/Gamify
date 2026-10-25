import { en, type StringKey } from './en';
import { esA } from './es-a';
import { esB } from './es-b';

export type Strings = Record<StringKey, string>;

// Spanish is machine-drafted and gets a native speaker's review before
// launch; any line it is missing falls back to English.
const languages: Record<string, Partial<Strings>> = { en, es: { ...esA, ...esB } };
let current: Partial<Strings> = en;
let currentCode = 'en';

export function setLanguage(code: string): void {
  current = languages[code] ?? en;
  currentCode = code in languages ? code : 'en';
}

export const language = (): string => currentCode;

// t('key') or t('key', { name: 'Ava' }) for "{name}" placeholders. When
// count is 1 and a "<key>.one" string exists, that one is used.
export function t(key: StringKey, vars?: Record<string, string | number>): string {
  const one = `${key}.one` as StringKey;
  const pick = vars?.count === 1 && (current[one] ?? en[one]) ? one : key;
  const text = current[pick] ?? en[pick] ?? key;
  return vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text;
}
