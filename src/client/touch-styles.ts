/**
 * Touch styles injected on mobile and touch-enabled devices.
 * Eliminates 300ms click delay, iOS tap highlight flash, and optimizes touch ergonomics.
 * @module @anonyjcy/dsh-plugin-mobile-touch/touch-styles
 */

export const TOUCH_OPTIMIZATION_CLASS = 'dsh-touch-optimized'
export const TOUCH_ACTIVE_CLASS = 'dsh-touch-active'

/**
 * CSS text to inject when touch mode is active.
 */
export const TOUCH_CSS = `
/* DeepSeek Harness Touch & Mobile Optimization Styles */
html.${TOUCH_OPTIMIZATION_CLASS} {
  -webkit-tap-highlight-color: transparent !important;
}

/* Eliminate tap delay and unwanted gestures on interactive controls */
html.${TOUCH_OPTIMIZATION_CLASS} button,
html.${TOUCH_OPTIMIZATION_CLASS} [role="button"],
html.${TOUCH_OPTIMIZATION_CLASS} a,
html.${TOUCH_OPTIMIZATION_CLASS} input[type="button"],
html.${TOUCH_OPTIMIZATION_CLASS} input[type="submit"],
html.${TOUCH_OPTIMIZATION_CLASS} input[type="reset"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="tab"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="menuitem"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="option"],
html.${TOUCH_OPTIMIZATION_CLASS} [role="switch"],
html.${TOUCH_OPTIMIZATION_CLASS} summary,
html.${TOUCH_OPTIMIZATION_CLASS} [data-interactive="true"] {
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
  user-select: none;
  -webkit-user-select: none;
}

/* Smooth kinetic scrolling across all scrollable regions */
html.${TOUCH_OPTIMIZATION_CLASS} * {
  -webkit-overflow-scrolling: touch;
}

/* Instant visual tactile feedback when tapped on touch devices */
html.${TOUCH_OPTIMIZATION_CLASS} .${TOUCH_ACTIVE_CLASS} {
  opacity: 0.72 !important;
  transform: scale(0.97) !important;
  transition: transform 0.06s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.06s cubic-bezier(0.2, 0, 0.2, 1) !important;
}

/* Ensure text areas and input inputs remain selectable */
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
 * Inject touch styles into the document head if not already present.
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
 * Remove touch styles from document head and remove class from html root.
 */
export function removeTouchStyles(): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.remove(TOUCH_OPTIMIZATION_CLASS)
  const styleEl = document.getElementById(STYLE_ELEMENT_ID)
  if (styleEl) {
    styleEl.remove()
  }
}
