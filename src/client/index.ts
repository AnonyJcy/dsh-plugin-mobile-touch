// Pure classic script for DSH ClientModuleSystem compatibility
(function() {
  if (typeof window === 'undefined') return;

  function initPlugin() {
    const exports = {};

    const TOUCH_OPT_CLASS = 'dsh-touch-optimized';
    const TOUCH_ACTIVE_CLASS = 'dsh-touch-active';
    const STYLE_ID = 'dsh-touch-optimization-styles';

    const TOUCH_CSS = `
html.${TOUCH_OPT_CLASS},
html.${TOUCH_OPT_CLASS} body {
  overscroll-behavior: none !important;
  overscroll-behavior-y: none !important;
  -webkit-tap-highlight-color: transparent !important;
}
html.${TOUCH_OPT_CLASS} *,
html.${TOUCH_OPT_CLASS} [data-scroll],
html.${TOUCH_OPT_CLASS} .scrollable {
  -webkit-overflow-scrolling: touch;
}
html.${TOUCH_OPT_CLASS} aside,
html.${TOUCH_OPT_CLASS} nav,
html.${TOUCH_OPT_CLASS} main,
html.${TOUCH_OPT_CLASS} section,
html.${TOUCH_OPT_CLASS} [style*="overflow"],
html.${TOUCH_OPT_CLASS} [class*="list"],
html.${TOUCH_OPT_CLASS} [class*="scroll"],
html.${TOUCH_OPT_CLASS} [class*="root"] {
  overscroll-behavior: contain !important;
  overscroll-behavior-y: contain !important;
  touch-action: pan-y !important;
}
html.${TOUCH_OPT_CLASS} button,
html.${TOUCH_OPT_CLASS} [role="button"],
html.${TOUCH_OPT_CLASS} [role="treeitem"],
html.${TOUCH_OPT_CLASS} [role="tab"],
html.${TOUCH_OPT_CLASS} [role="menuitem"],
html.${TOUCH_OPT_CLASS} [role="option"],
html.${TOUCH_OPT_CLASS} a,
html.${TOUCH_OPT_CLASS} summary {
  touch-action: pan-y !important;
  -webkit-tap-highlight-color: transparent !important;
  user-select: none;
  -webkit-user-select: none;
}
html.${TOUCH_OPT_CLASS} .${TOUCH_ACTIVE_CLASS} {
  opacity: 0.75 !important;
  transition: opacity 0.05s ease-out !important;
}
html.${TOUCH_OPT_CLASS} input[type="text"],
html.${TOUCH_OPT_CLASS} input[type="search"],
html.${TOUCH_OPT_CLASS} input[type="password"],
html.${TOUCH_OPT_CLASS} textarea,
html.${TOUCH_OPT_CLASS} [contenteditable="true"] {
  user-select: text !important;
  -webkit-user-select: text !important;
  touch-action: pan-y !important;
}
`;

    function isTouchDevice() {
      const hasCoarse = window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);
      const hasTouchPoints = typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
      const hasTouchEvents = 'ontouchstart' in window;
      return Boolean(hasCoarse || hasTouchPoints || hasTouchEvents);
    }

    function injectStyles() {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.add(TOUCH_OPT_CLASS);
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = TOUCH_CSS;
        (document.head || document.documentElement).appendChild(style);
      }
    }

    let lastDirectTouchTime = 0;
    let lastDirectTouchTarget = null;
    let guardInstalled = false;

    function onDirectTouch(e) {
      if (e.target instanceof HTMLElement) {
        lastDirectTouchTarget = e.target;
        lastDirectTouchTime = Date.now();
      }
    }

    function installFocusGuard() {
      if (guardInstalled || typeof document === 'undefined') return;
      guardInstalled = true;

      document.addEventListener('touchstart', onDirectTouch, { capture: true, passive: true });
      document.addEventListener('pointerdown', onDirectTouch, { capture: true, passive: true });

      if (typeof HTMLTextAreaElement !== 'undefined') {
        const origTextareaFocus = HTMLTextAreaElement.prototype.focus;
        HTMLTextAreaElement.prototype.focus = function(options) {
          const isDirect = (Date.now() - lastDirectTouchTime < 400) &&
            (lastDirectTouchTarget === this || this.contains(lastDirectTouchTarget));
          const isAlready = document.activeElement === this;
          if (isDirect || isAlready) {
            origTextareaFocus.call(this, options);
          }
        };
      }

      if (typeof HTMLInputElement !== 'undefined') {
        const origInputFocus = HTMLInputElement.prototype.focus;
        HTMLInputElement.prototype.focus = function(options) {
          const type = (this.type || '').toLowerCase();
          const isTextInput = type === 'text' || type === 'search' || type === 'password' || type === 'email' || type === 'url';
          if (!isTextInput) {
            origInputFocus.call(this, options);
            return;
          }
          const isDirect = (Date.now() - lastDirectTouchTime < 400) &&
            (lastDirectTouchTarget === this || this.contains(lastDirectTouchTarget));
          const isAlready = document.activeElement === this;
          if (isDirect || isAlready) {
            origInputFocus.call(this, options);
          }
        };
      }
    }

    const SELECTORS = 'button, [role="button"], [role="treeitem"], [role="tab"], [role="menuitem"], [role="option"], a, summary';

    let activeTouch = null;
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
        interactive: interactive || null,
        identifier: touch.identifier,
      };
    }

    function onTouchMove(e) {
      if (!activeTouch) return;
      const touch = Array.from(e.touches).find(t => t.identifier === activeTouch.identifier);
      if (!touch) return;
      const dx = Math.abs(touch.clientX - activeTouch.startX);
      const dy = Math.abs(touch.clientY - activeTouch.startY);
      if (dx > 6 || dy > 6) {
        resetTouch();
      }
    }

    function onTouchEnd() {
      if (activeTouch && activeTouch.interactive) {
        const el = activeTouch.interactive;
        setTimeout(() => { el.classList.remove(TOUCH_ACTIVE_CLASS); }, 60);
      }
      activeTouch = null;
    }

    function resetTouch() {
      if (activeTouch && activeTouch.interactive) {
        activeTouch.interactive.classList.remove(TOUCH_ACTIVE_CLASS);
      }
      activeTouch = null;
    }

    function start() {
      if (isRunning || typeof document === 'undefined') return;
      isRunning = true;
      injectStyles();
      installFocusGuard();
      document.addEventListener('touchstart', onTouchStart, { passive: true });
      document.addEventListener('touchmove', onTouchMove, { passive: true });
      document.addEventListener('touchend', onTouchEnd, { passive: true });
      document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    }

    if (isTouchDevice()) {
      start();
    }

    if (typeof window !== 'undefined' && window.matchMedia) {
      const mq = window.matchMedia('(pointer: coarse)');
      const handleMQ = (ev) => {
        if (ev.matches || isTouchDevice()) start();
      };
      if (mq.addEventListener) mq.addEventListener('change', handleMQ);
      else if (mq.addListener) mq.addListener(handleMQ);
    }

    exports.apply = function(ctx) {
      if (isTouchDevice()) {
        start();
      }
    };

    return exports;
  }

  if (window.__ModuleLoader__) {
    window.__ModuleLoader__.load({
      id: "@anonyjcy/dsh-plugin-mobile-touch",
      factory: function(require) {
        return initPlugin();
      }
    });
  } else {
    initPlugin();
  }
})();
