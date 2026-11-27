import NewPasswordGate from './auth/NewPasswordGate';
import FreeCleanup from './data/freeCleanup';
import { Suspense, useEffect, useState } from 'react';
import Loading from './ui/Loading';
import Breadcrumbs from './ui/Breadcrumbs';
import { lazyPage } from './lib/lazyPage';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from './ui/useReducedMotion';
import NavBar from './ui/NavBar';
import Home from './student/Home';
import { SettingsProvider } from './settings/SettingsContext';
import MotionRoot from './ui/motion/MotionRoot';
import PublicHome from './public/PublicHome';
import LoginPage from './public/LoginPage';
import JoinPage from './public/JoinPage';
import NotFoundPage from './public/NotFoundPage';

import { RequireGame, RequireSignIn, RequireTeacher } from './public/SignInGate';
import { SessionSupports } from './student/session';
import UiSounds from './ui/UiSounds';
import { useSettings } from './settings/SettingsContext';
import { pageTitle } from './ui/pageTitle';
import { UpgradeHost } from './billing/Upgrade';
import { getLive } from './live/session';
import { t } from './i18n';

// Pages load when first opened, so the first screen arrives fast on older
// iPads and school networks.
import TeacherFooter from './ui/TeacherFooter';
import { PreviewBanner } from './owner/DevCards';
import ErrorBoundary from './ui/ErrorBoundary';
import HoverTips from './ui/HoverTips';
const QuestionSetsPage = lazyPage(() => import('./teacher/QuestionSetsPage'));
const TeacherTimePage = lazyPage(() => import('./student/TeacherTimePage'));
const ChoosePage = lazyPage(() => import('./student/ChoosePage'));
const ActivityPage = lazyPage(() => import('./teacher/ActivityPage'));
const TeacherGamesPage = lazyPage(() => import('./teacher/GamesPage'));
const SetEditorPage = lazyPage(() => import('./teacher/SetEditorPage'));
const ImportPage = lazyPage(() => import('./teacher/ImportPage'));
const StarQuiz = lazyPage(() => import('./games/practice/StarQuiz'));
const Territory = lazyPage(() => import('./games/territory/Territory'));
const GameShow = lazyPage(() => import('./games/game-show/GameShow'));
const MatchThree = lazyPage(() => import('./games/match-three/MatchThree'));
const FourInARow = lazyPage(() => import('./games/four-in-a-row/FourInARow'));
const CastCatch = lazyPage(() => import('./games/cast-catch/CastCatch'));
const MemoryMatch = lazyPage(() => import('./games/memory-match/MemoryMatch'));
const Flashcards = lazyPage(() => import('./games/flashcards/Flashcards'));
const MatchUp = lazyPage(() => import('./games/match-up/MatchUp'));
const Pinball = lazyPage(() => import('./games/pinball/Pinball'));
const CastleQuest = lazyPage(() => import('./games/castle-quest/CastleQuest'));
const BubblePop = lazyPage(() => import('./games/bubble-pop/BubblePop'));
const Bowling = lazyPage(() => import('./games/bowling/Bowling'));
const RoadHop = lazyPage(() => import('./games/road-hop/RoadHop'));
const LunchRush = lazyPage(() => import('./games/lunch-rush/LunchRush'));
const FarmGrow = lazyPage(() => import('./games/farm-grow/FarmGrow'));
// The Game Lab (preview only, teacher 2026-11-22): not linked from the main site.
const BrandPage = lazyPage(() => import('./brand/BrandPage'));
const ThemeBuilderPage = lazyPage(() => import('./theme/builder/ThemeBuilderPage'));
const TemplatePage = lazyPage(() => import('./theme/builder/TemplatePage'));
const OwnerPage = lazyPage(() => import('./owner/OwnerPage'));
const FeaturesPage = lazyPage(() => import('./public/FeaturesPage'));
const ThemesPage = lazyPage(() => import('./public/ThemesPage'));
const ChallengePage = lazyPage(() => import('./public/ChallengePage'));
const ChallengeMonthPage = lazyPage(() => import('./public/ChallengeMonthPage'));
const BetaPage = lazyPage(() => import('./public/BetaPage'));
const BetaApplyPage = lazyPage(() => import('./public/BetaApplyPage'));
const AffiliatesPage = lazyPage(() => import('./public/AffiliatesPage'));
const RefLink = lazyPage(() => import('./affiliate/RefLink'));
const DeviceCheckPage = lazyPage(() => import('./public/DeviceCheckPage'));
const PermissionSlip = lazyPage(() => import('./public/PermissionSlip'));
const ConformanceReport = lazyPage(() => import('./public/ConformanceReport'));
const StatusPage = lazyPage(() => import('./public/StatusPage'));
const MirrorPage = lazyPage(() => import('./live/MirrorPage'));
const LiveHost = lazyPage(() => import('./live/LiveHost'));
const LiveLobby = lazyPage(() => import('./live/LiveStudent'));
const LiveOverlay = lazyPage(() => import('./live/LiveStudent').then((m) => ({ default: m.LiveOverlay })));
const SchoolsPage = lazyPage(() => import('./public/AudiencePages').then((m) => ({ default: m.SchoolsPage })));
const HomeschoolPage = lazyPage(() => import('./public/AudiencePages').then((m) => ({ default: m.HomeschoolPage })));
const StudentDataPage = lazyPage(() => import('./public/AudiencePages').then((m) => ({ default: m.StudentDataPage })));
const PricingPage = lazyPage(() => import('./public/PricingPage'));
const PurchaseOrderPage = lazyPage(() => import('./public/PurchaseOrderPage'));
const CodeScreen = lazyPage(() => import('./public/CodeScreen'));
const ClassesPage = lazyPage(() => import('./teacher/ClassesPage'));
const ClassPage = lazyPage(() => import('./teacher/ClassPage'));
const ReportsPage = lazyPage(() => import('./teacher/ReportsPage'));
const ReportPrintPage = lazyPage(() => import('./teacher/ReportPrintPage'));
const StudentPage = lazyPage(() => import('./teacher/StudentPage'));
const AccountPage = lazyPage(() => import('./teacher/AccountPage'));
const CheckInPage = lazyPage(() => import('./beta/CheckInPage'));
const DesignPage = lazyPage(() => import('./student/DesignPage'));
const ResearchPage = lazyPage(() => import('./public/ResearchPage'));
const BetaKitPage = lazyPage(() => import('./public/BetaKitPage'));
const PrivacyPage = lazyPage(() => import('./public/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazyPage(() => import('./public/LegalPages').then((m) => ({ default: m.TermsPage })));
const AccessibilityPage = lazyPage(() => import('./public/LegalPages').then((m) => ({ default: m.AccessibilityPage })));
const CreditsPage = lazyPage(() => import('./public/LegalPages').then((m) => ({ default: m.CreditsPage })));
const WaysList = lazyPage(() => import('./public/WaysPage').then((m) => ({ default: m.WaysList })));
const WaysPost = lazyPage(() => import('./public/WaysPage').then((m) => ({ default: m.WaysPost })));
const HowToPlayPage = lazyPage(() => import('./public/HowToPlayPage'));
const ThemeGuidePage = lazyPage(() => import('./public/ThemeGuide').then((m) => ({ default: m.ThemeGuidePage })));
const TeacherHome = lazyPage(() => import('./teacher/TeacherHome'));
const AchievementsPage = lazyPage(() => import('./teacher/AchievementsPage'));
const WelcomePage = lazyPage(() => import('./teacher/WelcomePage'));
const HelpPage = lazyPage(() => import('./public/InfoPages').then((m) => ({ default: m.HelpPage })));
const ItPage = lazyPage(() => import('./public/InfoPages').then((m) => ({ default: m.ItPage })));

// The FAQ lives on the Help page now (owner 2026-11-26: "merge faq and help
// how to to just help"): old /faq links land on its Quick answers, keeping
// the reader's group (?for=schools and so on).
function FaqRedirect() {
  const { search } = useLocation();
  return <Navigate to={`/help${search}#faq`} replace />;
}

function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useEffect(() => { document.title = pageTitle(location.pathname); }, [location.pathname]);
  // Teacher pages stand on Cream (approved portal Shell); the live big screen keeps its own look.
  useEffect(() => {
    const teacher = location.pathname.startsWith('/teacher') && !location.pathname.startsWith('/teacher/live');
    if (teacher) document.documentElement.dataset.area = 'teacher'; else delete document.documentElement.dataset.area;
  }, [location.pathname]);

  return (
    <>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="route-shell flex-1"
      >
        <Breadcrumbs />
        <ErrorBoundary>
        <Suspense fallback={<Loading />}>
        <Routes location={location}>
          <Route path="/" element={<PublicHome />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/challenge/permission" element={<PermissionSlip />} />
          <Route path="/challenge/:tag" element={<ChallengeMonthPage />} />
          <Route path="/accessibility/report" element={<ConformanceReport />} />
          <Route path="/status" element={<StatusPage />} />
          <Route path="/beta" element={<BetaPage />} />
          <Route path="/beta/apply" element={<BetaApplyPage />} />
          <Route path="/affiliates" element={<AffiliatesPage />} />
          <Route path="/a/:code" element={<RefLink />} />
          <Route path="/check" element={<DeviceCheckPage />} />
          <Route path="/mirror/:code" element={<MirrorPage />} />
          <Route path="/teacher/live/:code" element={<RequireTeacher><LiveHost /></RequireTeacher>} />
          <Route path="/live/:code" element={<LiveLobby />} />
          <Route path="/faq" element={<FaqRedirect />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/homeschool" element={<HomeschoolPage />} />
          <Route path="/student-data" element={<StudentDataPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/pricing/purchase-order" element={<PurchaseOrderPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/it" element={<ItPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/help/:topic" element={<HelpPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/beta-kit" element={<BetaKitPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/blog" element={<WaysList />} />
          <Route path="/blog/:slug" element={<WaysPost />} />
          <Route path="/blog/themes/:gameId" element={<ThemeGuidePage />} />
          <Route path="/blog/how-to-play/:gameId" element={<HowToPlayPage />} />
          <Route path="/blog/themes/:gameId/print" element={<TemplatePage guide />} />
          <Route path="/ways" element={<WaysList />} />
          <Route path="/ways/:slug" element={<WaysPost />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/choose" element={<ChoosePage />} />
          <Route path="/look-up" element={<TeacherTimePage />} />
          <Route path="/join/:code" element={<JoinPage />} />
          <Route path="/show/:code" element={<RequireTeacher><CodeScreen /></RequireTeacher>} />
          <Route path="/play" element={<RequireSignIn><Home /></RequireSignIn>} />
          <Route path="/games/star-quiz" element={<RequireSignIn><RequireGame id="star-quiz"><StarQuiz /></RequireGame></RequireSignIn>} />
          <Route path="/games/territory" element={<RequireSignIn><RequireGame id="territory"><Territory /></RequireGame></RequireSignIn>} />
          <Route path="/games/castle-quest" element={<RequireSignIn><RequireGame id="castle-quest"><CastleQuest /></RequireGame></RequireSignIn>} />
          <Route path="/games/pinball" element={<RequireSignIn><RequireGame id="pinball"><Pinball /></RequireGame></RequireSignIn>} />
          {/* Peg Drop became Pinball (teacher, 2026-10-31). */}
          <Route path="/games/peg-drop" element={<Navigate to="/games/pinball" replace />} />
          {/* Old addresses from before the generic game names (2026-10-25). */}
          <Route path="/games/bakery-match" element={<Navigate to="/games/match-three" replace />} />
          <Route path="/games/space-bowling" element={<Navigate to="/games/bowling" replace />} />
          <Route path="/games/bowling" element={<RequireSignIn><RequireGame id="bowling"><Bowling /></RequireGame></RequireSignIn>} />
          <Route path="/games/road-hop" element={<RequireSignIn><RequireGame id="road-hop"><RoadHop /></RequireGame></RequireSignIn>} />
          <Route path="/games/lunch-rush" element={<RequireSignIn><RequireGame id="lunch-rush"><LunchRush /></RequireGame></RequireSignIn>} />
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/games/farm-grow" element={<RequireSignIn><RequireGame id="farm-grow"><FarmGrow /></RequireGame></RequireSignIn>} />
          <Route path="/games/bubble-pop" element={<RequireSignIn><RequireGame id="bubble-pop"><BubblePop /></RequireGame></RequireSignIn>} />
          <Route path="/games/match-up" element={<RequireSignIn><RequireGame id="match-up"><MatchUp /></RequireGame></RequireSignIn>} />
          <Route path="/games/flashcards" element={<RequireSignIn><RequireGame id="flashcards"><Flashcards /></RequireGame></RequireSignIn>} />
          <Route path="/games/memory-match" element={<RequireSignIn><RequireGame id="memory-match"><MemoryMatch /></RequireGame></RequireSignIn>} />
          <Route path="/games/cast-catch" element={<RequireSignIn><RequireGame id="cast-catch"><CastCatch /></RequireGame></RequireSignIn>} />
          <Route path="/games/game-show" element={<RequireSignIn><RequireGame id="game-show"><GameShow /></RequireGame></RequireSignIn>} />
          <Route path="/games/match-three" element={<RequireSignIn><RequireGame id="match-three"><MatchThree /></RequireGame></RequireSignIn>} />
          <Route path="/games/four-in-a-row" element={<RequireSignIn><RequireGame id="four-in-a-row"><FourInARow /></RequireGame></RequireSignIn>} />
          <Route path="/teacher" element={<RequireTeacher><TeacherHome /></RequireTeacher>} />
          <Route path="/teacher/welcome" element={<RequireTeacher><WelcomePage /></RequireTeacher>} />
          <Route path="/teacher/activity" element={<RequireTeacher><ActivityPage /></RequireTeacher>} />
          <Route path="/teacher/games" element={<RequireTeacher><TeacherGamesPage /></RequireTeacher>} />
          <Route path="/teacher/sets" element={<RequireTeacher><QuestionSetsPage /></RequireTeacher>} />
          <Route path="/teacher/sets/import" element={<RequireTeacher><ImportPage /></RequireTeacher>} />
          <Route path="/teacher/sets/:id" element={<RequireTeacher><SetEditorPage /></RequireTeacher>} />
          <Route path="/teacher/library/:id" element={<RequireTeacher><SetEditorPage library /></RequireTeacher>} />
          <Route path="/teacher/themes" element={<RequireTeacher><ThemeBuilderPage /></RequireTeacher>} />
          <Route path="/teacher/themes/:gameId" element={<RequireTeacher><ThemeBuilderPage /></RequireTeacher>} />
          <Route path="/teacher/themes/:gameId/template" element={<RequireTeacher><TemplatePage /></RequireTeacher>} />
          <Route path="/teacher/achievements" element={<RequireTeacher><AchievementsPage /></RequireTeacher>} />
          <Route path="/teacher/account" element={<RequireTeacher><AccountPage /></RequireTeacher>} />
          <Route path="/teacher/reports" element={<RequireTeacher><ReportsPage /></RequireTeacher>} />
          <Route path="/teacher/reports/print" element={<RequireTeacher><ReportPrintPage /></RequireTeacher>} />
          <Route path="/teacher/classes" element={<RequireTeacher><ClassesPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:id" element={<RequireTeacher><ClassPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:id/students/:sid" element={<RequireTeacher><StudentPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:id/check-in" element={<RequireTeacher><CheckInPage /></RequireTeacher>} />
          {/* No open Arcade: students reach games only with a code (teacher, 2026-10-31). */}
          <Route path="/arcade" element={<Navigate to="/join" replace />} />
          <Route path="/arcade/design" element={<DesignPage />} />
          <Route path="/arcade/:classId" element={<Navigate to="/join" replace />} />
          <Route path="/owner" element={<OwnerPage />} />
          <Route path="/owner/line" element={<Navigate to="/owner" replace />} />
          <Route path="/owner/themes" element={<ThemeBuilderPage owner />} />
          <Route path="/owner/themes/:gameId" element={<ThemeBuilderPage owner />} />
          {/* Every unknown address (teacher, 2026-11-24: the 404 page). */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
        </Suspense>
        </ErrorBoundary>
      </motion.div>
    </AnimatePresence>
    {/* Full-screen tools (live games, a game's Theme Builder) have no footer, so nothing scrolls (teacher, 2026-10-31). */}
    {location.pathname.startsWith('/teacher') && !location.pathname.startsWith('/teacher/live') && !/^\/teacher\/themes\/[^/]+\/?$/.test(location.pathname) && !location.pathname.endsWith('/check-in') && location.pathname !== '/teacher/welcome' && <TeacherFooter />}
    <UpgradeHost />
    <LiveLayer />
    </>
  );
}

// Fixed, pointer-events-none decorative layer -- a soft purple marble/swirl
// texture behind the whole app, matching the "sticker" style mockups.
// New direction palette (teacher, 2026-11-24): the Lavender ground.
// Procedural (SVG feTurbulence displacement of layered blobs), not
// hand-authored path data, per the no-hand-rolled-decorative-SVG rule.
// Fixed positioning means it never repaints as the page scrolls.
const SWIRL_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="800">
  <filter id="marble">
    <feTurbulence type="fractalNoise" baseFrequency="0.008 0.012" numOctaves="3" seed="7" result="noise" />
    <feDisplacementMap in="SourceGraphic" in2="noise" scale="140" xChannelSelector="R" yChannelSelector="G" />
  </filter>
  <g filter="url(#marble)">
    <rect width="800" height="800" fill="#ddd6ff" />
    <circle cx="150" cy="150" r="180" fill="#eae5ff" />
    <circle cx="650" cy="220" r="220" fill="#c9bffb" />
    <circle cx="300" cy="600" r="240" fill="#eae5ff" />
    <circle cx="700" cy="700" r="180" fill="#c9bffb" />
  </g>
</svg>
`);

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="ambient-ground no-print fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: `url("data:image/svg+xml,${SWIRL_SVG}")`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

function Supports() {
  const { setOverrides } = useSettings();
  return <SessionSupports setOverrides={setOverrides} />;
}

// Recorded sounds load on the first tap (iPads only allow audio after one).
if (typeof window !== 'undefined') window.addEventListener('pointerdown', () => { void import('./engine/feedback').then((m) => m.preloadSounds()); }, { once: true });

export default function App() {
  return (
    <SettingsProvider>
    <MotionRoot>
    <BrowserRouter>
      <div className="min-h-dvh relative text-text font-body flex flex-col">
        <AmbientBackground />
        <a href="#main-content" className="skip-link">{t('a11y.skip')}</a>
        <NavBar />
        <Supports />
        <PreviewBanner />
        <NewPasswordGate />
        <HoverTips />
        <UiSounds />
        <FreeCleanup />
        <div id="main-content" tabIndex={-1} className="outline-none flex-1 flex flex-col">
          <AnimatedRoutes />
        </div>
      </div>
    </BrowserRouter>
    </MotionRoot>
    </SettingsProvider>
  );
}

// Over every game while this tab is in a live game: the teacher's lock,
// pause and podium (not on the lobby or teacher pages).
function LiveLayer() {
  const path = useLocation().pathname;
  const [on, setOn] = useState(() => !!getLive());
  useEffect(() => { const f = () => setOn(!!getLive()); window.addEventListener('gamify-live', f); return () => window.removeEventListener('gamify-live', f); }, []);
  if (!on || path.startsWith('/live/') || path.startsWith('/teacher')) return null;
  return <Suspense fallback={null}><LiveOverlay /></Suspense>;
}
