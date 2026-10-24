// Player settings (product plan 4A). They follow the student across every
// game. Teachers can set defaults and lock items (locks applied in Stage 4).

export type Level = 0 | 1 | 2 | 3 | 4 | 5; // 0 = off
export type Motion = 'full' | 'gentle' | 'still';
export type Celebrations = 'big' | 'small' | 'off';
export type Backgrounds = 'moving' | 'still' | 'plain';
export type TextSize = 'normal' | 'large' | 'larger';
export type Timers = 'off' | 'relaxed' | 'normal';
export type Speed = 'slow' | 'normal' | 'fast';

export interface PlayerSettings {
  allSoundOff: boolean;
  effects: Level;
  music: Level;
  voice: Level;
  voiceRate: Speed;
  haptics: boolean;
  calm: boolean;
  motion: Motion;
  celebrations: Celebrations;
  backgrounds: Backgrounds;
  screenShake: boolean;
  dim: boolean;
  textSize: TextSize;
  readingComfort: boolean;
  highContrast: boolean;
  colorSafe: boolean;
  timers: Timers;
  gameSpeed: Speed;
  readFirstSeconds: 0 | 3 | 5;
  tapOnly: boolean;
  leftHanded: boolean;
  language: 'en';
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  allSoundOff: false,
  effects: 3,
  music: 1,
  voice: 4,
  voiceRate: 'normal',
  haptics: true,
  calm: false,
  motion: 'full',
  celebrations: 'big',
  backgrounds: 'moving',
  screenShake: false,
  dim: false,
  textSize: 'normal',
  readingComfort: false,
  highContrast: false,
  colorSafe: false,
  timers: 'relaxed',
  gameSpeed: 'normal',
  readFirstSeconds: 3,
  tapOnly: false,
  leftHanded: false,
  language: 'en',
};

// One tap Calm mode: everything soothing at once, still adjustable after.
export function applyCalm(s: PlayerSettings, on: boolean): PlayerSettings {
  return on
    ? { ...s, calm: true, motion: 'still', celebrations: 'small', backgrounds: 'plain', screenShake: false, music: 0, effects: Math.min(s.effects, 2) as Level, timers: 'off' }
    : { ...s, calm: false, motion: 'full', celebrations: 'big', backgrounds: 'moving' };
}

export type PresetId = 'calm' | 'low-vision' | 'hearing' | 'quick-start';

export const PRESETS: Record<PresetId, (s: PlayerSettings) => PlayerSettings> = {
  calm: (s) => applyCalm(s, true),
  'low-vision': (s) => ({ ...s, textSize: 'larger', highContrast: true, readingComfort: true, voice: 5, colorSafe: true }),
  hearing: (s) => ({ ...s, allSoundOff: true, haptics: true }),
  'quick-start': () => ({ ...DEFAULT_SETTINGS }),
};

// Starting settings for a new player: respects the iPad's own Reduce Motion.
export function initialSettings(prefersReducedMotion: boolean): PlayerSettings {
  return prefersReducedMotion ? applyCalm(DEFAULT_SETTINGS, true) : { ...DEFAULT_SETTINGS };
}

// Loudness 0..1 for a sound channel, after the all-off switch.
export function volume(s: PlayerSettings, channel: 'effects' | 'music' | 'voice'): number {
  return s.allSoundOff ? 0 : s[channel] / 5;
}

// Settings saved before new fields existed still load with defaults.
export function withDefaults(saved: Partial<PlayerSettings> | undefined): PlayerSettings {
  return { ...DEFAULT_SETTINGS, ...(saved ?? {}) };
}
