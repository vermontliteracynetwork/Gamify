import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import NavBar from './components/NavBar';
import Home from './Home';
import PlinkOhGame from './games/plink-oh/PlinkOhGame';

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
          <Route path="/games/plink-oh" element={<PlinkOhGame />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

// Fixed, pointer-events-none decorative layer -- a faint peg-dot grid plus
// two soft glows. Tall/short screens previously left a huge flat black void
// below short content (setup forms, single-game home), which read as
// unfinished rather than intentional. Fixed positioning means it never
// repaints as the page scrolls (Section 6.E DOM-cost guidance).
function AmbientBackground() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{
        backgroundColor: 'var(--color-bg)',
        backgroundImage: `
          radial-gradient(circle at 15% 8%, rgba(247,201,72,0.10), transparent 40%),
          radial-gradient(circle at 85% 92%, rgba(77,159,236,0.10), transparent 42%),
          radial-gradient(circle at 1px 1px, rgba(147,166,214,0.16) 1px, transparent 0)
        `,
        backgroundSize: 'auto, auto, 28px 28px',
      }}
    />
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-dvh relative text-text font-body">
        <AmbientBackground />
        <NavBar />
        <AnimatedRoutes />
      </div>
    </BrowserRouter>
  );
}
