import React, { useEffect, useRef, useState, useCallback } from 'react';

const BOARD_W = 560;
const BOARD_H = 360;
const PEG_ROWS = 8;
const PEG_COLS = 11; // odd count so alternating rows stagger evenly
const TOP_MARGIN = 34;
const BOTTOM_MARGIN = 30;
const ROW_STEP_MS = 170;

function pegPositions() {
  const pegs = [];
  const colSpacing = BOARD_W / (PEG_COLS + 1);
  const rowSpacing = (BOARD_H - TOP_MARGIN - BOTTOM_MARGIN) / (PEG_ROWS + 1);
  for (let row = 0; row < PEG_ROWS; row++) {
    const offset = row % 2 === 0 ? 0 : colSpacing / 2;
    const colsInRow = row % 2 === 0 ? PEG_COLS : PEG_COLS - 1;
    for (let c = 0; c < colsInRow; c++) {
      pegs.push({
        x: colSpacing + offset + c * colSpacing,
        y: TOP_MARGIN + rowSpacing * (row + 1),
        row,
      });
    }
  }
  return pegs;
}

const PEGS = pegPositions();

// Bounce-probability bias per power-up. Each returns the chance (0-1) the
// ball steps *away* from board-center on a given row; 0.5 is a neutral
// coin-flip walk. See data.js for why these values are placeholders.
function pushOutwardChance(bias) {
  if (bias === 'straight') return 0.5; // minimal net drift, small step size handles the "almost straight" feel
  if (bias === 'center') return 0.28; // biased to step back toward center
  if (bias === 'edge') return 0.72; // biased to step away from center
  return 0.5; // no power-up active -- neutral coin-flip walk; spikes affect step *size* below, not direction
}

export default function PlinkoBoard({ dropZoneCount, buckets, spikesEnabled, activePowerUp, teamColor, onLanded, disabled }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | dropping
  const [ballX, setBallX] = useState(null);
  const [ballRow, setBallRow] = useState(0);
  const dropTimer = useRef(null);

  const draw = useCallback((animBallX, animBallY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    // board background
    ctx.fillStyle = '#1B2A57';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    // pegs
    PEGS.forEach((peg) => {
      const isSpike = spikesEnabled && peg.row % 3 === 2;
      ctx.beginPath();
      ctx.fillStyle = isSpike ? '#F0924A' : '#9FB3E0';
      if (isSpike) {
        ctx.moveTo(peg.x, peg.y - 6);
        ctx.lineTo(peg.x - 5, peg.y + 4);
        ctx.lineTo(peg.x + 5, peg.y + 4);
        ctx.closePath();
      } else {
        ctx.arc(peg.x, peg.y, 3.5, 0, Math.PI * 2);
      }
      ctx.fill();
    });

    if (animBallX != null) {
      ctx.beginPath();
      ctx.fillStyle = teamColor || '#F4C542';
      ctx.arc(animBallX, animBallY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
    }
  }, [spikesEnabled, teamColor]);

  useEffect(() => {
    draw(ballX, ballRow != null ? TOP_MARGIN + ((BOARD_H - TOP_MARGIN - BOTTOM_MARGIN) / (PEG_ROWS + 1)) * (ballRow + 1) : null);
  }, [ballX, ballRow, draw]);

  useEffect(() => () => clearTimeout(dropTimer.current), []);

  function pickDropZone(zoneIndex) {
    if (disabled || phase === 'dropping') return;
    const colSpacing = BOARD_W / (PEG_COLS + 1);
    let x = BOARD_W * ((zoneIndex + 0.5) / dropZoneCount);
    setBallX(x);
    setBallRow(-1);
    setPhase('dropping');

    const bucketWidth = BOARD_W / buckets.length;
    const bias = activePowerUp ? activePowerUp.bias : null;
    const outwardChance = pushOutwardChance(bias);
    const stepSize = bias === 'straight' ? colSpacing * 0.12 : colSpacing * (spikesEnabled ? 0.55 : 0.4);

    let row = -1;
    function step() {
      row += 1;
      setBallRow(row);
      if (row < PEG_ROWS) {
        const center = BOARD_W / 2;
        const movingOutward = x < center ? Math.random() < outwardChance : Math.random() >= outwardChance;
        const direction = x < center
          ? (movingOutward ? -1 : 1)
          : (movingOutward ? 1 : -1);
        x = Math.max(colSpacing * 0.4, Math.min(BOARD_W - colSpacing * 0.4, x + direction * stepSize));
        setBallX(x);
        dropTimer.current = setTimeout(step, ROW_STEP_MS);
      } else {
        const bucketIndex = Math.max(0, Math.min(buckets.length - 1, Math.floor(x / bucketWidth)));
        dropTimer.current = setTimeout(() => {
          setPhase('idle');
          onLanded(bucketIndex);
        }, 250);
      }
    }
    step();
  }

  return (
    <div style={{ width: '100%', maxWidth: BOARD_W }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {Array.from({ length: dropZoneCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => pickDropZone(i)}
            disabled={disabled || phase === 'dropping'}
            style={{
              flex: 1,
              padding: '8px 0',
              borderRadius: 8,
              border: '2px solid #16204A',
              background: '#2C3E80',
              color: '#F4C542',
              fontWeight: 700,
              cursor: disabled || phase === 'dropping' ? 'default' : 'pointer',
              opacity: disabled || phase === 'dropping' ? 0.6 : 1,
            }}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={BOARD_W}
        height={BOARD_H}
        style={{ width: '100%', height: 'auto', borderRadius: 10, border: '3px solid #16204A', display: 'block', background: '#1B2A57' }}
      />

      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        {buckets.map((b) => (
          <div
            key={b.id}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '8px 2px',
              borderRadius: 6,
              background: BUCKET_COLORS[Number(b.id.split('-')[1]) % BUCKET_COLORS.length],
              color: '#fff',
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            {b.value}
            {b.stars > 0 && <div style={{ fontSize: 11 }}>{'★'.repeat(b.stars)}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

const BUCKET_COLORS = ['#5FBF7B', '#4D9FEC', '#9B6FE0', '#F0924A', '#EC6FB5', '#E0555F', '#3AB6A6'];
