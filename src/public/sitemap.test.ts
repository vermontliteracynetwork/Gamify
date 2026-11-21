import { readFileSync, writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { sitemapXml } from './sitemap';

describe('sitemap.xml', () => {
  it('lists every public page and post', () => {
    const path = 'public/sitemap.xml';
    if (process.env.UPDATE_SITEMAP) writeFileSync(path, sitemapXml());
    expect(readFileSync(path, 'utf8')).toBe(sitemapXml());
  });
});
