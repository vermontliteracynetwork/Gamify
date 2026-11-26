import { describe, expect, it } from 'vitest';
import { BETA_ASKS, applicationText, emptyApplication, problems, readApplication, scoreApplication, stepProblems } from './application';

const full = () => ({
  ...emptyApplication(), name: 'Ms. Rivera', email: 'rivera@school.org', school: 'Lincoln Elementary', state: 'Vermont', grades: ['K-2'],
  devices: ['tablets'], often: '3+', games: ['Bubble Pop'], asks: BETA_ASKS.map((a) => a.key), reason: 'My first graders love games and I want to help shape one that teaches reading well.', agree: true,
});
const labels = { role: 'Classroom teacher', devices: ['iPads or tablets'], often: '3 or more times a week' };

describe('beta application', () => {
  it('needs every required field, step by step', () => {
    const a = emptyApplication();
    expect(stepProblems(a, 0)).toEqual(['name', 'email', 'school', 'state', 'grades']);
    expect(stepProblems(a, 1)).toEqual(['devices', 'often']);
    expect(stepProblems(a, 2)).toEqual(['asks', 'reason', 'agree']);
    expect(problems(full())).toEqual([]);
    expect(problems({ ...full(), asks: ['setup'] })).toEqual(['asks']);
    expect(problems({ ...full(), reason: 'Fun!' })).toEqual(['reason']);
  });
  it('sends readable text under 1000 characters, and reads it back', () => {
    const text = applicationText({ ...full(), reason: 'x'.repeat(2000), network: 'y'.repeat(500) }, labels);
    expect(text.length).toBeLessThanOrEqual(1000);
    const f = readApplication(text)!;
    expect(f['Name']).toBe('Ms. Rivera');
    expect(f['Commitments']).toBe(`${BETA_ASKS.length}/${BETA_ASKS.length}, agreed`);
    expect(f['Why'].length).toBeGreaterThan(400);
    expect(readApplication('Beta test request: old one-line form')).toBeNull();
  });
  it('scores follow-through signals without rejecting anyone', () => {
    const strong = scoreApplication(readApplication(applicationText({ ...full(), reason: 'a'.repeat(130) }, labels))!);
    expect(strong.points).toBe(5);
    const light = scoreApplication(readApplication(applicationText({ ...full(), email: 'r@gmail.com', games: [], often: '1-2' }, { ...labels, often: '1 to 2 times a week' }))!);
    expect(light.points).toBe(1);
    const home = scoreApplication(readApplication(applicationText({ ...full(), email: 'r@gmail.com' }, { ...labels, role: 'Homeschool parent' }))!);
    expect(home.signals.find((s) => s.key === 'email')!.ok).toBe(true);
  });
});
