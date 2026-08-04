import { useEffect, useRef } from 'react';

/**
 * Calls `onIdle` after `ms` of no user activity. Any mouse/keyboard/touch
 * interaction resets the timer (throttled to once per second).
 */
export function useIdleTimeout(ms: number, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let lastReset = 0;

    const arm = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => onIdleRef.current(), ms);
    };

    const onActivity = () => {
      const now = Date.now();
      if (now - lastReset < 1000) return; // throttle
      lastReset = now;
      arm();
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    arm();

    return () => {
      if (timer) clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, onActivity));
    };
  }, [ms]);
}
