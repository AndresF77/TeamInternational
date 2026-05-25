import { useCallback, useEffect, useRef, useState } from 'react';
import type { NoteSize } from '../models/note';
import { clampNoteSize } from '../utils/geometry';

export type ResizeDirection = 'e' | 's' | 'se';

export interface ResizeState {
  width: number;
  height: number;
}

interface ActiveResize {
  pointerId: number;
  direction: ResizeDirection;
  startClientX: number;
  startClientY: number;
  originWidth: number;
  originHeight: number;
}

export interface UseResizeOptions {
  size: NoteSize;
  onResizeStart?: () => void;
  onResizeMove?: (size: NoteSize) => void;
  onResizeEnd: (size: NoteSize) => void;
  disabled?: boolean;
}

export interface UseResizeResult {
  isResizing: boolean;
  liveSize: NoteSize | null;
  getHandleProps: (direction: ResizeDirection) => {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

export function useResize({
  size,
  onResizeStart,
  onResizeMove,
  onResizeEnd,
  disabled = false,
}: UseResizeOptions): UseResizeResult {
  const [isResizing, setIsResizing] = useState(false);
  const [liveSize, setLiveSize] = useState<NoteSize | null>(null);

  const sizeRef = useRef(size);
  const resizeRef = useRef<ActiveResize | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingSizeRef = useRef<NoteSize | null>(null);

  sizeRef.current = size;

  const flushSize = useCallback(() => {
    rafRef.current = null;
    const next = pendingSizeRef.current;
    if (!next) return;
    setLiveSize(next);
    onResizeMove?.(next);
  }, [onResizeMove]);

  const scheduleSizeUpdate = useCallback(
    (next: NoteSize) => {
      pendingSizeRef.current = clampNoteSize(next);
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flushSize);
    },
    [flushSize],
  );

  const computeSize = useCallback((event: PointerEvent, active: ActiveResize): NoteSize => {
    const dx = event.clientX - active.startClientX;
    const dy = event.clientY - active.startClientY;

    let width = active.originWidth;
    let height = active.originHeight;

    if (active.direction === 'e' || active.direction === 'se') {
      width = active.originWidth + dx;
    }
    if (active.direction === 's' || active.direction === 'se') {
      height = active.originHeight + dy;
    }

    return clampNoteSize({ width, height });
  }, []);

  const endResize = useCallback(
    (event: PointerEvent) => {
      const active = resizeRef.current;
      if (!active || active.pointerId !== event.pointerId) return;

      resizeRef.current = null;
      setIsResizing(false);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const finalSize =
        pendingSizeRef.current ?? clampNoteSize(sizeRef.current);

      pendingSizeRef.current = null;
      setLiveSize(null);
      onResizeEnd(finalSize);
    },
    [onResizeEnd],
  );

  const moveResize = useCallback(
    (event: PointerEvent) => {
      const active = resizeRef.current;
      if (!active || active.pointerId !== event.pointerId) return;
      scheduleSizeUpdate(computeSize(event, active));
    },
    [computeSize, scheduleSizeUpdate],
  );

  useEffect(() => {
    if (!isResizing) return;

    window.addEventListener('pointermove', moveResize);
    window.addEventListener('pointerup', endResize);
    window.addEventListener('pointercancel', endResize);

    return () => {
      window.removeEventListener('pointermove', moveResize);
      window.removeEventListener('pointerup', endResize);
      window.removeEventListener('pointercancel', endResize);
    };
  }, [endResize, isResizing, moveResize]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (direction: ResizeDirection) => (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      resizeRef.current = {
        pointerId: event.pointerId,
        direction,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originWidth: sizeRef.current.width,
        originHeight: sizeRef.current.height,
      };

      pendingSizeRef.current = clampNoteSize(sizeRef.current);
      setIsResizing(true);
      setLiveSize(clampNoteSize(sizeRef.current));
      onResizeStart?.();
    },
    [disabled, onResizeStart],
  );

  const getHandleProps = useCallback(
    (direction: ResizeDirection) => ({
      onPointerDown: onPointerDown(direction),
    }),
    [onPointerDown],
  );

  return { isResizing, liveSize, getHandleProps };
}
