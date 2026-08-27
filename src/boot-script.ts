/**
 * Browser-side inline boot script for DeepSeek Harness touch and iPad optimization.
 * Self-contained IIFE injected into index.html for zero-latency mobile touch enhancement.
 * @module @anonyjcy/dsh-plugin-mobile-touch/boot-script
 */

import type { IndexInjection } from './types.ts'

/**
 * Generate the standalone inline JavaScript code for the touch optimization engine.
 */
export function buildBootScript(): string {
  return `(() => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const TOUCH_OPT_CLASS = 'dsh-touch-optimized';
  const TOUCH_ACTIVE_CLASS = 'dsh-touch-active';
  const STYLE_ID = 'dsh-touch-optimization-styles';

  const TOUCH_CSS = \`
html.\${TOUCH_OPT_CLASS} {
  -webkit-tap-highlight-color: transparent !important;
}
html.\${TOUCH_OPT_CLASS} button,
html.\${TOUCH_OPT_CLASS} [role="button"],
html.\${TOUCH_OPT_CLASS} a,
html.\${TOUCH_OPT_CLASS} input[type="button"],
html.\${TOUCH_OPT_CLASS} input[type="submit"],
html.\${TOUCH_OPT_CLASS} input[type="reset"],
html.\${TOUCH_OPT_CLASS} [role="tab"],
html.\${TOUCH_OPT_CLASS} [role="menuitem"],
html.\${TOUCH_OPT_CLASS} [role="option"],
html.\${TOUCH_OPT_CLASS} [role="switch"],
html.\${TOUCH_OPT_CLASS} summary,
html.\${TOUCH_OPT_CLASS} [data-interactive="true"] {
  touch-action: manipulation !important;
  -webkit-tap-highlight-color: transparent !important;
  user-select: none;
  -webkit-user-select: none;
}
html.\${TOUCH_OPT_CLASS} * {
  -webkit-overflow-scrolling: touch;
}
html.\${TOUCH_OPT_CLASS} .\${TOUCH_ACTIVE_CLASS} {
  opacity: 0.72 !important;
  transform: scale(0.97) !important;
  transition: transform 0.06s cubic-bezier(0.2, 0, 0.2, 1), opacity 0.06s cubic-bezier(0.2, 0, 0.2, 1) !important;
}
html.\${TOUCH_OPT_CLASS} input[type="text"],
html.\${TOUCH_OPT_CLASS} input[type="search"],
html.\${TOUCH_OPT_CLASS} input[type="password"],
html.\${TOUCH_OPT_CLASS} textarea,
html.\${TOUCH_OPT_CLASS} [contenteditable="true"] {
  user-select: text !important;
  -webkit-user-select: text !important;
  touch-action: pan-y !important;
}
\`;

  function isTouchDevice() {
    const hasCoarse = window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);
    const hasTouchPoints = navigator && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
    const hasTouchEvents = 'ontouchstart' in window;
    return Boolean(hasCoarse || hasTouchPoints || hasTouchEvents);
  }

  function injectStyles() {
    document.documentElement.classList.add(TOUCH_OPT_CLASS);
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = TOUCH_CSS;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  function removeStyles() {
    document.documentElement.classList.remove(TOUCH_OPT_CLASS);
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  }

  const SELECTORS = 'button, [role="button"], a, input[type="button"], input[type="submit"], input[type="reset"], input[type="checkbox"], input[type="radio"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], summary, [data-interactive="true"], [data-touch-tap="true"]';

  let activeTouch = null;
  let lastFastTapTime = 0;
  let lastFastTapTarget = null;
  let isRunning = false;

  function onTouchStart(e) {
    if (e.touches.length !== 1) {
      resetTouch();
      return;
    }
    const touch = e.touches[0];
    const target = touch.target instanceof HTMLElement ? touch.target : null;
    if (!target) return;

    const interactive = target.closest(SELECTORS);
    if (interactive) {
      if (interactive.disabled || interactive.getAttribute('aria-disabled') === 'true' || interactive.getAttribute('data-touch-bypass') === 'true') {
        activeTouch = null;
        return;
      }
      interactive.classList.add(TOUCH_ACTIVE_CLASS);
    }

    activeTouch = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
      target,
      interactive: interactive || null,
      identifier: touch.identifier,
      isScroll: false
    };
  }

  function onTouchMove(e) {
    if (!activeTouch) return;
    const touch = Array.from(e.touches).find(t => t.identifier === activeTouch.identifier);
    if (!touch) return;
    const dx = Math.abs(touch.clientX - activeTouch.startX);
    const dy = Math.abs(touch.clientY - activeTouch.startY);
    if (dx > 10 || dy > 10) {
      activeTouch.isScroll = true;
      if (activeTouch.interactive) {
        activeTouch.interactive.classList.remove(TOUCH_ACTIVE_CLASS);
      }
    }
  }

  function onTouchEnd(e) {
    if (!activeTouch) return;
    const { interactive, isScroll, startTime } = activeTouch;
    const duration = Date.now() - startTime;

    if (interactive) {
      setTimeout(() => { interactive.classList.remove(TOUCH_ACTIVE_CLASS); }, 70);
    }

    if (!isScroll && duration <= 350 && interactive) {
      const now = Date.now();
      lastFastTapTime = now;
      lastFastTapTarget = interactive;

      const isInput = interactive.tagName === 'INPUT' || interactive.tagName === 'SELECT' || interactive.tagName === 'TEXTAREA';
      if (!isInput) {
        interactive.focus && interactive.focus();
        interactive.click();
      }
    }
    activeTouch = null;
  }

  function onTouchCancel() {
    resetTouch();
  }

  function onClickCapture(e) {
    const now = Date.now();
    if (lastFastTapTarget && now - lastFastTapTime < 350 && (e.target === lastFastTapTarget || lastFastTapTarget.contains(e.target))) {
      lastFastTapTime = 0;
      lastFastTapTarget = null;
    }
  }

  function resetTouch() {
    if (activeTouch && activeTouch.interactive) {
      activeTouch.interactive.classList.remove(TOUCH_ACTIVE_CLASS);
    }
    activeTouch = null;
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    injectStyles();
    document.addEventListener('touchstart', onTouchStart, { passive: true, capture: true });
    document.addEventListener('touchmove', onTouchMove, { passive: true, capture: true });
    document.addEventListener('touchend', onTouchEnd, { passive: false, capture: true });
    document.addEventListener('touchcancel', onTouchCancel, { passive: true, capture: true });
    document.addEventListener('click', onClickCapture, { capture: true });
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    document.removeEventListener('touchstart', onTouchStart, { capture: true });
    document.removeEventListener('touchmove', onTouchMove, { capture: true });
    document.removeEventListener('touchend', onTouchEnd, { capture: true });
    document.removeEventListener('touchcancel', onTouchCancel, { capture: true });
    document.removeEventListener('click', onClickCapture, { capture: true });
    removeStyles();
    resetTouch();
  }

  // Device detection and activation
  if (isTouchDevice()) {
    start();
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(pointer: coarse)');
    const handleMQ = (ev) => {
      if (ev.matches || isTouchDevice()) start();
      else stop();
    };
    if (mq.addEventListener) mq.addEventListener('change', handleMQ);
    else if (mq.addListener) mq.addListener(handleMQ);
  }
})();`
}

/**
 * Build the IndexInjection descriptor for DSH webserver.
 */
export function bootTouchInjection(): IndexInjection {
  return {
    kind: 'script',
    placement: 'head',
    text: buildBootScript(),
  }
}
