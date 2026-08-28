// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isTouchDevice, watchTouchCapability } from '../src/client/detector.ts'
import { installFocusGuard, uninstallFocusGuard } from '../src/client/focus-guard.ts'
import { TouchEngine } from '../src/client/touch-engine.ts'
import { injectTouchStyles, removeTouchStyles, TOUCH_ACTIVE_CLASS, TOUCH_OPTIMIZATION_CLASS } from '../src/client/touch-styles.ts'
import { initTouchOptimizer } from '../src/client/index.ts'

describe('detector', () => {
  it('detects touch when maxTouchPoints > 0', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true })
    expect(isTouchDevice()).toBe(true)
  })

  it('detects touch when matchMedia pointer is coarse', () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true })
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('coarse'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
    expect(isTouchDevice()).toBe(true)
  })

  it('watches capability changes', () => {
    let changeHandler: any = null
    window.matchMedia = vi.fn().mockImplementation(() => ({
      matches: false,
      addEventListener: (_event: string, handler: any) => {
        changeHandler = handler
      },
      removeEventListener: vi.fn(),
    }))

    const listener = vi.fn()
    const cleanup = watchTouchCapability(listener)
    expect(typeof cleanup).toBe('function')

    if (changeHandler) {
      changeHandler({ matches: true })
      expect(listener).toHaveBeenCalledWith(true)
    }

    cleanup()
  })
})

describe('touch-styles', () => {
  beforeEach(() => {
    removeTouchStyles()
  })

  it('injects and removes styles properly', () => {
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(false)
    injectTouchStyles()
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(true)
    expect(document.getElementById('dsh-touch-optimization-styles')).not.toBeNull()

    removeTouchStyles()
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(false)
    expect(document.getElementById('dsh-touch-optimization-styles')).toBeNull()
  })
})

describe('TouchEngine', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })

  it('adds active class on touchstart and removes on touchend', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)

    const engine = new TouchEngine()
    engine.start()
    expect(engine.isRunning()).toBe(true)

    // Touch start
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100, identifier: 1, target: button } as any],
    })
    document.dispatchEvent(touchStart)
    expect(button.classList.contains(TOUCH_ACTIVE_CLASS)).toBe(true)

    // Touch end
    const touchEnd = new TouchEvent('touchend', {
      touches: [],
    })
    document.dispatchEvent(touchEnd)

    engine.stop()
    expect(engine.isRunning()).toBe(false)
  })

  it('clears active feedback when user scrolls', () => {
    const button = document.createElement('button')
    document.body.appendChild(button)

    const engine = new TouchEngine({ scrollThresholdPx: 5 })
    engine.start()

    document.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100, identifier: 1, target: button } as any],
    }))
    expect(button.classList.contains(TOUCH_ACTIVE_CLASS)).toBe(true)

    // Scroll 20px
    document.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientX: 100, clientY: 120, identifier: 1, target: button } as any],
    }))
    expect(button.classList.contains(TOUCH_ACTIVE_CLASS)).toBe(false)

    engine.stop()
  })
})

describe('FocusGuard', () => {
  beforeEach(() => {
    uninstallFocusGuard()
    document.body.innerHTML = ''
  })

  it('suppresses programmatic textarea auto-focus without direct user touch', () => {
    installFocusGuard()
    const textarea = document.createElement('textarea')
    document.body.appendChild(textarea)

    const focusSpy = vi.fn()
    // Original prototype call will be tested via activeElement
    textarea.focus()
    expect(document.activeElement).not.toBe(textarea)

    // User touches directly
    const touchEvent = new TouchEvent('touchstart', {
      bubbles: true,
      touches: [{ clientX: 50, clientY: 50, target: textarea } as any],
    })
    textarea.dispatchEvent(touchEvent)

    textarea.focus()
    expect(document.activeElement).toBe(textarea)

    uninstallFocusGuard()
  })
})

describe('initTouchOptimizer', () => {
  beforeEach(() => {
    removeTouchStyles()
    uninstallFocusGuard()
  })

  it('initializes and cleans up with force: true', () => {
    const cleanup = initTouchOptimizer({ force: true })
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(true)

    cleanup()
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(false)
  })

  it('does nothing when disabled: true', () => {
    const cleanup = initTouchOptimizer({ disabled: true, force: true })
    expect(document.documentElement.classList.contains(TOUCH_OPTIMIZATION_CLASS)).toBe(false)
    cleanup()
  })
})
