// Things only the owner can do (money, accounts, legal, going live), shown
// first on the owner desktop every time it opens (teacher, 2026-10-25: "keep
// them in a log and present them to me the next time I log in"). Claudia
// adds to this list in the same change that finds the need; ticks are saved
// on this device. Mirrors "Waiting on you" in the development plan doc and
// docs/waiting-on-you.md.
export interface WaitingItem { id: string; title: string; why: string; how: string; added: string; kind: 'setup' | 'money' | 'legal' | 'people' | 'decide' }

export const WAITING: WaitingItem[] = [
  { id: 'network', kind: 'setup', added: '2026-10-25', title: 'Widen network access for the Gamify cloud environment',
    why: 'Beth\'s sales research can search but cannot open web pages, and Supabase is blocked, so research and the cloud database are on hold.',
    how: 'Environment menu in the session title bar, Edit, Network access: a broader level, or add *.supabase.co and the research sites under Allowed domains. Then start a new session.' },
  { id: 'vln-llc', kind: 'decide', added: '2026-10-25', title: 'Decide: run Gamify under Vermont Literacy Network LLC?',
    why: 'You are the sole owner, so this is the simplest route; it changes the business owner of record on every legal page.',
    how: 'If yes: sign a one-page assignment of Gamify to the LLC, register "Gamify" as its trade name, and open Stripe, the domain and the bank account in the LLC\'s name.' },
  { id: 'supabase', kind: 'setup', added: '2026-10-24', title: 'Run the database migrations and make yourself owner',
    why: 'Cloud accounts, school quotes and beta requests need the tables and security rules.',
    how: 'Supabase SQL Editor: run 0001, 0002, 0003, then 0004_school_quotes.sql; then the owner and tester SQL Claudia gave you.' },
  { id: 'stripe', kind: 'money', added: '2026-10-24', title: 'Open a Stripe account',
    why: 'Plus, Pro, school invoices and the Vermont Literacy Network beta code all run through it.',
    how: 'Create the account in the business\'s name, confirm prices ($96 and $180 a year), and add the keys to Vercel.' },
  { id: 'domain', kind: 'money', added: '2026-10-24', title: 'Buy the domain after the trademark search',
    why: 'Claudia\'s pick is joingamify.com, with gamifyedu.app as a second.',
    how: 'Search the trademark first, then buy and point it at Vercel.' },
  { id: 'attorney', kind: 'legal', added: '2026-10-25', title: 'Attorney review',
    why: 'We sell to schools, so every public promise needs a lawyer\'s eye.',
    how: 'Terms, Privacy, the beta tester agreement, the Theme Building Challenge rules, the accessibility conformance report, the student data privacy agreement template, naming other products for compatibility (Google Sheets, Canva), the Common Core text license, DMCA agent registration.' },
  { id: 'pilots', kind: 'people', added: '2026-10-24', title: 'Line up 2 to 4 beta test classrooms',
    why: 'Real classrooms give the feedback, quotes and the screen reader check on iPads that schools ask for.',
    how: 'Send the Join the beta test page to teachers you trust; the classroom kit is at /beta-kit.' },
  { id: 'video', kind: 'people', added: '2026-10-25', title: 'Demo video: voice-over and classroom footage',
    why: 'The 80-second rough cut is ready; the final needs a voice and real classrooms (with signed releases).',
    how: 'See docs/demo-video-plan.md.' },
  { id: 'insurance', kind: 'money', added: '2026-10-25', title: 'Check insurance before schools pay',
    why: 'Districts often ask for proof of general liability and cyber coverage.',
    how: 'Ask your insurer whether the LLC policy covers software, and add cyber and errors-and-omissions cover if not.' },
  { id: 'guesses', kind: 'decide', added: '2026-10-25', title: 'Confirm Claudia\'s guesses',
    why: 'Claudia predicted these from your past answers and built them; change any you disagree with.',
    how: 'Homeschool co-ops of 5+ families buy like a school; school plans include a free online kickoff for teachers; we sign district data privacy agreements; school invoices go out within one school day; starter themes play on Plus and Pro; Pro\'s early access means new games open to Pro a few weeks early.' },
];
