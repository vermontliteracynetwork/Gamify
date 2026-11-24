# Game Lab ideas: BASIC Computer Games

Teacher (2026-11-24): "add this link and the game ideas to the game lab
https://github.com/coding-horror/basic-computer-games"

- **Link:** https://github.com/coding-horror/basic-computer-games
- **What it is:** the 96 games from David H. Ahl's *BASIC Computer Games*
  (Creative Computing, 1978, the first million-selling computer book), with the
  original BASIC listings in one folder per game and community ports to C#,
  Java, JavaScript, Kotlin, Lua, Perl, Python, Ruby, Rust and VB.NET. The
  project's own README calls them "very old games ... more like classic
  programming exercises", which is why every idea below is a reimagining, not a
  port.
- **How this list was made (2026-11-24):** README and LICENSE read from
  raw.githubusercontent.com (opened). The GitHub API was not enabled for this
  session, so the game list is the README's progress table (folders 01 to 96);
  the individual game READMEs were not opened. One-line summaries of each game
  come from that table's names plus memory of the book, marked as such where it
  matters.

## License and our clean-room rule

- The repository's `LICENSE` is **the Unlicense** (a public domain dedication:
  "free to copy, modify, publish, use, compile, sell ... for any purpose,
  commercial or non-commercial").
- That covers the repository's contributions. It is not a statement about the
  1978 book's text, program listings or illustrations, which came from the book
  and its contributors. We do not rely on any license for them.
- **We take ideas only.** Game rules and mechanics are ideas, not protected
  expression (the idea/expression line, US Copyright Act 17 U.S.C. 102(b)).
  Per CLAUDE.md ("Game rules inspired by other platforms are reconstructed ...
  never copy") and `docs/question-engine.md`, Gamify never copies the code,
  printed text, prompts, ASCII art or names from this repo or the book. Each Lab
  game is rebuilt from scratch on the shared question engine, in the Classic
  style, with its own art and sound recorded in `docs/asset-ledger.md`.
- Names: a generic name (Golf, Checkers, Nim) stays. A distinctive coined or
  trademarked title (Hurkle, Mugwump, Super Star Trek, Mastermind, Hi-Q,
  Battleship-style Salvo, The Game of Life) gets an original working name,
  pending the usual trademark search (`docs/product-plan.md` section 3).

## How to read the table

- **Turn:** how a question turn drives it. Ways to play are Gamify's: Share
  (one screen, teams), Versus (two players), Solo, Live (own devices). "Right
  answer earns" is the reward the engine hands out.
- **Appeal:** kid appeal, 1 (low) to 3 (high), judged by the lens 2 gamer bar.
- **Effort:** S (a few days on existing Lab parts), M (new board or physics),
  L (new simulation or AI).
- **Fit:** Good / Maybe / Skip, with the reason. Duplicates were checked
  against `src/games` (Game Show, Board Game, Match Three, Four in a Row, Bubble
  Pop, Bowling, Pinball, Road Hop, Lunch Rush, Farm Grow, Memory Match, Match
  Up, Flashcards, Castle Quest, Cast and Catch, Territory) and `src/lab/games`
  (33 games, among them Snow Pal, Tic Tac Toe, Maze Dash, Gem Sweep, Letter
  Lock, Code Crackers, Hoop Shot, Touchdown Drive, Track Race, Word Scramble).

## Every game in the collection

| # | Original | Gamify working name | What it is (memory of the book) | Question turn | Appeal | Effort | Fit |
|---|---|---|---|---|---|---|---|
| 01 | Acey Ducey | In Between | Two cards are shown; bet whether the next lands between them | Share/Solo: a right answer earns a flip; guess "in between?" for bonus points, no betting | 2 | S | Maybe: gambling at heart; only as a no-money points guess |
| 02 | Amazing | (Maze) | Prints a random maze | Solo/Live: right answers open walls | 2 | M | Skip: Maze Dash already does it; borrow the random maze generator idea for Maze Dash levels |
| 03 | Animal | Guess My Creature | Computer guesses your animal by yes/no questions and learns new ones | Share: each right answer lets a team ask the mystery creature one yes/no question; the class teaches it new creatures | 3 | M | Good: classification and question-asking (science, vocabulary) |
| 04 | Awari | Seed Sow | Mancala: sow seeds around pits, capture | Versus/Share: a right answer earns a sowing turn; a miss passes | 2 | M | Good: ancient public domain game, counting practice for K-3 |
| 05 | Bagels | Clue Code | Guess a 3-digit number from "close/right place" clues | Solo/Versus: a right answer earns a guess and its clues | 2 | S | Maybe: overlaps Code Crackers and Letter Lock; could be a number mode of Letter Lock |
| 06 | Banner | - | Prints big block letters | - | 1 | S | Skip: a printout, not a game |
| 07 | Basketball | - | Text basketball with shot types | - | 2 | M | Skip: Hoop Shot already exists |
| 08 | Batnum | (Take Away) | Nim variant: take 1 to N objects, last one wins or loses | Versus: right answer earns a take | 1 | S | Maybe: fold into one Nim game (see 65) |
| 09 | Battle | Treasure Grid | Find the other side's hidden ships on a grid | Share/Versus: right answer earns one dig on a grid; find the hidden chests, sea creatures or snow forts | 3 | M | Good if reframed: no warships, hidden treasure instead |
| 10 | Blackjack | - | Card game 21 with bets | - | 2 | S | Skip: gambling; a no-money "make 21" adding game is possible later as a math mode |
| 11 | Bombardment | Snow Fort Hunt | Hide outposts on a grid, take turns guessing | Versus: right answer earns a snowball throw at a square | 2 | S | Maybe: only reframed as snowballs; overlaps Treasure Grid |
| 12 | Bombs Away | - | Wartime bombing missions | - | 1 | - | Skip: war and bombing |
| 13 | Bounce | - | Plots a bouncing ball's path | - | 1 | - | Skip: a printout; the physics idea lives in other games |
| 14 | Bowling | - | Text bowling | - | 2 | - | Skip: Bowling already exists |
| 15 | Boxing | - | Boxing match | - | 2 | - | Skip: fighting |
| 16 | Bug | Build a Bug | Roll dice to add body parts; first finished bug wins | Share/Versus/Live: right answer earns a roll; the roll adds a silly part (legs, antennae, wings) | 3 | S | Good: the goal visibly builds (Golden Rule), K-3 friendly, endless themes (robot, snow pal, monster) |
| 17 | Bullfight | - | Bullfighting | - | 1 | - | Skip: animal harm |
| 18 | Bullseye | Dart Toss (suction darts) | Throw at a target, pick throw strength vs accuracy | Solo/Share: right answer earns a throw; choose safe or risky throw | 2 | S | Maybe: close to existing aim games; fine as a quick Share filler |
| 19 | Bunny | - | Prints a bunny picture | - | 1 | - | Skip: a printout |
| 20 | Buzzword | Silly Sentence Machine | Builds random jargon phrases | Share: right answers earn word tiles; the machine mashes them into a silly sentence the class reads | 2 | S | Maybe: good for parts of speech (pairs with the grammar engine idea), low game depth |
| 21 | Calendar | - | Prints a calendar | - | 1 | - | Skip: a printout |
| 22 | Change | Corner Shop | Makes change for a purchase | Solo/Live: shoppers buy; a right answer pays the right coins; a busy line builds | 2 | M | Good: money math, play money only (no prices or buy words on real items) |
| 23 | Checkers | Checkers | Checkers vs computer | Versus/Share: answer right to move; a miss passes | 2 | M | Maybe: classic Versus game; Slime Chess covers the strategy slot |
| 24 | Chemist | Potion Mix | Dilute an acid with the right amount of water | Solo: right answer pours the right ratio; wrong ratio makes a silly fizz (no harm) | 2 | S | Maybe: ratios for grades 5 to 8 |
| 25 | Chief | - | Number trick puzzle | - | 1 | - | Skip: a trick, not a game |
| 26 | Chomp | Cookie Chomp | Players bite a grid cookie; whoever takes the bad corner loses | Versus/Share: right answer earns a bite; the broccoli corner is the "loser" bite | 3 | S | Good: simple strategy, very readable board, funny ending |
| 27 | Civil War | - | Civil War battle simulation | - | 1 | - | Skip: war |
| 28 | Combat | - | Army battle simulation | - | 1 | - | Skip: war |
| 29 | Craps | - | Dice gambling | - | 1 | - | Skip: gambling |
| 30 | Cube | Cube Crawl | Move through a 3D cube avoiding hidden traps | Solo: right answer earns a step; hidden puddles send you back | 1 | M | Maybe: 3D coordinates are hard to read at a glance |
| 31 | Depth Charge | Sonar Search | Find a hidden submarine in 3D with distance hints | Share/Solo: right answer earns a sonar ping to find a hiding whale or lost robot | 2 | M | Maybe: only reframed (no attacks); coordinates for older grades |
| 32 | Diamond | - | Prints diamond patterns | - | 1 | - | Skip: a printout |
| 33 | Dice | Dice Lab | Rolls dice many times and counts totals | Share: right answers earn rolls; a live bar chart shows which totals come up most | 2 | S | Maybe: probability lesson more than a game |
| 34 | Digits | - | Computer predicts your next digits | - | 1 | - | Skip: abstract |
| 35 | Even Wins | (Nim) | Take objects; end with an even count to win | Versus | 1 | S | Maybe: fold into one Nim game (see 65) |
| 36 | Flip Flop | Flip Flop | Flip a row of X's to O's with chain flips | Solo: right answer earns a flip | 1 | S | Maybe: light puzzle |
| 37 | Football | - | Text football | - | 2 | - | Skip: Touchdown Drive already exists |
| 38 | Fur Trader | - | 1700s fur trading trips | - | 1 | - | Skip: hunting and a colonial frame |
| 39 | Golf | Mini Golf | A round of golf with club choice | Solo/Share/Live: right answer earns a putt; aim and power, silly holes (windmill, volcano, ice) | 3 | M | Good: new sport, weighty physics, holes as themes |
| 40 | Gomoko | Five in a Row | Gomoku: five in a row on a big grid | Versus/Share: right answer earns a stone | 2 | S | Maybe: close to Four in a Row; could be its "big board" mode |
| 41 | Guess | (Number guess) | Guess a number with higher/lower | Solo | 1 | S | Skip: thin; see Hi-Lo |
| 42 | Gunner | Snowball Lob | Set an angle to hit a far target | Share/Solo: right answer earns a lob; pick the angle | 2 | M | Maybe: only reframed (snowballs or a catapult at a target); angles for older grades |
| 43 | Hammurabi | Village Keeper | Run an ancient city: grain, land, people | Solo/Live: each right answer earns a harvest or builder; the village visibly grows; no one is hurt by a bad year, crops just wilt | 2 | L | Maybe: strong for grades 5 to 12 economics and history; needs a gentle reframe |
| 44 | Hangman | - | Guess the word before the drawing finishes | - | 2 | - | Skip: Save the Snow Pal is our version (product plan section 3) |
| 45 | Hello | - | A chatty program | - | 1 | - | Skip: not a game |
| 46 | Hexapawn | Pawn Push | Tiny 3x3 pawn game where the computer learns from losses | Versus: right answer earns a move; the robot gets smarter each round | 2 | M | Maybe: lovely "the computer learns" lesson for computer science |
| 47 | Hi-Lo | Higher or Lower | Guess a hidden number with higher/lower clues | Share: right answer earns a guess; fewer guesses, bigger prize | 1 | S | Maybe: quick number-sense warmup |
| 48 | High IQ | Peg Jump | Peg solitaire | Solo: right answer earns a jump | 1 | S | Maybe: solo puzzle; avoid the "Hi-Q" name |
| 49 | Hockey | Puck Rush | Text hockey game | Live/Share: right answers earn passes and shots; teams race to score | 3 | M | Good: new sport, fast team play |
| 50 | Horserace | - | Bet on a horse race | - | 2 | - | Skip: betting; Track Race already covers racing |
| 51 | Hurkle | Find the Fluffle | Find a creature hiding on a grid from compass hints | Share/Solo/Live: right answer earns a guess and a compass hint (north, southeast...) | 3 | S | Good: directions and coordinates, giggly reveal, K-5 |
| 52 | Kinema | - | Physics questions about a thrown ball | - | 1 | - | Skip: a quiz, not a game (question set idea) |
| 53 | King | - | Rule an island nation's economy | - | 1 | L | Skip: Village Keeper covers it |
| 54 | Letter | (Letter guess) | Guess a letter with before/after clues | Solo | 1 | S | Maybe: alphabet order warmup for K-1, as a Letter Lock mode |
| 55 | Life | Cell Garden | Conway's Game of Life patterns | Share: right answers earn seeds to plant; watch the garden grow by the rules | 2 | M | Maybe: beautiful science and patterns demo; avoid "Game of Life" name |
| 56 | Life for Two | Garden Clash | Two-player Game of Life | Versus: right answers earn seeds; biggest garden wins | 2 | M | Maybe: after Cell Garden |
| 57 | Literature Quiz | - | A children's literature quiz | - | 1 | - | Skip: Game Show and every quiz already do this |
| 58 | Love | - | Prints a word art poster | - | 1 | - | Skip: a printout |
| 59 | Lunar LEM Rocket | Moon Lander | Land on the moon with limited fuel | Solo/Live/Share: right answer earns a fuel burst; land softly for the gold flag | 3 | M | Good: tense, physics with weight, clear goal |
| 60 | Mastermind | Color Code | Guess a hidden color code from peg clues | Versus/Solo: right answer earns a guess | 2 | S | Maybe: overlaps Code Crackers and Letter Lock; avoid the trademarked name |
| 61 | Math Dice | Dice Add | Add two dice | Solo: dice math | 1 | S | Skip: a question set, not a game; dice can be a question type |
| 62 | Mugwump | Hide and Seek Pals | Find hidden creatures with distance hints | Share: right answer earns a guess and a "how far" ring | 2 | S | Maybe: make it the distance mode of Find the Fluffle |
| 63 | Name | - | Sorts the letters of your name | - | 1 | - | Skip: Word Scramble covers it |
| 64 | Nicomachus | Mind Reader | Guesses your number from remainders | - | 1 | S | Skip: a math trick; good blog post, not a game |
| 65 | Nim | Last Cookie | Take objects from rows; last one wins | Versus/Share: right answer earns a take; one game with Batnum, Even Wins and 23 Matches as rule modes | 2 | S | Maybe: classic strategy, very cheap |
| 66 | Number | - | Random number points game | - | 1 | - | Skip: luck only |
| 67 | One Check | - | Checker jumping solitaire | - | 1 | - | Skip: covered by Peg Jump |
| 68 | Orbit | - | Hit an orbiting enemy ship | - | 1 | - | Skip: space combat; Pixel Blaster covers space |
| 69 | Pizza | Pizza Drop | Deliver pizzas on a coordinate map | Solo/Live: right answer earns a delivery to the house at (x, y); a busy town builds | 3 | M | Good: coordinate grids (grades 3 to 6), cozy theme |
| 70 | Poetry | Poem Machine | Writes random poems | Share: right answers earn lines; the class reads its silly poem | 2 | S | Maybe: reading aloud fun, light game |
| 71 | Poker | - | Poker | - | 1 | - | Skip: gambling |
| 72 | Queen | Queen to the Corner | Move a queen; first to the corner wins | Versus: right answer earns a move | 1 | S | Maybe: small strategy puzzle |
| 73 | Reverse | Flip the Line | Reverse runs of numbers to sort a list | Solo: right answer earns a flip | 1 | S | Maybe: sequencing; Sort Rush covers sorting |
| 74 | Rock Scissors Paper | Rock Paper Scissors | The hand game | Live/Share: right answer earns a throw at the class mascot or another team | 3 | S | Good: instant, every kid knows it; a quick Live warmup |
| 75 | Roulette | - | Roulette betting | - | 1 | - | Skip: gambling |
| 76 | Russian Roulette | - | Revolver game | - | - | - | Skip: violence; never reframe |
| 77 | Salvo | - | Grid ship battle with several shots | - | 2 | - | Skip: merge into Treasure Grid as a "three digs" power-up |
| 78 | Sine Wave | - | Prints a sine wave | - | 1 | - | Skip: a printout |
| 79 | Slalom | Ski Run | Ski through gates | Live/Solo/Share: right answers carve through gates; misses wobble | 3 | M | Good: winter theme pairs with Snow Pal; fast and readable |
| 80 | Slots | - | Slot machine | - | 1 | - | Skip: gambling; Mystery Box power-ups cover surprise |
| 81 | Splat | Sky Dive | Open the parachute at the right moment | Solo/Share: right answer opens the chute; land on the target circle | 2 | S | Maybe: fun timing; no crash ever (bounce into a hay pile) |
| 82 | Stars | Star Guess | Guess a number; more stars means closer | Share: right answer earns a guess | 1 | S | Skip: covered by Higher or Lower |
| 83 | Stock Market | Lemonade Stocks | Buy and sell shares over days | Solo: right answers earn coins to invest | 1 | L | Maybe: financial literacy for grades 7 to 12; check "no buy words" on student pages |
| 84 | Super Star Trek | - | Starship mission sim | - | 2 | L | Skip: trademarked name and combat; a space rescue quest could borrow the "sectors" map idea |
| 85 | Synonym | - | Synonym quiz | - | 1 | - | Skip: a question set; add a synonym set template instead |
| 86 | Target | - | 3D target shooting | - | 1 | - | Skip: shooting |
| 87 | 3-D Plot | - | Prints a 3D surface | - | 1 | - | Skip: a printout |
| 88 | 3-D Tic-Tac-Toe | Cube Tic Tac Toe | Tic tac toe on a 4x4x4 cube | Versus | 2 | M | Maybe: a "hard mode" of Tic Tac Toe for older students |
| 89 | Tic-Tac-Toe | - | Tic tac toe | - | 2 | - | Skip: Tic Tac Toe already exists |
| 90 | Tower | Tower Shuffle | Towers of Hanoi | Solo/Share: right answer earns a disc move; fewest moves wins a star | 2 | S | Maybe: classic logic puzzle, good for math and CS |
| 91 | Train | - | Speed and time word problem | - | 1 | - | Skip: a question type |
| 92 | Trap | Trap the Number | Trap a hidden number between two guesses | Share | 1 | S | Skip: covered by Higher or Lower |
| 93 | 23 Matches | (Nim) | Take 1 to 3 matches, last loses | Versus | 1 | S | Maybe: a Last Cookie rule mode (no matches for K-3) |
| 94 | War | Top Card | Card game: higher card wins | Share/Versus: right answer flips your card; higher card takes the pile | 2 | S | Maybe: rename for tone; very simple |
| 95 | Weekday | - | Day of the week for any date | - | 1 | - | Skip: a tool, not a game |
| 96 | Word | (Word guess) | Guess a 5-letter word from letter clues | Solo | 2 | S | Skip: Letter Lock already covers it |

## Top 10 to build next in the Lab

Ranked by Golden Rule fit (a goal that visibly builds, motion with weight,
read at a glance), kid appeal, learning value and effort.

1. **Build a Bug** (16). Every right answer adds a silly body part; the goal
   builds in front of the class. S effort, K-12, every theme can reskin it.
2. **Moon Lander** (59). Fuel for right answers, a tense soft landing. Real
   weight and gravity.
3. **Find the Fluffle** (51, with 62 as a distance mode). Compass hints teach
   directions and coordinates; big giggle on the reveal.
4. **Mini Golf** (39). New sport, silly themed holes, aim and power.
5. **Treasure Grid** (09, with 77 as a power-up). Team vs team digging for
   hidden chests in Share; no warships.
6. **Guess My Creature** (03). The class asks yes/no questions and teaches the
   robot new creatures: questioning skills and classification.
7. **Cookie Chomp** (26). Two-minute Versus strategy with a funny broccoli
   ending.
8. **Pizza Drop** (69). Coordinate grids with a cozy delivery town that builds.
9. **Ski Run** (79). Fast winter racer that pairs with Snow Pal themes.
10. **Seed Sow** (04). Mancala, an ancient public domain game, counting for
    K-3 and strategy for older students.

Next in line: Corner Shop (22), Puck Rush (49), Rock Paper Scissors (74),
Village Keeper (43).

Challenge for the teacher: Build a Bug and Cookie Chomp lean on luck and
strategy, so a fast clicker could win without learning. Keep the engine rule
that only a right answer earns a roll or a bite (the balance-check skill's
"winning without learning" test), and playtest with one K-2 class before adding
more of these.

## Reframes

- **No violence.** Battle, Salvo and Bombardment become hidden treasure or
  snowball forts; Depth Charge becomes a sonar search for a hiding whale;
  Gunner becomes a snowball or catapult lob at a target. Splat never crashes
  (a hay pile bounce). Bombs Away, Boxing, Bullfight, Civil War, Combat,
  Target, Orbit, Russian Roulette and Super Star Trek stay Skip.
- **No gambling.** Poker, Blackjack, Craps, Roulette, Slots and Horserace stay
  Skip. Acey Ducey survives only as a no-money "in between?" points guess.
  Surprise lives in Mystery Box power-ups, never in a bet.
- **No harm in sims.** Hammurabi's bad years wilt crops; nobody starves. Fur
  Trader stays Skip (hunting and a colonial frame).
- **Names.** Distinctive or trademarked titles (Hurkle, Mugwump, Mastermind,
  High IQ, Life, Super Star Trek) get original names before anything ships,
  pending the trademark search.
- **Printouts and tools** (Banner, Bunny, Calendar, Diamond, Love, Sine Wave,
  3-D Plot, Weekday, Hello) are not games. A few (Nicomachus, Kinema, Synonym,
  Train, Math Dice) are better as blog posts or question set templates.
