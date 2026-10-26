// Frequently asked questions (teacher, 2026-10-25): nobody has asked yet, so
// Claudia wrote the questions each buyer and user would ask, answered the way
// Kayden answers. Value before price, plain words, no other brand names, no
// em dashes. Prices appear only on these teacher-facing public pages.

export type FaqGroup = 'schools' | 'teachers' | 'students' | 'homeschool';
export interface Faq { q: string; a: string }

export const FAQ_GROUPS: FaqGroup[] = ['teachers', 'schools', 'homeschool', 'students'];

export const FAQS: Record<FaqGroup, Faq[]> = {
  schools: [
    { q: 'What does a school plan include, and what does it cost?', a: 'Every teacher gets Pro: all games, unlimited classes and students, unlimited theme creations, full report history and early access to new games. Schools save 10% from 5 teachers, 20% from 10 and 30% from 25. Get a printable quote in about a minute on the Pricing page, no sales call needed.' },
    { q: 'Can we pay with a purchase order?', a: 'Yes. School plans are yearly and prepaid, and purchase orders are welcome with net 30 terms. Send your quote to your business office and we invoice you.' },
    { q: 'Will you sign our student data privacy agreement?', a: 'Yes. Send your district or state agreement with your quote request or through the Tell Gamify button, and we sign it.' },
    { q: 'What student data does Gamify collect?', a: 'Only what a classroom game needs: a first name or nickname, a sign-in picture and 4-digit PIN, which class the student is in (Plus and Pro), and their answers in games. No student emails, birthdays, addresses, photos or location. No ads, no trackers, and nothing is ever sold.' },
    { q: 'Who owns the data?', a: 'Your school and your teachers do. Teachers can download every class, set and report at any time, and deleting a class deletes its students and their results.' },
    { q: 'How does Gamify handle student privacy laws?', a: 'Gamify is built around them: the minimum data, used only to run the classroom, under the school\'s direction, never for advertising. Our Privacy page and the agreement we sign spell out the details.' },
    { q: 'Is Gamify accessible?', a: 'Gamify is built to meet WCAG 2.1 level AA, and we can send our accessibility conformance report. Read-aloud, calm mode, text size, high contrast, extra tries and every other accessibility feature are free on every plan, never an upgrade.' },
    { q: 'What devices and browsers does it work on?', a: 'iPads, Chromebooks, Windows and Mac laptops, and classroom smart boards, in a current web browser. Nothing to install. Game screens size themselves to fit with no scrolling.' },
    { q: 'What does our IT team need to do?', a: 'Usually nothing. If your filter blocks new sites, the For school IT page lists the few addresses to allow.' },
    { q: 'Does it work with our class rosters and learning platform?', a: 'Teachers paste a class list in seconds, and students join with a class code or a link that works in any learning platform. Sign-in through school rostering services is on our plan.' },
    { q: 'Can we try it before buying for the whole school?', a: 'Yes. Any teacher can start free today, teachers can join the beta test, or you can start with a few teachers and add more when it proves itself. Seats added later get the same discount.' },
    { q: 'How long does it take teachers to learn?', a: 'Most teachers have a class playing within their first ten minutes: five Get Started steps, a ready-made library of question sets, and a Help page. School plans include a free online kickoff for your teachers.' },
    { q: 'Is there research behind it?', a: 'Yes. Every move in Gamify is a practice question, and studies found practice questions help students remember. Our Research page explains what studies found, in plain words, with links to each study and honest notes on what they do not show.' },
    { q: 'What happens if we stop subscribing?', a: 'Teachers move to the Free plan and nothing is deleted. Classes and sets past the Free limits become read-only until you subscribe again or remove some.' },
  ],
  teachers: [
    { q: 'Is the Free plan really free?', a: 'Yes, forever. One class of up to 30 students, the free games, every accessibility feature, and you can design your own Game Show theme. No card needed.' },
    { q: 'What do Plus and Pro add?', a: 'Plus unlocks every game, a theme your class designs for each game, 3 classes of up to 60 students and unlimited question sets, for only $8 a month, billed yearly. Pro removes every limit and adds early access to new games and unlimited theme creations per game, for only $15 a month.' },
    { q: 'How long does it take to get started?', a: 'About five minutes: make a class, paste your class list, pick a ready-made set or write your own, and show the class code. The Get Started steps walk you through it.' },
    { q: 'Do I have to write my own questions?', a: 'You can, and that is where Gamify shines, but you do not have to. Start from the ready-made library, copy a set and edit it, or upload a spreadsheet.' },
    { q: 'Can I bring questions from a spreadsheet?', a: 'Yes. Upload a CSV with the question, up to four answers and the number of the right answer. You can also download any set as a CSV or copy it into a new Google Sheet.' },
    { q: 'How do my students get in?', a: 'Show your join code; students go to the join page, tap their picture and type their 4-digit PIN. No student emails or passwords. For a single game, share a game code or link: students tap their picture and PIN there too, so every answer lands under their name in your reports.' },
    { q: 'Do my students each need a device?', a: 'No. Share games like Game Show and Peg Drop run on one projector or smart board, with up to 10 teams, the class against the computer, or the class against you.' },
    { q: 'Can my school pay instead of me?', a: 'Yes. Make a school quote on the Pricing page in about a minute and forward it to your principal. Purchase orders are welcome.' },
    { q: 'Does it work for students who cannot read yet?', a: 'Yes. Every question can be read aloud, answers can have pictures, students sign in with pictures, and a read-first pause gives everyone time before answering.' },
    { q: 'Will older students think it is babyish?', a: 'Not when they choose the look. Themes can be grown-up or playful, the Game Show category grid suits unit reviews, and students can design themes themselves.' },
    { q: 'Can my class design a theme?', a: 'Yes. Print the template pages and draw by hand, or design in any drawing app at the exact sizes, then upload. Every theme is credited to your class, never to a student by name.' },
    { q: 'What reports do I get?', a: 'Every answer lands in Reports: by student, question, set, game, day or team, with the most common wrong answer, a review of what students remembered a week later, and a CSV download.' },
    { q: 'Does it support accommodations?', a: 'Yes, per student and behind your 4-digit teacher PIN: read-aloud, read-first time, number of tries, tools such as a calculator and times table, calm mode and text settings.' },
    { q: 'Can I cancel any time?', a: 'Yes. Your account moves to Free and nothing is ever deleted.' },
  ],
  homeschool: [
    { q: 'Can I use Gamify for homeschooling?', a: 'Yes. Your family is your class: add each child, assign their own question sets, and play together on one screen or one at a time.' },
    { q: 'Which plan should my family use?', a: 'Start on Free: one class (your family, up to 30), your own questions in any subject, and every accessibility feature, forever. Plus adds every game and a theme your children design for each one, for only $8 a month, billed yearly.' },
    { q: 'I teach several ages at once. Does that work?', a: 'Yes. Give each child their own sets, so a six-year-old practices letters while a twelve-year-old reviews fractions. For family game time, play a Share game together as one team against the computer.' },
    { q: 'Will it fit my curriculum?', a: 'Yes, because you write or import the questions. Any subject, any approach, any faith or none. The ready-made library is there when you want a quick start.' },
    { q: 'Can it help with my state\'s record keeping?', a: 'Reports show what each child practiced and how they did, by subject, set and day, ready to print or download for a portfolio.' },
    { q: 'Do I need a school email?', a: 'No. Any email works for the parent account, and your children never need one.' },
    { q: 'Our co-op wants to use it. Is there a group price?', a: 'Yes. Five or more families buy like a school: Pro for each parent-teacher with 10 to 30% off. Make a quote on the Pricing page.' },
    { q: 'I worry about screen time.', a: 'Games are short, every turn is a practice question, and Share games put the whole family around one screen together. Calm mode turns down motion and sound.' },
    { q: 'Can adults learn with it too?', a: 'Yes. Gamify works from pre-K to adult learners, and themes can look as grown-up as you like.' },
  ],
  students: [
    { q: 'Do I need an account or an email?', a: 'No. Your teacher adds you to the class. You tap your name and your two secret pictures to sign in.' },
    { q: 'What if I forget my pictures?', a: 'Ask your teacher. They can see your pictures and change them.' },
    { q: 'Can I play at home?', a: 'Yes, if your teacher shares a game code or a link. Type the code on the join page.' },
    { q: 'What happens if I get an answer wrong?', a: 'Nothing bad. You try again or see the right answer, and the game keeps going. There is no game over, and Let\'s Look Back helps you learn the ones you missed.' },
    { q: 'Can a question be read to me?', a: 'Yes. Tap Listen on any question.' },
    { q: 'Can I make the game look the way I want?', a: 'Yes, with your class. Your teacher can let your class design a theme with your own drawings, and you can pick the theme before each game.' },
    { q: 'Can I change the sound, the colors or the size of the words?', a: 'Yes. Tap the gear in any game for sound, motion, calm mode, text size and more.' },
    { q: 'Parents: what does Gamify know about my child?', a: 'Only a first name or nickname, sign-in pictures, their class and their answers in games. No emails, no photos, no location, and no one outside the class can see it.' },
    { q: 'Parents: will my child see ads or be asked to buy things?', a: 'Never. Student screens have no ads, no trackers, no prices and no buying, on every plan.' },
    { q: 'Parents: can children chat with strangers?', a: 'No. Gamify has no chat. Students only see their own class or the game their teacher shared.' },
  ],
};
