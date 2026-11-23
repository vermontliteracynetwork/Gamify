---
name: classic-art
description: Gamify's Classic art style gate. MUST be used before drawing, generating, buying or changing ANY Classic theme asset (power-ups, dice, board pieces, backgrounds, covers, icons, celebrations) so every piece matches the one simple pencil/crayon hand-drawn style. Lists the style rules, the shared drawing parts to reuse, and the check every asset passes.
---

# Classic art: one pencil/crayon hand-drawn style (teacher, 2026-11-23)

Every Classic asset in every game looks like it came from the same box of
crayons and colored pencils: simple, hand-drawn, consistent. It complements
the handmade themes teachers and kids make (clean core, handmade edges).

## Before making anything
1. Read the Gamify Brand Kit doc (Direction tab: decisions, "Clean core,
   handmade edges", "Universal power-ups and dice") and `/brand` New direction.
2. Reuse first: the universal power-up set and dice in `src/brand/CrayonKit.tsx`
   (and the shared crayon/pencil SVG filters and strokes there). A game uses the
   universal power-up of the same job (Magnet, Double Dice, x2, Shield, Freeze,
   Extra Time...) instead of drawing its own. A new piece is added to the kit,
   not drawn inside one game.
3. Use the piece's template size and safe area (Brand Kit section 6).

## The style rules
- Medium (teacher, 2026-11-23: "more smooth design, still handdrawn but less
  pencil/crayon marks"): smooth, flat, solid fills with a hand-drawn, slightly
  wobbly ink outline; at most a faint hint of scribble (about 10% opacity), no
  grain or paper tooth, no visible pencil strokes. Never glossy, gradients-only, 3D or photo.
- Solid, opaque, punchy fills (teacher, 2026-11-23: "more solid, punchier
  brighter colors that are less transparent"): full-strength brand colors, no
  low-opacity layers or washed-out tints; dense waxy coverage, with texture only
  as a light overlay in the strokes and at the edges. Texture never makes a
  color look faded. Pencil lines are strong (about 4 units on the 100 grid).
- On color-block stages a power-up wears the white sticker edge so it never
  disappears into a stage of its own color.
- Shapes: simple, chunky, readable at 48px and 128px; one idea per piece.
- Palette: the brand palette only, each bright with its pastel pair (see the palette
  proposal on /brand; main is Gamify purple #7A88FE / #B4C4FB). No other colors.
- Line (teacher refs, 2026-11-23, replaces "no heavy outlines"): one thick dark
  ink outline (#1d1a33 or a deep brown) around every shape, slightly wobbly, with
  rounded ends, like a felt-tip doodle; inner details in the same ink, thinner.
  Tappable controls keep their thin 2px edge.
- Doodle world (same refs): a soft crayon blob patch of color behind a subject
  instead of a frame; tiny doodle confetti around it (four-point sparkles, small
  stars, dots, hearts, mini rainbows, squiggles, motion or steam lines); shapes
  rounded and a little lopsided; fills flat and solid with a light grain or
  gouache tooth inside; pastels allowed beside the brights; hand-lettered labels.
- No characters or mascots, no faces on objects unless the teacher asks; no
  known characters, brands or logos; nothing resembling a famous game.
- One white or cream highlight scribble on round things, top left.
- Text inside art only if needed, in Grow Year or hand-lettering for one word.

## Drawn in code, generated or bought
- Preferred: draw in SVG using the shared kit parts so every piece shares the
  same filters, stroke widths and palette.
- AI-generated images (Canva, Figma, other tools): use the fixed style prompt
  below plus 3 kit pieces as references, then redraw or trace into the kit if it
  drifts. Record the tool and its license in `docs/asset-ledger.md`.
  Style prompt: "simple children's crayon and colored pencil drawing, waxy
  scribble fill, slightly wobbly hand-drawn edges, flat on a transparent
  background, cream-friendly bright palette (pink, cobalt blue, green,
  tangerine, violet, teal, sunny yellow), no outlines, no text, no faces,
  centered, one object".
- Bought packs (for example crayon clipart from a marketplace): only with a
  license that allows use in a commercial website/app; one pack style per set
  so they never mix; recorded in the ledger before use.

## The check (every asset, before it ships)
- [ ] Looks like the kit: put it next to 3 kit pieces at 48px and 128px; a
      stranger would say they are one set.
- [ ] Brand palette only; crayon/pencil texture present; no glossy or 3D.
- [ ] Template size, safe area and board zone respected.
- [ ] Reads on a projector (bold enough texture, contrast vs its ground).
- [ ] No characters, brands, known characters or copied art.
- [ ] Licensed and in `docs/asset-ledger.md`.
- [ ] Design Chair brand check passed.
