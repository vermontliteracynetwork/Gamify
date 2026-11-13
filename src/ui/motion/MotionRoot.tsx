import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';
import { useSettings } from '../../settings/SettingsContext';

// The app-wide safety net for Motion (motion.dev). With the Motion setting on
// Still, every motion component drops movement (opacity fades stay) even if
// its author forgot useReducedMotion. Gentle keeps movement; the
// components themselves soften it (docs/ui-libraries.md).
export default function MotionRoot({ children }: { children: ReactNode }) {
  const still = useSettings().settings.motion === 'still';
  return <MotionConfig reducedMotion={still ? 'always' : 'never'}>{children}</MotionConfig>;
}
