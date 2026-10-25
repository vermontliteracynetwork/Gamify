import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { setLanguage } from '../i18n';
import { data } from '../data';
import { initialSettings, withDefaults, type PlayerSettings } from './settings';

const KEY = 'player-settings';

interface Ctx {
  settings: PlayerSettings;
  update: (next: PlayerSettings) => void;
  // A signed-in student's teacher-set accommodations, laid over the saved
  // settings while they play (never saved over the device's own settings).
  setOverrides: (o: Partial<PlayerSettings>) => void;
}
const SettingsContext = createContext<Ctx | null>(null);

const reducedMotion = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [saved, setSettings] = useState<PlayerSettings>(() => initialSettings(reducedMotion()));
  const [overrides, setOverrides] = useState<Partial<PlayerSettings>>({});
  const settings = useMemo(() => ({ ...saved, ...overrides }), [saved, overrides]);

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
  // The chosen language for every menu; the app redraws in it (App keys on it).
  setLanguage(settings.language);
  useEffect(() => { document.documentElement.lang = settings.language; }, [settings.language]);

  function update(next: PlayerSettings) {
    const own = { ...next };
    for (const k of Object.keys(overrides) as (keyof PlayerSettings)[]) (own as Record<string, unknown>)[k] = saved[k];
    setSettings(own);
    data.setSetting(KEY, own);
  }
  return <SettingsContext.Provider value={{ settings, update, setOverrides }}>{children}</SettingsContext.Provider>;
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings needs <SettingsProvider>');
  return ctx;
}
