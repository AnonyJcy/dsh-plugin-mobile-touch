/**
 * Focus and soft keyboard auto-popup guard for touch and mobile devices.
 * Prevents non-user-initiated programmatic focus calls (e.g. Session switch effects)
 * from automatically raising the virtual keyboard on iPad / iOS.
 * @module @anonyjcy/dsh-plugin-mobile-touch/focus-guard
 */

let originalTextareaFocus: ((options?: FocusOptions) => void) | null = null
let originalInputFocus: ((options?: FocusOptions) => void) | null = null

let lastDirectTouchTime = 0
let lastDirectTouchTarget: HTMLElement | null = null
let guardActive = false
let removeTouchListener: (() => void) | null = null

/**
 * Install the keyboard auto-popup guard on touch/mobile devices.
 */
export function installFocusGuard(): void {
  if (guardActive || typeof window === 'undefined' || typeof document === 'undefined') {
    return
  }

  guardActive = true

  // Record user direct touch interaction
  const onDirectTouch = (e: TouchEvent | PointerEvent) => {
    if (e.target instanceof HTMLElement) {
      lastDirectTouchTarget = e.target
      lastDirectTouchTime = Date.now()
    }
  }

  document.addEventListener('touchstart', onDirectTouch, { capture: true, passive: true })
  document.addEventListener('pointerdown', onDirectTouch, { capture: true, passive: true })

  removeTouchListener = () => {
    document.removeEventListener('touchstart', onDirectTouch, { capture: true })
    document.removeEventListener('pointerdown', onDirectTouch, { capture: true })
  }

  // Hook HTMLTextAreaElement.prototype.focus
  if (typeof HTMLTextAreaElement !== 'undefined' && !originalTextareaFocus) {
    originalTextareaFocus = HTMLTextAreaElement.prototype.focus
    HTMLTextAreaElement.prototype.focus = function (this: HTMLTextAreaElement, options?: FocusOptions): void {
      const isDirectUserAction = (Date.now() - lastDirectTouchTime < 400) &&
        (lastDirectTouchTarget === this || this.contains(lastDirectTouchTarget))
      const isAlreadyFocused = document.activeElement === this

      // Only allow focus if user directly tapped this textarea or it is already active
      if (isDirectUserAction || isAlreadyFocused) {
        originalTextareaFocus?.call(this, options)
      } else {
        // Suppress programmatic auto-focus on mobile to prevent virtual keyboard pop-up
      }
    }
  }

  // Hook HTMLInputElement.prototype.focus for text/search inputs
  if (typeof HTMLInputElement !== 'undefined' && !originalInputFocus) {
    originalInputFocus = HTMLInputElement.prototype.focus
    HTMLInputElement.prototype.focus = function (this: HTMLInputElement, options?: FocusOptions): void {
      const type = (this.type || '').toLowerCase()
      const isTextInput = type === 'text' || type === 'search' || type === 'password' || type === 'email' || type === 'url'

      if (!isTextInput) {
        originalInputFocus?.call(this, options)
        return
      }

      const isDirectUserAction = (Date.now() - lastDirectTouchTime < 400) &&
        (lastDirectTouchTarget === this || this.contains(lastDirectTouchTarget))
      const isAlreadyFocused = document.activeElement === this

      if (isDirectUserAction || isAlreadyFocused) {
        originalInputFocus?.call(this, options)
      } else {
        // Suppress programmatic text input focus
      }
    }
  }
}

/**
 * Uninstall the keyboard auto-popup guard.
 */
export function uninstallFocusGuard(): void {
  if (!guardActive) return
  guardActive = false

  if (removeTouchListener) {
    removeTouchListener()
    removeTouchListener = null
  }

  if (originalTextareaFocus && typeof HTMLTextAreaElement !== 'undefined') {
    HTMLTextAreaElement.prototype.focus = originalTextareaFocus
    originalTextareaFocus = null
  }

  if (originalInputFocus && typeof HTMLInputElement !== 'undefined') {
    HTMLInputElement.prototype.focus = originalInputFocus
    originalInputFocus = null
  }
}
