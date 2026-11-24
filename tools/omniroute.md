# OmniRoute (for stretching AI usage while building Gamify)

Teacher, 2026-11-24: "add omniroute to the gamify folder entirely so i can use it"
/ "for extended token usage".

OmniRoute (MIT license, https://github.com/ChrisCompton/omniroute, also on npm as
`omniroute`) is an AI gateway: one local address (`http://localhost:20128/v1`)
that routes your coding tools to many AI providers, with fallback to free and
low-cost models when one runs out. It is a developer tool, not part of Gamify:
it never ships to teachers or students and is not built or deployed with the
site.

## Where it has to run

On YOUR computer, next to the Claude Code (or other tool) you want it to
stretch. It cannot extend a claude.ai cloud session like this one: cloud
sessions run on Anthropic's servers and are reset when they end, so a gateway
installed there would disappear and would not change that session's limits.

## Set up (Mac, about 5 minutes)

1. Install Node.js 20 or newer (https://nodejs.org), then in Terminal:
   ```bash
   npm install -g omniroute
   ```
2. Start it:
   ```bash
   omniroute
   ```
   The dashboard opens at http://localhost:20128.
3. In the dashboard, connect the providers you want (your own accounts and
   keys; some have free tiers) and set the fallback order.
4. Point Claude Code at it: the dashboard's CLI Tools page has a one-click
   setup for Claude Code, or set the base URL to `http://localhost:20128/v1`
   as it shows.
5. To go back to normal Claude Code, undo step 4 (or stop OmniRoute).

## Things to know

- Your API keys are stored by OmniRoute on your computer; keep them out of
  this repository.
- Answers from other models can be weaker than Claude's, so the Gamify quality
  gates (Golden Rule, Classic Art Director, Claudia, tests) still apply to any
  work done that way.
- Gamify's code and teacher/student data are never sent through it by the app;
  only your own coding sessions use it.
