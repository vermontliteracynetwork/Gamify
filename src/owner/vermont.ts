// Vermont business reminders (owner, 2026-11-24: "this will also be a new llc
// in Vermont. i want a member of the team to be specifically knowledgeable
// about vt law, practices, tax requirements, and other business
// specifications to give reminders and recommendations"). Kept by the
// Vermont Business Advisor (.claude/agents/vermont-business-advisor.md),
// shown on the Developer Portal's CEO Agent page. Each line names the office
// that owns it; fees and dates change, so `check` says what to confirm there
// before acting. Not legal or tax advice: the attorney and an accountant sign off.
export interface VtReminder { id: string; when: string; title: string; detail: string; check: string; source: string; kind: 'form' | 'tax' | 'privacy' | 'people' | 'school' }

export const VT_ADVISOR_UPDATED = '2026-11-24';

export const VT_REMINDERS: VtReminder[] = [
  { id: 'llc-form', kind: 'form', when: 'Before the first sale',
    title: 'Form Gamify LLC with the Secretary of State',
    detail: 'Vermont LLCs live under the Uniform Limited Liability Company Act (11 V.S.A. chapter 25). File Articles of Organization online and name a registered agent with a Vermont street address. Write an operating agreement even for one member: it is what keeps the liability shield believable.',
    check: 'Current filing fee. Gamify LLC is a new company, separate from Vermont Literacy Network (your decision, 2026-11-19); the attorney\'s one-page assignment moves Gamify into it.', source: 'https://sos.vermont.gov/corporations/' },
  { id: 'trade-name', kind: 'form', when: 'With the LLC filing',
    title: 'Only if needed: a trade name for any other selling name',
    detail: 'Selling as Gamify LLC needs no trade name. Selling under any other name (for example "Learn Gamify") needs a trade name (DBA) registration with the Secretary of State, renewed on its cycle. Do the trademark search first so the name is safe to build on.',
    check: 'Renewal period and fee on the Secretary of State trade name page.', source: 'https://sos.vermont.gov/corporations/' },
  { id: 'ein', kind: 'tax', when: 'Right after forming',
    title: 'Get an EIN, then open the bank account and Stripe in the LLC\'s name',
    detail: 'The IRS EIN is free and instant online. Keep Gamify money in its own account from day one; mixing personal and business money is the classic way an LLC\'s protection is lost ("piercing the veil").',
    check: 'Nothing to confirm; never pay a third-party site for an EIN.', source: 'https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online' },
  { id: 'myvtax', kind: 'tax', when: 'Before the first sale',
    title: 'Open a Vermont business tax account in myVTax and ask about sales tax on Gamify subscriptions',
    detail: 'Vermont\'s rules for taxing software and online services have changed in recent legislative sessions. Ask the Department of Taxes in writing whether Gamify subscriptions are taxable, register for sales and use tax if they are, and collect exemption certificates from schools and districts (public schools are usually exempt buyers).',
    check: 'Whether remotely accessed software (SaaS) is taxable in Vermont right now, and the filing frequency they assign.', source: 'https://tax.vermont.gov/business' },
  { id: 'annual-report', kind: 'form', when: 'Every year, after the fiscal year closes',
    title: 'File the LLC annual report with the Secretary of State',
    detail: 'Vermont LLCs file an annual report each year after their fiscal year ends. Missing it leads to administrative dissolution, which can void the liability shield and stop school contracts.',
    check: 'This year\'s due date and fee on the Secretary of State site; set a calendar reminder a month early.', source: 'https://sos.vermont.gov/corporations/' },
  { id: 'entity-tax', kind: 'tax', when: 'Every year with the tax return',
    title: 'Vermont business income return and the minimum business entity tax',
    detail: 'A multi-member LLC (or one taxed as an S corporation) files a Vermont business income tax return and owes Vermont\'s minimum business entity tax even in a loss year. A single-member LLC is usually reported on the owner\'s personal return instead. Federal: Form 1065 or Schedule C to match.',
    check: 'Which form applies to how the LLC is taxed, and this year\'s minimum tax amount. Ask an accountant.', source: 'https://tax.vermont.gov/business' },
  { id: 'student-privacy', kind: 'privacy', when: 'Before any school uses Gamify with students',
    title: 'Vermont student online privacy law and the district data privacy agreement',
    detail: 'Vermont has a student online personal information protection law (in Title 9) that limits what an ed-tech operator may do with K-12 student data: no targeted ads, no selling, no profiles beyond school purposes, reasonable security, deletion on request. Vermont districts commonly ask vendors to sign a state data privacy agreement (the Student Data Privacy Consortium version). Gamify\'s minimal-data design fits; the attorney confirms the wording.',
    check: 'The statute section and the current Vermont DPA template with the attorney.', source: 'https://education.vermont.gov/' },
  { id: 'breach', kind: 'privacy', when: 'Have the plan before launch',
    title: 'Data breach plan under the Vermont Security Breach Notice Act',
    detail: 'Vermont requires prompt notice to affected people and an early notice to the Attorney General after a breach of personal information (9 V.S.A. section 2435), with short deadlines. Write a one-page plan now: who checks, who decides, who tells schools.',
    check: 'Current deadlines on the Attorney General\'s data breach page.', source: 'https://ago.vermont.gov/' },
  { id: 'hiring', kind: 'people', when: 'Before paying anyone',
    title: 'Contractors versus employees in Vermont',
    detail: 'Vermont applies a strict test for who counts as an employee for unemployment and workers\' compensation. Before paying a helper, decide employee or contractor in writing; employees need Vermont withholding, unemployment insurance registration and workers\' compensation cover.',
    check: 'The Department of Labor\'s current test and registration steps.', source: 'https://labor.vermont.gov/' },
  { id: 'school-buying', kind: 'school', when: 'When schools start buying',
    title: 'How Vermont schools buy: W-9, insurance certificate, invoices',
    detail: 'Supervisory unions and districts usually need a W-9, a certificate of insurance (general liability, often cyber), a signed DPA and an invoice they can pay by purchase order. Have all four ready as PDFs.',
    check: 'Ask the first district\'s business office for its vendor packet.', source: 'https://education.vermont.gov/' },
];
