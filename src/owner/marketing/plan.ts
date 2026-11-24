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
    goal: 'Care, then Try: 300 saves and shares and 40 free sign-ups in January; the shareable moment that introduces Gamify.',
    buyer: 'k5-teachers', message: 'The whole class vs the teacher. Can your class beat you?', offer: 'Free tier (one classroom, every accessibility feature)',
    start: '2026-12-01', end: '2027-01-31', channels: ['instagram', 'facebook', 'tiktok', 'pinterest'], budget: 'Organic only. Paid test proposed for January once the domain is live (Waiting on you).' },
  { id: 'c-beta', name: 'Join the beta test', status: 'needs-ok',
    goal: 'Try: 4 beta classrooms by January 15 (Waiting on you: pilots).',
    buyer: 'sped', message: 'Built by a teacher for students with high support needs, so it works for everyone.', offer: 'Join the beta test (free while testing; disclosed in every post a beta teacher makes)',
    start: '2026-12-01', end: '2027-01-15', channels: ['instagram', 'facebook'], budget: 'Organic only.' },
];

const T = (date: string) => `${date}T09:00:00`;
const link = (path: string, source: string, medium: string, campaign: string, id: string) =>
  `{site}${path}?utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}&utm_content=${id}`;

export const POSTS: Post[] = [
  { id: 'p-0001', date: '2026-12-02', time: '16:00', platform: 'tiktok', format: 'tiktok', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'proof',
    principle: 'Curiosity gap + peak-end rule: open on the score tied, end on the class cheer.',
    hook: 'POV: your class is 1 question away from beating you',
    hooksTried: ['I told my class they could never beat me at review. Big mistake.', 'The only review game where losing is the best part'],
    caption: 'They beat me. Again. Friday review is now a grudge match 😅 One question set, the whole class vs the teacher. Would your class beat you?',
    onScreen: ['Frame 1 (0-2s): "POV: your class is 1 question away from beating you" over the tied scoreboard', 'Frame 2: teacher\'s face as the last answer comes in (no student faces)', 'Frame 3: the class side wins, confetti on the board', 'Frame 4: "Gamify: the whole class vs the teacher"'],
    canva: 'Template "Reel text overlays": hook field = frame 1 text; end card = "The whole class vs the teacher". Screen recording: Share mode, class vs teacher round, sample nicknames only.',
    sound: 'Original audio (the room) + Gamify win sound (licensed, docs/asset-ledger.md).',
    tags: ['#teachersoftiktok', '#elementaryteacher', '#reviewgame', '#classroomgames'],
    alt: 'A classroom screen shows a review game where the class team beats the teacher team and confetti falls.',
    link: link('/', 'tiktok', 'social', 'tt_engage_care_k5-teachers_class-vs-teacher_202612', 'p-0001'),
    lesson: 'First test. Applies bible 6: TikTok rewards native, phone-shot classroom energy over polish.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Wrote 3 hooks; recommends the POV hook (curiosity gap, native format).' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER. Needs a filmed class round with no student faces (owner to film or approve a screen-only version).' }] },

  { id: 'p-0002', date: '2026-12-03', time: '07:00', platform: 'instagram', format: 'reel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'proof',
    principle: 'Curiosity gap + peak-end rule (same idea as p-0001, native Instagram cut).',
    hook: 'Can your class beat you? Mine just did.',
    hooksTried: ['Friday review, but it\'s a grudge match', 'Stop running review. Start losing to your class.'],
    caption: 'Can your class beat you? Mine just did.\n\nOne question set becomes a team game on one screen: the whole class vs the teacher. No student accounts, no ads.\n\nSave this for Friday review ✨',
    onScreen: ['0-2s: "Can your class beat you?"', 'Scoreboard tied', 'Class wins, confetti', 'End card: "Save this for Friday review"'],
    canva: 'Template "Reel text overlays" (4 fields above) + "Reel cover": cover text "Class vs teacher".',
    sound: 'Meta Sound Collection upbeat track (business-licensed); name recorded once picked.',
    tags: ['#teachersofinstagram', '#reviewgame', '#elementaryteacher', '#classroomideas'],
    alt: 'Teacher reacts as the class team wins a review game on the classroom screen.',
    link: link('/', 'instagram', 'social', 'ig_engage_care_k5-teachers_class-vs-teacher_202612', 'p-0002'),
    lesson: 'First test. Bible 6: Instagram Reels are judged on shares and saves, so the CTA asks for a save.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Repurposed p-0001 for Instagram with a different first frame and caption.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }] },

  { id: 'p-0003', date: '2026-12-05', time: '20:00', platform: 'pinterest', format: 'pin', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'try', pillar: 'value',
    principle: 'Reciprocity: give a free, usable idea first; processing fluency: one big title.',
    hook: 'Friday Review Game Ideas for Elementary: Class vs Teacher',
    caption: 'An easy whole-class review game for elementary: the class plays as one team against the teacher on one screen. Works with any question set, no student devices needed. Step-by-step guide and free to try.',
    canva: 'Template "Pin 2:3": title = hook; image = Share mode board screenshot (Classic theme, on screen only); footer = "Free to try".',
    tags: ['review game ideas', 'elementary classroom games', 'whole class review', 'test prep games', 'no prep review activity'],
    alt: 'Pin titled Friday review game ideas showing a colorful team game board on a classroom screen.',
    link: link('/blog', 'pinterest', 'social', 'pin_traffic_try_k5-teachers_class-vs-teacher_202612', 'p-0003'),
    lesson: 'First test. Bible 6: Pinterest is search, so the title is the phrase teachers type.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Keyword title; links to the Ways to use Gamify blog. A dedicated class-vs-teacher post is in the blog ideas list (product-plan 10A).' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }] },

  { id: 'p-0004', date: '2026-12-08', time: '19:00', platform: 'facebook', format: 'image', campaign: 'c-beta', buyer: 'sped', funnel: 'try', pillar: 'personality',
    principle: 'Liking and unity (a teacher speaking to teachers) + authority (founder story), honest scarcity (only a few beta classrooms).',
    hook: 'I built Gamify because my students were left out of every review game.',
    caption: 'I built Gamify because my students were left out of every review game.\n\nSo every game has read-aloud, calm mode and its own settings, and accessibility is never a paid upgrade.\n\nI\'m looking for a few classrooms to test it this winter, especially special education, speech and intervention groups. Beta teachers use it free while we test. Comment BETA or tap the link.',
    canva: 'Template "Quote card": quote = hook; name line = "Kayden, founder and teacher"; photo = founder photo (owner to supply).',
    alt: 'Quote card from the founder: I built Gamify because my students were left out of every review game.',
    link: link('/beta', 'facebook', 'social', 'fb_conv_try_sped_beta_202612', 'p-0004'),
    lesson: 'First test. Applies bible 3: special education teachers act on accessibility first.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Founder voice; owner to confirm the story is in her words and add a photo.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER (founder name and photo need her OK).' }] },

  { id: 'p-0005', date: '2026-12-10', time: '07:00', platform: 'instagram', format: 'carousel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'care', pillar: 'value',
    principle: 'Reciprocity + specificity: three ideas a teacher can use tomorrow.',
    hook: '3 ways to use ONE question set this week',
    caption: '3 ways to use ONE question set this week 👇\n\n1. Monday: whole class on one screen\n2. Wednesday: everyone on their own device\n3. Friday: the whole class vs the teacher\n\nSame questions, three games. Save for planning day.',
    onScreen: ['Slide 1: "3 ways to use ONE question set this week"', 'Slide 2: Monday, one screen (Share mode)', 'Slide 3: Wednesday, own devices (Live)', 'Slide 4: Friday, class vs teacher', 'Slide 5: "Save for planning day"'],
    canva: 'Template "Carousel 4:5" (hook, 3 body slides, CTA slide); screenshots from each mode.',
    tags: ['#teachersofinstagram', '#teacherplanning', '#reviewgame', '#elementaryteacher'],
    alt: 'Five-slide guide showing three ways to play one question set: one screen, own devices, and class versus teacher.',
    link: link('/', 'instagram', 'social', 'ig_engage_care_k5-teachers_one-set-many-games_202612', 'p-0005'),
    lesson: 'First test. Bible 6: carousels earn saves; slide 1 is the hook, last slide the CTA.',
    status: 'drafting',
    history: [{ at: T('2026-11-24'), by: 'Social Planner', note: 'Drafted; waiting on screenshots of each mode before the bible check.' }] },
  { id: 'p-0006', date: '2026-12-12', time: '07:00', platform: 'instagram', format: 'carousel', campaign: 'c-class-vs-teacher', buyer: 'k5-teachers', funnel: 'try', pillar: 'product',
    principle: 'Loss aversion and psychological safety: name the pain teachers already feel (a team that answered right and still lost), then the relief.',
    hook: 'Review games where nobody steals your points',
    hooksTried: ['The power-up that made my class cry (and why we left it out)', 'Fair fun: right answers decide the game'],
    caption: 'Review games where nobody steals your points.\n\nIn Gamify, power-ups only add to your own team. No stealing, ever. Every timer can be turned off, so the kids who need a little longer play too.\n\nSave this for your next review day.',
    onScreen: ['Slide 1: "Review games where nobody steals your points"', 'Slide 2: Power-ups only add to your own team', 'Slide 3: Every timer can be turned off', 'Slide 4: Right answers decide the game', 'Slide 5: "Save this for review day"'],
    canva: 'Template "Carousel 4:5": hook slide, 3 feature slides with the Fair Play icons, CTA slide; screenshots of a power-up card and the timer setting.',
    tags: ['#teachersofinstagram', '#classroommanagement', '#reviewgame', '#elementaryteacher'],
    alt: 'Five-slide guide: power-ups only add to your own team, timers can be turned off, right answers decide the game.',
    link: link('/features', 'instagram', 'social', 'ig_traffic_try_k5-teachers_fair-play_202612', 'p-0006'),
    lesson: 'First test. Edge list item 1 (docs/marketing-bible.md section 13): the research shows stealing is the top complaint.',
    status: 'needs-ok',
    history: [{ at: T('2026-11-24'), by: 'Brand Copywriter', note: 'Built on the edge list: no stealing, timers off, right answers decide. No other site named.' }, { at: T('2026-11-24'), by: 'Marketing Director', note: 'Bible check: READY FOR OWNER.' }] },
];

export const ACTIVITY: Activity[] = [
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Team set up: the marketing bible, the lessons file, 6 team members and 8 skills. Planner opened.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Drafted two campaigns for December and January: Whole class vs the teacher, and Join the beta test.' },
  { at: T('2026-11-24'), by: 'Brand Copywriter', what: 'Wrote hooks and captions for p-0001 to p-0005 in the brand voice.' },
  { at: T('2026-11-24'), by: 'Social Planner', what: 'Placed 5 posts across TikTok, Instagram, Pinterest and Facebook for the first two weeks of December.' },
  { at: T('2026-11-24'), by: 'Trend Researcher', what: 'First monthly trend check is due 2026-12-01; platform specs in the bible are a baseline until then.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Added accounts, Canva brand kit and ad budgets to Waiting on you. Nothing is posted until you approve.' },
  { at: T('2026-11-24'), by: 'Marketing Director', what: 'Started the edge list (bible section 13) from the competitor research; no stealing leads. Drafted p-0006 on it.' },
];

// Who may change a status: only the owner approves.
export const OWNER_ONLY: Status[] = ['approved', 'scheduled', 'posted'];

// Words that never go in public content (bible sections 4 and 7). Other
// companies' and games' names are blocked by the rename list too; these are
// the ones most likely to slip into a caption.
export const BANNED = ['blooket', 'kahoot', 'wordwall', 'baamboozle', 'gimkit', 'quizizz', 'flippity', 'prodigy', 'nearpod', 'minecraft', 'roblox', 'fortnite', 'pokemon', 'addictive', 'guaranteed', 'low kids', 'high kids'];

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
