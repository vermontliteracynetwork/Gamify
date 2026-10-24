import { BrowserRouter, Navigate, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NavBar from './ui/NavBar';
import Home from './student/Home';
import QuestionSetsPage from './teacher/QuestionSetsPage';
import SetEditorPage from './teacher/SetEditorPage';
import ImportPage from './teacher/ImportPage';
import StarQuiz from './games/practice/StarQuiz';
import GameShow from './games/game-show/GameShow';
import BakeryMatch from './games/bakery-match/BakeryMatch';
import { SettingsProvider } from './settings/SettingsContext';

function AnimatedRoutes() {
  const location = useLocation();
  const reduce = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduce ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/games/star-quiz" element={<StarQuiz />} />
          <Route path="/games/game-show" element={<GameShow />} />
          <Route path="/games/bakery-match" element={<BakeryMatch />} />
          <Route path="/teacher" element={<Navigate to="/teacher/sets" replace />} />
          <Route path="/teacher/sets" element={<QuestionSetsPage />} />
          <Route path="/teacher/sets/import" element={<ImportPage />} />
          <Route path="/teacher/sets/:id" element={<SetEditorPage />} />
          <Route path="/teacher/library/:id" element={<SetEditorPage library />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
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
    <rect width="800" height="800" fill="#b9a9ec" />
    <circle cx="150" cy="150" r="180" fill="#cabdf2" />
    <circle cx="650" cy="220" r="220" fill="#a894e6" />
    <circle cx="300" cy="600" r="240" fill="#cabdf2" />
    <circle cx="700" cy="700" r="180" fill="#a894e6" />
  </g>
</svg>
`);

function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: `url("data:image/svg+xml,${SWIRL_SVG}")`,
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
      }}
    />
  );
}

export default function App() {
  return (
    <SettingsProvider>
    <BrowserRouter>
      <div className="min-h-dvh relative text-text font-body">
        <AmbientBackground />
        <NavBar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
    </SettingsProvider>
  );
}
