# Brand Kit completeness audit (Design Chair, 2026-11-23)

Teacher (2026-11-23): "the design chair should have everything needed (literally
everything design related) on the brand kit". This is the checklist of every area a
complete brand kit needs, marked Have, Partial or Missing, with where it lives now.
Mirrored in the Brand Kit doc, Direction tab, "Brand Kit completeness audit".
Report only: nothing on the site changes until she approves.

Places: **Doc T1** = Brand Kit doc Tab 1; **Doc Dir** = Direction tab; **/brand** =
`src/brand/BrandPage.tsx` tabs (Style sheet, Sound board, New direction, Universal
views, Game mockups, Stickers); **DS** = `docs/design-system.md`; **CSS** =
`src/index.css`.

## Checklist

| # | Area | Status | Where it lives | What is missing |
|---|---|---|---|---|
| 1 | Logo use, clear space, minimum size, wrong uses | Partial | `public/brand/gamify-mark.png`, `gamify-wordmark.png`; Doc Dir "kept as it is" | Clear space, minimum size, color versions (on Grape, on cream, one-color), don'ts, SVG master |
| 2 | Color tokens | Have | CSS, DS Colors, Doc T1 section 2, Doc Dir palette update, /brand PaletteProposal | Approved palette not yet merged into CSS (proposal vs live differ) |
| 3 | Approved color pairs (text on fill, contrast) | Partial | Doc Dir proposed palette (ratios) | One table of allowed text/fill pairs incl. team colors and answer tiles A to D |
| 4 | Typography scale | Partial | DS Type (fonts, fit sizes), Doc Dir Type | A named scale with sizes per role and device; minimum sizes (HIG 11 pt min, 17 pt default); numerals role |
| 5 | Spacing and layout grid | Missing | Tailwind defaults only; "tidy grid" in Doc Dir | Spacing scale, page and board grids, safe zones per device (16:10, 4:3, portrait) |
| 6 | Radius, borders, shadows | Have | DS Shape, CSS `--radius-*`, `--shadow-sticker` | Outline decision (Doc Dir: no outline on art) not yet reflected in DS |
| 7 | Iconography | Partial | Doc T1 icon list (Phosphor names), /brand Style sheet Icons | Sizes, stroke weight, fill vs line rule, the doodle icon set for Classic, license line |
| 8 | Illustration style | Partial | `.claude/skills/classic-art`, Doc Dir Doodle style, CrayonKit | One-page style sheet with construction rules (shape primitives), do/don't pairs, sizes |
| 9 | Patterns | Have | Doc Dir Universal patterns, /brand PatternProposal | Tile files and export sizes |
| 10 | Stickers | Have | /brand Stickers, `docs/stickers.md` | Open question on faces; earn rules |
| 11 | Components and states | Partial | DS Components, `src/ui/kit.tsx`, /brand Universal views | One state matrix (default, hover, press, focus, disabled, selected, loading, error) per component |
| 12 | Motion system | Partial | DS Motion, `src/ui/motion/presets.ts`, Doc T1 section 3, Calm/Still | Duration and easing table, reward-size ladder, idle bob frequency check (HIG: avoid about 0.2 Hz oscillation) |
| 13 | Sound system | Partial | Doc T1 section 4, /brand Sound board, `public/sounds`, `docs/sound-and-motion-audit.md` | Loudness target per slot, mute and silent-switch behavior, per-game music list, sound-machine set |
| 14 | Voice and copy | Partial | Doc T1 section 2 "Voice and language", CLAUDE.md copy rules, `src/i18n/en.ts` | One voice page: kid vs teacher tone ladder, word list (do/don't), button verbs, error and wait messages, reading-level target |
| 15 | Accessibility rules | Partial | CSS focus-visible and reduced-motion, DS 44px targets, `docs/accessibility-research.md` | One brand-level checklist: 4.5:1 text, 3:1 UI, color plus shape, 200% text, captions for sound, flashing limit |
| 16 | Game templates and piece sizes | Partial | Doc T1 section 6 (sizes, 8% safe area, 1920 x 1080 backgrounds) | Templates for every game piece; files not yet drawn |
| 17 | Theme guide templates | Partial | `src/public/ThemeGuide.tsx` (`/blog/themes/:id`) | Blank downloadable templates per game in one format |
| 18 | Social media kits | Missing | Doc T1 section 9 (plan only) | Square, story, banner templates; caption bank; calendar |
| 19 | Marketing templates (email, deck, OG images, ads) | Missing | none (no `og:` tags in `index.html`) | Email header and body, sales and PD deck, Open Graph image, ad sizes |
| 20 | Photography, GIF and mixed media rules | Partial | Doc Dir "Mixed media layer" | Consent and student-photo rule in one place, GIF length and loop rules, licensed sources list |
| 21 | Print | Missing | sizes only in Doc T1 section 6 | Letter and A4 printables, CMYK note, crayon-friendly black and white versions |
| 22 | Do and don't | Partial | DS Do and don't; Doc Dir competitor-distance table | One visual do/don't page across all areas |
| 23 | File naming and exports | Missing | none | Naming pattern, formats (SVG, PNG at 1x and 2x, WebP), export sizes, where masters live |
| 24 | Approval workflow | Partial | Agent rules, `src/owner/waiting.ts`, Doc "for your approval" lines | A status column per item (Proposed, Approved, Live) so she sees at a glance |
| 25 | App icon, favicon, home-screen icon | Partial | `public/favicon.png`, `apple-touch-icon.png` | Icon rules (HIG: crisp vector edges, simple ground), sizes |
| 26 | Data and chart style | Partial | `src/ui/chart` | Chart colors and type for teacher reports in the brand |
| 27 | Team colors and player identity | Have | `TEAM_COLORS` in `src/engine/turns.ts`, Doc T1 | Shape per team written beside color in the kit |
| 28 | Asset licenses | Have | `docs/asset-ledger.md` | Link each kit item to its ledger line |

Totals: Have 7, Partial 16, Missing 5.

## Top 10 gaps (ranked)

1. **One status view: Proposed, Approved, Live.** Why: two palettes and two outline
   rules exist at once (DS vs Doc Dir); conflicting sources raise decision load and
   drift (cognitive load; Apple HIG Color: "avoid using the same color to mean
   different things"). Plan: add a status column to every kit section and a
   "Live today" summary at the top of Tab 1.
2. **Accessibility rules page.** Why: K-3 readers and projector rooms; WCAG 2.1
   4.5:1 and 3:1, HIG text enlarges to 200%, color plus shape. Plan: one checklist
   every part must pass, linked from the brand check.
3. **Type scale with minimums.** Why: HIG games table (iPadOS 17 pt default, 11 pt
   minimum); legibility drives comprehension for early readers. Plan: named roles
   (title, question, answer, label, score numeral) with rem sizes per device.
4. **Spacing and layout grid with safe zones.** Why: Gestalt proximity; HIG menus
   must work at 16:10, 19.5:9 and 4:3. Plan: 4-based spacing scale, a board-zone
   grid per aspect ratio, drawn on /brand.
5. **Marketing templates (OG image, email, deck, ads).** Why: teachers adopt
   through peer sharing; a shared link with no preview image loses trust (social
   proof, processing fluency). Plan: OG 1200 x 630, email, a 10-slide PD deck.
6. **Logo rules.** Why: consistency builds recognition (mere-exposure effect); HIG
   Branding: do not repeat the logo in-app. Plan: clear space = height of the G,
   minimum 24 px mark, three color versions, SVG master.
7. **Voice page.** Why: HIG Writing (voice fixed, tone per moment, verbs on
   buttons); reading-level control for K-3. Plan: tone ladder, word list, message
   bank for right, try again, wait, error.
8. **Motion and reward-size ladder.** Why: HIG Feedback (match feedback to
   importance), seductive-details research; HIG Motion (avoid about 0.2 Hz bob).
   Plan: table of small, medium, big moments with duration, easing, sound slot.
9. **Sound loudness and mute rules.** Why: HIG Playing audio (sound is non-essential,
   obey silent and volume); a room of 25 devices adds up. Plan: target loudness
   per slot, music lower than effects, one master mute.
10. **File naming and exports, then social kits.** Why: a kit that cannot be handed
    off is not used (handoff practice). Plan: naming pattern and sizes now; social
    templates (1080 x 1080, 1080 x 1920, 1500 x 500) after the palette is approved.

## Challenge

Material 3 Expressive research found expressive designs preferred overall, but a
strong minority preferred calmer versions and Google warns "no amount of emotion can
compensate for a lack of clarity". The new direction adds patterns, GIFs and mixed
media. Test question: on a projector at the back of a room, can a 6-year-old find
the answer tiles in under two seconds with Full motion and with Calm? Measure it in
a playtest before the mixed media layer ships.

Sources: see `docs/design-references.md`, "Stronger references (2026-11-23)".
