---
name: asset-audit
description: "Audit every font, image, sound and library Gamify ships against docs/asset-ledger.md: finds unlicensed or unlisted assets, ledger lines with open 'to confirm' items, missing credits, oversized files, and orphans. Use before a release, after adding art or sounds, or when asked 'are we legally clear?'. Report only."
argument-hint: "[fonts | images | sounds | libraries | all]"
---

# Asset Audit (Gamify)

Adapted from Claude Code Game Studios (MIT, see `.claude/THIRD_PARTY.md`). Read-only;
measurements come from real commands (`ls -l`, `du`, `file`), never estimates. Anything
you could not measure is NOT ASSESSED.

## 1. Inventory what ships
- Files: `public/` (fonts, sounds, images, brand), image/sound imports under `src/`
- Libraries: `dependencies` in `package.json` (dev-only tools count only if the ledger says so)
- Libraries kept for later (`assets/`) are listed but marked "not shipped"

## 2. Match against `docs/asset-ledger.md`
For each shipped item: is there a ledger line, with source and a commercial-use license?
Flag:
- **BLOCKING**: shipped with no ledger line; license unknown or non-commercial; a
  "credit required" license with no line on the Credits page; anything named after or
  resembling another company's brand, game or character (CLAUDE.md legal rules); Classic art
  that ends up in a download, template or studio sticker.
- **OPEN**: ledger lines that still say "to confirm" (these belong in `src/owner/waiting.ts`
  if only the teacher can confirm).
- **HYGIENE**: ledger lines for files that no longer exist; files over budget (images over
  500 KB, sounds over 300 KB, unless the ledger explains); duplicate files; orphans nothing
  imports.

## 3. Report
```
## Asset audit: [scope]  (date)
Verdict: BLOCKED / OPEN ITEMS / CLEAN / NOT ASSESSED
| Asset | Where it ships | Ledger line? | License | Problem | Gate | Fix |
```
CLEAN only if every shipped item was checked and has a commercial-use ledger line.
