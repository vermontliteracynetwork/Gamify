# Theme Art: Legal Research for Attorney Review

**Not legal advice.** This is research written by the development team on
2026-10-26 to help Vermont Literacy Network LLC and its attorney decide how
Gamify handles art in themes. It describes what the product does today, what
public sources say, and what we think needs a lawyer's answer. Nothing here
should be published or relied on until an attorney has reviewed it.

**How sources were checked.** The page-fetch tool is blocked in the build
environment, so no source page was opened. Every citation below comes from a
web search result summary and is marked "search result summary, page not
opened". No quotes, section numbers or license terms in this file come from a
page we read in full. Anything we could not confirm is marked **to verify**.
Before relying on any license term, someone needs to open the current page
and read it.

---

## 1. What Gamify does today (from the code and docs)

- **Themes are per game.** Each game has a list of pieces (background, board,
  player piece, cover and so on). The Theme Builder (`src/theme/builder/`)
  lets a teacher upload a picture for each piece, or print the game's
  template, draw on it, and scan the pages back in. Sounds are five built-in
  packs made in code, so theme sounds carry no outside art today.
- **Uploads are re-drawn.** Every uploaded picture is resized and re-saved
  through a canvas (`src/ui/imageFile.ts`), which drops photo metadata such
  as camera location. Scanned pages are cropped to each piece's outline.
- **Three kinds of theme already exist in code:**
  1. Starter and library themes (`src/theme/starters.ts`, `library.ts`).
     Themes the owner makes in the builder "become library themes for every
     teacher on Plus and Pro" (builder copy). These are sold as part of paid
     plans.
  2. Teacher and class themes ("custom"), credited with a "Designed by" line
     that must be a class name, never a student name.
  3. Gallery themes: a teacher picks "Share in the public gallery"; the theme
     goes to `pending`, and the owner approves or declines it on the owner
     desktop (`/owner`, Gallery card). Decline reasons include "It looked like
     a character or logo from another game, show or brand."
- **Theme Building Challenge.** A teacher can tick "Enter it in the Theme
  Building Challenge" on a gallery theme. The public `/challenge` page lists
  prizes (winner: Pro free for life and a featured spot; runners up: a free
  year of Pro and promotion) and says official rules come before entries
  open.
- **Gaps found:**
  - There is **no "I own this or have permission" check box** in the builder
    yet, though `docs/product-plan.md` section 4 promises one ("upload rights
    check box").
  - Themes are still saved on the teacher's device (`src/theme/made.ts`)
    until cloud accounts ship (Stage 5). So the gallery is not truly public
    yet, which gives us time to put the legal pieces in place first.
  - The Terms of Service draft (`docs/legal/terms-of-service-DRAFT.md`) has
    placeholders for gallery terms (section 3), class-made art (section 4)
    and DMCA (section 10).
  - The privacy policy draft says Gamify does not collect "student photos".
    A photo of a drawing can still show a child's face, hand, or a name
    written on the page. Moderation and the upload screen need to cover that.
  - `docs/asset-ledger.md` has no rows yet for theme art. Every library theme
    picture needs a row before it ships.
  - The Gamify logo was made with Canva elements; the ledger already flags
    the Canva trademark question (see 3.1).

---

## 2. The three places themes come from

### 2.1 Themes Gamify publishes (starter and library themes)

**Who owns the art.** Whoever drew it, unless there is a written agreement.
For a library theme Gamify sells, the company should own the art outright or
hold a written license that allows commercial use in software, worldwide,
for as long as Gamify exists.

- Art drawn by the owner: the owner owns it personally unless it is assigned
  to Vermont Literacy Network LLC. The product plan (6.4) already asks who
  owns Gamify; theme art is part of that same question.
- Art by a hired artist: needs a signed agreement that assigns copyright (or a
  broad exclusive license) to the LLC. Freelance art is usually **not**
  "work made for hire" unless it falls in the statute's narrow categories and
  is in a signed writing (**to verify** with the attorney which applies to
  game art).
- Art made in code (sounds, shapes): owned by whoever wrote the code; same
  ownership question.

**Risk level:** low if we follow the existing asset-ledger rule (made by us,
commissioned with a written assignment, CC0, or a commercial license on file).
This is the cleanest of the three, and library themes should stay that way.

### 2.2 Themes posted from the Vermont Literacy Network account

This is the company itself publishing art, so **the company is directly
responsible**: no DMCA safe harbor protects a site from content it posts
itself (safe harbor covers material stored "at the direction of a user").
Every element must have a license that allows use inside a paid product.

Typical sources and what we found:

- **Canva elements.** See 3.1. Biggest issues: a Canva license is for use in
  a design, not for handing the element out as a standalone file; Canva
  content cannot go into a trademark (fonts, simple shapes and lines
  excepted); designs made under a Canva for Education account are reported
  to be limited to educational, non-commercial use.
- **Clipart from teacher-seller shops.** Each artist sets their own terms;
  many forbid use in apps, require the art to be "flattened" or locked in a
  PDF, or require credit. A game theme stores each piece as a separate
  picture that anyone could save, which is close to "distributing the
  clipart as a file". Default answer: **do not use** unless the artist gives
  written permission for use in a sold app or game.
- **Stock photo sites.** Generally allowed in products, but usually not
  "unaltered copies" for sale, and not trademarks, logos or recognizable
  people without releases.
- **Drawings by VLN staff or volunteers.** Need a short written assignment or
  license to the LLC, the same as a hired artist.

**Risk level:** medium. The company is the publisher, and Canva and clipart
licenses are easy to misread. The fix is a source log for every picture
(3.8).

### 2.3 Themes teachers and classes design and publish

Art here comes from student drawings (photographed or scanned), digital art,
Canva exports, and possibly clipart "found online". Other teachers then see
and play it, and it can win prizes.

**Who owns it.**
- A student who draws something owns the copyright in it. Students are not
  employees, so school work is generally not "work made for hire"
  (Creative Commons wiki and a Journalism Education Association article,
  search result summaries, pages not opened). A school can only own it
  through a written agreement, which is rare.
- A teacher's own art: the teacher owns it, unless their school employment
  agreement or district policy says work made on the job belongs to the
  district (**to verify**; varies by contract and district).
- Canva exports and clipart: the uploader never owns the underlying elements;
  they hold (at best) a license, which may not allow passing it to Gamify.

**What this means.** Gamify cannot get ownership from a teacher for art the
teacher does not own. What Gamify needs is a **license** (permission) from the
uploader, plus the uploader's promise that they have the right to give it,
plus a parent or guardian permission for student art that goes public.

**Risk level:** highest. Many uploaders, little control, minors' work, and a
contest that rewards publishing.

---

## 3. License terms for common sources

Each item says what the search results reported. All need a person to open
the current license page and confirm before we write rules on top of them.

### 3.1 Canva Content License

Sources: canva.com/policies/content-license-agreement and the archived
2024-06-20 version; canva.com/licensing-explained; canva.com/policies/onedesign;
Canva's "all about copyright and trademarks" learn page; secondary guides
(Sprintlaw, licenseorg.com, stylefactoryproductions.com). All search result
summaries, pages not opened.

- **Free and Pro content.** Reported: one license framework. Pro content is
  licensed per design (a "One Design Use License"), issued at export; free
  users pay per item and subscribers get it included. A design mixing Free
  and Pro content follows the stricter Pro rules. **To verify:** exact
  current wording.
- **Products for sale.** The archived agreement reportedly lists permitted
  uses including advertising, promotional projects and product packaging,
  some with resale allowed. Secondary guides say you may sell products that
  include Canva content when the design adds your own creative work, but you
  may not sell or give away Canva content on a standalone basis or as stock.
  A Canva page reportedly says Pro content may not be copied, downloaded or
  distributed as a standalone item. **Why this matters for us:** a theme piece
  that is just one Canva element (a cartoon tree as the "board", a stock
  photo as the background) looks a lot like a standalone element, and the
  game serves it as a separate picture file. Pieces that are original
  compositions are safer. **To verify:** whether Canva treats a game theme
  piece as a "design" or as a standalone element.
- **Templates.** The archived agreement reportedly lists design templates
  "solely for use on Canva" as a separate use, and guides say you cannot
  resell Canva's own templates or close copies. Our downloadable theme
  templates are made by us, not in Canva, so this mainly matters if a
  teacher starts from a Canva template. **To verify.**
- **Trademarks.** Canva's licensing explainer reportedly says Free or Pro
  library content may not be used in a trademark, except fonts, simple
  shapes and lines; a Canva learn page reportedly goes further and says
  designs built from Canva content cannot be used or registered as a
  trademark. This affects the Gamify logo (already flagged in the ledger)
  and any theme cover or mascot Gamify might later want to register.
- **Branded or licensed content in Canva.** The current agreement
  reportedly says some branded character content (search summary named one
  large entertainment company) is for personal or educational use only, never
  commercial. Any themed character element inside Canva is off limits for
  Gamify.
- **Canva for Education accounts.** Secondary sources report that designs
  made with Canva for Education are for educational use only and that Pro
  stock media there is non-commercial. Teachers will very often use these
  accounts. **To verify** on Canva's own education terms. If confirmed, a
  teacher's Canva for Education export may be fine in their own class but
  not in a public gallery of a sold product, and certainly not in a theme
  Gamify promotes or a contest entry that wins promotion.

### 3.2 Openclipart and other public domain sources

- Openclipart's FAQ reportedly says the site uses CC0, that credit is not
  required, and that clipart can be used for unlimited commercial work
  (openclipart.org/faq, search result summary, page not opened). A
  contributor article on opensource.com reportedly says some artists choose
  other licenses such as CC BY, so check each image's own page (search result
  summary, page not opened).
- "Public domain" on a random site is a claim, not proof. Old works are
  public domain because of age; new clipart is only public domain if its
  creator dedicated it. Re-uploads on aggregator sites are often wrong.
- Public domain covers copyright only. It does not clear trademarks (a logo
  in the picture) or a real person's likeness.

### 3.3 CC0

A public domain dedication: the creator gives up copyright as far as the law
allows. Commercial use and changes are allowed and credit is not required,
though it is good practice (Creative Commons attribution guidance, search
result summary, page not opened). Same trademark and likeness caveat as 3.2.
**Allowed** for all three theme sources.

### 3.4 CC BY

Allows commercial use and changes, **if** credit is given. Creative Commons'
recommended credit is "TASL": title, author, source (link), license (named
and linked), and a note if the work was changed (wiki.creativecommons.org,
Best practices for attribution, and university library guides, search result
summaries, pages not opened). **Allowed** only if the product shows the credit
near the theme (the theme's info panel) and on the Credits page. Avoid CC
BY-SA in library themes unless the attorney is comfortable with the
share-alike duty on our changed versions (**to verify**).

### 3.5 Creative Commons NonCommercial (BY-NC, BY-NC-SA, BY-NC-ND)

NC licenses bar use "primarily intended for or directed toward commercial
advantage or private monetary compensation" (University of Pittsburgh library
guide and Creative Commons NonCommercial interpretation pages, search result
summaries, pages not opened). Gamify is sold by subscription, library themes
are a paid feature, and the gallery helps sell plans. **Not allowed in any
theme Gamify publishes, promotes or makes playable for others.** ND (No
Derivatives) is also a problem because the builder crops and resizes.

A harder question for the attorney: is a teacher's NC-licensed picture used
only in their own class (never shared) acceptable? The teacher's use is
educational, but it is stored and served by a commercial service. Our
recommended product rule is simpler: NC art may not be uploaded at all.

### 3.6 Stock sites

- Reported for Pixabay: commercial use and changes allowed without credit;
  not allowed to sell unaltered copies or use content with recognizable
  trademarks commercially; limits on showing identifiable people badly; the
  license changed from CC0 to a custom license in 2019 (Wikipedia and
  secondary guides, search result summaries, pages not opened).
- Reported for Unsplash: broad use, but no selling unaltered copies; the
  license does not cover trademarks, recognizable people or artworks shown in
  photos (Unsplash's Medium explainer and secondary guides, search result
  summaries, pages not opened).
- Paid stock (standard licenses) usually allows use in products but often
  bars use in "templates" or items where the image is the main value, and
  may cap use in apps. **To verify** per site before buying.
- For game art, "unaltered copy" is the key risk: a stock photo dropped in as
  a background with nothing added may count. Library themes should combine
  and change stock images, and keep the license receipt in the ledger.

### 3.7 "Free for personal use" clipart and teacher-seller clipart

- "Free for personal use" means **no commercial use**. Gamify is commercial,
  so this art is not allowed in any theme that leaves a teacher's own class,
  and our product rule should simply ban it.
- Clipart artists who sell to teachers on teacher marketplaces set their own
  terms. Search results showed: some allow only free products, some allow
  commercial use with credit and a link, some sell a "no credit" license,
  some require art to be flattened or "secured in a PDF", and some ban
  selling files that contain their art in original or modified form
  (rhodadesignstudio.com and shop listings, search result summaries, pages
  not opened). No result mentioned apps or games. The marketplace itself did
  not show a single site-wide clipart policy in the results (**to verify**).
- A teacher who bought a clipart pack "for classroom use" or "for my TpT
  products" almost certainly did not get a right to put the pieces in a
  public game gallery on someone else's commercial platform. **Treat as not
  allowed** unless the artist's written terms say apps or online games are
  fine.

### 3.8 Summary table (proposed rule)

| Source | Gamify library themes | VLN account themes | Teacher themes, own class | Teacher themes, public gallery / contest |
|---|---|---|---|---|
| Made by uploader (own drawing, own photo) | Yes, with written assignment | Yes, with written assignment or license | Yes | Yes, with license grant; student art needs parent permission |
| CC0 / true public domain | Yes, logged | Yes, logged | Yes | Yes |
| CC BY | Yes, with credit shown | Yes, with credit shown | Yes, with credit | Yes, with credit field filled in |
| CC BY-SA | Attorney call | Attorney call | Yes | Attorney call |
| Any NonCommercial or NoDerivatives CC license | No | No | No (simple rule) | No |
| Canva Free or Pro content in an original composition | Yes if license confirmed, never in a trademark | Yes if license confirmed | Yes | Attorney call (to verify Canva terms) |
| Canva for Education content | No | No | Probably fine (to verify) | No until verified |
| Stock (free or paid) | Yes, changed, receipt logged | Yes, changed, receipt logged | Yes | Yes if the uploader confirms the license allows it |
| "Free for personal use" | No | No | No | No |
| Teacher-seller clipart | Only with written app permission | Only with written app permission | Attorney call | No |
| "Found online" / unknown | No | No | No | No |
| Characters, logos, brands | No | No | No | No |

---

## 4. Student artwork

### 4.1 Ownership

The student owns the copyright in their own drawing (see 2.3). A teacher
cannot grant rights the student holds. For a minor, a license or assignment
should be signed by a parent or guardian. Minors can generally disaffirm
contracts; one federal case about a contest (I.C. v. Delta Galil USA,
S.D.N.Y.) discussed how far that goes, and questioned whether contest rules
bind a minor (vlex and studicata case summaries, search result summaries,
pages not opened). A Chapman Law Review article, "Crayons, Contests, &
Copyright: Contracting to use a Child's Creative Work", covers exactly this
topic (search result listing only, not opened). **To verify** with the
attorney: whether a parent-signed license holds after the child turns 18,
and under Vermont law versus the student's state.

Practical consequence: Gamify should ask for a **non-exclusive license**,
not ownership, of student art. It is easier to justify, less alarming to
parents, and the student keeps their work.

### 4.2 Is a parent or guardian release needed?

- **In the teacher's own classes only:** the teacher is using student work in
  class, which schools already do. A release is likely not needed for Gamify
  to store and show it to that class, but the school's own policy controls.
  **To verify.**
- **Public gallery, other teachers, contest, or any Gamify promotion:** yes.
  The product plan (4 and 6.4) already says so. This is publishing a child's
  work to the public inside a sold product, and promotion (featured spot,
  marketing) is commercial use.
- Many schools already run an annual "photo and student work" opt-out form
  separate from directory information (school district FERPA notices, search
  result summaries, pages not opened). That form usually covers school
  publications, not a third-party company's commercial gallery, so we should
  not rely on it. Gamify should offer its own one-page permission form the
  teacher sends home (printable, plain language; English only until the teacher approves other languages), and the
  teacher confirms they have it on file.

### 4.3 COPPA

- COPPA covers personal information collected online from children under
  13. A drawing with no name is probably not personal information by itself,
  but a photo can contain a child's face, voice is not involved, and a name
  or school written on the page can make it identifying. The amended COPPA
  Rule took effect 2025-06-23 with most compliance due 2026-04-22 (Davis Polk
  and Mondaq summaries, search result summaries, pages not opened); the
  amendments reportedly broaden some definitions (**to verify** which
  changes touch photos and images).
- Gamify relies on **school authorization** for student data (privacy policy
  draft, section 5). FTC guidance as summarized by law firms: a school may
  consent for parents only when the information is used for a
  school-authorized educational purpose and **for no other commercial
  purpose**; if the operator uses it for its own commercial purposes, it
  needs parental consent directly (Perkins Coie, Inside Privacy, Mintz
  summaries of the FTC COPPA FAQ, search result summaries, pages not opened).
- **Why this matters for themes:** publishing a class's art in a public
  gallery of a paid product, featuring it, or awarding it a prize and
  promoting it, is arguably Gamify's own commercial purpose, not the school's
  educational purpose. If the art (or anything with it) is personal
  information, school consent may not cover it. That is the strongest legal
  reason for: no faces, no names, no identifying details in public themes,
  credit to a class name only, and a parent permission form for anything
  public. **Attorney question.**
- Teachers are the uploaders, not children, which helps. Student design mode
  (students submitting pieces from their own devices) brings children closer
  to being the ones uploading; keep it inside the class, with teacher
  approval, and never public without the parent form.

### 4.4 FERPA

- FERPA protects personally identifiable information in education records.
  Search results did not settle whether a student's artwork is an
  "education record" (school notices only, search result summaries, pages
  not opened). **To verify** against 34 CFR Part 99 and Department of
  Education guidance.
- With no name, face or other identifier, a drawing is probably not
  personally identifiable. A credit like "Room 12, Lincoln Elementary"
  combined with a small class could edge toward identifying a student in
  some cases (for example, a class of three). Keep credits to a teacher-set
  class name and offer "Anonymous class" as an option.
- Gamify acts as a "school official" under the privacy draft. That role
  covers use for the school's purposes; public sharing outside the school is
  a different use and should rest on parent permission, not FERPA's school
  official exception.

---

## 5. What license Gamify needs from uploaders

To be written by the attorney. Plain-language outline of what it should
cover:

1. **License grant (all uploads).** The uploader keeps ownership and gives
   Vermont Literacy Network LLC a non-exclusive, worldwide, royalty-free
   license to store, copy, resize, crop, display and perform the theme
   inside Gamify for the classes and teachers it is shared with.
2. **Extra grant when shared publicly.** Choosing the public gallery (or
   entering the contest) adds: showing the theme to all Gamify teachers and
   their students, on free and paid plans; showing its cover and pictures on
   Gamify's public pages; and (only for contest winners and featured themes,
   with a separate yes) using it in Gamify marketing.
3. **How long.** Ends when the theme is taken down, except copies already in
   backups and classes that saved it (attorney to decide whether teachers who
   already use a gallery theme keep it after the creator removes it).
4. **Promises (warranties).** The uploader confirms: they made the art or
   have permission for this use; for student art, they have a parent or
   guardian's permission on file for public sharing; no characters, logos or
   brands from other companies; no faces or names of students; no art
   under "personal use only", NonCommercial or "found online" terms.
5. **Credit.** Gamify shows the "Designed by" class name and any required
   source credits the uploader enters.
6. **Take-down.** Gamify can remove any theme at any time.
7. **Indemnity.** Normal for user content, but teachers are individuals and
   schools are often barred from indemnifying vendors. **Attorney call:**
   ask for it, soften it, or drop it for school plans.
8. **School-employee angle.** The teacher confirms they are allowed to share
   work made in their job, or that the district's policy permits it.

Proposed check box wording on the Share step (customer-facing, no brand
names):

> I made this art, or I have permission to share it. If students drew it, a
> parent or guardian said yes to sharing it. It has no characters, logos or
> pictures from other games, shows or brands, and no student faces or names.

Proposed check box on every upload (own classes):

> This picture is mine, or I have permission to use it.

### 5.1 Contest rules (Theme Building Challenge)

Notes for the official rules (search sources: ViralSweep, ShortStack,
KickoffLabs, Stinson, ACC guides on contests versus sweepstakes, search result
summaries, pages not opened):

- **Skill contest, not a sweepstakes.** Winners picked by judging, with
  stated criteria. The challenge page already names creativity, how well it
  plays, and how easy it is to read. Guides say criteria should be specific
  and judges qualified; name who judges.
- **No purchase necessary.** Some states reportedly bar purchase
  requirements even for skill contests. Gamify's free plan lets a teacher
  design one Game Show theme, which may serve as a free way to enter; the
  rules should say entry is free and open to every plan, and the free plan
  must actually allow a complete entry. **To verify** state by state.
- **Prize value.** "Pro free for life" needs a stated value (approximate
  retail value) and a definition of "life" (the life of the product or
  account; what happens if Gamify is sold or shut down). Prize value may
  trigger tax reporting for the winner, and some states reportedly require
  registration or bonding above certain prize values (Florida and New York
  cited at $5,000 or more). **To verify.**
- **Who enters and who wins.** The entrant is the teacher (an adult).
  Students are credited as a class. Some school districts and states have
  gift or ethics rules for public employees accepting prizes from vendors.
  The rules may need to let the prize go to the school, or let a teacher
  decline. **Attorney call.**
- **Entry license.** Entering grants the gallery license above plus a
  marketing license for winners and featured themes, with credit to the class
  name.
- **Eligibility.** United States only at first? Void where prohibited;
  employees and family of Vermont Literacy Network excluded.
- **Disqualification.** For any rights problem, characters or brands,
  student identifiers, or a valid complaint, including after the prize is
  awarded (with prize forfeit).
- **Parent permission** required for every entry with student art, confirmed
  by the teacher.
- **Dates, odds statement not needed (skill), how winners are told, and
  publicity consent.**

---

## 6. DMCA safe harbor

The Digital Millennium Copyright Act (17 U.S.C. 512) protects a service from
money damages for infringing material stored "at the direction of a user",
if it meets the conditions. It protects **user-posted** themes (source 3), not
themes Gamify or the VLN account posts (sources 1 and 2).

What it takes (secondary sources; statute text not opened, **to verify**
against 17 U.S.C. 512):

1. **Register a designated agent** with the U.S. Copyright Office's online
   DMCA directory and show the same contact on the site. Copyright Office
   guidance reportedly requires renewal at least every three years; a lapsed
   designation is treated as no designation, and the system emails reminders
   (copyright.gov renew tutorial transcript and law firm notes, search result
   summaries, pages not opened). The fee was reported as $6 per designation
   in 2016 to 2017 sources (**to verify** the current fee). Already listed in
   `src/owner/waiting.ts` under attorney items.
2. **Notice and takedown.** A complete notice must include (from general
   knowledge, **to verify** against 512(c)(3)): a signature, the work
   claimed, the material and where it is, contact details, a good-faith
   statement, and a statement under penalty of perjury that the notice is
   accurate and the sender is authorized. Gamify removes or disables the
   theme quickly, tells the uploader, and allows a **counter notice**; if
   the claimant does not file suit in the statutory window, the theme can be
   restored (**to verify** the 10 to 14 business day window).
3. **Repeat infringer policy.** Adopt, publish and reasonably carry out a
   policy that ends accounts of repeat infringers in appropriate
   circumstances (512(i), per secondary sources). Needs a written policy in
   the Terms and a record of strikes per account.
4. **No knowledge, no "red flag".** Once Gamify knows a theme infringes, or
   it is obvious (for example a famous character), safe harbor does not help
   if we leave it up. Our approval step means Gamify looks at every public
   theme; the attorney should confirm that reviewing for quality and rights
   does not by itself lose safe harbor (**attorney question**), and the
   reviewer must decline obvious problems.
5. **No direct financial benefit from infringing material where Gamify can
   control it.** Gamify charges for plans, and the gallery helps sell them.
   **Attorney question:** does a paid gallery that Gamify curates and
   features create that risk, especially for contest winners Gamify promotes?

Product pieces needed: a "Report this theme" button on every gallery theme
(already planned in product plan, Safety and trust 14), a copyright complaint
page with the agent's contact, an owner-desktop queue for reports, a way to
hide a theme everywhere at once, and a strike count per teacher.

---

## 7. Trademark and likeness risks

- **Characters that look like famous ones.** Characters can be protected by
  copyright on their own, apart from any single work; the Ninth Circuit held
  the Batmobile protectable as a character and found replicas infringed the
  owner's right to make derivative works (DC Comics v. Towle, 2015, from
  Wikipedia and law firm summaries, search result summaries, pages not
  opened). A child's drawing of a famous cartoon mouse or a famous video game
  plumber is a derivative work of that character, and putting it in a
  public gallery of a paid product is commercial. Characters are usually also
  trademarks. **No fan art in public themes**, however sweet; inside a
  teacher's own class it is lower risk but should still be discouraged
  (**attorney call** whether to allow it class-only).
- **Look-alike game styles.** The product plan already bans copying another
  platform's look. Gallery review should decline themes that copy a famous
  game's pieces or screens closely.
- **Brand logos.** Sports teams, toy, food and video game logos in a theme
  are trademark uses that can suggest endorsement. Decline. School mascots
  and logos for a school spirit theme (blog idea 19) belong to the school or
  district; keep them class or school-only unless the school confirms it can
  share them, and never in the public gallery or contest.
- **Theme names.** Must not use other companies' brands (CLAUDE.md rule).
  Add a name check to review.
- **Real people's likeness.** Photos of real people, celebrities, or
  students need releases; recognizable people in stock photos often are not
  covered by the stock license. Public themes: no photos of real people.
- **Gamify's own marks.** The logo was made with Canva elements, and Canva
  content reportedly cannot be used in a trademark (fonts, simple shapes and
  lines excepted). Already flagged in `docs/asset-ledger.md` and product plan
  6.2. A designer may need to redraw it as original art before filing.

---

## 8. AI-generated art

- **Copyright.** The U.S. Copyright Office's January 2025 report (Part 2,
  Copyrightability) concluded that purely AI-generated material is not
  protected; prompts alone are not enough; human selection, arrangement or
  changes to AI output, or human art that stays visible in the output, can
  be protected (Manatt, Copyright Alliance, Dykema and Authors Guild
  summaries, search result summaries, pages not opened). The D.C. Circuit
  affirmed in Thaler v. Perlmutter (2025) that the Copyright Act requires a
  human author, and one firm reports the Supreme Court denied review
  (Crowell, Loeb, Finnegan summaries, search result summaries, pages not
  opened; **to verify** the cert denial).
- **What that means for Gamify:**
  - AI-made library art may be owned by **no one**, so competitors could copy
    it freely. Gamify should not rely on AI art for its core library look.
  - AI tools' own terms vary on commercial use and some generate look-alikes
    of famous characters on request. Output can still infringe someone else's
    work even if the output itself cannot be copyrighted.
  - Teacher uploads: allow AI-assisted art in their own classes; for the
    public gallery, ask uploaders to say if AI was used (a simple yes/no), and
    decline anything that resembles a known character or artist's style.
  - Contest: decide whether AI art can enter. Recommendation: no for the
    first challenge; the contest celebrates students' own drawing and design,
    and judges cannot fairly compare.
  - Ledger: record any AI tool used for library art, the tool's terms on the
    date used, and the human edits made.

---

## 9. Moderation and approval before a theme is public

Today: gallery themes go to `pending` and the owner approves or declines on
the owner desktop. That is the right shape. What a reviewer should check:

1. **Rights check box** was ticked, and (for student art) parent permission
   confirmed.
2. **No characters, logos, brands, or look-alikes** of famous games or shows.
3. **No faces, names, school names in the art, handwriting of a full name,
   or other identifiers** of students. Look at every piece at full size, not
   just the cover (names are often written in a page corner).
4. **No photos of real people.**
5. **Content is classroom-appropriate**: no violence or scary images beyond
   the platform's rules, nothing hateful, no hidden text.
6. **Theme name and description** contain no brand names or personal
   information.
7. **Source credits** filled in where the uploader said CC BY was used.
8. **Readable** (already checked automatically: contrast warnings block
   sharing).
9. **Reverse image check** of pieces that look professional or like stock
   or clipart (spot check; flag if found online under other terms).
10. **Decline reasons** sent back kindly; the existing list should add "We
    could not confirm permission for some pictures" and "It showed a
    student's name or face".

Also needed: a "Report this theme" button on every public theme and gallery
card, a fast "hide everywhere" switch, a log of who approved what and when,
and a re-review if a teacher edits an approved theme (today, editing a saved
theme keeps its gallery status; **check** whether edits to an approved theme
go back to pending).

---

## 10. Recommendations checklist

### Build in the product

- [ ] Add the "This picture is mine, or I have permission to use it" check
      box to the upload and scan steps (promised in product plan 4, not built
      yet).
- [ ] Add the Share check box (wording in section 5) before "Share in the
      public gallery" or the contest box can be chosen.
- [ ] Add a "Student art? A parent or guardian said yes to sharing it" check
      box, plus a printable parent permission form (plain language, English
      only for now) linked from the Share step.
- [ ] Add a "Where did the pictures come from?" picker on Share: drew it
      ourselves; made it in a design app with our own drawing; free pictures
      that allow any use (with a credit field); other. "Other" stays in the
      teacher's classes only.
- [ ] Add a short "Pictures you can and can't use" help card (kid-simple
      icons for the class, a line each for teachers): yes to your own
      drawings and photos of them; no to cartoon characters, logos, "found
      online" pictures, "personal use only" clipart.
- [ ] Add an "AI was used" yes/no on Share.
- [ ] Send any edit to an approved gallery theme back to pending review.
- [ ] Add "Report this theme" on every public theme, a reports queue on the
      owner desktop, a hide-everywhere switch, and a per-teacher strike count.
- [ ] Add a copyright complaint page (agent contact, what to include,
      counter notice steps) linked from the public footer.
- [ ] Add a review checklist to the owner Gallery card (section 9) and two
      decline reasons: "We could not confirm permission for some pictures"
      and "It showed a student's name or face".
- [ ] Offer "Anonymous class" as a credit option; keep the class-name-only
      rule.
- [ ] Keep re-encoding uploads through the canvas (drops photo location
      data); add a test so it stays that way.
- [ ] Show CC BY credits on the theme's info panel and the Credits page.
- [ ] Keep the gallery and contest switched off until the Terms, contest
      rules and DMCA agent are in place.

### Put in Terms / contest rules (attorney)

- [ ] User content license: own-class license on every upload, wider gallery
      license on sharing, marketing license only for winners and featured
      themes (with a separate yes).
- [ ] Uploader promises: rights, parent permission for student art, no
      brands or characters, no student identifiers, no NonCommercial or
      personal-use-only art.
- [ ] Take-down right, what happens to copies others saved, and backups.
- [ ] Indemnity approach for teachers and for school plans.
- [ ] DMCA section: agent, notice contents, counter notice, repeat infringer
      policy.
- [ ] Gallery terms (ToS draft section 3) and class-made art (section 4)
      finished.
- [ ] AI art rule for the gallery and the contest.
- [ ] Official Theme Building Challenge rules: skill contest, free entry,
      judges and criteria, prize values and "for life" defined, eligibility,
      public-employee gift issue, tax, disqualification, entry license,
      publicity consent, parent permission.
- [ ] Parent or guardian permission form (non-exclusive license from the
      student through the parent, credit to class name only, can be
      withdrawn for future use).
- [ ] Privacy policy and data privacy agreement: say how theme art is
      handled, that public themes must not contain student identifiers, and
      how this fits the school-authorization approach under COPPA.

### Vermont Literacy Network account practices

- [ ] Log every picture in every VLN or library theme in
      `docs/asset-ledger.md` before it ships: source, license, link, date,
      receipt or screenshot of the license page on that date.
- [ ] Do not use Canva for Education accounts for anything Gamify publishes.
      Use a paid Canva account, and confirm in writing (open the current
      license) that game theme pieces are allowed.
- [ ] Make each theme piece an original composition, not a single stock or
      Canva element dropped in alone.
- [ ] Never use Canva content in anything Gamify may trademark (logo,
      mascot); redraw the logo as original art if the attorney says so.
- [ ] No teacher-seller clipart, "free for personal use" art, NonCommercial
      CC art, or "found online" art, unless the artist gives written
      permission for use in a sold online game.
- [ ] Get a short written assignment (or broad license) from anyone who
      draws for Gamify: staff, volunteers, contractors, and the owner (to
      the LLC).
- [ ] Use AI art only as a starting point that a person substantially
      redraws; record the tool and its terms.
- [ ] Register the DMCA agent before the gallery opens; put a renewal
      reminder on the calendar for every three years.

---

## 11. Questions the attorney needs to answer

1. Should the owner's own theme and logo art be assigned to Vermont
   Literacy Network LLC in writing now? Does any art made earlier belong to
   the owner's employer or a school?
2. Is a non-exclusive license from uploaders enough for the gallery, the
   contest and marketing, or does Gamify need more (for example, to keep
   winning themes after a creator leaves)?
3. Can a teacher grant the license for students' art at all, or must the
   license come from each parent? Is our parent form enough, and does it
   survive the child turning 18? Which state's law applies?
4. Under COPPA, does publishing class art in the public gallery, featuring it
   or awarding it a prize count as Gamify's own commercial purpose, so that
   school authorization does not cover it? Is a drawing with no name
   personal information under the amended rule?
5. Is student artwork an education record under FERPA, and does a class-name
   credit risk identifying a student?
6. Under Canva's current Content License, can a theme piece made with Free or
   Pro elements be used in a paid game platform and shown to other users?
   Are Canva for Education exports usable anywhere in Gamify?
7. Is using a CC NonCommercial picture inside one teacher's class on a paid
   platform acceptable, or should the simple ban stand?
8. CC BY-SA in library themes: acceptable, and what must we share?
9. Does Gamify's approval step (reviewing every public theme) or the paid
   gallery and contest put DMCA safe harbor at risk (knowledge, "red flag",
   financial benefit with right and ability to control)?
10. What should the repeat infringer policy say (how many strikes, what
    counts)?
11. Is the Theme Building Challenge a legal skill contest in all states with
    the free plan as the free entry path? Does "Pro free for life" need a
    stated value, registration or bonding anywhere? Tax reporting?
12. Can public school teachers accept the prize under gift or ethics rules,
    and should the prize be offered to the school instead?
13. Fan art and school mascots: allow class-only, or ban everywhere?
14. AI art: allow in the gallery with disclosure, ban from the contest?
15. Indemnity: ask teachers for it, and how to handle schools that cannot
    indemnify?
16. Gamify's own name and logo: clearance search, and does Canva's trademark
    restriction require a redrawn logo before filing?

---

## Sources (all search result summaries; no page was opened)

- Canva Content License Agreement (current and 2024-06-20 archive):
  https://canva.com/policies/content-license-agreement ,
  https://www.canva.com/policies/content-license-agreement-2024-06-20
- Canva licensing explained: https://canva.com/licensing-explained
- Canva One Design Use: https://www.canva.com/policies/onedesign/
- Canva copyright and trademarks: https://www.canva.com/learn/all-about-copyright-and-trademarks/
- Sprintlaw on Canva: https://sprintlaw.co.uk/articles/can-i-sell-my-canva-designs ,
  https://sprintlaw.com.au/articles/is-canva-copyright-free-for-business-use/
- licenseorg.com on Canva: https://licenseorg.com/blog/canva-license-explained
- Canva for Education overview: https://www.stylefactoryproductions.com/blog/canva-for-education
- Openclipart FAQ: https://openclipart.org/faq ; opensource.com:
  https://opensource.com/life/16/2/create-on-openclipart
- Creative Commons attribution: https://wiki.creativecommons.org/Best_practices_for_attribution
- Creative Commons NonCommercial: https://wiki.creativecommons.org/NonCommercial_interpretation ;
  https://pitt.libguides.com/openlicensing/cc-non-comerical
- Pixabay: https://en.wikipedia.org/wiki/Pixabay ; Unsplash license:
  https://medium.com/unsplash/the-unsplash-license-f6fb7de5c95a
- Teacher-seller clipart terms: https://www.rhodadesignstudio.com/most-common-words-used-by-teachers/
- Student work ownership: https://wiki.creativecommons.org/wiki/If_children_create_materials_in_the_course_of_their_assignments,_who_owns_the_copyright%3F ;
  https://jea.org/?p=4528 ; https://case-law.vlex.com/vid/i-c-v-delta-885569239 ;
  https://www.chapmanlawreview.com/2024/04/forthcoming-article-crayons-contests-copyright-contracting-to-use-a-childs-creative-work/
- FERPA school notices: https://lakeofthewoodsschool.org/wp-content/uploads/2025/03/FERPA-annual-form-1.pdf
- COPPA and schools: https://perkinscoie.com/insights/update/ftcs-coppa-enforcement-action-provides-lessons-edtech-providers ;
  https://www.insideprivacy.com/uncategorized/ftc-staff-updates-guidance-on-coppa-and-schools-through-revised-faqs-1/
- Amended COPPA Rule timing: https://www.davispolk.com/insights/client-update/ftc-prioritizes-coppa-enforcement-new-compliance-obligations-take-effect
- DMCA agent renewal: https://www.copyright.gov/dmca-directory/transcripts/renew.pdf ;
  fee: https://perkinscoie.com/print/pdf/node/3757
- DMCA notice and repeat infringer: https://www.daeryunlaw.com/us/practices/detail/dmca-compliance
- AI copyrightability report: https://copyrightalliance.org/ai-report-part-2-copyrightability/ ;
  https://manatt.com/insights/newsletters/copyright-office-releases-new-report-on-copyrightability-of-ai-works
- Thaler v. Perlmutter: https://www.crowell.com/en/insights/client-alerts/dc-circuit-rejects-copyrightability-of-artwork-created-autonomously-by-ai
- DC Comics v. Towle: https://en.wikipedia.org/wiki/DC_Comics_v._Mark_Towle
- Contests: https://www.shortstack.com/help/sweepstakes-and-contest-rules-guide/ ;
  https://www.KickoffLabs.com/blog/contest-giveaway-laws-by-state ;
  https://www.viralsweep.com/blog/no-purchase-necessary
