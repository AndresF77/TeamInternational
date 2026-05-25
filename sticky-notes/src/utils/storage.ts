import type { Note } from '../models/note';
import { isValidNotesPayload } from './geometry';

export const STORAGE_KEY = 'sticky-notes-v1';

export function serializeNotes(notes: Note[]): string {
  return JSON.stringify(notes);
}

export function deserializeNotes(raw: string | null): Note[] | null {
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    return isValidNotesPayload(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function readNotesFromStorage(): Note[] | null {
  if (typeof window === 'undefined') return null;
  return deserializeNotes(window.localStorage.getItem(STORAGE_KEY));
}

export function writeNotesToStorage(notes: Note[]): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, serializeNotes(notes));
}
