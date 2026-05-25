import { memo, useCallback, useEffect, useRef } from 'react';
import type { Note, ViewportBounds } from '../../models/note';
import { useDrag } from '../../hooks/useDrag';
import { useResize } from '../../hooks/useResize';
import { NOTE_COLOR_STYLES } from '../../utils/colors';
import {
  clampNotePosition,
  noteToRect,
  rectsOverlap,
  type Rect,
} from '../../utils/geometry';
import './NoteCard.css';

export interface NoteCardProps {
  note: Note;
  isSelected: boolean;
  viewport: ViewportBounds;
  trashRect: Rect | null;
  onSelect: (id: string) => void;
  onPositionChange: (id: string, x: number, y: number) => void;
  onSizeChange: (id: string, width: number, height: number) => void;
  onTextChange: (id: string, text: string) => void;
  onColorCycle: (id: string) => void;
  onDelete: (id: string) => void;
  onDragStateChange: (id: string | null, overTrash: boolean) => void;
}

function NoteCardComponent({
  note,
  isSelected,
  viewport,
  trashRect,
  onSelect,
  onPositionChange,
  onSizeChange,
  onTextChange,
  onColorCycle,
  onDelete,
  onDragStateChange,
}: NoteCardProps) {
  const trashRectRef = useRef(trashRect);
  trashRectRef.current = trashRect;

  const checkTrashOverlap = useCallback(
    (x: number, y: number, width: number, height: number) => {
      const trash = trashRectRef.current;
      if (!trash) return false;
      return rectsOverlap(noteToRect({ x, y, width, height }), trash);
    },
    [],
  );

  const handleDragStart = useCallback(() => {
    onDragStateChange(note.id, false);
  }, [note.id, onDragStateChange]);

  const clampPosition = useCallback(
    (position: { x: number; y: number }) =>
      clampNotePosition(position, note, viewport),
    [note, viewport],
  );

  const handleDragMove = useCallback(
    (position: { x: number; y: number }) => {
      const clamped = clampPosition(position);
      const overTrash = checkTrashOverlap(
        clamped.x,
        clamped.y,
        note.width,
        note.height,
      );
      onDragStateChange(note.id, overTrash);
    },
    [clampPosition, checkTrashOverlap, note.height, note.id, note.width, onDragStateChange],
  );

  const handleDragEnd = useCallback(
    (position: { x: number; y: number }) => {
      const clamped = clampPosition(position);
      const overTrash = checkTrashOverlap(
        clamped.x,
        clamped.y,
        note.width,
        note.height,
      );
      onDragStateChange(null, false);

      if (overTrash) {
        onDelete(note.id);
        return;
      }

      onPositionChange(note.id, clamped.x, clamped.y);
    },
    [
      clampPosition,
      checkTrashOverlap,
      note.height,
      note.id,
      note.width,
      onDelete,
      onDragStateChange,
      onPositionChange,
    ],
  );

  const { isDragging, livePosition, bindHandle } = useDrag({
    position: { x: note.x, y: note.y },
    onDragStart: handleDragStart,
    onDragMove: handleDragMove,
    onDragEnd: handleDragEnd,
  });

  const handleResizeEnd = useCallback(
    (size: { width: number; height: number }) => {
      onSizeChange(note.id, size.width, size.height);
    },
    [note.id, onSizeChange],
  );

  const { isResizing, liveSize, getHandleProps } = useResize({
    size: { width: note.width, height: note.height },
    onResizeEnd: handleResizeEnd,
    disabled: isDragging,
  });

  const displayPosition = livePosition
    ? clampPosition(livePosition)
    : { x: note.x, y: note.y };
  const displayX = displayPosition.x;
  const displayY = displayPosition.y;
  const displayWidth = liveSize?.width ?? note.width;
  const displayHeight = liveSize?.height ?? note.height;

  const colorStyle = NOTE_COLOR_STYLES[note.color];

  const handleCardPointerDown = useCallback(() => {
    onSelect(note.id);
  }, [note.id, onSelect]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if ((event.target as HTMLElement).tagName === 'TEXTAREA') return;
        event.preventDefault();
        onDelete(note.id);
      }
    },
    [note.id, onDelete],
  );

  useEffect(() => {
    if (!isDragging && !isResizing) return;
    document.body.classList.add('is-interacting');
    return () => document.body.classList.remove('is-interacting');
  }, [isDragging, isResizing]);

  const classNames = [
    'note-card',
    isSelected ? 'note-card--selected' : '',
    isDragging ? 'note-card--dragging' : '',
    isResizing ? 'note-card--resizing' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={classNames}
      style={{
        left: displayX,
        top: displayY,
        width: displayWidth,
        height: displayHeight,
        zIndex: note.zIndex,
        background: colorStyle.background,
        borderColor: colorStyle.border,
        boxShadow: isSelected
          ? `0 12px 28px ${colorStyle.shadow}, 0 0 0 2px ${colorStyle.border}`
          : `0 6px 18px ${colorStyle.shadow}`,
      }}
      role="group"
      aria-label={`Sticky note ${note.id.slice(0, 8)}`}
      aria-selected={isSelected}
      tabIndex={0}
      onPointerDown={handleCardPointerDown}
      onKeyDown={handleKeyDown}
      data-note-id={note.id}
    >
      <div
        className="note-card__header"
        {...bindHandle}
        aria-label="Drag to move note"
      >
        <button
          type="button"
          className="note-card__color-btn"
          onClick={(e) => {
            e.stopPropagation();
            onColorCycle(note.id);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          aria-label="Cycle note color"
          title="Change color"
        />
        <span className="note-card__grip" aria-hidden="true" />
      </div>

      <textarea
        className="note-card__textarea"
        value={note.text}
        onChange={(e) => onTextChange(note.id, e.target.value)}
        onPointerDown={(e) => e.stopPropagation()}
        placeholder="Write something..."
        aria-label="Note text"
      />

      <div
        className="note-card__resize note-card__resize--e"
        {...getHandleProps('e')}
        aria-label="Resize width"
      />
      <div
        className="note-card__resize note-card__resize--s"
        {...getHandleProps('s')}
        aria-label="Resize height"
      />
      <div
        className="note-card__resize note-card__resize--se"
        {...getHandleProps('se')}
        aria-label="Resize note"
      />
    </article>
  );
}

function propsAreEqual(prev: NoteCardProps, next: NoteCardProps): boolean {
  if (prev.isSelected !== next.isSelected) return false;
  if (prev.trashRect !== next.trashRect) return false;
  if (prev.viewport.width !== next.viewport.width) return false;
  if (prev.viewport.height !== next.viewport.height) return false;

  const a = prev.note;
  const b = next.note;
  return (
    a.id === b.id &&
    a.x === b.x &&
    a.y === b.y &&
    a.width === b.width &&
    a.height === b.height &&
    a.text === b.text &&
    a.color === b.color &&
    a.zIndex === b.zIndex
  );
}

export const NoteCard = memo(NoteCardComponent, propsAreEqual);
