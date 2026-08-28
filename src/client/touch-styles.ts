/**
 * Touch styles injected on mobile and touch-enabled devices.
 * @module @anonyjcy/dsh-plugin-mobile-touch/touch-styles
 */

export const TOUCH_OPTIMIZATION_CLASS = 'dsh-touch-optimized'
export const TOUCH_ACTIVE_CLASS = 'dsh-touch-active'
export const STYLE_ID = 'dsh-touch-optimization-styles'

/**
 * CSS text injected for touch & iPad optimization.
 */
export const TOUCH_CSS = `
/* 1. Viewport lock: prevent whole-page rubberband bounce */
html.${TOUCH_OPTIMIZATION_CLASS},
html.${TOUCH_OPTIMIZATION_CLASS} body {
  width: 100% !important;
  height: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
  overscroll-behavior: none !important;
  overscroll-behavior-y: none !important;
  -webkit-tap-highlight-color: transparent !important;
}

/* 2. Neutralize HTML5 drag interference on touch */
html.${TOUCH_OPTIMIZATION_CLASS} *,
[draggable] {
  -webkit-user-drag: none !important;
  user-drag: none !important;
  -webkit-touch-callout: none !important;
}

/* 3. Sidebar list scrolling & accurate native scrollbar */
html.${TOUCH_OPTIMIZATION_CLASS} [role="tree"],
html.${TOUCH_OPTIMIZATION_CLASS} [class*="list"] {
  -webkit-overflow-scrolling: touch !important;
  overflow-y: auto !important;
  overscroll-behavior: contain !important;
  touch-action: pan-y !important;
  padding-bottom: 48px !important;
  scrollbar-gutter: auto !important;
  --dsh-scrollbar-thumb: rgba(140, 140, 145, 0.45) !important;
  --dsh-scrollbar-thumb-hover: rgba(140, 140, 145, 0.75) !important;
  scrollbar-color: rgba(140, 140, 145, 0.45) transparent !important;
  scrollbar-width: thin !important;
}
html.${TOUCH_OPTIMIZATION_CLASS} [class*="list"]::-webkit-scrollbar,
html.${TOUCH_OPTIMIZATION_CLASS} [role="tree"]::-webkit-scrollbar {
  display: block !important;
  width: 4px !important;
}
html.${TOUCH_OPTIMIZATION_CLASS} [class*="list"]::-webkit-scrollbar-track,
html.${TOUCH_OPTIMIZATION_CLASS} [role="tree"]::-webkit-scrollbar-track {
  background: transparent !important;
}
html.${TOUCH_OPTIMIZATION_CLASS} [class*="list"]::-webkit-scrollbar-thumb,
html.${TOUCH_OPTIMIZATION_CLASS} [role="tree"]::-webkit-scrollbar-thumb {
  border-radius: 4px !important;
  background: rgba(140, 140, 145, 0.45) !important;
}

/* 4. Allow vertical pan on all list children */
html.${TOUCH_OPTIMIZATION_CLASS} [role="tree"] *,
html.${TOUCH_OPTIMIZATION_CLASS} [class*="list"] *,
html.${TOUCH_OPTIMIZATION_CLASS} [class*="sessionRow"],
html.${TOUCH_OPTIMIZATION_CLASS} [class*="projectRow"] {
  touch-action: pan-y !important;
}

/* 5. Hide bottom masking fade gradient */
html.${TOUCH_OPTIMIZATION_CLASS} [class*="fade"] {
  display: none !important;
}

/* 6. Button and interactive element press feedback */
html.${TOUCH_OPTIMIZATION_CLASS} button:active,
html.${TOUCH_OPTIMIZATION_CLASS} [role="button"]:active,
html.${TOUCH_OPTIMIZATION_CLASS} [role="treeitem"]:active {
  opacity: 0.72 !important;
  transition: opacity 0.05s ease-out !important;
}
`

/**
 * Inject touch styles into document head.
 */
export function injectTouchStyles(): void {
  if (typeof document === 'undefined') return

  document.documentElement.classList.add(TOUCH_OPTIMIZATION_CLASS)

  let styleEl = document.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = STYLE_ID
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
  const styleEl = document.getElementById(STYLE_ID)
  if (styleEl) {
    styleEl.remove()
  }
}
