/**
 * Touch tactile and gesture engine.
 * Provides instant active tactile feedback while preserving smooth, unhindered native momentum scrolling.
 * @module @anonyjcy/dsh-plugin-mobile-touch/touch-engine
 */

import { TOUCH_ACTIVE_CLASS } from './touch-styles.ts'

export interface TouchEngineOptions {
  /** Movement threshold in pixels before removing press feedback. Default: 6 */
  scrollThresholdPx?: number
}

const INTERACTIVE_SELECTORS = [
  'button',
  '[role="button"]',
  '[role="treeitem"]',
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
].join(', ')

interface TouchTracker {
  startX: number
  startY: number
  interactiveTarget: HTMLElement | null
  identifier: number
}

/**
 * Touch gesture engine for mobile and iPad.
 * Keeps touch response immediate and natural without blocking browser momentum scrolling.
 */
export class TouchEngine {
  private activeTouch: TouchTracker | null = null
  private enabled = false
  private cleanupFns: Array<() => void> = []
  private readonly scrollThreshold: number

  constructor(options: TouchEngineOptions = {}) {
    this.scrollThreshold = options.scrollThresholdPx ?? 6
  }

  /**
   * Start touch engine.
   */
  public start(): void {
    if (this.enabled || typeof window === 'undefined' || typeof document === 'undefined') {
      return
    }

    this.enabled = true

    const onTouchStart = (e: TouchEvent) => { this.handleTouchStart(e) }
    const onTouchMove = (e: TouchEvent) => { this.handleTouchMove(e) }
    const onTouchEnd = (_e: TouchEvent) => { this.handleTouchEnd() }
    const onTouchCancel = (_e: TouchEvent) => { this.handleTouchEnd() }

    // All passive listeners to ensure 60fps buttery-smooth native scrolling everywhere
    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    document.addEventListener('touchcancel', onTouchCancel, { passive: true })

    this.cleanupFns.push(() => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchmove', onTouchMove)
      document.removeEventListener('touchend', onTouchEnd)
      document.removeEventListener('touchcancel', onTouchCancel)
    })
  }

  /**
   * Stop touch engine.
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
   * Check whether the engine is running.
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

    const interactiveTarget = target.closest<HTMLElement>(INTERACTIVE_SELECTORS)

    if (interactiveTarget) {
      const isDisabled = (interactiveTarget as HTMLButtonElement).disabled ||
        interactiveTarget.getAttribute('aria-disabled') === 'true' ||
        interactiveTarget.getAttribute('data-touch-bypass') === 'true'

      if (!isDisabled) {
        interactiveTarget.classList.add(TOUCH_ACTIVE_CLASS)
      }
    }

    this.activeTouch = {
      startX: touch.clientX,
      startY: touch.clientY,
      interactiveTarget: interactiveTarget ?? null,
      identifier: touch.identifier,
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.activeTouch) return

    const touch = Array.from(e.touches).find(t => t.identifier === this.activeTouch?.identifier)
    if (!touch) return

    const deltaX = Math.abs(touch.clientX - this.activeTouch.startX)
    const deltaY = Math.abs(touch.clientY - this.activeTouch.startY)

    // User is scrolling: immediately remove active feedback so scrolling is clean
    if (deltaX > this.scrollThreshold || deltaY > this.scrollThreshold) {
      this.resetActiveTouch()
    }
  }

  private handleTouchEnd(): void {
    if (this.activeTouch?.interactiveTarget) {
      const el = this.activeTouch.interactiveTarget
      setTimeout(() => {
        el.classList.remove(TOUCH_ACTIVE_CLASS)
      }, 60)
    }
    this.activeTouch = null
  }

  private resetActiveTouch(): void {
    if (this.activeTouch?.interactiveTarget) {
      this.activeTouch.interactiveTarget.classList.remove(TOUCH_ACTIVE_CLASS)
    }
    this.activeTouch = null
  }
}
