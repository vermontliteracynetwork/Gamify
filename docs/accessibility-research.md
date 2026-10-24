# Accessibility & Gamified Learning Research

Findings from gamification-effectiveness research, UDL 3.0, neurodivergent-
friendly design guidance, and assistive technology principles, each paired
with what it means for Gamify. See the published version with full
formatting for reading:
https://claude.ai/code/artifact/842263fa-838c-4eba-b315-821ad0ff27be

## 1. Gamification works, moderately, when mechanics serve the goal

A 2025 meta-analysis of K-12 experimental research found a pooled effect
size of g = 0.654 (moderate positive) on student motivation, driven most by
clear goals, timely feedback, and difficulty balanced to skill -- not by
piling on more game mechanics. ([Kurnaz, *Psychology in the Schools*,
2025](https://onlinelibrary.wiley.com/doi/10.1002/pits.70056))

**For Gamify:** validates the Three-Lens "gamer" standard and the bet on
teacher-tied question sets over generic trivia. Each new game mechanic
needs to serve the learning goal or the difficulty/skill balance, not just
add flash.

## 2. UDL Guidelines 3.0 (CAST, July 2024) -- the organizing framework

Three principles: **engagement** (why), **representation** (how content is
presented), **action & expression** (how students respond). 3.0 shifted to
learner-centered language and named bias/exclusion as a design barrier to
address directly. ([CAST UDL Guidelines
3.0](https://udlguidelines.cast.org/))

**For Gamify:** organize accessibility toggles under these three buckets
instead of a flat list -- Engagement (Calm Mode, choice), Representation
(fonts/spacing, audio narration, contrast, sound), Action & Expression
(keyboard/switch operability, not just precise tap/drag).

## 3. Concrete neurodivergent-friendly UI patterns

Converging guidance: soft/muted color over harsh saturation, high
text-background contrast, predictable/consistent layouts, content chunked
with clear headings, plain language, and (per WCAG) user control over
anything that auto-plays past three seconds. ([WCAG.com, neurodiversity
digest](https://www.wcag.com/blog/digital-accessibility-and-neurodiversity/))

**For Gamify:** the dark navy / single-gold-accent palette already leans
right; the Setup -> Options -> Play step header is the "predictable
structure" pattern worth extending to future games. Calm Mode should
specifically target motion amount, sound frequency/volume, and visual
"burst" effects -- not just be a vague "less pretty" switch.

## 4. Reduced motion needs two layers, not one

WCAG's official technique (C39) is the `prefers-reduced-motion` CSS media
query, which Gamify's Motion-based animations already partially respect.
But that only fires when a user has set it at the OS level -- most students
on shared classroom devices won't have. ([W3C WAI, Technique
C39](https://www.w3.org/WAI/WCAG22/Techniques/css/C39))

**For Gamify:** Calm Mode must be an explicit in-app toggle, independent of
OS settings, and a superset of `prefers-reduced-motion` -- also dialing
back the ball's bounce/squash, confetti, and power-up juice.

## 5. The Trace Center's seven principles (high support needs)

Person-centered over one-size-fits-all: equitable use, flexibility in use,
simple/intuitive use, perceptible information, tolerance for error, low
physical effort, appropriate size/space for approach and use. ([Trace
Center, UMD](https://trace.umd.edu/))

**For Gamify:** a checklist for every new screen -- tolerance for error
(a mis-tap should never lose progress or feel punishing), low physical
effort (large touch targets, already true), flexibility in use (never
assume precise tap/drag is the only input; keyboard and switch-scanning
access matter even for canvas-based games).

## 6. Correction to the plan: dyslexia fonts don't have supporting evidence

A 2024 meta-analysis (15 studies, 688 participants) found specialty
dyslexia fonts like OpenDyslexic have **no consistent or reliable effect**
on reading speed or accuracy -- in some comparisons OpenDyslexic performed
*worse* than plain Arial. Increased letter/word spacing has more consistent
supporting evidence than font shape does. ([PubMed, 2024
meta-analysis](https://pubmed.ncbi.nlm.nih.gov/42536336/);
[Edutopia](https://www.edutopia.org/article/do-dyslexia-fonts-actually-work/))

**For Gamify:** don't ship "dyslexia font" as a single font-swap and call
it solved. Prioritize a **letter/word spacing control** and generous
line-height on top of the already-legible Nunito body face; offer
OpenDyslexic as an optional choice (some students subjectively prefer it)
but don't market it as the fix. Reframe internally as "Reading comfort"
(spacing + size + optional font), which is both more accurate and covers
more learners than the dyslexia label implies.

## 7. Real gap found by this research: the Plinko board is invisible to screen readers

(Found on the removed prototype. Applies to every canvas-based game in the rebuild.)

A `<canvas>` element has no DOM content or accessibility semantics by
default. Standard fix: `role="img"` plus an `aria-label`/`aria-describedby`
text alternative, ARIA live regions for state changes, and full keyboard
operability with a logical tab order. ([HTML Canvas Accessibility, Paul J.
Adam](https://pauljadam.com/demos/canvas.html); [ARIA for Web Games,
2024](https://ianeress.substack.com/p/aria-for-web-games-november-13-2024))

**For Gamify:** the drop-zone buttons are already real `<button>` elements
(keyboard-reachable) -- fine as-is. The canvas itself needs an `aria-label`
describing the board and a live region announcing results ("Ball landed in
the 40-point bucket") after each drop; right now that only exists visually.
Score/turn/question changes should also route through a live region so a
whole turn is legible without sight, not just navigable. **Added to the
known-gaps list in `testing-standards.md`.**
