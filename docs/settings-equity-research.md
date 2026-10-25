# Settings, Accessibility and Culturally Responsive Design: The Research

Claudia's research brief, 2026-10-24, behind the settings and equity
features in `docs/product-plan.md` section 4A. Goal: every student can
reach every game: students with sensory, attention, motor, vision,
hearing and reading differences, English learners, students from every
culture and community, and students without great devices or internet.
Companion to `docs/gamified-learning-research.md` and
`docs/accessibility-research.md`.

---

## The short version

- **Separate controls are the game-industry standard, not an extra.** The
  Game Accessibility Guidelines, Xbox's guidelines and the IGDA's
  accessibility group all list **separate volume controls for sound
  effects, music and speech** as a basic requirement, because hearing
  loss, attention differences and sensory overload all depend on *which*
  sound, not just how loud.
- **Motion, flashing and auto-playing sound are covered by the web
  accessibility rules schools must meet** (WCAG), which the US Department
  of Justice now requires of public school districts' web content.
- **Sensory differences are common, not rare.** Over-responsiveness to
  sound, light and movement is strongly linked to autism, and also shows
  up in roughly 15 to 20% of children overall.
- **Culturally responsive design means students see themselves, their
  languages and their ways of learning in the game**, and that no student
  is shut out by cost, device or internet.
- **Gamify's answer:** one gear button in the same place in every game,
  always reachable, with settings that follow the student across all
  games, presets for one-tap setup, teacher defaults, and every setting
  free.

---

## 1. Sound: separate levels for effects, music and voice

- The **Game Accessibility Guidelines** (a widely used industry checklist)
  list "provide separate volume controls or mutes for effects, speech and
  background music" in their *basic* tier. Reasons given: hearing loss can
  affect some frequencies more than others, and too many audio sources at
  once make it hard to focus on any of them.
- **Xbox Accessibility Guidelines** recommend separate volume and mute for
  music, voice-over, sound effects, background ambience and narration,
  noting that music and effects can drown out speech and assistive
  technology audio for players with hearing loss or attention-related
  disabilities.
- The **IGDA Game Accessibility SIG** "top ten" asks whether a game offers
  separate music, effects and dialogue controls or only one volume slider.
- **WCAG 2.2, 1.4.2 Audio Control:** any audio that plays automatically
  for more than 3 seconds needs a way to pause, stop or set its volume
  separately from the device volume. Background music in a game is exactly
  this case.

**Gamify settings:** Master volume; Sound effects (Off + 5 levels); Music
(Off + 5 levels); Voice / read-aloud (Off + 5 levels, plus speed); one big
"All sound off" switch. Music starts **off** in Share (the room is
already loud) and quiet elsewhere.

**For deaf and hard-of-hearing students:** every important sound has a
visual partner (a "sound picture": a ding shows a sparkle, a miss shows a
gentle shake of the card), so turning sound off never hides information.

## 2. Visual stimulation: motion, flashing, celebrations

- **WCAG 2.2, 2.2.2 Pause, Stop, Hide (Level A):** moving, blinking or
  scrolling content that starts automatically needs a way to pause, stop
  or hide it.
- **WCAG 2.2, 2.3.3 Animation from Interactions (Level AAA):** motion
  triggered by a user's action (a celebration after an answer, screen
  shake) should be able to be turned off unless it is essential.
- **WCAG 2.3.1 Three Flashes:** nothing may flash more than three times in
  any one second (seizure safety). This is a hard rule for every game and
  every theme, not a setting.
- Devices already let users ask for less motion (the "Reduce Motion"
  setting on iPad, which web apps can read). Gamify should start in
  reduced motion when the device asks for it.

**Gamify settings:** one-tap **Calm mode** (all of the below at once), plus
individual controls: Motion (Full / Gentle / Still), Celebrations (Big /
Small / Off), Backgrounds (Moving / Still / Plain), Screen shake (Off by
default), Brightness (Normal / Dim). No flashing ever.

## 3. Why sensory settings matter for real students

- A meta-analysis of 14 studies found autistic individuals differ most
  from peers in sensory under-responsiveness, then over-responsiveness and
  sensation seeking, with the biggest differences in children aged 6 to 9
  (Ben-Sasson et al., 2009). A 2019 update covering 55 studies and 4,606
  autistic individuals found large differences in over-responsiveness,
  and over-responsiveness was the one sensory pattern that also set
  autistic people apart from other clinical groups (Ben-Sasson et al.,
  2019).
- Sensory over-responsiveness is also estimated at roughly 15 to 20% of
  children overall, not only autistic children (reported in coverage of
  recent population research), which means several students in a typical
  class of 25.
- Some students need *more* stimulation (sensation seekers), not less.
  That is why Gamify uses levels instead of a single on/off: the same
  game must work turned down for one child and turned up for another.

## 4. Haptics (vibration)

- iPads, Gamify's main device, have **no vibration motor**, and Safari on
  iPad does not support web vibration. Android phones and tablets do.
- **Gamify settings:** Haptics (On / Off) appears only on devices that
  support it, and never carries information that isn't also shown on
  screen. Off by default in Live (many buzzing devices in one room).
  If Gamify later ships as an installed iPad/iPhone app, haptics can work
  on iPhones.

## 5. Settings button: always there, always the same

Research and guidelines converge on predictability for neurodivergent
users: consistent layouts and controls in the same place (see
`docs/accessibility-research.md`, section 3). Game Accessibility Guidelines
also recommend that settings be reachable during play, not only from a
start menu.

**Gamify rule:** one gear button, same corner, same look, in every game and
every theme. Tapping it **pauses the game** (in solo and versus; in Class
Live it opens without pausing the class), works by touch, keyboard and
switch access, and is at least the size of a fingertip on an iPad.

## 5A. Seeing the shared screen: Share Mirror

Projected and cast screens are the hardest thing in the room for a student
with low vision: students in Kahoot! research already reported questions
that were hard to read on a projected screen (Wang & Tahir, 2020), and
that is for sighted students. Students with visual impairments commonly
have an IEP accommodation for their own copy of displayed material. WCAG
also asks that content can be zoomed and resized (1.4.4 Resize Text, 1.4.10
Reflow) and that changing information is available to screen readers
(4.1.3 Status Messages).

**Gamify answer:** Share Mirror (product plan section 4D), a live,
view-only copy of the Share board on the student's own device, with their
own zoom, contrast, read-aloud through headphones and screen-reader text
for every board change.

## 6. Color, text and reading

- Red-green color vision deficiency affects up to about 8% of males and
  about 0.5% of females of Northern European descent, less in other
  populations (Jiang et al. 2025 review, *Healthcare*). In a class of 25,
  that is often one or more students. **Rule:** no game ever uses color
  alone to carry meaning; every color cue also has a shape, icon or label.
  Setting: color-safe palette.
- Text size (3 sizes), reading comfort (letter and line spacing first, an
  alternate font second), high contrast mode, and read-aloud on every
  screen (see `docs/accessibility-research.md` for the evidence on
  spacing versus "dyslexia fonts").

## 7. Time, pace and input

- WCAG 2.2.1 (Timing Adjustable) asks that time limits can be turned off,
  adjusted or extended. In Kahoot! research, students named time pressure
  as a main stressor (Wang & Tahir, 2020).
- **Gamify settings:** Timers (Off / Relaxed / Normal), game speed (Slow /
  Normal / Fast), read-first time on the question screen, and controls
  that never require dragging, holding or fast repeated tapping (every
  game has a tap-only way to play). Left-handed layout option.

## 8. Culturally responsive and equitable design

### What the research says
- **Culturally relevant pedagogy** (Ladson-Billings, 1995) and
  **culturally responsive teaching** (Gay, 2018) hold that students learn
  best when instruction connects to their cultural knowledge, experiences
  and ways of learning, and holds high expectations for every student.
  **Culturally sustaining pedagogy** (Paris, 2012) adds that schooling
  should sustain students' languages and cultures, not just use them as a
  bridge.
- Hammond (2015) connects culturally responsive teaching to how the brain
  learns, including that many students come from communal, collective
  cultures where learning together, not ranked individual competition, is
  the natural way to learn.
- **Mirrors, windows and sliding glass doors** (Bishop, 1990): children
  need materials that reflect themselves (mirrors) and show others'
  lives (windows).
- **Who shows up in games:** a census of characters in popular video games
  found white, male, adult characters heavily over-represented and
  Latino, Native American, female, child and older characters
  under-represented (Williams et al., 2009).
- **Why avatars matter for learning:** players who identified more with
  their customized avatar felt more autonomy, competence and immersion,
  and persisted longer on a task (Birk et al., 2016).
- **UDL 3.0** (CAST, 2024) now names identity, belonging and bias as part
  of designing for every learner.
- Reviews of culturally responsive game-based learning are still small;
  co-designing games with children from the communities they serve is one
  of the more promising approaches (participatory design research on
  culturally responsive-sustaining computing games, NSF-funded).

### What Gamify does about it

| Area | Feature |
|---|---|
| **Avatars (mirrors)** | Wide range of skin tones, hair textures and styles, head coverings (hijab, turban/patka, kippah, headwrap), glasses, hearing aids, wheelchairs and mobility aids, non-gendered options; no single default "standard" kid |
| **Names** | Nicknames in any language and with accents; read-aloud says the name the way the student spells it; name filter tuned so real names from every culture are not wrongly blocked; teacher can fix |
| **Language** | Menus and read-aloud in more than one language (Spanish first, as the most common US home language after English), teacher can write bilingual questions; icons and audio carry meaning before text |
| **Ways of winning** | Team play, class goal bars and cooperative modes alongside competition, so collective learners are not forced into ranked individual play |
| **Themes (windows)** | Settings from many places (cities, farms, coasts, forests, many world regions), created with care and reviewed; no cultural costumes or stereotypes; sacred symbols and specific holidays only when a teacher chooses them; Theme Builder lets a class make a theme of their own community |
| **Content** | Teachers write the questions, so content can reflect their students; curated VLN packs written by diverse authors and checked for bias |
| **Feedback tone** | Growth language ("Not yet, try another!"), never shaming; no public "lowest score" |
| **Money and devices** | Every accessibility and equity feature free; Share needs no student devices; works on older iPads and Chromebooks; low-bandwidth friendly; solo games can keep working through a dropped connection |
| **Co-design** | Students help design themes and features (`docs/junior-designers-plan.md`), and teachers from different communities review new themes and avatars before release |

## 9. Who controls settings

- **Students** can change their own settings any time (autonomy; Ryan &
  Deci, 2000). Settings follow them across every game.
- **Teachers** can set class or per-student defaults (for example, a
  student's IEP calls for no timers and calm mode) and **lock** specific
  settings during an assignment.
- **Live:** teacher can mute all student devices at once.
- **Share:** the teacher's device controls the room's sound and
  visuals.
- **Presets** for one-tap setup: Calm, Low vision, Hearing, Quick start,
  each still adjustable.

---

## References

- Ben-Sasson, A., Hen, L., Fluss, R., Cermak, S. A., Engel-Yeger, B., & Gal, E. (2009). A meta-analysis of sensory modulation symptoms in individuals with autism spectrum disorders. *Journal of Autism and Developmental Disorders, 39*, 1-11. https://pubmed.ncbi.nlm.nih.gov/18512135/
- Ben-Sasson, A., Gal, E., Fluss, R., Katz-Zetler, N., & Cermak, S. A. (2019). Update of a meta-analysis of sensory symptoms in ASD: A new decade of research. *Journal of Autism and Developmental Disorders, 49*, 4974-4996. https://doi.org/10.1007/s10803-019-04180-0
- Birk, M. V., Atkins, C., Bowey, J. T., & Mandryk, R. L. (2016). Fostering intrinsic motivation through avatar identification in digital games. *Proceedings of CHI 2016*, 2982-2995. https://doi.org/10.1145/2858036.2858062
- Bishop, R. S. (1990). Mirrors, windows, and sliding glass doors. *Perspectives: Choosing and Using Books for the Classroom, 6*(3), ix-xi.
- CAST (2024). *Universal Design for Learning Guidelines version 3.0.* https://udlguidelines.cast.org/
- Game Accessibility Guidelines. Provide separate volume controls or mutes for effects, speech and background music. https://gameaccessibilityguidelines.com/provide-separate-volume-controls-or-mutes-for-effects-speech-and-background-music/
- Gay, G. (2018). *Culturally responsive teaching: Theory, research, and practice* (3rd ed.). Teachers College Press.
- Hammond, Z. (2015). *Culturally responsive teaching and the brain.* Corwin.
- IGDA Game Accessibility SIG. Top ten guidelines. https://igda-gasig.org/
- Jiang, et al. (2025). A global perspective of color vision deficiency: Awareness, diagnosis, and lived experiences. *Healthcare, 13*(16), 2031. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC12385717/
- Ladson-Billings, G. (1995). Toward a theory of culturally relevant pedagogy. *American Educational Research Journal, 32*(3), 465-491. https://doi.org/10.3102/00028312032003465
- Microsoft. Xbox Accessibility Guidelines, XAG 105: Audio accessibility. https://devdocs.xbox.com/gaming/accessibility/xbox-accessibility-guidelines/105
- Paris, D. (2012). Culturally sustaining pedagogy: A needed change in stance, terminology, and practice. *Educational Researcher, 41*(3), 93-97. https://doi.org/10.3102/0013189X12441244
- Participatory design-based research on culturally responsive-sustaining computational games with children (NSF Public Access Repository). https://par.nsf.gov/servlets/purl/10575517
- Ryan, R. M., & Deci, E. L. (2000). Self-determination theory and the facilitation of intrinsic motivation, social development, and well-being. *American Psychologist, 55*(1), 68-78.
- Wang, A. I., & Tahir, R. (2020). The effect of using Kahoot! for learning: A literature review. *Computers & Education, 149*, 103818. https://research.gold.ac.uk/id/eprint/39435
- W3C (2023). *Web Content Accessibility Guidelines (WCAG) 2.2*: Understanding 2.2.2 Pause, Stop, Hide; 2.3.3 Animation from Interactions; 1.4.2 Audio Control. https://www.w3.org/WAI/WCAG22/Understanding/
- Williams, D., Martins, N., Consalvo, M., & Ivory, J. D. (2009). The virtual census: Representations of gender, race and age in video games. *New Media & Society, 11*(5), 815-834. https://doi.org/10.1177/1461444809105354
- Device support for web vibration: Can I use, Navigator API vibrate. https://caniuse.com/mdn-api_navigator_vibrate

*Verification note:* game-guideline, WCAG, sensory meta-analysis, color
vision and vibration-support facts were checked against the linked pages
on 2026-10-24. The culturally responsive pedagogy books and articles are
foundational works cited from their published editions; the 2025 color
vision review's author list should be confirmed from the linked page
before formal citation.
