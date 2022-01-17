import { debounceAnimationFrame } from 'util/debounce';
import { useCallback, useEffect, useRef, useState } from 'react';

function isTouchEvent(event: MouseEvent | TouchEvent): event is TouchEvent {
  return window.TouchEvent && event instanceof TouchEvent;
}

export function useDraggable(initialPos = { x: 0, y: 0 }) {
  const dragElementRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const [position, setPosition] = useState(initialPos);

  const [previousEventPos, setPreviousEventPos] = useState({ x: 0, y: 0 });

  const [touchId, setTouchId] = useState(0);

  const handleStart = useCallback((e: MouseEvent | TouchEvent) => {
    if (
      dragElementRef.current &&
      e.target instanceof Node &&
      dragElementRef.current.contains(e.target)
    ) {
      if (isTouchEvent(e)) {
        const touch = e.changedTouches[0];
        setTouchId(touch.identifier);
        setPreviousEventPos({
          x: touch.clientX,
          y: touch.clientY,
        });
      } else {
        setPreviousEventPos({ x: e.clientX, y: e.clientY });
      }

      isDragging.current = true;
    }
  }, []);

  const handleMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isDragging.current) {
        if (isTouchEvent(e)) {
          const touch = Array.from(e.changedTouches).find(
            (t) => t.identifier === touchId,
          );
          if (touch) {
            const movementX = touch.clientX - previousEventPos.x;
            const movementY = touch.clientY - previousEventPos.y;

            setPreviousEventPos({ x: touch.clientX, y: touch.clientY });

            setPosition((pos) => ({
              x: pos.x + movementX,
              y: pos.y + movementY,
            }));
          }
        } else {
          setPosition((pos) => ({
            x: pos.x + e.movementX,
            y: pos.y + e.movementY,
          }));
          setPreviousEventPos({ x: e.clientX, y: e.clientY });
        }
      }
    },
    [previousEventPos.x, previousEventPos.y, touchId],
  );

  const handleStop = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isDragging.current) {
        if (isTouchEvent(e)) {
          if (
            !Array.from(e.changedTouches).find((t) => t.identifier === touchId)
          ) {
            return;
          }
        }

        isDragging.current = false;
      }
    },
    [touchId],
  );

  useEffect(() => {
    const ref = dragElementRef.current;
    const { body } = document;

    ref?.addEventListener('mousedown', handleStart);
    body?.addEventListener('mousemove', handleMove);
    body?.addEventListener('mouseup', handleStop);

    ref?.addEventListener('touchstart', handleStart);
    body?.addEventListener('touchmove', handleMove);
    body?.addEventListener('touchend', handleStop);
    return () => {
      ref?.removeEventListener('mousedown', handleStart);
      body?.removeEventListener('mousemove', handleMove);
      body?.removeEventListener('mouseup', handleStop);

      ref?.removeEventListener('touchstart', handleStart);
      body?.removeEventListener('touchmove', handleMove);
      body?.removeEventListener('touchend', handleStop);
    };
  }, [handleStart, handleMove, handleStop]);

  const drag = useCallback((x: number, y: number) => {
    debounceAnimationFrame(() => {
      if (dragElementRef.current) {
        dragElementRef.current.style.left = `${x}px`;
        dragElementRef.current.style.top = `${y}px`;
      }
    })();
  }, []);

  useEffect(() => {
    if (position.x < 0) {
      setPosition({ x: 0, y: position.y });
      return;
    }
    if (position.y < 0) {
      setPosition({ x: position.x, y: 0 });
      return;
    }
    if (
      position.x >
      window.innerWidth - (dragElementRef.current?.offsetWidth ?? 0)
    ) {
      setPosition({
        x: window.innerWidth - (dragElementRef.current?.offsetWidth ?? 0),
        y: position.y,
      });
      return;
    }
    if (
      position.y >
      window.innerHeight - (dragElementRef.current?.offsetHeight ?? 0)
    ) {
      setPosition({
        x: position.x,
        y: window.innerHeight - (dragElementRef.current?.offsetHeight ?? 0),
      });
      return;
    }

    drag(position.x, position.y);
  }, [drag, position.x, position.y]);

  return dragElementRef;
}
