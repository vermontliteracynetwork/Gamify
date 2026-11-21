// The full Privacy Policy, Terms of Service, sub-processor list and data
// agreement page (legal pass, 2026-11-21: "make the privacy policy match what
// we collect", "cap liability", "publish our sub-processor list", "offer a
// DPA"). Written in plain words from docs/legal drafts and checked against
// what the code really stores. Attorney review is still a launch step
// (Waiting on you); change these words only together with the drafts.
export interface LegalSection { h: string; p?: string[]; items?: string[] }

export const LEGAL_UPDATED = 'November 21, 2026';
export const CONTACT = 'quotes@learngamify.com';

export const PRIVACY: LegalSection[] = [
  { h: 'Who we are', p: [`Gamify is a classroom game service run from Vermont, USA. Questions about this policy or your data: ${CONTACT}.`] },
  { h: 'Who uses Gamify', items: [
    'Teachers and parents (adults) make an account, question sets, classes and themes.',
    'Students, including children under 13, play the games their teacher sets up. Students never make an account and never give an email address.',
    'School and district buyers ask for quotes and buy school plans.',
  ] },
  { h: 'What we collect, and why', items: [
    'Teacher account: your email, your username, a name your students see, and your password (stored only as a secure hash by our sign-in provider). Used to sign you in and to help you.',
    'Your teaching content: question sets, classes, assignments, themes and settings. Used to run the service for you.',
    'Student details the teacher enters: a first name or nickname, sign-in pictures or a short PIN, an optional photo the teacher uploads, and supports such as read-aloud or extra time. Used to sign students in and give them their supports.',
    'Game results: which question, the answer picked, tries and time taken. Used only for the teacher\'s reports and to pick review questions.',
    'Students who join with a game code: a nickname from the name dice, kept only for that game.',
    'Class check-ins: only the number of taps on each picture. No names.',
    'Tell Gamify reports: the kind of report, the words typed, the page and the device type. Student reports never carry a name.',
    'Plan and billing: your plan and whether it is paid. Card details are handled by our payment provider; we never see full card numbers.',
    'School quotes: the contact name, email and school details typed into the quote form.',
  ] },
  { h: 'What we never collect or do', items: [
    'No student email addresses, location, contacts, advertising IDs or browsing history.',
    'No ads, no ad networks, no trackers and no analytics on any page.',
    'We never sell or rent personal information, and never build profiles of students.',
    'We never use your content or your students\' data to train artificial intelligence models, and we never let our providers do so.',
    'No prices, upgrade prompts or purchases on student screens.',
  ] },
  { h: 'Cookies and storage on your device', items: [
    'Gamify uses only storage it needs to work: keeping you signed in, your settings (such as text size and sound), a game in progress and theme drafts. Nothing is used for tracking or advertising.',
    'Because there is nothing optional to turn on, there is no cookie banner. If we ever add something optional, it stays off until you choose to accept it, and you can reject it just as easily.',
  ] },
  { h: 'Children, schools and families', items: [
    'For classes, Gamify relies on the school\'s permission to collect student information for an educational purpose, as children\'s privacy law allows for school services.',
    'Student information belongs to the school or family. We act under the school\'s direction and use it only to provide Gamify.',
    'Schools and districts can sign a student data privacy agreement with us (see Data agreement).',
  ] },
  { h: 'Who helps us run Gamify', p: ['A small number of providers process data for us, only to run Gamify. The full list, with what each one receives, is on our Sub-processors page.'] },
  { h: 'Keeping, downloading and deleting', items: [
    'Teachers can download all of their data, and delete all of it, at any time on the Account page.',
    'Deleting a class deletes its students, assignments and answers.',
    'When a plan ends or gets smaller nothing is deleted; items past the new limit become read-only until you remove some or upgrade.',
  ] },
  { h: 'Security', items: [
    'Everything travels over HTTPS. Access rules in our database let each teacher see only their own classes.',
    'If a breach ever affects your data, we tell you and the school without delay, and within 72 hours of finding it.',
  ] },
  { h: 'Changes and contact', p: [`We tell teachers by email before any important change to this policy. Questions or requests: ${CONTACT}.`] },
];

export const TERMS: LegalSection[] = [
  { h: 'The service', p: ['Gamify lets teachers and parents make or import question sets and run classroom games with their students. The Free plan, Plus, Pro and school plans are described on the Pricing page.'] },
  { h: 'Accounts', items: [
    'Accounts are for adults: teachers, school staff and parents. You keep your sign-in safe and are responsible for what happens in your account.',
    'Students do not have accounts. You are responsible for the class lists you enter and for having your school\'s or family\'s permission to enter them.',
  ] },
  { h: 'Your content', items: [
    'You own the question sets, classes and themes you make. You let Gamify store them and show them to you and your students so the service works.',
    'Themes drawn by students belong to the students who made them; you confirm you have permission to upload them.',
    'Only upload what you have the right to share. We may remove content that breaks these terms.',
  ] },
  { h: 'Acceptable use', p: ['No unlawful, hateful or harmful content, no attempts to break security, scrape the service or guess game codes, and no reselling Gamify without our written agreement.'] },
  { h: 'Plans, renewal and cancelling', items: [
    'Plus and Pro are billed once a year through our payment provider. They renew automatically each year at the price shown when you subscribe, unless you cancel before the renewal date.',
    'You can cancel online any time from the Account page. Your plan stays on until the end of the year you paid for; nothing is deleted when it ends.',
    'School plans can be paid by purchase order, as agreed in the school\'s quote.',
    'Prices do not include any sales tax where it applies. Coupons and co-op codes follow the terms shown with them.',
  ] },
  { h: 'Availability', p: ['We work hard to keep Gamify running and fast, but we do not promise it will always be available or free of errors. The service is provided "as is", without warranties of any kind, to the extent the law allows.'] },
  { h: 'Limit of liability', p: ['To the extent the law allows, Gamify is not liable for indirect, incidental or lost-profit damages, and our total liability for any claim is limited to the amount you paid us for Gamify in the 12 months before the claim, or $100 if you have not paid us.'] },
  { h: 'Names and marks', p: ['The Gamify name and logo are ours. Game names are our own; other companies\' marks are not used.'] },
  { h: 'Copyright complaints', p: [`If you believe something on Gamify uses your work without permission, email ${CONTACT} with the page and your details, and we will review it promptly.`] },
  { h: 'Governing law', p: ['These terms are governed by the laws of the State of Vermont, USA.'] },
  { h: 'Changes', p: ['We tell account holders by email before any important change to these terms.'] },
];

export const SUBPROCESSORS: { name: string; does: string; gets: string }[] = [
  { name: 'Supabase', does: 'Database and sign-in', gets: 'Account details, teaching content, class lists and game results' },
  { name: 'Vercel', does: 'Hosting the website', gets: 'Web requests (pages and files); no stored student records' },
  { name: 'OpenAI', does: 'The natural read-aloud voice', gets: 'Only the words on the screen (questions, answers, directions). Never a name or what a student answered. Never used for training; the provider keeps it for up to 30 days for abuse checks, then deletes it.' },
  { name: 'Stripe', does: 'Payments for Plus and Pro (when payments open)', gets: 'The paying adult\'s billing details. Never student data.' },
  { name: 'Resend', does: 'Sending school quotes by email (when email opens)', gets: 'The school contact\'s name and email and the quote' },
];

export const DPA: LegalSection[] = [
  { h: 'A data agreement for your school', p: ['Schools and districts can sign a student data privacy agreement (DPA) with Gamify before students play. It says, in writing, what this Privacy Policy promises: student data is the school\'s, used only to provide Gamify, never sold, never used for ads or AI training, and deleted when the school asks.'] },
  { h: 'What it covers', items: [
    'The data Gamify keeps about students and why (see the Privacy Policy).',
    'Our sub-processors, and notice before we add one.',
    'Security, breach notice within 72 hours, and deletion on request or when the agreement ends.',
    'Your state\'s student privacy law, using your state or district template when you have one.',
  ] },
  { h: 'How to get one', p: [`Email ${CONTACT} with your school or district name and your state. We send our agreement, or sign yours, usually within two school days.`] },
];
