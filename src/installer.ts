/**
 * Touch plugin installer, mounting, and verification utilities for DeepSeek Harness.
 * @module @anonyjcy/dsh-plugin-mobile-touch/installer
 */

import { mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DSH_HOME_DIR_NAME = '.dsh'
export const DSH_HOME_ENV = 'DSH_HOME'
export const PLUGIN_ID = 'plugin-mobile-touch'
export const PACKAGE_NAME = '@anonyjcy/dsh-plugin-mobile-touch'

/**
 * Expand tilde prefixes against the operating-system home.
 */
export function expandHomePath(path: string): string {
  if (path === '~') return homedir()
  if (path.startsWith('~/') || path.startsWith('~\\')) return join(homedir(), path.slice(2))
  return path
}

/**
 * Resolve the single-root DeepSeek Harness home directory.
 */
export function resolveDshHome(configured?: string, env: Record<string, string | undefined> = process.env): string {
  const fromEnv = env[DSH_HOME_ENV]
  const selected = configured ?? (fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME))
  return resolve(expandHomePath(selected))
}

/**
 * Join path segments onto the resolved DeepSeek Harness home.
 */
export function dshHomePath(...segments: string[]): string {
  return join(resolveDshHome(), ...segments)
}

/**
 * Resolve the source package root directory.
 */
export function getPackageRootDir(): string {
  return resolve(fileURLToPath(new URL('../', import.meta.url)))
}

/**
 * Resolve the web profile directory.
 */
export function targetProfileDir(profileName = 'web', dshHome?: string): string {
  return join(resolveDshHome(dshHome), 'profiles', profileName)
}

/**
 * Verification result.
 */
export interface VerificationResult {
  ok: boolean
  profilePath: string
  mounted: boolean
  linked: boolean
  message?: string
}

/**
 * Options for installation.
 */
export interface InstallOptions {
  dshHome?: string
  profileName?: string
  force?: boolean
}

/**
 * Check whether the plugin is installed and mounted in the target profile.
 */
export async function isTouchPluginInstalled(options: InstallOptions = {}): Promise<boolean> {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const patchFile = join(profileDir, 'cordis.patch.yml')

  try {
    const content = await readFile(patchFile, 'utf8')
    return content.includes(PACKAGE_NAME) || content.includes(PLUGIN_ID)
  } catch {
    return false
  }
}

/**
 * Install and mount the touch optimizer into the target DSH web profile.
 */
export async function installTouchPlugin(options: InstallOptions = {}): Promise<string> {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const packageRoot = getPackageRootDir()
  const moduleTarget = join(profileDir, 'node_modules', PACKAGE_NAME)

  await mkdir(dirname(moduleTarget), { recursive: true })

  // 1. Link or update package link in profile node_modules
  try {
    const s = await stat(moduleTarget)
    if (s) {
      await rm(moduleTarget, { recursive: true, force: true })
    }
  } catch {
    // not present
  }

  try {
    await symlink(packageRoot, moduleTarget, 'junction')
  } catch {
    // Symlink fallback: already handled or direct reference
  }

  // 2. Add mount entry to cordis.patch.yml
  const patchFile = join(profileDir, 'cordis.patch.yml')
  let patchContent = ''
  try {
    patchContent = await readFile(patchFile, 'utf8')
  } catch {
    patchContent = ''
  }

  if (!patchContent.includes(PACKAGE_NAME) && !patchContent.includes(PLUGIN_ID)) {
    const patchSnippet = `
- insert:
    - id: ${PLUGIN_ID}
      name: '${PACKAGE_NAME}'
`
    patchContent = patchContent ? `${patchContent.trim()}\n${patchSnippet}` : patchSnippet.trim() + '\n'
    await writeFile(patchFile, patchContent, 'utf8')
  }

  return profileDir
}

/**
 * Uninstall and unmount the touch optimizer from the target DSH web profile.
 */
export async function uninstallTouchPlugin(options: InstallOptions = {}): Promise<boolean> {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const patchFile = join(profileDir, 'cordis.patch.yml')
  const moduleTarget = join(profileDir, 'node_modules', PACKAGE_NAME)

  let modified = false

  try {
    const s = await stat(moduleTarget)
    if (s) {
      await rm(moduleTarget, { recursive: true, force: true })
      modified = true
    }
  } catch {
    // ignore
  }

  try {
    let patchContent = await readFile(patchFile, 'utf8')
    if (patchContent.includes(PACKAGE_NAME) || patchContent.includes(PLUGIN_ID)) {
      // Remove the patch block
      const regex = new RegExp(`\\n?- insert:\\s*\\n\\s*- id: ${PLUGIN_ID}[\\s\\S]*?name: ['"]${PACKAGE_NAME}['"]\\s*`, 'g')
      patchContent = patchContent.replace(regex, '')
      await writeFile(patchFile, patchContent, 'utf8')
      modified = true
    }
  } catch {
    // ignore
  }

  return modified
}

/**
 * Verify plugin installation and integrity.
 */
export async function verifyTouchPlugin(options: InstallOptions = {}): Promise<VerificationResult> {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const patchFile = join(profileDir, 'cordis.patch.yml')
  const moduleTarget = join(profileDir, 'node_modules', PACKAGE_NAME)

  let mounted = false
  let linked = false

  try {
    const content = await readFile(patchFile, 'utf8')
    mounted = content.includes(PACKAGE_NAME) || content.includes(PLUGIN_ID)
  } catch {
    mounted = false
  }

  try {
    const s = await stat(moduleTarget)
    linked = Boolean(s)
  } catch {
    linked = false
  }

  const ok = mounted && linked
  const message = ok
    ? 'Touch plugin is successfully installed, linked, and mounted.'
    : `Issues detected: mounted in cordis.patch.yml = ${mounted}, linked in node_modules = ${linked}`

  return {
    ok,
    profilePath: profileDir,
    mounted,
    linked,
    message,
  }
}
