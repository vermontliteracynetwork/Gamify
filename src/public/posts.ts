// "Ways to use Gamify": the first blog posts for launch (development plan
// Stage 8; ideas from docs/product-plan.md section 10A). Plain words, a "try
// it tomorrow" box in every post, no other company names, no em dashes.
// Classroom photos (with releases) replace the game cover art before launch.

export interface Post {
  slug: string;
  title: string;
  summary: string;
  cover: string; // a game id; its cover art stands in for a classroom photo
  grades: string;
  minutes: number;
  body: string[];
  tryIt: string[];
}

export const POSTS: Post[] = [
  {
    slug: 'design-a-theme-as-a-class',
    title: 'Design a Theme as a Class, Then Play Fractions',
    summary: 'Every student draws one piece of the game. The class photographs the pages, and the game wears their art the same day.',
    cover: 'game-show',
    grades: 'K-8',
    minutes: 45,
    body: [
      'Kids care about a game more when they made part of it. The Theme Builder turns that into a lesson plan: print the template, hand each student a page, and let them design one piece of the game, like a card back, a team picture or the background.',
      'When the drawings are done, take a photo of each page with an iPad or phone. Gamify finds the outline on every page, straightens it, and cuts out the drawing, so the pieces drop into place without any cropping by hand.',
      'Then play. We like pairing a new theme with a fractions set in Game Show: teams pick a card, tap the right answer, and the card turns over to show points. The art on every card is theirs, and you will hear about it.',
      'The theme is credited to the class (Made by Room 12), never to a single student, so nobody\'s name appears on screen.',
    ],
    tryIt: [
      'Open Theme Builder, pick Game Show, and print the template.',
      'Give each student one page and 15 minutes to draw inside the outline.',
      'Photograph the pages and add them on the Draw it on paper tab.',
      'Type a theme name and your class name, then save.',
      'Start Game Show with a fractions set and pick your new theme.',
    ],
  },
  {
    slug: 'two-tap-exit-tickets',
    title: 'Two-Tap Exit Tickets for Pre-Readers',
    summary: 'A one-screen class check-in where each student taps a face and an easy or tricky picture. No names, no reading needed.',
    cover: 'sign-in',
    grades: 'K-3',
    minutes: 5,
    body: [
      'Exit tickets are hard when half the class is still learning to read. The class check-in asks two questions with pictures only, and reads them aloud: How did today feel? Was it easy or tricky?',
      'Students walk up one at a time and tap two big pictures. A star and a thank-you send them back to their seat, and the screen is ready for the next friend.',
      'Gamify keeps only the counts, never who tapped what. When everyone is done, you see the results as simple bars and can plan tomorrow: more practice on a tricky set, or a harder one if most kids say easy.',
    ],
    tryIt: [
      'Open your class and tap Class check-in.',
      'Set the iPad where students line up for the door.',
      'Each student taps a face, then Easy, Just right or Tricky.',
      'Tap Finish (teacher) to see the counts.',
    ],
  },
  {
    slug: 'bubble-pop-bell-ringer',
    title: 'Bubble Pop as a Bell-Ringer',
    summary: 'Five minutes of review that students ask for: every right answer loads five bubbles to aim and pop.',
    cover: 'bubble-pop',
    grades: 'K-8',
    minutes: 5,
    body: [
      'The first five minutes of class set the tone. Bubble Pop turns that warm-up into review: students answer a question from the set you assigned, and a right answer loads five bubbles.',
      'Aiming is a real skill. Students drag to aim, watch the dotted line bounce off the walls, and let go. Three of the same bubble pop, and anything left hanging falls for bonus points.',
      'Nobody loses. When the bubbles creep too low, the bottom rows puff away and play goes on. Every bubble has a shape as well as a color, so color-blind students play on the same terms.',
    ],
    tryIt: [
      'Assign this week\'s review set to your class.',
      'Students sign in and open Bubble Pop from their Arcade.',
      'Set 2 question breaks and 5 bubbles for each right answer.',
      'Check Reports afterward to see which questions were missed.',
    ],
  },
  {
    slug: 'watch-the-sky-fill',
    title: 'Watch the Sky Fill: Question Tracker for Independent Practice',
    summary: 'A calm practice mode where every right answer adds a star to a night sky, so progress is a picture.',
    cover: 'star-quiz',
    grades: 'K-5',
    minutes: 10,
    body: [
      'Some students do their best work without a scoreboard or a timer. Question Tracker is for them: a quiet night sky that fills with stars, one for every right answer.',
      'Stars come in different sizes and slowly turn, and they appear around the question box so a student always sees how far they have come.',
      'A miss is gentle. The question goes away, a new one comes, and the missed one shows up at the end in Let\'s Look Back so students can see the right answer.',
    ],
    tryIt: [
      'Pick a practice set and choose 10 questions.',
      'Turn on read-aloud in the settings for early readers.',
      'Let students work at their own pace during centers.',
      'Use the stars as a talking point: how full did your sky get?',
    ],
  },
  {
    slug: 'friday-review-vs-the-computer',
    title: 'Whole Class vs the Computer: A Friday Review Ritual',
    summary: 'One team, one goal: the class beats the computer on this week\'s questions before the weekend.',
    cover: 'four-in-a-row',
    grades: '1-8',
    minutes: 20,
    body: [
      'Team games are fun until one team pulls ahead. Playing as one class against the computer fixes that: everyone is on the same side.',
      'In Game Show or Peg Drop, set the class as one team and the computer as the other. The class picks a card or a drop spot, taps its answer, and the computer takes its turn on its own.',
      'Choose Easy, Medium or Hard for the computer. Start on Easy early in the year, and let the class vote to raise it once they win a few Fridays in a row.',
    ],
    tryIt: [
      'Open Game Show and pick this week\'s sets.',
      'On the Teams page, use one team and set the other side to the computer.',
      'Project it and let the class decide each answer together.',
      'Keep a tally of Friday wins on the board.',
    ],
  },
  {
    slug: 'standards-first-review',
    title: 'Standards-First Review: Filter by Common Core Code',
    summary: 'Pick the standard you are teaching this week, filter the sets, and play in two taps.',
    cover: 'match-up',
    grades: 'K-8',
    minutes: 10,
    body: [
      'Every question set in Gamify carries its subject, grades, tags and standard codes. That means you can start from the standard instead of hunting through folders.',
      'Type a code like 3.NF in the set picker and only the sets aligned to it stay on screen, each with a cover picture so you can tell them apart at a glance.',
      'Pick one, then Host it with a join code or Assign it to your class. Reports later show how students did on that set, question by question.',
    ],
    tryIt: [
      'Open Question sets and type your standard code in the filter.',
      'Pick a set, then tap Play or share.',
      'Host it with a join code, or assign it to the class.',
      'Check Reports by set at the end of the week.',
    ],
  },
];
