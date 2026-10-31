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
  // Topics a post belongs to, like 'homeschool' (shown on the Homeschool page).
  tags?: string[];
}

export const POSTS: Post[] = [
  {
    slug: 'designing-a-theme-file',
    title: 'Designing a Theme File, Step by Step',
    summary: 'How a class turns its own drawings into a game theme: pick a game, see every piece in its theme guide, design on blank templates, and add them in the Theme Builder.',
    cover: 'game-show',
    grades: 'K-12',
    minutes: 45,
    tags: ['themes'],
    body: [
      'A theme is the set of pictures a game wears: the background, the board, the pieces, the power-ups and the cover on the game card. Every game has its own list, and each game\'s theme guide in this Blog shows every piece with its exact size and what it needs.',
      'Start with the guide for the game you want. Each piece shows the Classic look marked Example, so students know what it is and where it goes, and a short list of what makes a good one: see-through backgrounds for things that move, strong contrast for anything with words, and bold shapes for small round pieces.',
      'Then pick how the class will design. Printable pages work for crayons and markers: one US Letter page per piece with the shape outlined. Print at 100% size, draw inside the dark line, and keep the corner squares clear so the Theme Builder can read the photo. Digital files work for any drawing app: one blank PNG per piece at the exact size, in one zip with a list of sizes.',
      'When the designs are ready, open the Theme Builder (signed in as a teacher), pick the game, and add them on the Upload tab: photos of the printed pages, or the PNG files. Anything left empty keeps the Classic look, so a class can make one piece a day.',
      'A few rules keep every theme safe to share: only the class\'s own art or art you have the rights to, no characters or logos from other games, shows or brands, and no photos or names of students.',
    ],
    tryIt: [
      'Open the Blog, tap Theme guides, and pick a game.',
      'Read the pieces together and split them up: one piece per student or pair.',
      'Download the printable pages or the digital files from the guide.',
      'Design each piece, then take photos or save the PNG files.',
      'Sign in, open the Theme Builder for that game, and add them on the Upload tab.',
    ],
  },
  {
    slug: 'one-set-a-whole-week-at-home',
    title: 'One Question Set, a Whole Week of Games at Home',
    summary: 'Play the same set in a different game each day. Your children get spaced practice, and it never feels like the same worksheet twice.',
    cover: 'game-show',
    grades: 'K-12',
    minutes: 15,
    tags: ['homeschool'],
    body: [
      'Learning scientists agree that practice spread over several days beats one long session. The trick at home is keeping it fresh, and that is where a single question set and five different games help.',
      'Pick or write one set for the week: spelling words, math facts, or vocabulary from a read-aloud. Every Gamify game uses the same set, so you write the questions once and your children meet them in a new game each day.',
      'A week can look like this. Monday, Game Show to meet the set together. Tuesday, Question Tracker, where each child fills their own night sky with stars. Wednesday, Game Show as a family against the computer. Thursday, Four in a Row, sibling against sibling. Friday, Bubble Pop, then look at Reports together to see what stuck.',
      'Because each child signs in with their own picture and PIN, every answer lands under their name, and Review at the end walks through the questions they missed.',
    ],
    tryIt: [
      'Sign up free and open Question sets.',
      'Pick a ready-made set, or write 10 questions of your own.',
      'Add each child on the Students page; each gets a picture and a PIN.',
      'Play Game Show today, and a different game each day after.',
      'On Friday, open Reports and look at each child\'s answers together.',
    ],
  },
  {
    slug: 'siblings-different-grades-one-game',
    title: 'Siblings at Different Grades, One Game Night',
    summary: 'A six-year-old and a ten-year-old can play the same game at the same table, each with questions and supports that fit them.',
    cover: 'game-show',
    grades: 'K-8',
    minutes: 30,
    tags: ['homeschool'],
    body: [
      'Teaching several ages at once is the everyday puzzle of homeschooling. Game night is a good place to solve it, because everyone wants to play anyway.',
      'Give each child their own set: letter sounds for the younger one, multiplication for the older one. Each child signs in with their own picture and PIN, so the game asks each of them their own questions.',
      'Supports are free and set per child: read-aloud, a few extra seconds to read first, more tries per question, and calm mode. A younger sibling can play right alongside an older one without anyone waiting or feeling rushed.',
      'For a whole-family round, put Game Show on the big screen with one shared set and play as a team against the computer.',
    ],
    tryIt: [
      'Add each child on the Students page.',
      'Make or pick one set for each child.',
      'Tap the gear beside a child to set their supports.',
      'Start a game, and let each child sign in with their picture and PIN.',
      'End with one Game Show round together, family against the computer.',
    ],
  },
  {
    slug: 'game-time-into-homeschool-records',
    title: 'Turn Game Time into Your Homeschool Records',
    summary: 'Reports show what each child practiced, how they did and how long they played, ready to download for a portfolio.',
    cover: 'star-quiz',
    grades: 'K-12',
    minutes: 10,
    tags: ['homeschool'],
    body: [
      'Many families keep a portfolio or a log of learning. Gamify keeps the record for you while your children play.',
      'Open Reports and group by student. For each child you see the questions they answered, the share they got right, how many they got right on the first try, their average time, the last day they played and the minutes played, plus any supports you set for them.',
      'Group by question to find the facts that are still tricky, or by day to see a week at a glance. Then download a spreadsheet file for your records.',
      'On the Free plan, reports keep 30 days. Plus and Pro keep every report, all year and beyond.',
    ],
    tryIt: [
      'Have each child play one game, signed in with their picture and PIN.',
      'Open Reports and choose Student.',
      'Tap a column to sort, or group by question to find tricky facts.',
      'Download the report and save it with your records.',
    ],
  },
  {
    slug: 'co-op-game-day',
    title: 'Run a Co-op Game Day on One Big Screen',
    summary: 'Turn a co-op class into a friendly tournament: teams, one shared set and one big screen.',
    cover: 'peg-drop',
    grades: 'K-12',
    minutes: 45,
    tags: ['homeschool'],
    body: [
      'A co-op class is a great place for a game day. Families bring children of many ages, and a shared screen turns review into a team event.',
      'Pick one set that fits the group, or one per age group. Put a Share game like Game Show or Peg Drop on the projector or TV, split the children into teams, and let each team answer together. Older children can read questions aloud for younger teammates.',
      'Co-ops of five or more families can buy like a school, with savings for every family. Each teacher keeps their own students, sets and reports.',
    ],
    tryIt: [
      'Pick one set for the group.',
      'Open a Share game on the big screen and make teams.',
      'Let teams take turns answering together.',
      'Look at Reports after to plan the next co-op day.',
    ],
  },
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
      'The theme is credited to your username, and you can add the designer\'s first name or a nickname, never a full name.',
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
      'Exit tickets are hard when half the class is still learning to read. Every Gamify game now ends with a two-tap review, pictures only: How did that game feel? Was it easy or tricky?',
      'Students tap a face, then a feather (easy), a target (just right) or a mountain (tricky). It takes five seconds, right on the results screen, before they play again.',
      'Gamify keeps only the counts, never who tapped what. Use them to plan tomorrow: more practice on a tricky set, or a harder one if most kids say easy.',
    ],
    tryIt: [
      'Share any game with your class by link, code or QR.',
      'When a game ends, each student taps a face, then Easy, Just right or Tricky.',
      'Look at the counts to plan the next lesson.',
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
      'Share a Bubble Pop game code; students type it on the join page and tap their name.',
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
      'A miss is gentle. The question goes away, a new one comes, and the missed one shows up at the end in Review so the class can talk it over and see the right answer.',
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
    cover: 'game-show',
    grades: '6-12',
    minutes: 40,
    body: [
      'To write a fair question with three believable wrong answers, a student has to know the material and the common mistakes around it. That makes question writing one of the best review activities there is, and older students take it seriously when they know their classmates will play it.',
      'Share a spreadsheet with the columns Gamify reads: the question, up to four answers, and which one is right. Each small group writes five questions on a topic. You import the whole sheet as one set and check it in the editor.',
      'Then the class plays it, in Cast and Catch for speed or Four in a Row head to head. Students notice fast when a question is unclear, which turns into a good conversation about precise wording.',
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
    summary: 'Two players, one device, real stakes: Four in a Row turns vocabulary review into a duel.',
    cover: 'four-in-a-row',
    grades: '6-12',
    minutes: 15,
    body: [
      'Vocabulary practice works when students recall the meaning again and again, spread over days. Head-to-head games make that repetition feel like a challenge instead of a chore.',
      'In Four in a Row, each player answers a question before dropping a piece, so the strategy only matters if you know your words. Every drop starts with a definition to recall.',
      'Run it as a station during the week with the same vocabulary set, and let partners switch every round. By Friday, students have practiced every term many times without a single flashcard drill.',
    ],
    tryIt: [
      'Make a vocabulary set: the term as the question, the definition as the right answer.',
      'Set up an iPad or laptop station for pairs.',
      'Partners play Four in a Row.',
      'Rotate partners each round and use the same set all week.',
    ],
  },
  {
    slug: 'standards-first-review',
    title: 'Standards-First Review: Filter by Common Core Code',
    summary: 'Pick the standard you are teaching this week, filter the sets, and play in two taps.',
    cover: 'peg-drop',
    grades: 'K-8',
    minutes: 10,
    body: [
      'Every question set in Gamify carries its subject, grades, tags and standard codes. That means you can start from the standard instead of hunting through folders.',
      'Type a code like 3.NF in the set picker and only the sets aligned to it stay on screen, each with a cover picture so you can tell them apart at a glance.',
      'Pick one, then share it with a game code. Reports later show how students did on that set, question by question.',
    ],
    tryIt: [
      'Open Question sets and type your standard code in the filter.',
      'Pick a set, then tap Play or share.',
      'Share it with a game code or link.',
      'Check Reports by set at the end of the week.',
    ],
  },
];
