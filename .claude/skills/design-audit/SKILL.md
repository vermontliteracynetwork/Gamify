---
name: design-audit
description: Run Gamify's full design audit - screenshot every listed game's welcome, theme, setup pages, play, question, feedback and results at iPad portrait, iPad landscape, laptop and short laptop, review them with the design-reviewer agent, and produce one ranked report grouped by shared part. Use when asked for a design audit, a design pass, or "what looks unprofessional".
---

# Design audit

1. **Sweep.** `DESIGN_AUDIT=1 AUDIT_DIR=<scratchpad>/audit npx playwright test
   e2e/design-audit.spec.ts --project=laptop --trace off --workers=4`. Files are
   `<game>__<nn>-<step>__<size>.png` plus `<game>__<size>.errors.json`.
   Add a screen to the sweep when a new menu or game ships.
2. **Review.** Split the screenshots between design-reviewer agents (one per
   few games, under 10 agents), each told to look at every image and return
   findings with file, screen, size, severity, shared part, and 1 to 5 scores.
3. **Verify.** Open the screenshot behind every Blocker and High yourself;
   drop anything you cannot see in the image.
4. **Rank.** Group by shared part (scoreboard, results box, setup steps,
   welcome, top bar, question screen, board/stage, power-up cards, other),
   worst first, with how many games each problem touches.
5. **Report.** One page for the teacher: the top problems with their
   screenshots, scores per game, and the proposed fixes per shared part. Then
   the design-lead turns the fixes into mockups for her approval before any
   code changes.
