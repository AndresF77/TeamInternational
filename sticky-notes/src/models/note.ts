export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple';

export interface Note {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: NoteColor;
  zIndex: number;
}

export interface NotePosition {
  x: number;
  y: number;
}

export interface NoteSize {
  width: number;
  height: number;
}

export interface ViewportBounds {
  width: number;
  height: number;
}

/** Optional geometry when creating a note (defaults applied when omitted). */
export interface CreateNoteOptions {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export const NOTE_COLORS: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple'];

export const DEFAULT_NOTE_SIZE: NoteSize = { width: 220, height: 200 };
export const MIN_NOTE_SIZE: NoteSize = { width: 120, height: 100 };
export const MIN_VISIBLE_IN_VIEWPORT = 48;

export const DEFAULT_NOTE_TEXT = '';
export const DEFAULT_NOTE_COLOR: NoteColor = 'yellow';
export const BASE_Z_INDEX = 1;
