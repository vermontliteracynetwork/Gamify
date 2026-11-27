// The owner's private Astrology Advisor (owner, 2026-11-25: "in my developer
// dashboard only, i want an astrological advisor that is accurate and aligned
// with my goals for gamify and my natal chart to have the best career and
// financial advice"). Kept by .claude/agents/astrology-advisor.md, shown on the
// Developer Portal (/owner?s=astro) and nowhere else. Positions and dates come
// from the vendored ephemeris engine (.claude/skills/astrology, MIT) checked
// against her natal report; houses follow the report (Placidus). Birth date,
// time and place stay out of this file on purpose: it ships in the dashboard
// bundle, so only the readings live here.
// Each timing line pairs the chart with a business step that stands on its own.

export const ASTRO_UPDATED = '2026-11-25';

export interface AstroTrait { id: string; placement: string; title: string; detail: string; use: string }
export interface AstroWindow { id: string; when: string; sky: string; tone: 'build' | 'grow' | 'care'; advice: string; step: string }

export const BIG_THREE = [
  { label: 'Sun', value: 'Scorpio, 10th house (career)' },
  { label: 'Moon', value: 'Scorpio, 9th house (teaching)' },
  { label: 'Rising', value: 'Capricorn (ruled by Saturn)' },
];

export const STRENGTHS: AstroTrait[] = [
  { id: 'sun-mc', placement: 'Sun conjunct the Midheaven in Scorpio, 10th house',
    title: 'Your career is the main stage',
    detail: 'Recognition through mastery: you want to be truly good at one thing, and people in high places can help or hinder.',
    use: 'Make Gamify the one thing. Put your name and face on it with schools: founder-led selling is your edge.' },
  { id: 'mars-saturn', placement: 'Mars trine Saturn',
    title: 'You build for permanence',
    detail: 'Endurance, planning and steady step-by-step work; your best work happens alone.',
    use: 'Protect long solo build blocks on the calendar, and pick a slow, durable plan over a fast flashy one.' },
  { id: 'scorpio-9', placement: 'Moon, Mercury and Venus in Scorpio, 9th house',
    title: 'A teacher and researcher at heart',
    detail: 'Depth over breadth, a detective mind, and a gift for teaching what you care about.',
    use: 'Teach in public: the Blog, classroom how-tos and research notes are your most natural marketing.' },
  { id: 'saturn-5', placement: 'Chart ruler Saturn in the 5th house (play, children)',
    title: 'Serious about play',
    detail: 'Hobbies have to serve a purpose for you. Learning games for kids is a close fit.',
    use: 'Keep learning at the center of every game: it is the part of the work your chart takes seriously.' },
  { id: 'mercury-jupiter', placement: 'Mercury trine Jupiter',
    title: 'You can sell and explain',
    detail: 'Long-range plans, good judgment, and a fit for sales, advertising, publishing and consulting.',
    use: 'Do the first school demos and sales calls yourself before you hand sales to anyone.' },
  { id: 'jupiter-6', placement: 'Jupiter exalted in Cancer, 6th house',
    title: 'Money grows with patience',
    detail: 'Good financial judgment that builds over time, strongest from mid-life; a loyal, steady worker.',
    use: 'Choose recurring subscriptions and school contracts over one-time wins; let them compound.' },
];

export const WATCH: AstroTrait[] = [
  { id: 'sun-uranus', placement: 'Sun square Uranus (the strongest aspect in your chart)',
    title: 'Too many projects at once',
    detail: 'Jumping between ideas so fast that things never get finished.',
    use: 'Limit work in progress: finish one dev plan stage before you open the next.' },
  { id: 'money-leaks', placement: 'Moon square Mars, Venus square Neptune',
    title: 'Money can slip away',
    detail: 'Generous, impulsive spending and rose-colored money plans.',
    use: 'Keep Gamify money in its own account, set a monthly budget and use a 48-hour rule for any new cost.' },
  { id: 'saturn-pluto', placement: 'Saturn opposite Pluto',
    title: 'Power struggles and roadblocks',
    detail: 'People or rules in the way; the lesson is to cooperate rather than control.',
    use: 'Get partner terms (districts, contractors, the LLC) in writing early, and choose partners who share the mission.' },
  { id: 'mercury-mars', placement: 'Mercury square Mars',
    title: 'A sharp tongue under pressure',
    detail: 'Quick to debate and to overwork.',
    use: 'Wait a day before replying to a hard email from a school or a partner.' },
];

// Computed 2026-11-25 with the engine's transit_natal_aspects mode, every 10
// days from 2026-11-25 to 2028-06-30, slow planets only, orb 1.5 degrees.
export const WINDOWS: AstroWindow[] = [
  { id: 'saturn-venus', when: 'Now to mid-January 2027', tone: 'care',
    sky: 'Saturn quincunx your Venus',
    advice: 'Small corrections to what you value and spend. Tidy, do not expand.',
    step: 'Review every subscription and tool Gamify pays for and cut what is unused.' },
  { id: 'saturn-mars', when: 'Mid to late February 2027', tone: 'build',
    sky: 'Saturn sextile your Mars',
    advice: 'Disciplined energy: a strong stretch for hard, focused building.',
    step: 'Plan your heaviest build sprint for these weeks (for example the beta fixes).' },
  { id: 'jupiter-sun', when: 'February to June 2027 (three passes)', tone: 'care',
    sky: 'Jupiter square your 10th-house Sun, and opposite your Uranus',
    advice: 'Big ambitions and a sudden urge to change direction. Good for visibility; easy to overpromise.',
    step: 'Before you say yes to anything new, write down what it replaces and what it costs.' },
  { id: 'saturn-pluto', when: 'March 2027', tone: 'build',
    sky: 'Saturn trine your Pluto; Saturn square your Jupiter',
    advice: 'Lasting structure is favored, and so is financial caution.',
    step: 'Formalize: contracts, the operating agreement and the books. Hold off on big new spending.' },
  { id: 'jupiter-venus', when: 'Early September 2027', tone: 'grow',
    sky: 'Jupiter sextile your Venus',
    advice: 'A friendly opening for money and partnerships.',
    step: 'It lands in back-to-school buying season: have the school quote, W-9 and data agreement ready in August.' },
  { id: 'pluto-venus', when: 'Late September 2027 to mid-2028', tone: 'care',
    sky: 'Pluto square your Venus',
    advice: 'A slow, deep change in money and partnerships. Old arrangements may not survive.',
    step: 'Test pricing with real data (one change at a time against the current price) rather than all at once.' },
  { id: 'saturn-uranus', when: 'December 2027 to early January 2028', tone: 'grow',
    sky: 'Saturn sextile your Uranus',
    advice: 'Structure meets invention: new technology can land well.',
    step: 'A good window to ship a planned new feature, with a written launch checklist.' },
  { id: 'pluto-neptune', when: 'Now to mid-2028 (long, slow)', tone: 'care',
    sky: 'Pluto conjunct your 1st-house Neptune; Uranus trine Neptune from mid-2027',
    advice: 'Your vision of yourself and your work is being remade. Inspiring, and easy to lose in.',
    step: 'Write the Gamify vision on one page and check each big decision against it.' },
  { id: 'saturn-return', when: 'Around June 2031 (first Saturn return)', tone: 'build',
    sky: 'Saturn returns to its birth place (computed: 2031-06-07)',
    advice: 'The classic test of what you have built. Plans made now pay off then.',
    step: 'Set a five-year goal for Gamify now and review it each solar return (your birthday).' },
];

// Start and end dates for each timing window (from the same 2026-11-25 run),
// so the dashboard can show what is active this month and this year.
export const WINDOW_DATES: Record<string, [string, string]> = {
  'saturn-venus': ['2026-11-01', '2027-01-15'], 'saturn-mars': ['2027-02-10', '2027-02-28'],
  'jupiter-sun': ['2027-02-01', '2027-06-30'], 'saturn-pluto': ['2027-03-01', '2027-03-31'],
  'jupiter-venus': ['2027-09-01', '2027-09-12'], 'pluto-venus': ['2027-09-20', '2028-06-30'],
  'saturn-uranus': ['2027-12-01', '2028-01-10'], 'pluto-neptune': ['2026-11-01', '2028-06-30'],
  'saturn-return': ['2031-05-01', '2031-07-31'],
};

// The Moon and Sun, low precision (about a degree; Meeus, Astronomical
// Algorithms, short series), enough for the sign of the day.
const rad = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
function daysSinceJ2000(d: Date) { return (d.getTime() - Date.UTC(2000, 0, 1, 12)) / 86_400_000; }
export function moonLongitude(d: Date) {
  const n = daysSinceJ2000(d);
  const L = norm(218.316 + 13.176396 * n), M = norm(134.963 + 13.064993 * n), F = norm(93.272 + 13.22935 * n);
  const D = norm(297.85 + 12.190749 * n), Ms = norm(357.529 + 0.98560028 * n);
  return norm(L + 6.289 * Math.sin(M * rad) + 1.274 * Math.sin((2 * D - M) * rad) + 0.658 * Math.sin(2 * D * rad) + 0.214 * Math.sin(2 * M * rad) - 0.186 * Math.sin(Ms * rad) - 0.114 * Math.sin(2 * F * rad));
}
export function sunLongitude(d: Date) {
  const n = daysSinceJ2000(d);
  const g = norm(357.529 + 0.98560028 * n), q = norm(280.459 + 0.98564736 * n);
  return norm(q + 1.915 * Math.sin(g * rad) + 0.02 * Math.sin(2 * g * rad));
}
export const SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'] as const;
export const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30)];
// Moon phase, 0 new to 0.5 full to 1 new.
export const phaseOf = (d: Date) => norm(moonLongitude(d) - sunLongitude(d)) / 360;
export function phaseName(p: number) {
  return p < 0.03 || p > 0.97 ? 'New Moon' : p < 0.22 ? 'Waxing crescent' : p < 0.28 ? 'First quarter' : p < 0.47 ? 'Waxing gibbous' : p < 0.53 ? 'Full Moon' : p < 0.72 ? 'Waning gibbous' : p < 0.78 ? 'Last quarter' : 'Waning crescent';
}

// The Moon's sign each day, read for her chart (Scorpio Sun at the career
// point, Capricorn rising, Jupiter in Cancer for money): a work focus and a
// money note, each a real business step.
export const MOON_DAY: Record<(typeof SIGNS)[number], { focus: string; money: string }> = {
  Aries: { focus: 'Start the hard task first; short bursts work today.', money: 'Skip impulse buys: use your 48-hour rule.' },
  Taurus: { focus: 'Slow, steady building. Polish one finished thing.', money: 'Good day to review prices and recurring costs.' },
  Gemini: { focus: 'Write: posts, help pages, emails to schools.', money: 'Compare two options before you pay for any tool.' },
  Cancer: { focus: 'Care for your teachers: answer feedback and beta check-ins.', money: 'Your Jupiter sign: patient money moves pay off.' },
  Leo: { focus: 'Be seen: film a demo or post your face with Gamify.', money: 'Spend on visibility only if it has a clear goal.' },
  Virgo: { focus: 'Fix bugs, tidy checklists, finish the small stuff.', money: 'Reconcile Books and receipts.' },
  Libra: { focus: 'Partners and design: talk to a school or collaborator.', money: 'Agree terms in writing before anything is promised.' },
  Scorpio: { focus: 'Your Sun and Moon sign: deep focus on the one big thing.', money: 'Strong for research and strategy, not snap spending.' },
  Sagittarius: { focus: 'Teach in public: a Blog post or research note.', money: 'Think long range: plan next quarter, do not sign today.' },
  Capricorn: { focus: 'Your rising sign: plan, set deadlines, make the hard call.', money: 'Good day for budgets and pricing decisions.' },
  Aquarius: { focus: 'New ideas: write them down, do not start them all.', money: 'Your 2nd house of money: check income and subscriptions.' },
  Pisces: { focus: 'Creative day: themes, art, sound. Rest if tired.', money: 'Avoid rose-colored plans; read the numbers twice.' },
};

// The advisor's voice for each Moon sign (owner, 2026-11-27: "more
// narrative/interpretive (short text, sentences) ... as if the astrological
// advisor is just that, an advisor, giving me wisdom on what to do").
export const MOON_STORY: Record<(typeof SIGNS)[number], string> = {
  Aries: 'The Moon runs hot in Aries. Your energy comes in bursts today, so spend the first one on the hardest thing on your list.',
  Taurus: 'In Taurus the Moon slows everything down, in a good way. Finish and polish rather than start; what you steady today lasts.',
  Gemini: 'Gemini Moon loosens your words. Write the post, the help page, the email to a principal while the sentences come easily.',
  Cancer: 'The Moon is home in Cancer, and so is your Jupiter. Tend your people today: answer teachers, check on the beta, and let money decisions wait for patience.',
  Leo: 'Leo Moon wants you seen. Put your face next to Gamify today, a demo or a short video. Spend only on what gets you seen with a clear goal.',
  Virgo: 'A Virgo Moon is a fixer. Small bugs, loose checklists and receipts are where the day wants you. Tidy work now saves big work later.',
  Libra: 'Libra Moon brings partners into view. Talk to a school or a collaborator, and put any promise in writing before you make it.',
  Scorpio: 'The Moon joins your Sun and Moon in Scorpio. This is your deepest focus of the month: one big problem, no distractions, no snap spending.',
  Sagittarius: 'Sagittarius Moon is a teacher. Share what you know in public, a Blog post or a research note, and plan far ahead without signing anything today.',
  Capricorn: 'The Moon crosses your rising sign. Plan, set deadlines and make the hard call you have been putting off. Budgets and prices land well today.',
  Aquarius: 'Aquarius Moon fills your money house with ideas. Write every one down, start none of them, and check your income and subscriptions.',
  Pisces: 'Pisces Moon softens the edges. A day for themes, art and sound, or for rest. Read any number twice before you trust it.',
};
export function phaseStory(p: number) {
  if (p < 0.03 || p > 0.97) return 'A New Moon: plant one clear intention for Gamify and write it where you will see it.';
  if (p < 0.47) return 'The Moon is growing, so this is a building stretch: launch, send, ask.';
  if (p < 0.53) return 'A Full Moon: results show. Celebrate one win and notice what needs to change.';
  return 'The Moon is waning, a finishing stretch: wrap up, review and let go of what is not working.';
}
// Simple line-art constellations for each sign (stylized for art, not a star map).
export const CONSTELLATIONS: Record<(typeof SIGNS)[number], { stars: [number, number][]; lines: [number, number][] }> = {
  Aries: { stars: [[10, 60], [38, 40], [62, 36], [86, 48]], lines: [[0, 1], [1, 2], [2, 3]] },
  Taurus: { stars: [[8, 20], [30, 40], [48, 52], [62, 46], [86, 24], [58, 70], [76, 84]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6]] },
  Gemini: { stars: [[20, 12], [24, 40], [26, 70], [14, 90], [62, 10], [66, 40], [70, 70], [84, 90]], lines: [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7], [1, 5]] },
  Cancer: { stars: [[50, 14], [48, 44], [22, 70], [76, 76], [52, 56]], lines: [[0, 1], [1, 4], [4, 2], [4, 3]] },
  Leo: { stars: [[70, 14], [58, 20], [54, 36], [64, 46], [40, 56], [16, 66], [30, 84], [62, 70]], lines: [[0, 1], [1, 2], [2, 3], [3, 7], [7, 4], [4, 5], [5, 6], [6, 7]] },
  Virgo: { stars: [[12, 22], [30, 34], [46, 30], [56, 48], [40, 64], [72, 62], [86, 84], [24, 82]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5], [5, 6], [4, 7]] },
  Libra: { stars: [[50, 12], [20, 40], [80, 40], [28, 78], [72, 80]], lines: [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4]] },
  Scorpio: { stars: [[10, 20], [22, 30], [34, 36], [44, 48], [50, 62], [56, 76], [70, 86], [84, 80], [90, 66]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8]] },
  Sagittarius: { stars: [[20, 70], [38, 52], [56, 60], [50, 34], [70, 30], [84, 14], [76, 78]], lines: [[0, 1], [1, 2], [2, 6], [1, 3], [3, 4], [4, 5], [4, 2]] },
  Capricorn: { stars: [[12, 30], [30, 44], [50, 64], [70, 74], [88, 40], [64, 34]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0]] },
  Aquarius: { stars: [[10, 30], [26, 22], [42, 34], [58, 26], [74, 38], [50, 58], [40, 82], [70, 80]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [2, 5], [5, 6], [5, 7]] },
  Pisces: { stars: [[12, 18], [22, 40], [30, 62], [46, 84], [64, 70], [80, 58], [90, 40], [80, 26]], lines: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 5]] },
};
