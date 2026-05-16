import { useCallback, useLayoutEffect, useRef } from "react";

interface UseLongPressOptions {
  delay?: number;
  onLongPress: () => void;
  disabled?: boolean;
}

export function useLongPress({ delay = 500, onLongPress, disabled = false }: UseLongPressOptions) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firedRef = useRef(false);
  const callbackRef = useRef(onLongPress);
  const disabledRef = useRef(disabled);

  useLayoutEffect(() => {
    callbackRef.current = onLongPress;
    disabledRef.current = disabled;
  });

  const start = useCallback(() => {
    if (disabledRef.current) return;
    firedRef.current = false;
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      callbackRef.current();
    }, delay);
  }, [delay]);

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const consumeFired = useCallback(() => {
    const was = firedRef.current;
    firedRef.current = false;
    return was;
  }, []);

  return { onPointerDown: start, onPointerUp: cancel, onPointerLeave: cancel, onPointerCancel: cancel, consumeFired };
}
