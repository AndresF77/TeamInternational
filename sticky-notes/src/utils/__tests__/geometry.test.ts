import { describe, expect, it } from 'vitest';
import {
  clamp,
  clampNotePosition,
  clampNoteSize,
  getCenteredPosition,
  isValidNotesPayload,
  rectsOverlap,
} from '../geometry';

describe('clamp', () => {
  it('clamps values within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(99, 0, 10)).toBe(10);
  });
});

describe('clampNoteSize', () => {
  it('enforces minimum width and height', () => {
    expect(clampNoteSize({ width: 50, height: 40 })).toEqual({
      width: 120,
      height: 100,
    });
  });

  it('keeps sizes above minimum unchanged', () => {
    expect(clampNoteSize({ width: 200, height: 150 })).toEqual({
      width: 200,
      height: 150,
    });
  });
});

describe('clampNotePosition', () => {
  it('keeps at least MIN_VISIBLE inside viewport', () => {
    const viewport = { width: 800, height: 600 };
    const size = { width: 200, height: 180 };

    expect(clampNotePosition({ x: -500, y: -500 }, size, viewport)).toEqual({
      x: 48 - 200,
      y: 48 - 180,
    });

    expect(clampNotePosition({ x: 900, y: 700 }, size, viewport)).toEqual({
      x: 752,
      y: 552,
    });
  });
});

describe('getCenteredPosition', () => {
  it('centers note within viewport and clamps result', () => {
    const pos = getCenteredPosition(
      { width: 200, height: 200 },
      { width: 1000, height: 800 },
    );
    expect(pos.x).toBe(400);
    expect(pos.y).toBe(300);
  });
});

describe('rectsOverlap', () => {
  it('detects overlapping rectangles', () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 100, height: 100 },
        { x: 50, y: 50, width: 100, height: 100 },
      ),
    ).toBe(true);
  });

  it('returns false for separated rectangles', () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 100, y: 100, width: 50, height: 50 },
      ),
    ).toBe(false);
  });

  it('returns false for edge-adjacent rectangles', () => {
    expect(
      rectsOverlap(
        { x: 0, y: 0, width: 50, height: 50 },
        { x: 50, y: 0, width: 50, height: 50 },
      ),
    ).toBe(false);
  });
});

describe('isValidNotesPayload', () => {
  it('accepts valid note arrays', () => {
    expect(
      isValidNotesPayload([
        {
          id: 'a',
          x: 0,
          y: 0,
          width: 120,
          height: 100,
          text: 'hi',
          color: 'yellow',
          zIndex: 1,
        },
      ]),
    ).toBe(true);
  });

  it('rejects malformed payloads', () => {
    expect(isValidNotesPayload(null)).toBe(false);
    expect(isValidNotesPayload([{ id: 1 }])).toBe(false);
    expect(isValidNotesPayload('notes')).toBe(false);
  });
});
