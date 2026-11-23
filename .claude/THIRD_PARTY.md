# Third-party Claude tooling

The agents and skills listed below were adapted from **Claude Code Game Studios**
(https://github.com/Donchitos/Claude-Code-Game-Studios), MIT License. They were
rewritten for Gamify: a web (React + Vite) K-12 game platform, not a
Godot/Unity/Unreal project. That means no `project.yaml`, hooks or GDD folders,
Gamify's own docs and rules instead, and the Golden Rule plus the Three-Lens
Standard above everything else. This is development tooling only; none of it
ships to users.

- Agents: `accessibility-specialist`, `economy-designer`, `sound-designer`, `qa-tester`
- Skills: `balance-check`, `playtest-report`, `scope-check`, `asset-audit`, `bug-report`

Gamify's own reviewers (Claudia, `golden-rule`) still have the final word. These
helpers draft and check; they never overrule her.

## License of the original work

MIT License

Copyright (c) 2026 Donchitos

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Design Chair skills (2026-11-23)

- **ScrapeCreators social media research skills**
  (https://github.com/ScrapeCreators/social-media-research-skills), MIT License,
  Copyright (c) 2026 ScrapeCreators. Vendored as `.claude/skills/social-*`
  (renamed with a `social-` prefix). They call the paid ScrapeCreators API and
  need `SCRAPECREATORS_API_KEY`; without it the Design Chair uses public web
  search instead.
- **UI UX Pro Max** (https://github.com/nextlevelbuilder/ui-ux-pro-max-skill),
  MIT License, Copyright (c) 2024 Next Level Builder. Vendored as
  `.claude/skills/{brand,design,design-system,banner-design,ui-ux-pro-max}`.
  The `ui-styling` (bundled font files) and `slides` skills were left out.
  Some scripts in `design` call outside image APIs that need their own keys;
  they are not set up here.

Development tooling only; none of it ships to users. Gamify's approved Brand
Kit wins over any of their defaults.
