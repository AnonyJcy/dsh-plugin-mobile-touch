# 📱 dsh-plugin-mobile-touch

[![GitHub release](https://img.shields.io/github/v/release/AnonyJcy/dsh-plugin-mobile-touch?color=blue)](https://github.com/AnonyJcy/dsh-plugin-mobile-touch/releases)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[简体中文](README.md) | **English Version**

> **DeepSeek Harness (DSH)** Mobile & iPad Touch Optimization Plugin.  
> Custom-tailored for iPadOS / Safari WebKit gesture & rendering pipelines, completely eliminating gesture freezing, unwanted soft keyboard pop-ups on session switch, whole-page rubberband bouncing, and sidebar collapse glitches.

---

## 🌟 Technical Deep Dive & Core Solutions (Pitfalls & Kernel Insights)

When running modern Web apps (such as DeepSeek Harness Web GUI) on iPad (Safari/WebKit), developers frequently encounter low-level kernel & gesture conflicts. This project systematically addresses and resolves the following mechanisms:

### 1. HTML5 Drag (`draggable="true"`) Causing Touch Scrolling to Freeze
* **Symptom**: Scrolling in the workspace session list freezes 8~9 times out of 10, only rarely catching momentum during an ultra-fast flick.
* **Root Cause**: To support desktop mouse reordering, DSH sets `draggable={true}` on each session row. On iPadOS 15+, WebKit implements native drag-and-drop. When a finger touches a `draggable` DOM node, WebKit waits ~50ms for a long-press drag gesture. Any natural finger dwell triggers WebKit's `DragGestureRecognizer`, which dispatches a cancel signal that **kills vertical scrolling entirely**!
* **Solution**: In the capture phase of `touchstart` / `pointerdown` at millisecond zero, the plugin dynamically strips `draggable` attributes along the touch hierarchy, reinforced by continuous `MutationObserver` and prototype neutralization to guarantee 100% immediate scroll delivery.

### 2. Virtual Soft Keyboard Auto-Popping Up on Session Switch
* **Symptom**: Switching between past sessions on iPad automatically raises the huge onscreen virtual keyboard, blocking half the display and jittering the viewport.
* **Root Cause**: DSH's `InputBar.tsx` calls `textarea.focus()` inside a React `useEffect` whenever `sessionId` changes. On touchscreens, programmatic focus immediately forces the iOS soft keyboard to pop up.
* **Solution (Keyboard Focus Guard)**: Intercepts `HTMLTextAreaElement.prototype.focus`. Focus is only permitted when the user **directly taps the input field within the last 350ms**; programmatic focus triggers from session switching are silently suppressed, keeping the keyboard down while browsing history.

### 3. iPad 1024px Viewport Threshold Glitch Causing Sidebar Auto-Collapse
* **Symptom**: Clicking a session or scrolling causes the left sidebar to abruptly collapse into a narrow 56px icon rail.
* **Root Cause**: DSH enforces `SIDEBAR_AUTO_COLLAPSE = 1024`. iPad screen resolutions sit right on the 1024px boundary. Session switching reflows (e.g. 1023.5px vs 1024px) cause DSH to treat the iPad as a small phone, resetting `narrowExpanded: false` and folding the sidebar.
* **Solution (Sidebar Persistence)**: Detects tablet screens ($\ge 768\text{px}$) and maintains the expanded sidebar state, only collapsing when the user explicitly clicks the top-left toggle button.

### 4. Overscroll Chaining Moving the Whole Web Page
* **Symptom**: Swiping in the sidebar causes the whole webpage window to bounce up and down or trigger pull-to-refresh.
* **Root Cause**: In WebKit, unconsumed touch events in nested flex containers bubble up to the window as rubberband overscroll.
* **Solution**: The dedicated tree touch engine cleanly invokes `e.preventDefault()` during scrolling and enforces physical bounds, keeping the entire webpage perfectly still.

---

## ✨ Features

- 🎯 **Smart Hardware Sensing**: Detects `pointer: coarse`, touch capabilities, and mobile environments, **activating only on touch screens** with zero overhead on desktop mouse setups.
- ⚡ **Dedicated Tree Scroller**: 100% instant scroll response on every touch with smooth ProMotion momentum gliding.
- 🛡️ **Keyboard Focus Guard**: Completely eliminates unwanted soft keyboard pop-ups during conversation switching.
- 📌 **iPad Tablet Sidebar Persistence**: Prevents 1024px boundary oscillation from auto-collapsing the sidebar.
- 📏 **Exact Native Scrollbars**: Proportional, beautifully styled native scrollbars with zero clipping.
- 🔌 **Future-Proof Auto-Adaptation**: Any new UI plugin installed later automatically inherits full touch enhancements.

---

## 🚀 Installation & Deployment

### Option 1: Direct Local Clone (Recommended currently)

```bash
git clone https://github.com/AnonyJcy/dsh-plugin-mobile-touch.git
cd dsh-plugin-mobile-touch

# Mount to DSH Web Profile (~/.dsh/profiles/web)
node bin/cli.js install

# Check installation status
node bin/cli.js status
```

### Option 2: via npm / pnpm (Available after npm publishing)

```bash
npm install -D @anonyjcy/dsh-plugin-mobile-touch
npx @anonyjcy/dsh-plugin-mobile-touch install
```

---

## 🛠️ CLI Reference

```bash
node bin/cli.js install [profile]    # Mount touch optimizer to DSH profile (default: web)
node bin/cli.js uninstall [profile]  # Cleanly unmount touch optimizer
node bin/cli.js verify [profile]     # Verify installation and link integrity
node bin/cli.js status [profile]     # View current status and profile path
```

---

## 📄 License

Open-sourced under the [MIT License](./LICENSE).
