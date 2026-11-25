# Slow-device check (simulated), 2026-11-25

This is queue item 22. A real school Chromebook and a classroom projector are still needed (Waiting on you); this simulated run is the first half of that check.

**Setup:**
- The production build, run with `vite preview`.
- Chromium with the processor slowed 6 times (`Emulation.setCPUThrottlingRate 6`, about a low-end school Chromebook).
- A school-wifi network: 150 ms latency, 1.6 Mbps down, 750 kbps up.
- A 1366 x 768 screen, the most common Chromebook size.
- The script that ran it: `scratchpad/slow.cjs`.

| Page | First paint | Page loaded | Network quiet | Data sent (KB) | Errors |
|---|---|---|---|---|---|
| / | 3.4 s | 2.5 s | 4.9 s | 585 | 0 |
| /play | 2.7 s | 2.4 s | 4.0 s | 529 | 0 |
| /join | 2.6 s | 2.4 s | 3.5 s | 461 | 0 |
| /games/match-three | 2.5 s | 2.3 s | 5.0 s | 546 | 0 |
| /games/castle-quest | 2.6 s | 2.4 s | 5.0 s | 563 | 0 |
| /games/bowling | 2.5 s | 2.3 s | 4.9 s | 554 | 0 |
| /teacher | 2.6 s | 2.4 s | 4.1 s | 497 | 0 |
| /teacher/reports | 2.7 s | 2.4 s | 4.4 s | 503 | 0 |

**Frame rate in play,** with the processor still slowed 6 times:

| Game | Frames per second |
|---|---|
| Match Three | 61 |
| Bowling | 60 |
| Game Show | 60 |

**Result:** every page paints in under 3.4 s, and the games keep a smooth 60 frames a second. There were no errors on any page.

**Still to do on real hardware:**
- Text size and colors on a projector at the back of the room.
- Touch on a Chromebook touchscreen.
- Audio through classroom speakers.
- A full class of 25 joining Live at once.
