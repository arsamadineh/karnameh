import { createSignal, getOwner, onCleanup, runWithOwner } from 'solid-js';

/**
 * A reactive wrapper around `window.matchMedia`.
 *
 * Returns a Solid accessor that reflects whether the given media query
 * currently matches, and stays in sync when the viewport changes. Safe to call
 * either inside a component or at module top-level (SSR/prerender safe):
 * the listener is only attached in the browser.
 *
 * When called within a reactive owner (a component), the MediaQueryList
 * listener is automatically removed on cleanup. At module scope the listener
 * lives for the page lifetime (acceptable for a single-window app).
 *
 * Usage:
 *   const isMobile = createMediaQuery('(max-width: 767px)');
 *   isMobile(); // => boolean
 */
export function createMediaQuery(query: string): () => boolean {
  const [matches, setMatches] = createSignal(false);

  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);

    // Modern API, with legacy fallback for older WebKit.
    if (typeof mql.addEventListener === 'function') {
      mql.addEventListener('change', handler);
    } else {
      mql.addListener(handler);
    }

    // Register cleanup only when a reactive owner is present (component scope).
    const owner = getOwner();
    if (owner) {
      runWithOwner(owner, () => {
        onCleanup(() => {
          if (typeof mql.removeEventListener === 'function') {
            mql.removeEventListener('change', handler);
          } else {
            mql.removeListener(handler);
          }
        });
      });
    }
  }

  return matches;
}
