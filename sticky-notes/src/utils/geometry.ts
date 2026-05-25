import {
  MIN_NOTE_SIZE,
  MIN_VISIBLE_IN_VIEWPORT,
  type Note,
  type NotePosition,
  type NoteSize,
  type ViewportBounds,
} from '../models/note';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampNoteSize(size: NoteSize): NoteSize {
  return {
    width: Math.max(size.width, MIN_NOTE_SIZE.width),
    height: Math.max(size.height, MIN_NOTE_SIZE.height),
  };
}

/** Keeps at least MIN_VISIBLE_IN_VIEWPORT of the note inside the board. */
export function clampNotePosition(
  position: NotePosition,
  size: NoteSize,
  viewport: ViewportBounds,
): NotePosition {
  const maxX = viewport.width - MIN_VISIBLE_IN_VIEWPORT;
  const maxY = viewport.height - MIN_VISIBLE_IN_VIEWPORT;
  const minX = MIN_VISIBLE_IN_VIEWPORT - size.width;
  const minY = MIN_VISIBLE_IN_VIEWPORT - size.height;

  return {
    x: clamp(position.x, minX, maxX),
    y: clamp(position.y, minY, maxY),
  };
}

export function getCenteredPosition(
  size: NoteSize,
  viewport: ViewportBounds,
): NotePosition {
  return clampNotePosition(
    {
      x: (viewport.width - size.width) / 2,
      y: (viewport.height - size.height) / 2,
    },
    size,
    viewport,
  );
}

export function rectsOverlap(a: Rect, b: Rect): boolean {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

export function noteToRect(note: Pick<Note, 'x' | 'y' | 'width' | 'height'>): Rect {
  return { x: note.x, y: note.y, width: note.width, height: note.height };
}

export function getMaxZIndex(notes: readonly Note[]): number {
  return notes.reduce((max, note) => Math.max(max, note.zIndex), 0);
}

export function isValidNotesPayload(value: unknown): value is Note[] {
  if (!Array.isArray(value)) return false;

  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const note = item as Record<string, unknown>;
    return (
      typeof note.id === 'string' &&
      typeof note.x === 'number' &&
      typeof note.y === 'number' &&
      typeof note.width === 'number' &&
      typeof note.height === 'number' &&
      typeof note.text === 'string' &&
      typeof note.color === 'string' &&
      typeof note.zIndex === 'number'
    );
  });
}
