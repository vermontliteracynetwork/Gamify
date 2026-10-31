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
      'The team whose turn it is glows in the scores. They pick a card.',
      'The question appears for everyone. The team taps an answer. A miss brings a new question, up to three.',
      'A right answer turns the card over: points, or a power-up. The card then shows that team\'s icon.',
      'Play passes to the next team until every card is turned.',
    ],
    pieces: [
      { name: 'Cards', what: 'Numbered cards in a grid, from 4 x 3 up to 6 x 6. Each hides points or a power-up.' },
      { name: 'Category grid', what: 'A second board: up to five question sets as columns, with 100 to 500 point squares.' },
      { name: 'Scores', what: 'Every team with its icon and points. Whose turn it is glows.' },
      { name: 'Power-ups', what: 'Double Star doubles a team\'s points, Swap Spinner trades scores with a team, Sneaky Magnet takes points from a team, Prize Bag adds bonus points. Swap Spinner and Sneaky Magnet start off, so play stays friendly; teachers turn them on if they like, and switch any power-up off.' },
    ],
    rules: ['Up to 10 teams, or two players in Versus.', 'One question per turn to earn a card (the teacher can allow 3 tries or unlimited).', 'Most points wins; ties share the win.'],
    settings: ['Teams on the big screen, or two players head to head (Versus).', 'Tries for each turn: one (the default), three or unlimited.', 'Surprise cards or category grid.', 'Card grid size.', 'Which power-ups are in play.', 'Teams: you make them, random, the whole class against the computer or against you.'],
    tips: ['Use the category grid for a unit review across several sets.', 'Turn on Full screen on the smart board.'],
  },
  {
    gameId: 'pinball',
    goal: 'Answer right, aim through one of five zones, stop the power bar and shoot the ball into a pocket of points. Most points after the last round wins.',
    steps: [
      'A question comes first. A right answer earns a shot.',
      'Aim: tap a numbered zone across the middle of the table, or use the arrow buttons.',
      'Tap Launch. The power bar swings up and down; tap Shoot to stop it. More power sends the ball farther, bouncing off the walls.',
      'The ball drops into the pocket it reaches and its points go to the team (or to you in Solo).',
    ],
    pieces: [
      { name: 'Launcher', what: 'The ball always starts at the bottom center, between the flippers.' },
      { name: 'Zones 1 to 5', what: 'Five labeled spots across the middle of the table. The aim arrow points through the zone you pick.' },
      { name: 'Pockets', what: 'Three in round 1 and one more each round, up to ten. They move and change value every round: 10 to 100 points, with big values rare at first and more common later on.' },
      { name: 'Power bar', what: 'Like casting in Cast and Catch: stop it low for a short shot, high for a long one.' },
      { name: 'Power-ups', what: 'Super Shooter makes the next shot land in a pocket, Golden Ball doubles the next shot, Prize Bag adds bonus points.' },
    ],
    rules: ['Each round, every team takes one shot after its question.', 'Share: three questions to earn each shot.', 'Solo: rounds are your number of shots.', 'Most points wins.'],
    settings: ['Teams, two players head to head (Versus), or solo.', 'Rounds.', 'Power-ups on or off.'],
    tips: ['Ask the class which zone and how much power, and why: a quick talk about angles and estimating.'],
  },
  {
    gameId: 'castle-quest',
    goal: 'Answer right, roll the die and hop along the winding forest trail. Cross bridges, grab power-ups and be the first to reach the castle and build it.',
    steps: [
      'A question comes first. A right answer earns a roll of the die.',
      'Tap Roll the die. The die tumbles across the board, the spaces ahead light up, and your pawn hops that many spaces along the trail.',
      'Land on the foot of a bridge and you walk across the river to a later bend of the trail.',
      'Land on a glowing power-up space to collect it. Most power-ups wait for your next turn under the race panel.',
    ],
    pieces: [
      { name: 'The trail', what: 'One winding trail of hexagon spaces through meadows, forest and two rivers, from the red Start flag to the castle gate. A dotted line shows the way; no numbers to read.' },
      { name: 'Bridges', what: 'Wooden bridges cross the rivers between bends of the trail and carry you ahead, like ladders.' },
      { name: 'The castle', what: 'It is built layer by layer as the leader gets closer: walls, then towers, then roofs, and flags in the winner\'s color when someone arrives.' },
      { name: 'The race panel', what: 'Each player\'s hero with a bar that fills toward the castle. Whose turn it is glows.' },
      { name: 'Power-ups', what: 'Magnet (sticks to the right answer on your next question), Potion (your roll counts 3 times), Stopwatch (hop 5 times faster), Shield (nothing pushes you back for 3 rounds), Lightning (send another player back a roll), Treasure Chest (a surprise, good or not so good) and Tornado (everyone lands somewhere new).' },
    ],
    rules: ['Teams take turns on one screen, or two players go head to head (or one against the computer).', 'A wrong answer passes the turn.', 'First to the castle wins.'],
    settings: ['Teams or Versus.', 'Power-up spaces on or off.'],
    tips: ['Count the hops out loud together: a quick counting practice for younger players.'],
  },
  {
    gameId: 'cast-catch',
    goal: 'Cast your line, answer while the bobber floats, then reel in a fish. Better casts catch rarer fish worth more points.',
    steps: [
      'Tap Cast, then tap Stop when the line meter is in the green.',
      'Answer the question while the bobber floats.',
      'A right answer reels in a fish. A fun fact comes with every catch.',
      'Cast again until the clock runs out.',
    ],
    pieces: [
      { name: 'Fish', what: 'Common fish are worth 10, uncommon 25, rare 50 and super rare 100 points.' },
      { name: 'Clock', what: 'The game lasts the minutes the teacher sets.' },
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
      'Three or more of the same piece in a row pop and score.',
      'When the moves run out, a question break refills them.',
      'Play the rounds the teacher sets.',
    ],
    pieces: [
      { name: 'Board', what: 'A grid of pieces to swap. Each piece has its own shape and color.' },
      { name: 'Moves and rounds', what: 'Each round has a number of moves; the panel shows the score and round.' },
      { name: 'Power-ups', what: 'Pocket Watch (more moves), Prize Bag (bonus points), Double Star (next match doubles).' },
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
      'Tap a column to drop your piece to the lowest open spot.',
      'Line up four of your pieces to win.',
    ],
    pieces: [
      { name: 'Board', what: 'Seven columns, six rows.' },
      { name: 'Pieces', what: 'Each player has their own color and icon.' },
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
      { name: 'Power-ups', what: 'Bubble Bundle (more bubbles), Prize Bag (bonus points), Double Star (next pop doubles).' },
    ],
    rules: ['Bubbles bounce off the walls.', 'Bubbles cut off from the top fall and score too.'],
    settings: ['Question breaks.', 'Questions each time.', 'Power-ups on or off.'],
    tips: ['Show how a bank shot off the wall works before students play.'],
  },
  {
    gameId: 'bowling',
    goal: 'Answer right to roll the ball down the lane and knock over the pins. Most points after the last frame wins.',
    steps: [
      'A question comes first. A right answer earns a roll.',
      'Tap to aim: an arrow sweeps across the lane; tap when it points where you want.',
      'Tap to spin: a meter swings left and right; tap to put a curve on the ball and throw.',
      'Watch the pins scatter. Pins bump each other, and a pin that wobbles may or may not fall. Two rolls each frame.',
      'The scores add up frame by frame.',
    ],
    pieces: [
      { name: 'Lane and pins', what: 'A glossy wooden lane with gutters on both sides and ten pins under the neon sign. Every roll plays out with real pin action, so no two are the same.' },
      { name: 'Aim and spin meter', what: 'Under the lane. Calm motion swaps it for two sliders and a Throw button.' },
      { name: 'Frames', what: 'Each frame has two rolls.' },
      { name: 'Power-ups', what: 'Golden Pin (2x points), Pin Magnet (the ball pulls pins toward it), Pin Twister (the pins shake and some fall), Bumper Rails (no gutter ball), Fireball (a giant ball), Mystery Box (surprise points) and Sneaky Swipe (take points from the leader).' },
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
      'Tap an answer. A right answer adds a star that pops into the sky.',
      'Keep going until the sky is full.',
    ],
    pieces: [
      { name: 'Sky', what: 'Fills with stars as answers come in.' },
      { name: 'Class sky', what: 'Live with the class: fill one sky together, or race in each student\'s own star color.' },
    ],
    rules: ['A miss brings a new question.', 'Together or compete: the teacher chooses.'],
    settings: ['Number of questions.', 'Live: together or compete, and when it ends (a number right or a time).'],
    tips: ['Use it as a calm warm-up on the big screen.'],
  },
];
