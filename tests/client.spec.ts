// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { isTouchDevice, watchTouchCapability } from '../src/client/detector.ts'
import { TouchEngine } from '../src/client/touch-engine.ts'
import { injectTouchStyles, removeTouchStyles, TOUCH_OPTIMIZATION_CLASS } from '../src/client/touch-styles.ts'
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

  it('dispatches fast-tap click on button', () => {
    const button = document.createElement('button')
    const clicked = vi.fn()
    button.addEventListener('click', clicked)
    document.body.appendChild(button)

    const engine = new TouchEngine({ maxTapDurationMs: 300 })
    engine.start()
    expect(engine.isRunning()).toBe(true)

    // Simulate clean tap
    const touchStart = new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100, identifier: 1, target: button } as any],
    })
    document.dispatchEvent(touchStart)

    const touchEnd = new TouchEvent('touchend', {
      touches: [],
    })
    document.dispatchEvent(touchEnd)

    expect(clicked).toHaveBeenCalled()

    engine.stop()
    expect(engine.isRunning()).toBe(false)
  })

  it('cancels tap when user scrolls past threshold', () => {
    const button = document.createElement('button')
    const clicked = vi.fn()
    button.addEventListener('click', clicked)
    document.body.appendChild(button)

    const engine = new TouchEngine({ tapThresholdPx: 10 })
    engine.start()

    // Start at 100,100
    document.dispatchEvent(new TouchEvent('touchstart', {
      touches: [{ clientX: 100, clientY: 100, identifier: 1, target: button } as any],
    }))

    // Move to 100,150 (50px scroll)
    document.dispatchEvent(new TouchEvent('touchmove', {
      touches: [{ clientX: 100, clientY: 150, identifier: 1, target: button } as any],
    }))

    // End touch
    document.dispatchEvent(new TouchEvent('touchend', {
      touches: [],
    }))

    expect(clicked).not.toHaveBeenCalled()
    engine.stop()
  })
})

describe('initTouchOptimizer', () => {
  beforeEach(() => {
    removeTouchStyles()
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
