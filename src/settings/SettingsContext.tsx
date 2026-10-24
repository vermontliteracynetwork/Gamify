import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { data } from '../data';
import { initialSettings, withDefaults, type PlayerSettings } from './settings';

const KEY = 'player-settings';

interface Ctx { settings: PlayerSettings; update: (next: PlayerSettings) => void }
const SettingsContext = createContext<Ctx | null>(null);

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PlayerSettings>(() => initialSettings(reducedMotion()));

  useEffect(() => {
    data.getSetting<Partial<PlayerSettings>>(KEY).then((saved) => { if (saved) setSettings(withDefaults(saved)); });
  }, []);

  // Page-wide effects read by CSS in index.css (text size, contrast, motion...).
  useEffect(() => {
    const root = document.documentElement.dataset;
    root.textSize = settings.textSize;
    root.motion = settings.motion;
    root.contrast = settings.highContrast ? 'high' : 'normal';
    root.comfort = settings.readingComfort ? 'on' : 'off';
    root.dim = settings.dim ? 'on' : 'off';
    root.hand = settings.leftHanded ? 'left' : 'right';
  }, [settings]);

  function update(next: PlayerSettings) {
    setSettings(next);
    data.setSetting(KEY, next);
  }
  return <SettingsContext.Provider value={{ settings, update }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings needs <SettingsProvider>');
  return ctx;
}
