---
name: playtest-report
description: "Turn classroom playtest notes (from the teacher, a student, or your own browser play-through) into a structured Gamify playtest report and route each finding to the dev plan. Use for 'here is what happened when my class played X', or with 'new' for a blank template."
argument-hint: "[new | analyze <notes or path>]"
---

# Playtest Report (Gamify)

Adapted from Claude Code Game Studios (MIT, see `.claude/THIRD_PARTY.md`).

## new: blank template
Output this and stop:
```markdown
# Playtest: [game] ([theme])  date
- Who played: [grade(s), how many, whole class / small group / one student]
- Device: [iPad portrait / iPad landscape / Chromebook / laptop / projector]
- How it was run: [code, link, homework, live]
- Question set and settings: [...]

## First minute
- Knew what to do without help? [yes / no / partly]  What did they tap first?
- Mood: [excited / engaged / confused / bored / frustrated]

## What worked
## Where they got stuck or confused
## Moments of delight (cheers, "again!")
## Bugs (what happened, which device, can it be repeated)
## Teacher view: did it support the lesson? anything she had to fix live?
## Top 3 to change
```

## analyze: notes into a report
1. Read the notes. Teacher words are quoted word for word.
2. Fill the template. Anything that plainly breaks (crash, freeze, wrong score, a screen that
   scrolls) goes under Bugs, not "stuck".
3. Tag each finding with its lens: K-3 student, gamer, teacher, device.
4. Route every finding the same turn (CLAUDE.md, never make her repeat herself):
   - a new teacher preference: add it to `docs/teacher-preferences.md`
   - a design change, a polish item or a bug: add it to the live dev plan doc (and its
     Progress log) per CLAUDE.md; use the `bug-report` skill for bugs
   - a balance issue: run the `balance-check` skill
   - something only she can decide: `src/owner/waiting.ts` and `docs/waiting-on-you.md`
   - a classroom use or a quote that sells: `docs/product-plan.md` section 10 / 10A
5. Save the report to `docs/playtests/<date>-<game>.md`.

Never invent observations that are not in the notes.
