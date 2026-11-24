# CEO Agent inside Gamify

The engine of CEO Agent (https://github.com/tradersurfer/ceo-agent, commit
40e9c42, MIT, see LICENSE) copied here so the owner dashboard (`/owner`, CEO
Agent) can run it from the `api/ceo.ts` Vercel function. Only the runtime
folders came over (ceo-core, sdk, lib, organization, registry, the department
PROMPT.md files, bridges and the dispute-agent example bridge); its Next.js site, CLI, tests and docs did not.

- `ceo-agent.config.json` replaces the interactive `npm run setup` wizard
  (name, owner, business, departments, cost mode). Edit it to change them.
- Keys come from Vercel environment variables, never files:
  `OPENROUTER_API_KEY` (paid tiers). Without it, only free models answer.
- Gamify changes to the upstream code: `lib/ceoAgentServer.js` resolves paths
  from this folder; `lib/uploadStore.js` writes to the temp folder; document
  skills (docx, pdf, xlsx) load their libraries only when run (not installed).
- To update: copy the same folders from a newer upstream commit and re-apply
  the three changes above.
