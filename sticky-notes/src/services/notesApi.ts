import type { Note } from '../models/note';
import { readNotesFromStorage, writeNotesToStorage } from '../utils/storage';

const MOCK_LATENCY_MS = 280;

function delay<T>(value: T, ms = MOCK_LATENCY_MS): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), ms);
  });
}

/** Simulated REST layer — localStorage is the real persistence backend. */
export const notesApi = {
  async fetchNotes(): Promise<Note[]> {
    const stored = readNotesFromStorage();
    return delay(stored ?? []);
  },

  async saveNotes(notes: Note[]): Promise<void> {
    writeNotesToStorage(notes);
    await delay(undefined);
  },
};
