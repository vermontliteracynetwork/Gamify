// How to Play help articles, one per game (teacher, 2026-10-31: "a help blog
// with screenshots and text description of all game play features,
// elements, and rules"). Plain words, positive, no other brand names, no em
// dashes. Screenshots live in public/help/<game>-<shot>.png and are made by
// e2e/help-shots.spec.ts from the real game, so they stay current.

export interface HowToPlay {
  gameId: string;
  goal: string;
  steps: string[];
  pieces: { name: string; what: string }[];
  rules: string[];
  settings: string[];
  tips: string[];
}

export const SHOTS = ['welcome', 'setup', 'question', 'play'] as const;

// Rules every game shares, shown in each article.
export const SHARED_RULES = [
  'Every question can be read aloud: tap Listen, or turn on read-aloud in the gear.',
  'A wrong answer never ends the game. In most team games a team gets three questions to earn its move (Game Show lets the teacher pick one try, three or unlimited); in solo games a new question comes until one is right.',
  'Missed questions come back in Review at the end, where the teacher can walk the class through each one.',
  'The gear opens sound, motion, calm mode, text size and more. Full screen fills a smart board.',
];

export const HOW_TO_PLAY: HowToPlay[] = [
  {
    gameId: 'game-show',
    goal: 'Teams take turns picking cards on the big screen. A right answer turns the card over for points or a power-up. The team with the most points when every card is gone wins.',
    steps: [
      'The teacher makes teams (or the class plays against the computer or the teacher) and picks a question set and a card grid.',
      'Each turn opens with the team\'s icon, big and glowing. The team taps it to begin, and their row glows in the scores.',
      'Surprise cards: the question comes first. A right answer lets the team pick a card, and it turns over in place to show the prize: points, or a power-up. Bigger prizes get a bigger show. The card then shows that team\'s icon.',
      'Category grid: the team picks a square, then answers its question for those points.',
      'A miss brings a new question when the teacher allows more tries.',
      'Play passes to the next team until every card is turned.',
    ],
    pieces: [
      { name: 'Cards', what: 'Numbered cards in a grid, from 4 x 3 up to 6 x 6, inside a frame of marquee lights. Each hides points or a power-up.' },
      { name: 'Lucky card', what: 'Each turn one closed card glows pink with an x2 badge. Win it for double points.' },
      { name: 'Bonuses', what: 'Fill a whole row or column with your own cards for +10, and get three right in a row for +10 more.' },
      { name: 'Category grid', what: 'A second board: up to five question sets as columns, with 100 to 500 point squares.' },
      { name: 'Scores', what: 'Every team with its icon and points. Whose turn it is glows.' },
      { name: 'Power-ups', what: 'Double Star doubles a team\'s points and Prize Chest adds bonus points. No power-up ever takes points from another team, and teachers can switch any power-up off.' },
    ],
    rules: ['Up to 10 teams, or two players in Versus.', 'One question per turn to earn a card (the teacher can allow 3 tries or unlimited).', 'Most points wins; ties share the win.'],
    settings: ['Teams on the big screen, or two players head to head (Versus).', 'Tries for each turn: one (the default), three or unlimited.', 'Surprise cards or category grid.', 'Card grid size.', 'Which power-ups are in play.', 'Teams: you make them, random, the whole class against the computer or against you.'],
    tips: ['Use the category grid for a unit review across several sets.', 'Turn on Full screen on the smart board.'],
  },
  {
    gameId: 'pinball',
    goal: 'Answer right, pick one of five lanes and the ball shoots at once. It bounces off pegs, can grab stars for power-ups and drops into a pocket of points. Most points after the last round wins.',
    steps: [
      'Questions come first: the teacher sets how many right answers (1 to 5) earn a shot.',
      'Pick a lane: tap a numbered lane, 1 to 5, across the middle of the table. The ball shoots right away, always at the same power, so the lane is the choice that matters.',
      'The ball flies up, bouncing off the walls and the pegs, so no two shots are the same. Every peg it hits is worth 10 points and plays the next note of a tune. On the line between two pockets it rattles before it drops.',
      'Stars float on the table. A ball that passes through one grabs it, and that player gets a power-up for their next turn.',
      'The ball drops into the pocket it reaches and its points go to the team (or to you in Solo). Sometimes a falling ball gets a lucky flip back up.',
    ],
    pieces: [
      { name: 'Pegs', what: 'Round pegs in new spots every turn: two at the start, up to six as the game goes on. Each hit is worth 10 points and plays a note. Peg points count even if the ball goes down the drain.' },
      { name: 'Stars', what: 'One to three stars float on the table each turn. Grab one with the ball for a power-up on your next turn.' },
      { name: 'Launcher', what: 'The ball always starts at the bottom center, between the flippers.' },
      { name: 'Lanes 1 to 5', what: 'Five numbered lanes across the middle of the table. The aim arrow points through the lane you pick.' },
      { name: 'Bonus lights', what: 'Six lights under the pockets. Every peg or wall hit lights one for the player shooting. All six lit: the next pocket that player lands is worth 50 more.' },
      { name: 'Pockets', what: 'Three in round 1 and one more each round, up to ten. They move and change value every round: 10 to 100 points, with big values rare at first and more common later on.' },
      { name: 'Power-ups', what: 'Golden Ball (2x points), Super Shooter (the ball always reaches a pocket), Jackpot Magnet (the ball rolls to the biggest pocket), Bouncy Ball (10 points for every bounce, up to 8) and Mystery Bottle (surprise points). No power-up takes points from another player.' },
    ],
    rules: ['Each round, every team takes one shot after its questions.', 'Each player fills their own bonus lights.', 'A wrong answer gets a new question, up to three tries.', 'Solo: rounds are your number of shots.', 'Most points wins.'],
    settings: ['Teams, two players head to head (Versus), or solo.', 'Rounds.', 'Questions each shot (1 to 5).', 'Each power-up on or off.'],
    tips: ['Ask the class which lane, and why: a quick talk about angles, bounces and aiming for a star.'],
  },
  {
    gameId: 'castle-quest',
    goal: 'Answer right, roll the die and move that many squares along a classic game board. First to the Finish square wins.',
    steps: [
      'A question comes first. A right answer earns a roll of the die.',
      'Tap Roll the die. The die tumbles over the board and your round piece hops one square at a time.',
      'Land on Lose a turn and you sit out your next turn. Land on Roll again and you roll one more time.',
      'Power-ups hide under ordinary squares, in new places each game. Land on one to find it. Most switch on by themselves at the start of your next roll.',
    ],
    pieces: [
      { name: 'The board', what: 'A flat board of square spaces that winds back and forth from Start to Finish, in light blue, yellow, red and sage. Every hop lands on one square, and squares never show numbers.' },
      { name: 'Special squares', what: 'Lose a turn (an hourglass) and Roll again (circling arrows), scattered in new places each game.' },
      { name: 'The die', what: 'A flat classic die. A theme can draw all six sides on one page.' },
      { name: 'Players', what: 'Each team or player is a round badge in its own color and icon, the same as in every Gamify game. Whose turn it is glows.' },
      { name: 'The race panel', what: 'Each player\'s badge with a bar that fills toward the Finish flag, plus an hourglass when they lose a turn.' },
      { name: 'Board length', what: 'Short, Medium, Long or Extra long: about 10, 15, 20 or 25 rounds for each player.' },
      { name: 'Power-ups', what: 'Double roll (roll twice), 2x (your roll counts double), and Potion (your next two rolls count double). Each one only helps the player who finds it, and they come up evenly.' },
    ],
    rules: ['Teams take turns on one screen, or two players go head to head (or one against the computer).', 'A wrong answer passes the turn.', 'First to the Finish square wins.'],
    settings: ['Teams or Versus.', 'Board length.', 'Each power-up on or off.'],
    tips: ['Count the hops out loud together: a quick counting practice for younger players.'],
  },
  {
    gameId: 'cast-catch',
    goal: 'Cast your line, answer while the bobber floats, then reel in a fish. Better casts catch rarer fish worth more points.',
    steps: [
      'Tap Cast, then tap Stop when the line meter is in the green.',
      'Answer the question while the bobber floats. A fish shadow swims up to the bobber.',
      'When the bobber dips, tap Reel it in! The line pulls tight and the fish comes up with a fun fact.',
      'Cast again until the clock runs out.',
    ],
    pieces: [
      { name: 'Fish', what: 'Common fish are worth 10, uncommon 25, rare 50 and super rare 100 points.' },
      { name: 'Clock', what: 'The game lasts the minutes the teacher sets.' },
      { name: 'Fish book', what: 'Twelve kinds of fish to find. The first time a kind is caught on this device it says New!, and the book is kept from game to game. The results show every kind caught, with the rest as shadows.' },
      { name: 'Power-ups', what: 'Rainbow Fish (big points), Old Boot (a silly catch), Pocket Watch (more time), Golden Hook (next catch doubles), Message in a Bottle (a surprise).' },
    ],
    rules: ['A better cast means rarer fish.', 'Highest score when time is up.'],
    settings: ['Minutes.', 'Power-ups on or off.', 'Live: each student on their own device while the teacher watches.'],
    tips: ['Read the fish facts aloud as a class for a quick science moment.'],
  },
  {
    gameId: 'match-three',
    goal: 'Swap pieces to make rows of three or more. Out of moves? Answer questions to keep playing.',
    steps: [
      'Tap a piece, then a piece beside it, to swap them.',
      'Three or more of the same piece in a row pop and score. New pieces fall in, and new matches keep popping in a chain (Nice! Great! Amazing!).',
      'Make 4 in a row, an L shape or 5 in a row to get a special piece, then match it to set it off.',
      'When the moves run out, a question break refills them.',
      'Play the rounds the teacher sets.',
    ],
    pieces: [
      { name: 'Board', what: 'A grid of pieces to swap. Each piece has its own shape and color.' },
      { name: 'Moves and rounds', what: 'Each round has a number of moves; the panel shows the score and round.' },
      { name: 'Line pieces', what: 'Made from 4 in a row. A glowing piece with stripes and an arrow badge: it zaps its whole row or column.' },
      { name: 'Star burst', what: 'Made from an L or T shape. A glowing ring with a sparkle badge: it pops the 3 by 3 around it.' },
      { name: 'Rainbow', what: 'Made from 5 in a row. Swap it with any piece to pop every piece of that kind.' },
      { name: 'Star goal', what: 'A bar beside the board fills with points. Pass each line to earn a star, up to 3. The stars show in the results.' },
      { name: 'Power-ups', what: 'Pocket Watch (more moves), Prize Chest (bonus points), Double Star (next match doubles), Lightning (pops every piece of one kind) and Tornado (a brand new board).' },
    ],
    rules: ['Only swaps that make a match count.', 'Bigger matches score more.'],
    settings: ['Rounds.', 'Questions each break.', 'Power-ups on or off.'],
    tips: ['Great for quiet independent practice after a lesson.'],
  },
  {
    gameId: 'four-in-a-row',
    goal: 'Two players take turns. Answer your question, then drop your piece. Four in a row (across, up and down, or slanted) wins.',
    steps: [
      'The player whose turn it is glows in the scores.',
      'Answer the question. A right answer lets you drop a piece.',
      'Tap a numbered column to drop your piece. It falls behind the front of the board, bounces and clacks into the lowest open spot.',
      'Line up four of your pieces to win. The winning four glow and a light sweeps across them.',
    ],
    pieces: [
      { name: 'Board', what: 'Seven columns, six rows.' },
      { name: 'Pieces', what: 'Each player has their own color and icon.' },
      { name: 'Power-ups', what: 'Sometimes a right answer brings one for your next turn: Double Drop (drop two pieces this turn). No power-up ever moves or removes the other player\'s pieces.' },
    ],
    rules: ['Versus: two students on one device, two devices, or a student against the computer.', 'A full board with no four in a row is a draw.'],
    settings: ['Who plays: two people or a person against the computer, and its level.', 'Same device or two devices.'],
    tips: ['Pair students at a similar level, or play the computer on Easy for confidence.'],
  },
  {
    gameId: 'bubble-pop',
    goal: 'Answer questions to load your bubbles, then aim and shoot to match three of the same and pop them.',
    steps: [
      'Answer a question to load bubbles.',
      'Aim with your finger or the arrow keys; a dotted line shows the path.',
      'Let go (or press Space) to shoot.',
      'Three or more of the same touching bubbles pop and score.',
    ],
    pieces: [
      { name: 'Bubble wall', what: 'Rows of bubbles at the top; a new row slides in after a few shots with no pop.' },
      { name: 'Shooter', what: 'Shows the bubble you are holding and the next one.' },
      { name: 'Rainbow bubble', what: 'Striped with every color and a white star. It turns into whichever color pops the most where it lands.' },
      { name: 'Star burst bubble', what: 'Dark with a glowing ring and a sparkle. It pops every bubble near where it lands.' },
      { name: 'Combos', what: 'Pop on shot after shot for bonus points: Combo x2, x3 and more.' },
      { name: 'Power-ups', what: 'Bubble Bundle (more bubbles), Prize Chest (bonus points), Double Star (next pop doubles).' },
    ],
    rules: ['Bubbles bounce off the walls.', 'Bubbles cut off from the top fall and score too.'],
    settings: ['Question breaks.', 'Questions each time.', 'Power-ups on or off.'],
    tips: ['Show how a bank shot off the wall works before students play.'],
  },
  {
    gameId: 'bowling',
    goal: 'Answer right to roll the ball down the lane and knock over the pins. Most points after the last frame wins.',
    steps: [
      'Each player or team picks a bowling ball on the Teams page. That ball is their icon and the ball they roll.',
      'A question comes first. A right answer earns a roll.',
      'Tap to aim: an arrow sweeps across the lane; tap when it points where you want.',
      'Tap to spin: a meter swings left and right; tap to put a curve on the ball and throw.',
      'Watch the pins scatter. Pins bump each other, and a pin that wobbles may or may not fall. Two rolls each frame.',
      'The scores add up frame by frame.',
    ],
    pieces: [
      { name: 'Lane and pins', what: 'A big wooden lane with gutters on both sides and ten white pins at the far end, under a wall of paper confetti. Every roll plays out with real pin action, so no two are the same.' },
      { name: 'Aim and spin meter', what: 'Under the lane. Calm motion swaps it for two sliders and a Throw button.' },
      { name: 'Frames', what: 'Each frame has two rolls.' },
      { name: 'Balls', what: 'Ten bowling balls to pick from, one for each player or team. A theme can draw all ten.' },
      { name: 'Power-ups', what: 'Golden Pin (2x points), Pin Magnet (the ball pulls pins toward it), Pin Twister (the pins shake and some fall), Bumper Rails (no gutter ball), Lightning Ball (a giant ball) and Mystery Box (surprise points). No power-up takes points from another player.' },
    ],
    rules: ['Share: teams take turns, three questions to earn each roll.', 'Solo: answer, then roll.'],
    settings: ['Teams, two players head to head (Versus), or solo.', 'Frames.', 'Power-ups on or off.'],
    tips: ['Count the fallen pins together with younger classes.', 'Talk about aim and curve: where should you aim if the ball curves left?'],
  },
  {
    gameId: 'star-quiz',
    goal: 'Every right answer adds a star to the night sky. Fill the sky to finish.',
    steps: [
      'Read the question (or tap Listen).',
      'Tap an answer. A right answer sends a shooting star across the sky to its spot.',
      'Three or more right on the first try in a row: the new stars shine gold.',
      'Keep going until the sky is full.',
    ],
    pieces: [
      { name: 'Sky', what: 'Fills with stars as answers come in, in a new pattern every game. Shooting stars cross it now and then.' },
      { name: 'Golden stars', what: 'Earned on a streak of three or more first-try answers.' },
      { name: 'Class sky', what: 'Live with the class: fill one sky together, or race in each student\'s own star color.' },
    ],
    rules: ['A miss brings a new question.', 'Together or compete: the teacher chooses.'],
    settings: ['Number of questions.', 'Live: together or compete, and when it ends (a number right or a time).'],
    tips: ['Use it as a calm warm-up on the big screen.'],
  },
  {
    gameId: 'territory',
    goal: 'Mice sneak out of the little wooden door into the room. Right answers send cats to catch them, or, in Competitive, win the room for your team.',
    steps: [
      'The teacher opens the lobby; students join with the code on their own devices.',
      'Read the question on your device and tap an answer.',
      'Cooperative: every right answer sends a cat to catch a mouse. The caught mouse disappears in a puff of stars.',
      'Competitive: Cats against Mice. A right answer adds one of your animals and sends one of theirs away.',
    ],
    pieces: [
      { name: 'The room', what: 'The big screen: a plain wall, a wooden baseboard, a checker floor and a little arched wooden door the mice come out of.' },
      { name: 'Cats', what: 'Three looks: a gray tabby, an orange tabby and a black-and-white tuxedo cat.' },
      { name: 'Mice', what: 'Little brown, gray and white mice. They peek out of the door, then scurry in.' },
      { name: 'Poof', what: 'A soft puff of stars when a mouse is caught. Nobody is ever hurt; a scared cat runs out of the room.' },
    ],
    rules: ['A miss brings a new question and never costs anything.', 'Cooperative ends at the class goal or when the teacher stops it. Competitive ends when the teacher stops it, at a number right, or at a time; the team with more animals in the room wins it.'],
    settings: ['Cooperative or Competitive.', 'How often a mouse comes out: slow, normal or fast.', 'Competitive: what a right answer does (adds yours and sends theirs away, only adds, or only sends away).', 'Teams split evenly as students join; tap a student to move them.'],
    tips: ['Start on slow so younger students can watch each chase.', 'Count the animals in the room together before you end a Competitive round.'],
  },
];
