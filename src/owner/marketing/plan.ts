// The marketing team's content planner (owner's rule, 2026-11-24: "my
// marketers will work within my developer dashboard so i can see everything
// that they do and i always make the final call"). The team (the marketing
// agents in .claude/agents) writes every campaign, post and action here; the
// owner reads it on /owner (Marketing) and approves, asks for changes or says
// no. The rules every piece follows are docs/marketing-bible.md; plan.test.ts
// checks the ones a computer can check.

export type Platform = 'instagram' | 'facebook' | 'pinterest' | 'tiktok' | 'meta-ads' | 'google-ads';
export type Status = 'idea' | 'drafting' | 'needs-ok' | 'approved' | 'scheduled' | 'posted' | 'reviewed';
export type Funnel = 'see' | 'care' | 'try' | 'use' | 'pay' | 'tell';
export type Buyer = 'k5-teachers' | '612-teachers' | 'sped' | 'homeschool' | 'admins';
export type Pillar = 'value' | 'proof' | 'product' | 'personality' | 'offer';
export type Format = 'reel' | 'carousel' | 'image' | 'story' | 'pin' | 'video-pin' | 'tiktok' | 'search-ad' | 'social-ad';
export type Member = 'Marketing Director' | 'Brand Copywriter' | 'Social Planner' | 'Ads Strategist' | 'Trend Researcher' | 'Performance Analyst' | 'Owner';

export interface HistoryLine { at: string; by: Member; note: string }

export interface Results { reach?: number; views3s?: number; saves?: number; shares?: number; comments?: number; clicks?: number; signups?: number; paid?: number; spend?: number }

export interface Post {
  id: string; // p-0001; also the tracking link's utm_content
  date: string; // yyyy-mm-dd
  time: string; // hh:mm Eastern
  platform: Platform;
  format: Format;
  campaign: string; // Campaign id
  buyer: Buyer;
  funnel: Funnel;
  pillar: Pillar;
  principle: string; // bible section 5
  hook: string; // first line or first 2 seconds (pin title, ad headline)
  hooksTried?: string[]; // the other hook options
  caption: string; // caption, pin description or ad text
  onScreen?: string[]; // text per frame or slide
  canva?: string; // the Canva brief: template and fields
  design?: { canva: string; url?: string; thumb?: string }; // the finished Canva design (id, edit link, preview image)
  sound?: string; // with its license source
  tags?: string[]; // hashtags or pin keywords
  alt?: string; // alt text
  link: string; // tracking link; {site} until the domain is live
  lesson: string; // the lesson it applies, or "first test"
  status: Status;
  history: HistoryLine[];
  results?: Results;
}

export interface Campaign {
  id: string; name: string; goal: string; buyer: Buyer; message: string; offer: string;
  start: string; end: string; channels: Platform[]; budget: string; status: 'planning' | 'needs-ok' | 'running' | 'done';
}

export interface Activity { at: string; by: Member; what: string }

export const PLATFORMS: { id: Platform; label: string; color: string }[] = [
  { id: 'instagram', label: 'Instagram', color: '#f4a6a6' },
  { id: 'facebook', label: 'Facebook', color: '#b4c4fb' },
  { id: 'pinterest', label: 'Pinterest', color: '#f7b39a' },
  { id: 'tiktok', label: 'TikTok', color: '#a7e3c9' },
  { id: 'meta-ads', label: 'Meta ads', color: '#d6c8fb' },
  { id: 'google-ads', label: 'Google ads', color: '#fdfd94' },
];

export const STATUSES: Status[] = ['idea', 'drafting', 'needs-ok', 'approved', 'scheduled', 'posted', 'reviewed'];

export const CAMPAIGNS: Campaign[] = [
  { id: 'c-class-vs-teacher', name: 'Whole class vs the teacher', status: 'needs-ok',
    goal: 'Care, then Try: 300 saves and shares and 40 free sign-ups in January; the shareable moment that introduces Gamify. Buyer k5-teachers is targeting data only: every line of copy presents Gamify as K-12 (owner, 2026-11-25).',
    buyer: 'k5-teachers', message: 'The whole class vs the teacher, at any grade K-12. Can your class beat you?', offer: 'Free tier (one classroom, every accessibility feature)',
    start: '2026-12-01', end: '2027-01-31', channels: ['instagram', 'facebook', 'tiktok', 'pinterest'], budget: 'Organic only. Paid test proposed for January once the domain is live (Waiting on you).' },
  { id: 'c-beta', name: 'Join the beta test', status: 'needs-ok',
    goal: 'Try: 4 beta classrooms by January 15 (Waiting on you: pilots).',
    buyer: 'sped', message: 'Built by a teacher for students with high support needs, so it works for everyone, K-12.', offer: 'Join the beta test (free while testing; disclosed in every post a beta teacher makes)',
    start: '2026-12-01', end: '2027-01-15', channels: ['instagram', 'facebook'], budget: 'Organic only.' },
  { id: 'c-launch', name: 'Beta launch: meet Gamify (new social pages, Nov 29)', status: 'needs-ok',
    goal: 'See, then Try, launch week Nov 28 to Dec 6: 10 beta applications through /beta (toward 2 to 4 accepted classrooms, Waiting on you: pilots), 40 tracked link clicks, 30 saves and shares across the four pages. Followers are reported, never the goal. First test: no baseline yet, so these numbers are guesses the analyst replaces after week 1. Buyer k5-teachers is targeting data only: every line of copy presents Gamify as K-12 (owner, 2026-11-25).',
    buyer: 'k5-teachers', message: 'Built by a teacher for students with high support needs, so it works for everyone, K-12. Help build it: join the beta test.',
    offer: 'Track 1 of 2, join the beta test, exactly as it is live on /beta today: Gamify Pro free for 3 months in return for playing twice a week, 3 short surveys and honest feedback; the beta closes after 10 approved testers. Track 1 posts carry no price or countdown; the paid launch price is track 2 (c-launch-offer). The owner set 10 spots (src/beta/spec.ts), so "10 spots" is true and may be said; never "almost full" unless it is.',
    start: '2026-11-28', end: '2026-12-06', channels: ['instagram', 'facebook', 'pinterest', 'tiktok'],
    budget: 'Organic only (recommended for launch week). Optional, the owner decides: $25 total to boost p-0013 on Meta (5 days at $5 a day, adults 18+, education interests, stop if cost per beta application passes $10), only once the domain and an ad account exist (Waiting on you: mkt-launch-boost). Nothing spends without her OK.' },
  { id: 'c-launch-offer', name: 'Beta launch, track 2: launch price for teachers who just want to subscribe', status: 'needs-ok',
    goal: 'Pay: 10 paid Plus or Pro subscriptions from teachers and families who do not want to be beta testers, by the end of the launch sale (Dec 31, 2026; the owner set it to run until Jan 1, 2027). First test: no baseline. Buyer k5-teachers is targeting data only: every line of copy presents Gamify as K-12 (owner, 2026-11-25).',
    buyer: 'k5-teachers', message: 'Prefer to just subscribe? Take the launch sale on K-12 classroom games: an extra 10% off your first term.',
    offer: 'Owner decisions 2026-11-24 (approved). Standard prices: Plus $8 and Pro $15 a month; 3 months 5% off ($22.80 / $42.75), 6 months 15% off ($40.80 / $76.50), 1 year 20% off ($76.80 / $144), compared with monthly; each plan renews at its standard price for the same length until they cancel. Launch sale: an extra 10% off the FIRST term only, any plan and length, for subscriptions started before Jan 1, 2027 (Plus $7.20 / $20.52 / $36.72 / $69.12, Pro $13.50 / $38.48 / $68.85 / $129.60); it does not renew. Every post states the renewal at the standard price. Offer name Player One Sale, code PLAYERONE10 (owner 2026-11-27: no "subscriber" in the name). Decided 2026-11-26: a single teacher paying by school invoice gets the sale; bulk school seat plans do not. Teacher and parent pages only, never student pages. Cannot run until Stripe and the pricing page support 1, 3, 6 and 12-month renewals (billing-intervals).',
    start: '2026-12-03', end: '2026-12-31', channels: ['instagram', 'facebook', 'meta-ads', 'google-ads'],
    budget: 'Organic posts first. Ad copy is drafted for her OK with no budget set; any spend is her decision (mkt-ads, mkt-launch-boost).' },
  { id: 'c-pinterest', name: 'Pinterest: every question becomes a game (dev plan Part 5B)', status: 'needs-ok',
    goal: 'Try: Pinterest is a search engine, so we win on saves and outbound clicks, then free teacher sign-ups. First test, no baseline: by Jan 31, 2027, 150 saves, 60 outbound clicks and 5 free teacher sign-ups from utm_source=pinterest. Sign-ups can only be counted once the site records the first visit\'s utm_source at sign-up (Waiting on you: mkt-pinterest). The analyst replaces these guesses after 4 weeks of data. Buyer k5-teachers is targeting data only: every pin title and description presents Gamify as K-12; a grade-specific keyword only sits beside a K-12 keyword (owner, 2026-11-25).',
    buyer: 'k5-teachers', message: 'Every question becomes a game, for every grade K-12: one question set, every game on the site, and your class can design the look. No pin states a game count (it changes: 7 on 2026-11-25, Territory may be listed next). Real pages, real play, no prices on idea pins.',
    offer: 'Give first (reciprocity): free blog lesson ideas and theme guides; the free tier; the Game Show blank theme template, free with a free teacher account. Templates for the other 6 games come with Plus, Pro and Homeschool, so no pin calls them free. No Classic art is ever a download; printables are blank templates only.',
    start: '2026-12-01', end: '2027-02-28', channels: ['pinterest'],
    budget: 'Organic only. Promoted pins are not proposed until 4 weeks of organic data exist; any spend is the owner\'s decision. Boards, keywords and rhythm: docs/pinterest-plan.md.' },
  { id: 'c-theme-challenge', name: 'Theme Building Challenge 2027: rolling submissions and the public vote', status: 'planning',
    goal: 'Owner, 2026-11-26: "we can have posts for submissions, like rolling submissions, like new submission for theme builder challenge, and like post different people\'s art." A steady series all year: a post for each new approved submission, regular showcases of different teachers\' and classes\' art, each special-day winner announced at 12:00 am Eastern on the day itself, weekends included, by scheduled automated posts (owner, 2026-11-26), a daily call to vote while each quarter\'s public vote is open (anyone with the link, one top-3 vote per device per day, plus one class group vote a day from the teacher\'s account), and the top 10 and winners. Numbers to set with the Performance Analyst once Q1 entries arrive.',
    buyer: 'k5-teachers', message: 'Real classes are designing the look of their games. See the newest themes, vote for your favorites, and enter your own any time. K-12, every grade.',
    offer: 'Free to enter and free to vote; every community theme is free on every plan. Prizes per the challenge rules once the owner sets them.',
    start: '2027-01-01', end: '2027-12-31', channels: ['instagram', 'facebook', 'pinterest', 'tiktok'],
    budget: 'Organic first. Only approved community themes are posted, and every showcase shows student- or teacher-made art, never Gamify\'s own art (owner, 2026-11-26); credited to the teacher\'s username only if they chose credit; no student faces, names or voices, and student art only with the teacher\'s publish confirmation plus the marketing media release on the attorney list. Every post waits for the owner\'s OK.' },
  { id: 'c-upgrade', name: 'In-app upgrade strategy: locked features, the welcome screen and the beta filter (teacher pages only)', status: 'needs-ok',
    goal: 'Pay, from Try and Use: more paid Plus and Pro sign-ups, and approved beta testers who keep playing. Owner request 2026-11-26, word for word: "the teams need to determine a promotional strategy for the features that are locked for the free and plus plans (making sure they visable but behind a paywall) so people want them. on sign up, it would be good to show things theyd get if they upgraded to a paid plan right then. we want to make it easy and almost obvious to sign up for the paid plans so we make more money and have more sign up conversions which is always a goal". First test, no baseline: we watch the welcome-screen split, activation (first activity run in 7 days), which lock sells (peek opens, Get Plus taps, paid), beta testers still hosting 2 games a week at week 2 and 6, and guardrails (Not now rate, first-term cancels, nagging complaints, zero prompts on projected screens). None of it is counted today (lesson 2026-11-25: UTM links measure visits, not sign-ups). Full plan: docs/upgrade-strategy.md.',
    buyer: 'k5-teachers',
    message: 'Every locked feature stays in sight with a lock and a Plus or Pro chip, and one tap shows what it does for your K-12 class. Upgrade when you reach for it; Start Free is always one plain button.',
    offer: 'Welcome screen after sign-up, one decision: Plus (bright card, price for the length picked with its renewal line, the Player One Sale extra 10% off the first term until Jan 1, 2027), Pro beside it, and Start Free as a full yellow go button ("Free forever. No card needed."). Under them, only in the beta window (until Feb 28, 2027, owner 2026-11-26) and while spots remain, linking to the formal application page /beta/apply (built separately): apply to be a beta tester (Pro free for 3 months for playing twice a week and short surveys, 10 spots). Beta filter: work-first framing, a sharper application, weekly check-ins with a waitlist, and a "not picked" email with the launch sale; optional show-us-one-game gate and earned months (owner decides). Reverse trial option (owner decides): Plus free for 30 days from the first hosted game, no card, then Free; nothing locks during a live game. Five prompt patterns: lock + plan chip, peek sheet, limit meter, before-work wall, after-class card. Never on student pages or on a screen the class can see; one unasked card a session; accessibility never locked. Pro "new games before anyone else" is not promoted: no early-access setting exists in the code (2026-11-26). Lessons applied: 2026-11-24 check every number against the code (Free plays 4 of the 8 listed games); 2026-11-25 only Game Show templates are free.',
    start: '2026-12-01', end: '2027-02-28', channels: [],
    budget: 'No spend. In-app only (teacher pages). Building it is a dev-plan item once the owner OKs the shape; checkout waits on Stripe (billing-intervals). Decisions: Waiting on you, mkt-upgrade-strategy.' },
];

const T = (date: string) => `${date}T09:00:00`;
const link = (path: string, source: string, medium: string, campaign: string, id: string) =>
  `{site}${path}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${id}`;

export const POSTS: Post[] = [
  { id: 'p-0001', date: '2026-12-02', time: '16:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'proof',
    principle: 'Curiosity gap + peak-end rule: open on the score tied, end on the class cheer.',
    hook: 'POV: your class is 1 question away from beating you',
    hooksTried: ['I told my class they could never beat me at review. Big mistake.', 'The only review game where losing is the best part'],
    caption: 'They beat me. Again. Friday review is now a grudge match 😅 One question set, the whole class vs the teacher, at any grade K-12. Would your class beat you?',
    onScreen: ['Frame 1 (0-2s): "POV: your class is 1 question away from beating you" over the tied scoreboard', 'Frame 2: teacher\'s face as the last answer comes in (no student faces)', 'Frame 3: the class side wins, confetti on the board', 'Frame 4: "Gamify: the whole class vs the teacher"'],
    canva: 'Template "Reel text overlays": hook field = frame 1 text; end card = "The whole class vs the teacher". Screen recording: Share mode, class vs teacher round, sample nicknames only.',
    sound: 'Original audio: the teacher\'s voice only. Room audio with student voices needs signed releases first (bible 7.2, Waiting on you: mkt-releases). Game audio muted (some ledger sounds need a credit line).',
    tags: ['#teachersoftiktok', '#k12teacher', '#reviewgame', '#classroomgames'],
    alt: 'A classroom screen shows a review game where the class team beats the teacher team and confetti falls.',
    link: link('/', 'tiktok', 'social', 'tt_engage_care_k5-teachers_class-vs-teacher_202612', 'p-0001'),
    lesson: 'First test. Applies bible 6: TikTok rewards native, phone-shot classroom energy over polish.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Wrote 3 hooks; recommends the POV hook (curiosity gap, native format).' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER. Needs a filmed class round with no student faces (owner to film or approve a screen-only version).' }, { at: '2026-11-24T15:00:00', by: 'Marketing Director', note: 'Launch-plan review: the sound line said "the room", which would carry student voices; bible 7.2 needs a release for voices. Changed to teacher voice only until releases exist.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0002', date: '2026-12-03', time: '07:00', platform: 'instagram', format: 'reel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'proof',
    principle: 'Curiosity gap + peak-end rule (same idea as p-0001, native Instagram cut).',
    hook: 'Can your class beat you? Mine just did.',
    hooksTried: ['Friday review, but it\'s a grudge match', 'Stop running review. Start losing to your class.'],
    caption: 'Can your class beat you? Mine just did.\n\nOne question set becomes a team game on one screen: the whole class vs the teacher, for any grade K-12. No student accounts, no ads.\n\nSave this for Friday review ✨',
    onScreen: ['0-2s: "Can your class beat you?"', 'Scoreboard tied', 'Class wins, confetti', 'End card: "Save this for Friday review"'],
    canva: 'Template "Reel text overlays" (4 fields above) + "Reel cover": cover text "Class vs teacher".',
    sound: 'Meta Sound Collection upbeat track (business-licensed); name recorded once picked.',
    tags: ['#teachersofinstagram', '#reviewgame', '#k12teacher', '#classroomideas'],
    alt: 'Teacher reacts as the class team wins a review game on the classroom screen.',
    link: link('/', 'instagram', 'social', 'ig_engage_care_k5-teachers_class-vs-teacher_202612', 'p-0002'),
    lesson: 'First test. Bible 6: Instagram Reels are judged on shares and saves, so the CTA asks for a save.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Repurposed p-0001 for Instagram with a different first frame and caption.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0003', date: '2026-12-05', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Reciprocity: give a free, usable idea first; processing fluency: one big title.',
    hook: 'Whole Class Review Game for K-12: Class vs Teacher on Friday',
    caption: 'An easy whole-class review game for any grade, K-12: the class plays as one team against the teacher on one screen (Share mode), so no student devices are needed. Works with any question set you write or import. Step-by-step guide and free to try.',
    canva: 'Template "Pin 2:3": title = hook; image = Share mode board screenshot (Classic theme, on screen only); footer = "Free to try".',
    tags: ['whole class review game', 'k-12 review games', 'review game ideas', 'test prep games', 'no prep review activity'],
    alt: 'Pin titled Whole class review game for K-12, showing a colorful team game board on a classroom screen.',
    link: link('/blog', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_class-vs-teacher_202612', 'p-0003'),
    lesson: 'First test. Bible 6: Pinterest is search, so the title is the phrase teachers type.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Keyword title; links to the Ways to use Gamify blog. A dedicated class-vs-teacher post is in the blog ideas list (product-plan 10A).' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0004', date: '2026-12-08', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-beta', buyer: 'sped', funnel: 'try', pillar: 'personality',
    principle: 'Liking and unity (a teacher speaking to teachers) + authority (founder story), honest scarcity (only a few beta classrooms).',
    hook: 'I built Gamify because my students were left out of every review game.',
    caption: 'I built Gamify because my students were left out of every review game.\n\nSo every game has read-aloud, calm mode and its own settings, and accessibility is never a paid upgrade.\n\nI\'m looking for a few K-12 classrooms to test it this winter, especially special education, speech and intervention groups. Beta teachers use it free while we test. Comment BETA or tap the link.',
    canva: 'Template "Quote card": quote = hook; name line = "Kayden, founder and teacher"; photo = founder photo (owner to supply).',
    alt: 'Quote card from the founder: I built Gamify because my students were left out of every review game.',
    link: link('/beta', 'facebook', 'social', 'fb_conv_try_sped_beta_202612', 'p-0004'),
    lesson: 'First test. Applies bible 3: special education teachers act on accessibility first.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Founder voice; owner to confirm the story is in her words and add a photo.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (founder name and photo need her OK).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0005', date: '2026-12-10', time: '07:00', platform: 'instagram', format: 'carousel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'value',
    principle: 'Reciprocity + specificity: three ideas a teacher can use tomorrow.',
    hook: '3 ways to use ONE question set this week',
    caption: '3 ways to use ONE question set this week 👇\n\n1. Monday: whole class on one screen\n2. Wednesday: everyone on their own device\n3. Friday: the whole class vs the teacher\n\nSame questions, three games, any grade K-12. Save for planning day.',
    onScreen: ['Slide 1: "3 ways to use ONE question set this week"', 'Slide 2: Monday, one screen (Share mode)', 'Slide 3: Wednesday, own devices (Live)', 'Slide 4: Friday, class vs teacher', 'Slide 5: "Save for planning day"'],
    canva: 'Template "Carousel 4:5" (hook, 3 body slides, CTA slide); screenshots from each mode.',
    tags: ['#teachersofinstagram', '#teacherplanning', '#reviewgame', '#k12teacher'],
    alt: 'Five-slide guide showing three ways to play one question set: one screen, own devices, and class versus teacher.',
    link: link('/', 'instagram', 'social', 'ig_engage_care_k5-teachers_one-set-many-games_202612', 'p-0005'),
    lesson: 'First test. Bible 6: carousels earn saves; slide 1 is the hook, last slide the CTA.',
    status: 'drafting',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Drafted; waiting on screenshots of each mode before the bible check.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },
  { id: 'p-0006', date: '2026-12-12', time: '07:00', platform: 'instagram', format: 'carousel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'try', pillar: 'product',
    principle: 'Loss aversion and psychological safety: name the pain teachers already feel (a team that answered right and still lost), then the relief.',
    hook: 'Review games where nobody steals your points',
    hooksTried: ['The power-up that made my class cry (and why we left it out)', 'Fair fun: right answers decide the game'],
    caption: 'Review games where nobody steals your points.\n\nIn Gamify, power-ups only add to your own team. No stealing, ever. Every timer can be turned off, so the kids who need a little longer play too. Every grade, K-12.\n\nSave this for your next review day.',
    onScreen: ['Slide 1: "Review games where nobody steals your points"', 'Slide 2: Power-ups only add to your own team', 'Slide 3: Every timer can be turned off', 'Slide 4: Right answers decide the game', 'Slide 5: "Save this for review day"'],
    canva: 'Template "Carousel 4:5": hook slide, 3 feature slides with the Fair Play icons, CTA slide; screenshots of a power-up card and the timer setting.',
    tags: ['#teachersofinstagram', '#classroommanagement', '#reviewgame', '#k12teacher'],
    alt: 'Five-slide guide: power-ups only add to your own team, timers can be turned off, right answers decide the game.',
    link: link('/features', 'instagram', 'social', 'ig_traffic_try_k5-teachers_fair-play_202612', 'p-0006'),
    lesson: 'First test. Edge list item 1 (docs/marketing-bible.md section 13): the research shows stealing is the top complaint.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Built on the edge list: no stealing, timers off, right answers decide. No other site named.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  // Beta launch week (c-launch): the new pages go live Sunday 2026-11-29.
  // Truth checked 2026-11-24: 8 games listed on main (Territory added 2026-11-25) (src/games/registry.ts:
  // Game Show, Board Game, Match Three, Four in a Row, Bubble Pop, Bowling,
  // Question Tracker); the beta offer is word for word from /beta (src/i18n/en.ts).
  // Game audio is muted in every recording: some ledger sounds need a credit line.
  { id: 'p-0007', date: '2026-11-28', time: '10:00', platform: 'instagram', format: 'reel', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'see', pillar: 'personality',
    principle: 'Curiosity gap (Loewenstein, 1994): open a question that Sunday answers; mere exposure: the first of several touches so the profile is not empty on launch day.',
    hook: 'Sunday, we open the doors. Teachers wanted.',
    hooksTried: ['Built by a teacher. Opening Sunday.', 'Something new for Monday review opens Sunday.'],
    caption: 'Sunday, we open the doors. Teachers wanted.\n\nGamify is a K-12 classroom game site built by a teacher, and it is in beta. Tomorrow we share how your class can help build it.\n\nFollow so you see it first.',
    onScreen: ['0-2s: fast cuts of Game Show cards turning, Bowling pins falling and Bubble Pop bursting, text "Sunday."', '2-4s: "Built by a teacher."', '4-6s: "Teachers wanted."', 'End card: "Gamify beta opens Sunday 11/29"'],
    canva: 'Template "Reel text overlays": the 4 fields above, word for word. Screen recordings at 1080 x 1920 from the live site with sample nicknames only. End card on the locked brand frame.',
    sound: 'Meta Sound Collection upbeat instrumental (business-licensed; title recorded when picked). Game audio muted.',
    tags: ['#teachersofinstagram', '#k12teacher', '#classroomgames', '#reviewgame'],
    alt: 'Quick clips of three colorful classroom games on a screen, with the words: Sunday. Built by a teacher. Teachers wanted.',
    link: link('/beta', 'instagram', 'social', 'ig_aware_see_k5-teachers_meet-gamify_202611', 'p-0007'),
    lesson: 'First test. Applies trend watch 2026-11-24 (Instagram caps hashtags at 5; 4 used) and bible 6 (hook in the first 2 seconds).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Pre-launch teaser. Posts only if the Instagram account exists by Friday Nov 27 (Waiting on you: mkt-accounts). If not, skip it; the launch-day posts stand on their own. A brand-new page has no followers, so its real job is a non-empty grid on launch day.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on the account existing). Thanksgiving Day (Nov 26) left empty on purpose.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0008', date: '2026-11-28', time: '10:30', platform: 'facebook', format: 'image', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'see', pillar: 'personality',
    principle: 'Curiosity gap (Loewenstein, 1994) + reciprocity (Cialdini): say up front what is free.',
    hook: 'Coming Sunday: a K-12 classroom game site built by a teacher.',
    caption: 'Coming Sunday: a K-12 classroom game site built by a teacher.\n\nGamify turns one question set into a game your whole class plays on one screen, or on their own devices (Live). Read-aloud, calm mode and every accessibility setting are free on every plan.\n\nIt is in beta, and on Sunday we share how your classroom can help build it. Follow the Page so you see it.',
    canva: 'Template "Feature spotlight" (4:5): title "Coming Sunday"; subtitle "A K-12 classroom game site built by a teacher"; image = Game Show board screenshot (Classic theme, on screen only); footer "Gamify beta".',
    alt: 'A colorful game show board on a classroom screen with the words: Coming Sunday, a K-12 classroom game site built by a teacher.',
    link: link('/', 'facebook', 'social', 'fb_aware_see_k5-teachers_meet-gamify_202611', 'p-0008'),
    lesson: 'First test. Bible 6: Facebook reaches the older decision-maker audience, so the caption is practical and longer.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Teaser for the Facebook Page; posts only if the Page exists by Friday Nov 27 (mkt-accounts). The owner may also share it from her own profile; never into teacher groups (bible 6).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on the Page existing).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0009', date: '2026-11-29', time: '10:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-launch', buyer: 'sped', funnel: 'see', pillar: 'personality',
    principle: 'Liking and unity + authority (Cialdini): a teacher talking to teachers; storytelling (narrative transport, Green and Brock, 2000): before, the moment, after.',
    hook: "I'm a teacher, and I built the review game my whole class could play.",
    hooksTried: ['My students were left out of review games. So I built one.', 'Why I built a game site for students with high support needs'],
    caption: "I'm a teacher, and I built the review game my whole class could play. Read-aloud, calm mode and settings in every game, and accessibility is never a paid upgrade. Gamify is a K-12 game site in beta, and the link in bio is how you help build it.",
    onScreen: ['0-2s: the owner to camera, text "I\'m a teacher. So I built the game."', '2-9s: screen: a question read aloud; calm mode switched on', '9-16s: a Share mode game on the projector (screen only, no students in frame)', 'End (the peak): the class side wins on screen, text "Gamify is in beta. Link in bio."'],
    canva: 'Template "Reel text overlays": the 4 fields above. Phone-shot, vertical, about 20 seconds; owner films the talking part; screen parts recorded from the live site.',
    sound: 'Original audio (the owner\'s voice). Any music bed from the TikTok Commercial Music Library only; title recorded. Game audio muted.',
    tags: ['#teachersoftiktok', '#specialeducation', '#spedteacher', '#classroomgames', '#teachertok'],
    alt: 'A teacher talks to the camera, then a classroom screen shows a question read aloud and a class team winning a review game.',
    link: link('/beta', 'tiktok', 'social', 'tt_aware_see_sped_meet-gamify_202611', 'p-0009'),
    lesson: 'Applies p-0001 (TikTok rewards native, phone-shot, a real person; no student faces) and bible 3 (special education teachers act on accessibility first).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Founder intro, pinned to the profile. The owner confirms the story is in her own words before filming (core message 7, bible 4).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs her filmed clip).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0010', date: '2026-11-29', time: '16:00', platform: 'instagram', format: 'carousel', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'see', pillar: 'product',
    principle: 'Processing fluency (one idea per slide) + specificity (true numbers: 8 games, 4 ways to play); one CTA (Fogg behavior model).',
    hook: 'Meet Gamify: type your questions once, play them as 8 games.',
    hooksTried: ['Your question set, 8 games, 4 ways to play', 'Meet the review game site built by a teacher'],
    caption: 'Meet Gamify: type your questions once, play them as 8 games.\n\nWrite or import a question set for any grade, K-12, pick a game, and play it 4 ways: on one screen, on students\' own devices (Live), solo, or head to head. Read-aloud and calm mode are free on every plan. No student accounts, no ads, no trackers.\n\nWe are in beta and building it with teachers. Tap the link in bio to join the beta test.',
    onScreen: ['Slide 1: "Meet Gamify: one question set, 8 games"', 'Slide 2: "Write or import your questions once, any grade K-12"', 'Slide 3: "Pick a game: Game Show, Bowling, Board Game, Bubble Pop and more"', 'Slide 4: "Play 4 ways: one screen, own devices, solo, head to head"', 'Slide 5: "Read-aloud, calm mode and every setting: free"', 'Slide 6: "No student accounts. No ads. No trackers."', 'Slide 7: "We\'re in beta. Help build it: link in bio"'],
    canva: 'Template "Carousel 4:5": hook slide, 5 body slides with one screenshot each (set editor, Pick a game, the four way-to-play icons, the settings gear, the Features page Fair Play list), CTA slide.',
    tags: ['#teachersofinstagram', '#k12teacher', '#classroomgames', '#reviewgame', '#teacherresources'],
    alt: 'Seven-slide introduction to Gamify: write questions once for any grade K-12, pick from 8 games, play 4 ways, free accessibility, no student accounts or ads, and an invitation to join the beta.',
    link: link('/beta', 'instagram', 'social', 'ig_aware_see_k5-teachers_meet-gamify_202611', 'p-0010'),
    lesson: 'Applies p-0005 (carousel: slide 1 the hook, last slide the CTA) and trend watch 2026-11-24 (5 hashtags at most).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Pinned post 1 of 3. Game count (7) checked against src/games/registry.ts on 2026-11-24; recheck on Nov 28 in case a game ships or is hidden.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER. Cut a second CTA ("save this") so the piece has one ask.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0011', date: '2026-11-29', time: '18:00', platform: 'instagram', format: 'reel', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'care', pillar: 'product',
    principle: 'Pattern interrupt (von Restorff isolation effect) with fast cuts, then the peak-end rule (Kahneman): end on the win.',
    hook: 'Same 10 questions. 7 different games. Watch.',
    hooksTried: ['One question set, a whole week of games', 'Monday bowling, Friday game show, same questions'],
    caption: 'Same 10 questions. 7 different games. Watch.\n\nIn Gamify you write or import a question set once, then play it as Game Show, Bowling, Board Game, Bubble Pop, Match Three, Four in a Row or Question Tracker. Monday it is a bowling match, Friday a game show. Any grade, K-12: your questions, your level, and lots of themes to choose from.\n\nWhich one would your class pick first? Tell us in the comments.',
    onScreen: ['0-2s: one question card, text "Same 10 questions..."', '2-15s: 2-second cuts, each labeled: Game Show, Bowling, Board Game, Bubble Pop, Match Three, Four in a Row, Question Tracker, Territory', '15-18s (the peak): the Bowling strike and the Game Show win', 'End card: "One question set. 8 games. Gamify (beta)"'],
    canva: 'Template "Reel text overlays" (game labels as the step field) + "Reel cover": cover text "8 games, 1 question set". Screen recordings from the live site, Classic theme, sample nicknames.',
    sound: 'Meta Sound Collection upbeat track (business-licensed; title recorded when picked). Game audio muted.',
    tags: ['#teachersofinstagram', '#reviewgame', '#classroomgames', '#k12teacher'],
    alt: 'The same question plays across seven colorful classroom games in quick cuts, ending on a bowling strike and a game show win.',
    link: link('/', 'instagram', 'social', 'ig_engage_care_k5-teachers_one-set-many-games_202611', 'p-0011'),
    lesson: 'Applies p-0002 (Reels judged on shares and saves; native first frame) and bible 5 (peak-end: never end on a logo hold).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Pinned post 2 of 3, the game demo. Uses "8 games" rather than the bible\'s "dozens" because 7 is what main lists today.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0012', date: '2026-11-29', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'see', pillar: 'product',
    principle: 'Processing fluency (numbered steps) + reciprocity (free accessibility, free beta Plus) (Cialdini).',
    hook: 'Hi, we are Gamify: K-12 classroom review games built by a teacher, now in beta.',
    caption: 'Hi, we are Gamify: K-12 classroom review games built by a teacher, now in beta.\n\nHow it works:\n1. Write or import your questions once (a question set).\n2. Pick a game: Game Show, Bowling, Board Game, Bubble Pop and more.\n3. Play it your way: the whole class on one screen (no student devices needed), everyone on their own device (Live), solo practice, or head to head.\n\nWhat matters to us:\n- Read-aloud, calm mode and every accessibility setting are free on every plan.\n- No student emails, no ads, no trackers.\n- Power-ups never steal points, and every timer can be turned off.\n\nWe are looking for teachers to test it with their classes this winter. Beta testers get Gamify Pro free for 3 months. Details and the short form are at the link.',
    canva: 'Template "Feature spotlight" (4:5): title "Meet Gamify"; three icon rows "One screen", "Own devices", "Solo or head to head"; image = Share mode board screenshot.',
    alt: 'Meet Gamify, K-12: a classroom game board on a big screen with three ways to play: one screen, own devices, solo or head to head.',
    link: link('/beta', 'facebook', 'social', 'fb_aware_see_k5-teachers_meet-gamify_202611', 'p-0012'),
    lesson: 'First test. Bible 6: Facebook captions run longer and more practical; edge list (bible 13) lines used as proof.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Pinned Page post. Same idea as p-0010, written native for Facebook (never the same caption twice).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0013', date: '2026-11-29', time: '19:30', platform: 'instagram', format: 'reel', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'offer',
    principle: 'Reciprocity + commitment and consistency (Cialdini): the whole ask stated up front, no hidden strings; IKEA effect (Norton, Mochon and Ariely, 2012): people value what they help build.',
    hook: "Wanted: teachers who will tell me what's broken.",
    hooksTried: ['Want to help build a classroom game site?', 'Beta testers wanted (here is the whole deal)'],
    caption: "Wanted: teachers who will tell me what's broken.\n\nGamify is in beta. Beta testers play it with their class at least twice a week, answer 3 short surveys, and tap Tell Gamify when something breaks. In return: Gamify Pro free for 3 months, new games first, and your ideas built in. The beta closes after 10 testers are approved.\n\nAny grade K-12, special education, reading and ESL specialists, and homeschool families. Apply with the short form: link in bio.",
    onScreen: ['0-2s: the owner to camera, text "Wanted: teachers who will tell me what\'s broken"', '"You get: Gamify Pro free for 3 months"', '"You give: play twice a week + 3 short surveys"', '"About 20 minutes a month beyond playing"', 'End: "Apply: link in bio"'],
    canva: 'Template "Reel text overlays": the 5 fields above; owner films about 20 seconds to camera; cut-ins of the Tell Gamify button and the /beta page.',
    sound: 'Original audio (the owner\'s voice). Optional Meta Sound Collection bed under it; title recorded.',
    tags: ['#teachersofinstagram', '#betatesters', '#k12teacher', '#specialeducation', '#classroomgames'],
    alt: 'A teacher asks for beta testers; on-screen text lists what testers get, Gamify Pro free for 3 months, and what they give, playing twice a week and 3 short surveys.',
    link: link('/beta', 'instagram', 'social', 'ig_conv_try_k5-teachers_beta_202611', 'p-0013'),
    lesson: 'First test. Bible 5: scarcity only when true, so no "limited spots" until the owner sets the number (Waiting on you: mkt-beta-spots).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Pinned post 3 of 3, the beta call. Every term is word for word from /beta. The candidate for the optional boost (mkt-launch-boost).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs her filmed clip). Beta teachers who post later must disclose they got Plus free (bible 7.4).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0014', date: '2026-11-29', time: '19:45', platform: 'instagram', format: 'story', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'offer',
    principle: 'Fogg behavior model: a tiny, obvious next step (one link sticker).',
    hook: 'The Gamify beta is open',
    caption: 'Story, 3 frames. Link sticker text: "Join the beta test".',
    onScreen: ['Frame 1: "The Gamify beta is open" over a Game Show board clip', 'Frame 2: "K-12 teachers: Gamify Pro free for 3 months"', 'Frame 3: link sticker "Join the beta test"'],
    canva: 'Template "Story 9:16": three frames with the text above; keep the sticker in the center safe zone.',
    sound: 'None needed (most stories are watched muted). If any, Meta Sound Collection; title recorded.',
    alt: 'Story frames: The Gamify beta is open. K-12 teachers: Gamify Pro free for 3 months. Join the beta test link.',
    link: link('/beta', 'instagram', 'social', 'ig_conv_try_k5-teachers_beta_202611', 'p-0014'),
    lesson: 'First test. Bible 6: stories carry the clickable link that feed captions cannot.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Save it as a Highlight named "Beta" so it stays on the profile.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0015', date: '2026-11-29', time: '19:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'care', pillar: 'product',
    principle: 'Curiosity gap (the POV opens a question) + peak-end rule (end on the win).',
    hook: 'POV: you typed 10 questions and got 8 games',
    hooksTried: ['Same questions, 8 games, zero rebuilding', 'Monday bowling. Friday game show. Same 10 questions.'],
    caption: 'POV: you typed 10 questions and got 8 games. Game Show on Monday, Bowling on Wednesday, Board Game on Friday. Any grade, K-12. Which one would your class pick first?',
    onScreen: ['0-2s: phone shot of hands typing a question on a laptop, text "POV: you typed 10 questions"', '2-14s: labeled 2-second cuts of the 8 games', '14-17s (the peak): Bowling strike', 'End: "Gamify. In beta now."'],
    canva: 'Template "Reel text overlays": hook and game labels. Phone-shot opening (native look), screen recordings after.',
    sound: 'TikTok Commercial Music Library track (title recorded when picked). Game audio muted.',
    tags: ['#teachersoftiktok', '#reviewgame', '#classroomgames', '#k12teacher', '#teachertok'],
    alt: 'Hands type a question on a laptop, then the same question appears in seven colorful classroom games, ending on a bowling strike.',
    link: link('/', 'tiktok', 'social', 'tt_engage_care_k5-teachers_one-set-many-games_202611', 'p-0015'),
    lesson: 'Applies p-0001 (POV format, native phone-shot first frame). Different first frame from p-0011 (repurpose rule).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'TikTok cut of the game demo; comment CTA only (care stage).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0016', date: '2026-11-29', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Reciprocity (Cialdini): a free, usable idea first; processing fluency: one big keyword title.',
    hook: 'Whole Class vs the Computer: Friday Review Game for K-12',
    caption: 'A Friday review ritual for any grade, K-12: the whole class plays as one team against the computer on one screen. Pick Easy, Medium or Hard, and raise it once your class wins a few Fridays in a row. Everyone is on the same side. Step-by-step guide.',
    canva: 'Template "Pin 2:3": title = hook; image = Game Show board with the computer\'s turn on screen (Classic theme, shown only); footer "Step-by-step guide".',
    tags: ['friday review game', 'whole class review game', 'k-12 review games', 'no prep review activity', 'classroom game ideas'],
    alt: 'Pin titled Whole Class vs the Computer showing a colorful game show board where the class plays against the computer.',
    link: link('/blog/friday-review-vs-the-computer', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_class-vs-computer_202611', 'p-0016'),
    lesson: 'Applies p-0003 (Pinterest is search: the title is the phrase teachers type).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Board "Classroom review game ideas". Note for the owner: the linked blog post also mentions Pinball, which is hidden on the main site; the post may need a one-line edit.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (posts once the Pinterest business account exists: pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). The linked blog post recommends the idea for grades 1-8, which is allowed (owner, 2026-11-25: a blog idea may carry its best-fit grade band). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0017', date: '2026-11-29', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Identity and the IKEA effect (Norton, Mochon and Ariely, 2012): your class, your theme; reciprocity: free idea lists.',
    hook: 'Classroom Game Theme Ideas Your Students Can Draw and Make',
    caption: 'Theme ideas your class can draw, paint or build from clay, then play in a review game, at any grade K-12: a garden that blooms, snowmen for bowling pins, cookies on a baking tray. Ideas for every game plus art material tips for photographing handmade pieces.',
    canva: 'Template "Pin 2:3": title = hook; image = the Theme Builder preview screen; footer "Ideas for every game". No Classic art offered as a download.',
    tags: ['classroom art project ideas', 'class theme ideas', 'student design project', 'review game ideas', 'k-12 art project ideas'],
    alt: 'Pin titled Classroom game theme ideas, showing the theme builder with a list of ideas like a blooming garden and snowmen bowling pins.',
    link: link('/blog/theme-ideas-to-make', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_theme-ideas_202611', 'p-0017'),
    lesson: 'Applies p-0003 (keyword title) and product-plan 10 #111 (Pinterest as a main channel for themes).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Board "Class-made game themes". Evergreen pin.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0018', date: '2026-11-29', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Specificity (5 minutes, 5 bubbles: true numbers from the guide) + reciprocity.',
    hook: 'Bell Ringer Review Game: A 5-Minute Warm-Up for K-12',
    caption: 'Turn the first five minutes of class into review: every right answer loads five bubbles to aim and pop. Nobody loses: when bubbles creep low, the bottom rows puff away and play goes on. Every bubble has a shape and a color, so color-blind students play on the same terms. Any grade, K-12.',
    canva: 'Template "Pin 2:3": title = hook; image = Bubble Pop board screenshot (Classic theme, shown only); footer "Try it tomorrow".',
    tags: ['bell ringer ideas', 'morning warm up activity', 'k-12 review game', 'five minute review', 'classroom warm up game'],
    alt: 'Pin titled Bell ringer review game showing a colorful bubble shooter board with shaped bubbles.',
    link: link('/blog/bubble-pop-bell-ringer', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_bell-ringer_202611', 'p-0018'),
    lesson: 'Applies p-0003 (keyword title, real page behind every pin).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Board "Classroom review game ideas".' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). The linked blog post recommends the idea for K-8, which is allowed (owner, 2026-11-25: a blog idea may carry its best-fit grade band). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0019', date: '2026-11-30', time: '07:00', platform: 'facebook', format: 'reel', campaign: 'c-launch', buyer: 'sped', funnel: 'try', pillar: 'offer',
    principle: 'Pattern interrupt (von Restorff): on a sales day, the one post that is not a sale; reciprocity (Cialdini). Ethics line: no urgency, no price.',
    hook: "Cyber Monday idea: test a game site free with your class.",
    hooksTried: ['Special education teachers: help build a game site that fits your students', 'No cart, no code: the beta is free'],
    caption: "Cyber Monday idea: test a game site free with your class.\n\nGamify was built by a teacher for students with high support needs, so it works for everyone: read-aloud, calm mode, Share Mirror and settings in every game, all free on every plan.\n\nBeta testers use Gamify Pro free for 3 months. What we ask: play with your class at least twice a week, answer 3 short surveys, and tell us honestly what works. K-12 special education teachers, speech and reading specialists and interventionists especially welcome.\n\nThe short form is at the link.",
    onScreen: ['0-2s: "Cyber Monday idea:" (the owner to camera)', '"Test a game site free with your class"', 'Cut-ins: read-aloud, calm mode, Share Mirror', 'End: "Join the beta test: link below"'],
    canva: 'Reuse the p-0013 film with a new first frame and these text fields in "Reel text overlays".',
    sound: 'Original audio (the owner\'s voice). Optional Meta Sound Collection bed; title recorded.',
    alt: 'A teacher invites classes to test Gamify free, with clips of read-aloud, calm mode and a mirrored screen on a student tablet.',
    link: link('/beta', 'facebook', 'social', 'fb_conv_try_sped_beta_202611', 'p-0019'),
    lesson: 'Applies bible 3 (special education teachers act on accessibility first) and bible 5 (no fake urgency on Cyber Monday).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Cyber Monday: no discount exists and none is invented; the honest contrast is the hook.' }, { at: '2026-11-24T16:00:00', by: 'Marketing Director', note: 'Hook changed from "Not a sale." because the owner added a paid launch discount (c-launch-offer) the same day; "not a sale" would no longer be true. Track 1 stays price-free.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0020', date: '2026-11-30', time: '16:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-launch', buyer: 'sped', funnel: 'care', pillar: 'value',
    principle: 'Pattern interrupt on a sales day + reciprocity; specificity (3 named features). Core message 3: accessibility is never a paid upgrade.',
    hook: "It's Cyber Monday. Here are 3 things we will never charge for.",
    hooksTried: ['3 things that should never be behind a paywall', 'Everyone is selling today. Not these.'],
    caption: '3 things Gamify will never charge for: read-aloud, calm mode, and the settings in every game. Accessibility is never a paid upgrade, at any grade K-12. Which one does your class need most?',
    onScreen: ['0-2s: "3 things we will never charge for" over a hand-drawn price tag crossed out', '1. Read-aloud (a question spoken on screen)', '2. Calm mode (motion and sound soften)', '3. Settings in every game (the timer switched off)', 'End: "Accessibility is never a paid upgrade."'],
    canva: 'Template "Reel text overlays": numbered step fields; the price-tag doodle from the brand kit doodles.',
    sound: 'Original voice-over (the owner) + TikTok Commercial Music Library bed (title recorded). Game audio muted except read-aloud, which is the device voice.',
    tags: ['#teachersoftiktok', '#specialeducation', '#accessibility', '#spedteacher', '#teachertok'],
    alt: 'A crossed-out price tag, then three features shown on a classroom screen: read-aloud, calm mode and a timer switched off.',
    link: link('/accessibility', 'tiktok', 'social', 'tt_engage_care_sped_accessibility-free_202611', 'p-0020'),
    lesson: 'Applies bible 5 ethics line (no fake urgency) and edge list "Accessibility free on every plan" (bible 13).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Never names another site; the contrast is with sales in general.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0021', date: '2026-12-01', time: '07:00', platform: 'instagram', format: 'reel', campaign: 'c-launch', buyer: 'sped', funnel: 'care', pillar: 'product',
    principle: 'Processing fluency (one feature in 15 seconds) + unity (Cialdini): a shared value.',
    hook: 'Every question, read aloud. Free.',
    hooksTried: ['For students who cannot read the question yet: listen.', 'Record a question in your own voice'],
    caption: 'Every question, read aloud. Free.\n\nTurn on read-aloud and Gamify speaks each question, so early readers and students with reading disabilities, at any grade K-12, play the same game as everyone else. You can also record a question in your own voice.\n\nAccessibility is never a paid upgrade. Share this with the specialist down the hall.',
    onScreen: ['0-2s: speaker icon pulsing, text "Every question, read aloud."', 'Read-aloud turned on in settings', 'A question spoken, the answer tapped, right-answer burst (the peak)', 'End: "Free on every plan."'],
    canva: 'Template "Reel text overlays"; screen recording with captions of the spoken question (captions on).',
    sound: 'The read-aloud voice itself (device voice, recorded from the screen) + Meta Sound Collection bed; title recorded.',
    tags: ['#teachersofinstagram', '#specialeducation', '#earlyreaders', '#accessibility', '#spedteacher'],
    alt: 'A classroom game reads a question aloud; captions show the spoken words and a student taps the right answer.',
    link: link('/accessibility', 'instagram', 'social', 'ig_engage_care_sped_accessibility-free_202611', 'p-0021'),
    lesson: 'Applies p-0020 (same message, native Instagram cut) and bible 3 (special education buyer).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Giving Tuesday (Dec 1) is deliberately not referenced: Gamify is a paid product, not a charity, and borrowing the day would read as charity-washing.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0022', date: '2026-12-01', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'product',
    principle: 'Loss aversion and psychological safety (Kahneman and Tversky): name the pain teachers already feel, then the relief.',
    hook: 'Review games where nobody steals your points.',
    caption: 'Review games where nobody steals your points.\n\nIf you have run a review game where one team wiped out another team\'s points, you know how fast a fun Friday turns into tears. In Gamify, power-ups only add to your own team. No stealing, ever. Every timer can be turned off, so the students who need more time play the same game. And the right answer decides what happens next. It works the same at every grade, K-12.\n\nSee Fair Play, Built In on our Features page (link below).',
    canva: 'Template "Feature spotlight" (4:5): title "Nobody steals your points"; 3 icon rows from Fair Play, Built In; screenshot of a power-up card.',
    alt: 'Feature card: nobody steals your points, every timer can be turned off, the right answer decides, with a power-up card from a game.',
    link: link('/features', 'facebook', 'social', 'fb_traffic_try_k5-teachers_fair-play_202611', 'p-0022'),
    lesson: 'Applies edge list item 1 (bible 13) and repurposes the p-0006 idea natively for Facebook (longer, practical caption).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Never names another site; describes the pain only.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER. Removed "not luck": Board Game has dice, so luck is part of some games.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0023', date: '2026-12-02', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-launch', buyer: 'sped', funnel: 'try', pillar: 'value',
    principle: 'Reciprocity + specificity (named features, free on every plan).',
    hook: 'Accessible K-12 Review Games for Special Education: Read-Aloud, Calm Mode',
    caption: 'K-12 classroom review games with read-aloud, calm mode and settings in every game, free on every plan. Timers can be turned off and power-ups never steal points, so every learner plays the same game. See every accessibility feature.',
    canva: 'Template "Pin 2:3": title = hook; image = the settings gear open over a game; footer "Free on every plan".',
    tags: ['special education games', 'accessible classroom games', 'sped review activities', 'read aloud games', 'k-12 special education'],
    alt: 'Pin titled Accessible K-12 review games for special education, showing a game settings panel with read-aloud and calm mode.',
    link: link('/accessibility', 'pinterest', 'social', 'pin_traffic_try_sped_accessibility-free_202611', 'p-0023'),
    lesson: 'Applies p-0003 (keyword title) and bible 3 (special education buyer).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Board "Inclusive classroom games".' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0024', date: '2026-12-03', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-launch', buyer: 'homeschool', funnel: 'try', pillar: 'offer',
    principle: 'Liking and unity (Cialdini): homeschool life in its own words (one screen, mixed ages); reciprocity.',
    hook: 'Homeschooling? The Gamify beta is open to families too.',
    caption: 'Homeschooling? The Gamify beta is open to families too.\n\nOne question set becomes a game for the whole table, K-12: siblings at different grades in one game night, solo practice for one child, head to head for two. Read-aloud, picture answers and calm mode are free, so early readers play right alongside older siblings.\n\nBeta testers get Gamify Pro free for 3 months. What we ask: play at least twice a week, answer 3 short surveys, and tell us honestly what works. The short form is at the link.',
    canva: 'Template "Feature spotlight" (4:5): title "Homeschool families welcome"; image = Bowling on one screen (sample nicknames); footer "Gamify beta".',
    alt: 'A bowling review game on one screen with the words: homeschool families welcome to the Gamify beta.',
    link: link('/beta', 'facebook', 'social', 'fb_conv_try_homeschool_beta_202611', 'p-0024'),
    lesson: 'First test for the homeschool buyer (bible 3: one device, mixed ages).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Lines match the live homeschool page and the siblings blog post.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0025', date: '2026-12-04', time: '16:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'care', pillar: 'value',
    principle: 'Reciprocity (a free routine to use today) + commitment and consistency: a small first step ("try it one Friday").',
    hook: 'Friday review where the whole class is on the same team',
    hooksTried: ['Can your class beat the computer before the weekend?', 'The Friday review ritual my class asks for'],
    caption: 'Friday review where the whole class is on the same team. Set the class as one team and the computer as the other, pick Easy, Medium or Hard, and raise it once your class wins a few Fridays in a row. Any grade, K-12. How-to at the link in bio.',
    onScreen: ['0-2s: "The whole class vs the computer"', 'Teams page: one class team, the computer on Easy', 'The class side answers on the board, the computer takes its turn', 'End (the peak): the class wins, text "Try it this Friday"'],
    canva: 'Template "Reel text overlays"; screen-only recording with the owner\'s voice-over.',
    sound: 'Original voice-over (the owner) + TikTok Commercial Music Library bed; no room audio (student voices need releases).',
    tags: ['#teachersoftiktok', '#fridayreview', '#reviewgame', '#k12teacher', '#classroomgames'],
    alt: 'A classroom screen sets up the whole class against the computer, then the class team wins a game show round.',
    link: link('/blog/friday-review-vs-the-computer', 'tiktok', 'social', 'tt_engage_care_k5-teachers_class-vs-computer_202611', 'p-0025'),
    lesson: 'Applies p-0001 (TikTok native POV energy, no student faces or voices) and p-0016 (same idea, native per platform).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Social Planner', note: 'Pairs with p-0001 (class vs teacher, Dec 2): two sides of the same class-unity idea.' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0026', date: '2026-12-06', time: '18:00', platform: 'instagram', format: 'carousel', campaign: 'c-launch', buyer: 'k5-teachers', funnel: 'try', pillar: 'offer',
    principle: 'Commitment and consistency (Cialdini) + Fogg ability: every ask shown with its minutes, so the step feels small and honest.',
    hook: 'Thinking about the Gamify beta? Here is exactly what we ask.',
    caption: 'Thinking about the Gamify beta? Here is exactly what we ask.\n\nOpen to K-12 teachers. Set up your class (15 min, once). Teach the Tell Gamify lesson (10 min, once). Play at least twice a week (10 to 20 min). Run the student check-in (1 min). Answer 3 short surveys (5 min each). Report problems as they happen (1 min).\n\nWhat you get: Gamify Pro free for 3 months, new games first, and a direct line to the person building it. Apply at the link in bio.',
    onScreen: ['Slide 1: "Here is exactly what the beta asks"', 'Slide 2: "Set up your class: 15 min, once"', 'Slide 3: "Teach the Tell Gamify lesson: 10 min, once"', 'Slide 4: "Play twice a week: 10 to 20 min"', 'Slide 5: "Check-in 1 min. Surveys 5 min. Reports 1 min."', 'Slide 6: "You get: Gamify Pro free for 3 months"', 'Slide 7: "Apply: link in bio"'],
    canva: 'Template "Carousel 4:5": hook, 5 body slides with a clock chip each (as on /beta), CTA slide.',
    tags: ['#teachersofinstagram', '#betatesters', '#teacherplanning', '#k12teacher', '#classroomgames'],
    alt: 'Seven-slide list of what the Gamify beta asks K-12 teachers, each with its minutes, and what testers get: Gamify Pro free for 3 months.',
    link: link('/beta', 'instagram', 'social', 'ig_conv_try_k5-teachers_beta_202611', 'p-0026'),
    lesson: 'Applies p-0013 (beta terms word for word from /beta) and p-0005 (carousel shape). Sunday evening is planning time (bible 6).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Minutes copied from the /beta page (src/public/BetaPage.tsx).' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Also fixed slide 6, which said "Gamify Plus free for the whole test"; the live /beta offer is Gamify Pro free for 3 months, as in the caption. Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0027', date: '2026-12-06', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-launch', buyer: 'sped', funnel: 'try', pillar: 'offer',
    principle: 'Commitment and consistency (Cialdini): the full ask in plain view; unity with specialists.',
    hook: 'K-12 special education teachers: here is exactly what the Gamify beta asks of you.',
    caption: 'K-12 special education teachers: here is exactly what the Gamify beta asks of you.\n\nPlay with your students at least twice a week (short sessions are perfect), run a 1-minute anonymous check-in after a game, answer 3 five-minute surveys, and tap Tell Gamify when something breaks or an idea strikes. That is about 20 minutes a month beyond playing.\n\nWe especially want to hear whether read-aloud and the other supports help your students. Beta testers get Gamify Pro free for 3 months. The short form is at the link.',
    canva: 'Template "Quote card" or "Feature spotlight" (4:5): title "What the beta asks"; 4 clock chips; footer "Gamify Pro free for 3 months".',
    alt: 'Card listing the beta asks with times: play twice a week, a 1-minute check-in, 3 five-minute surveys, and reporting problems.',
    link: link('/beta', 'facebook', 'social', 'fb_conv_try_sped_beta_202611', 'p-0027'),
    lesson: 'Applies p-0019 (special education beta call) and p-0026 (same asks, native caption for Facebook).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T15:00:00', by: 'Brand Copywriter', note: 'Every line from /beta, including "about 20 minutes a month beyond playing".' }, { at: '2026-11-24T15:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },
  // Track 2: the paid launch price (c-launch-offer). Teacher and parent posts only.
  { id: 'p-0028', date: '2026-12-03', time: '16:00', platform: 'instagram', format: 'carousel', campaign: 'c-launch-offer', buyer: 'k5-teachers', funnel: 'pay', pillar: 'offer',
    principle: 'Anchoring (Tversky and Kahneman, 1974): monthly shown first, then the longer plans beside it; the compromise effect (Simonson, 1989) makes the middle option feel safe. Real end date only (honest scarcity).',
    hook: 'Two ways to start with Gamify. Pick yours.',
    hooksTried: ['Want Gamify without being a beta tester?', 'Prefer to just subscribe? Here is the launch price.'],
    caption: 'Two ways to start with Gamify. Pick yours.\n\n1. Test it: 10 beta testers get Gamify Pro free for 3 months and tell us what works.\n2. Just subscribe: every game for any grade K-12, a theme for each game, 3 classes and unlimited question sets. Plus is $8 a month, or save with a longer plan: 5% off for 3 months, 15% off for 6 months, 20% off for a year. Launch sale: an extra 10% off your first term if you start before January 1. After that, your plan renews at the standard price for the same length until you cancel, and the renewal price is shown before you pay. Cancel online any time.\n\nBoth paths are at the link in bio.',
    onScreen: ['Slide 1: "Two ways to start with Gamify"', 'Slide 2: "Test it: Gamify Pro free for 3 months while you give feedback"', 'Slide 3: "Just subscribe: every game, a theme for each game, 3 classes"', 'Slide 4: "Plus $8 a month | 3 months 5% off | 6 months 15% off | 1 year 20% off"', 'Slide 5: "Launch sale: an extra 10% off your first term, until Jan 1. Then it renews at the standard price. Cancel online any time."', 'Slide 6: "Link in bio"'],
    canva: 'Template "Carousel 4:5"; slide 4 is a 4-column price card, monthly first, 1 year marked "Best value" (not pre-selected anywhere). Real prices typed only after her OK.',
    tags: ['#teachersofinstagram', '#k12teacher', '#classroomgames', '#teacherresources'],
    alt: 'Six slides: two ways to start, the free beta test or a subscription, with monthly, 3-month, 6-month and 1-year options and renewal terms.',
    link: link('/pricing', 'instagram', 'social', 'ig_conv_pay_k5-teachers_launch-price_202612', 'p-0028'),
    lesson: 'First test. Applies p-0013 (beta terms word for word) and bible 5 anchoring line: no hidden costs, no pre-checked add-ons.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T16:00:00', by: 'Brand Copywriter', note: 'Track 2 (owner decision 2026-11-24). Discounts are the owner\'s approved numbers (5%, 15%, 20%), first term only (owner 2026-11-24). Renewal disclosure is in every caption; the exact dollar renewal price is added once she sets the monthly prices. Posts only once checkout works (billing-intervals).' }, { at: '2026-11-24T16:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on checkout). Value first, then price; savings compared with monthly, a price offered at the same time, never a made-up former price.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0029', date: '2026-12-04', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-launch-offer', buyer: 'homeschool', funnel: 'pay', pillar: 'offer',
    principle: 'Value before price (standing sales rule) + anchoring; reciprocity (the free tier stays real).',
    hook: 'Not up for beta testing? Start now with the launch sale: an extra 10% off your first term.',
    caption: 'Not up for beta testing? Start now with the launch sale: an extra 10% off your first term.\n\nGamify Plus, for every grade K-12: every game, a theme for each game, 3 classes and unlimited question sets. Read-aloud and calm mode are free on every plan, including Free.\n\nPlus is $8 a month, or save compared with monthly: 5% for 3 months, 15% for 6 months, 20% for a year. Start before January 1 and the launch sale takes an extra 10% off your first term. After that, your plan renews at the standard price for the same length until you cancel. You see the renewal price before you pay, get a reminder before longer plans renew, and can cancel online.\n\nDetails at the link.',
    canva: 'Template "Feature spotlight" (4:5): title "Start now at the launch price"; the 4-column price card; footer "Free plan always available".',
    alt: 'Card titled Start now at the launch price with monthly, 3-month, 6-month and 1-year plan options.',
    link: link('/pricing', 'facebook', 'social', 'fb_conv_pay_homeschool_launch-price_202612', 'p-0029'),
    lesson: 'Applies p-0024 (homeschool buyer on Facebook) and bible 3 objection "too expensive": lead with what it replaces, then the price.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T16:00:00', by: 'Brand Copywriter', note: 'Track 2 (owner decision 2026-11-24). Discounts are the owner\'s approved numbers (5%, 15%, 20%), first term only (owner 2026-11-24). Renewal disclosure is in every caption; the exact dollar renewal price is added once she sets the monthly prices. Posts only once checkout works (billing-intervals).' }, { at: '2026-11-24T16:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on checkout). Value first, then price; savings compared with monthly, a price offered at the same time, never a made-up former price.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0030', date: '2026-12-07', time: '07:00', platform: 'meta-ads', format: 'social-ad', campaign: 'c-launch-offer', buyer: 'k5-teachers', funnel: 'pay', pillar: 'offer',
    principle: 'Specificity (what Plus includes) + anchoring vs monthly; one CTA (Fogg).',
    hook: 'Launch sale: an extra 10% off',
    caption: 'K-12 classroom games: every game, a theme for each game, 3 classes and unlimited question sets. Read-aloud and calm mode free on every plan. Plus from $8 a month, with 5%, 15% or 20% off 3, 6 or 12-month plans. Launch sale until Jan 1: an extra 10% off your first term, then it renews at the standard price until you cancel.',
    canva: 'Template "Ad set" (1:1, 4:5, 9:16): headline = hook; image = the 7-game grid; CTA button "Learn more" (not "Buy now").',
    alt: 'Ad showing K-12 classroom game boards with the words Launch sale: an extra 10% off.',
    link: link('/pricing', 'meta', 'paid-social', 'meta_conv_pay_k5-teachers_launch-price_202612', 'p-0030'),
    lesson: 'First test. Bible 8: adults 18+ only, one message per ad set, landing page headline must match (landing-page-audit before spend).',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T16:00:00', by: 'Brand Copywriter', note: 'Track 2 (owner decision 2026-11-24). Discounts are the owner\'s approved numbers (5%, 15%, 20%), first term only (owner 2026-11-24). Renewal disclosure is in every caption; the exact dollar renewal price is added once she sets the monthly prices. Posts only once checkout works (billing-intervals).' }, { at: '2026-11-24T16:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on checkout). Value first, then price; savings compared with monthly, a price offered at the same time, never a made-up former price.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Also fixed the alt text, which said "20% off your first year"; the headline is the launch sale, an extra 10% off. Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0031', date: '2026-12-07', time: '07:00', platform: 'google-ads', format: 'search-ad', campaign: 'c-launch-offer', buyer: 'k5-teachers', funnel: 'pay', pillar: 'offer',
    principle: 'Message match (intent search) + specificity.',
    hook: 'K-12 Classroom Review Games',
    caption: 'Every game, 3 classes, unlimited question sets. Launch sale: extra 10% off until Jan 1.',
    alt: 'Search ad text only.',
    link: link('/pricing', 'google', 'cpc', 'google_conv_pay_k5-teachers_launch-price_202612', 'p-0031'),
    lesson: 'First test. Bible 8: every headline stands alone; no other brand as a keyword.',
    status: 'needs-ok',
    history: [{ at: '2026-11-24T16:00:00', by: 'Brand Copywriter', note: 'Track 2 (owner decision 2026-11-24). Discounts are the owner\'s approved numbers (5%, 15%, 20%), first term only (owner 2026-11-24). Renewal disclosure is in every caption; the exact dollar renewal price is added once she sets the monthly prices. Posts only once checkout works (billing-intervals).' }, { at: '2026-11-24T16:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (conditional on checkout). Value first, then price; savings compared with monthly, a price offered at the same time, never a made-up former price.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  // Pinterest, dev plan Part 5B (c-pinterest). Boards, keywords and rhythm:
  // docs/pinterest-plan.md. Keywords are unverified until checked in the
  // Pinterest search bar (Waiting on you: mkt-pinterest).
  { id: 'p-0032', date: '2026-12-01', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'IKEA effect (Norton, Mochon and Ariely, 2012): the class made the pins, so they care about the game; seasonal timing (a month before the January return, bible 6).',
    hook: 'Winter Review Game for K-12: Your Class Designs Snowman Bowling Pins',
    hooksTried: ['Snowman Bowling: A Winter Counting Game Your Class Designs', 'Winter Classroom Game Idea: Bowl Over Snowmen Your Students Made'],
    caption: 'A winter review game your class designs. Students draw, paint or sculpt snowmen, take a photo, and the snowmen become the pins in Bowling. Answer a question right to roll, then count the fallen pins together. Plan about 45 minutes for design day, then play with any question set you write or import, at any grade K-12. The theme guide shows every piece and its size.',
    canva: 'Template "Pin 2:3" (1000 x 1500): title = hook; image = Bowling lane screenshot (Classic theme, shown on screen only, never a download) with a sticker label "Theme idea: snowmen for pins"; footer = "Theme guide: every piece and its size". Stronger option if the owner makes one: a sample snowman set made by the owner (not students) in the Theme Builder.',
    tags: ['winter review game', 'k-12 review games', 'snowman classroom activity', 'winter classroom games', 'classroom game ideas'],
    alt: 'Pin titled Winter review game for K-12, showing a bowling lane game on a classroom screen with a label that reads Theme idea: snowmen for pins.',
    link: link('/blog/themes/bowling', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_winter-themes_202612', 'p-0032'),
    lesson: 'Applies p-0003 (keyword title teachers type) and p-0017 (theme pins point to a real guide; Classic art is shown, never handed out).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'Snowmen for pins is on the blog\'s Theme Ideas list; counting pins is the Bowling how-to-play tip. 45 minutes is the theme blog posts\' own estimate.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Boards "Every Question Becomes a Game" and "Winter classroom games" (seasonal).' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (posts once pinterest-account exists; keywords unverified until checked in the Pinterest search bar, mkt-pinterest).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0033', date: '2026-12-03', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Reciprocity (Cialdini): a free, blank, usable printable first; Fogg: one tiny next step (log in, print one page).',
    hook: 'Free Printable Game Template: Your Class Designs a Review Game (K-12)',
    hooksTried: ['Blank Game Template for Kids to Design: Print, Draw, Snap, Play', 'Classroom Art Project That Becomes a Review Game'],
    caption: 'Print one blank page per piece, hand each student a page, and they design the cards, team pictures or background of Game Show. Take a photo of each page and the game wears their art the same day. Any grade K-12, about 45 minutes. The Game Show templates are free with a free teacher account: log in to print. Blank templates only, so every picture is your class\'s own.',
    canva: 'Template "Pin 2:3": title = hook; top half = photo of one blank printed Game Show template page on a desk with crayons and a few modeling-dough shapes beside it (owner\'s desk, no students); bottom half = the Theme Builder Upload tab screenshot; footer = "Free blank template". The printable in the photo is the blank outline page, never Classic art.',
    tags: ['free printable classroom game', 'review game template', 'classroom art project', 'student design project', 'k-12 art project'],
    alt: 'Pin titled Free printable game template, showing a blank outlined template page with crayons and clay beside it, and the upload screen of a theme builder.',
    link: link('/blog/themes/game-show', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_free-template_202612', 'p-0033'),
    lesson: 'Applies p-0003 (keyword title) and lesson 2026-11-25 (only Game Show templates are free on the Free plan, so only this pin says free).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'Checked src/theme/builder/templateAccess.tsx: templates need a teacher login; Free gets Game Show only (THEME_TRIAL_GAME). The caption says so plainly, no bait and switch.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Theme templates and printables" (renamed from "Free theme templates" until the owner decides, mkt-pinterest).' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account, and the template license line the owner OKs in mkt-pinterest before it posts).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0034', date: '2026-12-04', time: '20:00', platform: 'pinterest', format: 'video-pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'care', pillar: 'product',
    principle: 'Pattern interrupt (von Restorff): real hands and clay stand out in a feed of flat printables; IKEA effect; peak-end rule (end on the piece in play).',
    hook: 'Sculpt It, Snap It, Play It: Clay Game Pieces for a Class Review Game',
    hooksTried: ['From Clay to the Big Screen: A Review Game Your Class Builds', 'Classroom Clay Project That Becomes a Game'],
    caption: 'Your class designs the game. Sculpt pieces from clay or modeling dough, arrange leaves and bottle caps, or draw in a design app. Take a photo or scan it, and Gamify fits each piece into the game, then the class plays review with its own art. Any grade, K-12. Save this for your next art and review day.',
    onScreen: ['0-2s: hands press a clay star on a plain desk, text "Sculpt it"', '2-5s: a phone takes a photo straight on, text "Snap it"', '5-10s: the star appears as a piece in the game on the classroom screen, text "Play it"', '10-15s: a right answer and the class-made piece in play; end card "Your class designs the game"'],
    canva: 'Template "Reel text overlays" at 1080 x 1920 for a video pin: the 4 text fields above, captions burned in; cover = frame 3 still with the hook. Footage: owner films her own hands and pieces she made (no student hands, work, faces or voices without a release, bible 7.2). Screen part: the Theme Builder Upload tab, then the game.',
    sound: 'No music: silent with burned-in captions, or the owner\'s own voice-over (original audio). Game audio muted (some ledger sounds need a credit line; lesson 2026-11-24). No student voices.',
    tags: ['clay classroom project', 'classroom game ideas', 'art integration lesson', 'review game ideas', 'hands on learning activities'],
    alt: 'Video pin: hands shape a clay star, a phone takes its photo, and the star appears as a piece in a review game on a classroom screen.',
    link: link('/themes', 'pinterest', 'social', 'pin_engage_care_k5-teachers_sculpt-snap-play_202612', 'p-0034'),
    lesson: 'Applies lesson 2026-11-24 (every video names whose voice is heard) and bible 4 Theme language (lead with clay and found materials; never promise perfect cut-outs).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'Approved lines "Sculpt it, snap it, play it" and "Your class designs the game" (bible 4). "Fits each piece" matches the theme guide\'s wording; no cut-out promise.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Classroom game ideas". Needs a 15-second clip filmed by the owner (hands only, her own pieces).' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account and the owner\'s clip).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0035', date: '2026-12-06', time: '19:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Specificity (subject, 45 minutes) + IKEA effect: students care more about a game they helped make.',
    hook: 'Fractions Review Game: Students Design the Cards (K-12)',
    hooksTried: ['Math and Art Lesson: Design a Game, Then Play Fractions', 'Fractions Game Your Class Makes, Any Grade K-12'],
    caption: 'Every student designs one card or team picture, you photograph the pages, and the class plays a fractions review in Game Show with its own art. Teams pick a card, answer, and the card turns over to show the points. About 45 minutes for design day, then play with any fractions question set you write or import. Any grade, K-12: write the questions at your class\'s level. Step-by-step lesson inside.',
    canva: 'Template "Pin 2:3": title = hook; image = Game Show surprise-card board mid-turn with a sample fractions question on screen (sample team names only); footer = "Step-by-step lesson".',
    tags: ['fractions review game', 'k-12 math games', '3rd grade math games', 'math and art project', 'whole class math game'],
    alt: 'Pin titled Fractions review game, students design the cards, K-12, showing a team card game on a classroom screen with a fractions question.',
    link: link('/blog/design-a-theme-as-a-class', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_fractions-review_202612', 'p-0035'),
    lesson: 'Applies p-0003 (grade + subject + "game" title, real page behind the pin).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'From the blog post "Design a Theme as a Class, Then Play Fractions" (K-8, 45 minutes); narrowed to grades 3-5, where fractions start in the standards (assumption, from memory).' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Math games".' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0036', date: '2026-12-07', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: '612-teachers', funnel: 'try', pillar: 'value',
    principle: 'Authority, honestly worded: retrieval and spaced practice as in docs/gamified-learning-research.md; competition for older students (bible 3).',
    hook: 'Vocabulary Review Game for K-12: Head-to-Head Four in a Row',
    hooksTried: ['Vocabulary Station Idea for K-12: A Two-Player Duel', 'ELA Vocabulary Game Every Grade Takes Seriously'],
    caption: 'Partners answer a vocabulary question before every drop, so the strategy only counts if they know their words. Run it as a 15-minute station all week with the same set. Answering from memory, spread over days, beats rereading a list (retrieval and spaced practice research). Any grade K-12, one device per pair.',
    canva: 'Template "Pin 2:3": title = hook; image = Four in a Row board with a sample vocabulary question on screen; footer = "Station idea for K-12".',
    tags: ['vocabulary review game', 'k-12 vocabulary games', 'ela station ideas', 'partner review game', 'high school vocabulary activities'],
    alt: 'Pin titled Vocabulary review game for K-12, showing a four in a row board beside a vocabulary question.',
    link: link('/blog/head-to-head-vocabulary', 'pinterest', 'social', 'pin_traffic_try_612-teachers_vocab-duel_202612', 'p-0036'),
    lesson: 'Applies p-0003 (keyword title) and bible 3 (6-12 teachers want competition, not kiddie games).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'Research line kept inside the research doc\'s wording (testing effect beats restudying; spaced practice). No score promises.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Reading and grammar games".' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0037', date: '2026-12-08', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Specificity (5 seconds, pictures only) + formative assessment (Black and Wiliam, from memory): quick evidence to plan tomorrow.',
    hook: 'Exit Tickets for K-12: A 5-Second Picture Check-In, No Reading Needed',
    hooksTried: ['Exit Ticket Ideas for Pre-Readers: No Reading Needed', 'The Easiest Exit Ticket, Any Grade K-12'],
    caption: 'Exit tickets for any grade, K-12, even for students still learning to read: at the end of every game, each student taps a face, then a picture for easy, just right or tricky. No reading, no names: Gamify keeps only the counts. Use them to plan tomorrow, with more practice on a tricky set or a harder one. About 5 seconds per student.',
    canva: 'Template "Pin 2:3": title = hook; image = the results screen with the two-tap check-in (faces, then feather, target and mountain); footer = "Teacher tip".',
    tags: ['exit ticket ideas', 'k-12 formative assessment', 'exit tickets kindergarten', 'pre-reader activities', 'teacher tips'],
    alt: 'Pin titled Exit tickets for K-12, showing a game results screen with picture buttons: faces, then a feather, a target and a mountain.',
    link: link('/blog/two-tap-exit-tickets', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_exit-tickets_202612', 'p-0037'),
    lesson: 'Applies p-0003 (keyword title, real page behind every pin).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'Every detail from the blog post "Two-Tap Exit Tickets for Pre-Readers" (K-3, 5 minutes; counts only, never who tapped what).' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Teacher tips".' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0038', date: '2026-12-09', time: '20:00', platform: 'pinterest', format: 'video-pin', campaign: 'c-pinterest', buyer: '612-teachers', funnel: 'care', pillar: 'product',
    principle: 'Curiosity gap (which square will they risk?) + peak-end rule: end on the right answer and the score jump, never on a logo hold.',
    hook: 'Unit Review Game for K-12: A Category Grid Tournament',
    hooksTried: ['Test Review Game for K-12: Bet on What You Know', 'Review Day, But It\'s a Tournament (K-12)'],
    caption: 'Turn unit test review into a tournament: up to five topics as columns, squares from 100 to 500 points, and teams decide how confident they really are. Build one question set per topic, or put the whole class against you. Any grade K-12, about 30 minutes. Save this for your next unit review.',
    onScreen: ['0-2s: "Unit review, but it\'s a tournament" over the category grid', '2-6s: a team picks the 400 square in a topic column', '6-10s: right answer, the points land on the team\'s score', '10-15s: the final scores; end card "Save this for unit review"'],
    canva: 'Template "Reel text overlays" at 1080 x 1920 for a video pin: the 4 fields above, captions burned in; cover = the grid with the hook. Screen recording of Game Show, Category grid, with a sample biology unit (cells, genetics, evolution, ecology) and sample team names only.',
    sound: 'No music: silent with burned-in captions, or the owner\'s own voice-over (original audio). Game audio muted (some ledger sounds need a credit line; lesson 2026-11-24).',
    tags: ['unit review game', 'k-12 review game', 'test review activity', 'high school review game', 'whole class review'],
    alt: 'Video pin: a quiz-show category grid on a classroom screen; a team picks a 400-point square, answers right, and its score goes up.',
    link: link('/blog/unit-review-tournament', 'pinterest', 'social', 'pin_engage_care_612-teachers_unit-review_202612', 'p-0038'),
    lesson: 'Applies lesson 2026-11-24 (every video names whose voice is heard) and p-0003 (keyword title).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'From the blog post "Unit Review Tournament" (8-12, 30 minutes; up to five columns, 100 to 500 points).' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Every Question Becomes a Game" (Game Show). Screen-only recording the team can make on the preview site.' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0039', date: '2026-12-10', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Processing fluency (one clear picture: answer, roll, hop) + specificity (about 10 rounds on the Short board).',
    hook: 'Whole Class Board Game for K-12: Answer, Roll and Count the Hops',
    hooksTried: ['Counting Practice Board Game for K-12: Answer, Roll, Hop', 'Smart Board Review Game for K-12: Count the Hops Together'],
    caption: 'A right answer earns a roll of the die, and the class counts each hop out loud as the piece moves along the board. Counting practice on top of any question set you choose, at any grade K-12. Teams take turns on one screen (Share mode), so it runs on a smart board with no student devices. Set the board to Short for about 10 rounds each.',
    canva: 'Template "Pin 2:3": title = hook; image = Board Game screenshot mid-hop with the die on screen (Classic theme, shown only); footer = "How to play".',
    tags: ['whole class board game', 'k-12 review games', 'counting practice game', 'smart board review games', 'kindergarten math games'],
    alt: 'Pin titled Whole class board game for K-12, showing a colorful game board with a die and round player pieces on a classroom screen.',
    link: link('/blog/how-to-play/castle-quest', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_counting-game_202612', 'p-0039'),
    lesson: 'Applies p-0003 (keyword title, real page behind every pin).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'From the Board Game how-to-play: count the hops tip, Short board is about 10 rounds per player. The game is called Board Game in public.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Math games".' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0040', date: '2026-12-12', time: '10:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Low-stress design (bible core message 5, wrong answers never cost a thing) + goal gradient: progress shown as a picture that fills.',
    hook: 'Literacy Centers Game for K-12: A Calm Night Sky That Fills With Stars',
    hooksTried: ['Calm Phonics Practice for Centers: No Timer, No Scoreboard', 'Independent Reading Practice Game With Read-Aloud'],
    caption: 'A quiet practice game for centers: every right answer adds a star to a night sky, so progress is a picture, not a score. No timer, no scoreboard. Turn on read-aloud for early readers. A miss is gentle: a new question comes, and missed ones return at the end for review. About 10 minutes, any grade K-12, with any reading or vocabulary set you write.',
    canva: 'Template "Pin 2:3": title = hook; image = Question Tracker night sky half full of stars around the question box (Classic theme, shown only); footer = "Calm practice for centers". Winter night sky suits the season.',
    tags: ['literacy centers games', 'phonics review game', 'independent reading practice', 'k-12 literacy games', 'calm classroom activity'],
    alt: 'Pin titled Literacy centers game for K-12, showing a dark night sky filling with stars around a reading question.',
    link: link('/blog/watch-the-sky-fill', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_calm-practice_202612', 'p-0040'),
    lesson: 'Applies p-0003 (keyword title) and p-0023 (read-aloud and calm features named plainly).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'From the blog post "Watch the Sky Fill" (K-5, 10 minutes; no scoreboard or timer; missed questions return in Review).' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Reading and grammar games". Saturday morning slot: weekend planners (bible 6 best guess).' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0041', date: '2026-12-14', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Commitment and consistency (a small, repeatable routine after each lesson) + low stress: a wrong answer never ends the game.',
    hook: 'Independent Math Practice for K-12: Match Three With Question Breaks',
    hooksTried: ['Math Early Finisher Game for K-12', 'Quiet Math Review Game After a Lesson'],
    caption: 'Quiet practice after a math lesson: students swap pieces to make rows of three, and when the moves run out, a question break refills them. Bigger matches make special pieces, and a star bar fills toward 3 stars. A wrong answer never ends the game; a new question comes. You choose the rounds and the questions per break. Any grade K-12.',
    canva: 'Template "Pin 2:3": title = hook; image = Match Three board with the star bar and a question break on screen (Classic theme, shown only); footer = "How to play".',
    tags: ['independent math practice', 'k-12 math games', 'math early finishers', 'math centers game', '3rd grade math review'],
    alt: 'Pin titled Independent math practice for K-12, showing a match three board with a star bar and a math question.',
    link: link('/blog/how-to-play/match-three', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_math-practice_202612', 'p-0041'),
    lesson: 'Applies p-0003 (keyword title, real page behind every pin).',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T10:00:00', by: 'Brand Copywriter', note: 'From the Match Three how-to-play (question breaks refill moves, special pieces, 3-star goal, quiet independent practice). Grades 2-5 is the team\'s pick, not a product limit.' }, { at: '2026-11-25T10:00:00', by: 'Social Planner', note: 'Board "Math games". With p-0018 (Bubble Pop) this completes one pin per live game (7 of 7 on 2026-11-25). If Territory is listed (another session was listing it on 2026-11-25), it needs its own pin.' }, { at: '2026-11-25T10:30:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account).' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },

  { id: 'p-0042', date: '2026-12-15', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-pinterest', buyer: 'k5-teachers', funnel: 'try', pillar: 'product',
    principle: 'A shared class goal (cooperative learning, positive interdependence, Johnson and Johnson; from memory, not a cited study) + low stress (bible core message 5: a miss never costs a thing); processing fluency: grade + subject + "game" in the first 40 characters of the title.',
    hook: 'Whole Class Review Game for K-12: Every Right Answer Sends a Cat After a Mouse',
    hooksTried: ['Cats Against Mice: A Live Review Game Your Class Plays on Their Own Devices', 'Cooperative Classroom Game Idea: The Class Catches Every Mouse Together'],
    caption: 'A Live whole-class review game for K-12: every student answers on their own device, at every grade. Mice come out of a little door on the big screen, and every right answer sends a cat to catch one. A caught mouse poofs away in stars; nobody is ever hurt. Play Cooperative, where the class catches them together, or Competitive, Cats against Mice for the room. A miss never costs a thing. Pick a slow, normal or fast pace. Use any question set you write or import.',
    onScreen: ['Title: "Whole class review game for K-12"', 'Sticker label on the screenshot: "Nobody is ever hurt: a caught mouse poofs in stars"', 'Footer: "How to play: Cooperative or Competitive"'],
    canva: 'Template "Pin 2:3" (1000 x 1500): title = "Whole class review game for K-12" (Grow Year), subline = "Every right answer sends a cat after a mouse"; image = a fresh screenshot of the real Territory big screen in Cooperative (Classic theme, shown on screen only, never a download): the wooden mouse door, two or three cats mid-chase and one star poof, sample nicknames only. There are no Territory screenshots in public/help yet, so capture it from the live game with a sample class. Sticker label = "Nobody is ever hurt: a caught mouse poofs in stars"; footer = "How to play: Cooperative or Competitive". No power-up art: Territory has none (the bonus power-up is "Prize Chest" in every game that has one).',
    tags: ['whole class review game', 'k-12 review games', 'classroom game ideas', 'review game ideas', 'live classroom game'],
    alt: 'Pin titled Whole class review game for K-12, showing a hand-drawn living room on a classroom screen where cats chase mice coming out of a small wooden door, with a puff of stars where one mouse was caught.',
    link: link('/blog/how-to-play/territory', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_whole-class-review_202612', 'p-0042'),
    lesson: 'Applies p-0003 (keyword title teachers type, real page behind every pin), the 2026-11-24 lesson (no game count stated; checked src/games/registry.ts: Territory is listed) and the p-0041 note (a listed Territory needs its own pin). Trend watch 2026-11-25: grade + subject + "game" titles.',
    status: 'needs-ok',
    history: [{ at: '2026-11-25T14:00:00', by: 'Brand Copywriter', note: 'Every detail from the shipping game and its how-to-play (src/games/territory, src/public/howToPlay.ts): Live only, students answer on their own devices; Cooperative: each right answer sends a cat to catch a mouse, which poofs in stars; Competitive: Cats against Mice, the team with more animals in the room wins; a miss never costs anything; pace slow, normal or fast; the "start on slow" tip is the page\'s own. "A little door" matches the drawn arched wooden mouse door. K-5 is the team\'s pick, not a product limit. No power-ups named: Territory has none.' }, { at: '2026-11-25T14:00:00', by: 'Social Planner', note: 'Board "Every Question Becomes a Game" (the game kit; now 8 of 8 listed games with a pin), also saved to "Classroom game ideas". Tuesday Dec 15, 8 pm Eastern (bible 6 evening slot), opening the third Pinterest week.' }, { at: '2026-11-25T14:10:00', by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (needs pinterest-account; keywords unverified until checked in the Pinterest search bar, mkt-pinterest). 1 goal try (outbound click to how-to-play); 2 buyer K-5 teacher, pain: review that keeps the whole class in; 3 hook keyword-first, the picture (cats chasing mice) reads muted; 4 truth checked against the code; 5 our nouns (question set, Cooperative, Competitive), no other brand; 6 principle named, no fear or urgency; 7 2:3, title under 100, description under 500; 8 no student faces or names, sample nicknames, Classic shown only; 9 no sound (static pin); 10 trend watch 2026-11-25; 11 lessons cited; 12 tracked, utm_content p-0042; 13 alt text, high-contrast title; 14 no "free template" (Territory templates need a paid plan), no price. Landing-page note for the owner: the how-to-play page and one in-game line still describe a window, couch and lamp ("a scared cat leaps out the window"), but the drawn room has no window or furniture (her 2026-11-24 layout); the pin avoids those details, and the page text should be fixed before this posts.' }, { at: '2026-11-25T18:00:00', by: 'Marketing Director', note: 'K-12 rule (owner, 2026-11-25: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade."): customer-facing text rewritten to present Gamify as K-12; any grade-specific search term sits beside a K-12 term. Buyer and the utm_campaign audience part stay as targeting data (bible 9 allows only the section 3 segment ids). Removed the grade line "Start on slow so younger students can watch each chase": Live is every student on their own device at every grade (owner, 2026-11-25); the pace is a choice, not a grade. Bible check: READY FOR OWNER (check 15, K-12: pass).' }] },
];

export const ACTIVITY: Activity[] = [
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Team set up: the marketing bible, the lessons file, 6 team members and 8 skills. Planner opened.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Planning the Founding Subscriber launch offer (15% off the first 12 months, any plan and billing, during the beta; predicted terms, waiting for your OK).' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Drafted two campaigns for December and January: Whole class vs the teacher, and Join the beta test.' },
  { at: T('2026-11-24'), by: 'Brand Copywriter', what: 'Wrote hooks and captions for p-0001 to p-0005 in the brand voice.' },
  { at: T('2026-11-24'), by: 'Social Planner', what: 'Placed 5 posts across TikTok, Instagram, Pinterest and Facebook for the first two weeks of December.' },
  { at: T('2026-11-24'), by: 'Trend Researcher', what: 'First monthly trend check is due 2026-12-01; platform specs in the bible are a baseline until then.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Added accounts, Canva brand kit and ad budgets to Waiting on you. Nothing is posted until you approve.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Started the edge list (bible section 13) from the competitor research; no stealing leads. Drafted p-0006 on it.' },
  { at: '2026-11-24T15:00:00', by: 'Marketing Director', what: 'Owner asked for a launch plan for the new pages on Nov 29 with a beta-test angle. Wrote the campaign "Beta launch: meet Gamify" (c-launch, Nov 28 to Dec 6): goal 10 beta applications, organic only, offer exactly as live on /beta.' },
  { at: '2026-11-24T15:00:00', by: 'Brand Copywriter', what: 'Wrote hooks, captions and on-screen text for p-0007 to p-0027. Every number checked against the code: 7 games on main, beta terms from /beta.' },
  { at: '2026-11-24T15:00:00', by: 'Social Planner', what: 'Placed 21 posts: 2 conditional teasers (Sat Nov 28), 10 on launch day (3 pinned on Instagram, 1 pinned on Facebook and TikTok, 3 pins), and 9 through Dec 6. Thanksgiving left empty; no Giving Tuesday tie-in.' },
  { at: '2026-11-24T15:00:00', by: 'Trend Researcher', what: 'Logged in trend watch: several sources report Instagram capping hashtags at 5 per post and Reel since December 2025 (official help page not yet confirmed). Every Instagram post uses 5 or fewer.' },
  { at: '2026-11-24T15:10:00', by: 'Marketing Director', what: 'Bible check on all 21 launch posts: READY FOR OWNER. Fixes made: one CTA per piece, "7 games" instead of "dozens", "not luck" removed, p-0001 sound changed to teacher voice only (student voices need releases).' },
  { at: '2026-11-24T15:10:00', by: 'Marketing Director', what: 'Added to Waiting on you: launch-day account check, the number of beta spots, the founder clips to film, and an optional $25 boost. Nothing posts or spends without your OK.' },
  { at: '2026-11-24T16:00:00', by: 'Marketing Director', what: 'Owner decision: a launch discount for teachers who want to subscribe without beta testing. Added track 2 (c-launch-offer): monthly at full price, and 3, 6 and 12-month plans that renew at the same length. Discounts approved: 3 months 5%, 6 months 15%, 1 year 20%. Posts p-0028 to p-0031 wait on her numbers and on checkout.' },
  { at: '2026-11-24T17:00:00', by: 'Marketing Director', what: 'Owner decision: the launch discount covers the first term only; plans renew at the regular price for the same length. Rewrote p-0028 to p-0031 so every caption states the renewal terms (automatic-renewal disclosure).' },
  { at: '2026-11-24T16:00:00', by: 'Brand Copywriter', what: 'Changed the p-0019 hook from "Not a sale" to "Cyber Monday idea: test a game site free with your class": once a launch discount exists, "not a sale" is no longer true.' },
  { at: '2026-11-24T18:00:00', by: 'Marketing Director', what: 'Owner decisions: standard prices Plus $8 and Pro $15 a month with 5%, 15% and 20% off 3, 6 and 12 months (renewing at those prices); launch sale = an extra 10% off the first term until Jan 1, 2027. Track 1 now matches the live /beta terms from the merged beta work (Pro free for 3 months, 10 spots). Rewrote p-0009 to p-0031 where they named the old terms; all stay needs-ok.' },
  { at: '2026-11-25T10:00:00', by: 'Marketing Director', what: 'Dev plan Part 5B, Pinterest: wrote the campaign c-pinterest (Dec 1 to Feb 28, organic only) and the board, keyword and rhythm plan in docs/pinterest-plan.md. Goal: saves and outbound clicks, then free sign-ups.' },
  { at: '2026-11-25T10:00:00', by: 'Trend Researcher', what: 'Keyword research for Pinterest: web search worked but every page fetch was blocked in this session (pinterest.com help pages included), so no source was opened. Every keyword is marked unverified until checked in the Pinterest search bar and Trends (Waiting on you: mkt-pinterest).' },
  { at: '2026-11-25T10:00:00', by: 'Brand Copywriter', what: 'Wrote p-0032 to p-0041 (8 pins, 2 video pins) in the teacher voice: what the class learns, the grade and the time, every detail taken from a live blog post, theme guide or how-to-play page.' },
  { at: '2026-11-25T10:00:00', by: 'Social Planner', what: 'Placed 10 pins Dec 1 to Dec 14 (5 a week, evenings and one Saturday morning), across 6 boards. With p-0018 every live game now has a pin. The decor board (patterns, stickers) stays empty: both are proposals, and stickers are Classic art, which is never handed out.' },
  { at: '2026-11-25T10:30:00', by: 'Marketing Director', what: 'Bible check on p-0032 to p-0041: READY FOR OWNER. Fix made: only the Game Show pin says "free template", because the other 6 games\' templates need Plus, Pro or Homeschool. Added mkt-pinterest to Waiting on you (keyword check, board names, counting sign-ups from Pinterest).' },
  { at: '2026-11-25T14:10:00', by: 'Marketing Director', what: 'Territory is listed on the site, so it got its own pin: p-0042 (Dec 15, board "Every Question Becomes a Game"), linked to its how-to-play page. Bible check READY FOR OWNER. Found: the Territory how-to-play page and one in-game line mention a window and furniture the drawn room does not have; flagged to fix before the pin posts.' },
  { at: '2026-11-25T18:00:00', by: 'Marketing Director', what: 'Owner rule (2026-11-25), her words: "gamify is k-12 and should always be promoted as k-12 becuase we have game difficulty and lots of theme options. live will alwyas be separete devices no matter grade." Follow-up: "its okay for the blogs to have different types of reccomendations for different grade bands". Rewrote all 42 posts and 5 campaigns so Gamify is always presented as K-12. Hooks and titles say K-12, #elementaryteacher became #k12teacher, any grade-specific search keyword sits beside a K-12 keyword, Live always means every student on their own device, and the p-0042 grade line is removed. Buyer ids and the utm audience part (k5-teachers, 612-teachers) stay, because the naming rule (bible 9) only allows the section 3 segment ids. They are targeting data, and each k5-teachers campaign notes that its copy stays K-12. Also fixed p-0026 slide 6 (said Plus free for the whole test) and p-0030 alt text (said 20% off). New planner test: no narrow grade band in customer-facing text. Bible check 15 added. All stay needs-ok (p-0005 stays drafting).' },
  { at: '2026-11-26T12:00:00', by: 'Marketing Director', what: 'Owner request (2026-11-26): a promotion strategy for features locked on Free and Plus, a screen after sign-up showing what Plus and Pro add, and a beta filter that still converts non-beta sign-ups. Wrote campaign c-upgrade (needs-ok) and docs/upgrade-strategy.md: every locked feature with where it shows, its hook line, the moment a teacher reaches for it and the prompt pattern; one welcome screen (Plus, Pro, Start Free, then the beta strip) instead of two pop-ups; six beta filters; a reverse-trial option with its trade-offs; the numbers to watch. Economy-designer and Design Chair views applied (prompts at the moment of need, full-color locks with a plan chip, never on a projected screen). No app code changed.' },
  { at: '2026-11-26T12:00:00', by: 'Marketing Director', what: 'Truth checks while writing c-upgrade: Free plays 4 of the 8 listed games (FREE_GAMES still lists 3 hidden ones); the Pro line "new games before anyone else" has no early-access setting in the code, so it stays out of prompts; the upgrade box shows only "Billed yearly" with no renewal line or monthly choice, which must be fixed before Stripe. Ethics check: the FTC click-to-cancel rule was vacated in July 2025, but ROSCA and state automatic-renewal laws still apply, so cancel stays as easy as sign-up; COPPA and student pages untouched. Added Waiting on you: mkt-upgrade-strategy (5 decisions).' },
];

// Who may change a status: only the owner approves.
export const OWNER_ONLY: Status[] = ['approved', 'scheduled', 'posted'];

// Words that never go in public content (bible sections 4 and 7). Other
// companies' and games' names are blocked by the rename list too; these are
// the ones most likely to slip into a caption.
export const BANNED = ['blooket', 'kahoot', 'wordwall', 'baamboozle', 'gimkit', 'quizizz', 'flippity', 'prodigy', 'nearpod', 'minecraft', 'roblox', 'fortnite', 'pokemon', 'addictive', 'guaranteed', 'low kids', 'high kids'];

// K-12 rule (owner, 2026-11-25): Gamify is always presented as K-12, never a
// narrower band. A single classroom idea (a blog post, or a sentence that
// recommends one idea) may name its best-fit grade band; the product never.
export const NARROW_GRADE = /\b(k-?(?!12\b)\d{1,2}|grades? (?!k-12)[0-9k]|kindergarten|pre-?k|\d{1,2}(st|nd|rd|th) grade|first grade|second grade|third grade|elementary|middle school|high school|middle and high|upper elementary|older students|younger students|teens?)\b/i;
export const SAYS_K12 = /\bk-?12\b/i;
// A sentence that recommends one idea for a grade band ("a K-3 idea") is allowed.
export const withoutIdeaBands = (text: string) => text.split(/(?<=[.!?])\s+|\n+/).filter((s) => !/\bidea\b/i.test(s)).join(' ');

// Platform limits the team writes to (bible section 6 and 8).
export const LIMITS: Partial<Record<Platform, { hook: number; caption: number; tags?: number }>> = {
  instagram: { hook: 125, caption: 2200, tags: 5 },
  facebook: { hook: 125, caption: 5000 },
  pinterest: { hook: 100, caption: 500 },
  tiktok: { hook: 150, caption: 4000 },
  'meta-ads': { hook: 40, caption: 2200 },
  'google-ads': { hook: 30, caption: 90 },
};

export interface Decision { decision: 'approved' | 'changes' | 'no'; note: string; at: string }
export interface OwnerIdea { id: string; text: string; at: string }

// The status the owner sees: her decision wins over the team's status.
export function shownStatus(post: Post, decisions: Record<string, Decision>): Status | 'changes' | 'no' {
  const d = decisions[post.id];
  if (!d) return post.status;
  return d.decision === 'approved' ? (STATUSES.indexOf(post.status) > STATUSES.indexOf('approved') ? post.status : 'approved') : d.decision;
}

// A plain-text hand-off the owner pastes to the team (the agents read it first).
export function teamExport(decisions: Record<string, Decision>, ideas: OwnerIdea[]): string {
  const lines = ['FOR THE MARKETING TEAM (from the owner\'s planner)', ''];
  const ids = Object.keys(decisions).sort();
  lines.push(ids.length ? 'Decisions:' : 'Decisions: none yet');
  for (const id of ids) {
    const d = decisions[id];
    lines.push(`- ${id}: ${d.decision.toUpperCase()} (${d.at.slice(0, 10)})${d.note ? ` "${d.note}"` : ''}`);
  }
  lines.push('', ideas.length ? 'Owner ideas:' : 'Owner ideas: none');
  for (const i of ideas) lines.push(`- (${i.at.slice(0, 10)}) ${i.text}`);
  lines.push('', 'Apply every note word for word, log rejections in docs/marketing-lessons.md, and add general preferences to docs/marketing-bible.md section 12.');
  return lines.join('\n');
}
