import { useSettings } from '../settings/SettingsContext';

// Movement follows Gamify's own Motion setting (teacher, 2026-11-06), not the
// device's Reduce Motion switch, which only picks the starting setting.
export function useReducedMotion(): boolean {
  return useSettings().settings.motion === 'still';
}
