import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  BASE_Z_INDEX,
  DEFAULT_NOTE_COLOR,
  DEFAULT_NOTE_SIZE,
  DEFAULT_NOTE_TEXT,
  type CreateNoteOptions,
  type Note,
  type NoteColor,
  type ViewportBounds,
} from '../models/note';
import { notesApi } from '../services/notesApi';
import { generateId } from '../utils/id';
import {
  clampNotePosition,
  clampNoteSize,
  getCenteredPosition,
  getMaxZIndex,
} from '../utils/geometry';
import { STORAGE_KEY, deserializeNotes, serializeNotes } from '../utils/storage';
import { useLocalStorage } from './useLocalStorage';

export interface UseNotesResult {
  notes: Note[];
  isLoading: boolean;
  selectedId: string | null;
  selectNote: (id: string) => void;
  clearSelection: () => void;
  bringToFront: (id: string) => void;
  createNote: (viewport: ViewportBounds, options?: CreateNoteOptions) => void;
  updateNote: (id: string, patch: Partial<Note>) => void;
  deleteNote: (id: string) => void;
  setNotePosition: (id: string, x: number, y: number, viewport: ViewportBounds) => void;
  setNoteSize: (id: string, width: number, height: number) => void;
  cycleNoteColor: (id: string) => void;
}

const NOTE_COLORS_CYCLE: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple'];

export function useNotes(): UseNotesResult {
  const [notes, setNotes] = useLocalStorage<Note[]>({
    key: STORAGE_KEY,
    initialValue: [],
    serialize: serializeNotes,
    deserialize: (raw) => deserializeNotes(raw) ?? [],
  });

  const [isLoading, setIsLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    notesApi.fetchNotes().then((loaded) => {
      if (cancelled) return;
      if (!hasHydratedRef.current && loaded.length > 0) {
        setNotes(loaded);
      }
      hasHydratedRef.current = true;
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [setNotes]);

  useEffect(() => {
    if (isLoading) return;

    if (saveTimerRef.current !== null) {
      window.clearTimeout(saveTimerRef.current);
    }

    saveTimerRef.current = window.setTimeout(() => {
      void notesApi.saveNotes(notes);
    }, 400);

    return () => {
      if (saveTimerRef.current !== null) {
        window.clearTimeout(saveTimerRef.current);
      }
    };
  }, [isLoading, notes]);

  const bringToFront = useCallback((id: string) => {
    setNotes((prev) => {
      const maxZ = getMaxZIndex(prev);
      return prev.map((note) =>
        note.id === id ? { ...note, zIndex: maxZ + 1 } : note,
      );
    });
  }, [setNotes]);

  const selectNote = useCallback(
    (id: string) => {
      setSelectedId(id);
      bringToFront(id);
    },
    [bringToFront],
  );

  const clearSelection = useCallback(() => setSelectedId(null), []);

  const createNote = useCallback(
    (viewport: ViewportBounds, options?: CreateNoteOptions) => {
      const size = clampNoteSize({
        width: options?.width ?? DEFAULT_NOTE_SIZE.width,
        height: options?.height ?? DEFAULT_NOTE_SIZE.height,
      });

      const position =
        options?.x !== undefined && options?.y !== undefined
          ? clampNotePosition({ x: options.x, y: options.y }, size, viewport)
          : getCenteredPosition(size, viewport);

      const id = generateId();

      setNotes((prev) => {
        const zIndex = getMaxZIndex(prev) + 1 || BASE_Z_INDEX;
        const note: Note = {
          id,
          x: position.x,
          y: position.y,
          width: size.width,
          height: size.height,
          text: DEFAULT_NOTE_TEXT,
          color: DEFAULT_NOTE_COLOR,
          zIndex,
        };
        return [...prev, note];
      });

      setSelectedId(id);
    },
    [setNotes],
  );

  const updateNote = useCallback(
    (id: string, patch: Partial<Note>) => {
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...patch } : note)),
      );
    },
    [setNotes],
  );

  const deleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((note) => note.id !== id));
      setSelectedId((current) => (current === id ? null : current));
    },
    [setNotes],
  );

  const setNotePosition = useCallback(
    (id: string, x: number, y: number, viewport: ViewportBounds) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const clamped = clampNotePosition({ x, y }, note, viewport);
          return { ...note, x: clamped.x, y: clamped.y };
        }),
      );
    },
    [setNotes],
  );

  const setNoteSize = useCallback(
    (id: string, width: number, height: number) => {
      setNotes((prev) =>
        prev.map((note) =>
          note.id === id
            ? { ...note, ...clampNoteSize({ width, height }) }
            : note,
        ),
      );
    },
    [setNotes],
  );

  const cycleNoteColor = useCallback(
    (id: string) => {
      setNotes((prev) =>
        prev.map((note) => {
          if (note.id !== id) return note;
          const index = NOTE_COLORS_CYCLE.indexOf(note.color);
          const next = NOTE_COLORS_CYCLE[(index + 1) % NOTE_COLORS_CYCLE.length];
          return { ...note, color: next };
        }),
      );
    },
    [setNotes],
  );

  return useMemo(
    () => ({
      notes,
      isLoading,
      selectedId,
      selectNote,
      clearSelection,
      bringToFront,
      createNote,
      updateNote,
      deleteNote,
      setNotePosition,
      setNoteSize,
      cycleNoteColor,
    }),
    [
      notes,
      isLoading,
      selectedId,
      selectNote,
      clearSelection,
      bringToFront,
      createNote,
      updateNote,
      deleteNote,
      setNotePosition,
      setNoteSize,
      cycleNoteColor,
    ],
  );
}
