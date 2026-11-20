import { createContext, useContext, type CSSProperties } from 'react';

// The background the game's theme wears, handed to the question screen
// (teacher, 2026-11-20: "all question screens should look like this with the
// themes background replacing this one -- apply universaly"): every question
// is the framed box, set on the theme's own background.
export const StageBackdrop = createContext<CSSProperties | null>(null);
export const useStageBackdrop = () => useContext(StageBackdrop);
