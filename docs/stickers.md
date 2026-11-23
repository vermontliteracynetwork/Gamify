# Sticker collections and the Achievement page (brainstorm, proposal)

Teacher request (2026-11-23, see the last lines of `docs/teacher-preferences.md`):
Classic stickers as site decoration (not in games, except Classic themes),
released as collect-em-all collections (seasonal, for example a winter
challenge for a set time); an Achievement page where the teacher views or
shares on screen every collection and the stickers the class earned;
unearned stickers see-through/gray with a caption saying how to earn them.
First collection: "really basic sticker style and little captions like good
job for 'Tried 5 new themes!'". Her reference: a sheet of 11 die-cut "good
job" stickers (thick white edge, flat bright object, curved hand-lettered
caption).

**Look (teacher redo, 2026-11-23):** "original stickers should have a variety
of fun unique shape edges and one sticker image with the label for each. lets
do stickers like this in circle with a white sticker edge border around each.
match the classic color pallete". Each sticker is one solid palette bright, a
fun edge (all 12 different), a thick white die-cut border with a soft shadow,
ONE big image (flat fill, wobbly ink line, no face), and its label: the earn
rule in short capitals curving along the top arc in Grow Year. White text only
on Grape (5.6:1); ink text on every other bright (WCAG 2.1 AA). Labels stay at
12 characters or fewer where possible so they render at 11 px or more on a
96 px sticker (the smallest size on iPad).

Status: **Proposal.** Mockup on `/brand`, Stickers tab (`src/brand/Stickers.tsx`).
Nothing ships until she approves. Research names marked *(memory)* are from
established literature known before this session, not pages opened today.

---

## 1. Purpose and research

The job: make the teacher feel seen for trying things (adoption), and give
students a warm, low-stakes "you did it" that points at effort and learning.
Not a points economy and not a leaderboard.

| Principle | What it means for stickers | Source |
|---|---|---|
| Self-determination theory: competence, autonomy, relatedness | Stickers name a real skill or step ("Tried every game"), let the user choose how to earn (many paths), and are shared as a class ("our stickers"), not one child versus another | Deci and Ryan *(memory)* |
| Overjustification effect | Expected, tangible rewards for an activity people already enjoy can lower interest. So: reward effort, exploration and learning (tried again, finished a set), never only speed, grades or top score; keep stickers informational ("you did X"), not controlling ("do X to get Y") | Lepper, Greene and Nisbett 1973; Deci, Koestner and Ryan 1999 meta-analysis *(memory)* |
| Endowed progress | A collection that starts with one sticker already earned (the "Welcome" or first game) gets finished more often | Nunes and Dreze 2006 *(memory)* |
| Goal gradient and completion drive | People speed up as a goal gets close; a visible "7 of 12" and gray slots pull toward finishing. Keep sets small (10 to 12) so the end is in sight | Hull; Kivetz et al. 2006 *(memory)* |
| Fixed vs variable rewards | Variable (surprise) rewards drive compulsive checking: a slot-machine loop. Not for kids. Every sticker has a fixed, written rule; the only surprise is a pleasant "just earned" moment | Skinner schedules; dark-pattern literature *(memory)* |
| Loss aversion | Losing feels about twice as bad as gaining feels good. So nothing is ever taken away: no broken-streak penalty, no expiring stickers once earned | Kahneman and Tversky *(memory)* |
| Forgiving streaks | "Played on 5 days this month", never "5 days in a row". A sick day, a snow day or an IEP meeting never resets anything | Same as above; teacher rule: no streak-shaming |
| Social comparison | Public ranking of individual students harms the lower half's motivation. Class stickers are shared; student sticker books are private to the teacher device | Festinger; classroom goal-structure research (mastery vs performance goals) *(memory)* |

## 2. Collections model

- **Starter collection (permanent).** 12 stickers, always available, earned
  by first steps and exploring. Never retires.
- **Seasonal collections (limited window).** For example Winter, Dec 1 to
  Feb 28, about 10 stickers. The window is printed on the collection card
  ("Dec 1 to Feb 28"), never a countdown timer (no fake urgency).
- **Recommendation: seasonal stickers come back.** Earned stickers stay
  forever. A missed seasonal sticker returns the next year with the same
  collection (or in a "Classics" re-release), so a teacher who started in
  March is not locked out for good. *Why:* scarcity motivates, but permanent
  loss is loss aversion turned against new customers; "comes back next
  winter" keeps the event feel without the sting.
- Each collection has a finish reward that is itself a sticker (a big
  "Collection complete!" sheet), not a discount or a prize.
- Collections are free. Stickers are never a paid feature, and never shown
  next to upgrade prompts.

## 3. Teacher / class achievements

Her list first, then additions. These are the Starter collection in the mockup
(first 12) plus candidates for later collections.

| Label (top arc) | Edge, fill, image | How to earn |
|---|---|---|
| TRIED 5 THEMES! | circle, Grape (white text), star | Tried 5 new themes (her example) |
| FIRST GAME! | star burst, Pink, rocket | Played your first game (endowed progress: most earn it day one) |
| 5 PLAYS! | heart, Orange, flower | Played one game 5 times |
| 5 DAYS! | scallop, Sky, sun | Played on 5 days this month, any 5, not in a row |
| 10 STUDENTS! | flower, Lime, heart | Added 10 students |
| FIRST SET! | rounded square, Lemon, apple | Made your first question set |
| HOMEWORK! | stamp edge, Teal, watermelon | Sent your first homework link |
| LIVE GAME! | cloud, Gamify purple, rainbow | Ran your first Live game |
| EVERY GAME! | hexagon, Kelly, light bulb | Tried every game |
| 100 ROUNDS! | sun with rays, Orange, balloon | Played 100 rounds |
| CALM MODE! | shield, Grape (white text), moon | Used Calm mode (signals Calm is normal, not lesser) |
| MY THEME! | blob, Lemon, crayon | Made your own theme |

More ideas: first Activity; first choice board; every question type tried;
recorded a question in your own voice; wrote a teach card; 10 / 50 rounds;
imported a set; shared a set with a colleague; used teams; ran a game for each
student; ran the design studio with the class; tried every way to play
(Live, Solo, homework). Avoid: "logged in 30 days", "invited 5 teachers"
(engagement or referral bait, not teaching).

## 4. Individual student stickers

Earned inside games, kept in each student's sticker book on the teacher's
side. Never ranked, never shown on the class screen with names.

- **Effort:** Tried again after a miss ("Kept going!"); answered every
  question in a set ("Finished!"); came back to a game another day.
- **Growth:** Beat your own score ("New best!"), more right than last time on
  the same set, got one right that was missed last time ("Got it now!",
  retrieval practice reward).
- **Learning habits:** Listened with read-aloud ("Good listener!"), used a
  hint and then got it right, played a whole round in Calm mode.
- **Kind team player:** Team games: your team finished together; teacher
  can also give a "Kind teammate" sticker by hand (teacher-awarded stickers
  are the strongest because they are informational and personal).
- **Explorer:** Tried 3 different games, tried a new theme.
- Never: fastest answer, top of the class, most points.

## 5. Special educators and interventionists (1:1 and small group)

- **One device, no student accounts.** The sticker book lives on the
  teacher's device under the class list (name tap). The student never logs in.
- **Per-student sticker book** opens from the class list: one page per
  student, the same grid and "How to earn" captions.
- **Goal-linked stickers.** The teacher names a practice goal in plain words
  (for example "reads 10 CVC words", "answers 8 of 10 on short a") and picks a
  sticker for it. Gamify awards it when that set reaches the goal in a session,
  or the teacher taps "Award" by hand. Language stays IEP-friendly but Gamify
  never stores diagnoses or IEP documents (minimum data).
- **Session counts.** "Sessions this month: 6" and a sticker for every 5
  sessions: shows dosage for progress monitoring without grades.
- **Printable and sharable progress.** "Print sticker page" makes one page per
  student: the stickers, the dates earned and the goal words, for a data
  folder, a parent conference or the student to take home.
- **Small group mode:** after a group game, award group stickers to each
  student who played in one tap.

## 6. Homeschool families

- **Family = class.** Siblings are the students; the parent is the teacher.
- Parent view is the same Achievement page; each child has a sticker book.
- **Print a sticker sheet:** a blank-template page with the earned stickers
  to cut out or color (the Classic art is shown on screen only, per the
  Classic rule; the printable uses the plain template outlines). *Open
  question for her.*
- Seasonal collections double as a homeschool "semester" calendar.

## 7. Privacy

- Stickers are stored with the class, on the teacher's account; no student
  emails, no student accounts, no data beyond the class list name.
- The teacher can turn individual student stickers off for the class or for
  one student (some students find rewards distracting or upsetting).
- Class screen shows class stickers only; student names never appear in
  share-screen mode.
- No sticker is a purchase, an ad or an upgrade prompt on any student page.
- Accessibility settings (Calm, read-aloud) earn stickers like anything else
  and are never paywalled.

## 8. Achievement page design

- **Grid by collection.** Each collection is a card: name, "7 of 12", a short
  kelly-green progress bar, then a grid of stickers (at least 96 px on laptop and iPad so labels stay 11 px or more; each a 44 px+ tap target, WCAG 2.5.5).
- **Locked:** sticker at 35% opacity, grayscale, with a small lock; the
  "How to earn: ..." caption stays full-strength ink so it passes WCAG 2.1 AA
  (the see-through art is decoration, the words carry the meaning, 1.4.1).
- **Tap a sticker:** the side panel shows it at 128 px with "Earned: ..." or
  "How to earn: ...".
- **Share-screen mode:** one collection fills the projector, stickers about
  160 px, quiet periwinkle-pastel ground, no names, no motion except a slow
  settle on newly earned ones. Big and calm (cognitive load: one thing on
  screen).
- **Just earned:** the sticker drops in, overshoots a little and settles
  (Motion spring, about 400 ms), with a soft peel sound; Calm mode: a 200 ms
  fade, no sound. Shown in the results box corner, never mid-question
  (feedback timing: do not pull attention from the learning moment).
- **Seasonal teaser:** a dashed card "Winter collection, Coming" with gray
  snowflake slots and its dates.
- Teacher-page look: standard Gamify sticker style tokens, Inclusive Sans,
  Grow Year only for the page title and sticker captions.

## 9. Where stickers decorate the site

- Teacher pages: the Achievement page, a small earned-sticker strip on the
  teacher home, an empty-state sticker on blank lists.
- The results box corner (the standard Gamify look), as the "just earned"
  moment.
- Games: only in Classic themes, as Classic art; never inside other themes.
- Not in downloads, Canva files or studio stickers (Classic is seen, never
  handed out).
- Marketing: screenshots of the Achievement page (with her approval).

## 10. Open questions for her

1. **Faces on stickers?** Her reference had cute faces; the brand rule says no
   faces. Keep them faceless (mockup), or allow faces on stickers only?
2. **Do seasonal stickers come back** next year (recommended) or are they
   gone for good once the window closes?
3. **Student stickers: on by default or off?** Recommended: class stickers on,
   student stickers on with an easy off switch per class and per student.
4. Can families and interventionists print the earned stickers as art, or only
   a template sheet (the Classic rule says Classic art is never handed out)?
5. Who can award a sticker by hand: only the teacher, or also a co-teacher or
   aide on the same class?
6. Should the class see a goal ("12 more rounds to Blast off!") or only the
   stickers they already have?
