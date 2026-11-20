import { describe, expect, it } from 'vitest';
import { safeColor, safeImage, sanitizeTheme } from './safeTheme';
import { classicTheme } from './classic';

describe('theme sanitizing', () => {
  it('keeps real pictures and colors', () => {
    expect(safeImage('data:image/png;base64,iVBORw0KGgo=')).toBeTruthy();
    expect(safeImage('/classic/match-three/gem-1.webp')).toBeTruthy();
    expect(safeColor('#ff00aa')).toBe('#ff00aa');
  });
  it('drops code hidden in a picture or color', () => {
    expect(safeImage('javascript:alert(1)')).toBeUndefined();
    expect(safeImage('data:text/html,<script>alert(1)</script>')).toBeUndefined();
    expect(safeImage('data:image/svg+xml,<svg onload=alert(1)>')).toBeUndefined();
    expect(safeImage('x") ; background:url(https://evil.example/')).toBeUndefined();
    expect(safeColor('red;background:url(x)')).toBeUndefined();
    const th = sanitizeTheme({ ...classicTheme('game-show'), pieces: { square: { image: 'javascript:alert(1)', color: 'red;x' } } });
    expect(th.pieces.square).toEqual({});
  });
});
