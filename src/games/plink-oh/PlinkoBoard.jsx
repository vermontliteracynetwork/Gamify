import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'motion/react';

const BOARD_W = 560;
const BOARD_H = 360;
const PEG_ROWS = 8;
const PEG_COLS = 11; // odd count so alternating rows stagger evenly
const TOP_MARGIN = 34;
const BOTTOM_MARGIN = 30;
const ROW_DURATION_MS = 190;
const LAND_SETTLE_MS = 320;

const BUCKET_COLORS = ['#57c785', '#4d9fec', '#9b6fe0', '#f0924a', '#ec6fb5', '#ef5d68', '#3ab6a6'];

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
const ROW_SPACING = (BOARD_H - TOP_MARGIN - BOTTOM_MARGIN) / (PEG_ROWS + 1);

function rowY(row) {
  return TOP_MARGIN + ROW_SPACING * (row + 1);
}

function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Bounce-probability bias per power-up. Each returns the chance (0-1) the
// ball steps *away* from board-center on a given row; 0.5 is a neutral
// coin-flip walk. See data.js for why these values are placeholders.
function pushOutwardChance(bias) {
  if (bias === 'straight') return 0.5; // minimal net drift, small step size handles the "almost straight" feel
  if (bias === 'center') return 0.28; // biased to step back toward center
  if (bias === 'edge') return 0.72; // biased to step away from center
  return 0.5; // no power-up active -- neutral coin-flip walk; spikes affect step *size* below, not direction
}

// Precompute the full sequence of row x-positions up front (same random-walk
// logic as before) so the animation loop only has to interpolate through
// known points, rather than deciding direction mid-flight.
function computeDropPath({ startX, dropZoneCount, spikesEnabled, bias }) {
  const colSpacing = BOARD_W / (PEG_COLS + 1);
  const outwardChance = pushOutwardChance(bias);
  const stepSize = bias === 'straight' ? colSpacing * 0.12 : colSpacing * (spikesEnabled ? 0.55 : 0.4);
  const center = BOARD_W / 2;
  const xs = [startX];
  let x = startX;
  for (let row = 0; row < PEG_ROWS; row++) {
    const movingOutward = x < center ? Math.random() < outwardChance : Math.random() >= outwardChance;
    const direction = x < center ? (movingOutward ? -1 : 1) : (movingOutward ? 1 : -1);
    x = Math.max(colSpacing * 0.4, Math.min(BOARD_W - colSpacing * 0.4, x + direction * stepSize));
    xs.push(x);
  }
  return xs;
}

export default function PlinkoBoard({ dropZoneCount, buckets, spikesEnabled, activePowerUp, teamColor, onLanded, disabled }) {
  const canvasRef = useRef(null);
  const [phase, setPhase] = useState('idle'); // idle | dropping
  const [landedIndex, setLandedIndex] = useState(null);
  const rafRef = useRef(null);
  const ballPos = useRef({ x: null, y: null, r: 9 });

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, BOARD_W, BOARD_H);

    ctx.fillStyle = '#0e1638';
    ctx.fillRect(0, 0, BOARD_W, BOARD_H);

    PEGS.forEach((peg) => {
      const isSpike = spikesEnabled && peg.row % 3 === 2;
      ctx.beginPath();
      ctx.fillStyle = isSpike ? '#f0924a' : '#5f70a3';
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

    const { x, y, r } = ballPos.current;
    if (x != null) {
      ctx.beginPath();
      ctx.fillStyle = teamColor || '#f7c948';
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.stroke();
    }
  }, [spikesEnabled, teamColor]);

  useEffect(() => {
    draw();
  }, [draw]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  function pickDropZone(zoneIndex) {
    if (disabled || phase === 'dropping') return;
    setLandedIndex(null);
    setPhase('dropping');

    const startX = BOARD_W * ((zoneIndex + 0.5) / dropZoneCount);
    const bias = activePowerUp ? activePowerUp.bias : null;
    const xs = computeDropPath({ startX, dropZoneCount, spikesEnabled, bias });
    const startY = TOP_MARGIN - 14;

    const totalMs = PEG_ROWS * ROW_DURATION_MS;
    const startedAt = performance.now();

    function frame(now) {
      const elapsed = now - startedAt;
      const rowFloat = Math.min(PEG_ROWS, elapsed / ROW_DURATION_MS);
      const row = Math.min(PEG_ROWS - 1, Math.floor(rowFloat));
      const localT = Math.min(1, rowFloat - row);
      const eased = easeInOutCubic(localT);

      const fromX = xs[row];
      const toX = xs[row + 1];
      const fromY = row === 0 ? startY : rowY(row - 1);
      const toY = rowY(row);

      // A small upward arc between pegs (real bounce), settling flat at
      // the very end of the drop so it doesn't overshoot into the bucket.
      const arc = elapsed < totalMs ? Math.sin(Math.PI * eased) * 5 : 0;
      const squash = elapsed < totalMs ? 1 + Math.sin(Math.PI * eased) * 0.12 : 1;

      ballPos.current = {
        x: fromX + (toX - fromX) * eased,
        y: fromY + (toY - fromY) * eased - arc,
        r: 9 * squash,
      };
      draw();

      if (elapsed < totalMs) {
        rafRef.current = requestAnimationFrame(frame);
      } else {
        const bucketWidth = BOARD_W / buckets.length;
        const finalX = xs[PEG_ROWS];
        const bucketIndex = Math.max(0, Math.min(buckets.length - 1, Math.floor(finalX / bucketWidth)));
        setTimeout(() => {
          setPhase('idle');
          setLandedIndex(bucketIndex);
          onLanded(bucketIndex);
        }, LAND_SETTLE_MS);
      }
    }
    rafRef.current = requestAnimationFrame(frame);
  }

  return (
    <div className="w-full" style={{ maxWidth: BOARD_W }}>
      <div className="flex gap-1 mb-1.5">
        {Array.from({ length: dropZoneCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => pickDropZone(i)}
            disabled={disabled || phase === 'dropping'}
            className="flex-1 py-2 rounded-input bg-bg-elevated border-2 border-border-soft text-accent font-display font-bold text-sm
                       transition-transform hover:border-accent active:scale-90 disabled:opacity-40 disabled:pointer-events-none"
          >
            {i + 1}
          </button>
        ))}
      </div>

      <canvas
        ref={canvasRef}
        width={BOARD_W}
        height={BOARD_H}
        className="w-full h-auto block rounded-panel border-[3px] border-border-soft"
      />

      <div className="flex gap-1 mt-1.5">
        {buckets.map((b, i) => (
          <motion.div
            key={b.id}
            animate={landedIndex === i ? { scale: [1, 1.18, 1] } : { scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 text-center py-2 px-0.5 rounded-input text-white font-display font-bold text-sm"
            style={{ background: BUCKET_COLORS[i % BUCKET_COLORS.length] }}
          >
            {b.value}
            {b.stars > 0 && <div className="text-xs leading-none mt-0.5">{'★'.repeat(b.stars)}</div>}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
