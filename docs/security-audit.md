# Security audit (2026-11-20)

The teacher's security lists (2026-11-20), item by item. "Done" was checked in code or a test; "You" items need a dashboard only the owner can open (also on `/owner` and in `docs/waiting-on-you.md`).

| Item | Status |
|---|---|
| API keys and secrets server side only | Done. Only the public Supabase URL and anon key reach the browser; the service key, OpenAI, Resend and Stripe keys are read only in `api/*`. |
| Secrets out of git history | Done. Full history scanned for live/test Stripe keys, webhook secrets, service-role JWTs, Resend and OpenAI keys: none found. `.env`, `.env.local` are git-ignored; only `.env.example` is committed. |
| Row level security on every table, nothing fully public | Done. Every `create table` in `supabase/migrations` is followed by `enable row level security`; owner-only tables use `is_owner()`. |
| Server-side auth and admin checks | Done. Owner data comes only through RLS and `security definer` functions that check `is_owner()`; the browser's owner screen is a view, not the gate. |
| Record and field access | Done in RLS (each teacher reads and writes only their own rows; students only through code-limited functions). |
| Validate and escape input | Done. React escapes text; shared themes are sanitized on load (`src/theme/safeTheme.ts`); API bodies are length- and format-checked. |
| SQL injection | Done. No raw SQL from the browser; Supabase queries are parameterized; RPCs take typed arguments. |
| Uploads | Done. Type and size checked, pictures redrawn into fresh images (`src/ui/uploadRules.ts`). |
| Payment webhooks | Done. Stripe signature checked (`api/stripe-webhook.ts`). |
| Rate limits: login, quotes, voice | Done (first line, per server instance: `src/lib/rateLimit.ts`). Login: 8 tries a username and 30 an address per 10 minutes. Supabase Auth adds its own limits. |
| Login doesn't reveal which usernames exist | Done. Wrong username and wrong password get the same answer. |
| Password rules and leak check | Done. 8+ characters, not a common password, and checked against known breaches by k-anonymity (only 5 hash characters leave the device). **You:** also turn on Supabase Auth, Leaked password protection. |
| Error messages don't leak details | Done. API errors are short codes; details go to the server log only. |
| Security headers, HTTPS | Done. HSTS (preload), nosniff, frame, referrer, permissions; a Content Security Policy in report-only mode first (switch to enforcing once Vercel shows no reports). Vercel serves HTTPS only. |
| CORS and CSRF | Done. API routes are same-origin only (no CORS headers are sent, so other sites' pages can't read them); the voice route checks the referrer; logins use bearer tokens, not cookies, so no CSRF form attack applies. |
| Dependency scan | Done. `npm audit`: 0 vulnerabilities (fflate fixed; React Router upgraded to v7, 2026-11-20). |
| Debug off, production settings | Done. Production builds have no source maps or dev tools; test-only aids switch off outside tests. |
| Logging | Done. Failed logins, rate limits and webhook refusals are logged (Vercel logs). |
| Session token in local storage | Known. Supabase keeps the session in the browser; the strict headers above and the CSP limit XSS risk. Moving to httpOnly cookies needs server rendering; planned with Stage 5. |
| Two-step sign in | Owner: done (0012). Teachers: done in code (Account page, Two-step sign-in; every teacher page then asks for the code). **You** turn on Supabase Auth, MFA (TOTP) for it to work. |
| Bot protection | **You:** turn on Supabase Auth, Bot and abuse protection (Cloudflare Turnstile) and add the site key. |
| Spend caps | **You:** Vercel Spend Management cap, OpenAI usage limit, Resend plan limit. |
