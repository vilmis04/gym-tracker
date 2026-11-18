import { useCallback, useEffect, useRef } from "react";

/**
 * Press-and-hold repeat for the −/+ buttons: `start(repeatStep)` calls
 * `repeatStep` after AUTO_REPEAT_DELAYS_MS.initial, then again and again at
 * shrinking intervals (getAutoRepeatDelay) until `stop()`, until
 * `repeatStep` returns `false` (a bound was reached) or the component
 * unmounts. The first step on press is the caller's.
 */
export function useAutoRepeat() {
  const timeoutIdRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = useCallback(() => {
    if (timeoutIdRef.current === null) return;
    clearTimeout(timeoutIdRef.current);
    timeoutIdRef.current = null;
  }, []);

  const start = useCallback(
    (repeatStep: () => boolean) => {
      stop();
      const scheduleRepeat = (repeatIndex: number) => {
        timeoutIdRef.current = setTimeout(() => {
          timeoutIdRef.current = null;
          if (repeatStep()) scheduleRepeat(repeatIndex + 1);
        }, getAutoRepeatDelay(repeatIndex));
      };
      scheduleRepeat(0);
    },
    [stop],
  );

  useEffect(() => stop, [stop]);

  return { start, stop };
}

/**
 * Milliseconds before repeat number `repeatIndex` (0 = the first repeat):
 * a pause that tells a tap from a hold, then intervals that shrink by 15 %
 * per repeat down to a floor, so a 2 s hold makes about 20 steps and keeps
 * speeding up (400 → 200, 170, 145 … 50 ms).
 */
export function getAutoRepeatDelay(repeatIndex: number): number {
  if (repeatIndex === 0) return AUTO_REPEAT_DELAYS_MS.initial;
  return Math.max(
    AUTO_REPEAT_DELAYS_MS.fastest,
    Math.round(
      AUTO_REPEAT_DELAYS_MS.firstInterval *
        AUTO_REPEAT_ACCELERATION ** (repeatIndex - 1),
    ),
  );
}

const AUTO_REPEAT_DELAYS_MS = {
  initial: 400,
  firstInterval: 200,
  fastest: 50,
} as const;

const AUTO_REPEAT_ACCELERATION = 0.85;
