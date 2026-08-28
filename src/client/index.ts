/**
 * DeepSeek Harness Touch & Mobile Optimization Client Entry.
 * Automatically detects iPad/mobile devices and activates touch optimizations.
 * @module @anonyjcy/dsh-plugin-mobile-touch/client
 */

import { isTouchDevice, watchTouchCapability } from './detector.ts'
import { installFocusGuard, uninstallFocusGuard } from './focus-guard.ts'
import { TouchEngine, type TouchEngineOptions } from './touch-engine.ts'
import { injectTouchStyles, removeTouchStyles } from './touch-styles.ts'

export { isTouchDevice, watchTouchCapability } from './detector.ts'
export { installFocusGuard, uninstallFocusGuard } from './focus-guard.ts'
export { TouchEngine, type TouchEngineOptions } from './touch-engine.ts'
export { injectTouchStyles, removeTouchStyles, TOUCH_ACTIVE_CLASS, TOUCH_OPTIMIZATION_CLASS } from './touch-styles.ts'

export interface TouchOptimizerConfig extends TouchEngineOptions {
  /** Force activation regardless of hardware detection. Default: false */
  force?: boolean
  /** Disable automatic activation. Default: false */
  disabled?: boolean
}

let activeEngine: TouchEngine | null = null
let unwatch: (() => void) | null = null

/**
 * Initialize and activate touch optimization.
 * Checks for touch hardware / mobile environment before enabling unless `force` is set.
 *
 * @param config - optional configuration.
 * @returns cleanup function.
 */
export function initTouchOptimizer(config: TouchOptimizerConfig = {}): () => void {
  if (config.disabled) {
    if (activeEngine) {
      activeEngine.stop()
      activeEngine = null
    }
    uninstallFocusGuard()
    removeTouchStyles()
    return () => {}
  }

  const shouldActivate = config.force || isTouchDevice()

  const activate = () => {
    injectTouchStyles()
    installFocusGuard()
    if (!activeEngine?.isRunning()) {
      activeEngine = new TouchEngine(config)
      activeEngine.start()
    }
  }

  const deactivate = () => {
    if (activeEngine) {
      activeEngine.stop()
      activeEngine = null
    }
    uninstallFocusGuard()
    removeTouchStyles()
  }

  if (shouldActivate) {
    activate()
  }

  if (!config.force) {
    unwatch = watchTouchCapability((isTouch) => {
      if (isTouch) {
        activate()
      } else {
        deactivate()
      }
    })
  }

  return () => {
    if (unwatch) {
      unwatch()
      unwatch = null
    }
    deactivate()
  }
}

/**
 * Client plugin apply hook for DeepSeek Harness Web client architecture.
 */
export function apply(): void {
  initTouchOptimizer()
}

// Auto-run in browser environment when loaded directly via script/bundle
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTouchOptimizer()
    })
  } else {
    initTouchOptimizer()
  }
}

export default {
  apply,
  initTouchOptimizer,
}
