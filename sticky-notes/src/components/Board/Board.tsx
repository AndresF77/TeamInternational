import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_NOTE_SIZE, type ViewportBounds } from '../../models/note';
import type { Rect } from '../../utils/geometry';
import { useNotes } from '../../hooks/useNotes';
import { EmptyState } from '../EmptyState/EmptyState';
import { NoteCard } from '../NoteCard/NoteCard';
import { Toolbar } from '../Toolbar/Toolbar';
import { TrashZone } from '../TrashZone/TrashZone';
import './Board.css';

export function Board() {
  const boardRef = useRef<HTMLDivElement>(null);
  const trashRef = useRef<HTMLDivElement>(null);
  const [viewport, setViewport] = useState<ViewportBounds>({ width: 0, height: 0 });
  const [trashRect, setTrashRect] = useState<Rect | null>(null);
  const [draggingNoteId, setDraggingNoteId] = useState<string | null>(null);
  const [isOverTrash, setIsOverTrash] = useState(false);

  const {
    notes,
    isLoading,
    selectedId,
    selectNote,
    clearSelection,
    createNote,
    updateNote,
    deleteNote,
    setNotePosition,
    setNoteSize,
    cycleNoteColor,
  } = useNotes();

  const measureViewport = useCallback(() => {
    const el = boardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewport({ width: rect.width, height: rect.height });
  }, []);

  const measureTrash = useCallback(() => {
    const boardEl = boardRef.current;
    const trashEl = trashRef.current;
    if (!boardEl || !trashEl) {
      setTrashRect(null);
      return;
    }
    const boardBox = boardEl.getBoundingClientRect();
    const trashBox = trashEl.getBoundingClientRect();
    setTrashRect({
      x: trashBox.left - boardBox.left,
      y: trashBox.top - boardBox.top,
      width: trashBox.width,
      height: trashBox.height,
    });
  }, []);

  useEffect(() => {
    measureViewport();
    measureTrash();

    const boardEl = boardRef.current;
    if (!boardEl) return;

    const observer = new ResizeObserver(() => {
      measureViewport();
      measureTrash();
    });

    observer.observe(boardEl);
    window.addEventListener('resize', measureViewport);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measureViewport);
    };
  }, [measureTrash, measureViewport]);

  useEffect(() => {
    if (draggingNoteId) {
      measureTrash();
    }
  }, [draggingNoteId, measureTrash]);

  const handleAddNote = useCallback(() => {
    if (viewport.width === 0) {
      measureViewport();
    }
    createNote(
      viewport.width > 0 ? viewport : { width: 1024, height: 600 },
    );
  }, [createNote, measureViewport, viewport]);

  const handleBoardPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        clearSelection();
      }
    },
    [clearSelection],
  );

  const handleBoardDoubleClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget || viewport.width === 0) return;

      const boardBox = boardRef.current?.getBoundingClientRect();
      if (!boardBox) return;

      const x =
        event.clientX -
        boardBox.left -
        DEFAULT_NOTE_SIZE.width / 2;
      const y =
        event.clientY -
        boardBox.top -
        DEFAULT_NOTE_SIZE.height / 2;

      createNote(viewport, {
        x,
        y,
        width: DEFAULT_NOTE_SIZE.width,
        height: DEFAULT_NOTE_SIZE.height,
      });
    },
    [createNote, viewport],
  );

  const handleDragStateChange = useCallback((id: string | null, overTrash: boolean) => {
    setDraggingNoteId(id);
    setIsOverTrash(overTrash);
    if (id) {
      requestAnimationFrame(measureTrash);
    }
  }, [measureTrash]);

  const handlePositionChange = useCallback(
    (id: string, x: number, y: number) => {
      setNotePosition(id, x, y, viewport);
    },
    [setNotePosition, viewport],
  );

  const stableCallbacks = useMemo(
    () => ({
      onSelect: selectNote,
      onPositionChange: handlePositionChange,
      onSizeChange: setNoteSize,
      onTextChange: (id: string, text: string) => updateNote(id, { text }),
      onColorCycle: cycleNoteColor,
      onDelete: deleteNote,
      onDragStateChange: handleDragStateChange,
    }),
    [
      selectNote,
      handlePositionChange,
      setNoteSize,
      updateNote,
      cycleNoteColor,
      deleteNote,
      handleDragStateChange,
    ],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        clearSelection();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [clearSelection]);

  return (
    <div className="app-shell">
      <Toolbar noteCount={notes.length} onAddNote={handleAddNote} />
      <div
        ref={boardRef}
        className="board"
        onPointerDown={handleBoardPointerDown}
        onDoubleClick={handleBoardDoubleClick}
        role="application"
        aria-label="Sticky notes board"
      >
        {isLoading && (
          <div className="board__loading" role="status" aria-live="polite">
            Loading notes…
          </div>
        )}

        {!isLoading && notes.length === 0 && <EmptyState />}

        {notes.map((note) => (
          <NoteCard
            key={note.id}
            note={note}
            isSelected={selectedId === note.id}
            viewport={viewport}
            trashRect={trashRect}
            {...stableCallbacks}
          />
        ))}

        <div ref={trashRef}>
          <TrashZone isDragOver={isOverTrash} isDragging={draggingNoteId !== null} />
        </div>
      </div>
    </div>
  );
}
