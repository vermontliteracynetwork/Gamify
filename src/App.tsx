import { lazy, Suspense, useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NavBar from './ui/NavBar';
import Home from './student/Home';
import { SettingsProvider } from './settings/SettingsContext';
import PublicHome from './public/PublicHome';
import LoginPage from './public/LoginPage';
import JoinPage from './public/JoinPage';

import { RequireGame, RequireSignIn, RequireTeacher } from './public/SignInGate';
import { Arcade, ArcadeSignIn } from './student/ArcadePage';
import { SessionSupports } from './student/session';
import { useSettings } from './settings/SettingsContext';
import { pageTitle } from './ui/pageTitle';
import { UpgradeHost } from './billing/Upgrade';
import { getLive } from './live/session';
import { t } from './i18n';

// Pages load when first opened, so the first screen arrives fast on older
// iPads and school networks.
const QuestionSetsPage = lazy(() => import('./teacher/QuestionSetsPage'));
const SetEditorPage = lazy(() => import('./teacher/SetEditorPage'));
const ImportPage = lazy(() => import('./teacher/ImportPage'));
const StarQuiz = lazy(() => import('./games/practice/StarQuiz'));
const GameShow = lazy(() => import('./games/game-show/GameShow'));
const MatchThree = lazy(() => import('./games/match-three/MatchThree'));
const FourInARow = lazy(() => import('./games/four-in-a-row/FourInARow'));
const CastCatch = lazy(() => import('./games/cast-catch/CastCatch'));
const MemoryMatch = lazy(() => import('./games/memory-match/MemoryMatch'));
const Flashcards = lazy(() => import('./games/flashcards/Flashcards'));
const MatchUp = lazy(() => import('./games/match-up/MatchUp'));
const PegDrop = lazy(() => import('./games/peg-drop/PegDrop'));
const BubblePop = lazy(() => import('./games/bubble-pop/BubblePop'));
const Bowling = lazy(() => import('./games/bowling/Bowling'));
const RoadHop = lazy(() => import('./games/road-hop/RoadHop'));
const LunchRush = lazy(() => import('./games/lunch-rush/LunchRush'));
const ThemeBuilderPage = lazy(() => import('./theme/builder/ThemeBuilderPage'));
const TemplatePage = lazy(() => import('./theme/builder/TemplatePage'));
const OwnerPage = lazy(() => import('./owner/OwnerPage'));
const FeaturesPage = lazy(() => import('./public/FeaturesPage'));
const ThemesPage = lazy(() => import('./public/ThemesPage'));
const ChallengePage = lazy(() => import('./public/ChallengePage'));
const BetaPage = lazy(() => import('./public/BetaPage'));
const DeviceCheckPage = lazy(() => import('./public/DeviceCheckPage'));
const MirrorPage = lazy(() => import('./live/MirrorPage'));
const LiveHost = lazy(() => import('./live/LiveHost'));
const LiveLobby = lazy(() => import('./live/LiveStudent'));
const LiveOverlay = lazy(() => import('./live/LiveStudent').then((m) => ({ default: m.LiveOverlay })));
const FaqPage = lazy(() => import('./public/FaqPage'));
const SchoolsPage = lazy(() => import('./public/AudiencePages').then((m) => ({ default: m.SchoolsPage })));
const HomeschoolPage = lazy(() => import('./public/AudiencePages').then((m) => ({ default: m.HomeschoolPage })));
const StudentDataPage = lazy(() => import('./public/AudiencePages').then((m) => ({ default: m.StudentDataPage })));
const PricingPage = lazy(() => import('./public/PricingPage'));
const CodeScreen = lazy(() => import('./public/CodeScreen'));
const ClassesPage = lazy(() => import('./teacher/ClassesPage'));
const ClassPage = lazy(() => import('./teacher/ClassPage'));
const ReportsPage = lazy(() => import('./teacher/ReportsPage'));
const AccountPage = lazy(() => import('./teacher/AccountPage'));
const CheckInPage = lazy(() => import('./beta/CheckInPage'));
const DesignPage = lazy(() => import('./student/DesignPage'));
const ResearchPage = lazy(() => import('./public/ResearchPage'));
const BetaKitPage = lazy(() => import('./public/BetaKitPage'));
const PrivacyPage = lazy(() => import('./public/LegalPages').then((m) => ({ default: m.PrivacyPage })));
const TermsPage = lazy(() => import('./public/LegalPages').then((m) => ({ default: m.TermsPage })));
const AccessibilityPage = lazy(() => import('./public/LegalPages').then((m) => ({ default: m.AccessibilityPage })));
const CreditsPage = lazy(() => import('./public/LegalPages').then((m) => ({ default: m.CreditsPage })));
const WaysList = lazy(() => import('./public/WaysPage').then((m) => ({ default: m.WaysList })));
const WaysPost = lazy(() => import('./public/WaysPage').then((m) => ({ default: m.WaysPost })));
const HelpPage = lazy(() => import('./public/InfoPages').then((m) => ({ default: m.HelpPage })));
const ItPage = lazy(() => import('./public/InfoPages').then((m) => ({ default: m.ItPage })));

function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();
  useEffect(() => { document.title = pageTitle(location.pathname); }, [location.pathname]);

  return (
    <>
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Suspense fallback={<div className="min-h-[60dvh]" aria-busy="true" />}>
        <Routes location={location}>
          <Route path="/" element={<PublicHome />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/themes" element={<ThemesPage />} />
          <Route path="/challenge" element={<ChallengePage />} />
          <Route path="/beta" element={<BetaPage />} />
          <Route path="/check" element={<DeviceCheckPage />} />
          <Route path="/mirror/:code" element={<MirrorPage />} />
          <Route path="/teacher/live/:code" element={<RequireTeacher><LiveHost /></RequireTeacher>} />
          <Route path="/live/:code" element={<LiveLobby />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/schools" element={<SchoolsPage />} />
          <Route path="/homeschool" element={<HomeschoolPage />} />
          <Route path="/student-data" element={<StudentDataPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/it" element={<ItPage />} />
          <Route path="/help" element={<HelpPage />} />
          <Route path="/research" element={<ResearchPage />} />
          <Route path="/beta-kit" element={<BetaKitPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/accessibility" element={<AccessibilityPage />} />
          <Route path="/credits" element={<CreditsPage />} />
          <Route path="/blog" element={<WaysList />} />
          <Route path="/blog/:slug" element={<WaysPost />} />
          <Route path="/ways" element={<WaysList />} />
          <Route path="/ways/:slug" element={<WaysPost />} />
          <Route path="/join" element={<JoinPage />} />
          <Route path="/join/:code" element={<JoinPage />} />
          <Route path="/show/:code" element={<RequireTeacher><CodeScreen /></RequireTeacher>} />
          <Route path="/play" element={<RequireSignIn><Home /></RequireSignIn>} />
          <Route path="/games/star-quiz" element={<RequireSignIn><RequireGame id="star-quiz"><StarQuiz /></RequireGame></RequireSignIn>} />
          <Route path="/games/peg-drop" element={<RequireSignIn><RequireGame id="peg-drop"><PegDrop /></RequireGame></RequireSignIn>} />
          {/* Old addresses from before the generic game names (2026-10-25). */}
          <Route path="/games/bakery-match" element={<Navigate to="/games/match-three" replace />} />
          <Route path="/games/space-bowling" element={<Navigate to="/games/bowling" replace />} />
          <Route path="/games/bowling" element={<RequireSignIn><RequireGame id="bowling"><Bowling /></RequireGame></RequireSignIn>} />
          <Route path="/games/road-hop" element={<RequireSignIn><RequireGame id="road-hop"><RoadHop /></RequireGame></RequireSignIn>} />
          <Route path="/games/lunch-rush" element={<RequireSignIn><RequireGame id="lunch-rush"><LunchRush /></RequireGame></RequireSignIn>} />
          <Route path="/games/bubble-pop" element={<RequireSignIn><RequireGame id="bubble-pop"><BubblePop /></RequireGame></RequireSignIn>} />
          <Route path="/games/match-up" element={<RequireSignIn><RequireGame id="match-up"><MatchUp /></RequireGame></RequireSignIn>} />
          <Route path="/games/flashcards" element={<RequireSignIn><RequireGame id="flashcards"><Flashcards /></RequireGame></RequireSignIn>} />
          <Route path="/games/memory-match" element={<RequireSignIn><RequireGame id="memory-match"><MemoryMatch /></RequireGame></RequireSignIn>} />
          <Route path="/games/cast-catch" element={<RequireSignIn><RequireGame id="cast-catch"><CastCatch /></RequireGame></RequireSignIn>} />
          <Route path="/games/game-show" element={<RequireSignIn><RequireGame id="game-show"><GameShow /></RequireGame></RequireSignIn>} />
          <Route path="/games/match-three" element={<RequireSignIn><RequireGame id="match-three"><MatchThree /></RequireGame></RequireSignIn>} />
          <Route path="/games/four-in-a-row" element={<RequireSignIn><RequireGame id="four-in-a-row"><FourInARow /></RequireGame></RequireSignIn>} />
          <Route path="/teacher" element={<RequireTeacher><Navigate to="/teacher/classes" replace /></RequireTeacher>} />
          <Route path="/teacher/sets" element={<RequireTeacher><QuestionSetsPage /></RequireTeacher>} />
          <Route path="/teacher/sets/import" element={<RequireTeacher><ImportPage /></RequireTeacher>} />
          <Route path="/teacher/sets/:id" element={<RequireTeacher><SetEditorPage /></RequireTeacher>} />
          <Route path="/teacher/library/:id" element={<RequireTeacher><SetEditorPage library /></RequireTeacher>} />
          <Route path="/teacher/themes" element={<RequireTeacher><ThemeBuilderPage /></RequireTeacher>} />
          <Route path="/teacher/themes/:gameId" element={<RequireTeacher><ThemeBuilderPage /></RequireTeacher>} />
          <Route path="/teacher/themes/:gameId/template" element={<RequireTeacher><TemplatePage /></RequireTeacher>} />
          <Route path="/teacher/account" element={<RequireTeacher><AccountPage /></RequireTeacher>} />
          <Route path="/teacher/reports" element={<RequireTeacher><ReportsPage /></RequireTeacher>} />
          <Route path="/teacher/classes" element={<RequireTeacher><ClassesPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:id" element={<RequireTeacher><ClassPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:id/check-in" element={<RequireTeacher><CheckInPage /></RequireTeacher>} />
          <Route path="/arcade" element={<Arcade />} />
          <Route path="/arcade/design" element={<DesignPage />} />
          <Route path="/arcade/:classId" element={<ArcadeSignIn />} />
          <Route path="/owner" element={<OwnerPage />} />
          <Route path="/owner/themes" element={<ThemeBuilderPage owner />} />
          <Route path="/owner/themes/:gameId" element={<ThemeBuilderPage owner />} />
        </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
    <UpgradeHost />
    <LiveLayer />
    </>
  );
}

// Fixed, pointer-events-none decorative layer -- a soft purple marble/swirl
// texture behind the whole app, matching the "sticker" style mockups.
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
    <rect width="800" height="800" fill="#b4c4fb" />
    <circle cx="150" cy="150" r="180" fill="#c8d4fc" />
    <circle cx="650" cy="220" r="220" fill="#a3b6f7" />
    <circle cx="300" cy="600" r="240" fill="#c8d4fc" />
    <circle cx="700" cy="700" r="180" fill="#a3b6f7" />
  </g>
</svg>
`);

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="no-print fixed inset-0 -z-10 pointer-events-none"
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

export default function App() {
  return (
    <SettingsProvider>
    <BrowserRouter>
      <div className="min-h-dvh relative text-text font-body">
        <AmbientBackground />
        <a href="#main-content" className="skip-link">{t('a11y.skip')}</a>
        <NavBar />
        <Supports />
        <div id="main-content" tabIndex={-1} className="outline-none">
          <AnimatedRoutes />
        </div>
      </div>
    </BrowserRouter>
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
