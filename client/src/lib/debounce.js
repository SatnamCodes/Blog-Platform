/**
 * Minimal trailing-edge debounce, written by hand instead of pulling in
 * lodash.debounce for one function: we only ever need "wait until the user
 * stops typing for N ms, then fire once" (trailing edge), so a full
 * debounce library with leading/maxWait/cancel-on-unmount options etc. is
 * more surface area than this project needs. Trailing-edge specifically
 * (not leading or throttling) is what avoids firing an auto-save request on
 * every keystroke while the user is actively typing - it only fires once
 * input goes quiet.
 */
export function debounce(fn, waitMs) {
  let timeoutId = null;

  function debounced(...args) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      timeoutId = null;
      fn(...args);
    }, waitMs);
  }

  debounced.cancel = () => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = null;
  };

  return debounced;
}
