/**
 * Touch styles injected on mobile and touch-enabled devices.
 * Ensures natural momentum scrolling, eliminates hover latency, and provides tactile feedback.
 * @module @anonyjcy/dsh-plugin-mobile-touch/touch-styles
 */

export const TOUCH_OPTIMIZATION_CLASS = 'dsh-touch-optimized'
export const TOUCH_ACTIVE_CLASS = 'dsh-touch-active'

/**
 * CSS text injected for touch & iPad optimization.
 */
export const TOUCH_CSS = `
/* DeepSeek Harness Touch & Mobile Optimization Styles */
html.${TOUCH_OPTIMIZATION_CLASS} {
  -webkit-tap-highlight-color: transparent !important;
}

/* Ensure smooth native momentum scrolling on all scrollable regions */
html.${TOUCH_OPTIMIZATION_CLASS} *,
html.${TOUCH_OPTIMIZATION_CLASS} [data-scroll],
html.${TOUCH_OPTIMIZATION_CLASS} .scrollable {
  -webkit-overflow-scrolling: touch;
}

/* Allow vertical panning across all elements so scrolling is never trapped or hindered */
html.${TOUCH_OPTIMIZATION_CLASS} button,
html.${TOUCH_OPTIMIZATION_CLASS} [role="button"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="treeitem"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="tab"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="menuitem"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="option"],
html.${TOUCH_OPTIMIZATION_CLASS} a,
html.${TOUCH_OPTIMIZATION_CLASS} summary {
  touch-action: pan-y manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
  user-select: none;
  -webkit-user-select: none;
}

/* Instant tactile feedback on touch */
html.${TOUCH_OPTIMIZATION_CLASS} .${TOUCH_ACTIVE_CLASS} {
  opacity: 0.75 !important;
  transition: opacity 0.05s ease-out !important;
}

/* Text inputs and textareas remain fully selectable and vertically pannable */
html.${TOUCH_OPTIMIZATION_CLASS} input[type="text"],
html.${TOUCH_OPTIMIZATION_CLASS} input[type="search"],
html.${TOUCH_OPTIMIZATION_CLASS} input[type="password"],
html.${TOUCH_OPTIMIZATION_CLASS} textarea,
html.${TOUCH_OPTIMIZATION_CLASS} [contenteditable="true"] {
  user-select: text !important;
  -webkit-user-select: text !important;
  touch-action: pan-y !important;
}
`

const STYLE_ELEMENT_ID = 'dsh-touch-optimization-styles'

/**
 * Inject touch styles into document head.
 */
export function injectTouchStyles(): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.add(TOUCH_OPTIMIZATION_CLASS)

  let styleEl = document.getElementById(STYLE_ELEMENT_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ELEMENT_ID
    styleEl.textContent = TOUCH_CSS
    document.head.appendChild(styleEl)
  }
}

/**
 * Remove touch styles from document head.
 */
export function removeTouchStyles(): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.remove(TOUCH_OPTIMIZATION_CLASS)
  const styleEl = document.getElementById(STYLE_ELEMENT_ID)
  if (styleEl) {
    styleEl.remove()
  }
}
