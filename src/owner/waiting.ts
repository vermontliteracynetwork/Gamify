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
  { id: 'vln-llc', kind: 'legal', added: '2026-10-26', title: 'Put Gamify under Vermont Literacy Network LLC (your decision, 2026-10-26)',
    why: 'Gamify sells as Vermont Literacy Network LLC for now; the legal drafts already name it.',
    how: 'Sign a one-page assignment of Gamify to the LLC (your attorney can draft it), register "Gamify" as the LLC\'s trade name with the Vermont Secretary of State, then open Stripe, the domain and a bank account in the LLC\'s name.' },
  { id: 'supabase', kind: 'setup', added: '2026-10-24', title: 'Run the database migrations and make yourself owner',
    why: 'Cloud accounts, school quotes and beta requests need the tables and security rules.',
    how: 'Supabase SQL Editor: run supabase/migrations 0001 to 0004 in order, then supabase/owner.sql (create your login under Authentication, Users first). Links are on GitHub on the claude/awesome-mccarthy-93hliu branch.' },
  { id: 'stripe', kind: 'money', added: '2026-10-24', title: 'Open a Stripe account',
    why: 'Plus, Pro, school invoices and the Vermont Literacy Network beta code all run through it.',
    how: 'Create the account in the business\'s name, confirm prices ($96 and $180 a year), and add the keys to Vercel.' },
  { id: 'domain', kind: 'money', added: '2026-10-24', title: 'Trademark search, then buy the domain',
    why: 'Claudia\'s pick is joingamify.com, with gamifyedu.app as a second. "Gamify" is a common word, so check before spending on a domain.',
    how: 'USPTO Trademark Search (tmsearch.uspto.gov): search "gamify" and "gamif*", then look at live marks in classes 9 (apps), 41 (education) and 42 (software as a service). Also search the Vermont Secretary of State business names and the app stores. Bring what you find to the attorney for a clearance opinion, then buy the domain and point it at Vercel.' },
  { id: 'attorney', kind: 'legal', added: '2026-10-25', title: 'Attorney review',
    why: 'We sell to schools, so every public promise needs a lawyer\'s eye.',
    how: 'Terms, Privacy, the beta tester agreement, the Theme Building Challenge rules, the accessibility conformance report, the student data privacy agreement template, naming other products for compatibility (Google Sheets, Google Classroom, Canva), the Common Core text license, DMCA agent registration.' },
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
