// The public Research page (teacher request, 2026-10-25), built from Beth's
// checked findings in docs/gamified-learning-research.md. Wording rule: say
// "studies found", never "Gamify is proven to". Every finding carries its
// honest caveat. Never say "dopamine" or claim to treat any condition.
// Links are DOIs or official repositories; before a number goes into a sales
// deck or grant, open the paper and quote it directly.

export interface Finding {
  id: string;
  title: string;
  found: string;
  fair: string; // the honest caveat
  inGamify: string;
  sources: { cite: string; url: string }[];
}

export const FINDINGS: Finding[] = [
  {
    id: 'practice',
    title: 'Answering practice questions helps students remember',
    found: 'A review of 222 classroom studies with about 48,000 students found that quizzing helped students remember more than reviewing alone, with a medium effect. It held from elementary school to college and across 18 subjects, and helped understanding, not only facts.',
    fair: 'These studies compare quizzing with not quizzing. They are not studies of games. The game is how Gamify gets students to do more practice questions willingly.',
    inGamify: 'Every move in every game comes from the teacher\'s own question set, so every move is a practice question.',
    sources: [{ cite: 'Yang, Luo, Vadillo, Yu & Shanks (2021). Testing (quizzing) boosts classroom learning. Psychological Bulletin.', url: 'https://doi.org/10.1037/bul0000309' }],
  },
  {
    id: 'gamified',
    title: 'Gamified lessons help students learn more, on average',
    found: 'Several independent meta-analyses that compared gamified lessons with regular ones found students in the gamified lessons learned more on average, a small to medium effect.',
    fair: 'Results vary a lot from study to study, and many studies are in colleges rather than K-12. Better-designed games did better than basic ones, so design matters.',
    inGamify: 'Games are built around the learning: the right answer is what powers the next move.',
    sources: [
      { cite: 'Sailer & Homner (2020). The gamification of learning: A meta-analysis. Educational Psychology Review.', url: 'https://doi.org/10.1007/s10648-019-09498-w' },
      { cite: 'Bai, Hew & Huang (2020). Does gamification improve student learning outcome? Educational Research Review.', url: 'https://doi.org/10.1016/j.edurev.2020.100322' },
      { cite: 'Clark, Tanner-Smith & Killingsworth (2016). Digital games, design, and learning. Review of Educational Research.', url: 'https://doi.org/10.3102/0034654315582065' },
    ],
  },
  {
    id: 'young',
    title: 'Young children benefit too, most when it is hard but doable',
    found: 'A review of research with preschool and elementary students found that recalling answers helps young children learn, and the benefit is biggest when a question takes effort but the child succeeds.',
    fair: 'This is a review of a young field, not a meta-analysis. Less is known about how the effect changes with age.',
    inGamify: 'Read-aloud, a short read-first pause, extra tries and tools like a calculator and scratchpad turn a hard question into one a child can get right.',
    sources: [{ cite: 'Fazio & Marsh (2019). Retrieval-based learning in children. Current Directions in Psychological Science.', url: 'https://doi.org/10.1177/0963721418806673' }],
  },
  {
    id: 'spacing',
    title: 'Short practice spread over days beats cramming',
    found: 'Learning scientists agree that recalling answers in short sessions spread over days leads to longer-lasting memory than the same practice crammed together.',
    fair: 'There is no single best gap between sessions.',
    inGamify: 'One question set feeds every game, so a class can practice the same content all week in a different game each day. When a student signs in, questions they missed on an earlier day come back for review.',
    sources: [
      { cite: 'Carpenter, Pan & Butler (2022). The science of effective learning with spacing and retrieval practice. Nature Reviews Psychology.', url: 'https://doi.org/10.1038/s44159-022-00089-1' },
      { cite: 'Cepeda, Pashler, Vul, Wixted & Rohrer (2006). Distributed practice in verbal recall tasks. Psychological Bulletin.', url: 'https://pubmed.ncbi.nlm.nih.gov/16719566/' },
    ],
  },
  {
    id: 'feedback',
    title: 'Feedback helps, and feedback that explains helps most',
    found: 'A meta-analysis of 435 studies with more than 61,000 students found feedback helps learning, with a medium effect. Feedback that told students something about the answer worked best.',
    fair: '"Right" or "not yet" on its own is light feedback. Showing the right answer later is what makes it stronger.',
    inGamify: 'Students hear right or not yet at once, and Review at the end of each game walks the class through every missed question and its right answer, read aloud.',
    sources: [
      { cite: 'Wisniewski, Zierer & Hattie (2020). The power of feedback revisited. Frontiers in Psychology.', url: 'https://doi.org/10.3389/fpsyg.2019.03087' },
      { cite: 'Butler & Roediger (2008). Feedback enhances the positive effects and reduces the negative effects of multiple-choice testing. Memory & Cognition.', url: 'https://doi.org/10.3758/MC.36.3.604' },
    ],
  },
  {
    id: 'low-stakes',
    title: 'Low-stakes quizzing, in students\' own words',
    found: 'In a survey of 1,408 middle and high school students who had regular low-stakes quizzes in class, 72 percent said the quizzes made them less nervous for tests, and 92 percent said they helped them learn.',
    fair: 'This is what students said in a survey, not an experiment, and it is from 2014. It did not include elementary students.',
    inGamify: 'A wrong answer never costs a point, a life or a turn. Timers are optional, and calm mode slows everything down.',
    sources: [{ cite: 'Agarwal, D\'Antonio, Roediger, McDermott & McDaniel (2014). Classroom-based programs of retrieval practice reduce middle school and high school students\' test anxiety. Journal of Applied Research in Memory and Cognition.', url: 'https://doi.org/10.1016/j.jarmac.2014.07.002' }],
  },
  {
    id: 'competition',
    title: 'Competition is not the magic ingredient',
    found: 'A meta-analysis of 29 studies with 3,515 students found gamified learning helped whether or not students competed with each other. Team play and solo play did not differ.',
    fair: 'Another meta-analysis found competition combined with teamwork helped behavior. The fair summary: kids do not need to be ranked against each other to benefit.',
    inGamify: 'Teachers choose: teams, the whole class against the computer, or head to head.',
    sources: [{ cite: 'Ho, Hung & Kwan. The impact of peer competition and collaboration on gamified learning performance: A meta-analytical study. Education and Information Technologies.', url: 'https://doi.org/10.1007/s10639-021-10770-2' }],
  },
  {
    id: 'motivation',
    title: 'Motivation goes up in K-12, least for the youngest',
    found: 'A 2025 meta-analysis of K-12 studies found gamified lessons raised motivation moderately. The effect was largest in the middle grades and smallest in primary school.',
    fair: 'For young children the case rests mostly on practice questions and access, not on motivation alone. Results varied a lot between studies.',
    inGamify: 'Picture-first screens and read-aloud for K-3, and head-to-head play and class-made themes that older students love.',
    sources: [{ cite: 'Kurnaz & Koçtürk (2025). A meta-analysis of gamification\'s impact on student motivation in K-12 education. Psychology in the Schools.', url: 'https://doi.org/10.1002/pits.70056' }],
  },
  {
    id: 'special-ed',
    title: 'Promising for students with disabilities, still early',
    found: 'A 2023 systematic review found gamified learning helped students with disabilities build skills, most often learning skills, and called for more research.',
    fair: 'The studies are small and the review did not combine them into one number. Nothing here is proven for any group of students.',
    inGamify: 'Built first for students with high support needs: read-aloud, extra tries, tools, calm mode and settings on every game, all free.',
    sources: [{ cite: 'Hussein et al. (2023). Exploring the impact of gamification on skill development in special education: A systematic review. Contemporary Educational Technology.', url: 'https://doi.org/10.30935/cedtech/13335' }],
  },
  {
    id: 'udl',
    title: 'Universal Design for Learning: access for everyone',
    found: 'Reviews of Universal Design for Learning find it improves how students take part in learning by giving many ways to see, hear and respond.',
    fair: 'Studies have not shown a clear effect on test scores. The case for it is access and fairness.',
    inGamify: 'Many ways to see, hear and answer are built into every game, and accessibility settings are never paid extras.',
    sources: [
      { cite: 'Capp (2017). The effectiveness of universal design for learning: A meta-analysis of literature between 2013 and 2016. International Journal of Inclusive Education.', url: 'https://doi.org/10.1080/13603116.2017.1325074' },
      { cite: 'Almeqdad, Alodat, Alquraan, Mohaidat & Al-Makhzoomy (2023). The effectiveness of universal design for learning: A systematic review and meta-analysis. Cogent Education.', url: 'https://doi.org/10.1080/2331186X.2023.2218191' },
    ],
  },
];

// What critics of gamified learning found, and how Gamify is designed around it.
export const CAUTIONS: { title: string; risk: string; found: string; answer: string; sources: { cite: string; url: string }[] }[] = [
  {
    title: 'Play is the reward',
    risk: 'Rewards can crowd out interest',
    found: 'A meta-analysis of 128 experiments found that expected, tangible rewards lowered people\'s interest in a task afterward, while positive feedback raised it.',
    answer: 'There are no prizes, shops or paid rewards. A right answer powers the game you are already playing, and feedback is about the task.',
    sources: [{ cite: 'Deci, Koestner & Ryan (1999). Psychological Bulletin.', url: 'https://depts.washington.edu/techdocs/papers/deciExtrinsicRewardsAndIntrinsicMotivation99.pdf' }],
  },
  {
    title: 'Everyone can be on the same team',
    risk: 'Public rankings can backfire',
    found: 'In a semester-long college course, required badges and a public leaderboard led to lower motivation and lower exam scores. The authors pointed to social comparison and loss of choice.',
    answer: 'No required badges. Teachers can play as teams or as one class against the computer, and students choose their games.',
    sources: [{ cite: 'Hanus & Fox (2015). Computers & Education.', url: 'https://doi.org/10.1016/j.compedu.2014.08.019' }],
  },
  {
    title: 'Always something new to play',
    risk: 'The newness wears off',
    found: 'A longitudinal study found gamification\'s boost dropped after about four weeks as the novelty wore off, then partly recovered as students got used to it.',
    answer: 'One question set plays in many different games and modes, and themes change the look, so something new is always one tap away while the content stays the same.',
    sources: [{ cite: 'Rodrigues et al. (2022). International Journal of Educational Technology in Higher Education.', url: 'https://doi.org/10.1186/s41239-021-00314-6' }],
  },
  {
    title: 'Every move is real practice',
    risk: 'Points can reward doing more, not thinking more',
    found: 'Points and leaderboards made people do more of a task but did not raise their own interest or sense of skill.',
    answer: 'In Gamify the thing that earns the next move is answering a real question, so more play means more practice. A guessing check pauses fast random taps with a calm break.',
    sources: [{ cite: 'Mekler, Brühlmann, Tuch & Opwis (2017). Computers in Human Behavior.', url: 'https://edoc.unibas.ch/32047/' }],
  },
];

export const WONT_CLAIM = [
  'That Gamify is proven to raise test scores. We have no outcome data of our own yet.',
  'That Gamify helps, treats or improves ADHD, autism or any other condition. Our access features help students take part; they are not treatment.',
  'Brain-chemistry promises. Games build anticipation and curiosity, which research links to memory; that is as far as the evidence goes.',
  'The biggest number from any single study. We quote the range most studies agree on.',
];

// The beta tab: Gamify's beginning stages, piloting with real classrooms.
export const BETA_DOING = [
  { step: 'Building with teachers', text: 'Gamify is brand new. We are building it alongside classroom teachers, and every game, setting and report gets better from what they tell us.' },
  { step: 'Piloting in classrooms', text: 'A small group of beta classrooms plays Gamify every week. Teachers fill out short surveys, and students give anonymous picture check-ins after games.' },
  { step: 'Measuring what matters', text: 'Reports already show how each question went and how much students remembered a week later. In the pilot, teachers compare quiz results on content practiced in Gamify with content taught the usual way.' },
  { step: 'Sharing what we learn', text: 'We will publish what the pilot shows, good and bad, and later work with a university partner on a full comparison study.' },
];
