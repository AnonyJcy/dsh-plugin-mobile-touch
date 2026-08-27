#!/usr/bin/env node
/**
 * CLI for DeepSeek Harness Mobile & Touch Optimizer Plugin.
 * Pure ESM Node.js runtime script.
 */

import { mkdir, readFile, rm, stat, symlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const DSH_HOME_DIR_NAME = '.dsh'
const DSH_HOME_ENV = 'DSH_HOME'
const PLUGIN_ID = 'plugin-mobile-touch'
const PACKAGE_NAME = '@anonyjcy/dsh-plugin-mobile-touch'

function expandHomePath(p) {
  if (!p) return homedir()
  if (p === '~') return homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) return join(homedir(), p.slice(2))
  return p
}

function resolveDshHome(configured, env = process.env) {
  const fromEnv = env[DSH_HOME_ENV]
  const selected = configured ?? (fromEnv !== undefined && fromEnv.trim().length > 0 ? fromEnv : join(homedir(), DSH_HOME_DIR_NAME))
  return resolve(expandHomePath(selected))
}

function getPackageRootDir() {
  return resolve(fileURLToPath(new URL('../', import.meta.url)))
}

function targetProfileDir(profileName = 'web', dshHome) {
  return join(resolveDshHome(dshHome), 'profiles', profileName)
}

async function isTouchPluginInstalled(options = {}) {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const patchFile = join(profileDir, 'cordis.patch.yml')
  try {
    const content = await readFile(patchFile, 'utf8')
    return content.includes(PACKAGE_NAME) || content.includes(PLUGIN_ID)
  } catch {
    return false
  }
}

async function installTouchPlugin(options = {}) {
  const profileDir = targetProfileDir(options.profileName ?? 'web', options.dshHome)
  const packageRoot = getPackageRootDir()
  const moduleTarget = join(profileDir, 'node_modules', PACKAGE_NAME)

  await mkdir(dirname(moduleTarget), { recursive: true })

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
    // fallback
  }

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

async function uninstallTouchPlugin(options = {}) {
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

async function verifyTouchPlugin(options = {}) {
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

const command = process.argv[2] ?? 'status'
const profileArg = process.argv[3] ?? 'web'

async function main() {
  switch (command) {
    case 'install': {
      console.log(`Installing and mounting Mobile Touch Optimizer to profile "${profileArg}"...`)
      const dest = await installTouchPlugin({ profileName: profileArg })
      console.log(`✓ Successfully installed to profile at: ${dest}`)
      const check = await verifyTouchPlugin({ profileName: profileArg })
      if (check.ok) {
        console.log('✓ Verification passed! Touch optimizer is active for DeepSeek Harness Web.')
      } else {
        console.warn(`Warning: verification reported: ${check.message}`)
      }
      break
    }
    case 'uninstall': {
      console.log(`Uninstalling Mobile Touch Optimizer from profile "${profileArg}"...`)
      const removed = await uninstallTouchPlugin({ profileName: profileArg })
      if (removed) {
        console.log('✓ Successfully uninstalled and unmounted Mobile Touch Optimizer.')
      } else {
        console.log('Plugin was not installed in this profile.')
      }
      break
    }
    case 'verify': {
      const dest = targetProfileDir(profileArg)
      console.log(`Verifying Touch Optimizer for profile: ${dest}`)
      const check = await verifyTouchPlugin({ profileName: profileArg })
      if (check.ok) {
        console.log('✓ Mobile Touch Optimizer installation is healthy and active.')
      } else {
        console.error(`✗ Verification failed: ${check.message}`)
        process.exitCode = 1
      }
      break
    }
    case 'status':
    default: {
      const dest = targetProfileDir(profileArg)
      const installed = await isTouchPluginInstalled({ profileName: profileArg })
      console.log(`DSH Web Profile directory: ${dest}`)
      console.log(`Installed & Mounted: ${installed ? 'Yes' : 'No'}`)
      if (installed) {
        const check = await verifyTouchPlugin({ profileName: profileArg })
        console.log(`Status: ${check.ok ? 'Healthy' : `Issues detected (${check.message})`}`)
      }
      console.log('\nUsage:')
      console.log('  node bin/cli.js install [profile]    Mount touch optimizer to DSH profile (default: web)')
      console.log('  node bin/cli.js uninstall [profile]  Unmount touch optimizer from DSH profile')
      console.log('  node bin/cli.js verify [profile]     Verify installation integrity')
      console.log('  node bin/cli.js status [profile]     Check installation status')
      break
    }
  }
}

main().catch((err) => {
  console.error('Error:', err)
  process.exitCode = 1
})
