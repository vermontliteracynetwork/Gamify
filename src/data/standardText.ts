import { useEffect, useState } from 'react';

// The text of each Common Core standard, for hover and menu descriptions
// (teacher, 2026-10-25). Loaded on first use so it stays out of the main
// bundle. Built by scripts/build-ccss-text.py; Common Core State Standards
// (c) 2010 National Governors Association Center for Best Practices and
// Council of Chief State School Officers; logged in docs/asset-ledger.md.
type Texts = Record<string, string>;
let cache: Texts | null = null;
let loading: Promise<Texts> | null = null;
const load = () => (loading ??= import('./ccss-text.json').then((m) => (cache = m.default as Texts)));

// Codes are written many ways (1.OA.A.1, HSA-SSE.A.1, CCSS.MATH.CONTENT.1.OA.A.1);
// try the forms the text list uses, then the parent standard of a sub-item.
export function lookupStandard(texts: Texts, raw: string): string | undefined {
  const code = raw.trim().replace(/^CCSS\.(ELA-LITERACY|MATH\.CONTENT)\./i, '');
  const tries = [
    code,
    code.replace(/^(K|\d)\.([A-Z]+)\.[A-D]\.(\d+[a-z]?)$/, '$1.$2.$3'),
    code.replace(/^HS([NAFGS])-([A-Z]+)\.[A-D]?\.?(\d+[a-z]?)$/, '$1-$2.$3'),
    code.replace(/^([NAFGS])-([A-Z]+)\.[A-D]\.(\d+[a-z]?)$/, '$1-$2.$3'),
  ];
  for (const c of [...tries, ...tries.map((c) => c.replace(/[a-z]$/, ''))]) if (texts[c]) return texts[c];
  return undefined;
}

export function useStandardText(): (code: string) => string | undefined {
  const [texts, setTexts] = useState<Texts | null>(cache);
  useEffect(() => { if (!texts) void load().then(setTexts); }, [texts]);
  return (code) => (texts ? lookupStandard(texts, code) : undefined);
}
