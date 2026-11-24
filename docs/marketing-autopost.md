# Auto-posting (owner, 2026-11-24)

Her words: "add a visual content planner that will be hooked up to auto post
and such. we can use canva".

## What is built

- **Visual planner** (`/owner`, Marketing, Visual planner): four weeks at a
  glance. Each post shows as its picture in the platform's own shape: the Canva
  design once it exists, or a brand preview of its hook until then. Drag a post
  to another day to move it, or use Move in the post. Moves save with her
  settings and go to the team in "Copy for the team".
- **Auto-posting tab:** the connected accounts and the queue, with what each
  post still waits for.
- **The rule** (`src/owner/marketing/autopost.ts`, tested in
  `autopost.test.ts`): a post goes out on its own only when all four are true:
  1. she approved it,
  2. its Canva design is ready,
  3. its account is connected,
  4. its time has come.

  Ads never auto-launch.

## How Canva fits

1. The social planner writes each post's Canva brief (`canva` on the post).
2. The design is made in Canva from the brand kit templates, either by the
   team through the Canva connector or by her.
3. The post gets `design: { canva: <design id>, url: <edit link>, thumb: <preview image> }`.
4. The planner then shows the real picture.
5. At posting time the publisher exports the design (PNG, or MP4 for reels and
   TikToks) through the Canva Connect API.

## The publisher (to build when the accounts exist)

It runs as a scheduled Supabase Edge Function every 5 minutes, never in a
browser, because platform tokens must stay on the server.

On each run, for every post whose rule result is `due`:

1. Export the Canva design.
2. Upload it with the platform's official API:
   - Instagram: Graph API content publishing (media container, then publish).
   - Facebook: Pages API (photos or videos).
   - Pinterest: API v5, create pin.
   - TikTok: Content Posting API (direct post, after the app audit).
3. Save the platform post id and mark the post `posted`. The performance
   analyst reads the results into `docs/marketing-lessons.md`.
4. Write `marketing-connections` (platform to true) into her settings, so the
   planner shows what is connected.

Rules for the publisher:

- Tokens are saved as Supabase secrets.
- It uses no unofficial bots or scrapers.
- Each post goes out once (idempotent by post id).
- On any failure it stops and posts nothing more; the failure shows on the
  Auto-posting tab.
