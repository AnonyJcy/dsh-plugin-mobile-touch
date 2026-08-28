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
  const STYLE_ID = 'dsh-touch-optimization-styles';

  const TOUCH_CSS = \`
/* 1. Viewport lock: prevent whole-page rubberband bounce */
html.\${TOUCH_OPT_CLASS},
html.\${TOUCH_OPT_CLASS} body {
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
html.\${TOUCH_OPT_CLASS} *,
[draggable] {
  -webkit-user-drag: none !important;
  user-drag: none !important;
  -webkit-touch-callout: none !important;
}
/* 3. Sidebar list scrolling & accurate native scrollbar */
html.\${TOUCH_OPT_CLASS} [role="tree"],
html.\${TOUCH_OPT_CLASS} [class*="list"] {
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
html.\${TOUCH_OPT_CLASS} [class*="list"]::-webkit-scrollbar,
html.\${TOUCH_OPT_CLASS} [role="tree"]::-webkit-scrollbar {
  display: block !important;
  width: 4px !important;
}
html.\${TOUCH_OPT_CLASS} [class*="list"]::-webkit-scrollbar-track,
html.\${TOUCH_OPT_CLASS} [role="tree"]::-webkit-scrollbar-track {
  background: transparent !important;
}
html.\${TOUCH_OPT_CLASS} [class*="list"]::-webkit-scrollbar-thumb,
html.\${TOUCH_OPT_CLASS} [role="tree"]::-webkit-scrollbar-thumb {
  border-radius: 4px !important;
  background: rgba(140, 140, 145, 0.45) !important;
}
/* 4. Allow vertical pan on all list children */
html.\${TOUCH_OPT_CLASS} [role="tree"] *,
html.\${TOUCH_OPT_CLASS} [class*="list"] *,
html.\${TOUCH_OPT_CLASS} [class*="sessionRow"],
html.\${TOUCH_OPT_CLASS} [class*="projectRow"] {
  touch-action: pan-y !important;
}
/* 5. Hide bottom masking fade gradient */
html.\${TOUCH_OPT_CLASS} [class*="fade"] {
  display: none !important;
}
/* 6. Button and interactive element press feedback */
html.\${TOUCH_OPT_CLASS} button:active, html.\${TOUCH_OPT_CLASS} [role="button"]:active, html.\${TOUCH_OPT_CLASS} [role="treeitem"]:active {
  opacity: 0.72 !important;
  transition: opacity 0.05s ease-out !important;
}
\`;

  function isTouchDevice() {
    const hasCoarse = window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);
    const hasTouchPoints = typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
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

  function neutralizeDraggable() {
    if (typeof HTMLElement !== 'undefined') {
      try {
        Object.defineProperty(HTMLElement.prototype, 'draggable', {
          get: function() { return false; },
          set: function() { /* refuse on touch */ },
          configurable: true,
          enumerable: true
        });
        if (typeof HTMLDivElement !== 'undefined') {
          Object.defineProperty(HTMLDivElement.prototype, 'draggable', {
            get: function() { return false; },
            set: function() { /* refuse on touch */ },
            configurable: true,
            enumerable: true
          });
        }
      } catch (e) {}
    }

    if (typeof Element !== 'undefined') {
      try {
        const origSetAttr = Element.prototype.setAttribute;
        Element.prototype.setAttribute = function(name, value) {
          if (name && typeof name === 'string' && name.toLowerCase() === 'draggable') {
            return;
          }
          return origSetAttr.call(this, name, value);
        };
      } catch (e) {}
    }

    const purge = () => {
      const draggables = document.querySelectorAll('[draggable]');
      for (let i = 0; i < draggables.length; i++) {
        draggables[i].removeAttribute('draggable');
        (draggables[i] as any).draggable = false;
      }
    };
    purge();

    if (typeof MutationObserver !== 'undefined') {
      const dragObserver = new MutationObserver((mutations) => {
        for (let i = 0; i < mutations.length; i++) {
          const m = mutations[i];
          if (m.type === 'childList') {
            for (let j = 0; j < m.addedNodes.length; j++) {
              const node = m.addedNodes[j] as HTMLElement;
              if (node && node.nodeType === 1) {
                if (node.hasAttribute && node.hasAttribute('draggable')) {
                  node.removeAttribute('draggable');
                  (node as any).draggable = false;
                }
                const children = node.querySelectorAll ? node.querySelectorAll('[draggable]') : [];
                for (let k = 0; k < children.length; k++) {
                  children[k].removeAttribute('draggable');
                  (children[k] as any).draggable = false;
                }
              }
            }
          } else if (m.type === 'attributes' && m.attributeName === 'draggable') {
            const target = m.target as HTMLElement;
            if (target && target.hasAttribute && target.hasAttribute('draggable')) {
              target.removeAttribute('draggable');
              (target as any).draggable = false;
            }
          }
        }
      });
      dragObserver.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['draggable']
      });
    }

    const stripOnTouch = (e: Event) => {
      let el = e.target as HTMLElement | null;
      while (el && el !== document.documentElement) {
        if (el.hasAttribute && el.hasAttribute('draggable')) {
          el.removeAttribute('draggable');
          (el as any).draggable = false;
        }
        el = el.parentElement;
      }
    };

    document.addEventListener('touchstart', stripOnTouch, { capture: true, passive: true });
    document.addEventListener('pointerdown', stripOnTouch, { capture: true, passive: true });
    document.addEventListener('dragstart', (e) => { e.preventDefault(); }, { capture: true });
  }

  function installSidebarTreeScroller() {
    let activeTree: HTMLElement | null = null;
    let startY = 0;
    let startScrollTop = 0;
    let isScrolling = false;
    let wasScrolling = false;
    let scrollSuppressTimer: ReturnType<typeof setTimeout> | null = null;
    let lastY = 0;
    let lastTime = 0;
    let velocity = 0;
    let momentumRaf: number | null = null;

    function findTree(el: HTMLElement | null) {
      if (!el || typeof el.closest !== 'function') return null;
      if (el.closest('[class*="centerCol"], [class*="composer"], [class*="Input"], [class*="scrollBody"], [class*="detailsCol"], textarea, input, [contenteditable="true"]')) {
        return null;
      }
      const tree = el.closest('[role="tree"], [class*="list"]') as HTMLElement | null;
      if (tree && tree.closest('[class*="sidebar"], [class*="SidebarRoot"], [class*="WorkspaceBrowser"]')) {
        return tree;
      }
      return null;
    }

    function stopMomentum() {
      if (momentumRaf !== null) {
        cancelAnimationFrame(momentumRaf);
        momentumRaf = null;
      }
    }

    function clampBounds(tree: HTMLElement | null) {
      if (!tree) return;
      const maxScroll = Math.max(0, tree.scrollHeight - tree.clientHeight);
      if (tree.scrollTop > maxScroll) {
        tree.scrollTop = maxScroll;
      }
    }

    if (typeof MutationObserver !== 'undefined') {
      const treeObserver = new MutationObserver(() => {
        const trees = document.querySelectorAll('[class*="sidebar"] [role="tree"], [class*="sidebar"] [class*="list"]');
        for (let i = 0; i < trees.length; i++) {
          clampBounds(trees[i] as HTMLElement);
        }
      });
      treeObserver.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
    }

    document.addEventListener('click', (e) => {
      if (wasScrolling) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }

      const target = e.target as HTMLElement | null;
      const projectToggle = target && target.closest && target.closest('[class*="projectRow"], [class*="sessionOverflowButton"]');
      if (projectToggle) {
        const sidebarList = projectToggle.closest('[role="tree"], [class*="list"]') as HTMLElement | null;
        if (sidebarList) {
          setTimeout(() => { clampBounds(sidebarList); }, 50);
          setTimeout(() => { clampBounds(sidebarList); }, 220);
        }
      }
    }, { capture: true });

    document.addEventListener('touchstart', (e) => {
      if (e.touches.length !== 1) {
        activeTree = null;
        return;
      }
      stopMomentum();
      const touch = e.touches[0];
      activeTree = findTree(touch.target as HTMLElement);
      if (!activeTree) return;

      clampBounds(activeTree);
      startY = touch.clientY;
      startScrollTop = activeTree.scrollTop;
      lastY = touch.clientY;
      lastTime = Date.now();
      velocity = 0;
      isScrolling = false;
    }, { passive: true, capture: true });

    document.addEventListener('touchmove', (e) => {
      if (!activeTree || e.touches.length !== 1) return;
      const touch = e.touches[0];
      const currentY = touch.clientY;
      const deltaY = currentY - startY;

      if (!isScrolling && Math.abs(deltaY) > 4) {
        isScrolling = true;
        wasScrolling = true;
      }

      if (isScrolling) {
        e.preventDefault();
        const maxScroll = Math.max(0, activeTree.scrollHeight - activeTree.clientHeight);
        let next = startScrollTop - deltaY;
        if (next < 0) next = 0;
        if (next > maxScroll) next = maxScroll;

        activeTree.scrollTop = next;

        const now = Date.now();
        const dt = now - lastTime;
        if (dt > 10) {
          const currentVelocity = (lastY - currentY) / dt;
          velocity = velocity * 0.4 + currentVelocity * 0.6;
          lastY = currentY;
          lastTime = now;
        }
      }
    }, { passive: false, capture: true });

    document.addEventListener('touchend', () => {
      if (isScrolling) {
        wasScrolling = true;
        if (scrollSuppressTimer) clearTimeout(scrollSuppressTimer);
        scrollSuppressTimer = setTimeout(() => {
          wasScrolling = false;
        }, 180);
      }

      if (!activeTree || !isScrolling) {
        activeTree = null;
        isScrolling = false;
        return;
      }

      const tree = activeTree;
      activeTree = null;
      isScrolling = false;

      if (Math.abs(velocity) > 0.08) {
        let v = velocity * 9.0;
        if (v > 16) v = 16;
        if (v < -16) v = -16;

        const step = () => {
          if (Math.abs(v) < 0.3) {
            stopMomentum();
            clampBounds(tree);
            return;
          }
          const maxScroll = Math.max(0, tree.scrollHeight - tree.clientHeight);
          let next = tree.scrollTop + v;
          if (next < 0) {
            next = 0;
            v = 0;
          } else if (next > maxScroll) {
            next = maxScroll;
            v = 0;
          }
          tree.scrollTop = next;
          v *= 0.92;
          momentumRaf = requestAnimationFrame(step);
        };
        momentumRaf = requestAnimationFrame(step);
      } else {
        clampBounds(tree);
      }
    }, { passive: true, capture: true });

    document.addEventListener('touchcancel', () => {
      activeTree = null;
      isScrolling = false;
      stopMomentum();
    }, { passive: true });
  }

  let lastDirectTouchInput: HTMLElement | null = null;
  let lastDirectTouchInputTime = 0;

  function installKeyboardFocusGuard() {
    const onDirectInputTouch = (e: TouchEvent | PointerEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || (target as any).isContentEditable)) {
        lastDirectTouchInput = target;
        lastDirectTouchInputTime = Date.now();
      }
    };

    document.addEventListener('touchstart', onDirectInputTouch, { capture: true, passive: true });
    document.addEventListener('pointerdown', onDirectInputTouch, { capture: true, passive: true });

    if (typeof HTMLTextAreaElement !== 'undefined') {
      const origTextareaFocus = HTMLTextAreaElement.prototype.focus;
      HTMLTextAreaElement.prototype.focus = function(this: HTMLTextAreaElement, options?: FocusOptions) {
        const now = Date.now();
        const isDirectUserTap = (now - lastDirectTouchInputTime < 350) &&
          (lastDirectTouchInput === this || this.contains(lastDirectTouchInput));
        const isAlreadyFocused = document.activeElement === this;

        if (isDirectUserTap || isAlreadyFocused) {
          origTextareaFocus.call(this, options);
        }
      };
    }

    if (typeof HTMLInputElement !== 'undefined') {
      const origInputFocus = HTMLInputElement.prototype.focus;
      HTMLInputElement.prototype.focus = function(this: HTMLInputElement, options?: FocusOptions) {
        const type = (this.type || '').toLowerCase();
        const isText = type === 'text' || type === 'search' || type === 'password' || type === 'email' || type === 'url';
        if (!isText) {
          origInputFocus.call(this, options);
          return;
        }
        const now = Date.now();
        const isDirectUserTap = (now - lastDirectTouchInputTime < 350) &&
          (lastDirectTouchInput === this || this.contains(lastDirectTouchInput));
        const isAlreadyFocused = document.activeElement === this;

        if (isDirectUserTap || isAlreadyFocused) {
          origInputFocus.call(this, options);
        }
      };
    }
  }

  function installSidebarPersistence() {
    let userExplicitlyCollapsed = false;

    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement | null;
      const toggleBtn = target && target.closest && target.closest('[class*="toggle"]');
      if (toggleBtn) {
        const sidebar = document.querySelector('[class*="sidebarCol"], [class*="SidebarRoot"]');
        const isCurrentlyCollapsed = sidebar && (sidebar.classList.contains('collapsed') || sidebar.closest('[data-sidebar-collapsed="true"]'));
        userExplicitlyCollapsed = !isCurrentlyCollapsed;
      }
    }, { capture: true });

    function checkAndMaintainSidebar() {
      if (window.innerWidth < 768 || userExplicitlyCollapsed) return;

      const sidebar = document.querySelector('[class*="SidebarRoot"], [class*="sidebarCol"]');
      if (!sidebar) return;

      const isCollapsed = sidebar.classList.contains('collapsed') || sidebar.closest('[data-sidebar-collapsed="true"]');
      if (isCollapsed) {
        const toggleBtn = sidebar.querySelector('[class*="toggle"], button[aria-label*="展开"], button[aria-label*="collapse"], button[aria-label*="open"]') as HTMLButtonElement | null;
        if (toggleBtn) {
          toggleBtn.click();
        }
      }
    }

    if (typeof MutationObserver !== 'undefined') {
      const obs = new MutationObserver(() => {
        if (window.innerWidth >= 768 && !userExplicitlyCollapsed) {
          checkAndMaintainSidebar();
        }
      });
      obs.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-sidebar-collapsed', 'class'],
        subtree: true
      });
    }

    setTimeout(checkAndMaintainSidebar, 150);
    setTimeout(checkAndMaintainSidebar, 500);
  }

  function start() {
    injectStyles();
    neutralizeDraggable();
    installSidebarTreeScroller();
    installKeyboardFocusGuard();
    installSidebarPersistence();
  }

  if (isTouchDevice()) {
    start();
  }

  if (window.matchMedia) {
    const mq = window.matchMedia('(pointer: coarse)');
    const handleMQ = (ev: MediaQueryListEvent | MediaQueryList) => {
      if (ev.matches || isTouchDevice()) start();
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
