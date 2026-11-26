import { useLayoutEffect, type CSSProperties, type ReactNode } from 'react';
import { StrengthProvider, type Strength } from './strength';
import PublicFooter from '../PublicFooter';
import { PATTERNS } from '../../brand/PatternProposal';
import { useSettings } from '../../settings/SettingsContext';

// ============================================================================
// THE SCRAPBOOK PUBLIC SHELL (owner, 2026-11-26), the one shared place for it.
//
// She picked a scrapbook strength per page on /brand?tab=scrapbook: "home=b
// pricing=a but remove the recommended label ... login=a join =a top/bottom= a
// --- no scrapbook on any other live views or in games at all."
//
// So the scrapbook is OPT-IN, page by page. A public page wraps its content in
// <ScrapbookPage strength="A" | "B"> and gets:
//   - the Cream page ground (html[data-ground="scrapbook"], see index.css),
//   - the strength A top bar and footer (the white bar and the white grouped
//     footer with the 3px ink rule, as on /brand Scrapbook "Top bar and footer"),
//   - the strength for the kit pieces inside it (Paper, Bit, TextCard tilt and
//     tape read it through useStrength), and
//   - the PublicFooter, so the page does not render its own.
// Cards on these pages use the `sb-card` class (white, 3px ink edge, 5px ink
// shadow, the panel radius); see index.css "Scrapbook public shell".
//
// Teacher pages, student game screens, lobbies and games never use this: they
// keep their own look (Lavender ground, the teacher Cream shell, game themes).
// The kit pieces themselves (papers, tape, stickers, the hand-lettered word)
// live in src/brand/ScrapbookKit.tsx, re-exported from ./index.ts.
// ============================================================================

/** Puts the page on the Cream scrapbook ground while it is mounted. */
export function useScrapbookGround() {
  useLayoutEffect(() => {
    const html = document.documentElement;
    html.dataset.ground = 'scrapbook';
    return () => { delete html.dataset.ground; };
  }, []);
}

// The body paints over negative z-index layers, so the pattern goes on the
// page root itself while the page is open.
function usePatternGround(ground?: CSSProperties) {
  const key = ground ? JSON.stringify(ground) : '';
  useLayoutEffect(() => {
    if (!ground) return;
    // On the root so it fills the whole window and the space down to the footer.
    const b = document.documentElement.style, was = b.cssText;
    Object.assign(b, ground, { backgroundAttachment: 'fixed' });
    return () => { b.cssText = was; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}

/** A public page in the scrapbook shell. `footer={false}` for student pages (Join): nowhere to wander. */
// `pattern` lays a Brand Kit pattern over the whole ground in place of plain
// Cream (owner 2026-11-26: Sprinkles behind Log in, Board checker behind Join).
// Calm or plain backgrounds get the pattern's calm version.
export function ScrapbookPage({ strength = 'A', footer = true, pattern, children }: { strength?: Strength; footer?: boolean; pattern?: string; children: ReactNode }) {
  useScrapbookGround();
  const { settings } = useSettings();
  const ground = pattern ? PATTERNS.find((p) => p.id === pattern)?.make(settings.calm || settings.backgrounds === 'plain') : undefined;
  usePatternGround(ground);
  return (
    <StrengthProvider value={strength}>
      {children}
      {footer && <PublicFooter />}
    </StrengthProvider>
  );
}
