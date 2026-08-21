// Minimal procedural sound effects (no audio assets) gated by the Sounds
// option. "Music" is stored as a setting but has no track to play yet --
// background music is out of scope for this prototype.
let ctx = null;
function getCtx() {
  if (!ctx) {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    ctx = new AudioCtx();
  }
  return ctx;
}

const LEVEL_GAIN = { off: 0, low: 0.05, med: 0.12, high: 0.22 };

const TONES = {
  correct: [660, 880],
  incorrect: [220, 160],
  drop: [440],
  win: [523, 659, 784],
};

export function playSound(name, level) {
  const gain = LEVEL_GAIN[level] ?? 0;
  if (gain <= 0) return;
  const audioCtx = getCtx();
  if (!audioCtx) return;
  const freqs = TONES[name] || [440];
  freqs.forEach((freq, i) => {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.frequency.value = freq;
    osc.type = 'sine';
    g.gain.value = gain;
    osc.connect(g).connect(audioCtx.destination);
    const start = audioCtx.currentTime + i * 0.09;
    osc.start(start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.stop(start + 0.2);
  });
}
