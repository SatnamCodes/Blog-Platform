import { useEffect, useMemo, useRef } from 'react';
import { debounce } from '../lib/debounce.js';

/**
 * Wraps a callback in a trailing-edge debounce that stays stable across
 * renders (via a ref to the latest callback) and cancels any pending call
 * on unmount so we never auto-save after a component has gone away.
 */
export function useDebouncedCallback(callback, waitMs) {
  const callbackRef = useRef(callback);
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const debounced = useMemo(
    () => debounce((...args) => callbackRef.current(...args), waitMs),
    [waitMs]
  );

  useEffect(() => () => debounced.cancel(), [debounced]);

  return debounced;
}
