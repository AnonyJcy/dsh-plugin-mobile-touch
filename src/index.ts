/**
 * Standalone plugin for DeepSeek Harness that optimizes touch UX and fast-tap delivery for iPad & mobile devices.
 * @module @anonyjcy/dsh-plugin-mobile-touch
 */

import type { Context } from '@deepseek-ai/cordis'
import { bootTouchInjection, buildBootScript } from './boot-script.ts'
import type { Config, IndexInjection } from './types.ts'

export { bootTouchInjection, buildBootScript } from './boot-script.ts'
export {
  DSH_HOME_DIR_NAME,
  DSH_HOME_ENV,
  PACKAGE_NAME,
  PLUGIN_ID,
  dshHomePath,
  expandHomePath,
  getPackageRootDir,
  installTouchPlugin,
  isTouchPluginInstalled,
  resolveDshHome,
  targetProfileDir,
  uninstallTouchPlugin,
  verifyTouchPlugin,
  type InstallOptions,
  type VerificationResult,
} from './installer.ts'
export type { Config, IndexInjection, IndexInjectionPlacement } from './types.ts'

/** Cordis plugin name. */
export const name = 'plugin-mobile-touch'

/**
 * Apply the mobile touch optimizer plugin to a Cordis Context.
 * Subscribes to webserver/index-inject to inject mobile touch optimizations into the DeepSeek Harness Web GUI.
 *
 * @param ctx - Cordis context.
 * @param config - plugin configuration options.
 */
export function apply(ctx: Context, config: Config = {}): void {
  if (config.disabled) return

  ctx.on('webserver/index-inject', (table: IndexInjection[]) => {
    try {
      table.push(bootTouchInjection())
    } catch (error) {
      ctx.logger?.warn?.(`[plugin-mobile-touch] Failed to push boot touch injection: ${String(error)}`)
    }
  })
}

export default {
  name,
  apply,
}
