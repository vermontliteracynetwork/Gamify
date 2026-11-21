# UI patterns checklist (teacher, 2026-11-21)

Her list of patterns to take into consideration, and where each stands in Gamify.
"In" = already built; "Added" = built in this pass; "Later" = worth doing, queued; "Not needed" = why.

| Pattern | Status |
|---|---|
| Skeleton loaders | In, our way: every page waits behind the hopping-pieces loader (src/ui/Loading.tsx), never a blank page; cards keep their size while loading. Later: card-shaped placeholders on the question set and theme galleries. |
| Optimistic updates | In: saves (sets, settings, themes) show on screen at once and write in the background. |
| Command menu | Later: a Ctrl/Cmd+K finder for teacher pages (sets, classes, games). Not on student screens. |
| Shortcut hints | In for games (keyboard play, Skip to main content). Later: hints in the command menu. |
| Undo toasts | Added: deleting a theme is one tap with Undo right after (no browser confirm box). Later: the same for removing a student and a question set. |
| Stale-while-revalidate | Added: built files are cached for a year (they change name when they change); art, fonts and sounds a week, refreshed in the background (vercel.json). |
| Pre-rendering | Later: the public pages are drawn in the browser; pre-rendering them at build time would make the first view and search results faster. |
| Blurhash placeholders | Not needed now: game art is drawn, not photos; uploaded theme pictures are small. |
| View transitions | In: pages fade and slide in (motion), respecting Reduce motion. |
| Swipe-to-dismiss sheets | Later: the iPad settings and power-up cards close by tap; a downward swipe could close them too. |
| Interruptible animations | In: motion animations can be cut off by the next tap (springs and tweens retarget). |
| Predictive back | Not needed: web pages, the browser back works on every page. |
| Hit slop | In: touch targets are at least 44 px (min-h-11), game buttons larger. |
| Safe-area insets | In: the page stays inside the safe area (no edge-to-edge viewport), so notches never cover anything. |
| One-time-code autofill | In: the two-step code box uses autocomplete="one-time-code" and the number keypad. |
| Tabular numbers | In: scores, timers, counts and prices use tabular figures. |
| Balanced headlines | In: headings use text-wrap: balance, paragraphs text-wrap: pretty. |
| Continuous corners | In: one corner scale (rounded-panel, rounded-input, rounded-pill), nested radii follow the rule. |
| Idempotency keys | Added: a second tap within 600 ms on any shared button is ignored; game codes are reused, not duplicated; the payment webhook checks signatures. Later with Stripe: idempotency keys on checkout calls. |
| Safe-triangle menus | Not needed: menus open on tap or click, not on hover, so there is no diagonal-mouse problem. |
