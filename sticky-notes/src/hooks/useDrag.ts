import { useCallback, useEffect, useRef, useState } from 'react';

export interface DragPosition {
  x: number;
  y: number;
}

interface DragState {
  pointerId: number;
  startClientX: number;
  startClientY: number;
  originX: number;
  originY: number;
}

export interface UseDragOptions {
  position: DragPosition;
  onDragStart?: () => void;
  onDragMove?: (position: DragPosition) => void;
  onDragEnd: (position: DragPosition) => void;
  disabled?: boolean;
}

export interface UseDragResult {
  isDragging: boolean;
  livePosition: DragPosition | null;
  bindHandle: {
    onPointerDown: (event: React.PointerEvent<HTMLElement>) => void;
  };
}

export function useDrag({
  position,
  onDragStart,
  onDragMove,
  onDragEnd,
  disabled = false,
}: UseDragOptions): UseDragResult {
  const [isDragging, setIsDragging] = useState(false);
  const [livePosition, setLivePosition] = useState<DragPosition | null>(null);

  const positionRef = useRef(position);
  const dragStateRef = useRef<DragState | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<DragPosition | null>(null);

  positionRef.current = position;

  const flushPosition = useCallback(() => {
    rafRef.current = null;
    const next = pendingPositionRef.current;
    if (!next) return;
    setLivePosition(next);
    onDragMove?.(next);
  }, [onDragMove]);

  const schedulePositionUpdate = useCallback(
    (next: DragPosition) => {
      pendingPositionRef.current = next;
      if (rafRef.current !== null) return;
      rafRef.current = window.requestAnimationFrame(flushPosition);
    },
    [flushPosition],
  );

  const endDrag = useCallback(
    (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      dragStateRef.current = null;
      setIsDragging(false);

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const finalPosition = pendingPositionRef.current ?? {
        x: positionRef.current.x,
        y: positionRef.current.y,
      };

      pendingPositionRef.current = null;
      setLivePosition(null);
      onDragEnd(finalPosition);
    },
    [onDragEnd],
  );

  const moveDrag = useCallback(
    (event: PointerEvent) => {
      const state = dragStateRef.current;
      if (!state || state.pointerId !== event.pointerId) return;

      const dx = event.clientX - state.startClientX;
      const dy = event.clientY - state.startClientY;

      schedulePositionUpdate({
        x: state.originX + dx,
        y: state.originY + dy,
      });
    },
    [schedulePositionUpdate],
  );

  useEffect(() => {
    if (!isDragging) return;

    window.addEventListener('pointermove', moveDrag);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      window.removeEventListener('pointermove', moveDrag);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [endDrag, isDragging, moveDrag]);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);

      dragStateRef.current = {
        pointerId: event.pointerId,
        startClientX: event.clientX,
        startClientY: event.clientY,
        originX: positionRef.current.x,
        originY: positionRef.current.y,
      };

      pendingPositionRef.current = {
        x: positionRef.current.x,
        y: positionRef.current.y,
      };

      setIsDragging(true);
      setLivePosition({ x: positionRef.current.x, y: positionRef.current.y });
      onDragStart?.();
    },
    [disabled, onDragStart],
  );

  return {
    isDragging,
    livePosition,
    bindHandle: { onPointerDown },
  };
}
