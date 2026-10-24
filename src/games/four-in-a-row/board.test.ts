import { describe, expect, it } from 'vitest';
import { cpuMove, drop, emptyBoard, isFull, winningLine, type Board } from './board';

const play = (moves: [number, 1 | 2][]): Board => moves.reduce((b, [c, w]) => drop(b, c, w)!.board, emptyBoard());

describe('four in a row', () => {
  it('discs fall to the lowest open row', () => {
    const b = play([[3, 1], [3, 2]]);
    expect(b[5][3]).toBe(1);
    expect(b[4][3]).toBe(2);
  });
  it('a full column refuses more discs', () => {
    let b = emptyBoard();
    for (let i = 0; i < 6; i++) b = drop(b, 0, 1)!.board;
    expect(drop(b, 0, 2)).toBeNull();
  });
  it('finds wins across, down and diagonally', () => {
    expect(winningLine(play([[0, 1], [1, 1], [2, 1], [3, 1]]))).toHaveLength(4);
    expect(winningLine(play([[0, 2], [0, 2], [0, 2], [0, 2]]))).toHaveLength(4);
    expect(winningLine(play([[0, 1], [1, 2], [1, 1], [2, 2], [2, 2], [2, 1], [3, 2], [3, 2], [3, 2], [3, 1]]))).toHaveLength(4);
    expect(winningLine(play([[0, 1], [1, 1], [2, 1]]))).toBeNull();
  });
  it('medium and hard computers take a win and block a loss', () => {
    const canWin = play([[0, 2], [1, 2], [2, 2]]);
    expect(cpuMove(canWin, 2, 'medium')).toBe(3);
    expect(cpuMove(canWin, 2, 'hard')).toBe(3);
    const mustBlock = play([[0, 1], [1, 1], [2, 1]]);
    expect(cpuMove(mustBlock, 2, 'medium')).toBe(3);
    expect(cpuMove(mustBlock, 2, 'hard')).toBe(3);
  });
  it('knows a full board', () => {
    let b = emptyBoard();
    for (let c = 0; c < 7; c++) for (let r = 0; r < 6; r++) b = drop(b, c, ((c + Math.floor(r / 2)) % 2 + 1) as 1 | 2)!.board;
    expect(isFull(b)).toBe(true);
  });
});
