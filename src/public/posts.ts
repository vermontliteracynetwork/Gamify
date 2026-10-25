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
      'Photograph the pages and add them on the Upload tab.',
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
    slug: 'unit-review-tournament',
    title: 'Unit Review Tournament: Game Show Category Grid for Grades 8-12',
    summary: 'Turn a unit test review into a tournament: each column is a topic, every square is worth more the harder it gets.',
    cover: 'game-show',
    grades: '8-12',
    minutes: 30,
    body: [
      'Older students still love a scoreboard, as long as it feels like a real competition and not a worksheet in disguise. The category grid in Game Show works like a classic quiz show: up to five columns, one per question set, with squares from 100 to 500 points.',
      'Build one set per topic in the unit (for a biology unit: cells, genetics, evolution, ecology) and put them side by side. Teams pick a topic and a value, then tap their answer. Harder squares are worth more, so teams have to decide how confident they really are.',
      'For an extra push, play the class against you. Students love trying to beat the teacher, and it keeps the whole room on one team.',
    ],
    tryIt: [
      'Make or import one question set per topic in your unit.',
      'Open Game Show and choose Category grid.',
      'Pick up to five sets as the columns.',
      'Set up teams, or put the whole class against you.',
      'Afterward, check Reports by set to see which topic needs another look.',
    ],
  },
  {
    slug: 'students-write-the-questions',
    title: 'Students Write the Questions',
    summary: 'Writing a good multiple-choice question is harder than answering one. Let students build the review set, then play it.',
    cover: 'flashcards',
    grades: '6-12',
    minutes: 40,
    body: [
      'To write a fair question with three believable wrong answers, a student has to know the material and the common mistakes around it. That makes question writing one of the best review activities there is, and older students take it seriously when they know their classmates will play it.',
      'Share a spreadsheet with the columns Gamify reads: the question, up to four answers, and which one is right. Each small group writes five questions on a topic. You import the whole sheet as one set and check it in the editor.',
      'Then the class plays it, in Match Up for speed or Four in a Row head to head. Students notice fast when a question is unclear, which turns into a good conversation about precise wording.',
    ],
    tryIt: [
      'Share a spreadsheet with the columns Question #, Question Text, Answer 1 to Answer 4 and Correct Answer #.',
      'Each group writes five questions and three believable wrong answers each.',
      'Save the sheet as CSV, then in Question sets choose Import a spreadsheet.',
      'Check the questions, add the set details, then play it as a class.',
    ],
  },
  {
    slug: 'head-to-head-vocabulary',
    title: 'Head-to-Head Vocabulary for Middle and High School',
    summary: 'Two players, one device, real stakes: Four in a Row and Memory Match turn vocabulary review into a duel.',
    cover: 'four-in-a-row',
    grades: '6-12',
    minutes: 15,
    body: [
      'Vocabulary practice works when students recall the meaning again and again, spread over days. Head-to-head games make that repetition feel like a challenge instead of a chore.',
      'In Four in a Row, each player answers a question before dropping a piece, so the strategy only matters if you know your words. Memory Match pairs each term with its definition, so students have to recall and remember where they saw it.',
      'Run it as a station during the week with the same vocabulary set, and let partners switch every round. By Friday, students have practiced every term many times without a single flashcard drill.',
    ],
    tryIt: [
      'Make a vocabulary set: the term as the question, the definition as the right answer.',
      'Set up an iPad or laptop station for pairs.',
      'Partners play Four in a Row, or Memory Match with two players.',
      'Rotate partners each round and use the same set all week.',
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
