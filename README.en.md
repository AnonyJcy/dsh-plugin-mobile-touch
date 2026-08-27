# 📱 dsh-plugin-mobile-touch

[![npm version](https://img.shields.io/npm/v/@anonyjcy/dsh-plugin-mobile-touch.svg?color=blue)](https://www.npmjs.com/package/@anonyjcy/dsh-plugin-mobile-touch)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

[简体中文](README.md) | **English Version**

> **DeepSeek Harness (DSH)** Mobile & iPad Touch Optimization Plugin.  
> Eliminates WebKit's two-tap hover intercept, eliminates tap delays, resolves gesture conflicts, and delivers 0ms responsive touch feedback and smooth scrolling.

---

## 🌟 Problems & Solutions

When using the DeepSeek Harness Web GUI on iPad (Safari/WebKit) or mobile browsers, users frequently experience **unresponsive taps, missed clicks, or having to tap multiple times to trigger an action**.

### Root Cause Analysis:
1. **WebKit `:hover` Simulation Intercept (Primary Culprit)**: WebKit intercepts the first tap on elements with `:hover` styles or Tooltip listeners as a "simulated hover", dropping the `click` event until a second tap.
2. **Micro-displacement Swallowed as Gestures**: Small 1~3px finger slips on touch glass without `touch-action: manipulation` cause the browser to interpret the interaction as a pan/zoom gesture, cancelling `click`.
3. **Small Touch Targets**: Desktop icon sizes (16~24px) are significantly smaller than the physical finger contact area (44×44pt).

---

## ✨ Features

- 🎯 **Smart Hardware Sensing**: Automatically detects `pointer: coarse`, touch capabilities, and mobile environments, **activating only on touch screens** with zero overhead on desktop mouse setups.
- ⚡ **Fast-Tap Dispatch Engine**: Dispatches clean taps instantly on `touchend`, bypassing WebKit's hover intercept for 0ms response.
- 👆 **Instant 0ms Tactile Feedback**: Adds immediate micro-scale and opacity press feedback upon touch.
- 🛡️ **Gesture Conflict & 300ms Delay Elimination**: Injects `touch-action: manipulation` and `-webkit-tap-highlight-color: transparent` across interactive selectors.
- 🔌 **Future-Proof Auto-Adaptation**: Built on global event delegation and dynamic stylesheet mounting; **any new UI plugin installed later will automatically benefit without additional code**.
- 🛠️ **CLI Management**: Includes a pure ESM Node.js CLI supporting `install`, `uninstall`, `verify`, and `status`.

---

## 🚀 Installation & Deployment

### Option 1: Direct Local Clone

```bash
git clone https://github.com/AnonyJcy/dsh-plugin-mobile-touch.git
cd dsh-plugin-mobile-touch

# Mount to DSH Web Profile (~/.dsh/profiles/web)
node bin/cli.js install

# Check status
node bin/cli.js status
```

### Option 2: via npm / pnpm

```bash
# npm
npm install -D @anonyjcy/dsh-plugin-mobile-touch

# pnpm
pnpm add -D @anonyjcy/dsh-plugin-mobile-touch

# Mount via CLI
npx @anonyjcy/dsh-plugin-mobile-touch install
```

---

## 💡 Configuration (`cordis.yml`)

```yaml
- id: plugin-mobile-touch
  name: '@anonyjcy/dsh-plugin-mobile-touch'
  config:
    force: false       # Force activation on all devices (default: false)
    disabled: false    # Disable touch optimizations (default: false)
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
