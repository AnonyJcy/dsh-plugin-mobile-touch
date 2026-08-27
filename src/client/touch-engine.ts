/**
 * Core fast-tap and touch event dispatcher.
 * Bypasses WebKit's two-tap hover simulation and delivers instant click activation on touch screens.
 * @module @anonyjcy/dsh-plugin-mobile-touch/touch-engine
 */

import { TOUCH_ACTIVE_CLASS } from './touch-styles.ts'

export interface TouchEngineOptions {
  /** Movement threshold in pixels before a tap is considered a scroll/drag gesture. Default: 10 */
  tapThresholdPx?: number
  /** Maximum duration in ms for an interaction to be considered a tap. Default: 350 */
  maxTapDurationMs?: number
  /** Duration in ms to debounce duplicate native clicks following a fast tap. Default: 350 */
  clickDebounceMs?: number
}

const INTERACTIVE_SELECTORS = [
  'button',
  '[role="button"]',
  'a',
  'input[type="button"]',
  'input[type="submit"]',
  'input[type="reset"]',
  'input[type="checkbox"]',
  'input[type="radio"]',
  '[role="tab"]',
  '[role="menuitem"]',
  '[role="option"]',
  '[role="switch"]',
  'summary',
  '[data-interactive="true"]',
  '[data-touch-tap="true"]',
].join(', ')

interface TouchTracker {
  startX: number
  startY: number
  startTime: number
  target: HTMLElement | null
  interactiveTarget: HTMLElement | null
  identifier: number
  isScroll: boolean
}

/**
 * Fast-tap engine that binds to the window/document to ensure instant, reliable click delivery on touch devices.
 */
export class TouchEngine {
  private activeTouch: TouchTracker | null = null
  private lastFastTapTime = 0
  private lastFastTapTarget: HTMLElement | null = null
  private enabled = false
  private cleanupFns: Array<() => void> = []

  private readonly tapThreshold: number
  private readonly maxTapDuration: number
  private readonly clickDebounce: number

  constructor(options: TouchEngineOptions = {}) {
    this.tapThreshold = options.tapThresholdPx ?? 10
    this.maxTapDuration = options.maxTapDurationMs ?? 350
    this.clickDebounce = options.clickDebounceMs ?? 350
  }

  /**
   * Start listening for touch events and optimizing tap response.
   */
  public start(): void {
    if (this.enabled || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    this.enabled = true

    const onTouchStart = (e: TouchEvent) => { this.handleTouchStart(e) }
    const onTouchMove = (e: TouchEvent) => { this.handleTouchMove(e) }
    const onTouchEnd = (e: TouchEvent) => { this.handleTouchEnd(e) }
    const onTouchCancel = (e: TouchEvent) => { this.handleTouchCancel(e) }
    const onClickCapture = (e: MouseEvent) => { this.handleClickCapture(e) }

    // Use passive true for start/move/end so scrolling performance is never hindered
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true })
    document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true })
    document.addEventListener('click', onClickCapture, { capture: true })

    this.cleanupFns.push(() => {
      document.removeEventListener('touchstart', onTouchStart, { capture: true })
      document.removeEventListener('touchmove', onTouchMove, { capture: true })
      document.removeEventListener('touchend', onTouchEnd, { capture: true })
      document.removeEventListener('touchcancel', onTouchCancel, { capture: true })
      document.removeEventListener('click', onClickCapture, { capture: true })
    })
  }

  /**
   * Stop touch listening and clean up all resources.
   */
  public stop(): void {
    if (!this.enabled) return
    this.enabled = false
    for (const fn of this.cleanupFns) {
      fn()
    }
    this.cleanupFns = []
    this.resetActiveTouch()
  }

  /**
   * Check whether the engine is currently active.
   */
  public isRunning(): boolean {
    return this.enabled
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length !== 1) {
      this.resetActiveTouch()
      return
    }

    const touch = e.touches[0]
    const target = touch.target instanceof HTMLElement ? touch.target : null
    if (!target) return

    // Find interactive container
    const interactiveTarget = target.closest<HTMLElement>(INTERACTIVE_SELECTORS)

    // Check if element is disabled or explicitly bypasses touch optimization
    if (interactiveTarget) {
      const isDisabled = (interactiveTarget as HTMLButtonElement).disabled ||
        interactiveTarget.getAttribute('aria-disabled') === 'true' ||
        interactiveTarget.getAttribute('data-touch-bypass') === 'true'

      if (isDisabled) {
        this.activeTouch = null
        return
      }

      // Add instant visual tactile feedback
      interactiveTarget.classList.add(TOUCH_ACTIVE_CLASS)
    }

    this.activeTouch = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      target,
      interactiveTarget: interactiveTarget ?? null,
      identifier: touch.identifier,
      isScroll: false,
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.activeTouch) return

    const touch = Array.from(e.touches).find(t => t.identifier === this.activeTouch?.identifier)
    if (!touch) return

    const deltaX = Math.abs(touch.clientX - this.activeTouch.startX)
    const deltaY = Math.abs(touch.clientY - this.activeTouch.startY)

    if (deltaX > this.tapThreshold || deltaY > this.tapThreshold) {
      this.activeTouch.isScroll = true
      if (this.activeTouch.interactiveTarget) {
        this.activeTouch.interactiveTarget.classList.remove(TOUCH_ACTIVE_CLASS)
      }
    }
  }

  private handleTouchEnd(e: TouchEvent): void {
    if (!this.activeTouch) return

    const { interactiveTarget, isScroll, startTime } = this.activeTouch
    const duration = Date.now() - startTime

    // Clean up active tactile feedback
    if (interactiveTarget) {
      setTimeout(() => {
        interactiveTarget.classList.remove(TOUCH_ACTIVE_CLASS)
      }, 70)
    }

    // Clean tap qualification: not scrolled, short duration, interactive target present
    if (!isScroll && duration <= this.maxTapDuration && interactiveTarget) {
      const now = Date.now()
      this.lastFastTapTime = now
      this.lastFastTapTarget = interactiveTarget

      // Check if target is a standard HTML form element that handles its own activation
      const isNativeFormInput = interactiveTarget.tagName === 'INPUT' ||
        interactiveTarget.tagName === 'SELECT' ||
        interactiveTarget.tagName === 'TEXTAREA'

      if (!isNativeFormInput) {
        // Trigger fast click dispatch to bypass WebKit hover intercept
        interactiveTarget.focus?.()
        interactiveTarget.click()
      }
    }

    this.activeTouch = null
  }

  private handleTouchCancel(_e: TouchEvent): void {
    this.resetActiveTouch()
  }

  private handleClickCapture(e: MouseEvent): void {
    // If native synthetic click arrives right after our fast tap on the same target,
    // let it pass normally without duplicate action.
    const now = Date.now()
    if (
      this.lastFastTapTarget &&
      now - this.lastFastTapTime < this.clickDebounce &&
      (e.target === this.lastFastTapTarget || this.lastFastTapTarget.contains(e.target as Node))
    ) {
      // Handled cleanly
      this.lastFastTapTime = 0
      this.lastFastTapTarget = null
    }
  }

  private resetActiveTouch(): void {
    if (this.activeTouch?.interactiveTarget) {
      this.activeTouch.interactiveTarget.classList.remove(TOUCH_ACTIVE_CLASS)
    }
    this.activeTouch = null
  }
}
