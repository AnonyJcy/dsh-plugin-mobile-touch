/**
 * Touch and mobile device detection utilities.
 * @module @anonyjcy/dsh-plugin-mobile-touch/detector
 */

/**
 * Check whether the current browser environment is a touch/mobile screen.
 * Evaluates hardware features, coarse pointer media queries, and touch points.
 * Fully compatible with iPadOS desktop-mode Safari.
 *
 * @returns true if the environment has touch/coarse pointer capabilities.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false

  // 1. Coarse pointer (primary pointing device is coarse like a finger)
  const hasCoarsePointer = typeof window.matchMedia === 'function' &&
    (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches)

  // 2. Multi-touch points (covers iPad with desktop UA where navigator.maxTouchPoints > 1)
  const hasMaxTouchPoints = typeof navigator !== 'undefined' &&
    typeof navigator.maxTouchPoints === 'number' &&
    navigator.maxTouchPoints > 0

  // 3. Legacy touch event support
  const hasTouchEvents = 'ontouchstart' in window

  return Boolean(hasCoarsePointer || hasMaxTouchPoints || hasTouchEvents)
}

/**
 * Watch for device capability changes (e.g. external mouse/trackpad attached to iPad).
 * @param callback - function invoked with the new isTouch state.
 * @returns cleanup function.
 */
export function watchTouchCapability(callback: (isTouch: boolean) => void): () => void {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return () => {}
  }

  const query = window.matchMedia('(pointer: coarse)')
  const listener = (event: MediaQueryListEvent) => {
    callback(event.matches || isTouchDevice())
  }

  if (typeof query.addEventListener === 'function') {
    query.addEventListener('change', listener)
    return () => { query.removeEventListener('change', listener) }
  } else if (typeof query.addListener === 'function') {
    query.addListener(listener)
    return () => { query.removeListener(listener) }
  }

  return () => {}
}
