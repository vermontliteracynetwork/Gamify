# Accessibility Conformance Report outline (VPAT 2.5 style, DRAFT)

Product: Gamify (web), version as of 2026-10-24. Standard: WCAG 2.1 Level A
and AA. Evaluation methods so far: automated axe-core scans on every main
page at iPad portrait, iPad landscape and laptop sizes (in the test suite);
keyboard and screen reader passes by hand are **still to do** before this
report is final.

| Area | Status | Notes |
|---|---|---|
| Text alternatives (1.1.1) | Supports (automated) | Question pictures need descriptions; theme backgrounds need a description before saving |
| Captions and audio (1.2) | Not applicable | No video; sounds are effects with visual partners |
| Adaptable, info and relationships (1.3) | Supports (automated) | Game boards use grid roles; setup pages use headings and step labels |
| Use of color (1.4.1) | Supports | Teams and treats always have an icon as well as a color |
| Contrast (1.4.3, 1.4.11) | Supports (automated) | Theme Builder blocks color pairs that fail AA |
| Resize and reflow (1.4.4, 1.4.10) | Supports | Text size settings to 125 percent; game screens fit without scrolling; every menu, teacher and public page checked at 320 px wide (400 percent zoom) with no sideways scrolling (e2e/zoom.spec.ts) |
| Keyboard (2.1) | Supports | Every control is a real button; checked by keyboard only (e2e/keyboard.spec.ts): game setup, Game Show cards and answers, Match Three swaps with Enter, Bubble Pop aims with arrow keys and shoots with Space, a teacher making a class |
| Timing (2.2) | Supports | Timers can be turned off; read-first time set per student; Cast and Catch time is teacher-chosen |
| Seizures (2.3) | Supports | Nothing flashes; repeating motion stops in calm mode and Still motion |
| Navigation and focus (2.4) | Partially supports | Every page and game has its own title; keyboard focus shows a thick black ring with a white halo on every background; still to verify focus moves into and back out of every dialog with a screen reader |
| Input (2.5) | Supports | Large touch targets (at least 44 px); tap and drag both work in Match Three |
| Readable, predictable, input help (3.x) | Supports | Plain language; errors explained in words |
| Name, role, value (4.1.2) | Supports (automated) | Fixed answer button names and board roles found by axe |
