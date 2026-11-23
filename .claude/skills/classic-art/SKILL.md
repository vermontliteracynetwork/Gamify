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
- AI-generated images (teacher, 2026-11-23: "add a rule of the style for the ai
  generated assets so the same style applies to the classic theme (texture, line
  art, colors)"). Every AI-made Classic asset follows the AI style rule below, is
  generated with 3 kit pieces (CrayonKit power-ups, dice, stickers) attached as
  style references, and passes the check before it ships. If it drifts, redraw or
  trace it into the kit. Record the tool and its license in `docs/asset-ledger.md`.

  **AI style rule (same as the code-drawn kit):**
  - Texture: smooth, flat, solid fills; no grain, paper tooth, gradients, shading,
    gloss or 3D; at most a faint hint of hand scribble inside a fill.
  - Line art: one dark ink outline (#1D1A33) around every shape, about 4% of the
    object's width, slightly wobbly like a felt-tip pen, rounded ends and corners;
    inner details in the same ink, thinner. Never a sketchy or doubled pencil line.
  - Shapes: simple, chunky, a little lopsided; one object, centered, readable at
    48px; no faces, characters or mascots unless she asks; no text unless asked.
  - Colors: only the palette pairs (Gamify purple #7A88FE / #B4C4FB, Grape
    #6A45F0 / Lavender #DDD6FF, Sky #4BA3E8 / Blue crystal #BFDFF3, Pink #F055A5 /
    Blush #FFD3E6, Lemon #FABE37 / Butter #FFF1B8, Orange #FF9B28 / Peach #FFD9B3,
    Kelly #22B04A / Mint #C8F0DC, Teal #1FB5A8 / Aqua #C9F1EE, Lime #CCD537 / Sage
    #E8F0B4, Ink #1D1A33, Cream #F6F0E4, Paper #FFFAF0); brights for the object,
    pastels for patches; solid and opaque, never washed out.
  - Background: transparent; optional pastel blob patch behind the object, and up
    to three tiny doodle marks (sparkle, dot, star) only when asked.

  **Style prompt (paste as is, then name the object):** "flat hand-drawn
  children's sticker illustration of ONE [object], smooth solid flat colors, no
  texture, no gradient, no shading, thick dark navy ink outline (#1D1A33) with a
  slight hand-drawn wobble and rounded ends, simple chunky slightly lopsided
  shapes, centered, transparent background, colors only from: #7A88FE, #6A45F0,
  #4BA3E8, #F055A5, #FABE37, #FF9B28, #22B04A, #1FB5A8, #CCD537 with pastels
  #B4C4FB, #DDD6FF, #BFDFF3, #FFD3E6, #FFF1B8, #FFD9B3, #C8F0DC, #C9F1EE,
  #E8F0B4, no text, no face, no characters, no pencil or crayon marks".
  Negative prompt where the tool has one: "photo, 3D, realistic, gradient,
  shading, glossy, texture, grain, sketch lines, pencil, crayon strokes, text,
  watermark, face, eyes, character".
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
