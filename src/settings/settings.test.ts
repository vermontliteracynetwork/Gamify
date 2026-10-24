import { describe, expect, it } from 'vitest';
import { applyCalm, DEFAULT_SETTINGS, initialSettings, PRESETS, volume, withDefaults } from './settings';

describe('settings', () => {
  it('calm mode quiets motion, music and celebrations', () => {
    const calm = applyCalm(DEFAULT_SETTINGS, true);
    expect(calm).toMatchObject({ calm: true, motion: 'still', celebrations: 'small', backgrounds: 'plain', music: 0, timers: 'off' });
    expect(calm.effects).toBeLessThanOrEqual(2);
  });
  it('starts calm when the device asks for reduced motion', () => expect(initialSettings(true).calm).toBe(true));
  it('all sound off silences every channel', () => {
    const s = { ...DEFAULT_SETTINGS, allSoundOff: true };
    expect([volume(s, 'effects'), volume(s, 'music'), volume(s, 'voice')]).toEqual([0, 0, 0]);
  });
  it('levels map to 0..1', () => expect(volume({ ...DEFAULT_SETTINGS, effects: 5 }, 'effects')).toBe(1));
  it('low vision preset enlarges text and raises contrast', () => expect(PRESETS['low-vision'](DEFAULT_SETTINGS)).toMatchObject({ textSize: 'larger', highContrast: true }));
  it('old saved settings get new defaults', () => expect(withDefaults({ effects: 1 })).toEqual({ ...DEFAULT_SETTINGS, effects: 1 }));
});
