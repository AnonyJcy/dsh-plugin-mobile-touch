(function() {
  if (typeof window === 'undefined') return;

  function initPlugin() {
    var exports = {};

    var TOUCH_OPT_CLASS = 'dsh-touch-optimized';
    var STYLE_ID = 'dsh-touch-optimization-styles';

    var TOUCH_CSS = [
      '/* 1. Viewport lock: prevent whole-page rubberband bounce */',
      'html.dsh-touch-optimized,',
      'html.dsh-touch-optimized body {',
      '  width: 100% !important;',
      '  height: 100% !important;',
      '  margin: 0 !important;',
      '  padding: 0 !important;',
      '  overflow: hidden !important;',
      '  overscroll-behavior: none !important;',
      '  overscroll-behavior-y: none !important;',
      '  -webkit-tap-highlight-color: transparent !important;',
      '}',
      '/* 2. Neutralize HTML5 drag interference on touch */',
      'html.dsh-touch-optimized *,',
      '[draggable] {',
      '  -webkit-user-drag: none !important;',
      '  user-drag: none !important;',
      '  -webkit-touch-callout: none !important;',
      '}',
      '/* 3. Sidebar list scrolling & accurate native scrollbar */',
      'html.dsh-touch-optimized [role="tree"],',
      'html.dsh-touch-optimized [class*="list"] {',
      '  -webkit-overflow-scrolling: touch !important;',
      '  overflow-y: auto !important;',
      '  overscroll-behavior: contain !important;',
      '  touch-action: pan-y !important;',
      '  padding-bottom: 48px !important;',
      '  scrollbar-gutter: auto !important;',
      '  --dsh-scrollbar-thumb: rgba(140, 140, 145, 0.45) !important;',
      '  --dsh-scrollbar-thumb-hover: rgba(140, 140, 145, 0.75) !important;',
      '  scrollbar-color: rgba(140, 140, 145, 0.45) transparent !important;',
      '  scrollbar-width: thin !important;',
      '}',
      'html.dsh-touch-optimized [class*="list"]::-webkit-scrollbar,',
      'html.dsh-touch-optimized [role="tree"]::-webkit-scrollbar {',
      '  display: block !important;',
      '  width: 4px !important;',
      '}',
      'html.dsh-touch-optimized [class*="list"]::-webkit-scrollbar-track,',
      'html.dsh-touch-optimized [role="tree"]::-webkit-scrollbar-track {',
      '  background: transparent !important;',
      '}',
      'html.dsh-touch-optimized [class*="list"]::-webkit-scrollbar-thumb,',
      'html.dsh-touch-optimized [role="tree"]::-webkit-scrollbar-thumb {',
      '  border-radius: 4px !important;',
      '  background: rgba(140, 140, 145, 0.45) !important;',
      '}',
      '/* 4. Allow vertical pan on all list children */',
      'html.dsh-touch-optimized [role="tree"] *,',
      'html.dsh-touch-optimized [class*="list"] *,',
      'html.dsh-touch-optimized [class*="sessionRow"],',
      'html.dsh-touch-optimized [class*="projectRow"] {',
      '  touch-action: pan-y !important;',
      '}',
      '/* 5. Hide bottom masking fade gradient */',
      'html.dsh-touch-optimized [class*="fade"] {',
      '  display: none !important;',
      '}',
      '/* 6. Button and interactive element press feedback */',
      'html.dsh-touch-optimized button:active, html.dsh-touch-optimized [role="button"]:active, html.dsh-touch-optimized [role="treeitem"]:active {',
      '  opacity: 0.72 !important;',
      '  transition: opacity 0.05s ease-out !important;',
      '}'
    ].join('\n');

    function isTouchDevice() {
      var hasCoarse = window.matchMedia && (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(hover: none)').matches);
      var hasTouchPoints = typeof navigator !== 'undefined' && typeof navigator.maxTouchPoints === 'number' && navigator.maxTouchPoints > 0;
      var hasTouchEvents = 'ontouchstart' in window;
      return Boolean(hasCoarse || hasTouchPoints || hasTouchEvents);
    }

    function injectStyles() {
      if (typeof document === 'undefined') return;
      document.documentElement.classList.add(TOUCH_OPT_CLASS);
      if (!document.getElementById(STYLE_ID)) {
        var style = document.createElement('style');
        style.id = STYLE_ID;
        style.textContent = TOUCH_CSS;
        (document.head || document.documentElement).appendChild(style);
      }
    }

    // Completely disarm HTML5 draggable across all prototypes and attributes
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
          var origSetAttr = Element.prototype.setAttribute;
          Element.prototype.setAttribute = function(name, value) {
            if (name && typeof name === 'string' && name.toLowerCase() === 'draggable') {
              return;
            }
            return origSetAttr.call(this, name, value);
          };
        } catch (e) {}
      }

      var purge = function() {
        if (typeof document === 'undefined') return;
        var draggables = document.querySelectorAll('[draggable]');
        for (var i = 0; i < draggables.length; i++) {
          draggables[i].removeAttribute('draggable');
          draggables[i].draggable = false;
        }
      };
      purge();

      if (typeof MutationObserver !== 'undefined') {
        var dragObserver = new MutationObserver(function(mutations) {
          for (var i = 0; i < mutations.length; i++) {
            var m = mutations[i];
            if (m.type === 'childList') {
              for (var j = 0; j < m.addedNodes.length; j++) {
                var node = m.addedNodes[j];
                if (node && node.nodeType === 1) {
                  if (node.hasAttribute && node.hasAttribute('draggable')) {
                    node.removeAttribute('draggable');
                    node.draggable = false;
                  }
                  var children = node.querySelectorAll ? node.querySelectorAll('[draggable]') : [];
                  for (var k = 0; k < children.length; k++) {
                    children[k].removeAttribute('draggable');
                    children[k].draggable = false;
                  }
                }
              }
            } else if (m.type === 'attributes' && m.attributeName === 'draggable') {
              var target = m.target;
              if (target && target.hasAttribute && target.hasAttribute('draggable')) {
                target.removeAttribute('draggable');
                target.draggable = false;
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

      var stripOnTouch = function(e) {
        var el = e.target;
        while (el && el !== document.documentElement) {
          if (el.hasAttribute && el.hasAttribute('draggable')) {
            el.removeAttribute('draggable');
            el.draggable = false;
          }
          el = el.parentElement;
        }
      };

      document.addEventListener('touchstart', stripOnTouch, { capture: true, passive: true });
      document.addEventListener('pointerdown', stripOnTouch, { capture: true, passive: true });
      document.addEventListener('dragstart', function(e) { e.preventDefault(); }, { capture: true });
    }

    // High-Precision Scoped Touch Scroller for Sidebar Tree
    // Directly powers touch scrolling in the workspace list (10/10 times) while preventing whole-page movement
    function installSidebarTreeScroller() {
      var activeTree = null;
      var startY = 0;
      var startScrollTop = 0;
      var isScrolling = false;
      var wasScrolling = false;
      var scrollSuppressTimer = null;
      var lastY = 0;
      var lastTime = 0;
      var velocity = 0;
      var momentumRaf = null;

      function findTree(el) {
        if (!el || typeof el.closest !== 'function') return null;
        if (el.closest('[class*="centerCol"], [class*="composer"], [class*="Input"], [class*="scrollBody"], [class*="detailsCol"], textarea, input, [contenteditable="true"]')) {
          return null;
        }
        var tree = el.closest('[role="tree"], [class*="list"]');
        if (tree && tree.closest('[class*="sidebar"], [class*="SidebarRoot"], [class*="WorkspaceBrowser"]')) {
          return tree;
        }
        return null;
      }

      function stopMomentum() {
        if (momentumRaf) {
          cancelAnimationFrame(momentumRaf);
          momentumRaf = null;
        }
      }

      function clampBounds(tree) {
        if (!tree) return;
        var maxScroll = Math.max(0, tree.scrollHeight - tree.clientHeight);
        if (tree.scrollTop > maxScroll) {
          tree.scrollTop = maxScroll;
        }
      }

      // Re-clamp on DOM height changes
      if (typeof MutationObserver !== 'undefined') {
        var treeObserver = new MutationObserver(function() {
          var trees = document.querySelectorAll('[class*="sidebar"] [role="tree"], [class*="sidebar"] [class*="list"]');
          for (var i = 0; i < trees.length; i++) {
            clampBounds(trees[i]);
          }
        });
        treeObserver.observe(document.documentElement, {
          childList: true,
          subtree: true
        });
      }

      // Suppress accidental click on session row when finger was scrolling
      document.addEventListener('click', function(e) {
        if (wasScrolling) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
        }

        var projectToggle = e.target && e.target.closest && e.target.closest('[class*="projectRow"], [class*="sessionOverflowButton"]');
        if (projectToggle) {
          var sidebarList = projectToggle.closest('[role="tree"], [class*="list"]');
          if (sidebarList) {
            setTimeout(function() { clampBounds(sidebarList); }, 50);
            setTimeout(function() { clampBounds(sidebarList); }, 220);
          }
        }
      }, { capture: true });

      document.addEventListener('touchstart', function(e) {
        if (e.touches.length !== 1) {
          activeTree = null;
          return;
        }
        stopMomentum();
        var touch = e.touches[0];
        activeTree = findTree(touch.target);
        if (!activeTree) return;

        clampBounds(activeTree);
        startY = touch.clientY;
        startScrollTop = activeTree.scrollTop;
        lastY = touch.clientY;
        lastTime = Date.now();
        velocity = 0;
        isScrolling = false;
      }, { passive: true, capture: true });

      document.addEventListener('touchmove', function(e) {
        if (!activeTree || e.touches.length !== 1) return;
        var touch = e.touches[0];
        var currentY = touch.clientY;
        var deltaY = currentY - startY;

        if (!isScrolling && Math.abs(deltaY) > 4) {
          isScrolling = true;
          wasScrolling = true;
        }

        if (isScrolling) {
          // Prevent page-level dragging so ONLY the sidebar list moves!
          e.preventDefault();

          var maxScroll = Math.max(0, activeTree.scrollHeight - activeTree.clientHeight);
          var next = startScrollTop - deltaY;
          if (next < 0) next = 0;
          if (next > maxScroll) next = maxScroll;

          activeTree.scrollTop = next;

          var now = Date.now();
          var dt = now - lastTime;
          if (dt > 10) {
            var currentVelocity = (lastY - currentY) / dt;
            velocity = velocity * 0.4 + currentVelocity * 0.6;
            lastY = currentY;
            lastTime = now;
          }
        }
      }, { passive: false, capture: true });

      document.addEventListener('touchend', function() {
        if (isScrolling) {
          wasScrolling = true;
          if (scrollSuppressTimer) clearTimeout(scrollSuppressTimer);
          scrollSuppressTimer = setTimeout(function() {
            wasScrolling = false;
          }, 180);
        }

        if (!activeTree || !isScrolling) {
          activeTree = null;
          isScrolling = false;
          return;
        }

        var tree = activeTree;
        activeTree = null;
        isScrolling = false;

        // Smooth ProMotion momentum gliding with strict physical clamping
        if (Math.abs(velocity) > 0.08) {
          var v = velocity * 9.0;
          if (v > 16) v = 16;
          if (v < -16) v = -16;

          var step = function() {
            if (Math.abs(v) < 0.3) {
              stopMomentum();
              clampBounds(tree);
              return;
            }
            var maxScroll = Math.max(0, tree.scrollHeight - tree.clientHeight);
            var next = tree.scrollTop + v;
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

      document.addEventListener('touchcancel', function() {
        activeTree = null;
        isScrolling = false;
        stopMomentum();
      }, { passive: true });
    }

    // Soft Keyboard Auto-Popup Guard:
    // Completely stops programmatic textarea/input focus (e.g. from switching sessions)
    // from popping up the virtual keyboard on iPad. Only allows focus when the user directly taps the input.
    var lastDirectTouchInput = null;
    var lastDirectTouchInputTime = 0;

    function installKeyboardFocusGuard() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      var onDirectInputTouch = function(e) {
        var target = e.target;
        if (target && (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable)) {
          lastDirectTouchInput = target;
          lastDirectTouchInputTime = Date.now();
        }
      };

      document.addEventListener('touchstart', onDirectInputTouch, { capture: true, passive: true });
      document.addEventListener('pointerdown', onDirectInputTouch, { capture: true, passive: true });

      if (typeof HTMLTextAreaElement !== 'undefined') {
        var origTextareaFocus = HTMLTextAreaElement.prototype.focus;
        HTMLTextAreaElement.prototype.focus = function(options) {
          var now = Date.now();
          var isDirectUserTap = (now - lastDirectTouchInputTime < 350) &&
            (lastDirectTouchInput === this || this.contains(lastDirectTouchInput));
          var isAlreadyFocused = document.activeElement === this;

          if (isDirectUserTap || isAlreadyFocused) {
            origTextareaFocus.call(this, options);
          } else {
            // Suppress programmatic focus on session switch! Virtual keyboard stays down!
          }
        };
      }

      if (typeof HTMLInputElement !== 'undefined') {
        var origInputFocus = HTMLInputElement.prototype.focus;
        HTMLInputElement.prototype.focus = function(options) {
          var type = (this.type || '').toLowerCase();
          var isText = type === 'text' || type === 'search' || type === 'password' || type === 'email' || type === 'url';
          if (!isText) {
            origInputFocus.call(this, options);
            return;
          }
          var now = Date.now();
          var isDirectUserTap = (now - lastDirectTouchInputTime < 350) &&
            (lastDirectTouchInput === this || this.contains(lastDirectTouchInput));
          var isAlreadyFocused = document.activeElement === this;

          if (isDirectUserTap || isAlreadyFocused) {
            origInputFocus.call(this, options);
          } else {
            // Suppress programmatic focus
          }
        };
      }
    }

    // iPad / Tablet Sidebar Persistence (prevents 1024px threshold oscillation from collapsing sidebar on session click)
    function installSidebarPersistence() {
      if (typeof window === 'undefined' || typeof document === 'undefined') return;

      var userExplicitlyCollapsed = false;

      document.addEventListener('click', function(e) {
        var toggleBtn = e.target && e.target.closest && e.target.closest('[class*="toggle"]');
        if (toggleBtn) {
          var sidebar = document.querySelector('[class*="sidebarCol"], [class*="SidebarRoot"]');
          var isCurrentlyCollapsed = sidebar && (sidebar.classList.contains('collapsed') || sidebar.closest('[data-sidebar-collapsed="true"]'));
          userExplicitlyCollapsed = !isCurrentlyCollapsed;
        }
      }, { capture: true });

      function checkAndMaintainSidebar() {
        if (window.innerWidth < 768 || userExplicitlyCollapsed) return;

        var sidebar = document.querySelector('[class*="SidebarRoot"], [class*="sidebarCol"]');
        if (!sidebar) return;

        var isCollapsed = sidebar.classList.contains('collapsed') || sidebar.closest('[data-sidebar-collapsed="true"]');
        if (isCollapsed) {
          var toggleBtn = sidebar.querySelector('[class*="toggle"], button[aria-label*="展开"], button[aria-label*="collapse"], button[aria-label*="open"]');
          if (toggleBtn) {
            toggleBtn.click();
          }
        }
      }

      if (typeof MutationObserver !== 'undefined') {
        var obs = new MutationObserver(function() {
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

    if (typeof window !== 'undefined' && window.matchMedia) {
      var mq = window.matchMedia('(pointer: coarse)');
      var handleMQ = function(ev) {
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
